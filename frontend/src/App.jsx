import React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { fetchModels } from './utils/api.js'
import CatalogTab      from './components/CatalogTab.jsx'
import ROICalculator   from './components/ROICalculator.jsx'
import ModelDetails    from './components/ModelDetails.jsx'
import BedrockAdvisor  from './components/BedrockAdvisor.jsx'

const TABS = [
  { id: 'catalog',   label: '▦\u00a0 Full Catalog' },
  { id: 'roi',       label: '▤\u00a0 Token ROI Calculator' },
  { id: 'details',   label: '▱\u00a0 Model Details' },
  { id: 'advisor',   label: '⚡\u00a0 AI Advisor' },
]

export default function App() {
  const [tab, setTab]           = useState('catalog')
  const [theme, setTheme]       = useState('dark')
  const [catalog, setCatalog]   = useState([])
  const [categories, setCategories] = useState([])
  const [providers, setProviders]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [selectedModel, setSelectedModel] = useState(null)

  useEffect(() => {
    setLoading(true)
    fetchModels()
      .then(data => {
        setCatalog(data.models || [])
        setCategories(data.categories || [])
        setProviders(data.providers || [])
        setError(null)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const handleViewDetails = useCallback((model) => {
    setSelectedModel(model)
    setTab('details')
  }, [])

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
  }

  return (
    <div className="app">
      <header>
        <span className="brand" aria-hidden="true">✦</span>
        <div className="header-info">
          <h1>AI Model Catalog &amp; Token ROI Calculator</h1>
          <p>
            Enterprise AI model intelligence, token pricing &amp; multi-model workload ROI.
            {!loading && (
              <span className="header-badge">
                ● 2026 Live · {catalog.length} Models · {categories.length} Domains
              </span>
            )}
          </p>
        </div>
        <div className="header-actions">
          <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} title="Toggle theme">
            🌓 Theme
          </button>
          <button onClick={copyLink} title="Copy link">
            🔗 Share
          </button>
        </div>
      </header>

      {loading && (
        <div className="page-loading">
          <div className="spinner" />
          <p>Loading catalog from DynamoDB…</p>
        </div>
      )}

      {error && (
        <div className="error-banner">
          <strong>⚠ Could not load catalog:</strong> {error}
        </div>
      )}

      {!loading && (
        <>
          <nav aria-label="Sections">
            {TABS.map(t => (
              <button
                key={t.id}
                aria-pressed={tab === t.id}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </nav>

          {tab === 'catalog'  && <CatalogTab catalog={catalog} categories={categories} providers={providers} onViewDetails={handleViewDetails} />}
          {tab === 'roi'      && <ROICalculator catalog={catalog} onViewDetails={handleViewDetails} />}
          {tab === 'details'  && <ModelDetails catalog={catalog} initialModel={selectedModel} />}
          {tab === 'advisor'  && <BedrockAdvisor catalog={catalog} onViewDetails={handleViewDetails} onAddToROI={(m) => { setTab('roi') }} />}
        </>
      )}
    </div>
  )
}
