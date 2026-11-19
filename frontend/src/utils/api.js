// API base URL — set via Amplify environment variable
export const API_BASE = import.meta.env.VITE_API_URL || ''

export async function fetchModels({ category, provider, q, limit, offset = 0 } = {}) {
  const params = new URLSearchParams()
  if (category) params.set('category', category)
  if (provider)  params.set('provider', provider)
  if (q)         params.set('q', q)
  if (limit)     params.set('limit', limit)
  if (offset)    params.set('offset', offset)

  const url = params.toString() ? `${API_BASE}/models?${params}` : `${API_BASE}/models`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Catalog API error: ${res.status}`)
  return res.json()
}

export async function fetchModel(modelId) {
  const res = await fetch(`${API_BASE}/models/${encodeURIComponent(modelId)}`)
  if (!res.ok) throw new Error(`Model not found: ${modelId}`)
  return res.json()
}

export async function askAdvisorQuestions({ query, taskType }) {
  const res = await fetch(`${API_BASE}/advisor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'clarify', query, taskType }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Advisor API error: ${res.status}`)
  }
  return res.json()
}

export async function advisorQuery({ query, answers, maxBudget, taskType }) {
  const res = await fetch(`${API_BASE}/advisor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'recommend', query, answers, maxBudget, taskType }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Advisor API error: ${res.status}`)
  }
  return res.json()
}
