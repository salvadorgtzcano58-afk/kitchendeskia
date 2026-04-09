'use client'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type ItemReq = {
  id: string
  nombre: string
  unidad: string | null
  stock_actual: number
  requerido_diario: number | null
  cantidad_pedir: number
  incluir: boolean
}


const hoy = new Date().toLocaleDateString('es-MX', { weekday:'long', year:'numeric', month:'long', day:'numeric' })

function generarMensajePanes(panes: ItemReq[]) {
  const seleccionados = panes.filter(p => p.incluir)
  const lista = seleccionados.map(p => `• ${p.nombre}: ${p.cantidad_pedir} pzas`).join('\n')
  const total = seleccionados.reduce((a, p) => a + p.cantidad_pedir, 0)
  return `🥐 *PEDIDO PANEKI NEKO*\n📅 ${hoy}\n\nHola Shaaron! Te paso el pedido de esta semana:\n\n${lista}\n\n*Total: ${total} piezas*\n\nQuedamos pendientes, muchas gracias! 🙏`
}

function generarMensajeInsumos(insumos: ItemReq[]) {
  const seleccionados = insumos.filter(i => i.incluir)
  const lista = seleccionados.map(i => `• ${i.nombre}: ${i.cantidad_pedir}${i.unidad ? ` ${i.unidad}` : ''}`).join('\n')
  return `🛒 *PEDIDO INSUMOS PANEKI NEKO*\n📅 ${hoy}\n\nHola Cristy! Te paso lo que necesitamos:\n\n${lista}\n\n¿Puedes surtir para el miércoles? Muchas gracias! 🙏`
}

