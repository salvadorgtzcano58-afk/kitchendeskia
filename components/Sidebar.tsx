'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { CentroNotificaciones, useTurnoNotificaciones, fetchNotificaciones, type Notificacion } from './Notificaciones'

const nav = [
  { label:'Dashboard',      icon:'📊', href:'/dashboard' },
  { label:'Mensajes',       icon:'💬', href:'/mensajes',      badge:'7',  badgeColor:'#ff5c4d' },
  { label:'Inventario',     icon:'📦', href:'/inventario' },
  { label:'Requisiciones',  icon:'🛒', href:'/requisiciones', badge:'2',  badgeColor:'#ff9a3c' },
  { label:'Corte de turno', icon:'🧾', href:'/corte' },
  { label:'Reportes',       icon:'📈', href:'/reportes' },
  { label:'Proveedores',    icon:'🤝', href:'/proveedores' },
]

export default function Sidebar() {
  const path = usePathname()
  const router = useRouter()
  const [showNotifs, setShowNotifs] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [notifs, setNotifs] = useState<Notificacion[]>([])
  const [notifsCargando, setNotifsCargando] = useState(true)
  useTurnoNotificaciones()

  useEffect(() => {
    fetchNotificaciones().then(data => {
      setNotifs(data)
      setNotifsCargando(false)
    })
  }, [])

  const noLeidas = notifs.filter(n => !n.leida).length

  const handleLogout = async () => {
    setLoggingOut(true)
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      <aside style={{
        width:220, minWidth:220, background:'var(--surface)',
        borderRight:'1px solid var(--border)', display:'flex',
        flexDirection:'column', height:'100vh'
      }}>
        <div style={{ padding:'20px 20px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontFamily:'system-ui', fontWeight:800, fontSize:17, color:'var(--accent)', letterSpacing:-0.5 }}>
              KitchenDeskia
            </div>
            <div style={{ fontSize:9, color:'var(--text3)', marginTop:3, letterSpacing:1, textTransform:'uppercase' }}>
              Dark Kitchen OS · Beta
            </div>
          </div>
          <div onClick={() => setShowNotifs(true)} style={{ position:'relative', cursor:'pointer', padding:4 }}>
            <span style={{ fontSize:18 }}>🔔</span>
            {noLeidas > 0 && (
              <div style={{ position:'absolute', top:0, right:0, width:16, height:16, background:'#ff5c4d', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, color:'#fff', fontWeight:700, border:'2px solid var(--surface)' }}>
                {noLeidas}
              </div>
            )}
          </div>
        </div>

        <div style={{ margin:'12px 16px', background:'rgba(200,241,53,0.06)', border:'1px solid rgba(200,241,53,0.12)', borderRadius:8, padding:'8px 10px', display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:7, height:7, background:'var(--accent)', borderRadius:'50%' }} />
          <div>
            <div style={{ fontSize:12, color:'var(--text)', fontWeight:500 }}>Dark Kitchen Qro.</div>
            <div style={{ fontSize:10, color:'var(--accent)' }}>● Turno activo</div>
          </div>
        </div>

        <nav style={{ padding:'8px 10px', flex:1 }}>
          {nav.map(item => {
            const active = path === item.href
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration:'none' }}>
                <div style={{
                  display:'flex', alignItems:'center', gap:10,
                  padding:'8px 10px', borderRadius:8, marginBottom:2,
                  background: active ? 'var(--accent-dim)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text2)',
                  fontWeight: active ? 500 : 400,
                  cursor:'pointer', transition:'all 0.15s',
                  borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent'
                }}>
                  <span style={{ fontSize:15, width:18, textAlign:'center' }}>{item.icon}</span>
                  <span style={{ fontSize:13, flex:1 }}>{item.label}</span>
                  {item.badge && (
                    <span style={{ background:item.badgeColor, color:'#fff', fontSize:9, padding:'1px 6px', borderRadius:10, fontWeight:600 }}>
                      {item.badge}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}

          <div onClick={() => setShowNotifs(true)} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:8, marginBottom:2, color:'var(--text2)', cursor:'pointer', transition:'all 0.15s', borderLeft:'2px solid transparent', marginTop:8 }}>
            <span style={{ fontSize:15, width:18, textAlign:'center' }}>🔔</span>
            <span style={{ fontSize:13, flex:1 }}>Actividad</span>
            {noLeidas > 0 && (
              <span style={{ background:'#ff5c4d', color:'#fff', fontSize:9, padding:'1px 6px', borderRadius:10, fontWeight:600 }}>
                {noLeidas}
              </span>
            )}
          </div>
        </nav>

        {/* Footer: usuario + botón logout */}
        <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:30, height:30, background:'var(--accent-dim)', border:'1px solid rgba(200,241,53,0.2)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'var(--accent)', fontWeight:600 }}>
            SG
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12, color:'var(--text)', fontWeight:500 }}>Salvador G.</div>
            <div style={{ fontSize:10, color:'var(--text3)' }}>Supervisor turno</div>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title="Cerrar sesión"
            style={{
              background:'transparent', border:'none', cursor: loggingOut ? 'not-allowed' : 'pointer',
              padding:4, borderRadius:6, fontSize:16, opacity: loggingOut ? 0.4 : 0.6,
              transition:'opacity 0.15s', lineHeight:1
            }}
            onMouseEnter={e => { if (!loggingOut) (e.target as HTMLElement).style.opacity = '1' }}
            onMouseLeave={e => { if (!loggingOut) (e.target as HTMLElement).style.opacity = '0.6' }}
          >
            🚪
          </button>
        </div>
      </aside>

      {showNotifs && (
        <CentroNotificaciones
          onClose={() => setShowNotifs(false)}
          notifs={notifs}
          setNotifs={setNotifs}
          cargando={notifsCargando}
        />
      )}
    </>
  )}
