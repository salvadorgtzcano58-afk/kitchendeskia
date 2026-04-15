'use client'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'

type Proveedor = {
  id: number
  nombre: string
  apodo: string
  telefono: string
  categoria: 'panes' | 'insumos'
  productos: string[]
  dia_entrega: string
  ultimo_pedido: string
  historial: { fecha: string; items: string; estado: 'entregado' | 'pendiente' }[]
}

const PROVEEDORES: Proveedor[] = [
  {
    id: 1,
    nombre: 'Shaaron',
    apodo: 'Momo',
    telefono: '+52 55 6004 4346',
    categoria: 'panes',
    productos: ['Nutella', 'Fresas con crema', 'Zarzamora con queso', 'Hersheys', 'Moka', 'Mango con queso', 'Arroz con leche', 'Duvalín', 'Frambuesa con queso', 'Nuez', 'Taro', 'Panditas', 'Manzana', 'Gansito', 'Chococereza', 'Carlos V', 'Mora azul', 'Crema pastelera', 'Chocolate abuelita', 'Oreo', 'Chocomenta', 'Maracuyá', 'Bubulubu', 'Pay de limón'],
    dia_entrega: 'Miércoles',
    ultimo_pedido: 'Vie 27 Mar · 3:50 PM',
    historial: [
      { fecha:'Mié 26 Mar', items:'24 sabores · 288 piezas', estado:'entregado' },
      { fecha:'Mié 19 Mar', items:'22 sabores · 264 piezas', estado:'entregado' },
      { fecha:'Mié 12 Mar', items:'24 sabores · 300 piezas', estado:'entregado' },
      { fecha:'Mié 5 Mar',  items:'20 sabores · 240 piezas', estado:'entregado' },
    ]
  },
  {
    id: 2,
    nombre: 'Cristy',
    apodo: '',
    telefono: '+52 462 115 3409',
    categoria: 'insumos',
    productos: ['Leche', 'Costillas', 'Pollo', 'Cebolla', 'Habanero', 'Aceite', 'Sal con ajo', 'Cebollín', 'Salsa de soya', 'Salsa inglesa', 'Limón', 'Tocino', 'Mezcla de quesos', 'Harina', 'Maicena', 'Huevo', 'Azúcar', 'Zanahoria', 'Calabaza', 'Elote', 'Vinagre blanco', 'Catsup', 'Ajo', 'Jengibre', 'Salsa de humo'],
    dia_entrega: 'Miércoles',
    ultimo_pedido: 'Vie 27 Mar · 3:52 PM',
    historial: [
      { fecha:'Mié 26 Mar', items:'8 insumos críticos', estado:'entregado' },
      { fecha:'Mié 19 Mar', items:'10 insumos',         estado:'entregado' },
      { fecha:'Mié 12 Mar', items:'7 insumos',          estado:'entregado' },
      { fecha:'Mié 5 Mar',  items:'9 insumos',          estado:'entregado' },
    ]
  }
]

const CAT_INFO = {
  panes:   { label:'Panes al vapor', color:'#ff9a3c', bg:'rgba(255,154,60,0.12)' },
  insumos: { label:'Insumos',        color:'#5cb8ff', bg:'rgba(92,184,255,0.1)' },
}

