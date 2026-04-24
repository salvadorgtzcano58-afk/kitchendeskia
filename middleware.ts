import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ── Security headers aplicados a todas las respuestas ───────────────────
const SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options':        'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy':        'strict-origin-when-cross-origin',
  'Permissions-Policy':     'camera=(), microphone=(), geolocation=()',
  'X-DNS-Prefetch-Control': 'off',
}

function applySecurityHeaders(res: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(key, value)
  }
  return res
}

// ── Rutas públicas que no requieren autenticación ───────────────────────
const PUBLIC_PREFIXES = [
  '/login',
  '/auth/',
  '/privacy',
  '/api/whatsapp',   // webhook Meta — protegido con X-Hub-Signature-256
  '/api/keep-alive', // cron GitHub Actions — no necesita sesión de usuario
  '/tianguis',
]

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix))
}

// ── Middleware principal ─────────────────────────────────────────────────
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublic(pathname)) {
    return applySecurityHeaders(NextResponse.next())
  }

  const response = NextResponse.next()

  // ── Verificación JWT via Supabase ────────────────────────────────────
  // getUser() valida el token contra los servidores de Supabase (no solo
  // decodifica localmente), por lo que detecta tokens revocados y expirados.
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      // Preservar la ruta original para redirigir después del login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return applySecurityHeaders(NextResponse.redirect(loginUrl))
    }
  } catch (err) {
    // Si Supabase no está disponible, fallar de forma segura hacia /login
    console.error('[middleware] Error al verificar sesión:', err)
    return applySecurityHeaders(NextResponse.redirect(new URL('/login', request.url)))
  }

  return applySecurityHeaders(response)
}

export const config = {
  // Excluir assets estáticos, imágenes de Next.js e iconos
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.ico$).*)'],
}
