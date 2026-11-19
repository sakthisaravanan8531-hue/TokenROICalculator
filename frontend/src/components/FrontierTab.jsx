import { useState, useMemo, useCallback } from 'react'
import frontierData from '../data/frontierModels.json'

const PAGE_SIZE = 50

export default function FrontierTab() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [provider, setProvider] = useState('')
  const [sortKey, setSortKey] = useState('name')
  const [sortAsc, setSortAsc] = useState(true)
  const [page, setPage] = useState(0)

  const categories = useMemo(() => {
    return Array.from(new Set(frontierData.map(m => m.category).filter(Boolean))).sort()
  }, [])

  const providers = useMemo(() => {
    return Array.from(new Set(frontierData.map(m => m.provider).filter(Boolean))).sort()
  }, [])

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    let result = frontierData.filter(m => {
      if (category && m.category !== category) return false
      if (provider && m.provider !== provider) return false
      if (q && !(
        m.name?.toLowerCase().includes(q) ||
        m.provider?.toLowerCase().includes(q) ||
        m.category?.toLowerCase().includes(q) ||
        m.strengths?.toLowerCase().includes(q) ||
        m.accuracy?.toLowerCase().includes(q) ||
        m.positioning?.toLowerCase().includes(q)
      )) return false
      return true
    })

    result.sort((a, b) => {
      const va = String(a[sortKey] || '').toLowerCase()
      const vb = String(b[sortKey] || '').toLowerCase()
      if (va < vb) return sortAsc ? -1 : 1
      if (va > vb) return sortAsc ? 1 : -1
      return 0
    })

    return result
  }, [query, category, provider, sortKey, sortAsc])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const toggleSort = useCallback((key) => {
    setSortKey(prev => {
      if (prev === key) { setSortAsc(a => !a); return prev }
      setSortAsc(true); return key
    })
    setPage(0)
  }, [])

  const sortIcon = (key) => sortKey === key ? (sortAsc ? ' ↑' : ' ↓') : ' ↕'

  return (
    <section className="panel">
      <div style={{marginBottom:'16px'}}>
        <h2>⚡ Frontier Models &amp; Domain Benchmarks</h2>
        <p style={{color:'var(--muted)',fontSize:'.88rem'}}>
          Curated directory of 125 frontier &amp; domain foundation models with published pricing, context limits, accuracy tiers, and positioning.
        </p>
      </div>

      {/* Filters */}
      <div className="filters">
        <input
          type="search"
          placeholder="Search frontier models, strengths, benchmarks…"
          value={query}
          onChange={e => { setQuery(e.target.value); setPage(0) }}
          aria-label="Search frontier models"
        />
        <select value={category} onChange={e => { setCategory(e.target.value); setPage(0) }} aria-label="Category / Domain">
          <option value="">All Domains &amp; Fields</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={provider} onChange={e => { setProvider(e.target.value); setPage(0) }} aria-label="Provider">
          <option value="">All Providers</option>
          {providers.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <small className="hint">
        Showing {filtered.length} of {frontierData.length} models (Alphabetical A–Z).
      </small>

      {/* Table */}
      <div className="scroll">
        <table>
          <thead>
            <tr>
              <th><button onClick={() => toggleSort('name')}>Model Name{sortIcon('name')}</button></th>
              <th>Provider</th>
              <th><button onClick={() => toggleSort('category')}>Domain / Field{sortIcon('category')}</button></th>
              <th>License / Access</th>
              <th>Pricing</th>
              <th>Token / Limits</th>
              <th>Accuracy Level &amp; Tier</th>
              <th>Core Strengths</th>
              <th>Positioning</th>
              <th>Docs</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 ? (
              <tr><td colSpan={10} style={{textAlign:'center',padding:'32px',color:'var(--muted)'}}>No frontier models match your search.</td></tr>
            ) : pageItems.map((m, idx) => (
              <tr key={idx}>
                <td>
                  <strong>{m.name}</strong>
                </td>
                <td style={{whiteSpace:'nowrap'}}>{m.provider}</td>
                <td><span className="tag">{m.category}</span></td>
                <td style={{fontSize:'.8rem',whiteSpace:'nowrap'}}>{m.license}</td>
                <td style={{fontFamily:'var(--font-mono)',fontSize:'.8rem'}}>
                  <code>{m.pricing}</code>
                </td>
                <td style={{fontSize:'.8rem',whiteSpace:'nowrap'}}>{m.limits}</td>
                <td><span className="acc-badge">{m.accuracy}</span></td>
                <td style={{fontSize:'.8rem',minWidth:'220px'}}>{m.strengths}</td>
                <td style={{fontSize:'.8rem',minWidth:'180px',color:'var(--ink-secondary)'}}>{m.positioning}</td>
                <td>
                  {m.docs ? (
                    <a href={m.docs} target="_blank" rel="noopener noreferrer" className="btn-sm" style={{whiteSpace:'nowrap'}}>
                      Docs ↗
                    </a>
                  ) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pager">
          <span>Page {page + 1} of {totalPages} ({filtered.length} results)</span>
          <div className="actions">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Previous</button>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>Next</button>
          </div>
        </div>
      )}
    </section>
  )
}
