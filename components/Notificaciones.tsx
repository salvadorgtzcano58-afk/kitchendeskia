'use client'
import { useState, useEffect, useRef } from 'react'

export type Notificacion = {
  id: number
  tipo: 'ia' | 'inventario' | 'requisicion' | 'alerta' | 'turno' | 'pedido'
  titulo: string
  detalle: string
  timestamp: Date
  leida: boolean
}

const TIPO_INFO: Record<Notificacion['tipo'], { icon: string; color: string; bg: string }> = {
  ia:          { icon:'🤖', color:'#25D366', bg:'rgba(37,211,102,0.12)' },
  inventario:  { icon:'📦', color:'#5cb8ff', bg:'rgba(92,184,255,0.1)' },
  requisicion: { icon:'🛒', color:'#ff9a3c', bg:'rgba(255,154,60,0.12)' },
  alerta:      { icon:'⚠️', color:'#ff5c4d', bg:'rgba(255,92,77,0.12)' },
  turno:       { icon:'🍳', color:'#c8f135', bg:'rgba(200,241,53,0.12)' },
  pedido:      { icon:'🧾', color:'#7F77DD', bg:'rgba(127,119,221,0.12)' },
}

const NOTIFICACIONES_DEMO: Notificacion[] = [
  { id:1, tipo:'ia',          titulo:'IA respondió a María Rodríguez', detalle:'WhatsApp · "¡Hola María! Sí tenemos el Combo Familiar..."', timestamp: new Date(Date.now()-5*60000),  leida:false },
  { id:2, tipo:'pedido',      titulo:'Nuevo pedido — Uber Eats',        detalle:'Paneki Familiar x2 · $590 · en preparación',             timestamp: new Date(Date.now()-12*60000), leida:false },
  { id:3, tipo:'inventario',  titulo:'Inventario actualizado',           detalle:'Paneki Familiar: -2 pzas por pedido Uber Eats',           timestamp: new Date(Date.now()-12*60000), leida:false },
  { id:4, tipo:'ia',          titulo:'IA respondió a Carlos López',      detalle:'WhatsApp · "Perfecto Carlos! 2 hamburguesas sin..."',     timestamp: new Date(Date.now()-20*60000), leida:true },
  { id:5, tipo:'alerta',      titulo:'Stock crítico: Habanero',          detalle:'Solo 1 día de stock restante · requiere reposición',      timestamp: new Date(Date.now()-45*60000), leida:true },
  { id:6, tipo:'alerta',      titulo:'Stock crítico: Leche',             detalle:'Solo 1 día de stock restante · requiere reposición',      timestamp: new Date(Date.now()-45*60000), leida:true },
  { id:7, tipo:'requisicion', titulo:'Requisición enviada a Cristy',     detalle:'8 insumos · miércoles de surtido · vía WhatsApp',         timestamp: new Date(Date.now()-2*3600000), leida:true },
  { id:8, tipo:'turno',       titulo:'Recordatorio: apertura de turno',  detalle:'Son las 10:00 AM · hora de abrir el turno',              timestamp: new Date(Date.now()-5*3600000), leida:true },
]

function tiempoRelativo(fecha: Date): string {
  const diff = Math.floor((Date.now() - fecha.getTime()) / 1000)
  if (diff < 60) return 'ahora'
  if (diff < 3600) return `hace ${Math.floor(diff/60)}m`
  if (diff < 86400) return `hace ${Math.floor(diff/3600)}h`
  return `hace ${Math.floor(diff/86400)}d`
}

