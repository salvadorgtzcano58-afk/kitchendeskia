import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ── Rate limiting: ventana fija de 60s, in-memory por proceso ────────────
// En serverless cada instancia mantiene su propio store. Protege contra
// burst attacks en la misma instancia sin necesidad de Redis.
const rateStore = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT   = 60
const RATE_WINDOW  = 60_000 // ms

// Limpieza cada 5 min para evitar memory leak en procesos de larga vida
setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of rateStore) {
    if (now > entry.resetAt) rateStore.delete(ip)
  }
}, 5 * 60_000)

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateStore.get(ip)
  if (!entry || now > entry.resetAt) {
    rateStore.set(ip, { count: 1, resetAt: now + RATE_WINDOW })
    return false
  }
  if (entry.count >= RATE_LIMIT) return true
  entry.count++
  return false
}

// ── Verificación de firma X-Hub-Signature-256 ────────────────────────────
// Meta firma cada POST con HMAC-SHA256(rawBody, APP_SECRET).
// Requiere WHATSAPP_APP_SECRET en variables de entorno
// (Meta App Dashboard → Settings → Basic → App Secret).
function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET
  if (!secret) {
    console.error('[whatsapp] WHATSAPP_APP_SECRET no configurado — rechazando request')
    return false
  }
  if (!signature) return false

  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('hex')

  // timingSafeEqual requiere misma longitud; si difieren, firma inválida
  if (Buffer.byteLength(signature) !== Buffer.byteLength(expected)) return false

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'utf8'),
      Buffer.from(expected,  'utf8')
    )
  } catch {
    return false
  }
}

// ── GET: verificación del webhook de Meta ────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode      = searchParams.get('hub.mode')
  const token     = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }
  return new NextResponse('Forbidden', { status: 403 })
}

// ── POST: recepción de mensajes ──────────────────────────────────────────
export async function POST(req: NextRequest) {
  // 1. Rate limit por IP
  const ip = getClientIp(req)
  if (isRateLimited(ip)) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: { 'Retry-After': '60' },
    })
  }

  // 2. Verificación de firma — leer rawBody UNA vez para no consumir el stream
  const rawBody   = await req.text()
  const signature = req.headers.get('x-hub-signature-256')
  if (!verifyWebhookSignature(rawBody, signature)) {
    console.warn(`[whatsapp] Firma inválida desde IP ${ip}`)
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // 3. Parsear body ya leído
  try {
    const body    = JSON.parse(rawBody)
    const entry   = body?.entry?.[0]
    const changes = entry?.changes?.[0]
    const message = changes?.value?.messages?.[0]

    if (!message || message.type !== 'text') {
      return NextResponse.json({ status: 'ok' })
    }

    const userMessage    = message.text.body.toLowerCase().trim()
    const from           = message.from
    const conversationId = message.context?.id || message.id

    // ── Guardar mensaje entrante en Supabase ──────────────────────
    await supabase.from('mensajes').insert({
      conversacion_id: conversationId,
      rol: 'cliente',
      contenido: message.text.body
    })

    // ── TRIGGER: confirmo pago recibido ──────────────────────────
    if (userMessage.includes('confirmo pago recibido')) {
      return await procesarPedidoConfirmado(from, conversationId)
    }

    // ── Respuesta normal de IA ────────────────────────────────────
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          { role: 'system', content: 'Eres el asistente de Paneki Neko, una dark kitchen de panes al vapor. Responde breve, amable y profesional en español.' },
          { role: 'user', content: message.text.body }
        ]
      })
    })
    const groqData = await groqRes.json()
    const reply = groqData.choices?.[0]?.message?.content || 'Hola, ¿en qué te puedo ayudar?'

    await enviarMensaje(from, reply)
    return NextResponse.json({ status: 'ok' })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ status: 'error' }, { status: 500 })
  }
}

// ── Procesa el pedido cuando se confirma pago ─────────────────
async function procesarPedidoConfirmado(from: string, conversationId: string) {
  try {
    // 1. Obtener historial de la conversación desde Supabase
    const { data: mensajes } = await supabase
      .from('mensajes')
      .select('contenido, rol')
      .eq('conversacion_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(30)

    const historial = mensajes?.map(m => `${m.rol}: ${m.contenido}`).join('\n') || ''

    // 2. Pedirle a Groq que extraiga productos y total
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content: 'Eres un extractor de pedidos. Analiza la conversación y responde ÚNICAMENTE con JSON válido, sin texto adicional. Formato: {"productos": [{"nombre": "string", "cantidad": number}], "total": number, "cliente": "string"}'
          },
          {
            role: 'user',
            content: `Extrae los productos pedidos, cantidades, total y nombre del cliente de esta conversación:\n\n${historial}`
          }
        ]
      })
    })

    const groqData = await groqRes.json()
    const rawText  = groqData.choices?.[0]?.message?.content || '{}'

    let pedidoData: { productos: {nombre: string, cantidad: number}[], total: number, cliente: string }
    try {
      pedidoData = JSON.parse(rawText.replace(/```json|```/g, '').trim())
    } catch {
      await enviarMensaje(from, '✅ Pago confirmado. Hubo un error al registrar el pedido automáticamente, registralo manualmente en el corte.')
      return NextResponse.json({ status: 'parse_error' })
    }

    // 3. Insertar pedido en Supabase
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .insert({
        canal: 'whatsapp',
        total: pedidoData.total || 0,
        metodo_pago: 'transferencia',
        notas: `Cliente: ${pedidoData.cliente || from} | WhatsApp: ${from}`
      })
      .select()
      .single()

    if (pedidoError || !pedido) {
      await enviarMensaje(from, '✅ Pago confirmado. Error al guardar pedido, regístralo manualmente.')
      return NextResponse.json({ status: 'db_error' })
    }

    // 4. Insertar items y descontar inventario via trigger
    if (pedidoData.productos?.length > 0) {
      const items = pedidoData.productos.map(p => ({
        pedido_id: pedido.id,
        producto_nombre: p.nombre,
        cantidad: p.cantidad || 1,
        precio_unitario: 0
      }))
      await supabase.from('pedido_items').insert(items)
    }

    // 5. Confirmar al operador
    const resumen = pedidoData.productos
      ?.map(p => `• ${p.nombre} x${p.cantidad}`)
      .join('\n') || 'Sin detalle'

    await enviarMensaje(from,
      `✅ *Pedido registrado automáticamente*\n\n${resumen}\n\nTotal: $${pedidoData.total}\nCliente: ${pedidoData.cliente || 'Sin nombre'}\n\nInventario actualizado 📦`
    )

    return NextResponse.json({ status: 'pedido_registrado' })

  } catch (error) {
    console.error('Error procesando pedido:', error)
    await enviarMensaje(from, '✅ Pago confirmado. Error interno, registra el pedido manualmente.')
    return NextResponse.json({ status: 'error' })
  }
}

// ── Enviar mensaje por WhatsApp API ───────────────────────────
async function enviarMensaje(to: string, text: string) {
  await fetch(`https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text }
    })
  })
}
