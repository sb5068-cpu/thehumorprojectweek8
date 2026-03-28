import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // This check is Edge-safe because it only reads the cookie/token
  const { data: { session } } = await supabase.auth.getSession()
  const { pathname } = request.nextUrl

  if (pathname === '/login' || pathname.startsWith('/auth')) {
    return response
  }

  // If no session at all, redirect to login
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // WE REMOVED THE DATABASE QUERY HERE TO AVOID THE __DIRNAME ERROR
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}