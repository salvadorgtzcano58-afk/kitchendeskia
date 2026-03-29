'use client'
import { useState } from 'react'
import Sidebar from '@/components/Sidebar'

type ItemReq = {
  id: number
  nombre: string
  unidad: string
  stock_actual: number
  requerido_diario: number
  cantidad_pedir: number
  incluir: boolean
}

type Pan = {
  id: number
  sabor: string
  piezas: number
  cantidad_pedir: number
  incluir: boolean
}

const INSUMOS_CRITICOS: ItemReq[] = [
  { id:1,  nombre:'Leche',            unidad:'lt',    stock_actual:1.1,  requerido_diario:1,    cantidad_pedir:7,   incluir:true },
  { id:5,  nombre:'Habanero',         unidad:'pza',   stock_actual:3,    requerido_diario:3,    cantidad_pedir:21,  incluir:true },
  { id:6,  nombre:'Aceite',           unidad:'lt',    stock_actual:0.5,  requerido_diario:0.5,  cantidad_pedir:4,   incluir:true },
  { id:9,  nombre:'Salsa de soya',    unidad:'lt',    stock_actual:0.5,  requerido_diario:0.5,  cantidad_pedir:4,   incluir:true },
  { id:12, nombre:'Tocino',           unidad:'gr',    stock_actual:125,  requerido_diario:100,  cantidad_pedir:700, incluir:true },
  { id:8,  nombre:'Cebollín',         unidad:'pza',   stock_actual:5,    requerido_diario:2.5,  cantidad_pedir:18,  incluir:true },
  { id:3,  nombre:'Pollo',            unidad:'bolsa', stock_actual:5,    requerido_diario:2,    cantidad_pedir:14,  incluir:true },
  { id:24, nombre:'Jengibre',         unidad:'gr',    stock_actual:40,   requerido_diario:20,   cantidad_pedir:140, incluir:true },
]

const PANES: Pan[] = [
  { id:1,  sabor:'Nutella',             piezas:30, cantidad_pedir:12, incluir:false },
  { id:2,  sabor:'Fresas con crema',    piezas:12, cantidad_pedir:12, incluir:true },
  { id:3,  sabor:'Zarzamora con queso', piezas:12, cantidad_pedir:12, incluir:true },
  { id:4,  sabor:'Hersheys',            piezas:12, cantidad_pedir:12, incluir:true },
  { id:5,  sabor:'Moka',                piezas:12, cantidad_pedir:12, incluir:true },
  { id:6,  sabor:'Mango con queso',     piezas:12, cantidad_pedir:12, incluir:true },
  { id:7,  sabor:'Arroz con leche',     piezas:12, cantidad_pedir:12, incluir:true },
  { id:8,  sabor:'Duvalín',             piezas:6,  cantidad_pedir:12, incluir:true },
  { id:9,  sabor:'Frambuesa con queso', piezas:6,  cantidad_pedir:12, incluir:true },
  { id:10, sabor:'Nuez',                piezas:6,  cantidad_pedir:12, incluir:true },
  { id:11, sabor:'Taro',                piezas:6,  cantidad_pedir:12, incluir:true },
  { id:12, sabor:'Panditas',            piezas:6,  cantidad_pedir:12, incluir:true },
  { id:13, sabor:'Manzana',             piezas:6,  cantidad_pedir:12, incluir:true },
  { id:14, sabor:'Gansito',             piezas:6,  cantidad_pedir:12, incluir:true },
  { id:15, sabor:'Chococereza',         piezas:6,  cantidad_pedir:12, incluir:true },
  { id:16, sabor:'Carlos V',            piezas:6,  cantidad_pedir:12, incluir:true },
  { id:17, sabor:'Mora azul',           piezas:6,  cantidad_pedir:12, incluir:true },
  { id:18, sabor:'Crema pastelera',     piezas:6,  cantidad_pedir:12, incluir:true },
  { id:19, sabor:'Chocolate abuelita',  piezas:6,  cantidad_pedir:12, incluir:true },
  { id:20, sabor:'Oreo',                piezas:6,  cantidad_pedir:12, incluir:true },
  { id:21, sabor:'Chocomenta',          piezas:3,  cantidad_pedir:12, incluir:true },
  { id:22, sabor:'Maracuyá',            piezas:3,  cantidad_pedir:12, incluir:true },
  { id:23, sabor:'Bubulubu',            piezas:3,  cantidad_pedir:12, incluir:true },
  { id:24, sabor:'Pay de limón',        piezas:2,  cantidad_pedir:12, incluir:true },
]

