'use client'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Producto = {
  id: string
  nombre: string
  categoria: string
  stock_actual: number
  unidad: string | null
  requerido_diario: number | null
  proveedor: string | null
}

function status(stock: number): 'rojo' | 'amarillo' | 'verde' {
  if (stock <= 5) return 'rojo'
  if (stock <= 10) return 'amarillo'
  return 'verde'
}

const S = {
  verde:    { bg:'rgba(77,255,176,0.12)',  color:'#4dffb0', label:'✓ OK' },
  amarillo: { bg:'rgba(255,154,60,0.12)',  color:'#ff9a3c', label:'⚠ Bajo' },
  rojo:     { bg:'rgba(255,92,77,0.15)',   color:'#ff5c4d', label:'✕ Crítico' },
}

export default function InventarioPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState('todos')
  const [editando, setEditando] = useState<string | null>(null)
  const [nuevoStock, setNuevoStock] = useState('')
  const [vista, setVista] = useState<'insumos' | 'panes'>('panes')

  useEffect(() => {
    setCargando(true)
    supabase
      .from('productos')
      .select('id, nombre, categoria, stock_actual, unidad, requerido_diario, proveedor')
      .eq('activo', true)
      .order('categoria')
      .order('nombre')
      .then(({ data, error }) => {
        if (error) console.error('Error cargando inventario:', error)
        if (data) setProductos(data)
        setCargando(false)
      })
  }, [])

  const esPan = (p: Producto) =>
    p.categoria.toLowerCase().includes('pan') &&
    !p.nombre.toLowerCase().includes('amigos') &&
    !p.nombre.toLowerCase().includes('familiar')

  const panes = productos.filter(esPan)
  const insumos = productos.filter(p => !esPan(p))

  const counts = {
    rojo:     insumos.filter(p => status(p.stock_actual) === 'rojo').length,
    amarillo: insumos.filter(p => status(p.stock_actual) === 'amarillo').length,
    verde:    insumos.filter(p => status(p.stock_actual) === 'verde').length,
  }

  const totalPanes = panes.reduce((a, p) => a + p.stock_actual, 0)
  const panesCriticos = panes.filter(p => status(p.stock_actual) === 'rojo').length

  const insumosFiltrados = insumos.filter(p => {
    if (filtro === 'todos') return true
    return status(p.stock_actual) === filtro
  })

  const actualizarStock = async (id: string, nuevoValor: number) => {
    setProductos(prev => prev.map(p => p.id === id ? { ...p, stock_actual: nuevoValor } : p))
    const { error } = await supabase
      .from('productos')
      .update({ stock_actual: nuevoValor })
      .eq('id', id)
    if (error) console.error('Error actualizando stock:', error)
  }

  const guardar = (id: string) => {
    const val = parseFloat(nuevoStock)
    if (isNaN(val) || val < 0) return
    actualizarStock(id, val)
    setEditando(null)
    setNuevoStock('')
  }

  const hoy = new Date()
  const diasMiercoles = (3 - hoy.getDay() + 7) % 7 || 7

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      <Sidebar />
      <main style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Topbar */}
        <div style={{ padding:'14px 24px', borderBottom:'1px solid var(--border)', background:'var(--surface)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontWeight:700, fontSize:16 }}>Inventario</div>
            <div style={{ fontSize:11, color:'var(--text3)', marginTop:1 }}>
              Próximo surtido: miércoles · en {diasMiercoles} días
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {[
              { key:'rojo',     label:`${counts.rojo} críticos`,     color:'#ff5c4d', bg:'rgba(255,92,77,0.12)' },
              { key:'amarillo', label:`${counts.amarillo} bajos`,    color:'#ff9a3c', bg:'rgba(255,154,60,0.12)' },
              { key:'verde',    label:`${counts.verde} OK`,          color:'#4dffb0', bg:'rgba(77,255,176,0.1)' },
            ].map(s => (
              <div key={s.key} onClick={() => setFiltro(filtro === s.key ? 'todos' : s.key)}
                style={{ padding:'5px 12px', borderRadius:20, fontSize:11, background:s.bg, color:s.color, cursor:'pointer', fontWeight:500,
                  border: filtro === s.key ? `1px solid ${s.color}` : '1px solid transparent' }}>
                {s.label}
              </div>
            ))}
          </div>
        </div>

        {/* Tabs vista */}
        <div style={{ display:'flex', borderBottom:'1px solid var(--border)', background:'var(--surface)', padding:'0 24px', gap:4 }}>
          {[
            { key:'panes',   label:`🥐 Panes al vapor · ${Math.round(totalPanes)} pzas · ${panesCriticos} críticos` },
            { key:'insumos', label:`📦 Insumos · ${counts.rojo} críticos` },
          ].map(t => (
            <div key={t.key} onClick={() => setVista(t.key as 'insumos' | 'panes')}
              style={{ padding:'10px 16px', fontSize:12, cursor:'pointer',
                color: vista === t.key ? 'var(--accent)' : 'var(--text3)',
                borderBottom: vista === t.key ? '2px solid var(--accent)' : '2px solid transparent',
                fontWeight: vista === t.key ? 500 : 400 }}>
              {t.label}
            </div>
          ))}
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'16px 24px' }}>

          {cargando && (
            <div style={{ textAlign:'center', padding:'48px 0', color:'var(--text3)', fontSize:13 }}>
              Cargando inventario…
            </div>
          )}

          {/* PANES */}
          {!cargando && vista === 'panes' && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:10 }}>
              {panes.map(p => {
                const st = S[status(p.stock_actual)]
                const isEdit = editando === p.id
                return (
                  <div key={p.id} style={{ background:'var(--surface)', border:`1px solid ${st.color}33`, borderRadius:10, padding:'12px 14px', position:'relative' }}>
                    <div style={{ fontSize:11, color:'var(--text2)', marginBottom:6, fontWeight:500 }}>{p.nombre}</div>
                    {isEdit ? (
                      <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                        <input autoFocus type="number" defaultValue={p.stock_actual}
                          onChange={e => setNuevoStock(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && guardar(p.id)}
                          style={{ width:60, background:'var(--surface2)', border:'1px solid var(--accent)', borderRadius:6, padding:'4px 6px', color:'var(--text)', fontSize:13, outline:'none' }} />
                        <button onClick={() => guardar(p.id)}
                          style={{ padding:'4px 8px', background:'var(--accent)', border:'none', borderRadius:6, fontSize:11, cursor:'pointer', color:'#0e0f0c', fontWeight:600 }}>✓</button>
                        <button onClick={() => setEditando(null)}
                          style={{ padding:'4px 6px', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, fontSize:11, cursor:'pointer', color:'var(--text2)' }}>✕</button>
                      </div>
                    ) : (
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <div style={{ fontSize:26, fontWeight:700, color:st.color, lineHeight:1 }}>{p.stock_actual}</div>
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                          <span style={{ fontSize:9, padding:'2px 6px', borderRadius:4, background:st.bg, color:st.color }}>{st.label}</span>
                          <div style={{ display:'flex', gap:3 }}>
                            <button onClick={() => actualizarStock(p.id, Math.max(0, p.stock_actual - 1))}
                              style={{ width:20, height:20, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:4, cursor:'pointer', color:'var(--text2)', fontSize:12, display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                            <button onClick={() => actualizarStock(p.id, p.stock_actual + 1)}
                              style={{ width:20, height:20, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:4, cursor:'pointer', color:'var(--text2)', fontSize:12, display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
                            <button onClick={() => { setEditando(p.id); setNuevoStock(String(p.stock_actual)) }}
                              style={{ width:20, height:20, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:4, cursor:'pointer', color:'var(--text2)', fontSize:10, display:'flex', alignItems:'center', justifyContent:'center' }}>✎</button>
                          </div>
                        </div>
                      </div>
                    )}
                    <div style={{ fontSize:9, color:'var(--text3)', marginTop:6 }}>piezas disponibles</div>
                  </div>
                )
              })}
              {panes.length === 0 && (
                <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'32px 0', color:'var(--text3)', fontSize:13 }}>
                  Sin panes registrados
                </div>
              )}
            </div>
          )}

          {/* INSUMOS */}
          {!cargando && vista === 'insumos' && (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid var(--border)' }}>
                  {['Insumo', 'Stock actual', 'Req. diario', 'Estado', 'Proveedor', ''].map(h => (
                    <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1, fontWeight:500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {insumosFiltrados.map(p => {
                  const st = S[status(p.stock_actual)]
                  const isEdit = editando === p.id
                  return (
                    <tr key={p.id} style={{ borderBottom:'1px solid var(--border)' }}>
                      <td style={{ padding:'10px 12px', fontSize:13, fontWeight:500 }}>{p.nombre}</td>
                      <td style={{ padding:'10px 12px', fontSize:13 }}>
                        {isEdit ? (
                          <input autoFocus type="number" defaultValue={p.stock_actual}
                            onChange={e => setNuevoStock(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && guardar(p.id)}
                            style={{ width:80, background:'var(--surface2)', border:'1px solid var(--accent)', borderRadius:6, padding:'4px 8px', color:'var(--text)', fontSize:12, outline:'none' }} />
                        ) : (
                          `${p.stock_actual}${p.unidad ? ` ${p.unidad}` : ''}`
                        )}
                      </td>
                      <td style={{ padding:'10px 12px', fontSize:12, color:'var(--text2)' }}>
                        {p.requerido_diario != null ? `${p.requerido_diario}${p.unidad ? ` ${p.unidad}` : ''}` : '—'}
                      </td>
                      <td style={{ padding:'10px 12px' }}>
                        <span style={{ fontSize:10, padding:'3px 8px', borderRadius:6, background:st.bg, color:st.color, fontWeight:500 }}>{st.label}</span>
                      </td>
                      <td style={{ padding:'10px 12px', fontSize:11, color:'var(--text3)' }}>{p.proveedor ?? '—'}</td>
                      <td style={{ padding:'10px 12px' }}>
                        {isEdit ? (
                          <div style={{ display:'flex', gap:4 }}>
                            <button onClick={() => guardar(p.id)}
                              style={{ padding:'4px 10px', background:'var(--accent)', border:'none', borderRadius:6, fontSize:11, cursor:'pointer', color:'#0e0f0c', fontWeight:600 }}>✓</button>
                            <button onClick={() => setEditando(null)}
                              style={{ padding:'4px 10px', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, fontSize:11, cursor:'pointer', color:'var(--text2)' }}>✕</button>
                          </div>
                        ) : (
                          <button onClick={() => { setEditando(p.id); setNuevoStock(String(p.stock_actual)) }}
                            style={{ padding:'4px 10px', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, fontSize:11, cursor:'pointer', color:'var(--text2)' }}>Actualizar</button>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {insumosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding:'32px', textAlign:'center', color:'var(--text3)', fontSize:13 }}>
                      Sin insumos en esta categoría
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}
