'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { insertFields, updateFields } from '@/lib/db-helpers'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Modal from '@/components/Modal'

const blankStep = {
  description: '', llm_system_prompt: '', llm_user_prompt: '',
  llm_temperature: 0.8, llm_model_id: '', humor_flavor_step_type_id: '',
  llm_input_type_id: 1, llm_output_type_id: 1,
}

export default function FlavorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const flavorId = params.id as string
  const supabase = createClient()

  const [flavor, setFlavor] = useState<any>(null)
  const [steps, setSteps] = useState<any[]>([])
  const [models, setModels] = useState<any[]>([])
  const [stepTypes, setStepTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editStep, setEditStep] = useState<any>(null)
  const [deleteStep, setDeleteStep] = useState<any>(null)
  const [form, setForm] = useState<any>(blankStep)
  const [saving, setSaving] = useState(false)

  // Test panel
  const [testImages, setTestImages] = useState<any[]>([])
  const [selectedImageId, setSelectedImageId] = useState<string>('')
  const [testing, setTesting] = useState(false)
  const [testResults, setTestResults] = useState<any[]>([])
  const [testError, setTestError] = useState<string>('')

  // Captions panel
  const [captions, setCaptions] = useState<any[]>([])
  const [captionsLoading, setCaptionsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'steps' | 'test' | 'captions'>('steps')

  async function load() {
    const [
      { data: flavorData },
      { data: stepsData },
      { data: modelsData },
      { data: stepTypesData },
    ] = await Promise.all([
      supabase.from('humor_flavors').select('*').eq('id', flavorId).single(),
      supabase.from('humor_flavor_steps').select('*, llm_models(name), humor_flavor_step_types(slug, description)').eq('humor_flavor_id', flavorId).order('order_by'),
      supabase.from('llm_models').select('id, name, provider_model_id').order('name'),
      supabase.from('humor_flavor_step_types').select('id, slug, description').order('slug'),
    ])
    setFlavor(flavorData)
    setSteps(stepsData || [])
    setModels(modelsData || [])
    setStepTypes(stepTypesData || [])
    setLoading(false)
  }

  async function loadTestImages() {
    const { data } = await supabase.from('images').select('id, url, image_description').eq('is_common_use', true).limit(20)
    setTestImages(data || [])
    if (data && data.length > 0) setSelectedImageId(data[0].id)
  }

  async function loadCaptions() {
    setCaptionsLoading(true)
    const { data } = await supabase.from('captions').select('id, content, like_count, created_datetime_utc, is_public, is_featured').eq('humor_flavor_id', flavorId).order('created_datetime_utc', { ascending: false }).limit(50)
    setCaptions(data || [])
    setCaptionsLoading(false)
  }

  useEffect(() => { load(); loadTestImages() }, [flavorId])
  useEffect(() => { if (activeTab === 'captions') loadCaptions() }, [activeTab])

  async function handleCreateStep() {
    setSaving(true)
    const nextOrder = steps.length > 0 ? Math.max(...steps.map(s => s.order_by)) + 1 : 1
    const { error } = await supabase.from('humor_flavor_steps').insert({
      humor_flavor_id: Number(flavorId),
      description: form.description || null,
      llm_system_prompt: form.llm_system_prompt || null,
      llm_user_prompt: form.llm_user_prompt || null,
      llm_temperature: Number(form.llm_temperature),
      llm_model_id: form.llm_model_id ? Number(form.llm_model_id) : null,
      humor_flavor_step_type_id: form.humor_flavor_step_type_id ? Number(form.humor_flavor_step_type_id) : null,
      llm_input_type_id: Number(form.llm_input_type_id) || 1,
      llm_output_type_id: Number(form.llm_output_type_id) || 1,
      order_by: nextOrder,
      ...(await insertFields()),
    })
    setSaving(false)
    if (error) { alert(error.message); return }
    setShowCreate(false); setForm(blankStep); load()
  }

  async function handleUpdateStep() {
    setSaving(true)
    const { error } = await supabase.from('humor_flavor_steps').update({
      description: editStep.description || null,
      llm_system_prompt: editStep.llm_system_prompt || null,
      llm_user_prompt: editStep.llm_user_prompt || null,
      llm_temperature: Number(editStep.llm_temperature),
      llm_model_id: editStep.llm_model_id ? Number(editStep.llm_model_id) : null,
      humor_flavor_step_type_id: editStep.humor_flavor_step_type_id ? Number(editStep.humor_flavor_step_type_id) : null,
      llm_input_type_id: Number(editStep.llm_input_type_id) || 1,
      llm_output_type_id: Number(editStep.llm_output_type_id) || 1,
      ...(await updateFields()),
    }).eq('id', editStep.id)
    setSaving(false)
    if (error) { alert(error.message); return }
    setEditStep(null); load()
  }

  async function handleDeleteStep() {
    const { error } = await supabase.from('humor_flavor_steps').delete().eq('id', deleteStep.id)
    if (error) { alert(error.message); return }
    setDeleteStep(null)
    // Reorder remaining steps
    const remaining = steps.filter(s => s.id !== deleteStep.id)
    const extra = await updateFields()
    for (let i = 0; i < remaining.length; i++) {
      await supabase.from('humor_flavor_steps').update({ order_by: i + 1, ...extra }).eq('id', remaining[i].id)
    }
    load()
  }

  async function moveStep(stepId: number, direction: 'up' | 'down') {
    const idx = steps.findIndex(s => s.id === stepId)
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === steps.length - 1) return

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    const current = steps[idx]
    const swap = steps[swapIdx]
    const extra = await updateFields()

    await Promise.all([
      supabase.from('humor_flavor_steps').update({ order_by: swap.order_by, ...extra }).eq('id', current.id),
      supabase.from('humor_flavor_steps').update({ order_by: current.order_by, ...extra }).eq('id', swap.id),
    ])
    load()
  }

  async function handleTest() {
    if (!selectedImageId) return
    setTesting(true)
    setTestError('')
    setTestResults([])

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Not authenticated')

      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }

      // Get image URL
      const { data: image } = await supabase.from('images').select('url').eq('id', selectedImageId).single()

      // Generate captions via REST API
      const res = await fetch('https://api.almostcrackd.ai/pipeline/generate-captions', {
        method: 'POST', headers,
        body: JSON.stringify({ imageId: selectedImageId }),
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`API error ${res.status}: ${errText}`)
      }

      const data = await res.json()
      const captionsArray = Array.isArray(data) ? data : (data.data || data.captions || [])
      setTestResults(captionsArray)
    } catch (err: any) {
      setTestError(err.message || 'Test failed')
    } finally {
      setTesting(false)
    }
  }

  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono, monospace', marginBottom: 5, letterSpacing: '0.08em' }

  function StepForm({ data, onChange }: { data: any, onChange: (k: string, v: any) => void }) {
    return (
      <>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>STEP DESCRIPTION</label>
          <input value={data.description || ''} onChange={e => onChange('description', e.target.value)} placeholder="e.g. Describe the image" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>LLM MODEL</label>
            <select value={data.llm_model_id || ''} onChange={e => onChange('llm_model_id', e.target.value)}>
              <option value="">— None —</option>
              {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>STEP TYPE</label>
            <select value={data.humor_flavor_step_type_id || ''} onChange={e => onChange('humor_flavor_step_type_id', e.target.value)}>
              <option value="">— None —</option>
              {stepTypes.map(t => <option key={t.id} value={t.id}>{t.slug}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>TEMPERATURE</label>
            <input type="number" min={0} max={2} step={0.1} value={data.llm_temperature ?? 0.8} onChange={e => onChange('llm_temperature', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>INPUT TYPE ID</label>
            <input type="number" value={data.llm_input_type_id ?? 1} onChange={e => onChange('llm_input_type_id', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>OUTPUT TYPE ID</label>
            <input type="number" value={data.llm_output_type_id ?? 1} onChange={e => onChange('llm_output_type_id', e.target.value)} />
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>SYSTEM PROMPT</label>
          <textarea value={data.llm_system_prompt || ''} onChange={e => onChange('llm_system_prompt', e.target.value)}
            rows={4} style={{ resize: 'vertical', fontFamily: 'DM Mono, monospace', fontSize: 12 }}
            placeholder="You are a helpful assistant that..." />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>USER PROMPT</label>
          <textarea value={data.llm_user_prompt || ''} onChange={e => onChange('llm_user_prompt', e.target.value)}
            rows={4} style={{ resize: 'vertical', fontFamily: 'DM Mono, monospace', fontSize: 12 }}
            placeholder="Given this image description: {description}..." />
        </div>
      </>
    )
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>Loading...</div>
  if (!flavor) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--red)' }}>Flavor not found</div>

  return (
    <div style={{ padding: '28px 40px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Link href="/dashboard/flavors" style={{ fontSize: 12, color: 'var(--text3)', textDecoration: 'none', marginBottom: 8, display: 'inline-block' }}>
          ← Back to flavors
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            fontFamily: 'DM Mono, monospace', fontSize: 13, fontWeight: 600,
            color: 'var(--accent)', background: 'rgba(232,68,10,0.1)',
            border: '1px solid rgba(232,68,10,0.2)', padding: '4px 12px', borderRadius: 5,
          }}>{flavor.slug}</span>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>
            {flavor.description?.slice(0, 60) || 'Humor Flavor'}
          </h1>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
        {(['steps', 'test', 'captions'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '10px 20px', background: 'transparent', border: 'none',
            borderBottom: `2px solid ${activeTab === tab ? 'var(--accent)' : 'transparent'}`,
            color: activeTab === tab ? 'var(--accent)' : 'var(--text2)',
            fontSize: 13, fontWeight: activeTab === tab ? 600 : 400,
            textTransform: 'capitalize',
          }}>{tab === 'steps' ? `⛓ Steps (${steps.length})` : tab === 'test' ? '🧪 Test' : '💬 Captions'}</button>
        ))}
      </div>

      {/* STEPS TAB */}
      {activeTab === 'steps' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button onClick={() => { setForm(blankStep); setShowCreate(true) }} className="btn-primary">
              + Add Step
            </button>
          </div>

          {steps.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>
              No steps yet. Add your first prompt step!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {steps.map((step, idx) => (
                <div key={step.id} className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    {/* Order badge + move buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 8,
                        background: 'var(--accent)', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'DM Mono, monospace', fontWeight: 700, fontSize: 14,
                      }}>{step.order_by}</div>
                      <button onClick={() => moveStep(step.id, 'up')} disabled={idx === 0} style={{
                        width: 28, height: 24, background: 'var(--bg3)', border: '1px solid var(--border)',
                        borderRadius: 4, color: idx === 0 ? 'var(--text3)' : 'var(--text2)', fontSize: 11,
                      }}>▲</button>
                      <button onClick={() => moveStep(step.id, 'down')} disabled={idx === steps.length - 1} style={{
                        width: 28, height: 24, background: 'var(--bg3)', border: '1px solid var(--border)',
                        borderRadius: 4, color: idx === steps.length - 1 ? 'var(--text3)' : 'var(--text2)', fontSize: 11,
                      }}>▼</button>
                    </div>

                    {/* Step content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                        {step.description && (
                          <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{step.description}</span>
                        )}
                        {step.humor_flavor_step_types?.slug && (
                          <span className="tag" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--blue)', border: '1px solid rgba(59,130,246,0.2)' }}>
                            {step.humor_flavor_step_types.slug}
                          </span>
                        )}
                        {step.llm_models?.name && (
                          <span className="tag" style={{ background: 'rgba(22,163,74,0.1)', color: 'var(--green)', border: '1px solid rgba(22,163,74,0.2)' }}>
                            {step.llm_models.name}
                          </span>
                        )}
                        {step.llm_temperature != null && (
                          <span className="tag" style={{ background: 'rgba(202,138,4,0.1)', color: 'var(--yellow)', border: '1px solid rgba(202,138,4,0.2)' }}>
                            temp={step.llm_temperature}
                          </span>
                        )}
                      </div>

                      {step.llm_system_prompt && (
                        <div style={{ marginBottom: 8 }}>
                          <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'DM Mono, monospace', marginBottom: 3, letterSpacing: '0.06em' }}>SYSTEM</div>
                          <pre style={{
                            fontSize: 11, color: 'var(--text2)', background: 'var(--bg3)',
                            border: '1px solid var(--border)', borderRadius: 6,
                            padding: '8px 12px', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                            maxHeight: 80, overflow: 'auto', margin: 0, fontFamily: 'DM Mono, monospace',
                          }}>{step.llm_system_prompt}</pre>
                        </div>
                      )}

                      {step.llm_user_prompt && (
                        <div>
                          <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'DM Mono, monospace', marginBottom: 3, letterSpacing: '0.06em' }}>USER</div>
                          <pre style={{
                            fontSize: 11, color: 'var(--text2)', background: 'var(--bg3)',
                            border: '1px solid var(--border)', borderRadius: 6,
                            padding: '8px 12px', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                            maxHeight: 80, overflow: 'auto', margin: 0, fontFamily: 'DM Mono, monospace',
                          }}>{step.llm_user_prompt}</pre>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => setEditStep({ ...step, llm_model_id: step.llm_model_id?.toString(), humor_flavor_step_type_id: step.humor_flavor_step_type_id?.toString() })}
                        className="btn-secondary" style={{ padding: '5px 12px', fontSize: 12 }}>Edit</button>
                      <button onClick={() => setDeleteStep(step)}
                        style={{ padding: '5px 12px', background: 'transparent', border: '1px solid var(--border2)', borderRadius: 6, color: 'var(--text2)', fontSize: 12 }}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TEST TAB */}
      {activeTab === 'test' && (
        <div style={{ maxWidth: 800 }}>
          <div className="card" style={{ padding: 24, marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Test this flavor</h3>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20, lineHeight: 1.6 }}>
              Select an image from the test set and generate captions using this humor flavor via the REST API.
            </p>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>SELECT TEST IMAGE</label>
              {testImages.length === 0 ? (
                <p style={{ color: 'var(--text3)', fontSize: 13 }}>No common-use images found. Mark some images as "common use" in the admin panel.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
                  {testImages.map(img => (
                    <div key={img.id} onClick={() => setSelectedImageId(img.id)} style={{
                      border: `2px solid ${selectedImageId === img.id ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                      opacity: selectedImageId === img.id ? 1 : 0.7,
                      transition: 'all 0.15s',
                    }}>
                      {img.url ? (
                        <img src={img.url} alt="" style={{ width: '100%', height: 80, objectFit: 'cover', display: 'block' }}
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      ) : (
                        <div style={{ height: 80, background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: 11 }}>No image</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={handleTest} disabled={testing || !selectedImageId || steps.length === 0} className="btn-primary"
              style={{ opacity: (!selectedImageId || steps.length === 0) ? 0.5 : 1 }}>
              {testing ? '⏳ Generating captions...' : '🧪 Generate Captions'}
            </button>
            {steps.length === 0 && <p style={{ fontSize: 12, color: 'var(--yellow)', marginTop: 8 }}>⚠ Add steps to this flavor before testing.</p>}
          </div>

          {testError && (
            <div style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: 'var(--red)', fontSize: 13 }}>
              ⚠ {testError}
            </div>
          )}

          {testResults.length > 0 && (
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Generated Captions ({testResults.length})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {testResults.map((cap: any, i: number) => (
                  <div key={cap.id || i} style={{
                    padding: '14px 16px', background: 'var(--bg3)',
                    border: '1px solid var(--border)', borderRadius: 8,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{
                        fontFamily: 'DM Mono, monospace', fontSize: 11, color: 'var(--accent)',
                        background: 'rgba(232,68,10,0.1)', padding: '2px 7px', borderRadius: 4, flexShrink: 0,
                      }}>#{i + 1}</span>
                      <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.5, flex: 1 }}>
                        {cap.content || cap.caption || JSON.stringify(cap)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CAPTIONS TAB */}
      {activeTab === 'captions' && (
        <div>
          {captionsLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>Loading captions...</div>
          ) : captions.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>
              No captions generated with this flavor yet.
            </div>
          ) : (
            <div>
              <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
                {captions.length} captions generated using this flavor
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {captions.map((cap, i) => (
                  <div key={cap.id} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <p style={{ flex: 1, fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{cap.content}</p>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                      {cap.is_featured && <span className="tag" style={{ background: 'rgba(234,179,8,0.1)', color: 'var(--yellow)', border: '1px solid rgba(234,179,8,0.2)' }}>★ FEATURED</span>}
                      {cap.is_public && <span className="tag" style={{ background: 'rgba(22,163,74,0.1)', color: 'var(--green)', border: '1px solid rgba(22,163,74,0.2)' }}>PUBLIC</span>}
                      <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'var(--green)' }}>♥ {cap.like_count ?? 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE STEP MODAL */}
      {showCreate && (
        <Modal title="Add Step" onClose={() => setShowCreate(false)} width={640}>
          <StepForm data={form} onChange={(k, v) => setForm((f: any) => ({ ...f, [k]: v }))} />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleCreateStep} disabled={saving} className="btn-primary">
              {saving ? 'Adding...' : 'Add Step'}
            </button>
          </div>
        </Modal>
      )}

      {/* EDIT STEP MODAL */}
      {editStep && (
        <Modal title={`Edit Step ${editStep.order_by}`} onClose={() => setEditStep(null)} width={640}>
          <StepForm data={editStep} onChange={(k, v) => setEditStep((s: any) => ({ ...s, [k]: v }))} />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setEditStep(null)} className="btn-secondary">Cancel</button>
            <button onClick={handleUpdateStep} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Step'}
            </button>
          </div>
        </Modal>
      )}

      {/* DELETE STEP CONFIRM */}
      {deleteStep && (
        <Modal title="Delete Step" onClose={() => setDeleteStep(null)} width={420}>
          <p style={{ color: 'var(--text2)', marginBottom: 8 }}>Delete step {deleteStep.order_by}: <strong>{deleteStep.description || '(no description)'}</strong>?</p>
          <p style={{ color: 'var(--text3)', fontSize: 12, marginBottom: 20 }}>The remaining steps will be reordered automatically.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setDeleteStep(null)} className="btn-secondary">Cancel</button>
            <button onClick={handleDeleteStep} style={{ padding: '8px 20px', background: 'var(--red)', border: 'none', borderRadius: 7, color: '#fff', fontWeight: 600 }}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