const hoy = new Date().toLocaleDateString('es-MX', { weekday:'long', year:'numeric', month:'long', day:'numeric' })

function generarMensajePanes(panes: Pan[]) {
  const seleccionados = panes.filter(p => p.incluir)
  const lista = seleccionados.map(p => `• ${p.sabor}: ${p.cantidad_pedir} pzas`).join('\n')
  const total = seleccionados.reduce((a, p) => a + p.cantidad_pedir, 0)
  return `🥐 *PEDIDO PANEKI NEKO*\n📅 ${hoy}\n\nHola Shaaron! Te paso el pedido de esta semana:\n\n${lista}\n\n*Total: ${total} piezas*\n\nQuedamos pendientes, muchas gracias! 🙏`
}

function generarMensajeInsumos(insumos: ItemReq[]) {
  const seleccionados = insumos.filter(i => i.incluir)
  const lista = seleccionados.map(i => `• ${i.nombre}: ${i.cantidad_pedir} ${i.unidad}`).join('\n')
  return `🛒 *PEDIDO INSUMOS PANEKI NEKO*\n📅 ${hoy}\n\nHola Cristy! Te paso lo que necesitamos:\n\n${lista}\n\n¿Puedes surtir para el miércoles? Muchas gracias! 🙏`
}

export default function RequisicionesPage() {
  const [insumos, setInsumos] = useState<ItemReq[]>(INSUMOS_CRITICOS)
  const [panes, setPanes] = useState<Pan[]>(PANES)
  const [tab, setTab] = useState<'panes'|'insumos'>('panes')
  const [enviado, setEnviado] = useState<'panes'|'insumos'|null>(null)

  const toggleInsumo = (id: number) => setInsumos(prev => prev.map(i => i.id === id ? {...i, incluir: !i.incluir} : i))
  const togglePan = (id: number) => setPanes(prev => prev.map(p => p.id === id ? {...p, incluir: !p.incluir} : p))
  const updateCantidadInsumo = (id: number, val: number) => setInsumos(prev => prev.map(i => i.id === id ? {...i, cantidad_pedir: val} : i))
  const updateCantidadPan = (id: number, val: number) => setPanes(prev => prev.map(p => p.id === id ? {...p, cantidad_pedir: val} : p))

  const enviarWhatsApp = (tipo: 'panes'|'insumos') => {
    const numero = tipo === 'panes' ? '525560044346' : '524621153409'
    const mensaje = tipo === 'panes' ? generarMensajePanes(panes) : generarMensajeInsumos(insumos)
    const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`
    window.open(url, '_blank')
    setEnviado(tipo)
  }

  const panesSeleccionados = panes.filter(p => p.incluir)
  const totalPanes = panesSeleccionados.reduce((a, p) => a + p.cantidad_pedir, 0)
  const insumosSeleccionados = insumos.filter(i => i.incluir)

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      <Sidebar />
      <main style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Topbar */}
        <div style={{ padding:'14px 24px', borderBottom:'1px solid var(--border)', background:'var(--surface)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontWeight:700, fontSize:16 }}>Requisiciones</div>
            <div style={{ fontSize:11, color:'var(--text3)', marginTop:1 }}>Surtido semanal · miércoles · revisa y envía por WhatsApp</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'1px solid var(--border)', background:'var(--surface)', padding:'0 24px' }}>
          {[
            { key:'panes',   label:`🥐 Panes al vapor — Shaaron (Momo)` },
            { key:'insumos', label:`🛒 Insumos — Cristy` },
          ].map(t => (
            <div key={t.key} onClick={() => setTab(t.key as 'panes'|'insumos')}
              style={{ padding:'10px 16px', fontSize:12, cursor:'pointer', color: tab === t.key ? 'var(--accent)' : 'var(--text3)', borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent', fontWeight: tab === t.key ? 500 : 400 }}>
              {t.label}
            </div>
          ))}
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'16px 24px', display:'grid', gridTemplateColumns:'1fr 320px', gap:16, alignContent:'start' }}>

          {/* Lista items */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
            <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1 }}>
                {tab === 'panes' ? `${panesSeleccionados.length} sabores · ${totalPanes} piezas total` : `${insumosSeleccionados.length} insumos seleccionados`}
              </span>
              <button onClick={() => tab === 'panes' ? setPanes(p => p.map(x => ({...x, incluir:true}))) : setInsumos(i => i.map(x => ({...x, incluir:true})))}
                style={{ fontSize:11, color:'var(--accent)', background:'none', border:'none', cursor:'pointer' }}>
                Seleccionar todo
              </button>
            </div>

            {tab === 'panes' && panes.map(p => (
              <div key={p.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', borderBottom:'1px solid var(--border)', background: p.incluir ? 'transparent' : 'rgba(255,255,255,0.02)', opacity: p.incluir ? 1 : 0.5 }}>
                <input type="checkbox" checked={p.incluir} onChange={() => togglePan(p.id)} style={{ accentColor:'var(--accent)', width:16, height:16, cursor:'pointer' }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:500, color:'var(--text)' }}>{p.sabor}</div>
                  <div style={{ fontSize:10, color:'var(--text3)' }}>Stock actual: {p.piezas} pzas</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <button onClick={() => updateCantidadPan(p.id, Math.max(1, p.cantidad_pedir - 1))} style={{ width:24, height:24, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, cursor:'pointer', color:'var(--text2)', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                  <span style={{ fontSize:14, fontWeight:600, color:'var(--accent)', minWidth:32, textAlign:'center' }}>{p.cantidad_pedir}</span>
                  <button onClick={() => updateCantidadPan(p.id, p.cantidad_pedir + 1)} style={{ width:24, height:24, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, cursor:'pointer', color:'var(--text2)', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
                  <span style={{ fontSize:11, color:'var(--text3)', minWidth:24 }}>pzas</span>
                </div>
              </div>
            ))}

            {tab === 'insumos' && insumos.map(i => (
              <div key={i.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', borderBottom:'1px solid var(--border)', background: i.incluir ? 'transparent' : 'rgba(255,255,255,0.02)', opacity: i.incluir ? 1 : 0.5 }}>
                <input type="checkbox" checked={i.incluir} onChange={() => toggleInsumo(i.id)} style={{ accentColor:'var(--accent)', width:16, height:16, cursor:'pointer' }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:500, color:'var(--text)' }}>{i.nombre}</div>
                  <div style={{ fontSize:10, color:'var(--text3)' }}>Stock: {i.stock_actual} {i.unidad} · Req. diario: {i.requerido_diario} {i.unidad}</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <button onClick={() => updateCantidadInsumo(i.id, Math.max(1, i.cantidad_pedir - 1))} style={{ width:24, height:24, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, cursor:'pointer', color:'var(--text2)', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                  <span style={{ fontSize:14, fontWeight:600, color:'var(--accent)', minWidth:40, textAlign:'center' }}>{i.cantidad_pedir}</span>
                  <button onClick={() => updateCantidadInsumo(i.id, i.cantidad_pedir + 1)} style={{ width:24, height:24, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, cursor:'pointer', color:'var(--text2)', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
                  <span style={{ fontSize:11, color:'var(--text3)', minWidth:24 }}>{i.unidad}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Preview mensaje */}
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:16 }}>
              <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1, marginBottom:12 }}>
                Vista previa del mensaje
              </div>
              <div style={{ background:'#0b1a0f', border:'1px solid rgba(37,211,102,0.2)', borderRadius:8, padding:12, fontSize:11, color:'#e8ead4', lineHeight:1.7, whiteSpace:'pre-wrap', fontFamily:'monospace', maxHeight:320, overflowY:'auto' }}>
                {tab === 'panes' ? generarMensajePanes(panes) : generarMensajeInsumos(insumos)}
              </div>
            </div>

            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:16 }}>
              <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1, marginBottom:12 }}>
                {tab === 'panes' ? 'Enviar a Shaaron (Momo)' : 'Enviar a Cristy'}
              </div>
              <div style={{ fontSize:11, color:'var(--text2)', marginBottom:12 }}>
                {tab === 'panes' ? '+52 55 6004 4346' : '+52 462 115 3409'}
              </div>
              <button onClick={() => enviarWhatsApp(tab)}
                style={{ width:'100%', padding:'12px', background:'#25D366', border:'none', borderRadius:8, cursor:'pointer', color:'#fff', fontSize:13, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <span>📲</span> Enviar por WhatsApp
              </button>
              {enviado === tab && (
                <div style={{ marginTop:10, fontSize:11, color:'#25D366', textAlign:'center' }}>
                  ✓ Abriendo WhatsApp...
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}