'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { insertFields, updateFields } from '@/lib/db-helpers'
import Link from 'next/link'
import Modal from '@/components/Modal'

const blank = { slug: '', description: '' }

export default function FlavorsPage() {
  const [flavors, setFlavors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editRow, setEditRow] = useState<any>(null)
  const [deleteRow, setDeleteRow] = useState<any>(null)
  const [form, setForm] = useState(blank)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const supabase = createClient()

  async function load() {
    const { data } = await supabase.from('humor_flavors').select('*').order('created_datetime_utc', { ascending: false })
    setFlavors(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function handleCreate() {
    if (!form.slug.trim()) return
    setSaving(true)
    const { error } = await supabase.from('humor_flavors').insert({
      slug: form.slug.trim().toLowerCase().replace(/\s+/g, '-'),
      description: form.description || null,
      ...(await insertFields()),
    })
    setSaving(false)
    if (error) { alert(error.message); return }
    setShowCreate(false); setForm(blank); load()
  }

  async function handleUpdate() {
    setSaving(true)
    const { error } = await supabase.from('humor_flavors').update({
      slug: editRow.slug.trim().toLowerCase().replace(/\s+/g, '-'),
      description: editRow.description || null,
      ...(await updateFields()),
    }).eq('id', editRow.id)
    setSaving(false)
    if (error) { alert(error.message); return }
    setEditRow(null); load()
  }

  async function handleDelete() {
    // Delete steps first
    await supabase.from('humor_flavor_steps').delete().eq('humor_flavor_id', deleteRow.id)
    const { error } = await supabase.from('humor_flavors').delete().eq('id', deleteRow.id)
    if (error) { alert(error.message); return }
    setDeleteRow(null); load()
  }

  const filtered = flavors.filter(f =>
    (f.slug || '').toLowerCase().includes(search.toLowerCase()) ||
    (f.description || '').toLowerCase().includes(search.toLowerCase())
  )

  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono, monospace', marginBottom: 5, letterSpacing: '0.08em' }

  function FlavorForm({ data, onChange }: { data: any, onChange: (k: string, v: any) => void }) {
    return (
      <>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>SLUG *</label>
          <input value={data.slug || ''} onChange={e => onChange('slug', e.target.value)} placeholder="e.g. dry-wit, absurdist, dark-humor" />
          <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Lowercase, hyphens only. This is the unique identifier.</p>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>DESCRIPTION</label>
          <textarea value={data.description || ''} onChange={e => onChange('description', e.target.value)}
            rows={3} style={{ resize: 'vertical' }} placeholder="Describe what this humor flavor does..." />
        </div>
      </>
    )
  }

  return (
    <div style={{ padding: '32px 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Humor Flavors</h1>
          <p style={{ fontSize: 13, color: 'var(--text2)' }}>Each flavor is a prompt chain that generates captions in a specific style</p>
        </div>
        <button onClick={() => { setForm(blank); setShowCreate(true) }} className="btn-primary">
          + New Flavor
        </button>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Search flavors..." style={{ width: 320, marginBottom: 20 }} />

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>
          No flavors found. Create your first humor flavor!
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filtered.map(flavor => (
            <div key={flavor.id} className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <span style={{
                  fontFamily: 'DM Mono, monospace', fontSize: 12, fontWeight: 500,
                  color: 'var(--accent)', background: 'rgba(232,68,10,0.1)',
                  border: '1px solid rgba(232,68,10,0.2)', padding: '3px 10px', borderRadius: 5,
                }}>{flavor.slug}</span>
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: 'var(--text3)' }}>#{flavor.id}</span>
              </div>

              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5, flex: 1 }}>
                {flavor.description || <span style={{ color: 'var(--text3)', fontStyle: 'italic' }}>No description</span>}
              </p>

              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <Link href={`/dashboard/flavors/${flavor.id}`} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '7px 0', background: 'var(--accent)', color: '#fff',
                  borderRadius: 7, textDecoration: 'none', fontSize: 12, fontWeight: 600, gap: 4,
                }}>
                  ⛓ Edit Steps
                </Link>
                <button onClick={() => setEditRow({ ...flavor })} style={{
                  padding: '7px 12px', background: 'transparent',
                  border: '1px solid var(--border2)', borderRadius: 7, color: 'var(--text2)', fontSize: 12,
                }}>Edit</button>
                <button onClick={() => setDeleteRow(flavor)} style={{
                  padding: '7px 12px', background: 'transparent',
                  border: '1px solid var(--border2)', borderRadius: 7, color: 'var(--text2)', fontSize: 12,
                }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <Modal title="New Humor Flavor" onClose={() => setShowCreate(false)} width={480}>
          <FlavorForm data={form} onChange={(k, v) => setForm(f => ({ ...f, [k]: v }))} />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleCreate} disabled={saving || !form.slug.trim()} className="btn-primary" style={{ opacity: !form.slug.trim() ? 0.5 : 1 }}>
              {saving ? 'Creating...' : 'Create Flavor'}
            </button>
          </div>
        </Modal>
      )}

      {editRow && (
        <Modal title="Edit Humor Flavor" onClose={() => setEditRow(null)} width={480}>
          <FlavorForm data={editRow} onChange={(k, v) => setEditRow((r: any) => ({ ...r, [k]: v }))} />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setEditRow(null)} className="btn-secondary">Cancel</button>
            <button onClick={handleUpdate} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </Modal>
      )}

      {deleteRow && (
        <Modal title="Delete Flavor" onClose={() => setDeleteRow(null)} width={420}>
          <p style={{ color: 'var(--text2)', marginBottom: 8 }}>
            Delete flavor <strong style={{ color: 'var(--accent)' }}>{deleteRow.slug}</strong>?
          </p>
          <p style={{ color: 'var(--text3)', fontSize: 12, marginBottom: 20 }}>
            This will also delete all steps associated with this flavor. This cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setDeleteRow(null)} className="btn-secondary">Cancel</button>
            <button onClick={handleDelete} style={{ padding: '8px 20px', background: 'var(--red)', border: 'none', borderRadius: 7, color: '#fff', fontWeight: 600 }}>
              Delete Flavor &amp; Steps
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
