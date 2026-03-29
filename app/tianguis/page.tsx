'use client'
import { useState } from 'react'

type Venta = {
  id: number
  sabor: string
  cantidad: number
  precio: number
  hora: string
}

const PANES = [
  { sabor:'Nutella',             precio:30 },
  { sabor:'Fresas con crema',    precio:30 },
  { sabor:'Zarzamora con queso', precio:30 },
  { sabor:'Hersheys',            precio:30 },
  { sabor:'Moka',                precio:30 },
  { sabor:'Mango con queso',     precio:30 },
  { sabor:'Arroz con leche',     precio:30 },
  { sabor:'Duvalín',             precio:30 },
  { sabor:'Frambuesa con queso', precio:30 },
  { sabor:'Nuez',                precio:30 },
  { sabor:'Taro',                precio:30 },
  { sabor:'Panditas',            precio:30 },
  { sabor:'Manzana',             precio:30 },
  { sabor:'Gansito',             precio:30 },
  { sabor:'Chococereza',         precio:30 },
  { sabor:'Carlos V',            precio:30 },
  { sabor:'Mora azul',           precio:30 },
  { sabor:'Crema pastelera',     precio:30 },
  { sabor:'Chocolate abuelita',  precio:30 },
  { sabor:'Oreo',                precio:30 },
  { sabor:'Chocomenta',          precio:30 },
  { sabor:'Maracuyá',            precio:30 },
  { sabor:'Bubulubu',            precio:30 },
  { sabor:'Pay de limón',        precio:30 },
]

const PAQUETES = [
  { sabor:'Paneki Amigos (4 pzas)',   precio:120 },
  { sabor:'Paneki Familiar (6 pzas)', precio:180 },
]

