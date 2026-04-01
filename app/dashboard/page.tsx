'use client'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const CANAL_INFO: Record<string, { label: string; color: string; bg: string }> = {
  whatsapp:  { label:'WhatsApp',  color:'#25D366', bg:'rgba(37,211,102,0.12)' },
  uber_eats: { label:'Uber Eats', color:'#06C167', bg:'rgba(6,193,103,0.12)' },
  rappi:     { label:'Rappi',     color:'#ff441f', bg:'rgba(255,68,31,0.12)' },
  didi_food: { label:'DiDi Food', color:'#ff6b00', bg:'rgba(255,107,0,0.12)' },
}

const ULTIMOS_MENSAJES = [
  { nombre:'María Rodríguez', canal:'whatsapp', texto:'¿Tienen disponible el combo familiar?', hace:'2m', tipo:'pedido' },
  { nombre:'Carlos López',    canal:'whatsapp', texto:'Quiero 2 hamburguesas sin cebolla',      hace:'8m', tipo:'pedido' },
  { nombre:'Ana Núñez',       canal:'instagram',texto:'¿Hacen envíos a Juriquilla?',            hace:'15m', tipo:'duda' },
]

type ProductoCritico = { id: string; nombre: string; stock_actual: number; unidad: string | null }

const ULTIMOS_PEDIDOS = [
  { canal:'whatsapp',  items:'Combo 2 pa 2',       total:375, hora:'10:32', estado:'entregado' },
  { canal:'uber_eats', items:'Paneki Familiar x2',  total:590, hora:'11:15', estado:'entregado' },
  { canal:'rappi',     items:'Hai Miko Lita + bebida', total:305, hora:'12:08', estado:'en preparación' },
  { canal:'didi_food', items:'Sweet Ramen x2',      total:460, hora:'13:20', estado:'listo' },
]

const ACCESOS = [
  { label:'Mensajes',      href:'/mensajes',      icon:'💬', color:'#25D366', desc:'7 sin leer' },
  { label:'Inventario',    href:'/inventario',    icon:'📦', color:'#ff5c4d', desc:'6 críticos' },
  { label:'Requisiciones', href:'/requisiciones', icon:'🛒', color:'#ff9a3c', desc:'Miércoles' },
  { label:'Corte de turno',href:'/corte',         icon:'🧾', color:'#5cb8ff', desc:'Turno activo' },
  { label:'Reportes',      href:'/reportes',      icon:'📈', color:'#c8f135', desc:'Esta semana' },
  { label:'Proveedores',   href:'/proveedores',   icon:'🤝', color:'#7F77DD', desc:'2 contactos' },
]

