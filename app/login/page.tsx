'use client'
import { createClient } from '@/lib/supabase'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginContent() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div className="card" style={{ width: 400, padding: '48px' }}>
        <div style={{ marginBottom: 36 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--accent)', color: '#fff',
            fontFamily: 'DM Mono, monospace', fontSize: 10, fontWeight: 500,
            padding: '4px 10px', borderRadius: 4, letterSpacing: '0.1em', marginBottom: 16,
          }}>
            ⛓ PROMPT CHAIN TOOL
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
            Humor Flavor Builder
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.6 }}>
            Build and test humor flavor prompt chains. Requires superadmin or matrix admin access.
          </p>
        </div>

        {error === 'unauthorized' && (
          <div style={{
            background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.3)',
            borderRadius: 8, padding: '12px 16px', marginBottom: 20, color: 'var(--red)', fontSize: 13,
          }}>
            ⚠ Your account does not have the required access.
          </div>
        )}

        <button onClick={handleGoogleLogin} style={{
          width: '100%', padding: '12px 20px',
          background: 'var(--bg3)', border: '1px solid var(--border2)',
          borderRadius: 8, color: 'var(--text)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          fontSize: 14, fontWeight: 500,
        }}
          onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
          onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border2)')}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
            <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
            <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18z"/>
            <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
          </svg>
          Continue with Google
        </button>

        <p style={{ marginTop: 20, textAlign: 'center', color: 'var(--text3)', fontSize: 11 }}>
          Access restricted to superadmin &amp; matrix admins
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <Suspense><LoginContent /></Suspense>
}
