'use client'
import { useEffect } from 'react'

export default function Modal({ title, onClose, children, width = 520 }: {
  title: string, onClose: () => void, children: React.ReactNode, width?: number
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, backdropFilter: 'blur(4px)',
    }}>
      <div className="card" style={{
        width, maxWidth: '92vw', maxHeight: '88vh', overflow: 'auto',
        boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
      }}>
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, background: 'var(--bg2)', zIndex: 1,
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 700 }}>{title}</h2>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none',
            color: 'var(--text2)', fontSize: 20, lineHeight: 1, padding: '2px 6px',
          }}>×</button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  )
}
