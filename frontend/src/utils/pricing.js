// Token cost estimation utilities
const MILLION = 1_000_000
const INR_RATE = 84.5

export function estimateCost({ inputPrice, outputPrice, requestsPerDay, inputTokens, outputTokens, daysPerMonth }) {
  const inp  = Number(inputPrice  || 0)
  const outp = Number(outputPrice || 0)
  const req  = Number(requestsPerDay || 0)
  const days = Number(daysPerMonth || 30)
  const iT   = Number(inputTokens  || 0)
  const oT   = Number(outputTokens || 0)

  const dailyCost   = req * ((inp * iT + outp * oT) / MILLION)
  const monthlyCost = dailyCost * days
  const annualCost  = monthlyCost * 12

  return { dailyCost, monthlyCost, annualCost }
}

export function fmtUSD(val) {
  if (val === null || val === undefined) return '—'
  const n = Number(val)
  if (n === 0) return '$0.00'
  if (n < 0.01) return `$${n.toFixed(5)}`
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function fmtINR(usdVal) {
  const inr = Number(usdVal) * INR_RATE
  if (inr >= 100_000) return `₹${(inr / 100_000).toFixed(2)}L`
  if (inr >= 1_000)   return `₹${inr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
  return `₹${inr.toFixed(2)}`
}

export function fmtPrice(val) {
  if (!val && val !== 0) return '—'
  const n = Number(val)
  if (n === 0) return 'Free / Self-host'
  if (n < 0.01) return `$${n.toFixed(4)}/1M`
  return `$${n.toFixed(2)}/1M`
}

export const CLOUD_MARKUPS = {
  'AWS Bedrock':   0.15,
  'Azure AI':      0.18,
  'GCP Vertex AI': 0.12,
}
