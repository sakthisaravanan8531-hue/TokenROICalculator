import { useState } from 'react'
import { askAdvisorQuestions, advisorQuery } from '../utils/api.js'
import { fmtPrice } from '../utils/pricing.js'

// Complete 26 domains & technical fields matching DynamoDB and catalog
const ALL_DOMAINS = [
  '3D Asset Generation',
  'Audio, Speech & Music',
  'Banking & Finance',
  'Budget & Fast',
  'Code Autocomplete & FIM',
  'Coding & Agents',
  'Computer-Use & GUI Agents',
  'Cybersecurity & Defense',
  'Document Parsing & OCR',
  'Embeddings & Rerankers',
  'Embeddings & Search',
  'Enterprise Services & RAG',
  'Frontier Reasoning',
  'Geospatial & Satellite AI',
  'Image Gen & Editing',
  'Legal & Compliance',
  'Local, Edge & Long-Context',
  'Medical & Drug Discovery',
  'Medical & Healthcare',
  'Omnimodal Multimedia',
  'Regional & Indic Sovereign LLMs',
  'Robotics & World Models',
  'Time-Series & Tabular AI',
  'Video Gen & Editing',
  'Video Generation',
  'Weather & Climate AI',
]

const EXAMPLE_QUERIES = [
  "Extract financial line items from uploaded PDF receipts and match them to accounting codes",
  "Real-time customer support voice bot with <300ms latency",
  "Protein-ligand drug discovery and genomics sequence analysis",
  "Generate photorealistic product images for an e-commerce catalog",
  "Multilingual contract analysis with verifiable citations for legal teams",
  "Autonomous software engineering agent for multi-file refactoring and unit tests",
]