export default function ProveedoresPage() {
  const [selected, setSelected] = useState<Proveedor>(PROVEEDORES[0])
  const [tab, setTab] = useState<'productos'|'historial'>('productos')
  const [isMobile, setIsMobile] = useState(false)
  const [showDetail, setShowDetail] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const enviarWhatsApp = (p: Proveedor) => {
    const url = `https://wa.me/${p.telefono.replace(/\s|\+/g,'')}`
    window.open(url, '_blank')
  }

  const irRequisicion = () => {
    window.location.href = '/requisiciones'
  }

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      <Sidebar />
      <main style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Topbar */}
        <div style={{ padding:'14px 24px', borderBottom:'1px solid var(--border)', background:'var(--surface)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontWeight:700, fontSize:16 }}>Proveedores</div>
            <div style={{ fontSize:11, color:'var(--text3)', marginTop:1 }}>Directorio · historial de requisiciones · contacto directo</div>
          </div>
        </div>

        <div style={{ flex:1, display:'grid', gridTemplateColumns: isMobile ? '1fr' : '280px 1fr', overflow:'hidden' }}>

          {/* Lista proveedores */}
          <div style={{ display: isMobile && showDetail ? 'none' : 'flex', borderRight:'1px solid var(--border)', overflowY:'auto', padding:12, flexDirection:'column', gap:8 }}>
            {PROVEEDORES.map(p => {
              const cat = CAT_INFO[p.categoria]
              const isSelected = selected.id === p.id
              return (
                <div key={p.id} onClick={() => { setSelected(p); setShowDetail(true) }}
                  style={{ padding:'14px 16px', borderRadius:10, cursor:'pointer', background: isSelected ? 'var(--surface3)' : 'var(--surface)', border: isSelected ? '1px solid rgba(200,241,53,0.3)' : '1px solid var(--border)', transition:'all 0.15s' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                    <div style={{ width:40, height:40, borderRadius:'50%', background:cat.bg, border:`1px solid ${cat.color}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, color:cat.color, fontFamily:'system-ui' }}>
                      {p.nombre[0]}
                    </div>
                    <div>
                      <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>
                        {p.nombre} {p.apodo && <span style={{ fontSize:11, color:'var(--text3)', fontWeight:400 }}>({p.apodo})</span>}
                      </div>
                      <span style={{ fontSize:10, padding:'2px 6px', borderRadius:4, background:cat.bg, color:cat.color }}>{cat.label}</span>
                    </div>
                  </div>
                  <div style={{ fontSize:11, color:'var(--text3)', display:'flex', flexDirection:'column', gap:3 }}>
                    <span>📞 {p.telefono}</span>
                    <span>📅 Entrega: {p.dia_entrega}</span>
                    <span>📦 {p.productos.length} productos</span>
                  </div>
                  {isSelected && (
                    <div style={{ marginTop:10, display:'flex', gap:6 }}>
                      <button onClick={e => { e.stopPropagation(); enviarWhatsApp(p) }}
                        style={{ flex:1, padding:'7px', background:'#25D366', border:'none', borderRadius:8, cursor:'pointer', color:'#fff', fontSize:11, fontWeight:600 }}>
                        💬 WhatsApp
                      </button>
                      <button onClick={e => { e.stopPropagation(); irRequisicion() }}
                        style={{ flex:1, padding:'7px', background:'var(--accent)', border:'none', borderRadius:8, cursor:'pointer', color:'#0e0f0c', fontSize:11, fontWeight:600 }}>
                        🛒 Requisición
                      </button>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Próximo surtido */}
            <div style={{ marginTop:8, padding:'12px 14px', background:'rgba(200,241,53,0.06)', border:'1px solid rgba(200,241,53,0.15)', borderRadius:10 }}>
              <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>Próximo surtido</div>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--accent)' }}>Miércoles 1 Abril</div>
              <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>En 4 días · ambos proveedores</div>
            </div>
          </div>

          {/* Detalle proveedor */}
          <div style={{ display: isMobile && !showDetail ? 'none' : 'block', overflowY:'auto', padding:'20px 24px' }}>
            {isMobile && (
              <button onClick={() => setShowDetail(false)}
                style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', color:'var(--accent)', cursor:'pointer', fontSize:13, fontWeight:500, marginBottom:16, padding:0 }}>
                ← Proveedores
              </button>
            )}
            <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20 }}>
              <div style={{ width:56, height:56, borderRadius:'50%', background:CAT_INFO[selected.categoria].bg, border:`2px solid ${CAT_INFO[selected.categoria].color}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:700, color:CAT_INFO[selected.categoria].color, fontFamily:'system-ui' }}>
                {selected.nombre[0]}
              </div>
              <div>
                <div style={{ fontSize:20, fontWeight:700, color:'var(--text)' }}>
                  {selected.nombre} {selected.apodo && <span style={{ fontSize:14, color:'var(--text3)', fontWeight:400 }}>({selected.apodo})</span>}
                </div>
                <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{selected.telefono} · Entrega los {selected.dia_entrega}s</div>
                <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>Último pedido enviado: {selected.ultimo_pedido}</div>
              </div>
              <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
                <button onClick={() => enviarWhatsApp(selected)}
                  style={{ padding:'8px 16px', background:'#25D366', border:'none', borderRadius:8, cursor:'pointer', color:'#fff', fontSize:12, fontWeight:600 }}>
                  💬 Abrir WhatsApp
                </button>
                <button onClick={irRequisicion}
                  style={{ padding:'8px 16px', background:'var(--accent)', border:'none', borderRadius:8, cursor:'pointer', color:'#0e0f0c', fontSize:12, fontWeight:600 }}>
                  🛒 Nueva requisición
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom:16, gap:4 }}>
              {[
                { key:'productos', label:`📦 Productos (${selected.productos.length})` },
                { key:'historial', label:`📋 Historial de pedidos` },
              ].map(t => (
                <div key={t.key} onClick={() => setTab(t.key as any)}
                  style={{ padding:'8px 16px', fontSize:12, cursor:'pointer', color: tab === t.key ? 'var(--accent)' : 'var(--text3)', borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent', fontWeight: tab === t.key ? 500 : 400 }}>
                  {t.label}
                </div>
              ))}
            </div>

            {/* Productos */}
            {tab === 'productos' && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:8 }}>
                {selected.productos.map((prod, i) => (
                  <div key={i} style={{ padding:'8px 12px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, fontSize:12, color:'var(--text2)' }}>
                    {prod}
                  </div>
                ))}
              </div>
            )}

            {/* Historial */}
            {tab === 'historial' && (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {selected.historial.map((h, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:16, padding:'12px 16px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:'#4dffb0', minWidth:8 }} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:500, color:'var(--text)' }}>{h.fecha}</div>
                      <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{h.items}</div>
                    </div>
                    <span style={{ fontSize:10, padding:'3px 8px', borderRadius:6, background:'rgba(77,255,176,0.12)', color:'#4dffb0', fontWeight:500 }}>
                      ✓ {h.estado}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}