export function CentroNotificaciones({ onClose }: { onClose: () => void }) {
  const [notifs, setNotifs] = useState<Notificacion[]>(NOTIFICACIONES_DEMO)
  const [filtro, setFiltro] = useState<'todas'|Notificacion['tipo']>('todas')

  const marcarTodasLeidas = () => setNotifs(prev => prev.map(n => ({...n, leida:true})))
  const marcarLeida = (id: number) => setNotifs(prev => prev.map(n => n.id === id ? {...n, leida:true} : n))

  const filtradas = notifs.filter(n => filtro === 'todas' || n.tipo === filtro)
  const noLeidas = notifs.filter(n => !n.leida).length

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:200, display:'flex', alignItems:'flex-start', justifyContent:'flex-end', padding:'60px 16px 0' }}
      onClick={onClose}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, width:380, maxHeight:'80vh', display:'flex', flexDirection:'column', overflow:'hidden' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>Centro de actividad</div>
            <div style={{ fontSize:10, color:'var(--text3)', marginTop:1 }}>{noLeidas > 0 ? `${noLeidas} sin leer` : 'Todo al día'}</div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {noLeidas > 0 && (
              <button onClick={marcarTodasLeidas} style={{ fontSize:10, color:'var(--accent)', background:'none', border:'none', cursor:'pointer' }}>
                Marcar todo leído
              </button>
            )}
            <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:18, lineHeight:1 }}>×</button>
          </div>
        </div>

        {/* Filtros */}
        <div style={{ display:'flex', gap:4, padding:'8px 12px', borderBottom:'1px solid var(--border)', overflowX:'auto', flexWrap:'nowrap' }}>
          {[
            { key:'todas', label:'Todas' },
            { key:'alerta', label:'⚠️ Alertas' },
            { key:'ia', label:'🤖 IA' },
            { key:'inventario', label:'📦 Inventario' },
            { key:'pedido', label:'🧾 Pedidos' },
            { key:'requisicion', label:'🛒 Requisiciones' },
            { key:'turno', label:'🍳 Turno' },
          ].map(f => (
            <button key={f.key} onClick={() => setFiltro(f.key as any)}
              style={{ padding:'4px 10px', borderRadius:20, fontSize:10, cursor:'pointer', whiteSpace:'nowrap', fontWeight:500, background: filtro === f.key ? 'var(--accent-dim)' : 'var(--surface2)', color: filtro === f.key ? 'var(--accent)' : 'var(--text3)', border: filtro === f.key ? '1px solid rgba(200,241,53,0.3)' : '1px solid var(--border)' }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Lista */}
        <div style={{ overflowY:'auto', flex:1 }}>
          {filtradas.length === 0 ? (
            <div style={{ padding:24, textAlign:'center', fontSize:12, color:'var(--text3)' }}>Sin actividad reciente</div>
          ) : filtradas.map(n => {
            const info = TIPO_INFO[n.tipo]
            return (
              <div key={n.id} onClick={() => marcarLeida(n.id)}
                style={{ display:'flex', gap:12, padding:'12px 16px', borderBottom:'1px solid var(--border)', cursor:'pointer', background: n.leida ? 'transparent' : 'rgba(200,241,53,0.03)', transition:'background 0.15s' }}>
                <div style={{ width:36, height:36, minWidth:36, borderRadius:10, background:info.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>
                  {info.icon}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                    <div style={{ fontSize:12, fontWeight: n.leida ? 400 : 600, color:'var(--text)', lineHeight:1.3 }}>{n.titulo}</div>
                    <div style={{ fontSize:10, color:'var(--text3)', whiteSpace:'nowrap' }}>{tiempoRelativo(n.timestamp)}</div>
                  </div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginTop:3, lineHeight:1.4 }}>{n.detalle}</div>
                </div>
                {!n.leida && <div style={{ width:7, height:7, borderRadius:'50%', background:'var(--accent)', minWidth:7, marginTop:4 }} />}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Hook para notificaciones de turno con sonido
export function useTurnoNotificaciones() {
  const audioCtx = useRef<AudioContext | null>(null)

  const reproducirSonido = (frecuencia: number, duracion: number) => {
    try {
      if (!audioCtx.current) audioCtx.current = new AudioContext()
      const ctx = audioCtx.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = frecuencia
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duracion)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + duracion)
    } catch (e) {}
  }

  const sonarApertura = () => {
    reproducirSonido(523, 0.2)
    setTimeout(() => reproducirSonido(659, 0.2), 200)
    setTimeout(() => reproducirSonido(784, 0.4), 400)
  }

  const sonarCierre = () => {
    reproducirSonido(784, 0.2)
    setTimeout(() => reproducirSonido(659, 0.2), 200)
    setTimeout(() => reproducirSonido(523, 0.4), 400)
  }

  useEffect(() => {
    const verificarHora = () => {
      const ahora = new Date()
      const h = ahora.getHours()
      const m = ahora.getMinutes()
      if (h === 10 && m === 0) {
        sonarApertura()
        if (Notification.permission === 'granted') {
          new Notification('🍳 KitchenDeskia', {
            body: '¡Son las 10:00 AM! Hora de abrir el turno.',
            icon: '/favicon.ico'
          })
        }
      }
      if (h === 18 && m === 0) {
        sonarCierre()
        if (Notification.permission === 'granted') {
          new Notification('🍳 KitchenDeskia', {
            body: '¡Son las 6:00 PM! Hora de cerrar el turno.',
            icon: '/favicon.ico'
          })
        }
      }
    }

    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }

    const intervalo = setInterval(verificarHora, 60000)
    return () => clearInterval(intervalo)
  }, [])

  return { sonarApertura, sonarCierre }
}