export default function DashboardPage() {
  const [turnoActivo] = useState(true)
  const [stockCritico, setStockCritico] = useState<ProductoCritico[]>([])
  const horaActual = new Date().toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit' })
  const fechaActual = new Date().toLocaleDateString('es-MX', { weekday:'long', day:'numeric', month:'long' })

  useEffect(() => {
    supabase
      .from('productos')
      .select('id, nombre, stock_actual, unidad')
      .lte('stock_actual', 5)
      .order('stock_actual', { ascending: true })
      .then(({ data, error }) => {
        console.log('[dashboard] stock crítico data:', JSON.stringify(data), 'error:', JSON.stringify(error))
        if (data) setStockCritico(data)
      })
  }, [])

  const ventaHoy = 1730
  const pedidosHoy = 6
  const margenHoy = 1410
  const ticketProm = 288

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      <Sidebar />
      <main style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Topbar */}
        <div style={{ padding:'14px 24px', borderBottom:'1px solid var(--border)', background:'var(--surface)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontWeight:700, fontSize:16 }}>Dashboard</div>
            <div style={{ fontSize:11, color:'var(--text3)', marginTop:1, textTransform:'capitalize' }}>{fechaActual} · {horaActual}</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 14px', background: turnoActivo ? 'rgba(77,255,176,0.1)' : 'rgba(255,92,77,0.1)', border:`1px solid ${turnoActivo ? 'rgba(77,255,176,0.25)' : 'rgba(255,92,77,0.25)'}`, borderRadius:20, fontSize:11, color: turnoActivo ? '#4dffb0' : '#ff5c4d' }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background: turnoActivo ? '#4dffb0' : '#ff5c4d' }} />
              {turnoActivo ? 'Turno activo · 10:00 AM' : 'Turno cerrado'}
            </div>
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'16px 24px', display:'flex', flexDirection:'column', gap:16 }}>

          {/* Stats del día */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
            {[
              { val:`$${ventaHoy.toLocaleString()}`, label:'Venta del día',  color:'var(--accent)',  delta:'↑ +12% vs ayer' },
              { val:`$${margenHoy.toLocaleString()}`, label:'Margen neto',   color:'#4dffb0',        delta:`${Math.round(margenHoy/ventaHoy*100)}% de margen` },
              { val:`${pedidosHoy}`,                  label:'Pedidos hoy',   color:'#5cb8ff',        delta:'↑ +2 vs ayer' },
              { val:`$${ticketProm}`,                 label:'Ticket prom.',  color:'#ff9a3c',        delta:'WhatsApp lidera' },
            ].map((s,i) => (
              <div key={i} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'14px 16px' }}>
                <div style={{ fontSize:24, fontWeight:700, color:s.color, lineHeight:1, marginBottom:4 }}>{s.val}</div>
                <div style={{ fontSize:11, color:'var(--text2)', marginBottom:4 }}>{s.label}</div>
                <div style={{ fontSize:10, color:'var(--text3)' }}>{s.delta}</div>
              </div>
            ))}
          </div>

          {/* Grid principal */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>

            {/* Accesos rápidos */}
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:16 }}>
              <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1, marginBottom:12 }}>Accesos rápidos</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {ACCESOS.map(a => (
                  <Link key={a.href} href={a.href} style={{ textDecoration:'none' }}>
                    <div style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 12px', cursor:'pointer', transition:'border-color 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = a.color + '66')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                      <div style={{ fontSize:18, marginBottom:4 }}>{a.icon}</div>
                      <div style={{ fontSize:12, fontWeight:500, color:'var(--text)' }}>{a.label}</div>
                      <div style={{ fontSize:10, color: a.color, marginTop:2 }}>{a.desc}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Últimos mensajes */}
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1 }}>Últimos mensajes</div>
                <Link href="/mensajes" style={{ fontSize:10, color:'var(--accent)', textDecoration:'none' }}>Ver todos →</Link>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {ULTIMOS_MENSAJES.map((m, i) => (
                  <div key={i} style={{ display:'flex', gap:10, padding:'8px 10px', background:'var(--surface2)', borderRadius:8 }}>
                    <div style={{ width:32, height:32, minWidth:32, borderRadius:'50%', background: m.canal === 'whatsapp' ? 'rgba(37,211,102,0.15)' : 'rgba(228,64,95,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color: m.canal === 'whatsapp' ? '#25D366' : '#E4405F' }}>
                      {m.nombre.split(' ').map(n=>n[0]).join('').slice(0,2)}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', justifyContent:'space-between' }}>
                        <span style={{ fontSize:12, fontWeight:500, color:'var(--text)' }}>{m.nombre}</span>
                        <span style={{ fontSize:10, color:'var(--text3)' }}>{m.hace}</span>
                      </div>
                      <div style={{ fontSize:11, color:'var(--text3)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.texto}</div>
                      <span style={{ fontSize:9, padding:'1px 5px', borderRadius:4, background: m.tipo === 'pedido' ? 'rgba(200,241,53,0.12)' : 'rgba(255,154,60,0.12)', color: m.tipo === 'pedido' ? 'var(--accent)' : '#ff9a3c' }}>
                        {m.tipo === 'pedido' ? '🛒 Pedido' : '❓ Duda'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alertas de inventario */}
            <div style={{ background:'var(--surface)', border:'1px solid rgba(255,92,77,0.2)', borderRadius:10, padding:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1 }}>
                  ⚠ Stock crítico {stockCritico.length > 0 && <span style={{ color:'#ff5c4d' }}>({stockCritico.length})</span>}
                </div>
                <Link href="/inventario" style={{ fontSize:10, color:'var(--accent)', textDecoration:'none' }}>Ver todo →</Link>
              </div>
              {stockCritico.length === 0 ? (
                <div style={{ fontSize:12, color:'var(--text3)', textAlign:'center', padding:'16px 0' }}>Sin productos críticos</div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {stockCritico.map(item => {
                    const color = item.stock_actual <= 2 ? '#ff5c4d' : '#ff9a3c'
                    return (
                      <div key={item.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 8px', background:'var(--surface2)', borderRadius:6 }}>
                        <span style={{ fontSize:12, color:'var(--text)' }}>{item.nombre}</span>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ fontSize:10, color:'var(--text3)' }}>{item.stock_actual} {item.unidad || 'pzas'}</span>
                          <span style={{ fontSize:10, fontWeight:600, color }}>{item.stock_actual}d est.</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Últimos pedidos */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1 }}>Pedidos del turno</div>
              <Link href="/corte" style={{ fontSize:10, color:'var(--accent)', textDecoration:'none' }}>Ver corte completo →</Link>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
              {ULTIMOS_PEDIDOS.map((p, i) => {
                const info = CANAL_INFO[p.canal]
                const estadoColor = p.estado === 'entregado' ? '#4dffb0' : p.estado === 'listo' ? 'var(--accent)' : '#ff9a3c'
                return (
                  <div key={i} style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 12px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                      <span style={{ fontSize:9, padding:'2px 6px', borderRadius:4, background:info.bg, color:info.color, fontWeight:500 }}>{info.label}</span>
                      <span style={{ fontSize:10, color:'var(--text3)', fontFamily:'monospace' }}>{p.hora}</span>
                    </div>
                    <div style={{ fontSize:12, color:'var(--text)', marginBottom:6, fontWeight:500 }}>{p.items}</div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{ fontSize:14, fontWeight:700, color:'var(--accent)' }}>${p.total}</span>
                      <span style={{ fontSize:9, color:estadoColor, fontWeight:500 }}>● {p.estado}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}