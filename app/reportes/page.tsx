'use client'
import { useState } from 'react'
import Sidebar from '@/components/Sidebar'

type Canal = 'whatsapp' | 'uber_eats' | 'rappi' | 'didi_food'
type MetodoPago = 'tarjeta' | 'efectivo' | 'transferencia' | 'terminal' | 'paypal'

const CANAL_INFO: Record<Canal, { label: string; color: string; bg: string }> = {
  whatsapp:  { label:'WhatsApp',  color:'#25D366', bg:'rgba(37,211,102,0.12)' },
  uber_eats: { label:'Uber Eats', color:'#06C167', bg:'rgba(6,193,103,0.12)' },
  rappi:     { label:'Rappi',     color:'#ff441f', bg:'rgba(255,68,31,0.12)' },
  didi_food: { label:'DiDi Food', color:'#ff6b00', bg:'rgba(255,107,0,0.12)' },
}

const PAGO_INFO: Record<MetodoPago, { label: string; color: string }> = {
  tarjeta:      { label:'Tarjeta',      color:'#5cb8ff' },
  efectivo:     { label:'Efectivo',     color:'#4dffb0' },
  transferencia:{ label:'Transferencia',color:'#c8f135' },
  terminal:     { label:'Terminal',     color:'#ff9a3c' },
  paypal:       { label:'PayPal',       color:'#7F77DD' },
}

// Datos de ejemplo para 4 semanas
const SEMANAS = [
  {
    semana: 'Semana actual (24-28 Mar)',
    dias: [
      { dia:'Lun 24', ventas:{ whatsapp:854, uber_eats:1175, rappi:305, didi_food:460 }, pedidos:{ whatsapp:2, uber_eats:2, rappi:1, didi_food:1 }, gastos:320 },
      { dia:'Mar 25', ventas:{ whatsapp:479, uber_eats:590, rappi:460, didi_food:0 },   pedidos:{ whatsapp:1, uber_eats:1, rappi:2, didi_food:0 }, gastos:150 },
      { dia:'Mié 26', ventas:{ whatsapp:1120, uber_eats:295, rappi:305, didi_food:230 },pedidos:{ whatsapp:3, uber_eats:1, rappi:1, didi_food:1 }, gastos:420 },
      { dia:'Jue 27', ventas:{ whatsapp:375, uber_eats:880, rappi:0, didi_food:460 },   pedidos:{ whatsapp:1, uber_eats:2, rappi:0, didi_food:2 }, gastos:180 },
      { dia:'Vie 28', ventas:{ whatsapp:0, uber_eats:0, rappi:0, didi_food:0 },         pedidos:{ whatsapp:0, uber_eats:0, rappi:0, didi_food:0 }, gastos:0 },
    ]
  },
  {
    semana: 'Semana pasada (17-21 Mar)',
    dias: [
      { dia:'Lun 17', ventas:{ whatsapp:720, uber_eats:885, rappi:460, didi_food:0 },   pedidos:{ whatsapp:2, uber_eats:2, rappi:2, didi_food:0 }, gastos:280 },
      { dia:'Mar 18', ventas:{ whatsapp:375, uber_eats:590, rappi:305, didi_food:230 }, pedidos:{ whatsapp:1, uber_eats:1, rappi:1, didi_food:1 }, gastos:120 },
      { dia:'Mié 19', ventas:{ whatsapp:958, uber_eats:1180, rappi:0, didi_food:460 },  pedidos:{ whatsapp:2, uber_eats:3, rappi:0, didi_food:2 }, gastos:390 },
      { dia:'Jue 20', ventas:{ whatsapp:479, uber_eats:295, rappi:610, didi_food:0 },   pedidos:{ whatsapp:1, uber_eats:1, rappi:2, didi_food:0 }, gastos:160 },
      { dia:'Vie 21', ventas:{ whatsapp:1120, uber_eats:590, rappi:305, didi_food:230 },pedidos:{ whatsapp:3, uber_eats:2, rappi:1, didi_food:1 }, gastos:210 },
    ]
  },
]

const PAGOS_DEMO = [
  { canal:'whatsapp' as Canal,  metodo:'efectivo' as MetodoPago,      monto:375,  dia:'Lun 24' },
  { canal:'whatsapp' as Canal,  metodo:'transferencia' as MetodoPago, monto:479,  dia:'Lun 24' },
  { canal:'uber_eats' as Canal, metodo:'tarjeta' as MetodoPago,       monto:590,  dia:'Lun 24' },
  { canal:'uber_eats' as Canal, metodo:'efectivo' as MetodoPago,      monto:585,  dia:'Lun 24' },
  { canal:'rappi' as Canal,     metodo:'tarjeta' as MetodoPago,       monto:305,  dia:'Lun 24' },
  { canal:'didi_food' as Canal, metodo:'efectivo' as MetodoPago,      monto:460,  dia:'Lun 24' },
  { canal:'whatsapp' as Canal,  metodo:'terminal' as MetodoPago,      monto:854,  dia:'Mar 25' },
]

