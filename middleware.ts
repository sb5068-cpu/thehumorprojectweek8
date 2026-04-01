import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Create a response object that we can attach cookies to
  let supabaseResponse = NextResponse.next({
    request: { headers: request.headers },
  })

  // 2. Initialize the Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        // The explicit types keep the TypeScript compiler happy!
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 3. SECURE EDGE CHECK: This reads the JWT cookie. It does NOT hit the database.
  // It also automatically refreshes the token if it's expired.
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // 4. Let users access the login page and auth callbacks without interference
  if (pathname === '/login' || pathname.startsWith('/auth')) {
    return supabaseResponse
  }

  // 5. If they have no valid token, bounce them to the login page
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 6. If they have a token, let them through! (Your layout.tsx will handle the rest)
  return supabaseResponse
}

export const config = {
  // This tells Next.js NOT to run middleware on static files (images, css, etc.)
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}