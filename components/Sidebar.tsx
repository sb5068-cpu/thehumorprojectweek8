'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useTheme } from './ThemeProvider'

export default function Sidebar({ userEmail, userName }: { userEmail?: string, userName?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navItems = [
    { href: '/dashboard', label: 'Overview', icon: '▦' },
    { href: '/dashboard/flavors', label: 'Humor Flavors', icon: '◆' },
  ]

  const themeOptions: { value: 'light' | 'dark' | 'system', label: string, icon: string }[] = [
    { value: 'light', label: 'Light', icon: '☀' },
    { value: 'dark', label: 'Dark', icon: '☾' },
    { value: 'system', label: 'System', icon: '⊙' },
  ]

  return (
    <aside style={{
      width: 228, minHeight: '100vh', background: 'var(--bg2)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      position: 'sticky', top: 0, height: '100vh',
      overflow: 'auto', flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'var(--accent)', color: '#fff',
          fontFamily: 'DM Mono, monospace', fontSize: 9, fontWeight: 500,
          padding: '3px 8px', borderRadius: 3, letterSpacing: '0.1em', marginBottom: 10,
        }}>⛓ PROMPT CHAIN TOOL</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Humor Flavor Builder</div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Manage flavors &amp; steps</div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px' }}>
        {navItems.map(item => {
          const active = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '8px 10px', borderRadius: 7, marginBottom: 2,
              color: active ? 'var(--accent)' : 'var(--text2)',
              background: active ? 'rgba(232,68,10,0.08)' : 'transparent',
              textDecoration: 'none', fontSize: 13, fontWeight: active ? 600 : 400,
            }}>
              <span style={{ fontSize: 11 }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Theme switcher */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'DM Mono, monospace', letterSpacing: '0.08em', marginBottom: 8 }}>THEME</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {themeOptions.map(opt => (
            <button key={opt.value} onClick={() => setTheme(opt.value)} title={opt.label} style={{
              flex: 1, padding: '6px 0', borderRadius: 6, fontSize: 13,
              background: theme === opt.value ? 'var(--accent)' : 'var(--bg3)',
              border: `1px solid ${theme === opt.value ? 'var(--accent)' : 'var(--border)'}`,
              color: theme === opt.value ? '#fff' : 'var(--text2)',
            }}>{opt.icon}</button>
          ))}
        </div>
      </div>

      {/* User */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
        {userName && <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{userName}</div>}
        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail}</div>
        <button onClick={handleSignOut} style={{
          width: '100%', padding: '7px 12px', background: 'transparent',
          border: '1px solid var(--border)', borderRadius: 6,
          color: 'var(--text2)', fontSize: 12, textAlign: 'left' as const,
        }}>Sign out</button>
      </div>
    </aside>
  )
}
