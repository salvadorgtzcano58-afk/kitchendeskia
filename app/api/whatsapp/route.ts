import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }
  return new NextResponse('Forbidden', { status: 403 })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const entry = body?.entry?.[0]
  const changes = entry?.changes?.[0]
  const message = changes?.value?.messages?.[0]
  if (!message || message.type !== 'text') {
    return NextResponse.json({ status: 'ok' })
  }
  const userMessage = message.text.body
  const from = message.from

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama3-8b-8192',
      messages: [
        { role: 'system', content: 'Eres el asistente de KitchenDeskia, una dark kitchen. Responde de forma breve, amable y profesional en español.' },
        { role: 'user', content: userMessage }
      ]
    })
  })

  const data = await response.json()
  const reply = data.choices?.[0]?.message?.content || 'Hola, ¿en qué te puedo ayudar?'

  await fetch(`https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: from,
      type: 'text',
      text: { body: reply }
    })
  })

  return NextResponse.json({ status: 'ok' })
}