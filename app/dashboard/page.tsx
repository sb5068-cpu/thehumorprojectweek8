import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient()

  const [
    { count: flavorCount },
    { count: stepCount },
    { count: captionCount },
    { data: recentFlavors },
  ] = await Promise.all([
    supabase.from('humor_flavors').select('*', { count: 'exact', head: true }),
    supabase.from('humor_flavor_steps').select('*', { count: 'exact', head: true }),
    supabase.from('captions').select('*', { count: 'exact', head: true }),
    supabase.from('humor_flavors').select('id, slug, description, created_datetime_utc').order('created_datetime_utc', { ascending: false }).limit(5),
  ])

  const stats = [
    { label: 'Humor Flavors', value: flavorCount, color: 'var(--accent)', icon: '◆' },
    { label: 'Total Steps', value: stepCount, color: 'var(--blue)', icon: '⛓' },
    { label: 'Captions Generated', value: captionCount, color: 'var(--green)', icon: '💬' },
  ]

  return (
    <div style={{ padding: '32px 40px', maxWidth: 900 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Overview</h1>
        <p style={{ color: 'var(--text2)', fontSize: 13 }}>Prompt chain tool — build and test humor flavor pipelines</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 36 }}>
        {stats.map(s => (
          <div key={s.label} className="card" style={{ padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.color }} />
            <div style={{ fontSize: 32, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'DM Mono, monospace', color: 'var(--text)' }}>
              {s.value?.toLocaleString() ?? '—'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent flavors */}
      <div className="card">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700 }}>Recent Humor Flavors</h2>
          <Link href="/dashboard/flavors" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
            View all →
          </Link>
        </div>
        {recentFlavors?.map((f, i) => (
          <Link key={f.id} href={`/dashboard/flavors/${f.id}`} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 20px', textDecoration: 'none',
            borderBottom: i < recentFlavors.length - 1 ? '1px solid var(--border)' : 'none',
          }}
            onMouseOver={e => (e.currentTarget.style.background = 'var(--bg3)')}
            onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
          >
            <span style={{
              fontFamily: 'DM Mono, monospace', fontSize: 11, color: 'var(--accent)',
              background: 'rgba(232,68,10,0.1)', border: '1px solid rgba(232,68,10,0.2)',
              padding: '2px 8px', borderRadius: 4, flexShrink: 0,
            }}>{f.slug}</span>
            <span style={{ fontSize: 13, color: 'var(--text2)', flex: 1 }}>{f.description?.slice(0, 80) || 'No description'}</span>
            <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono, monospace', flexShrink: 0 }}>
              {f.created_datetime_utc ? new Date(f.created_datetime_utc).toLocaleDateString() : ''}
            </span>
          </Link>
        ))}
      </div>

      {/* Quick start */}
      <div style={{ marginTop: 24 }}>
        <Link href="/dashboard/flavors" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '12px 24px', background: 'var(--accent)', color: '#fff',
          borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 14,
        }}>
          ◆ Manage Humor Flavors
        </Link>
      </div>
    </div>
  )
}
