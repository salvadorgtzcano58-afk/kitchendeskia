'use client'
import { useState } from 'react'
import Sidebar from '@/components/Sidebar'

type Producto = {
  id: number
  nombre: string
  unidad: string
  stock_actual: number
  requerido_diario: number
  proveedor: string
}

type Pan = {
  id: number
  sabor: string
  piezas: number
}

const DATA: Producto[] = [
  { id:1,  nombre:'Leche',            unidad:'lt',    stock_actual:1.1,   requerido_diario:1,     proveedor:'Lácteos' },
  { id:2,  nombre:'Costillas',        unidad:'bolsa', stock_actual:6,     requerido_diario:1,     proveedor:'Cárnicos' },
  { id:3,  nombre:'Pollo',            unidad:'bolsa', stock_actual:5,     requerido_diario:2,     proveedor:'Cárnicos' },
  { id:4,  nombre:'Cebolla',          unidad:'pza',   stock_actual:1.5,   requerido_diario:0.5,   proveedor:'Verduras' },
  { id:5,  nombre:'Habanero',         unidad:'pza',   stock_actual:3,     requerido_diario:3,     proveedor:'Verduras' },
  { id:6,  nombre:'Aceite',           unidad:'lt',    stock_actual:0.5,   requerido_diario:0.5,   proveedor:'Abarrotes' },
  { id:7,  nombre:'Sal con ajo',      unidad:'bote',  stock_actual:0.5,   requerido_diario:0.1,   proveedor:'Abarrotes' },
  { id:8,  nombre:'Cebollín',         unidad:'pza',   stock_actual:5,     requerido_diario:2.5,   proveedor:'Verduras' },
  { id:9,  nombre:'Salsa de soya',    unidad:'lt',    stock_actual:0.5,   requerido_diario:0.5,   proveedor:'Abarrotes' },
  { id:10, nombre:'Salsa inglesa',    unidad:'lt',    stock_actual:1,     requerido_diario:0.5,   proveedor:'Abarrotes' },
  { id:11, nombre:'Limón',            unidad:'pza',   stock_actual:1000,  requerido_diario:1,     proveedor:'Verduras' },
  { id:12, nombre:'Tocino',           unidad:'gr',    stock_actual:125,   requerido_diario:100,   proveedor:'Cárnicos' },
  { id:13, nombre:'Mezcla de quesos', unidad:'gr',    stock_actual:1117,  requerido_diario:90,    proveedor:'Lácteos' },
  { id:14, nombre:'Harina',           unidad:'gr',    stock_actual:2000,  requerido_diario:135,   proveedor:'Abarrotes' },
  { id:15, nombre:'Maicena',          unidad:'gr',    stock_actual:190,   requerido_diario:15,    proveedor:'Abarrotes' },
  { id:16, nombre:'Huevo',            unidad:'pza',   stock_actual:30,    requerido_diario:1,     proveedor:'Lácteos' },
  { id:17, nombre:'Azúcar',           unidad:'gr',    stock_actual:2000,  requerido_diario:500,   proveedor:'Abarrotes' },
  { id:18, nombre:'Zanahoria',        unidad:'pza',   stock_actual:4,     requerido_diario:2,     proveedor:'Verduras' },
  { id:19, nombre:'Calabaza',         unidad:'pza',   stock_actual:3,     requerido_diario:2,     proveedor:'Verduras' },
  { id:20, nombre:'Elote',            unidad:'gr',    stock_actual:117,   requerido_diario:30,    proveedor:'Verduras' },
  { id:21, nombre:'Vinagre blanco',   unidad:'lt',    stock_actual:2.5,   requerido_diario:0.5,   proveedor:'Abarrotes' },
  { id:22, nombre:'Catsup',           unidad:'ml',    stock_actual:700,   requerido_diario:120,   proveedor:'Abarrotes' },
  { id:23, nombre:'Ajo',              unidad:'gr',    stock_actual:115,   requerido_diario:20,    proveedor:'Verduras' },
  { id:24, nombre:'Jengibre',         unidad:'gr',    stock_actual:40,    requerido_diario:20,    proveedor:'Verduras' },
  { id:25, nombre:'Salsa de humo',    unidad:'lt',    stock_actual:1,     requerido_diario:0.015, proveedor:'Abarrotes' },
]

