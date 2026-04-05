'use client'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Canal = 'whatsapp' | 'uber_eats' | 'rappi' | 'didi_food' | 'tianguis'
type MetodoPago = 'tarjeta' | 'efectivo' | 'transferencia' | 'terminal'

const CANAL_INFO: Record<Canal, { label: string; color: string; bg: string }> = {
  whatsapp:  { label:'WhatsApp',  color:'#25D366', bg:'rgba(37,211,102,0.12)' },
  uber_eats: { label:'Uber Eats', color:'#06C167', bg:'rgba(6,193,103,0.12)' },
  rappi:     { label:'Rappi',     color:'#ff441f', bg:'rgba(255,68,31,0.12)' },
  didi_food: { label:'DiDi Food', color:'#ff6b00', bg:'rgba(255,107,0,0.12)' },
  tianguis:  { label:'Tianguis',  color:'#c8f135', bg:'rgba(200,241,53,0.12)' },
}

const PAGO_INFO: Record<string, { label: string; color: string }> = {
  tarjeta:      { label:'Tarjeta',       color:'#5cb8ff' },
  efectivo:     { label:'Efectivo',      color:'#4dffb0' },
  transferencia:{ label:'Transferencia', color:'#c8f135' },
  terminal:     { label:'Terminal',      color:'#ff9a3c' },
}

type Pedido = {
  id: string
  created_at: string
  total: number
  canal: string
  metodo_pago: string
}

function getLunes(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  return d
}

function getRango(idx: number): { inicio: Date; fin: Date; etiqueta: string; etiquetaCorta: string } {
  const hoy = new Date()
  const lunesEsta = getLunes(hoy)
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

  if (idx === 0) {
    const fin = new Date(hoy)
    fin.setHours(23, 59, 59, 999)
    const etiqueta = `${lunesEsta.getDate()} ${meses[lunesEsta.getMonth()]} – hoy`
    return { inicio: lunesEsta, fin, etiqueta, etiquetaCorta: 'Esta semana' }
  } else {
    const inicio = new Date(lunesEsta)
    inicio.setDate(lunesEsta.getDate() - 7)
    const fin = new Date(lunesEsta)
    fin.setDate(lunesEsta.getDate() - 1)
    fin.setHours(23, 59, 59, 999)
    const etiqueta = `${inicio.getDate()}–${fin.getDate()} ${meses[fin.getMonth()]}`
    return { inicio, fin, etiqueta, etiquetaCorta: 'Semana pasada' }
  }
}

function diaLabel(d: Date): string {
  const nombres = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
  return `${nombres[d.getDay()]} ${d.getDate()}`
}

function mismaFecha(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth() === b.getMonth() &&
         a.getDate() === b.getDate()
}

