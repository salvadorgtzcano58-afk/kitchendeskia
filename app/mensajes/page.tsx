'use client'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import { supabase, type Conversacion, type Mensaje } from '@/lib/supabase'

const CANAL_COLOR: Record<string, string> = {
  whatsapp: '#25D366', instagram: '#E4405F', facebook: '#4267B2'
}
const CLASIF_COLOR: Record<string, {bg:string,color:string,label:string}> = {
  pedido:  { bg:'rgba(200,241,53,0.12)', color:'#c8f135', label:'🛒 Pedido' },
  lead:    { bg:'rgba(92,184,255,0.1)',  color:'#5cb8ff', label:'👤 Lead' },
  duda:    { bg:'rgba(255,154,60,0.12)', color:'#ff9a3c', label:'❓ Duda' },
  otro:    { bg:'rgba(255,255,255,0.06)', color:'#9a9c88', label:'💬 Otro' },
}

// Demo data para mostrar sin necesitar backend real aún
const DEMO_CONVS: Conversacion[] = [
  { id:'1', cliente_nombre:'María Rodríguez', cliente_telefono:'4421234567', canal:'whatsapp', clasificacion:'pedido', estado:'abierta', atendido_por_ia:true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id:'2', cliente_nombre:'Carlos López', canal:'whatsapp', clasificacion:'pedido', estado:'abierta', atendido_por_ia:true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id:'3', cliente_nombre:'Ana Núñez', canal:'instagram', clasificacion:'duda', estado:'abierta', atendido_por_ia:false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id:'4', cliente_nombre:'Roberto Pérez', canal:'whatsapp', clasificacion:'lead', estado:'respondida', atendido_por_ia:true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id:'5', cliente_nombre:'Laura García', canal:'facebook', clasificacion:'duda', estado:'respondida', atendido_por_ia:true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
]

const DEMO_MSGS: Record<string, Mensaje[]> = {
  '1': [
    { id:'m1', conversacion_id:'1', rol:'cliente', contenido:'Hola! ¿Tienen disponible el combo familiar hoy?', created_at: new Date().toISOString() },
    { id:'m2', conversacion_id:'1', rol:'ia', contenido:'¡Hola María! 👋 Sí tenemos el Combo Familiar disponible hoy. Incluye 4 hamburguesas clásicas, 2 papas grandes y 4 bebidas por $380. ¿Te lo enviamos?', created_at: new Date().toISOString() },
    { id:'m3', conversacion_id:'1', rol:'cliente', contenido:'Sí! ¿Aceptan pago con tarjeta?', created_at: new Date().toISOString() },
    { id:'m4', conversacion_id:'1', rol:'ia', contenido:'Claro, aceptamos tarjeta de débito/crédito, efectivo y transferencia. ¿Cuál es tu dirección de entrega?', created_at: new Date().toISOString() },
  ],
  '2': [
    { id:'m5', conversacion_id:'2', rol:'cliente', contenido:'Quiero 2 hamburguesas sin cebolla y una orden de papas', created_at: new Date().toISOString() },
    { id:'m6', conversacion_id:'2', rol:'ia', contenido:'Perfecto Carlos! 2 hamburguesas sin cebolla + 1 orden de papas = $185. ¿A qué dirección te lo mandamos?', created_at: new Date().toISOString() },
  ],
  '3': [
    { id:'m7', conversacion_id:'3', rol:'cliente', contenido:'Hola! ¿hacen envíos a Juriquilla?', created_at: new Date().toISOString() },
  ],
}

export default function MensajesPage() {
  const [convs, setConvs] = useState<Conversacion[]>(DEMO_CONVS)
  const [selected, setSelected] = useState<Conversacion>(DEMO_CONVS[0])
  const [msgs, setMsgs] = useState<Mensaje[]>(DEMO_MSGS['1'])
  const [input, setInput] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [iaActiva, setIaActiva] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [showDetail, setShowDetail] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const selectConv = (c: Conversacion) => {
    setSelected(c)
    setMsgs(DEMO_MSGS[c.id] || [])
    setShowDetail(true)
  }

  const sendMsg = () => {
    if (!input.trim()) return
    const nuevo: Mensaje = { id: Date.now().toString(), conversacion_id: selected.id, rol: 'humano', contenido: input, created_at: new Date().toISOString() }
    setMsgs(prev => [...prev, nuevo])
    setInput('')
  }

  const filtrados = convs.filter(c => {
    if (filtro === 'todos') return true
    if (filtro === 'ia') return c.atendido_por_ia
    return c.clasificacion === filtro
  })

  const stats = {
    pedidos: convs.filter(c => c.clasificacion === 'pedido').length,
    iaResp: convs.filter(c => c.atendido_por_ia).length,
    leads: convs.filter(c => c.clasificacion === 'lead').length,
    atencion: convs.filter(c => !c.atendido_por_ia && c.estado === 'abierta').length,
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Topbar */}
        <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Centro de mensajes</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>WhatsApp · Instagram · Facebook — todos en uno</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: 'rgba(77,255,176,0.1)', border: '1px solid rgba(77,255,176,0.2)', borderRadius: 20, fontSize: 11, color: '#4dffb0' }}>
              <div style={{ width: 6, height: 6, background: '#4dffb0', borderRadius: '50%' }} />
              IA respondiendo
            </div>
            <button onClick={() => setIaActiva(!iaActiva)} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)' }}>
              {iaActiva ? 'Pausar IA' : 'Activar IA'}
            </button>
          </div>
        </div>

        {/* Content grid */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 360px', overflow: 'hidden' }}>

          {/* Lista conversaciones */}
          <div style={{ display: isMobile && showDetail ? 'none' : 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', overflow: 'hidden' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 16px', background: 'var(--surface)', gap: 4 }}>
              {[
                { key:'todos', label:'Todos', count: convs.length },
                { key:'pedido', label:'Pedidos', count: stats.pedidos },
                { key:'lead', label:'Leads', count: stats.leads },
                { key:'duda', label:'Dudas', count: convs.filter(c=>c.clasificacion==='duda').length },
              ].map(tab => (
                <div key={tab.key} onClick={() => setFiltro(tab.key)} style={{ padding: '10px 14px', fontSize: 12, color: filtro === tab.key ? 'var(--accent)' : 'var(--text3)', borderBottom: filtro === tab.key ? '2px solid var(--accent)' : '2px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {tab.label}
                  <span style={{ background: filtro === tab.key ? 'rgba(200,241,53,0.15)' : 'rgba(255,92,77,0.12)', color: filtro === tab.key ? 'var(--accent)' : '#ff5c4d', fontSize: 9, padding: '1px 5px', borderRadius: 8 }}>
                    {tab.count}
                  </span>
                </div>
              ))}
            </div>

            {/* Lista */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
              {filtrados.map(c => {
                const cl = CLASIF_COLOR[c.clasificacion]
                const isActive = selected.id === c.id
                return (
                  <div key={c.id} onClick={() => selectConv(c)} style={{ display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 8, cursor: 'pointer', background: isActive ? 'var(--surface3)' : 'transparent', marginBottom: 2, position: 'relative', transition: 'background 0.1s' }}>
                    <div style={{ width: 36, height: 36, minWidth: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, background: `${CANAL_COLOR[c.canal]}22`, color: CANAL_COLOR[c.canal] }}>
                      {c.cliente_nombre.split(' ').map(n=>n[0]).join('').slice(0,2)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ fontSize: 13, color: c.estado === 'abierta' ? 'var(--text)' : 'var(--text2)', fontWeight: c.estado === 'abierta' ? 600 : 400 }}>{c.cliente_nombre}</span>
                        <span style={{ fontSize: 10, color: 'var(--text3)' }}>hace 5m</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.atendido_por_ia ? '✓ IA respondió' : 'Esperando respuesta...'}
                      </div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 9, padding: '2px 6px', borderRadius: 4, marginTop: 3, background: cl.bg, color: cl.color }}>
                        {cl.label}
                      </span>
                    </div>
                    {c.estado === 'abierta' && !c.atendido_por_ia && (
                      <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 7, height: 7, background: 'var(--accent)', borderRadius: '50%' }} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Panel derecho */}
          <div style={{ display: isMobile && !showDetail ? 'none' : 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Chat activo */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderBottom: '1px solid var(--border)' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface)' }}>
                {isMobile && (
                  <button onClick={() => setShowDetail(false)}
                    style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 18, padding: '0 4px 0 0', lineHeight: 1 }}>
                    ←
                  </button>
                )}
                <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, background: `${CANAL_COLOR[selected.canal]}22`, color: CANAL_COLOR[selected.canal] }}>
                  {selected.cliente_nombre.split(' ').map(n=>n[0]).join('').slice(0,2)}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{selected.cliente_nombre}</div>
                  <div style={{ fontSize: 10, color: CANAL_COLOR[selected.canal] }}>● {selected.canal}</div>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {msgs.map(m => (
                  <div key={m.id} style={{ display: 'flex', flexDirection: 'column', maxWidth: '85%', alignSelf: m.rol === 'cliente' ? 'flex-end' : 'flex-start', alignItems: m.rol === 'cliente' ? 'flex-end' : 'flex-start' }}>
                    <div style={{ padding: '8px 12px', borderRadius: 10, fontSize: 12, lineHeight: 1.5, background: m.rol === 'cliente' ? 'var(--surface3)' : 'rgba(200,241,53,0.1)', border: m.rol === 'ia' ? '1px solid rgba(200,241,53,0.1)' : 'none', borderBottomRightRadius: m.rol === 'cliente' ? 3 : 10, borderBottomLeftRadius: m.rol !== 'cliente' ? 3 : 10 }}>
                      {m.contenido}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {m.rol === 'ia' && <span style={{ background: 'rgba(200,241,53,0.12)', color: 'var(--accent)', fontSize: 8, padding: '1px 5px', borderRadius: 4 }}>IA</span>}
                      {new Date(m.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 10, color: 'var(--text3)' }}>
                  <div style={{ width: 28, height: 15, background: iaActiva ? 'var(--accent)' : 'var(--surface3)', borderRadius: 8, position: 'relative', cursor: 'pointer' }} onClick={() => setIaActiva(!iaActiva)}>
                    <div style={{ position: 'absolute', top: 2, left: iaActiva ? 15 : 2, width: 11, height: 11, background: '#0e0f0c', borderRadius: '50%', transition: 'left 0.2s' }} />
                  </div>
                  {iaActiva ? 'IA activa · escribe para responder manualmente' : 'IA pausada · respuesta manual'}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMsg()} placeholder="Escribe un mensaje..." style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 12, outline: 'none' }} />
                  <button onClick={sendMsg} style={{ background: 'var(--accent)', border: 'none', borderRadius: 8, width: 34, cursor: 'pointer', fontSize: 14 }}>➤</button>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div style={{ padding: 14, background: 'var(--surface)' }}>
              <div style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Resumen del turno · hoy</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { val: stats.pedidos, label: 'Pedidos hoy', color: '#c8f135', delta: '↑ +4 vs ayer' },
                  { val: `${Math.round(stats.iaResp/convs.length*100)}%`, label: 'Respondidos IA', color: '#5cb8ff', delta: '↑ sin intervención' },
                  { val: stats.leads, label: 'Leads', color: '#ff9a3c', delta: '↗ seguimiento' },
                  { val: stats.atencion, label: 'Req. atención', color: '#ff5c4d', delta: '⚠ manual' },
                ].map((s,i) => (
                  <div key={i} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: 10 }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.val}</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{s.label}</div>
                    <div style={{ fontSize: 9, color: 'var(--accent)', marginTop: 3 }}>{s.delta}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
