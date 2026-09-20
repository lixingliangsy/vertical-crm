/**
 * Platform-paid LLM with Fair Use quotas (cost control).
 * - Default model: gpt-4o-mini (cheap)
 * - Soft/hard monthly + daily caps per product slug
 * - On exceed: caller should degrade to mock (ChatGPT-style)
 *
 * Trust boundary: plan is NEVER taken from client body/headers alone.
 * Elevation only via AI_PLAN_OVERRIDE (server env) or signed x-ai-entitlement.
 */
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

export type AiPlan = 'free' | 'pro' | 'enterprise'

export const AI_QUOTAS: Record<AiPlan, { daily: number; monthly: number; maxTokens: number }> = {
  free: { daily: 10, monthly: 50, maxTokens: 600 },
  pro: { daily: 40, monthly: 300, maxTokens: 1000 },
  enterprise: { daily: 200, monthly: 3000, maxTokens: 1500 },
}

type UsageFile = {
  monthKey: string
  dayKey: string
  monthly: number
  daily: number
}

function usagePath(slug: string): string {
  const dir = path.join(process.cwd(), '.data')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return path.join(dir, `ai-usage-${slug}.json`)
}

function keys() {
  const now = new Date()
  const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
  const dayKey = `${monthKey}-${String(now.getUTCDate()).padStart(2, '0')}`
  return { monthKey, dayKey }
}

function load(slug: string): UsageFile {
  const { monthKey, dayKey } = keys()
  const p = usagePath(slug)
  try {
    const raw = JSON.parse(fs.readFileSync(p, 'utf8')) as UsageFile
    if (raw.monthKey !== monthKey) return { monthKey, dayKey, monthly: 0, daily: 0 }
    if (raw.dayKey !== dayKey) return { monthKey, dayKey, monthly: raw.monthly, daily: 0 }
    return raw
  } catch {
    return { monthKey, dayKey, monthly: 0, daily: 0 }
  }
}

function save(slug: string, u: UsageFile) {
  fs.writeFileSync(usagePath(slug), JSON.stringify(u), 'utf8')
}

function parsePlan(raw: string): AiPlan | null {
  const v = raw.toLowerCase().trim()
  if (v === 'free' || v === 'pro' || v === 'enterprise') return v
  return null
}

/**
 * Optional signed entitlement: header `x-ai-entitlement` = `plan:expMs:hexHmac`
 * HMAC-SHA256(secret, `${plan}:${expMs}`) where secret = AI_ENTITLEMENT_SECRET.
 * Client cannot forge without the server secret.
 */
function verifySignedEntitlement(
  req?: { headers?: Record<string, string | string[] | undefined> }
): AiPlan | null {
  const secret = process.env.AI_ENTITLEMENT_SECRET
  if (!secret || !req?.headers) return null
  const h = req.headers
  const rawVal = h['x-ai-entitlement'] ?? h['X-Ai-Entitlement']
  const raw = String(Array.isArray(rawVal) ? rawVal[0] : rawVal || '')
  const parts = raw.split(':')
  if (parts.length !== 3) return null
  const [planRaw, expStr, sig] = parts
  const plan = parsePlan(planRaw)
  if (!plan) return null
  const exp = Number(expStr)
  if (!Number.isFinite(exp) || Date.now() > exp) return null
  const payload = `${plan}:${expStr}`
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  try {
    const a = Buffer.from(expected, 'utf8')
    const b = Buffer.from(String(sig), 'utf8')
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  } catch {
    return null
  }
  return plan
}

/**
 * Resolve Fair Use plan from server-trusted sources only.
 * - Does NOT read body.plan
 * - Does NOT trust bare x-ai-plan (client-spoofable)
 * - Default: free (conservative until session/billing exists)
 */
export function resolvePlan(req?: { headers?: Record<string, string | string[] | undefined> }): AiPlan {
  const envPlan = parsePlan(String(process.env.AI_PLAN_OVERRIDE || ''))
  if (envPlan) return envPlan
  const signed = verifySignedEntitlement(req)
  if (signed) return signed
  return 'free'
}

export type QuotaCheck = {
  ok: boolean
  plan: AiPlan
  daily: number
  monthly: number
  dailyLimit: number
  monthlyLimit: number
  maxTokens: number
  reason?: string
}

/** Returns ok=false when fair-use quota exceeded (degrade to mock). */
export function checkAndConsumeQuota(slug: string, plan: AiPlan = 'free'): QuotaCheck {
  const q = AI_QUOTAS[plan] || AI_QUOTAS.free
  const u = load(slug)
  if (u.daily >= q.daily) {
    return {
      ok: false,
      plan,
      daily: u.daily,
      monthly: u.monthly,
      dailyLimit: q.daily,
      monthlyLimit: q.monthly,
      maxTokens: q.maxTokens,
      reason: 'daily_fair_use_exceeded',
    }
  }
  if (u.monthly >= q.monthly) {
    return {
      ok: false,
      plan,
      daily: u.daily,
      monthly: u.monthly,
      dailyLimit: q.daily,
      monthlyLimit: q.monthly,
      maxTokens: q.maxTokens,
      reason: 'monthly_fair_use_exceeded',
    }
  }
  u.daily += 1
  u.monthly += 1
  save(slug, u)
  return {
    ok: true,
    plan,
    daily: u.daily,
    monthly: u.monthly,
    dailyLimit: q.daily,
    monthlyLimit: q.monthly,
    maxTokens: q.maxTokens,
  }
}

export function defaultModel(): string {
  return process.env.OPENAI_MODEL || 'gpt-4o-mini'
}
