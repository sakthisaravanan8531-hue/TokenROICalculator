import { useState, useMemo, useRef, useEffect } from 'react'
import { estimateCost, fmtUSD, fmtINR, CLOUD_MARKUPS } from '../utils/pricing.js'

export default function ROICalculator({ catalog, onViewDetails }) {
  const [requests,   setRequests]   = useState(25000)
  const [inputTok,   setInputTok]   = useState(2000)
  const [outputTok,  setOutputTok]  = useState(500)
  const [days,       setDays]       = useState(30)
  const [selected,   setSelected]   = useState([])
  const [searchModel, setSearchModel] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const [showINR,    setShowINR]    = useState(false)
  const [batchMode,  setBatchMode]  = useState(false)
  const [showCloud,  setShowCloud]  = useState(false)
  const [customName, setCustomName] = useState('')
  const [customIn,   setCustomIn]   = useState('')
  const [customOut,  setCustomOut]  = useState('')
  const [calculated, setCalculated] = useState([])
  const [status,     setStatus]     = useState('')

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter models based on search term
  const filteredModels = useMemo(() => {
    const q = searchModel.trim().toLowerCase()
    if (!q) return catalog.slice(0, 35) // show first 35 if empty
    return catalog.filter(m =>
      (m.name && m.name.toLowerCase().includes(q)) ||
      (m.provider && m.provider.toLowerCase().includes(q)) ||
      (m.category && m.category.toLowerCase().includes(q))
    ).slice(0, 50)
  }, [catalog, searchModel])

  const handleSelectModel = (model) => {
    if (!model) return
    if (!selected.find(s => s.modelId === model.modelId)) {
      setSelected(prev => [...prev, model])
    }
    setSearchModel('')
    setIsDropdownOpen(false)
  }

  const addCustom = () => {
    if (!customName) { setStatus('Enter a model name.'); return }
    const inp = parseFloat(customIn) || 0
    const out = parseFloat(customOut) || 0
    const m = {
      modelId: `custom-${Date.now()}`,
      name: customName,
      provider: 'Custom',
      category: 'Custom',
      inputPrice: inp,
      outputPrice: out,
      accuracy: '—',
      useCase: 'Custom entry',
    }
    setSelected(prev => [...prev, m])
    setCustomName(''); setCustomIn(''); setCustomOut('')
  }

  const removeModel = (modelId) => setSelected(prev => prev.filter(m => m.modelId !== modelId))

  const calculate = () => {
    if (selected.length === 0) { setStatus('Select at least one model.'); return }
    const batchFactor = batchMode ? 0.5 : 1
    const rows = selected
      .filter(m => m.inputPrice != null && m.outputPrice != null)
      .map(m => {
        const costs = estimateCost({
          inputPrice: Number(m.inputPrice) * batchFactor,
          outputPrice: Number(m.outputPrice) * batchFactor,
          requestsPerDay: requests,
          inputTokens: inputTok,
          outputTokens: outputTok,
          daysPerMonth: days,
        })
        return { ...m, ...costs }
      })
      .sort((a, b) => a.monthlyCost - b.monthlyCost)

    setCalculated(rows)
    setStatus(`${rows.length} model${rows.length !== 1 ? 's' : ''} calculated`)
  }

  const exportCSV = () => {
    if (!calculated.length) return
    const header = 'Model,Provider,Daily (USD),Monthly (USD),Annual (USD)'
    const rows = calculated.map(r =>
      `"${r.name}","${r.provider}",${r.dailyCost.toFixed(2)},${r.monthlyCost.toFixed(2)},${r.annualCost.toFixed(2)}`
    )
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'token-roi-comparison.csv'
    a.click()
  }

  const maxMonthly = calculated.length ? Math.max(...calculated.map(r => r.monthlyCost)) : 1
  const lowest     = calculated[0]

  return (
    <div className="roi-layout">
      {/* Workload */}
      <section className="panel">
        <h2>Workload</h2>
        <div className="grid-4">
          <label>Requests / day<input type="number" min="0" value={requests} onChange={e => setRequests(+e.target.value)} /></label>
          <label>Input tokens / req<input type="number" min="0" value={inputTok} onChange={e => setInputTok(+e.target.value)} /></label>
          <label>Output tokens / req<input type="number" min="0" value={outputTok} onChange={e => setOutputTok(+e.target.value)} /></label>
          <label>Days / month<input type="number" min="1" max="31" value={days} onChange={e => setDays(+e.target.value)} /></label>
        </div>

        <div className="toggle-row">
          <label className="toggle-label"><input type="checkbox" checked={batchMode} onChange={e => setBatchMode(e.target.checked)} /> Batch pricing <span className="badge-green">50% OFF</span></label>
          <label className="toggle-label"><input type="checkbox" checked={showINR} onChange={e => setShowINR(e.target.checked)} /> Show ₹ INR <span className="badge-orange">₹84.5/USD</span></label>
          <label className="toggle-label"><input type="checkbox" checked={showCloud} onChange={e => setShowCloud(e.target.checked)} /> Cloud provider markup</label>
        </div>
        <small>Base token rates in USD. Batch applies 50% discount. INR at ₹84.5/USD. Cloud: AWS +15%, Azure +18%, GCP +12%.</small>
      </section>

      {/* Model Selection */}
      <section className="panel">
        <h2>Cost Comparison</h2>
        <p style={{color:'var(--muted)',fontSize:'.85rem',marginBottom:'12px'}}>
          Search from all {catalog.length} AI models by name, provider, or capability to compare workload pricing:
        </p>

        {/* Searchable Combobox */}
        <div ref={dropdownRef} style={{position:'relative',marginBottom:'14px'}}>
          <div style={{display:'flex',gap:'10px',alignItems:'center'}}>
            <div style={{position:'relative',flex:1}}>
              <span style={{position:'absolute',left:'14px',top:'50%',transform:'translateY(-50%)',color:'var(--muted)',pointerEvents:'none'}}>🔍</span>
              <input
                type="text"
                value={searchModel}
                onChange={e => {
                  setSearchModel(e.target.value)
                  setIsDropdownOpen(true)
                }}
                onFocus={() => setIsDropdownOpen(true)}
                placeholder={`Search model name or provider (e.g. GPT-4o, Claude, Mistral, DeepSeek)...`}
                style={{width:'100%',paddingLeft:'38px',paddingRight:'30px'}}
              />
              {searchModel && (
                <button
                  type="button"
                  onClick={() => setSearchModel('')}
                  style={{position:'absolute',right:'10px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:'1.1rem'}}
                >
                  ×
                </button>
              )}
            </div>
            <button
              type="button"
              className="primary"
              onClick={() => {
                if (filteredModels.length > 0) {
                  handleSelectModel(filteredModels[0])
                }
              }}
            >
              + Add
            </button>
          </div>

          {/* Autocomplete Dropdown List */}
          {isDropdownOpen && (
            <div
              style={{
                position:'absolute',
                top:'calc(100% + 4px)',
                left:0,
                right:0,
                background:'var(--panel)',
                border:'1px solid var(--line-s)',
                borderRadius:'var(--r-md)',
                boxShadow:'var(--sh-md)',
                maxHeight:'320px',
                overflowY:'auto',
                zIndex:100,
                padding:'6px'
              }}
            >
              {filteredModels.length === 0 ? (
                <div style={{padding:'12px',textAlign:'center',color:'var(--muted)',fontSize:'.85rem'}}>
                  No models matching "{searchModel}"
                </div>
              ) : (
                filteredModels.map(m => {
                  const alreadySelected = selected.some(s => s.modelId === m.modelId)
                  return (
                    <div
                      key={m.modelId}
                      onClick={() => handleSelectModel(m)}
                      style={{
                        padding:'10px 14px',
                        display:'flex',
                        justifyContent:'space-between',
                        alignItems:'center',
                        borderRadius:'var(--r-sm)',
                        cursor: alreadySelected ? 'default' : 'pointer',
                        background: alreadySelected ? 'var(--field)' : 'transparent',
                        opacity: alreadySelected ? 0.6 : 1,
                        transition:'background .12s'
                      }}
                      onMouseEnter={e => {
                        if (!alreadySelected) e.currentTarget.style.background = 'rgba(99,102,241,.12)'
                      }}
                      onMouseLeave={e => {
                        if (!alreadySelected) e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <div>
                        <div style={{fontWeight:600,color:'var(--ink)',fontSize:'.9rem'}}>{m.name}</div>
                        <div style={{color:'var(--muted)',fontSize:'.78rem'}}>
                          {m.provider} {m.category ? `• ${m.category}` : ''}
                        </div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontFamily:'var(--font-mono)',fontSize:'.82rem',color:'var(--link)'}}>
                          ${Number(m.inputPrice || 0).toFixed(2)} / ${Number(m.outputPrice || 0).toFixed(2)}
                        </div>
                        <span style={{fontSize:'.7rem',color: alreadySelected ? 'var(--muted)' : 'var(--positive)'}}>
                          {alreadySelected ? 'Added' : '+ Click to add'}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>

        {selected.length > 0 && (
          <div className="selected-chips" style={{marginTop:'12px'}}>
            {selected.map(m => (
              <span key={m.modelId} className="selected-chip">
                {m.name}
                <button onClick={() => removeModel(m.modelId)} aria-label={`Remove ${m.name}`}>×</button>
              </span>
            ))}
          </div>
        )}

        <div className="actions" style={{marginTop:'16px'}}>
          <button className="primary" onClick={calculate}>⚡ Calculate Costs</button>
          {calculated.length > 0 && <button onClick={exportCSV}>📊 Export CSV</button>}
        </div>
        {status && <p className="status">{status}</p>}

        {/* Custom pricing */}
        <details className="comparison-option" style={{marginTop:'16px'}}>
          <summary>+ Custom pricing</summary>
          <div className="grid-3" style={{marginTop:'12px'}}>
            <label>Model name<input type="text" value={customName} onChange={e => setCustomName(e.target.value)} placeholder="My Model" /></label>
            <label>Input $/1M tokens<input type="number" min="0" step="any" value={customIn} onChange={e => setCustomIn(e.target.value)} /></label>
            <label>Output $/1M tokens<input type="number" min="0" step="any" value={customOut} onChange={e => setCustomOut(e.target.value)} /></label>
          </div>
          <button onClick={addCustom} style={{marginTop:'10px'}}>Add Custom Model</button>
        </details>
      </section>

      {/* Results */}
      {calculated.length > 0 && (
        <section className="panel">
          <div className="results-head">
            <h2>Cost Results</h2>
            <p style={{color:'var(--muted)',fontSize:'.85rem'}}>Estimated spend in USD{batchMode ? ' (50% batch discount applied)' : ''}</p>
          </div>

          {/* Metric Cards */}
          <div className="metrics">
            <div className="metric"><dt>Models compared</dt><dd>{calculated.length}</dd></div>
            <div className="metric">
              <dt>Lowest monthly</dt>
              <dd>{fmtUSD(lowest.monthlyCost)}</dd>
              <small>{lowest.name}</small>
            </div>
            {showINR && (
              <div className="metric"><dt>Lowest (INR)</dt><dd>{fmtINR(lowest.monthlyCost)}</dd><small>at ₹84.5/USD</small></div>
            )}
            {batchMode && (
              <div className="metric"><dt>Batch savings/mo</dt><dd>{fmtUSD(calculated.reduce((s,r)=>s+r.monthlyCost, 0))}</dd><small>vs full price</small></div>
            )}
          </div>

          {/* Bar Chart */}
          <div className="cost-chart">
            <h3>Monthly Cost by Model (USD)</h3>
            <ul className="chart-list">
              {calculated.map(r => (
                <li key={r.modelId} className="chart-item">
                  <div className="chart-label">
                    <span className="chart-name">{r.name}</span>
                    <div style={{display:'flex',gap:'10px',alignItems:'center'}}>
                      <span className="chart-val">{fmtUSD(r.monthlyCost)}</span>
                      {showINR && <span className="chart-inr">{fmtINR(r.monthlyCost)}</span>}
                    </div>
                  </div>
                  <div className="chart-bar-wrap">
                    <div className="chart-bar" style={{width:`${(r.monthlyCost / maxMonthly * 100).toFixed(1)}%`}} />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Cloud Breakdown */}
          {showCloud && (
            <div className="cloud-breakdown">
              <h3>☁ Cloud Provider Markup Estimates (avg monthly)</h3>
              {Object.entries(CLOUD_MARKUPS).map(([provider, markup]) => {
                const avg = calculated.reduce((s,r) => s + r.monthlyCost, 0) / calculated.length
                const cost = avg * (1 + markup)
                return (
                  <div key={provider} className="cloud-row">
                    <span className="cloud-name">{provider}</span>
                    <span className="cloud-markup">+{(markup*100).toFixed(0)}% markup</span>
                    <span className="cloud-cost">{fmtUSD(cost)}/mo avg</span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Results Table */}
          <div className="scroll" style={{marginTop:'16px'}}>
            <table className="results-table">
              <thead>
                <tr>
                  <th>Model</th>
                  <th>USD / day</th>
                  <th>USD / month</th>
                  {showINR   && <th>INR / month</th>}
                  <th>USD / year</th>
                  {showCloud && <th>AWS / Azure / GCP /mo</th>}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {calculated.map((r, i) => (
                  <tr key={r.modelId}>
                    <td>
                      {i === 0 && <span className="badge-green" style={{marginRight:'6px'}}>★ Best</span>}
                      <strong>{r.name}</strong>
                      <span style={{display:'block',fontSize:'.74rem',color:'var(--muted)'}}>{r.provider}</span>
                    </td>
                    <td style={{fontFamily:'var(--font-mono)'}}>{fmtUSD(r.dailyCost)}</td>
                    <td style={{fontFamily:'var(--font-mono)'}}>{fmtUSD(r.monthlyCost)}</td>
                    {showINR   && <td style={{fontFamily:'var(--font-mono)',color:'var(--inr)'}}>{fmtINR(r.monthlyCost)}</td>}
                    <td style={{fontFamily:'var(--font-mono)'}}>{fmtUSD(r.annualCost)}</td>
                    {showCloud && (
                      <td style={{fontFamily:'var(--font-mono)',fontSize:'.76rem'}}>
                        {fmtUSD(r.monthlyCost*1.15)} / {fmtUSD(r.monthlyCost*1.18)} / {fmtUSD(r.monthlyCost*1.12)}
                      </td>
                    )}
                    <td>
                      <button className="btn-sm" onClick={() => onViewDetails(r)}>Details</button>
                      <button className="btn-sm danger" onClick={() => removeModel(r.modelId)} style={{marginLeft:'6px'}}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
