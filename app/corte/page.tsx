'use client'
import { useState, useEffect, useRef } from 'react'
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

const PAGOS_POR_CANAL: Record<Canal, MetodoPago[]> = {
  whatsapp:  ['efectivo', 'transferencia', 'terminal'],
  uber_eats: ['tarjeta', 'efectivo'],
  rappi:     ['tarjeta', 'efectivo'],
  didi_food: ['tarjeta', 'efectivo'],
  tianguis:  ['efectivo'],
}

const PAGO_LABEL: Record<MetodoPago, string> = {
  tarjeta:'Tarjeta', efectivo:'Efectivo', transferencia:'Transferencia', terminal:'Terminal'
}

type Producto = { id: string; nombre: string; categoria: string; stock_actual: number }
type ItemPedido = { producto: Producto; cantidad: number }
type Pedido = {
  id: string
  canal: Canal
  items: string
  total: number
  metodo_pago: MetodoPago
  hora: string
  estado: 'entregado'
}

export default function CorteTurnoPage() {
  const [turnoActivo, setTurnoActivo] = useState(false)
  const [horaInicio, setHoraInicio] = useState('')
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [gastos, setGastos] = useState<{concepto:string; monto:number}[]>([])
  const [nuevoGasto, setNuevoGasto] = useState({ concepto:'', monto:'' })
  const [showNuevoPedido, setShowNuevoPedido] = useState(false)
  const [showCierre, setShowCierre] = useState(false)
  const [productos, setProductos] = useState<Producto[]>([])
  const [itemsSeleccionados, setItemsSeleccionados] = useState<ItemPedido[]>([])
  const [canalSeleccionado, setCanalSeleccionado] = useState<Canal>('whatsapp')
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('efectivo')
  const [totalManual, setTotalManual] = useState('')
  const [guardando, setGuardando] = useState(false)

  const ventas = pedidos
  const totalVentas = ventas.reduce((a, p) => a + p.total, 0)
  const totalGastos = gastos.reduce((a, g) => a + g.monto, 0)
  const margenNeto = totalVentas - totalGastos
  const ticketPromedio = ventas.length > 0 ? Math.round(totalVentas / ventas.length) : 0

  const ventasPorCanal = (Object.keys(CANAL_INFO) as Canal[]).map(canal => ({
    canal,
    total: ventas.filter(p => p.canal === canal).reduce((a, p) => a + p.total, 0),
    pedidos: ventas.filter(p => p.canal === canal).length,
  })).filter(c => c.total > 0)

  // Cargar productos reales de Supabase
  useEffect(() => {
    supabase
      .from('productos')
      .select('id, nombre, categoria, stock_actual')
      .eq('activo', true)
      .order('nombre')
      .then(({ data }) => { if (data) setProductos(data) })
  }, [])

  const cargarPedidosDelDia = async () => {
    const { data } = await supabase
      .from('pedidos')
      .select('id, canal, total, metodo_pago, created_at, pedido_items(producto_nombre, cantidad)')
      .gte('created_at', (() => { const hoy = new Date(); hoy.setHours(0,0,0,0); return hoy.toISOString() })())
      .order('created_at', { ascending: true })
    if (data) {
      setPedidos(data.map(p => ({
        id: p.id,
        canal: p.canal as Canal,
        items: (p.pedido_items as {producto_nombre: string|null; cantidad: number}[])
          ?.filter(i => i.producto_nombre)
          .map(i => `${i.producto_nombre} x${i.cantidad}`)
          .join(', ') || '—',
        total: p.total,
        metodo_pago: (p.metodo_pago || 'efectivo') as MetodoPago,
        hora: new Date(p.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        estado: 'entregado',
      })))
    }
  }

  // Restaurar turno desde localStorage al montar
  useEffect(() => {
    const guardado = localStorage.getItem('turno_activo')
    if (guardado) {
      const { horaInicio: hora, fecha } = JSON.parse(guardado)
      const hoy = new Date().toISOString().split('T')[0]
      if (fecha !== hoy) {
        localStorage.removeItem('turno_activo')
      } else {
        setHoraInicio(hora)
        setTurnoActivo(true)
        cargarPedidosDelDia()
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Suscripción en tiempo real: inserts en pedidos canal tianguis
  const turnoActivoRef = useRef(turnoActivo)
  useEffect(() => { turnoActivoRef.current = turnoActivo }, [turnoActivo])

  useEffect(() => {
    const channel = supabase
      .channel('pedidos-tianguis')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pedidos', filter: 'canal=eq.tianguis' },
        async (payload) => {
          if (!turnoActivoRef.current) return
          const p = payload.new as { id: string; canal: string; total: number; metodo_pago: string; created_at: string }
          // Insertar primero con items '—', luego actualizar con los items reales
          setPedidos(prev => [...prev, {
            id: p.id,
            canal: p.canal as Canal,
            items: '—',
            total: p.total,
            metodo_pago: (p.metodo_pago || 'efectivo') as MetodoPago,
            hora: new Date(p.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
            estado: 'entregado',
          }])
          const { data: itemsData } = await supabase
            .from('pedido_items')
            .select('producto_nombre, cantidad')
            .eq('pedido_id', p.id)
          const itemsTexto = (itemsData as {producto_nombre: string|null; cantidad: number}[] | null)
            ?.filter(i => i.producto_nombre)
            .map(i => `${i.producto_nombre} x${i.cantidad}`)
            .join(', ') || '—'
          setPedidos(prev => prev.map(ped => ped.id === p.id ? { ...ped, items: itemsTexto } : ped))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const abrirTurno = async () => {
    const ahora = new Date()
    const hora = `${ahora.getHours()}:${String(ahora.getMinutes()).padStart(2,'0')}`
    setHoraInicio(hora)
    setTurnoActivo(true)
    setGastos([])
    localStorage.setItem('turno_activo', JSON.stringify({ horaInicio: hora, fecha: new Date().toISOString().split('T')[0] }))
    await cargarPedidosDelDia()
  }

  const agregarItem = (producto: Producto) => {
    setItemsSeleccionados(prev => {
      const existe = prev.find(i => i.producto.id === producto.id)
      if (existe) return prev.map(i => i.producto.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i)
      return [...prev, { producto, cantidad: 1 }]
    })
  }

  const cambiarCantidad = (id: string, delta: number) => {
    setItemsSeleccionados(prev =>
      prev.map(i => i.producto.id === id ? { ...i, cantidad: Math.max(1, i.cantidad + delta) } : i)
        .filter(i => i.cantidad > 0)
    )
  }

  const quitarItem = (id: string) => {
    setItemsSeleccionados(prev => prev.filter(i => i.producto.id !== id))
  }

  const totalCalculado = totalManual
    ? parseFloat(totalManual)
    : itemsSeleccionados.reduce((a, i) => a + i.cantidad * 30, 0) // precio base $30

  const agregarPedido = async () => {
    if (itemsSeleccionados.length === 0 || !totalCalculado) return
    setGuardando(true)

    const itemsTexto = itemsSeleccionados.map(i => `${i.producto.nombre} x${i.cantidad}`).join(', ')

    // 1. Insertar pedido en Supabase
    const { data: pedidoDB, error } = await supabase
      .from('pedidos')
      .insert({
        canal: canalSeleccionado,
        cliente_nombre: 'Cliente',
        total: totalCalculado,
        estado: 'entregado',
      })
      .select()
      .single()

    if (error || !pedidoDB) {
      console.error('Error al guardar pedido:', JSON.stringify(error), error)
      setGuardando(false)
      return
    }

    // 2. Insertar pedido_items → trigger descuenta stock automáticamente
    const items = itemsSeleccionados.map(i => ({
      pedido_id: pedidoDB.id,
      producto_id: i.producto.id,
      producto_nombre: i.producto.nombre,
      cantidad: i.cantidad,
      precio_unitario: totalCalculado / itemsSeleccionados.reduce((a, x) => a + x.cantidad, 0),
    }))

    await supabase.from('pedido_items').insert(items)

  // 3. Actualizar estado local
    const nuevoPedido: Pedido = {
      id: pedidoDB.id,
      canal: canalSeleccionado,
      items: itemsTexto,
      total: totalCalculado,
      metodo_pago: metodoPago,
      hora: new Date().toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit' }),
      estado: 'entregado',
    }
    setPedidos(prev => [...prev, nuevoPedido])

    // 4. Refrescar stock de productos
    const { data: productosActualizados } = await supabase
      .from('productos')
      .select('id, nombre, categoria, stock_actual')
      .eq('activo', true)
      .order('nombre')
    if (productosActualizados) setProductos(productosActualizados)

    // 5. Limpiar modal
    setItemsSeleccionados([])
    setTotalManual('')
    setCanalSeleccionado('whatsapp')
    setMetodoPago('efectivo')
    setShowNuevoPedido(false)
    setGuardando(false)
  }

  const agregarGasto = () => {
    if (!nuevoGasto.concepto || !nuevoGasto.monto) return
    setGastos(prev => [...prev, { concepto: nuevoGasto.concepto, monto: parseFloat(nuevoGasto.monto) }])
    setNuevoGasto({ concepto:'', monto:'' })
  }

  const eliminarPedido = (id: string) => setPedidos(prev => prev.filter(p => p.id !== id))
  const eliminarGasto = (i: number) => setGastos(prev => prev.filter((_, idx) => idx !== i))
  const cambiarCanal = (canal: Canal) => {
    setCanalSeleccionado(canal)
    setMetodoPago(PAGOS_POR_CANAL[canal][0])
  }

  // Agrupar productos por categoría
  const categorias = [...new Set(productos.map(p => p.categoria))]

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      <Sidebar />
      <main style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Topbar */}
        <div style={{ padding:'14px 24px', borderBottom:'1px solid var(--border)', background:'var(--surface)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontWeight:700, fontSize:16 }}>Corte de turno</div>
            <div style={{ fontSize:11, color:'var(--text3)', marginTop:1 }}>
              {turnoActivo ? `Turno activo desde las ${horaInicio} · ${pedidos.length} pedidos registrados` : 'Sin turno activo · 10:00 AM – 6:00 PM'}
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {turnoActivo ? (
              <>
                <button onClick={() => setShowNuevoPedido(true)}
                  style={{ padding:'8px 16px', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer', background:'var(--accent-dim)', color:'var(--accent)', border:'1px solid rgba(200,241,53,0.3)' }}>
                  + Registrar pedido
                </button>
                <button onClick={() => setShowCierre(true)}
                  style={{ padding:'8px 16px', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer', background:'rgba(255,92,77,0.15)', color:'#ff5c4d', border:'1px solid rgba(255,92,77,0.3)' }}>
                  Cerrar turno
                </button>
              </>
            ) : (
              <button onClick={abrirTurno}
                style={{ padding:'10px 24px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', background:'var(--accent)', color:'#0e0f0c', border:'none' }}>
                ▶ Abrir turno
              </button>
            )}
          </div>
        </div>

        {/* Sin turno */}
        {!turnoActivo && (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
            <div style={{ fontSize:48 }}>🍳</div>
            <div style={{ fontSize:18, fontWeight:700 }}>Sin turno activo</div>
            <div style={{ fontSize:13, color:'var(--text3)', textAlign:'center', maxWidth:320 }}>
              Haz clic en "Abrir turno" para comenzar a registrar las ventas del día
            </div>
            <button onClick={abrirTurno}
              style={{ padding:'12px 32px', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', background:'var(--accent)', color:'#0e0f0c', border:'none', marginTop:8 }}>
              ▶ Abrir turno ahora
            </button>
          </div>
        )}

        {/* Turno activo */}
        {turnoActivo && (
          <div style={{ flex:1, overflowY:'auto', padding:'16px 24px', display:'grid', gridTemplateColumns:'1fr 340px', gap:16, alignContent:'start' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

              {/* Stats */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
                {[
                  { val:`$${totalVentas.toLocaleString()}`, label:'Venta total',  color:'var(--accent)' },
                  { val:`$${margenNeto.toLocaleString()}`,  label:'Margen neto',  color:'#4dffb0' },
                  { val:`${ventas.length}`,                 label:'Pedidos',      color:'#5cb8ff' },
                  { val:`$${ticketPromedio}`,               label:'Ticket prom.', color:'#ff9a3c' },
                ].map((s,i) => (
                  <div key={i} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 14px' }}>
                    <div style={{ fontSize:22, fontWeight:700, color:s.color, lineHeight:1 }}>{s.val}</div>
                    <div style={{ fontSize:10, color:'var(--text3)', marginTop:4 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Por canal */}
              {ventasPorCanal.length > 0 && (
                <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:16 }}>
                  <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1, marginBottom:12 }}>Ventas por canal</div>
                  {ventasPorCanal.map(v => {
                    const pct = totalVentas > 0 ? (v.total / totalVentas) * 100 : 0
                    const info = CANAL_INFO[v.canal]
                    return (
                      <div key={v.canal} style={{ marginBottom:8 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <span style={{ fontSize:11, padding:'2px 8px', borderRadius:4, background:info.bg, color:info.color, fontWeight:500 }}>{info.label}</span>
                            <span style={{ fontSize:11, color:'var(--text3)' }}>{v.pedidos} pedido{v.pedidos !== 1 ? 's' : ''}</span>
                          </div>
                          <span style={{ fontSize:13, fontWeight:600 }}>${v.total.toLocaleString()}</span>
                        </div>
                        <div style={{ height:4, background:'var(--surface3)', borderRadius:2 }}>
                          <div style={{ width:`${pct}%`, height:'100%', background:info.color, borderRadius:2, transition:'width 0.3s' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Lista pedidos */}
              <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:16 }}>
                <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1, marginBottom:12 }}>Pedidos del turno</div>
                {pedidos.length === 0 ? (
                  <div style={{ fontSize:12, color:'var(--text3)', textAlign:'center', padding:'24px 0' }}>
                    Aún no hay pedidos — haz clic en "+ Registrar pedido"
                  </div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {pedidos.map(p => {
                      const info = CANAL_INFO[p.canal]
                      return (
                        <div key={p.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', background:'var(--surface2)', borderRadius:8 }}>
                          <span style={{ fontSize:10, color:'var(--text3)', fontFamily:'monospace', minWidth:40 }}>{p.hora}</span>
                          <span style={{ fontSize:10, padding:'2px 6px', borderRadius:4, background:info.bg, color:info.color, fontWeight:500, minWidth:70, textAlign:'center' }}>{info.label}</span>
                          <span style={{ fontSize:12, color:'var(--text)', flex:1 }}>{p.items}</span>
                          <span style={{ fontSize:13, fontWeight:600, color:'var(--accent)', minWidth:50, textAlign:'right' }}>${p.total}</span>
                          <button onClick={() => eliminarPedido(p.id)} style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:14 }}>✕</button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Columna derecha */}
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:16 }}>
                <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1, marginBottom:12 }}>Gastos operativos</div>
                <div style={{ display:'flex', gap:6, marginBottom:10 }}>
                  <input value={nuevoGasto.concepto} onChange={e => setNuevoGasto(p => ({...p, concepto:e.target.value}))}
                    onKeyDown={e => e.key === 'Enter' && agregarGasto()}
                    placeholder="Concepto"
                    style={{ flex:1, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, padding:'6px 10px', color:'var(--text)', fontSize:12, outline:'none' }} />
                  <input value={nuevoGasto.monto} onChange={e => setNuevoGasto(p => ({...p, monto:e.target.value}))}
                    onKeyDown={e => e.key === 'Enter' && agregarGasto()}
                    placeholder="$" type="number"
                    style={{ width:70, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, padding:'6px 8px', color:'var(--text)', fontSize:12, outline:'none' }} />
                  <button onClick={agregarGasto}
                    style={{ padding:'6px 10px', background:'var(--accent)', border:'none', borderRadius:6, cursor:'pointer', color:'#0e0f0c', fontWeight:600, fontSize:12 }}>+</button>
                </div>
                {gastos.length === 0 ? (
                  <div style={{ fontSize:11, color:'var(--text3)', textAlign:'center', padding:'8px 0' }}>Sin gastos registrados</div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                    {gastos.map((g,i) => (
                      <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:12, padding:'4px 0', borderBottom:'1px solid var(--border)' }}>
                        <span style={{ color:'var(--text2)' }}>{g.concepto}</span>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ color:'#ff5c4d' }}>-${g.monto}</span>
                          <button onClick={() => eliminarGasto(i)} style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:12 }}>✕</button>
                        </div>
                      </div>
                    ))}
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, fontWeight:600, marginTop:6 }}>
                      <span>Total gastos</span>
                      <span style={{ color:'#ff5c4d' }}>-${totalGastos.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ background:'var(--surface)', border:'1px solid rgba(200,241,53,0.2)', borderRadius:10, padding:16 }}>
                <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1, marginBottom:12 }}>Resumen del turno</div>
                {[
                  { label:'Venta bruta',       val:`$${totalVentas.toLocaleString()}`,  color:'var(--text)' },
                  { label:'Gastos operativos',  val:`-$${totalGastos.toLocaleString()}`, color:'#ff5c4d' },
                  { label:'Margen neto',        val:`$${margenNeto.toLocaleString()}`,   color:'var(--accent)' },
                ].map((r,i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                    <span style={{ fontSize:12, color:'var(--text2)' }}>{r.label}</span>
                    <span style={{ fontSize:14, fontWeight:700, color:r.color }}>{r.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modal nuevo pedido */}
        {showNuevoPedido && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:24, width:480, maxHeight:'85vh', overflowY:'auto' }}>
              <div style={{ fontSize:15, fontWeight:600, marginBottom:16 }}>Registrar pedido</div>

              {/* Canal */}
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:10, color:'var(--text3)', marginBottom:6, textTransform:'uppercase', letterSpacing:1 }}>Canal</div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {(Object.keys(CANAL_INFO) as Canal[]).map(c => (
                    <button key={c} onClick={() => cambiarCanal(c)}
                      style={{ padding:'5px 10px', borderRadius:6, fontSize:11, cursor:'pointer', fontWeight:500,
                        background: canalSeleccionado === c ? CANAL_INFO[c].bg : 'var(--surface2)',
                        color: canalSeleccionado === c ? CANAL_INFO[c].color : 'var(--text3)',
                        border: canalSeleccionado === c ? `1px solid ${CANAL_INFO[c].color}` : '1px solid var(--border)' }}>
                      {CANAL_INFO[c].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Método de pago */}
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:10, color:'var(--text3)', marginBottom:6, textTransform:'uppercase', letterSpacing:1 }}>Método de pago</div>
                <div style={{ display:'flex', gap:6 }}>
                  {PAGOS_POR_CANAL[canalSeleccionado].map(m => (
                    <button key={m} onClick={() => setMetodoPago(m)}
                      style={{ padding:'5px 10px', borderRadius:6, fontSize:11, cursor:'pointer', fontWeight:500,
                        background: metodoPago === m ? 'rgba(200,241,53,0.12)' : 'var(--surface2)',
                        color: metodoPago === m ? 'var(--accent)' : 'var(--text3)',
                        border: metodoPago === m ? '1px solid rgba(200,241,53,0.4)' : '1px solid var(--border)' }}>
                      {PAGO_LABEL[m]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selector de productos */}
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:10, color:'var(--text3)', marginBottom:8, textTransform:'uppercase', letterSpacing:1 }}>Productos</div>
                {categorias.map(cat => (
                  <div key={cat} style={{ marginBottom:10 }}>
                    <div style={{ fontSize:10, color:'var(--text3)', marginBottom:4 }}>{cat}</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                      {productos.filter(p => p.categoria === cat).map(prod => {
                        const seleccionado = itemsSeleccionados.find(i => i.producto.id === prod.id)
                        return (
                          <button key={prod.id} onClick={() => agregarItem(prod)}
                            style={{ padding:'4px 10px', borderRadius:6, fontSize:11, cursor:'pointer', fontWeight:500,
                              background: seleccionado ? 'rgba(200,241,53,0.12)' : 'var(--surface2)',
                              color: seleccionado ? 'var(--accent)' : prod.stock_actual <= 3 ? '#ff5c4d' : 'var(--text2)',
                              border: seleccionado ? '1px solid rgba(200,241,53,0.4)' : '1px solid var(--border)' }}>
                            {prod.nombre}
                            {seleccionado && <span style={{ fontWeight:700 }}> ×{seleccionado.cantidad}</span>}
                            {prod.stock_actual <= 3 && !seleccionado && <span style={{ fontSize:9, marginLeft:4 }}>({prod.stock_actual})</span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Items seleccionados */}
              {itemsSeleccionados.length > 0 && (
                <div style={{ marginBottom:14, background:'var(--surface2)', borderRadius:8, padding:10 }}>
                  {itemsSeleccionados.map(item => (
                    <div key={item.producto.id} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                      <span style={{ flex:1, fontSize:12, color:'var(--text)' }}>{item.producto.nombre}</span>
                      <button onClick={() => cambiarCantidad(item.producto.id, -1)}
                        style={{ width:22, height:22, borderRadius:4, border:'1px solid var(--border)', background:'var(--surface)', color:'var(--text)', cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                      <span style={{ fontSize:13, fontWeight:600, color:'var(--accent)', minWidth:20, textAlign:'center' }}>{item.cantidad}</span>
                      <button onClick={() => cambiarCantidad(item.producto.id, 1)}
                        style={{ width:22, height:22, borderRadius:4, border:'1px solid var(--border)', background:'var(--surface)', color:'var(--text)', cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
                      <button onClick={() => quitarItem(item.producto.id)}
                        style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:14, padding:'0 2px' }}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Total */}
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:10, color:'var(--text3)', marginBottom:6, textTransform:'uppercase', letterSpacing:1 }}>Total ($)</div>
                <input value={totalManual} onChange={e => setTotalManual(e.target.value)}
                  type="number" placeholder={`${totalCalculado || '0'}`}
                  style={{ width:'100%', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, padding:'8px 12px', color:'var(--text)', fontSize:14, outline:'none', boxSizing:'border-box', fontWeight:600 }} />
                <div style={{ fontSize:10, color:'var(--text3)', marginTop:4 }}>
                  Deja vacío para usar el total calculado por producto
                </div>
              </div>

              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => { setShowNuevoPedido(false); setItemsSeleccionados([]); setTotalManual('') }}
                  style={{ flex:1, padding:'10px', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, cursor:'pointer', color:'var(--text2)', fontSize:12 }}>
                  Cancelar
                </button>
                <button onClick={agregarPedido} disabled={guardando || itemsSeleccionados.length === 0}
                  style={{ flex:1, padding:'10px', background: guardando ? 'var(--surface2)' : 'var(--accent)', border:'none', borderRadius:8, cursor: guardando ? 'not-allowed' : 'pointer', color:'#0e0f0c', fontSize:12, fontWeight:700, opacity: guardando ? 0.6 : 1 }}>
                  {guardando ? 'Guardando...' : `Registrar · $${totalManual || totalCalculado}`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal cierre */}
        {showCierre && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:24, width:360 }}>
              <div style={{ fontSize:15, fontWeight:600, marginBottom:8 }}>¿Cerrar turno?</div>
              <div style={{ fontSize:12, color:'var(--text3)', marginBottom:16 }}>Resumen del turno:</div>
              {[
                { label:'Venta total',   val:`$${totalVentas.toLocaleString()}` },
                { label:'Gastos',        val:`-$${totalGastos.toLocaleString()}` },
                { label:'Margen neto',   val:`$${margenNeto.toLocaleString()}` },
                { label:'Total pedidos', val:`${ventas.length}` },
              ].map((r,i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid var(--border)', fontSize:13 }}>
                  <span style={{ color:'var(--text2)' }}>{r.label}</span>
                  <span style={{ fontWeight:600 }}>{r.val}</span>
                </div>
              ))}
              <div style={{ display:'flex', gap:8, marginTop:16 }}>
                <button onClick={() => setShowCierre(false)}
                  style={{ flex:1, padding:'10px', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, cursor:'pointer', color:'var(--text2)', fontSize:12 }}>
                  Cancelar
                </button>
                <button onClick={() => { setTurnoActivo(false); setShowCierre(false); localStorage.removeItem('turno_activo') }}
                  style={{ flex:1, padding:'10px', background:'rgba(255,92,77,0.2)', border:'1px solid rgba(255,92,77,0.4)', borderRadius:8, cursor:'pointer', color:'#ff5c4d', fontSize:12, fontWeight:700 }}>
                  Cerrar turno
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}