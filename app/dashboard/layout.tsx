import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies()

  // 1. Initialize Supabase for Server Components
  // Notice we only need 'getAll' here because Server Components only read cookies, they don't set them.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )

  // 2. Get the current user
  const { data: { user } } = await supabase.auth.getUser()

  // 3. If no user is logged in, boot them to the login page
  if (!user) {
    redirect('/login')
  }

  // 4. THE SAFE DATABASE QUERY
  // This is the code that crashed Middleware, but it works perfectly here!
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_superadmin, is_matrix_admin')
    .eq('id', user.id)
    .single()

  // 5. If they are not an admin, kick them out with an error parameter
  if (!profile?.is_superadmin && !profile?.is_matrix_admin) {
    redirect('/login?error=unauthorized')
  }

  // 6. If they passed all checks, render the page securely
  return <>{children}</>
}