export default function RequisicionesPage() {
  const [insumos, setInsumos] = useState<ItemReq[]>([])
  const [panes, setPanes] = useState<ItemReq[]>([])
  const [cargando, setCargando] = useState(true)
  const [tab, setTab] = useState<'panes'|'insumos'>('panes')
  const [enviado, setEnviado] = useState<'panes'|'insumos'|null>(null)

  useEffect(() => {
    const fetchInsumos = supabase
      .from('productos')
      .select('id, nombre, unidad, stock_actual, requerido_diario')
      .in('categoria', ['Insumos', 'Empaque'])
      .order('nombre')

    const fetchPanes = supabase
      .from('productos')
      .select('id, nombre, unidad, stock_actual, requerido_diario')
      .eq('categoria', 'Panes')
      .order('nombre')

    Promise.all([fetchInsumos, fetchPanes]).then(([resInsumos, resPanes]) => {
      if (resInsumos.error) console.error('Error cargando insumos:', resInsumos.error)
      if (resPanes.error)   console.error('Error cargando panes:', resPanes.error)
      if (resInsumos.data) {
        setInsumos(resInsumos.data.map(p => ({
          ...p,
          cantidad_pedir: p.requerido_diario ? p.requerido_diario * 7 : 1,
          incluir: true,
        })))
      }
      if (resPanes.data) {
        setPanes(resPanes.data.map(p => ({
          ...p,
          cantidad_pedir: 12,
          incluir: true,
        })))
      }
      setCargando(false)
    })
  }, [])

  const toggleInsumo = (id: string) => setInsumos(prev => prev.map(i => i.id === id ? {...i, incluir: !i.incluir} : i))
  const togglePan = (id: string) => setPanes(prev => prev.map(p => p.id === id ? {...p, incluir: !p.incluir} : p))
  const updateCantidadInsumo = (id: string, val: number) => setInsumos(prev => prev.map(i => i.id === id ? {...i, cantidad_pedir: val} : i))
  const updateCantidadPan = (id: string, val: number) => setPanes(prev => prev.map(p => p.id === id ? {...p, cantidad_pedir: val} : p))

  const enviarWhatsApp = async (tipo: 'panes'|'insumos') => {
    const numero    = tipo === 'panes' ? '525560044346' : '524621153409'
    const proveedor = tipo === 'panes' ? 'Shaaron' : 'Cristy'
    const mensaje   = tipo === 'panes' ? generarMensajePanes(panes) : generarMensajeInsumos(insumos)

    const { error } = await supabase
      .from('requisiciones_log')
      .insert({ tipo, proveedor, mensaje })
    if (error) console.error('Error guardando historial:', error)

    const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`
    window.location.href = url
    setEnviado(tipo)
  }

  const panesSeleccionados = panes.filter(p => p.incluir)
  const totalPanes = panesSeleccionados.reduce((a, p) => a + p.cantidad_pedir, 0)
  const insumosSeleccionados = insumos.filter(i => i.incluir)

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      <Sidebar />
      <main style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Topbar */}
        <div style={{ padding:'14px 24px', borderBottom:'1px solid var(--border)', background:'var(--surface)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontWeight:700, fontSize:16 }}>Requisiciones</div>
            <div style={{ fontSize:11, color:'var(--text3)', marginTop:1 }}>Surtido semanal · miércoles · revisa y envía por WhatsApp</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'1px solid var(--border)', background:'var(--surface)', padding:'0 24px' }}>
          {[
            { key:'panes',   label:`🥐 Panes al vapor — Shaaron (Momo)` },
            { key:'insumos', label:`🛒 Insumos — Cristy` },
          ].map(t => (
            <div key={t.key} onClick={() => setTab(t.key as 'panes'|'insumos')}
              style={{ padding:'10px 16px', fontSize:12, cursor:'pointer', color: tab === t.key ? 'var(--accent)' : 'var(--text3)', borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent', fontWeight: tab === t.key ? 500 : 400 }}>
              {t.label}
            </div>
          ))}
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'16px 24px', display:'grid', gridTemplateColumns:'1fr 320px', gap:16, alignContent:'start' }}>

          {/* Lista items */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
            <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1 }}>
                {cargando
                  ? 'Cargando…'
                  : tab === 'panes'
                    ? `${panesSeleccionados.length} sabores · ${totalPanes} piezas total`
                    : `${insumosSeleccionados.length} insumos seleccionados`}
              </span>
              <button onClick={() => tab === 'panes' ? setPanes(p => p.map(x => ({...x, incluir:true}))) : setInsumos(i => i.map(x => ({...x, incluir:true})))}
                style={{ fontSize:11, color:'var(--accent)', background:'none', border:'none', cursor:'pointer' }}>
                Seleccionar todo
              </button>
            </div>

            {tab === 'panes' && cargando && (
              <div style={{ padding:'32px', textAlign:'center', color:'var(--text3)', fontSize:13 }}>
                Cargando panes…
              </div>
            )}

            {tab === 'panes' && !cargando && panes.length === 0 && (
              <div style={{ padding:'32px', textAlign:'center', color:'var(--text3)', fontSize:13 }}>
                Sin panes registrados
              </div>
            )}

            {tab === 'panes' && !cargando && panes.map(p => (
              <div key={p.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', borderBottom:'1px solid var(--border)', background: p.incluir ? 'transparent' : 'rgba(255,255,255,0.02)', opacity: p.incluir ? 1 : 0.5 }}>
                <input type="checkbox" checked={p.incluir} onChange={() => togglePan(p.id)} style={{ accentColor:'var(--accent)', width:16, height:16, cursor:'pointer' }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:500, color:'var(--text)' }}>{p.nombre}</div>
                  <div style={{ fontSize:10, color:'var(--text3)' }}>Stock actual: {p.stock_actual} pzas</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <button onClick={() => updateCantidadPan(p.id, Math.max(1, p.cantidad_pedir - 1))} style={{ width:24, height:24, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, cursor:'pointer', color:'var(--text2)', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                  <span style={{ fontSize:14, fontWeight:600, color:'var(--accent)', minWidth:32, textAlign:'center' }}>{p.cantidad_pedir}</span>
                  <button onClick={() => updateCantidadPan(p.id, p.cantidad_pedir + 1)} style={{ width:24, height:24, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, cursor:'pointer', color:'var(--text2)', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
                  <span style={{ fontSize:11, color:'var(--text3)', minWidth:24 }}>pzas</span>
                </div>
              </div>
            ))}

            {tab === 'insumos' && cargando && (
              <div style={{ padding:'32px', textAlign:'center', color:'var(--text3)', fontSize:13 }}>
                Cargando insumos…
              </div>
            )}

            {tab === 'insumos' && !cargando && insumos.length === 0 && (
              <div style={{ padding:'32px', textAlign:'center', color:'var(--text3)', fontSize:13 }}>
                Sin insumos registrados
              </div>
            )}

            {tab === 'insumos' && !cargando && insumos.map(i => (
              <div key={i.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', borderBottom:'1px solid var(--border)', background: i.incluir ? 'transparent' : 'rgba(255,255,255,0.02)', opacity: i.incluir ? 1 : 0.5 }}>
                <input type="checkbox" checked={i.incluir} onChange={() => toggleInsumo(i.id)} style={{ accentColor:'var(--accent)', width:16, height:16, cursor:'pointer' }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:500, color:'var(--text)' }}>{i.nombre}</div>
                  <div style={{ fontSize:10, color:'var(--text3)' }}>
                    Stock: {i.stock_actual}{i.unidad ? ` ${i.unidad}` : ''}
                    {i.requerido_diario != null ? ` · Req. diario: ${i.requerido_diario}${i.unidad ? ` ${i.unidad}` : ''}` : ''}
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <button onClick={() => updateCantidadInsumo(i.id, Math.max(1, i.cantidad_pedir - 1))} style={{ width:24, height:24, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, cursor:'pointer', color:'var(--text2)', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                  <span style={{ fontSize:14, fontWeight:600, color:'var(--accent)', minWidth:40, textAlign:'center' }}>{i.cantidad_pedir}</span>
                  <button onClick={() => updateCantidadInsumo(i.id, i.cantidad_pedir + 1)} style={{ width:24, height:24, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, cursor:'pointer', color:'var(--text2)', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
                  <span style={{ fontSize:11, color:'var(--text3)', minWidth:24 }}>{i.unidad ?? ''}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Preview mensaje */}
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:16 }}>
              <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1, marginBottom:12 }}>
                Vista previa del mensaje
              </div>
              <div style={{ background:'#0b1a0f', border:'1px solid rgba(37,211,102,0.2)', borderRadius:8, padding:12, fontSize:11, color:'#e8ead4', lineHeight:1.7, whiteSpace:'pre-wrap', fontFamily:'monospace', maxHeight:320, overflowY:'auto' }}>
                {tab === 'panes' ? generarMensajePanes(panes) : generarMensajeInsumos(insumos)}
              </div>
            </div>

            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:16 }}>
              <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1, marginBottom:12 }}>
                {tab === 'panes' ? 'Enviar a Shaaron (Momo)' : 'Enviar a Cristy'}
              </div>
              <div style={{ fontSize:11, color:'var(--text2)', marginBottom:12 }}>
                {tab === 'panes' ? '+52 55 6004 4346' : '+52 462 115 3409'}
              </div>
              <button onClick={() => enviarWhatsApp(tab)}
                style={{ width:'100%', padding:'12px', background:'#25D366', border:'none', borderRadius:8, cursor:'pointer', color:'#fff', fontSize:13, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <span>📲</span> Enviar por WhatsApp
              </button>
              {enviado === tab && (
                <div style={{ marginTop:10, fontSize:11, color:'#25D366', textAlign:'center' }}>
                  ✓ Abriendo WhatsApp…
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