export default function BedrockAdvisor({ catalog, onViewDetails }) {
  const [step, setStep] = useState('input') // 'input' | 'clarifying' | 'results'
  const [query, setQuery] = useState('')
  const [taskType, setTaskType] = useState('')
  const [maxBudget, setMaxBudget] = useState('')

  // Clarification state
  const [questions, setQuestions] = useState([])
  const [summary, setSummary] = useState('')
  const [answers, setAnswers] = useState({})

  // Loading & Results
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  // Step 1: User submits use-case -> AI generates clarifying questions
  const handleStartClarification = async (e) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setLoadingMsg('Analyzing use case and formulating relevant architectural questions…')
    setError(null)

    try {
      const data = await askAdvisorQuestions({
        query: query.trim(),
        taskType: taskType || undefined,
      })
      setSummary(data.useCaseSummary || '')
      setQuestions(data.questions || [])
      setAnswers({})
      setStep('clarifying')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Step 2: User answers questions -> AI returns ranked recommendations
  const handleGetRecommendations = async (e) => {
    if (e) e.preventDefault()
    setLoading(true)
    setLoadingMsg('Evaluating your requirements against 800+ models in the catalog…')
    setError(null)

    try {
      const formattedAnswers = questions.map((q) => ({
        question: q.question,
        selectedAnswer: answers[q.id] || 'Not specified',
      }))

      const data = await advisorQuery({
        query: query.trim(),
        answers: formattedAnswers,
        maxBudget: maxBudget ? parseFloat(maxBudget) : undefined,
        taskType: taskType || undefined,
      })
      setResult(data)
      setStep('results')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setStep('input')
    setResult(null)
    setQuestions([])
    setAnswers({})
    setError(null)
  }

  return (
    <div>
      {/* ── STAGE 1: INPUT INITIAL USE CASE ── */}
      {step === 'input' && (
        <section className="panel">
          <div className="advisor-header">
            <div>
              <h2>⚡ AI Model Advisor</h2>
              <p style={{color:'var(--muted)',fontSize:'.88rem'}}>
                Tell us about your project or use case. The AI Advisor will ask targeted clarifying questions to understand your exact latency, privacy, context, and quality requirements before ranking the ideal models.
              </p>
            </div>
          </div>

          <form onSubmit={handleStartClarification}>
            <div className="advisor-search">
              <label style={{flex:1}}>
                Describe your use case
                <textarea
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="e.g. Extract financial line items from uploaded PDF receipts and match them to accounting codes"
                  rows={3}
                  maxLength={2000}
                  required
                />
              </label>
            </div>

            <div className="grid-3" style={{marginTop:'14px'}}>
              <label>
                Domain &amp; Field
                <select value={taskType} onChange={e => setTaskType(e.target.value)}>
                  <option value="">Auto-Detect / All Domains</option>
                  {ALL_DOMAINS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </label>

              <label>
                Max Input Price ($/1M tokens)
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="No limit"
                  value={maxBudget}
                  onChange={e => setMaxBudget(e.target.value)}
                />
              </label>

              <div style={{display:'flex',alignItems:'flex-end'}}>
                <button type="submit" className="primary" disabled={loading} style={{width:'100%',padding:'10px'}}>
                  {loading ? '⏳ Analyzing…' : 'Next: Clarify Requirements →'}
                </button>
              </div>
            </div>
          </form>

          {/* Example queries */}
          <div style={{marginTop:'18px'}}>
            <p style={{fontSize:'.78rem',color:'var(--muted)',marginBottom:'8px'}}>Try an example:</p>
            <div className="chip-strip">
              {EXAMPLE_QUERIES.map(q => (
                <button key={q} className="chip" onClick={() => setQuery(q)} style={{fontSize:'.74rem'}}>
                  {q.substring(0, 55)}{q.length > 55 ? '…' : ''}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── STAGE 2: CLARIFYING QUESTIONS ── */}
      {step === 'clarifying' && (
        <section className="panel">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'16px',flexWrap:'wrap',gap:'10px'}}>
            <div>
              <h2>📋 Tailored Requirements Questionnaire</h2>
              <p style={{color:'var(--muted)',fontSize:'.88rem'}}>
                To recommend the best models, please answer these clarifying questions specifically generated for:
              </p>
              <blockquote style={{marginTop:'8px',padding:'8px 14px',background:'var(--field)',borderLeft:'3px solid var(--accent)',borderRadius:'var(--r-sm)',fontSize:'.88rem',color:'var(--ink-secondary)'}}>
                "{summary || query}"
              </blockquote>
            </div>
            <button type="button" onClick={handleReset} style={{fontSize:'.8rem'}}>← Edit Use Case</button>
          </div>

          <form onSubmit={handleGetRecommendations}>
            <div style={{display:'flex',flexDirection:'column',gap:'20px',marginTop:'18px'}}>
              {questions.map((q, idx) => (
                <div key={q.id || idx} style={{background:'var(--field)',padding:'16px',borderRadius:'var(--r-md)',border:'1px solid var(--line)'}}>
                  <p style={{fontWeight:600,fontSize:'.92rem',marginBottom:'12px',color:'var(--ink)'}}>
                    <span style={{color:'var(--accent)',marginRight:'6px'}}>Q{idx + 1}.</span>
                    {q.question}
                  </p>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))',gap:'10px'}}>
                    {q.options?.map((opt, oIdx) => {
                      const isSelected = answers[q.id] === opt
                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                          style={{
                            textAlign:'left',
                            padding:'10px 14px',
                            borderRadius:'var(--r-sm)',
                            border: isSelected ? '1px solid var(--accent)' : '1px solid var(--line)',
                            background: isSelected ? 'var(--accent-g)' : 'var(--panel)',
                            color: isSelected ? 'var(--ink)' : 'var(--muted)',
                            fontSize:'.84rem',
                            cursor:'pointer',
                            display:'flex',
                            alignItems:'center',
                            gap:'8px',
                            transition:'all .15s ease'
                          }}
                        >
                          <span style={{
                            width:'14px',height:'14px',borderRadius:'50%',border:'1px solid currentColor',
                            display:'inline-flex',alignItems:'center',justifyContent:'center',flexShrink:0
                          }}>
                            {isSelected && <span style={{width:'8px',height:'8px',borderRadius:'50%',background:'currentColor'}} />}
                          </span>
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div style={{marginTop:'24px',display:'flex',justifyContent:'flex-end',gap:'12px'}}>
              <button type="button" onClick={handleReset}>Back</button>
              <button type="submit" className="primary" disabled={loading} style={{padding:'10px 24px'}}>
                {loading ? 'Evaluating Models…' : 'View Ranked Recommendations 🚀'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Error display */}
      {error && (
        <div className="error-banner">
          <strong>⚠ Advisor error:</strong> {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <section className="panel">
          <div style={{display:'flex',gap:'12px',alignItems:'center',marginBottom:'20px'}}>
            <div className="spinner" style={{width:'24px',height:'24px',borderWidth:'2px'}} />
            <p style={{color:'var(--muted)'}}>{loadingMsg}</p>
          </div>
          <div className="skeleton" style={{height:'18px',marginBottom:'10px'}} />
          <div className="skeleton" style={{height:'14px',width:'70%',marginBottom:'20px'}} />
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="skeleton" style={{height:'80px',borderRadius:'10px'}} />
            ))}
          </div>
        </section>
      )}

      {/* ── STAGE 3: RESULTS ── */}
      {step === 'results' && result && !loading && (
        <div>
          <section className="panel">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'14px',flexWrap:'wrap',gap:'10px'}}>
              <h2>Use Case Analysis &amp; Findings</h2>
              <button type="button" onClick={handleReset} style={{fontSize:'.8rem'}}>New Search ↺</button>
            </div>
            <p style={{color:'var(--ink-secondary)',lineHeight:1.7}}>{result.understanding}</p>

            {result.domain && (
              <p style={{marginTop:'12px'}}>
                <strong>Identified Domain: </strong>
                <span className="tag">{result.domain}</span>
              </p>
            )}

            {result.key_requirements?.length > 0 && (
              <div style={{marginTop:'14px'}}>
                <strong style={{fontSize:'.82rem',color:'var(--muted)',letterSpacing:'.04em',textTransform:'uppercase'}}>Key Architecture Criteria</strong>
                <ul style={{marginTop:'8px',paddingLeft:'18px',display:'flex',flexDirection:'column',gap:'4px'}}>
                  {result.key_requirements.map((r, i) => (
                    <li key={i} style={{fontSize:'.87rem',color:'var(--ink-secondary)'}}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Recommendations Grid */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))',gap:'20px'}}>
            <RecommendationGroup
              title="🏆 Best for the Job"
              subtitle="Highest capability and benchmark performance for your specific requirements"
              models={result.best_fit || []}
              color="var(--accent)"
              onViewDetails={onViewDetails}
            />
            <RecommendationGroup
              title="💰 Cost Competitive"
              subtitle="Best price-performance ratio or budget/open-weights alternative"
              models={result.cost_competitive || []}
              color="var(--positive)"
              onViewDetails={onViewDetails}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function RecommendationGroup({ title, subtitle, models, color, onViewDetails }) {
  return (
    <section className="panel">
      <h2 style={{color}}>{title}</h2>
      <p style={{color:'var(--muted)',fontSize:'.83rem',marginBottom:'16px'}}>{subtitle}</p>

      {models.length === 0 ? (
        <p style={{color:'var(--muted)'}}>No recommendations found matching your criteria.</p>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
          {models.map((m, i) => (
            <div key={m.modelId || i} className="rec-card" style={{borderLeftColor:color}}>
              <div className="rec-header">
                <div>
                  <span className="rec-rank" style={{background:color}}>#{i + 1}</span>
                  <strong style={{marginLeft:'8px'}}>{m.name}</strong>
                </div>
                <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
                  <span style={{fontFamily:'var(--font-mono)',fontSize:'.76rem',color:'var(--warning)'}}>
                    {fmtPrice(m.inputPrice)}
                  </span>
                  <button className="btn-sm" onClick={() => onViewDetails(m)}>Details ↗</button>
                </div>
              </div>
              <p style={{fontSize:'.8rem',color:'var(--muted)',margin:'2px 0 6px'}}>{m.provider} · {m.category}</p>
              <p style={{fontSize:'.84rem',color:'var(--ink-secondary)',lineHeight:1.6}}>{m.reason}</p>
              {m.accuracy && (
                <div style={{marginTop:'8px',maxWidth:'100%',overflow:'hidden'}}>
                  <span className="acc-badge" style={{whiteSpace:'normal',wordBreak:'break-word',display:'inline-block'}}>
                    {m.accuracy}
                  </span>
                </div>
              )}
              <div style={{marginTop:'8px',display:'flex',alignItems:'center',gap:'8px'}}>
                <div style={{flex:1,height:'4px',background:'var(--line)',borderRadius:'2px'}}>
                  <div style={{width:`${((m.confidence||0)*100).toFixed(0)}%`,height:'100%',background:color,borderRadius:'2px',transition:'width .6s'}} />
                </div>
                <span style={{fontSize:'.74rem',color:'var(--muted)',fontFamily:'var(--font-mono)',whiteSpace:'nowrap'}}>
                  {((m.confidence||0)*100).toFixed(0)}% match
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
