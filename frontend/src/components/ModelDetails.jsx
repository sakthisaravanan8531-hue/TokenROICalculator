import { useState, useMemo } from 'react'
import { fmtPrice, fmtUSD } from '../utils/pricing.js'

export default function ModelDetails({ catalog, initialModel }) {
  const [query,  setQuery]  = useState('')
  const [selected, setSelected] = useState(initialModel || null)

  const filtered = useMemo(() => {
    if (!query) return catalog
    const q = query.toLowerCase()
    return catalog.filter(m =>
      m.name?.toLowerCase().includes(q) ||
      m.provider?.toLowerCase().includes(q) ||
      m.modelId?.toLowerCase().includes(q) ||
      m.useCase?.toLowerCase().includes(q)
    )
  }, [catalog, query])

  const model = selected || catalog[0]

  return (
    <div className="details-layout">
      <section className="panel">
        <h2>Model Details</h2>
        <div className="grid-2">
          <label>
            Search models
            <input
              type="search"
              placeholder="Name, provider, model ID, or use case"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </label>
          <label>
            Model
            <select
              value={model?.modelId || ''}
              onChange={e => setSelected(catalog.find(m => m.modelId === e.target.value) || null)}
            >
              {filtered.map(m => (
                <option key={m.modelId} value={m.modelId}>{m.name} — {m.provider}</option>
              ))}
            </select>
          </label>
        </div>
        {filtered.length === 0 && <p style={{color:'var(--muted)',fontSize:'.85rem'}}>No models match your search.</p>}
      </section>

      {model && (
        <section className="panel detail-card" id="detail-card">
          <h2>{model.name}</h2>
          <p style={{color:'var(--muted)',fontSize:'.82rem',marginBottom:'20px',fontFamily:'var(--font-mono)'}}>{model.modelId}</p>

          <div className="split">
            <div className="split-cell">
              <h3>Accuracy &amp; Benchmark Tier</h3>
              <p style={{fontWeight:600}}>{model.accuracy || '—'}</p>
            </div>
            <div className="split-cell">
              <h3>Domain &amp; Field</h3>
              <span className="tag">{model.category || '—'}</span>
            </div>
            <div className="split-cell">
              <h3>Provider</h3>
              <p>{model.provider}</p>
            </div>
            <div className="split-cell">
              <h3>License / Access</h3>
              <p>{model.basis || '—'}</p>
            </div>
            <div className="split-cell">
              <h3>Use Cases &amp; Strengths</h3>
              <p style={{fontSize:'.85rem'}}>{model.useCase || '—'}</p>
            </div>
            {model.parameters && (
              <div className="split-cell">
                <h3>Parameters &amp; Capabilities</h3>
                <p style={{fontSize:'.85rem',fontFamily:'var(--font-mono)'}}>{model.parameters}</p>
              </div>
            )}
            <div className="split-cell">
              <h3>Pricing</h3>
              <p style={{fontFamily:'var(--font-mono)'}}>
                Input: {fmtPrice(model.inputPrice)}<br />
                Output: {fmtPrice(model.outputPrice)}
              </p>
              {model.basis && <p style={{fontSize:'.8rem',color:'var(--muted)',marginTop:'4px'}}>{model.basis}</p>}
            </div>
            {model.source && (
              <div className="split-cell">
                <h3>Documentation</h3>
                <a href={model.source} target="_blank" rel="noopener noreferrer">
                  View pricing or model source ↗
                </a>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
