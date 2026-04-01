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

type ProductoCritico = { id: string; nombre: string; stock_actual: number; unidad: string | null }
type Conversacion = {
  id: string
  cliente_nombre: string
  canal: string
  clasificacion: string
  estado: string
  updated_at: string
}

export default function DashboardPage() {
  const [stockCritico, setStockCritico] = useState<ProductoCritico[]>([])
  const [ventaHoy, setVentaHoy] = useState(0)
  const [pedidosHoy, setPedidosHoy] = useState(0)
  const [ticketProm, setTicketProm] = useState(0)
  const [turnoHoraInicio, setTurnoHoraInicio] = useState<string | null>(null)
  const [conversacionesAbiertas, setConversacionesAbiertas] = useState(0)
  const [ultimasConversaciones, setUltimasConversaciones] = useState<Conversacion[]>([])

  const horaActual = new Date().toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit' })
  const fechaActual = new Date().toLocaleDateString('es-MX', { weekday:'long', day:'numeric', month:'long' })
  const margenHoy = Math.round(ventaHoy * 0.35) // estimado 35% margen

  // Leer turno desde localStorage
  useEffect(() => {
    const guardado = localStorage.getItem('turno_activo')
    if (guardado) {
      const { horaInicio } = JSON.parse(guardado)
      setTurnoHoraInicio(horaInicio)
    }
  }, [])

  // Stats del día: pedidos últimas 24h
  useEffect(() => {
    supabase
      .from('pedidos')
      .select('total')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .then(({ data }) => {
        if (!data) return
        const total = data.reduce((a, p) => a + (p.total || 0), 0)
        setPedidosHoy(data.length)
        setVentaHoy(total)
        setTicketProm(data.length > 0 ? Math.round(total / data.length) : 0)
      })
  }, [])

  // Stock crítico
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

  // Conversaciones abiertas (sin leer/pendientes)
  useEffect(() => {
    supabase
      .from('conversaciones')
      .select('id', { count: 'exact', head: true })
      .eq('estado', 'abierta')
      .then(({ count }) => { if (count !== null) setConversacionesAbiertas(count) })
  }, [])

  // Últimas 3 conversaciones
  useEffect(() => {
    supabase
      .from('conversaciones')
      .select('id, cliente_nombre, canal, clasificacion, estado, updated_at')
      .order('updated_at', { ascending: false })
      .limit(3)
      .then(({ data }) => { if (data) setUltimasConversaciones(data) })
  }, [])

  const turnoActivo = turnoHoraInicio !== null

  const accesos = [
    { label:'Mensajes',       href:'/mensajes',      icon:'💬', color:'#25D366', desc: conversacionesAbiertas > 0 ? `${conversacionesAbiertas} pendientes` : 'Sin pendientes' },
    { label:'Inventario',     href:'/inventario',    icon:'📦', color:'#ff5c4d', desc: stockCritico.length > 0 ? `${stockCritico.length} críticos` : 'Stock OK' },
    { label:'Requisiciones',  href:'/requisiciones', icon:'🛒', color:'#ff9a3c', desc:'Miércoles' },
    { label:'Corte de turno', href:'/corte',         icon:'🧾', color:'#5cb8ff', desc: turnoActivo ? 'Turno activo' : 'Sin turno' },
    { label:'Reportes',       href:'/reportes',      icon:'📈', color:'#c8f135', desc:'Esta semana' },
    { label:'Proveedores',    href:'/proveedores',   icon:'🤝', color:'#7F77DD', desc:'Contactos' },
  ]

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
              {turnoActivo ? `Turno activo · ${turnoHoraInicio}` : 'Turno cerrado'}
            </div>
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'16px 24px', display:'flex', flexDirection:'column', gap:16 }}>

          {/* Stats del día */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
            {[
              { val:`$${ventaHoy.toLocaleString()}`,  label:'Venta del día',  color:'var(--accent)', delta:'Últimas 24 horas' },
              { val:`$${margenHoy.toLocaleString()}`,  label:'Margen est.',    color:'#4dffb0',       delta:`~${ventaHoy > 0 ? 35 : 0}% de margen` },
              { val:`${pedidosHoy}`,                   label:'Pedidos hoy',    color:'#5cb8ff',       delta:'Todos los canales' },
              { val:`$${ticketProm}`,                  label:'Ticket prom.',   color:'#ff9a3c',       delta: pedidosHoy > 0 ? `${pedidosHoy} pedidos` : 'Sin pedidos' },
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
                {accesos.map(a => (
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

            {/* Últimas conversaciones */}
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1 }}>Últimas conversaciones</div>
                <Link href="/mensajes" style={{ fontSize:10, color:'var(--accent)', textDecoration:'none' }}>Ver todos →</Link>
              </div>
              {ultimasConversaciones.length === 0 ? (
                <div style={{ fontSize:12, color:'var(--text3)', textAlign:'center', padding:'24px 0' }}>Sin conversaciones</div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {ultimasConversaciones.map(c => {
                    const canalColor = c.canal === 'whatsapp' ? '#25D366' : c.canal === 'instagram' ? '#E4405F' : '#5cb8ff'
                    const hace = (() => {
                      const diff = Date.now() - new Date(c.updated_at).getTime()
                      const m = Math.floor(diff / 60000)
                      if (m < 60) return `${m}m`
                      return `${Math.floor(m / 60)}h`
                    })()
                    return (
                      <div key={c.id} style={{ display:'flex', gap:10, padding:'8px 10px', background:'var(--surface2)', borderRadius:8 }}>
                        <div style={{ width:32, height:32, minWidth:32, borderRadius:'50%', background:`${canalColor}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:canalColor }}>
                          {c.cliente_nombre.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', justifyContent:'space-between' }}>
                            <span style={{ fontSize:12, fontWeight:500, color:'var(--text)' }}>{c.cliente_nombre}</span>
                            <span style={{ fontSize:10, color:'var(--text3)' }}>{hace}</span>
                          </div>
                          <div style={{ fontSize:11, color:'var(--text3)' }}>{c.canal} · {c.estado}</div>
                          <span style={{ fontSize:9, padding:'1px 5px', borderRadius:4, background: c.clasificacion === 'pedido' ? 'rgba(200,241,53,0.12)' : 'rgba(255,154,60,0.12)', color: c.clasificacion === 'pedido' ? 'var(--accent)' : '#ff9a3c' }}>
                            {c.clasificacion === 'pedido' ? '🛒 Pedido' : c.clasificacion === 'duda' ? '❓ Duda' : c.clasificacion}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
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
                          <span style={{ fontSize:10, fontWeight:600, color }}>{item.stock_actual <= 2 ? 'urgente' : 'bajo'}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
