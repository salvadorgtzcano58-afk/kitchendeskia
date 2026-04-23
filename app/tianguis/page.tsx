'use client'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Venta = {
  id: number
  sabor: string
  cantidad: number
  precio: number
  hora: string
}

type CarritoItem = {
  sabor: string
  cantidad: number
  precio: number
  sabores?: string[] // solo para paquetes
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
  { sabor:'Paneki Amigos (4 piezas)',   precio:120, piezas:4 },
  { sabor:'Paneki Familiar (6 piezas)', precio:180, piezas:6 },
]

export default function TianguisPage() {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [carrito, setCarrito] = useState<CarritoItem[]>([])
  const [vista, setVista] = useState<'vender'|'resumen'>('vender')
  const [turnoActivo, setTurnoActivo] = useState(false)
  const [showCobrar, setShowCobrar] = useState(false)
  const [efectivoRecibido, setEfectivoRecibido] = useState('')
  const [productosMap, setProductosMap] = useState<Record<string, string>>({})

  // Sub-selector de sabores para paquetes
  const [paqueteConfigurando, setPaqueteConfigurando] = useState<{ sabor: string; precio: number; piezas: number } | null>(null)
  const [tempSabores, setTempSabores] = useState<string[]>([])

  // Estado del cobro
  const [verificando, setVerificando] = useState(false)
  const [stockErrors, setStockErrors] = useState<string[]>([])

  useEffect(() => {
    supabase
      .from('productos')
      .select('id, nombre')
      .eq('activo', true)
      .then(({ data }) => {
        if (data) {
          const map: Record<string, string> = {}
          data.forEach(p => { map[p.nombre] = p.id })
          setProductosMap(map)
        }
      })
  }, [])

  const totalCarrito = carrito.reduce((a, i) => a + (i.precio * i.cantidad), 0)
  const totalDia = ventas.reduce((a, v) => a + v.precio * v.cantidad, 0)
  const totalPiezas = ventas.reduce((a, v) => a + v.cantidad, 0)

  const agregarAlCarrito = (sabor: string, precio: number) => {
    setCarrito(prev => {
      const existe = prev.find(i => i.sabor === sabor && !i.sabores)
      if (existe) return prev.map(i => i.sabor === sabor && !i.sabores ? {...i, cantidad: i.cantidad + 1} : i)
      return [...prev, { sabor, cantidad:1, precio }]
    })
  }

  const quitarDelCarrito = (sabor: string) => {
    setCarrito(prev => {
      const idx = prev.findLastIndex(i => i.sabor === sabor)
      if (idx === -1) return prev
      const item = prev[idx]
      if (item.sabores || item.cantidad === 1) {
        return prev.filter((_, i) => i !== idx)
      }
      return prev.map((i, index) => index === idx ? {...i, cantidad: i.cantidad - 1} : i)
    })
  }

  // Abre el sub-selector de sabores para un paquete
  const abrirSelectorPaquete = (paquete: { sabor: string; precio: number; piezas: number }) => {
    setPaqueteConfigurando(paquete)
    setTempSabores([])
  }

  // Agrega un sabor al paquete que se está configurando
  const seleccionarSaborPaquete = (sabor: string) => {
    if (!paqueteConfigurando) return
    const nuevos = [...tempSabores, sabor]
    if (nuevos.length >= paqueteConfigurando.piezas) {
      const saboresFinal = nuevos.slice(0, paqueteConfigurando.piezas)
      setCarrito(prev => [...prev, {
        sabor: paqueteConfigurando.sabor,
        cantidad: 1,
        precio: paqueteConfigurando.precio,
        sabores: saboresFinal,
      }])
      setPaqueteConfigurando(null)
      setTempSabores([])
    } else {
      setTempSabores(nuevos)
    }
  }

  const cobrar = async () => {
    // Capturar hora y snapshot en cuanto el usuario confirma
    const hora = new Date().toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit' })
    // Deep copy para que los arrays de sabores sean independientes del estado React
    const carritoSnapshot: CarritoItem[] = carrito.map(item => ({
      ...item,
      sabores: item.sabores ? [...item.sabores] : undefined,
    }))
    const totalSnapshot = totalCarrito

    setVerificando(true)
    setStockErrors([])

    // ── Bug 2: Validar stock antes de cualquier insert ───────────────
    // Construir mapa { nombreProducto → cantidadNecesaria }
    // Los paquetes aportan 1 unidad por cada sabor en su array (no el nombre del paquete)
    const requerido: Record<string, number> = {}
    for (const item of carritoSnapshot) {
      if (item.sabores && item.sabores.length > 0) {
        for (const sabor of item.sabores) {
          requerido[sabor] = (requerido[sabor] || 0) + 1
        }
      } else {
        requerido[item.sabor] = (requerido[item.sabor] || 0) + item.cantidad
      }
    }

    const nombresAVerificar = Object.keys(requerido)
    if (nombresAVerificar.length > 0) {
      const { data: stockData, error: stockError } = await supabase
        .from('productos')
        .select('nombre, stock_actual')
        .in('nombre', nombresAVerificar)

      if (!stockError && stockData) {
        const errores: string[] = []
        for (const prod of stockData) {
          const necesario = requerido[prod.nombre] ?? 0
          if (prod.stock_actual < necesario) {
            if (prod.stock_actual === 0) {
              errores.push(`No hay suficientes panes de ${prod.nombre}, no hay stock disponible.`)
            } else {
              errores.push(`No hay suficientes panes de ${prod.nombre}, solo quedan ${prod.stock_actual} pieza${prod.stock_actual !== 1 ? 's' : ''}.`)
            }
          }
        }
        if (errores.length > 0) {
          setStockErrors(errores)
          setVerificando(false)
          return
        }
      }
    }

    // ── Bug 1 fix: insertar pedido + items antes de tocar el estado local ──
    // El real-time del corte se dispara al insertar el pedido; si los items
    // se insertan inmediatamente después (sin awaits intermedios), la ventana
    // de race condition se minimiza al máximo posible desde el cliente.

    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .insert({ canal: 'tianguis' as const, total: totalSnapshot, metodo_pago: 'efectivo' as const })
      .select()
      .single()

    if (pedidoError || !pedido) {
      console.error('[tianguis] Error al insertar pedido:', pedidoError)
      setVerificando(false)
      return
    }

    // Insertar items inmediatamente: un row por sabor en paquetes (con su producto_id
    // para que el trigger descuente stock), un row normal para panes individuales
    const items = carritoSnapshot.flatMap(item => {
      if (item.sabores && item.sabores.length > 0) {
        const precioPorPieza = item.precio / item.sabores.length
        return item.sabores.map(sabor => ({
          pedido_id: pedido.id,
          producto_id: productosMap[sabor] ?? null,
          producto_nombre: sabor,
          cantidad: 1,
          precio_unitario: precioPorPieza,
        }))
      }
      return [{
        pedido_id: pedido.id,
        producto_id: productosMap[item.sabor] ?? null,
        producto_nombre: item.sabor,
        cantidad: item.cantidad,
        precio_unitario: item.precio,
      }]
    })

    const { error: itemsError } = await supabase.from('pedido_items').insert(items)
    if (itemsError) {
      console.error('[tianguis] Error al insertar pedido_items:', itemsError)
    }

    // Solo después de que ambos inserts terminaron, actualizar estado local
    const nuevasVentas: Venta[] = carritoSnapshot.flatMap((item, i) => {
      if (item.sabores && item.sabores.length > 0) {
        const precioPorPieza = item.precio / item.sabores.length
        return item.sabores.map((sabor, j) => ({
          id: Date.now() + i * 100 + j,
          sabor,
          cantidad: 1,
          precio: precioPorPieza,
          hora,
        }))
      }
      return [{ id: Date.now() + i, sabor: item.sabor, cantidad: item.cantidad, precio: item.precio, hora }]
    })

    setVentas(prev => [...prev, ...nuevasVentas])
    setCarrito([])
    setShowCobrar(false)
    setEfectivoRecibido('')
    setStockErrors([])
    setVerificando(false)
  }

  const cambio = efectivoRecibido ? parseFloat(efectivoRecibido) - totalCarrito : 0
  const cantidadEnCarrito = (sabor: string) =>
    carrito.filter(i => i.sabor === sabor && !i.sabores).reduce((a, i) => a + i.cantidad, 0)
  const paquetesEnCarrito = (sabor: string) =>
    carrito.filter(i => i.sabor === sabor && i.sabores).length

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
          <div key={t.key} onClick={() => setVista(t.key as 'vender'|'resumen')}
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
              const cnt = paquetesEnCarrito(p.sabor)
              return (
                <div key={p.sabor} style={{ background:'#1d1f1b', border:`1px solid ${cnt > 0 ? '#c8f135' : 'rgba(255,255,255,0.07)'}`, borderRadius:12, padding:'12px', display:'flex', flexDirection:'column', gap:6 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'#e8ead4', lineHeight:1.3 }}>{p.sabor}</div>
                  <div style={{ fontSize:18, fontWeight:700, color:'#c8f135' }}>${p.precio}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <button onClick={() => quitarDelCarrito(p.sabor)}
                      style={{ width:32, height:32, background:'#252720', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, cursor:'pointer', color:'#9a9c88', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                    <span style={{ flex:1, textAlign:'center', fontSize:16, fontWeight:700, color: cnt > 0 ? '#c8f135' : '#5a5c4e' }}>{cnt}</span>
                    <button onClick={() => abrirSelectorPaquete(p)}
                      style={{ width:32, height:32, background: cnt > 0 ? '#c8f135' : '#252720', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, cursor:'pointer', color: cnt > 0 ? '#0e0f0c' : '#9a9c88', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>+</button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Panes individuales */}
          <div style={{ fontSize:10, color:'#5a5c4e', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Panes individuales · $30 c/u</div>
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
              { val: ventas.length > 0 ? `$${Math.round(totalDia/ventas.length)}` : '$0', label:'Ticket prom.', color:'#ff9a3c' },
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
            {carrito.map(i => i.sabores
              ? `${i.sabor.replace(' (4 piezas)','').replace(' (6 piezas)','')} (${i.sabores.slice(0,2).join(', ')}${i.sabores.length > 2 ? '…' : ''})`
              : `${i.sabor} x${i.cantidad}`
            ).join(' · ')}
          </div>
          <button onClick={() => { setShowCobrar(true); setStockErrors([]) }}
            style={{ width:'100%', padding:'14px', background:'#c8f135', border:'none', borderRadius:12, cursor:'pointer', color:'#0e0f0c', fontSize:15, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span>💰 Cobrar</span>
            <span>${totalCarrito}</span>
          </button>
        </div>
      )}

      {/* Modal sub-selector de sabores para paquete */}
      {paqueteConfigurando && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:200, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
          <div style={{ background:'#161714', borderRadius:'20px 20px 0 0', padding:20, width:'100%', maxWidth:480, maxHeight:'80vh', display:'flex', flexDirection:'column' }}>

            {/* Header del selector */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:'#c8f135' }}>
                  {paqueteConfigurando.sabor.replace(' (4 piezas)', ' · 4 pzas').replace(' (6 piezas)', ' · 6 pzas')}
                </div>
                <div style={{ fontSize:12, color:'#9a9c88', marginTop:2 }}>
                  Elige {paqueteConfigurando.piezas} sabores · {tempSabores.length}/{paqueteConfigurando.piezas}
                </div>
              </div>
              <button onClick={() => { setPaqueteConfigurando(null); setTempSabores([]) }}
                style={{ background:'#252720', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, width:32, height:32, cursor:'pointer', color:'#9a9c88', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>
                ✕
              </button>
            </div>

            {/* Barra de progreso */}
            <div style={{ height:4, background:'#252720', borderRadius:2, marginBottom:14 }}>
              <div style={{ height:'100%', background:'#c8f135', borderRadius:2, transition:'width 0.2s', width:`${(tempSabores.length / paqueteConfigurando.piezas) * 100}%` }} />
            </div>

            {/* Sabores seleccionados */}
            {tempSabores.length > 0 && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:12 }}>
                {tempSabores.map((s, i) => (
                  <span key={i} style={{ padding:'3px 10px', borderRadius:20, background:'rgba(200,241,53,0.15)', border:'1px solid rgba(200,241,53,0.4)', fontSize:11, color:'#c8f135' }}>
                    {s}
                  </span>
                ))}
              </div>
            )}

            {/* Grid de panes */}
            <div style={{ overflowY:'auto', flex:1 }}>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {PANES.map(p => {
                  const cuenta = tempSabores.filter(s => s === p.sabor).length
                  const lleno = tempSabores.length >= paqueteConfigurando.piezas
                  return (
                    <button key={p.sabor}
                      onClick={() => seleccionarSaborPaquete(p.sabor)}
                      disabled={lleno}
                      style={{
                        padding:'7px 12px', borderRadius:8, fontSize:12, fontWeight:500,
                        cursor: lleno ? 'not-allowed' : 'pointer',
                        background: cuenta > 0 ? 'rgba(200,241,53,0.15)' : '#252720',
                        color: cuenta > 0 ? '#c8f135' : '#e8ead4',
                        border: cuenta > 0 ? '1px solid rgba(200,241,53,0.4)' : '1px solid rgba(255,255,255,0.08)',
                        opacity: lleno && cuenta === 0 ? 0.35 : 1,
                      }}>
                      {p.sabor}{cuenta > 0 && <span style={{ fontWeight:700 }}> ×{cuenta}</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal cobrar */}
      {showCobrar && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:100, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
          <div style={{ background:'#161714', borderRadius:'20px 20px 0 0', padding:24, width:'100%', maxWidth:480 }}>
            <div style={{ fontSize:16, fontWeight:700, color:'#e8ead4', marginBottom:16 }}>Cobrar en efectivo</div>

            {/* Errores de stock */}
            {stockErrors.length > 0 && (
              <div style={{ marginBottom:14, padding:'12px 14px', background:'rgba(255,92,77,0.1)', border:'1px solid rgba(255,92,77,0.35)', borderRadius:10 }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#ff5c4d', marginBottom:6 }}>Stock insuficiente</div>
                {stockErrors.map((err, i) => (
                  <div key={i} style={{ fontSize:12, color:'#ff9a8a', lineHeight:1.5 }}>• {err}</div>
                ))}
              </div>
            )}

            <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:16 }}>
              {carrito.map((i, idx) => (
                <div key={idx} style={{ fontSize:13, color:'#9a9c88' }}>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span>{i.sabor}{!i.sabores && ` x${i.cantidad}`}</span>
                    <span>${i.precio * i.cantidad}</span>
                  </div>
                  {i.sabores && (
                    <div style={{ fontSize:11, color:'#5a5c4e', marginTop:2, paddingLeft:8 }}>
                      {i.sabores.join(', ')}
                    </div>
                  )}
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
              <button
                onClick={() => { setShowCobrar(false); setEfectivoRecibido(''); setStockErrors([]) }}
                disabled={verificando}
                style={{ flex:1, padding:'14px', background:'#252720', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, cursor: verificando ? 'not-allowed' : 'pointer', color:'#9a9c88', fontSize:14, opacity: verificando ? 0.5 : 1 }}>
                Cancelar
              </button>
              <button
                onClick={cobrar}
                disabled={verificando}
                style={{ flex:2, padding:'14px', background: verificando ? '#3a3d2e' : '#c8f135', border:'none', borderRadius:12, cursor: verificando ? 'not-allowed' : 'pointer', color: verificando ? '#9a9c88' : '#0e0f0c', fontSize:14, fontWeight:700 }}>
                {verificando ? 'Verificando...' : '✓ Confirmar cobro'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
