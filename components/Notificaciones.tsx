'use client'
import { useState, useEffect, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type Notificacion = {
  id: string
  tipo: 'venta' | 'requisicion' | 'stock_critico'
  titulo: string
  descripcion: string
  created_at: string
  leida: boolean
}

const TIPO_INFO: Record<Notificacion['tipo'], { icon: string; color: string; bg: string }> = {
  venta:         { icon:'🧾', color:'#7F77DD', bg:'rgba(127,119,221,0.12)' },
  requisicion:   { icon:'🛒', color:'#ff9a3c', bg:'rgba(255,154,60,0.12)'  },
  stock_critico: { icon:'⚠️', color:'#ff5c4d', bg:'rgba(255,92,77,0.12)'   },
}

function tiempoRelativo(fecha: string): string {
  const diff = Math.floor((Date.now() - new Date(fecha).getTime()) / 1000)
  if (diff < 60)    return 'ahora'
  if (diff < 3600)  return `hace ${Math.floor(diff / 60)}m`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`
  return `hace ${Math.floor(diff / 86400)}d`
}

export async function fetchNotificaciones(): Promise<Notificacion[]> {
  const [resPedidos, resReqs, resStock] = await Promise.all([
    supabase
      .from('pedidos')
      .select('id, canal, total, metodo_pago, created_at')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('requisiciones_log')
      .select('id, tipo, proveedor, mensaje, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('productos')
      .select('id, nombre, unidad, stock_actual, categoria')
      .lte('stock_actual', 5)
      .in('categoria', ['Panes', 'Insumos', 'Empaque']),
  ])

  const ventas: Notificacion[] = (resPedidos.data ?? []).map(p => ({
    id: `venta-${p.id}`,
    tipo: 'venta',
    titulo: `Venta ${p.canal ?? ''}`,
    descripcion: `$${p.total ?? 0} · ${p.metodo_pago ?? '—'}`,
    created_at: p.created_at,
    leida: false,
  }))

  const requisiciones: Notificacion[] = (resReqs.data ?? []).map(r => ({
    id: `req-${r.id}`,
    tipo: 'requisicion',
    titulo: `Requisición enviada a ${r.proveedor ?? '—'}`,
    descripcion: r.mensaje ?? `${r.tipo ?? '—'}`,
    created_at: r.created_at,
    leida: false,
  }))

  // stock_critico usa created_at ficticio = ahora, ya que productos no tiene timestamp de alerta
  const stockCritico: Notificacion[] = (resStock.data ?? []).map(p => ({
    id: `stock-${p.id}`,
    tipo: 'stock_critico',
    titulo: `⚠️ Stock crítico: ${p.nombre}`,
    descripcion: `${p.stock_actual} ${p.unidad ?? 'pzas'} restantes`,
    created_at: new Date().toISOString(),
    leida: false,
  }))

  return [...ventas, ...requisiciones, ...stockCritico].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}

type CentroProps = {
  onClose: () => void
  notifs: Notificacion[]
  setNotifs: React.Dispatch<React.SetStateAction<Notificacion[]>>
  cargando: boolean
}

export function CentroNotificaciones({ onClose, notifs, setNotifs, cargando }: CentroProps) {
  const [filtro, setFiltro] = useState<'todas' | Notificacion['tipo']>('todas')

  const marcarTodasLeidas = () => setNotifs(prev => prev.map(n => ({ ...n, leida: true })))
  const marcarLeida = (id: string) => setNotifs(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n))

  const filtradas = notifs.filter(n => filtro === 'todas' || n.tipo === filtro)
  const noLeidas  = notifs.filter(n => !n.leida).length

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:200, display:'flex', alignItems:'flex-start', justifyContent:'flex-end', padding:'60px 16px 0' }}
      onClick={onClose}
    >
      <div
        style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, width:'min(380px, calc(100vw - 32px))', maxHeight:'80vh', display:'flex', flexDirection:'column', overflow:'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>Centro de actividad</div>
            <div style={{ fontSize:10, color:'var(--text3)', marginTop:1 }}>
              {cargando ? 'Cargando…' : noLeidas > 0 ? `${noLeidas} sin leer` : 'Todo al día'}
            </div>
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
        <div className="scroll-x" style={{ display:'flex', gap:6, padding:'8px 12px', borderBottom:'1px solid var(--border)', flexWrap:'nowrap', alignItems:'center' }}>
          {[
            { key:'todas',         label:'Todas'           },
            { key:'stock_critico', label:'⚠️ Stock'        },
            { key:'venta',         label:'🧾 Ventas'        },
            { key:'requisicion',   label:'🛒 Requisiciones' },
          ].map(f => (
            <button key={f.key} onClick={() => setFiltro(f.key as any)}
              style={{ padding:'5px 12px', borderRadius:20, fontSize:11, cursor:'pointer', whiteSpace:'nowrap', fontWeight:500, flexShrink:0,
                background: filtro === f.key ? 'var(--accent-dim)' : 'var(--surface2)',
                color:      filtro === f.key ? 'var(--accent)'     : 'var(--text3)',
                border:     filtro === f.key ? '1px solid rgba(200,241,53,0.3)' : '1px solid var(--border)' }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Lista */}
        <div style={{ overflowY:'auto', flex:1 }}>
          {cargando ? (
            <div style={{ padding:24, textAlign:'center', fontSize:12, color:'var(--text3)' }}>Cargando actividad…</div>
          ) : filtradas.length === 0 ? (
            <div style={{ padding:24, textAlign:'center', fontSize:12, color:'var(--text3)' }}>Sin actividad reciente</div>
          ) : filtradas.map(n => {
            const info = TIPO_INFO[n.tipo]
            return (
              <div key={n.id} onClick={() => marcarLeida(n.id)}
                style={{ display:'flex', gap:12, padding:'12px 16px', borderBottom:'1px solid var(--border)', cursor:'pointer',
                  background: n.leida ? 'transparent' : 'rgba(200,241,53,0.03)', transition:'background 0.15s' }}>
                <div style={{ width:36, height:36, minWidth:36, borderRadius:10, background:info.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>
                  {info.icon}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                    <div style={{ fontSize:12, fontWeight: n.leida ? 400 : 600, color:'var(--text)', lineHeight:1.3 }}>{n.titulo}</div>
                    <div style={{ fontSize:10, color:'var(--text3)', whiteSpace:'nowrap' }}>{tiempoRelativo(n.created_at)}</div>
                  </div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginTop:3, lineHeight:1.4 }}>{n.descripcion}</div>
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
      const osc  = ctx.createOscillator()
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
          new Notification('🍳 KitchenDeskia', { body: '¡Son las 10:00 AM! Hora de abrir el turno.', icon: '/favicon.ico' })
        }
      }
      if (h === 18 && m === 0) {
        sonarCierre()
        if (Notification.permission === 'granted') {
          new Notification('🍳 KitchenDeskia', { body: '¡Son las 6:00 PM! Hora de cerrar el turno.', icon: '/favicon.ico' })
        }
      }
    }

    if (Notification.permission === 'default') Notification.requestPermission()

    const intervalo = setInterval(verificarHora, 60000)
    return () => clearInterval(intervalo)
  }, [])

  return { sonarApertura, sonarCierre }
}