export default function ReportesPage() {
  const [semanaIdx, setSemanaIdx] = useState(0)
  const [vista, setVista] = useState<'resumen'|'canales'|'pagos'>('resumen')
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [cargando, setCargando] = useState(true)

  const rango = getRango(semanaIdx)

  useEffect(() => {
    setCargando(true)
    setPedidos([])
    supabase
      .from('pedidos')
      .select('id, created_at, total, canal, metodo_pago')
      .gte('created_at', rango.inicio.toISOString())
      .lte('created_at', rango.fin.toISOString())
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setPedidos(data)
        setCargando(false)
      })
  }, [semanaIdx]) // eslint-disable-line react-hooks/exhaustive-deps

  // Generar array de días del rango (lun → dom o lun → hoy)
  const dias: Date[] = []
  const cursor = new Date(rango.inicio)
  while (cursor <= rango.fin && dias.length < 7) {
    dias.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  // Agrupaciones
  const porDia = dias.map(dia => {
    const del_dia = pedidos.filter(p => mismaFecha(new Date(p.created_at), dia))
    const ventas = del_dia.reduce((a, p) => a + p.total, 0)
    const npedidos = del_dia.length
    return { dia, ventas, pedidos: npedidos, ticket: npedidos > 0 ? Math.round(ventas / npedidos) : 0 }
  })

  const porCanal = (Object.keys(CANAL_INFO) as Canal[]).map(canal => {
    const del_canal = pedidos.filter(p => p.canal === canal)
    const total = del_canal.reduce((a, p) => a + p.total, 0)
    return { canal, total, pedidos: del_canal.length }
  }).filter(c => c.total > 0).sort((a, b) => b.total - a.total)

  const porPago = Object.keys(PAGO_INFO).map(m => {
    const del_metodo = pedidos.filter(p => p.metodo_pago === m)
    const total = del_metodo.reduce((a, p) => a + p.total, 0)
    return { metodo: m, total, pedidos: del_metodo.length }
  }).filter(m => m.total > 0).sort((a, b) => b.total - a.total)

  // Totales globales
  const ventaTotal = pedidos.reduce((a, p) => a + p.total, 0)
  const totalPedidos = pedidos.length
  const ticketPromedio = totalPedidos > 0 ? Math.round(ventaTotal / totalPedidos) : 0
  const canalTop = porCanal[0]

  const maxVentaDia = Math.max(...porDia.map(d => d.ventas), 1)

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      <Sidebar />
      <main style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Topbar */}
        <div style={{ padding:'14px 24px', borderBottom:'1px solid var(--border)', background:'var(--surface)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontWeight:700, fontSize:16 }}>Reportes</div>
            <div style={{ fontSize:11, color:'var(--text3)', marginTop:1 }}>
              {rango.etiqueta} · Paneki Neko
            </div>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            {[0, 1].map(i => {
              const r = getRango(i)
              return (
                <button key={i} onClick={() => setSemanaIdx(i)}
                  style={{ padding:'6px 12px', borderRadius:8, fontSize:11, cursor:'pointer', fontWeight:500,
                    background: semanaIdx === i ? 'var(--accent-dim)' : 'var(--surface2)',
                    color: semanaIdx === i ? 'var(--accent)' : 'var(--text3)',
                    border: semanaIdx === i ? '1px solid rgba(200,241,53,0.3)' : '1px solid var(--border)' }}>
                  {r.etiquetaCorta}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'1px solid var(--border)', background:'var(--surface)', padding:'0 24px' }}>
          {[
            { key:'resumen', label:'📊 Resumen' },
            { key:'canales', label:'📡 Por canal' },
            { key:'pagos',   label:'💳 Métodos de pago' },
          ].map(t => (
            <div key={t.key} onClick={() => setVista(t.key as 'resumen'|'canales'|'pagos')}
              style={{ padding:'10px 16px', fontSize:12, cursor:'pointer',
                color: vista === t.key ? 'var(--accent)' : 'var(--text3)',
                borderBottom: vista === t.key ? '2px solid var(--accent)' : '2px solid transparent',
                fontWeight: vista === t.key ? 500 : 400 }}>
              {t.label}
            </div>
          ))}
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'16px 24px', display:'flex', flexDirection:'column', gap:16 }}>

          {/* Stats globales */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
            {[
              { val: cargando ? '…' : `$${ventaTotal.toLocaleString()}`, label:'Venta total',   color:'var(--accent)' },
              { val: cargando ? '…' : `${totalPedidos}`,                 label:'Pedidos',        color:'#5cb8ff' },
              { val: cargando ? '…' : `$${ticketPromedio}`,              label:'Ticket prom.',   color:'#ff9a3c' },
              { val: cargando ? '…' : canalTop ? CANAL_INFO[canalTop.canal]?.label ?? canalTop.canal : '—',
                label:'Canal top', color: canalTop ? CANAL_INFO[canalTop.canal]?.color ?? 'var(--text)' : 'var(--text3)' },
            ].map((s, i) => (
              <div key={i} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 14px' }}>
                <div style={{ fontSize:20, fontWeight:700, color:s.color, lineHeight:1 }}>{s.val}</div>
                <div style={{ fontSize:10, color:'var(--text3)', marginTop:4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Estado de carga */}
          {cargando && (
            <div style={{ textAlign:'center', padding:'48px 0', color:'var(--text3)', fontSize:13 }}>
              Cargando datos…
            </div>
          )}

          {/* Sin datos */}
          {!cargando && pedidos.length === 0 && (
            <div style={{ textAlign:'center', padding:'48px 0', color:'var(--text3)', fontSize:13 }}>
              <div style={{ fontSize:32, marginBottom:12 }}>📭</div>
              Sin pedidos registrados en este período
            </div>
          )}

          {/* RESUMEN */}
          {!cargando && pedidos.length > 0 && vista === 'resumen' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              {/* Gráfica de barras */}
              <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:16 }}>
                <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1, marginBottom:16 }}>Ventas por día</div>
                <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:160 }}>
                  {porDia.map((d, i) => {
                    const pct = maxVentaDia > 0 ? (d.ventas / maxVentaDia) * 100 : 0
                    return (
                      <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                        <div style={{ fontSize:9, color:'var(--accent)', fontWeight:600 }}>
                          {d.ventas > 0 ? `$${(d.ventas/1000).toFixed(1)}k` : '–'}
                        </div>
                        <div style={{ width:'100%', height:`${Math.max(4, pct * 1.4)}px`,
                          background: d.ventas > 0 ? 'var(--accent)' : 'var(--surface3)',
                          borderRadius:'4px 4px 0 0', transition:'height 0.3s', opacity: d.ventas > 0 ? 1 : 0.3 }} />
                        <div style={{ fontSize:9, color:'var(--text3)' }}>{diaLabel(d.dia).split(' ')[0]}</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Tabla diaria */}
              <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:16 }}>
                <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1, marginBottom:12 }}>Detalle diario</div>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr>
                      {['Día','Ventas','Pedidos','Ticket prom.'].map(h => (
                        <th key={h} style={{ fontSize:9, color:'var(--text3)', textAlign:'left', padding:'4px 6px', textTransform:'uppercase', letterSpacing:0.8 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {porDia.map((d, i) => (
                      <tr key={i} style={{ borderTop:'1px solid var(--border)', opacity: d.ventas === 0 ? 0.4 : 1 }}>
                        <td style={{ padding:'6px', fontSize:11, color:'var(--text2)' }}>{diaLabel(d.dia)}</td>
                        <td style={{ padding:'6px', fontSize:11, color:'var(--accent)', fontWeight:600 }}>
                          {d.ventas > 0 ? `$${d.ventas.toLocaleString()}` : '–'}
                        </td>
                        <td style={{ padding:'6px', fontSize:11, color:'var(--text)' }}>{d.pedidos > 0 ? d.pedidos : '–'}</td>
                        <td style={{ padding:'6px', fontSize:11, color:'#ff9a3c', fontWeight:600 }}>
                          {d.ticket > 0 ? `$${d.ticket}` : '–'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CANALES */}
          {!cargando && pedidos.length > 0 && vista === 'canales' && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
              {porCanal.map(c => {
                const info = CANAL_INFO[c.canal as Canal] ?? { label: c.canal, color:'var(--text)', bg:'var(--surface2)' }
                const pct = ventaTotal > 0 ? Math.round((c.total / ventaTotal) * 100) : 0
                const ticket = c.pedidos > 0 ? Math.round(c.total / c.pedidos) : 0
                return (
                  <div key={c.canal} style={{ background:'var(--surface)', border:`1px solid ${info.color}33`, borderRadius:10, padding:16 }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                      <span style={{ fontSize:12, padding:'3px 10px', borderRadius:6, background:info.bg, color:info.color, fontWeight:600 }}>{info.label}</span>
                      <span style={{ fontSize:22, fontWeight:700, color:info.color }}>{pct}%</span>
                    </div>
                    <div style={{ fontSize:26, fontWeight:700, color:'var(--text)', marginBottom:8 }}>${c.total.toLocaleString()}</div>
                    <div style={{ display:'flex', gap:16, marginBottom:12 }}>
                      <div>
                        <div style={{ fontSize:10, color:'var(--text3)' }}>Pedidos</div>
                        <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>{c.pedidos}</div>
                      </div>
                      <div>
                        <div style={{ fontSize:10, color:'var(--text3)' }}>Ticket prom.</div>
                        <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>${ticket}</div>
                      </div>
                    </div>
                    <div style={{ height:4, background:'var(--surface3)', borderRadius:2 }}>
                      <div style={{ width:`${pct}%`, height:'100%', background:info.color, borderRadius:2 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* PAGOS */}
          {!cargando && pedidos.length > 0 && vista === 'pagos' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:16 }}>
                <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1, marginBottom:12 }}>Por método de pago</div>
                {porPago.map(m => {
                  const info = PAGO_INFO[m.metodo] ?? { label: m.metodo, color:'var(--text)' }
                  const pct = ventaTotal > 0 ? Math.round((m.total / ventaTotal) * 100) : 0
                  return (
                    <div key={m.metodo} style={{ marginBottom:14 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ fontSize:11, padding:'2px 8px', borderRadius:4, background:`${info.color}20`, color:info.color, fontWeight:500 }}>{info.label}</span>
                          <span style={{ fontSize:10, color:'var(--text3)' }}>{m.pedidos} pedido{m.pedidos !== 1 ? 's' : ''}</span>
                        </div>
                        <span style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>${m.total.toLocaleString()} · {pct}%</span>
                      </div>
                      <div style={{ height:4, background:'var(--surface3)', borderRadius:2 }}>
                        <div style={{ width:`${pct}%`, height:'100%', background:info.color, borderRadius:2 }} />
                      </div>
                    </div>
                  )
                })}
              </div>

              <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:16 }}>
                <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1, marginBottom:12 }}>Desglose por canal y método</div>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr>
                      {['Canal','Método','Monto'].map(h => (
                        <th key={h} style={{ fontSize:9, color:'var(--text3)', textAlign: h === 'Monto' ? 'right' : 'left', padding:'4px 6px', textTransform:'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pedidos.slice().reverse().slice(0, 20).map((p, i) => {
                      const cInfo = CANAL_INFO[p.canal as Canal] ?? { label: p.canal, color:'var(--text)', bg:'var(--surface2)' }
                      const mInfo = PAGO_INFO[p.metodo_pago] ?? { label: p.metodo_pago, color:'var(--text)' }
                      return (
                        <tr key={i} style={{ borderTop:'1px solid var(--border)' }}>
                          <td style={{ padding:'6px' }}>
                            <span style={{ fontSize:10, padding:'2px 6px', borderRadius:4, background:cInfo.bg, color:cInfo.color }}>{cInfo.label}</span>
                          </td>
                          <td style={{ padding:'6px' }}>
                            <span style={{ fontSize:10, padding:'2px 6px', borderRadius:4, background:`${mInfo.color}15`, color:mInfo.color }}>{mInfo.label}</span>
                          </td>
                          <td style={{ padding:'6px', fontSize:11, color:'var(--accent)', fontWeight:600, textAlign:'right' }}>${p.total.toLocaleString()}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {pedidos.length > 20 && (
                  <div style={{ fontSize:10, color:'var(--text3)', textAlign:'center', marginTop:8 }}>
                    Mostrando 20 de {pedidos.length} pedidos
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
