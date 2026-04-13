'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Por favor ingresa tu usuario y contraseña')
      return
    }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Usuario o contraseña incorrectos')
      setLoading(false)
      return
    }
    router.push('/dashboard')
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
        <div style={{ fontSize:16, fontWeight:700, color:'#e8ead4', marginBottom:4 }}>Iniciar sesión</div>
        <div style={{ fontSize:12, color:'#5a5c4e', marginBottom:24 }}>Accede a tu panel de operaciones</div>

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {/* Email */}
          <div>
            <div style={{ fontSize:10, color:'#9a9c88', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>Correo electrónico</div>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="tu@correo.com"
              style={{ width:'100%', background:'#252720', border:`1px solid ${error ? 'rgba(255,92,77,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius:10, padding:'11px 14px', color:'#e8ead4', fontSize:14, outline:'none', boxSizing:'border-box', transition:'border-color 0.15s' }}
              onFocus={e => e.target.style.borderColor = 'rgba(200,241,53,0.4)'}
              onBlur={e => e.target.style.borderColor = error ? 'rgba(255,92,77,0.4)' : 'rgba(255,255,255,0.08)'}
            />
          </div>

          {/* Password */}
          <div>
            <div style={{ fontSize:10, color:'#9a9c88', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>Contraseña</div>
            <div style={{ position:'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="••••••••"
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

          {/* Error */}
          {error && (
            <div style={{ padding:'8px 12px', background:'rgba(255,92,77,0.1)', border:'1px solid rgba(255,92,77,0.25)', borderRadius:8, fontSize:12, color:'#ff5c4d' }}>
              {error}
            </div>
          )}

          {/* Botón */}
          <button onClick={handleLogin} disabled={loading}
            style={{ width:'100%', padding:'13px', background: loading ? 'rgba(200,241,53,0.5)' : '#c8f135', border:'none', borderRadius:10, cursor: loading ? 'not-allowed' : 'pointer', color:'#0e0f0c', fontSize:14, fontWeight:700, marginTop:4, transition:'background 0.15s' }}>
            {loading ? 'Ingresando...' : 'Entrar al sistema'}
          </button>

          <Link href="/auth/forgot-password"
            style={{ textAlign:'center', fontSize:12, color:'#9a9c88', textDecoration:'none', marginTop:2 }}
            onMouseEnter={e => (e.target as HTMLElement).style.color = '#c8f135'}
            onMouseLeave={e => (e.target as HTMLElement).style.color = '#9a9c88'}>
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </div>

      <div style={{ marginTop:24, fontSize:11, color:'#3a3c2e', textAlign:'center' }}>
        KitchenDeskia · Paneki Neko · Beta 2026
      </div>
    </div>
  )
}