export default function ReportesPage() {
  const [semanaIdx, setSemanaIdx] = useState(0)
  const [vista, setVista] = useState<'resumen'|'canales'|'pagos'>('resumen')

  const semana = SEMANAS[semanaIdx]

  const totalesPorCanal = (['whatsapp','uber_eats','rappi','didi_food'] as Canal[]).map(canal => ({
    canal,
    total: semana.dias.reduce((a, d) => a + d.ventas[canal], 0),
    pedidos: semana.dias.reduce((a, d) => a + d.pedidos[canal], 0),
  }))

  const ventaTotal = totalesPorCanal.reduce((a, c) => a + c.total, 0)
  const totalPedidos = totalesPorCanal.reduce((a, c) => a + c.pedidos, 0)
  const totalGastos = semana.dias.reduce((a, d) => a + d.gastos, 0)
  const margenNeto = ventaTotal - totalGastos
  const ticketPromedio = totalPedidos > 0 ? Math.round(ventaTotal / totalPedidos) : 0

  const canalTop = [...totalesPorCanal].sort((a,b) => b.total - a.total)[0]

  const totalesPago = (['tarjeta','efectivo','transferencia','terminal','paypal'] as MetodoPago[]).map(m => ({
    metodo: m,
    total: PAGOS_DEMO.filter(p => p.metodo === m).reduce((a,p) => a + p.monto, 0),
    count: PAGOS_DEMO.filter(p => p.metodo === m).length,
  })).filter(m => m.total > 0)

  const maxVenta = Math.max(...semana.dias.map(d => Object.values(d.ventas).reduce((a,b)=>a+b,0)))

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      <Sidebar />
      <main style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Topbar */}
        <div style={{ padding:'14px 24px', borderBottom:'1px solid var(--border)', background:'var(--surface)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontWeight:700, fontSize:16 }}>Reportes</div>
            <div style={{ fontSize:11, color:'var(--text3)', marginTop:1 }}>Análisis semanal de ventas · Paneki Neko</div>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            {SEMANAS.map((s, i) => (
              <button key={i} onClick={() => setSemanaIdx(i)}
                style={{ padding:'6px 12px', borderRadius:8, fontSize:11, cursor:'pointer', fontWeight:500, background: semanaIdx === i ? 'var(--accent-dim)' : 'var(--surface2)', color: semanaIdx === i ? 'var(--accent)' : 'var(--text3)', border: semanaIdx === i ? '1px solid rgba(200,241,53,0.3)' : '1px solid var(--border)' }}>
                {i === 0 ? 'Esta semana' : 'Semana pasada'}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'1px solid var(--border)', background:'var(--surface)', padding:'0 24px' }}>
          {[
            { key:'resumen', label:'📊 Resumen' },
            { key:'canales', label:'📡 Por canal' },
            { key:'pagos',   label:'💳 Métodos de pago' },
          ].map(t => (
            <div key={t.key} onClick={() => setVista(t.key as any)}
              style={{ padding:'10px 16px', fontSize:12, cursor:'pointer', color: vista === t.key ? 'var(--accent)' : 'var(--text3)', borderBottom: vista === t.key ? '2px solid var(--accent)' : '2px solid transparent', fontWeight: vista === t.key ? 500 : 400 }}>
              {t.label}
            </div>
          ))}
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'16px 24px', display:'flex', flexDirection:'column', gap:16 }}>

          {/* Stats globales */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10 }}>
            {[
              { val:`$${ventaTotal.toLocaleString()}`, label:'Venta total', color:'var(--accent)' },
              { val:`$${margenNeto.toLocaleString()}`, label:'Margen neto', color:'#4dffb0' },
              { val:`${totalPedidos}`, label:'Pedidos', color:'#5cb8ff' },
              { val:`$${ticketPromedio}`, label:'Ticket prom.', color:'#ff9a3c' },
              { val:CANAL_INFO[canalTop.canal].label, label:'Canal top', color:CANAL_INFO[canalTop.canal].color },
            ].map((s,i) => (
              <div key={i} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 14px' }}>
                <div style={{ fontSize:20, fontWeight:700, color:s.color, lineHeight:1 }}>{s.val}</div>
                <div style={{ fontSize:10, color:'var(--text3)', marginTop:4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* RESUMEN */}
          {vista === 'resumen' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              {/* Gráfica por día */}
              <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:16 }}>
                <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1, marginBottom:16 }}>Ventas por día</div>
                <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:160 }}>
                  {semana.dias.map((d, i) => {
                    const total = Object.values(d.ventas).reduce((a,b)=>a+b,0)
                    const pct = maxVenta > 0 ? (total / maxVenta) * 100 : 0
                    return (
                      <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                        <div style={{ fontSize:9, color:'var(--accent)', fontWeight:600 }}>{total > 0 ? `$${(total/1000).toFixed(1)}k` : '-'}</div>
                        <div style={{ width:'100%', height:`${Math.max(4, pct * 1.4)}px`, background: total > 0 ? 'var(--accent)' : 'var(--surface3)', borderRadius:'4px 4px 0 0', transition:'height 0.3s', opacity: total > 0 ? 1 : 0.3 }} />
                        <div style={{ fontSize:9, color:'var(--text3)' }}>{d.dia.split(' ')[0]}</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Tabla por día */}
              <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:16 }}>
                <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1, marginBottom:12 }}>Detalle diario</div>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr>
                      {['Día','Venta','Pedidos','Gastos','Margen'].map(h => (
                        <th key={h} style={{ fontSize:9, color:'var(--text3)', textAlign:'left', padding:'4px 6px', textTransform:'uppercase', letterSpacing:0.8 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {semana.dias.map((d, i) => {
                      const venta = Object.values(d.ventas).reduce((a,b)=>a+b,0)
                      const peds = Object.values(d.pedidos).reduce((a,b)=>a+b,0)
                      const margen = venta - d.gastos
                      return (
                        <tr key={i} style={{ borderTop:'1px solid var(--border)' }}>
                          <td style={{ padding:'6px', fontSize:11, color:'var(--text2)' }}>{d.dia}</td>
                          <td style={{ padding:'6px', fontSize:11, color:'var(--accent)', fontWeight:600 }}>${venta.toLocaleString()}</td>
                          <td style={{ padding:'6px', fontSize:11, color:'var(--text)' }}>{peds}</td>
                          <td style={{ padding:'6px', fontSize:11, color:'#ff5c4d' }}>-${d.gastos}</td>
                          <td style={{ padding:'6px', fontSize:11, color: margen >= 0 ? '#4dffb0' : '#ff5c4d', fontWeight:600 }}>${margen.toLocaleString()}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CANALES */}
          {vista === 'canales' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              {totalesPorCanal.map(c => {
                const info = CANAL_INFO[c.canal]
                const pct = ventaTotal > 0 ? Math.round((c.total / ventaTotal) * 100) : 0
                const ticket = c.pedidos > 0 ? Math.round(c.total / c.pedidos) : 0
                return (
                  <div key={c.canal} style={{ background:'var(--surface)', border:`1px solid ${info.color}33`, borderRadius:10, padding:16 }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                      <span style={{ fontSize:12, padding:'3px 10px', borderRadius:6, background:info.bg, color:info.color, fontWeight:600 }}>{info.label}</span>
                      <span style={{ fontSize:22, fontWeight:700, color:info.color }}>{pct}%</span>
                    </div>
                    <div style={{ fontSize:26, fontWeight:700, color:'var(--text)', marginBottom:4 }}>${c.total.toLocaleString()}</div>
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
          {vista === 'pagos' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:16 }}>
                <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1, marginBottom:12 }}>Por método de pago</div>
                {totalesPago.map(m => {
                  const info = PAGO_INFO[m.metodo]
                  const pct = ventaTotal > 0 ? Math.round((m.total / ventaTotal) * 100) : 0
                  return (
                    <div key={m.metodo} style={{ marginBottom:14 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ fontSize:11, padding:'2px 8px', borderRadius:4, background:`${info.color}20`, color:info.color, fontWeight:500 }}>{info.label}</span>
                          <span style={{ fontSize:10, color:'var(--text3)' }}>{m.count} pedidos</span>
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
                <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1, marginBottom:12 }}>Pagos por canal</div>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ fontSize:9, color:'var(--text3)', textAlign:'left', padding:'4px 6px', textTransform:'uppercase' }}>Canal</th>
                      <th style={{ fontSize:9, color:'var(--text3)', textAlign:'left', padding:'4px 6px', textTransform:'uppercase' }}>Método</th>
                      <th style={{ fontSize:9, color:'var(--text3)', textAlign:'right', padding:'4px 6px', textTransform:'uppercase' }}>Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PAGOS_DEMO.map((p, i) => {
                      const cInfo = CANAL_INFO[p.canal]
                      const mInfo = PAGO_INFO[p.metodo]
                      return (
                        <tr key={i} style={{ borderTop:'1px solid var(--border)' }}>
                          <td style={{ padding:'6px' }}>
                            <span style={{ fontSize:10, padding:'2px 6px', borderRadius:4, background:cInfo.bg, color:cInfo.color }}>{cInfo.label}</span>
                          </td>
                          <td style={{ padding:'6px' }}>
                            <span style={{ fontSize:10, padding:'2px 6px', borderRadius:4, background:`${mInfo.color}15`, color:mInfo.color }}>{mInfo.label}</span>
                          </td>
                          <td style={{ padding:'6px', fontSize:11, color:'var(--accent)', fontWeight:600, textAlign:'right' }}>${p.monto}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div style={{ padding:'10px 14px', background:'rgba(200,241,53,0.06)', border:'1px solid rgba(200,241,53,0.15)', borderRadius:8, fontSize:11, color:'var(--text3)' }}>
            ⚡ Los datos se actualizarán automáticamente cuando se conecten las APIs de Uber Eats, Rappi, DiDi Food y WhatsApp Business.
          </div>
        </div>
      </main>
    </div>
  )
}