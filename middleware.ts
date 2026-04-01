import { createServerClient, type CookieOptions } from '@supabase/ssr' // Added "type CookieOptions"
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        // Added the type definition to "cookiesToSet" below
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // NOTE: If you add .from('profiles') here, you will get the __dirname error again.
  // Stick to getUser() or getSession() in the middleware!
  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] }