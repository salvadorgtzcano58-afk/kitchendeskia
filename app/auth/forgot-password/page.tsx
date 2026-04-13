'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError]     = useState('')

  const handleSubmit = async () => {
    if (!email) {
      setError('Por favor ingresa tu correo electrónico')
      return
    }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: process.env.NEXT_PUBLIC_SITE_URL + '/auth/reset-password',
    })
    setLoading(false)
    if (error) {
      setError('No se pudo enviar el correo. Intenta de nuevo.')
      return
    }
    setEnviado(true)
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

        {enviado ? (
          /* Estado éxito */
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:40, marginBottom:16 }}>📬</div>
            <div style={{ fontSize:16, fontWeight:700, color:'#e8ead4', marginBottom:8 }}>Revisa tu email</div>
            <div style={{ fontSize:13, color:'#9a9c88', lineHeight:1.6, marginBottom:24 }}>
              Te enviamos las instrucciones para restablecer tu contraseña a <span style={{ color:'#c8f135' }}>{email}</span>.
            </div>
            <a href="/login"
              style={{ fontSize:13, color:'#9a9c88', textDecoration:'none' }}
              onMouseEnter={e => (e.target as HTMLElement).style.color = '#c8f135'}
              onMouseLeave={e => (e.target as HTMLElement).style.color = '#9a9c88'}>
              ← Volver al login
            </a>
          </div>
        ) : (
          /* Formulario */
          <>
            <div style={{ fontSize:16, fontWeight:700, color:'#e8ead4', marginBottom:4 }}>¿Olvidaste tu contraseña?</div>
            <div style={{ fontSize:12, color:'#5a5c4e', marginBottom:24 }}>
              Ingresa tu correo y te enviamos un enlace para restablecerla.
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <div style={{ fontSize:10, color:'#9a9c88', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>Correo electrónico</div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  placeholder="tu@correo.com"
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
                {loading ? 'Enviando...' : 'Enviar instrucciones'}
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