const PANES_INICIALES: Pan[] = [
  { id:1,  sabor:'Nutella',              piezas:30 },
  { id:2,  sabor:'Fresas con crema',     piezas:12 },
  { id:3,  sabor:'Zarzamora con queso',  piezas:12 },
  { id:4,  sabor:'Hersheys',             piezas:12 },
  { id:5,  sabor:'Moka',                 piezas:12 },
  { id:6,  sabor:'Mango con queso',      piezas:12 },
  { id:7,  sabor:'Arroz con leche',      piezas:12 },
  { id:8,  sabor:'Duvalín',              piezas:6 },
  { id:9,  sabor:'Frambuesa con queso',  piezas:6 },
  { id:10, sabor:'Nuez',                 piezas:6 },
  { id:11, sabor:'Taro',                 piezas:6 },
  { id:12, sabor:'Panditas',             piezas:6 },
  { id:13, sabor:'Manzana',              piezas:6 },
  { id:14, sabor:'Gansito',              piezas:6 },
  { id:15, sabor:'Chococereza',          piezas:6 },
  { id:16, sabor:'Carlos V',             piezas:6 },
  { id:17, sabor:'Mora azul',            piezas:6 },
  { id:18, sabor:'Crema pastelera',      piezas:6 },
  { id:19, sabor:'Chocolate abuelita',   piezas:6 },
  { id:20, sabor:'Oreo',                 piezas:6 },
  { id:21, sabor:'Chocomenta',           piezas:3 },
  { id:22, sabor:'Maracuyá',             piezas:3 },
  { id:23, sabor:'Bubulubu',             piezas:3 },
  { id:24, sabor:'Pay de limón',         piezas:2 },
]

function dias(p: Producto) {
  if (p.requerido_diario === 0) return 99
  return Math.floor(p.stock_actual / p.requerido_diario)
}

function status(d: number) {
  if (d >= 4) return 'verde'
  if (d >= 2) return 'amarillo'
  return 'rojo'
}

function panStatus(piezas: number) {
  if (piezas >= 10) return 'verde'
  if (piezas >= 4) return 'amarillo'
  return 'rojo'
}

const S = {
  verde:    { bg:'rgba(77,255,176,0.12)',  color:'#4dffb0', label:'✓ OK' },
  amarillo: { bg:'rgba(255,154,60,0.12)',  color:'#ff9a3c', label:'⚠ Bajo' },
  rojo:     { bg:'rgba(255,92,77,0.15)',   color:'#ff5c4d', label:'✕ Crítico' },
}

