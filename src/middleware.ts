import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { searchParams, pathname } = request.nextUrl

  // ----------------------------------------------------
  // 1. INITIALIZE RESPONSE
  // ----------------------------------------------------
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // ----------------------------------------------------
  // 2. CAPTURE AFFILIATE REFERRAL COOKIES
  // ----------------------------------------------------
  const refCode = searchParams.get('ref')

  if (refCode) {
    response.cookies.set('godaapp_affiliate_ref', refCode, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30-day expiry
      path: '/',
    })
  }

  // ----------------------------------------------------
  // 3. OFFLOAD REAL-TIME METRICS TO TINYBIRD (FIRE & FORGET)
  // ----------------------------------------------------
  const isInternalPath =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico'

  if (!isInternalPath) {
    const tinybirdToken = process.env.TINYBIRD_API_KEY
    if (tinybirdToken) {
      fetch('https://tinybird.co', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tinybirdToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          path: pathname,
          referrer: request.headers.get('referer') || 'direct',
          user_agent: request.headers.get('user-agent') || 'unknown',
        }),
      }).catch((err) => console.error('Tinybird telemetry ingestion dropped:', err))
    }
  }

  // ----------------------------------------------------
  // 4. SECURE AUTHENTICATION & ROUTE GUARDRAILS
  // ----------------------------------------------------
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Skip auth checks entirely if env vars are not available
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Middleware] Missing Supabase env vars — skipping auth checks')
    return response
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll().map(({ name, value }) => ({ name, value }))
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          request.cookies.set({ name, value, ...options })
        )
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set({ name, value, ...options })
        )
      },
    },
  })

  // Retrieve authenticated user from encrypted session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // --- Protect: Student Dashboard ---
  if (pathname.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  // --- Protect: Admin Control Panel ---
  if (pathname.startsWith('/control-panel')) {
    if (!user) {
      return NextResponse.redirect(new URL('/sign-in', request.url))
    }
    if (user.user_metadata?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // --- Protect: Affiliate Dashboard ---
  if (pathname.startsWith('/affiliate-dashboard')) {
    if (!user) {
      return NextResponse.redirect(new URL('/sign-in', request.url))
    }
    const role = user.user_metadata?.role
    if (role !== 'affiliate' && role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|assets|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}