'use client'
import { Suspense, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

function ResetPasswordContent() {
  const router = useRouter()
  const [password, setPassword]   = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [tokenValido, setTokenValido] = useState<boolean | null>(null)

  useEffect(() => {
    const supabase = createClient()

    // Estrategia 1: evento PASSWORD_RECOVERY (flujo PKCE o magic link)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setTokenValido(true)
      }
    })

    // Estrategia 2: hash con access_token (flujo implícito)
    const hash = window.location.hash
    if (hash) {
      const params = new URLSearchParams(hash.replace('#', ''))
      const accessToken  = params.get('access_token')
      const refreshToken = params.get('refresh_token') ?? ''
      const type         = params.get('type')
      if (accessToken && type === 'recovery') {
        supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          .then(({ error }) => {
            if (error) {
              console.error('setSession error:', JSON.stringify(error))
            } else {
              setTokenValido(true)
            }
          })
      }
    }

    // Fallback: si después de 4s no se confirmó el token, marcar como inválido
    const timeout = setTimeout(() => {
      setTokenValido(prev => prev === null ? false : prev)
    }, 4000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  const handleSubmit = async () => {
    if (!password || !confirmar) {
      setError('Por favor completa ambos campos')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden')
      return
    }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setError('No se pudo actualizar la contraseña. El enlace puede haber expirado.')
      return
    }
    router.push('/login')
  }

  // Verificando token…
  if (tokenValido === null) {
    return (
      <div style={{ minHeight:'100vh', background:'#0e0f0c', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ fontSize:13, color:'#5a5c4e' }}>Verificando enlace…</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight:'100vh', background:'#0e0f0c', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>

      {/* Logo */}
      <div style={{ marginBottom:40, textAlign:'center' }}>
        <div style={{ fontFamily:'system-ui', fontWeight:800, fontSize:28, color:'#c8f135', letterSpacing:-1, marginBottom:6 }}>
          KitchenDeskia
        </div>
        <div style={{ fontSize:11, color:'#5a5c4e', textTransform:'uppercase', letterSpacing:2 }}>
          Dark Kitchen OS · Beta
        </div>
      </div>

      {/* Card */}
      <div style={{ width:'100%', maxWidth:380, background:'#161714', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:28 }}>

        {!tokenValido ? (
          /* Token expirado o inválido */
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:40, marginBottom:16 }}>⏱️</div>
            <div style={{ fontSize:16, fontWeight:700, color:'#e8ead4', marginBottom:8 }}>Enlace expirado</div>
            <div style={{ fontSize:13, color:'#9a9c88', lineHeight:1.6, marginBottom:24 }}>
              Este enlace ya no es válido o ha expirado. Solicita uno nuevo desde la pantalla de login.
            </div>
            <a href="/auth/forgot-password"
              style={{ display:'block', width:'100%', padding:'13px', background:'#c8f135', border:'none', borderRadius:10, cursor:'pointer', color:'#0e0f0c', fontSize:14, fontWeight:700, textAlign:'center', textDecoration:'none', boxSizing:'border-box', marginBottom:12 }}>
              Solicitar nuevo enlace
            </a>
            <a href="/login"
              style={{ fontSize:12, color:'#9a9c88', textDecoration:'none' }}
              onMouseEnter={e => (e.target as HTMLElement).style.color = '#c8f135'}
              onMouseLeave={e => (e.target as HTMLElement).style.color = '#9a9c88'}>
              ← Volver al login
            </a>
          </div>
        ) : (
          /* Formulario */
          <>
            <div style={{ fontSize:16, fontWeight:700, color:'#e8ead4', marginBottom:4 }}>Nueva contraseña</div>
            <div style={{ fontSize:12, color:'#5a5c4e', marginBottom:24 }}>Elige una contraseña segura para tu cuenta.</div>

            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

              {/* Nueva contraseña */}
              <div>
                <div style={{ fontSize:10, color:'#9a9c88', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>Nueva contraseña</div>
                <div style={{ position:'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    placeholder="Mínimo 6 caracteres"
                    style={{ width:'100%', background:'#252720', border:`1px solid ${error ? 'rgba(255,92,77,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius:10, padding:'11px 44px 11px 14px', color:'#e8ead4', fontSize:14, outline:'none', boxSizing:'border-box', transition:'border-color 0.15s' }}
                    onFocus={e => e.target.style.borderColor = 'rgba(200,241,53,0.4)'}
                    onBlur={e => e.target.style.borderColor = error ? 'rgba(255,92,77,0.4)' : 'rgba(255,255,255,0.08)'}
                  />
                  <button onClick={() => setShowPass(!showPass)}
                    style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#5a5c4e', fontSize:16 }}>
                    {showPass ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              {/* Confirmar contraseña */}
              <div>
                <div style={{ fontSize:10, color:'#9a9c88', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>Confirmar contraseña</div>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={confirmar}
                  onChange={e => setConfirmar(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  placeholder="Repite la contraseña"
                  style={{ width:'100%', background:'#252720', border:`1px solid ${error ? 'rgba(255,92,77,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius:10, padding:'11px 14px', color:'#e8ead4', fontSize:14, outline:'none', boxSizing:'border-box', transition:'border-color 0.15s' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(200,241,53,0.4)'}
                  onBlur={e => e.target.style.borderColor = error ? 'rgba(255,92,77,0.4)' : 'rgba(255,255,255,0.08)'}
                />
              </div>

              {error && (
                <div style={{ padding:'8px 12px', background:'rgba(255,92,77,0.1)', border:'1px solid rgba(255,92,77,0.25)', borderRadius:8, fontSize:12, color:'#ff5c4d' }}>
                  {error}
                </div>
              )}

              <button onClick={handleSubmit} disabled={loading}
                style={{ width:'100%', padding:'13px', background: loading ? 'rgba(200,241,53,0.5)' : '#c8f135', border:'none', borderRadius:10, cursor: loading ? 'not-allowed' : 'pointer', color:'#0e0f0c', fontSize:14, fontWeight:700, marginTop:4, transition:'background 0.15s' }}>
                {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
              </button>

              <a href="/login"
                style={{ textAlign:'center', fontSize:12, color:'#9a9c88', textDecoration:'none', marginTop:2 }}
                onMouseEnter={e => (e.target as HTMLElement).style.color = '#c8f135'}
                onMouseLeave={e => (e.target as HTMLElement).style.color = '#9a9c88'}>
                ← Volver al login
              </a>
            </div>
          </>
        )}
      </div>

      <div style={{ marginTop:24, fontSize:11, color:'#3a3c2e', textAlign:'center' }}>
        KitchenDeskia · Paneki Neko · Beta 2026
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ color:'#9a9c88', textAlign:'center', marginTop:80 }}>Cargando...</div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}