export default function TianguisPage() {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [carrito, setCarrito] = useState<{sabor:string; cantidad:number; precio:number}[]>([])
  const [vista, setVista] = useState<'vender'|'resumen'>('vender')
  const [turnoActivo, setTurnoActivo] = useState(false)
  const [showCobrar, setShowCobrar] = useState(false)
  const [efectivoRecibido, setEfectivoRecibido] = useState('')

  const totalCarrito = carrito.reduce((a, i) => a + (i.precio * i.cantidad), 0)
  const totalDia = ventas.reduce((a, v) => a + v.precio * v.cantidad, 0)
  const totalPiezas = ventas.reduce((a, v) => a + v.cantidad, 0)

  const agregarAlCarrito = (sabor: string, precio: number) => {
    setCarrito(prev => {
      const existe = prev.find(i => i.sabor === sabor)
      if (existe) return prev.map(i => i.sabor === sabor ? {...i, cantidad: i.cantidad + 1} : i)
      return [...prev, { sabor, cantidad:1, precio }]
    })
  }

  const quitarDelCarrito = (sabor: string) => {
    setCarrito(prev => {
      const existe = prev.find(i => i.sabor === sabor)
      if (!existe) return prev
      if (existe.cantidad === 1) return prev.filter(i => i.sabor !== sabor)
      return prev.map(i => i.sabor === sabor ? {...i, cantidad: i.cantidad - 1} : i)
    })
  }

  const cobrar = () => {
    const hora = new Date().toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit' })
    const nuevasVentas = carrito.map((item, i) => ({
      id: Date.now() + i,
      sabor: item.sabor,
      cantidad: item.cantidad,
      precio: item.precio,
      hora,
    }))
    setVentas(prev => [...prev, ...nuevasVentas])
    setCarrito([])
    setShowCobrar(false)
    setEfectivoRecibido('')
  }

  const cambio = efectivoRecibido ? parseFloat(efectivoRecibido) - totalCarrito : 0

  const cantidadEnCarrito = (sabor: string) => carrito.find(i => i.sabor === sabor)?.cantidad || 0

  if (!turnoActivo) {
    return (
      <div style={{ minHeight:'100vh', background:'#0e0f0c', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, gap:16 }}>
        <div style={{ fontSize:56 }}>🛍️</div>
        <div style={{ fontSize:22, fontWeight:700, color:'#c8f135', textAlign:'center' }}>Caja Tianguis</div>
        <div style={{ fontSize:14, color:'#9a9c88', textAlign:'center' }}>Paneki Neko · Ventas en efectivo</div>
        <div style={{ fontSize:12, color:'#5a5c4e', textAlign:'center', marginTop:8 }}>Viernes y Domingos</div>
        <button onClick={() => setTurnoActivo(true)}
          style={{ marginTop:16, padding:'16px 40px', background:'#c8f135', border:'none', borderRadius:14, fontSize:16, fontWeight:700, cursor:'pointer', color:'#0e0f0c', width:'100%', maxWidth:300 }}>
          ▶ Abrir caja
        </button>
      </div>
    )
  }

  return (
    <div style={{ minHeight:'100vh', background:'#0e0f0c', display:'flex', flexDirection:'column', maxWidth:480, margin:'0 auto' }}>

      {/* Header */}
      <div style={{ padding:'14px 16px', background:'#161714', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:10 }}>
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:'#c8f135' }}>🛍️ Caja Tianguis</div>
          <div style={{ fontSize:10, color:'#5a5c4e' }}>Paneki Neko · efectivo</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:16, fontWeight:700, color:'#4dffb0' }}>${totalDia.toLocaleString()}</div>
            <div style={{ fontSize:9, color:'#5a5c4e' }}>{totalPiezas} pzas vendidas</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', background:'#161714', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
        {[
          { key:'vender',  label:'Vender' },
          { key:'resumen', label:`Resumen (${ventas.length})` },
        ].map(t => (
          <div key={t.key} onClick={() => setVista(t.key as any)}
            style={{ flex:1, padding:'10px', textAlign:'center', fontSize:13, cursor:'pointer', fontWeight:500, color: vista === t.key ? '#c8f135' : '#5a5c4e', borderBottom: vista === t.key ? '2px solid #c8f135' : '2px solid transparent' }}>
            {t.label}
          </div>
        ))}
      </div>

      {/* Vista vender */}
      {vista === 'vender' && (
        <div style={{ flex:1, padding:12, paddingBottom: carrito.length > 0 ? 140 : 12 }}>

          {/* Paquetes */}
          <div style={{ fontSize:10, color:'#5a5c4e', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Paquetes</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
            {PAQUETES.map(p => {
              const cnt = cantidadEnCarrito(p.sabor)
              return (
                <div key={p.sabor} style={{ background:'#1d1f1b', border:`1px solid ${cnt > 0 ? '#c8f135' : 'rgba(255,255,255,0.07)'}`, borderRadius:12, padding:'12px', display:'flex', flexDirection:'column', gap:6 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'#e8ead4', lineHeight:1.3 }}>{p.sabor}</div>
                  <div style={{ fontSize:18, fontWeight:700, color:'#c8f135' }}>${p.precio}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <button onClick={() => quitarDelCarrito(p.sabor)}
                      style={{ width:32, height:32, background:'#252720', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, cursor:'pointer', color:'#9a9c88', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                    <span style={{ flex:1, textAlign:'center', fontSize:16, fontWeight:700, color: cnt > 0 ? '#c8f135' : '#5a5c4e' }}>{cnt}</span>
                    <button onClick={() => agregarAlCarrito(p.sabor, p.precio)}
                      style={{ width:32, height:32, background: cnt > 0 ? '#c8f135' : '#252720', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, cursor:'pointer', color: cnt > 0 ? '#0e0f0c' : '#9a9c88', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>+</button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Panes individuales */}
          <div style={{ fontSize:10, color:'#5a5c4e', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Panes individuales · $32 c/u</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {PANES.map(p => {
              const cnt = cantidadEnCarrito(p.sabor)
              return (
                <div key={p.sabor} style={{ background:'#1d1f1b', border:`1px solid ${cnt > 0 ? '#c8f135' : 'rgba(255,255,255,0.07)'}`, borderRadius:12, padding:'10px 12px', display:'flex', flexDirection:'column', gap:6 }}>
                  <div style={{ fontSize:12, fontWeight:500, color:'#e8ead4', lineHeight:1.3 }}>{p.sabor}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <button onClick={() => quitarDelCarrito(p.sabor)}
                      style={{ width:28, height:28, background:'#252720', border:'1px solid rgba(255,255,255,0.1)', borderRadius:6, cursor:'pointer', color:'#9a9c88', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                    <span style={{ flex:1, textAlign:'center', fontSize:15, fontWeight:700, color: cnt > 0 ? '#c8f135' : '#5a5c4e' }}>{cnt}</span>
                    <button onClick={() => agregarAlCarrito(p.sabor, p.precio)}
                      style={{ width:28, height:28, background: cnt > 0 ? '#c8f135' : '#252720', border:'1px solid rgba(255,255,255,0.1)', borderRadius:6, cursor:'pointer', color: cnt > 0 ? '#0e0f0c' : '#9a9c88', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>+</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Vista resumen */}
      {vista === 'resumen' && (
        <div style={{ flex:1, padding:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
            {[
              { val:`$${totalDia.toLocaleString()}`, label:'Total del día', color:'#c8f135' },
              { val:`${totalPiezas}`,                label:'Piezas vendidas', color:'#4dffb0' },
              { val:`${ventas.length}`,              label:'Transacciones', color:'#5cb8ff' },
              { val: totalPiezas > 0 ? `$${Math.round(totalDia/ventas.length)}` : '$0', label:'Ticket prom.', color:'#ff9a3c' },
            ].map((s,i) => (
              <div key={i} style={{ background:'#161714', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'12px 14px' }}>
                <div style={{ fontSize:22, fontWeight:700, color:s.color }}>{s.val}</div>
                <div style={{ fontSize:10, color:'#5a5c4e', marginTop:3 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {ventas.length === 0 ? (
            <div style={{ textAlign:'center', padding:40, color:'#5a5c4e', fontSize:13 }}>Sin ventas registradas aún</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {ventas.map(v => (
                <div key={v.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'#161714', borderRadius:10, border:'1px solid rgba(255,255,255,0.07)' }}>
                  <span style={{ fontSize:10, color:'#5a5c4e', fontFamily:'monospace', minWidth:44 }}>{v.hora}</span>
                  <span style={{ fontSize:12, color:'#e8ead4', flex:1 }}>{v.sabor}</span>
                  <span style={{ fontSize:11, color:'#9a9c88' }}>x{v.cantidad}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:'#c8f135' }}>${v.precio * v.cantidad}</span>
                </div>
              ))}
            </div>
          )}

          <button onClick={() => { if(confirm('¿Cerrar la caja del tianguis?')) setTurnoActivo(false) }}
            style={{ width:'100%', marginTop:20, padding:'14px', background:'rgba(255,92,77,0.15)', border:'1px solid rgba(255,92,77,0.3)', borderRadius:12, cursor:'pointer', color:'#ff5c4d', fontSize:14, fontWeight:700 }}>
            Cerrar caja
          </button>
        </div>
      )}

      {/* Carrito flotante */}
      {carrito.length > 0 && vista === 'vender' && (
        <div style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:480, padding:'12px 16px', background:'#161714', borderTop:'1px solid rgba(200,241,53,0.3)', zIndex:20 }}>
          <div style={{ fontSize:11, color:'#9a9c88', marginBottom:6 }}>
            {carrito.map(i => `${i.sabor} x${i.cantidad}`).join(' · ')}
          </div>
          <button onClick={() => setShowCobrar(true)}
            style={{ width:'100%', padding:'14px', background:'#c8f135', border:'none', borderRadius:12, cursor:'pointer', color:'#0e0f0c', fontSize:15, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span>💰 Cobrar</span>
            <span>${totalCarrito}</span>
          </button>
        </div>
      )}

      {/* Modal cobrar */}
      {showCobrar && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:100, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
          <div style={{ background:'#161714', borderRadius:'20px 20px 0 0', padding:24, width:'100%', maxWidth:480 }}>
            <div style={{ fontSize:16, fontWeight:700, color:'#e8ead4', marginBottom:16 }}>Cobrar en efectivo</div>
            <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:16 }}>
              {carrito.map(i => (
                <div key={i.sabor} style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'#9a9c88' }}>
                  <span>{i.sabor} x{i.cantidad}</span>
                  <span>${i.precio * i.cantidad}</span>
                </div>
              ))}
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:18, fontWeight:700, color:'#c8f135', borderTop:'1px solid rgba(255,255,255,0.07)', paddingTop:10, marginTop:4 }}>
                <span>Total</span>
                <span>${totalCarrito}</span>
              </div>
            </div>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, color:'#5a5c4e', marginBottom:6 }}>Efectivo recibido</div>
              <input type="number" value={efectivoRecibido} onChange={e => setEfectivoRecibido(e.target.value)}
                placeholder={`$${totalCarrito}`}
                style={{ width:'100%', background:'#252720', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'12px 14px', color:'#e8ead4', fontSize:20, fontWeight:700, outline:'none', boxSizing:'border-box', textAlign:'center' }} />
              {efectivoRecibido && cambio >= 0 && (
                <div style={{ textAlign:'center', marginTop:8, fontSize:15, color:'#4dffb0', fontWeight:600 }}>
                  Cambio: ${cambio.toFixed(0)}
                </div>
              )}
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => { setShowCobrar(false); setEfectivoRecibido('') }}
                style={{ flex:1, padding:'14px', background:'#252720', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, cursor:'pointer', color:'#9a9c88', fontSize:14 }}>
                Cancelar
              </button>
              <button onClick={cobrar}
                style={{ flex:2, padding:'14px', background:'#c8f135', border:'none', borderRadius:12, cursor:'pointer', color:'#0e0f0c', fontSize:14, fontWeight:700 }}>
                ✓ Confirmar cobro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}