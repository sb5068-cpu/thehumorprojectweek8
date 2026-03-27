import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_superadmin, is_matrix_admin, email, first_name, last_name')
    .eq('id', session.user.id)
    .single()

  if (!profile?.is_superadmin && !profile?.is_matrix_admin) redirect('/login?error=unauthorized')

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar userEmail={profile.email || session.user.email} userName={`${profile.first_name || ''} ${profile.last_name || ''}`.trim()} />
      <main style={{ flex: 1, overflow: 'auto', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  )
}