export default function InventarioPage() {
  const [productos, setProductos] = useState<Producto[]>(DATA)
  const [panes, setPanes] = useState<Pan[]>(PANES_INICIALES)
  const [filtro, setFiltro] = useState('todos')
  const [editando, setEditando] = useState<number|null>(null)
  const [nuevoStock, setNuevoStock] = useState('')
  const [editandoPan, setEditandoPan] = useState<number|null>(null)
  const [nuevasPiezas, setNuevasPiezas] = useState('')
  const [vista, setVista] = useState<'insumos'|'panes'>('panes')

  const filtrados = productos.filter(p => {
    if (filtro === 'todos') return true
    return status(dias(p)) === filtro
  })

  const counts = {
    rojo: productos.filter(p => status(dias(p)) === 'rojo').length,
    amarillo: productos.filter(p => status(dias(p)) === 'amarillo').length,
    verde: productos.filter(p => status(dias(p)) === 'verde').length,
  }

  const totalPanes = panes.reduce((a, p) => a + p.piezas, 0)
  const panesCriticos = panes.filter(p => panStatus(p.piezas) === 'rojo').length

  const guardar = (id: number) => {
    const val = parseFloat(nuevoStock)
    if (isNaN(val)) return
    setProductos(prev => prev.map(p => p.id === id ? { ...p, stock_actual: val } : p))
    setEditando(null)
    setNuevoStock('')
  }

  const guardarPan = (id: number) => {
    const val = parseInt(nuevasPiezas)
    if (isNaN(val)) return
    setPanes(prev => prev.map(p => p.id === id ? { ...p, piezas: val } : p))
    setEditandoPan(null)
    setNuevasPiezas('')
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
            <div style={{ fontSize:11, color:'var(--text3)', marginTop:1 }}>Próximo surtido: miércoles · en {diasMiercoles} días</div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {[
              { key:'rojo',     label:`${counts.rojo} críticos`,  color:'#ff5c4d', bg:'rgba(255,92,77,0.12)' },
              { key:'amarillo', label:`${counts.amarillo} bajos`, color:'#ff9a3c', bg:'rgba(255,154,60,0.12)' },
              { key:'verde',    label:`${counts.verde} OK`,       color:'#4dffb0', bg:'rgba(77,255,176,0.1)' },
            ].map(s => (
              <div key={s.key} onClick={() => setFiltro(filtro === s.key ? 'todos' : s.key)}
                style={{ padding:'5px 12px', borderRadius:20, fontSize:11, background:s.bg, color:s.color, cursor:'pointer', fontWeight:500, border: filtro === s.key ? `1px solid ${s.color}` : '1px solid transparent' }}>
                {s.label}
              </div>
            ))}
          </div>
        </div>

        {/* Tabs vista */}
        <div style={{ display:'flex', borderBottom:'1px solid var(--border)', background:'var(--surface)', padding:'0 24px', gap:4 }}>
          {[
            { key:'panes',   label:`🥐 Panes al vapor · ${totalPanes} pzas · ${panesCriticos} críticos` },
            { key:'insumos', label:`📦 Insumos · ${counts.rojo} críticos` },
          ].map(t => (
            <div key={t.key} onClick={() => setVista(t.key as 'insumos'|'panes')}
              style={{ padding:'10px 16px', fontSize:12, cursor:'pointer', color: vista === t.key ? 'var(--accent)' : 'var(--text3)', borderBottom: vista === t.key ? '2px solid var(--accent)' : '2px solid transparent', fontWeight: vista === t.key ? 500 : 400 }}>
              {t.label}
            </div>
          ))}
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'16px 24px' }}>

          {/* PANES */}
          {vista === 'panes' && (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:10, marginBottom:16 }}>
                {panes.map(p => {
                  const st = S[panStatus(p.piezas) as keyof typeof S]
                  const isEdit = editandoPan === p.id
                  return (
                    <div key={p.id} style={{ background:'var(--surface)', border:`1px solid ${st.color}33`, borderRadius:10, padding:'12px 14px', position:'relative' }}>
                      <div style={{ fontSize:11, color:'var(--text2)', marginBottom:6, fontWeight:500 }}>{p.sabor}</div>
                      {isEdit ? (
                        <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                          <input autoFocus type="number" defaultValue={p.piezas}
                            onChange={e => setNuevasPiezas(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && guardarPan(p.id)}
                            style={{ width:60, background:'var(--surface2)', border:'1px solid var(--accent)', borderRadius:6, padding:'4px 6px', color:'var(--text)', fontSize:13, outline:'none' }} />
                          <button onClick={() => guardarPan(p.id)} style={{ padding:'4px 8px', background:'var(--accent)', border:'none', borderRadius:6, fontSize:11, cursor:'pointer', color:'#0e0f0c', fontWeight:600 }}>✓</button>
                          <button onClick={() => setEditandoPan(null)} style={{ padding:'4px 6px', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, fontSize:11, cursor:'pointer', color:'var(--text2)' }}>✕</button>
                        </div>
                      ) : (
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                          <div style={{ fontSize:26, fontWeight:700, color:st.color, lineHeight:1 }}>{p.piezas}</div>
                          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                            <span style={{ fontSize:9, padding:'2px 6px', borderRadius:4, background:st.bg, color:st.color }}>{st.label}</span>
                            <div style={{ display:'flex', gap:3 }}>
                              <button onClick={() => { setPanes(prev => prev.map(x => x.id === p.id ? {...x, piezas: Math.max(0, x.piezas-1)} : x)) }}
                                style={{ width:20, height:20, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:4, cursor:'pointer', color:'var(--text2)', fontSize:12, display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                              <button onClick={() => { setPanes(prev => prev.map(x => x.id === p.id ? {...x, piezas: x.piezas+1} : x)) }}
                                style={{ width:20, height:20, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:4, cursor:'pointer', color:'var(--text2)', fontSize:12, display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
                              <button onClick={() => { setEditandoPan(p.id); setNuevasPiezas(String(p.piezas)) }}
                                style={{ width:20, height:20, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:4, cursor:'pointer', color:'var(--text2)', fontSize:10, display:'flex', alignItems:'center', justifyContent:'center' }}>✎</button>
                            </div>
                          </div>
                        </div>
                      )}
                      <div style={{ fontSize:9, color:'var(--text3)', marginTop:6 }}>piezas disponibles</div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* INSUMOS */}
          {vista === 'insumos' && (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid var(--border)' }}>
                  {['Insumo','Stock actual','Req. diario','Días restantes','Estado','Proveedor',''].map(h => (
                    <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1, fontWeight:500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.map(p => {
                  const d = dias(p)
                  const st = S[status(d) as keyof typeof S]
                  const isEdit = editando === p.id
                  return (
                    <tr key={p.id} style={{ borderBottom:'1px solid var(--border)' }}>
                      <td style={{ padding:'10px 12px', fontSize:13, fontWeight:500 }}>{p.nombre}</td>
                      <td style={{ padding:'10px 12px', fontSize:13 }}>
                        {isEdit
                          ? <input autoFocus type="number" defaultValue={p.stock_actual} onChange={e => setNuevoStock(e.target.value)} onKeyDown={e => e.key === 'Enter' && guardar(p.id)} style={{ width:80, background:'var(--surface2)', border:'1px solid var(--accent)', borderRadius:6, padding:'4px 8px', color:'var(--text)', fontSize:12, outline:'none' }} />
                          : `${p.stock_actual} ${p.unidad}`
                        }
                      </td>
                      <td style={{ padding:'10px 12px', fontSize:12, color:'var(--text2)' }}>{p.requerido_diario} {p.unidad}</td>
                      <td style={{ padding:'10px 12px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ width:80, height:4, background:'var(--surface3)', borderRadius:2, overflow:'hidden' }}>
                            <div style={{ width:`${Math.min(100,(d/7)*100)}%`, height:'100%', background:st.color, borderRadius:2 }} />
                          </div>
                          <span style={{ fontSize:12, color:st.color, fontWeight:500 }}>{d >= 99 ? '∞' : `${d}d`}</span>
                        </div>
                      </td>
                      <td style={{ padding:'10px 12px' }}>
                        <span style={{ fontSize:10, padding:'3px 8px', borderRadius:6, background:st.bg, color:st.color, fontWeight:500 }}>{st.label}</span>
                      </td>
                      <td style={{ padding:'10px 12px', fontSize:11, color:'var(--text3)' }}>{p.proveedor}</td>
                      <td style={{ padding:'10px 12px' }}>
                        {isEdit
                          ? <div style={{ display:'flex', gap:4 }}>
                              <button onClick={() => guardar(p.id)} style={{ padding:'4px 10px', background:'var(--accent)', border:'none', borderRadius:6, fontSize:11, cursor:'pointer', color:'#0e0f0c', fontWeight:600 }}>✓</button>
                              <button onClick={() => setEditando(null)} style={{ padding:'4px 10px', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, fontSize:11, cursor:'pointer', color:'var(--text2)' }}>✕</button>
                            </div>
                          : <button onClick={() => setEditando(p.id)} style={{ padding:'4px 10px', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, fontSize:11, cursor:'pointer', color:'var(--text2)' }}>Actualizar</button>
                        }
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}