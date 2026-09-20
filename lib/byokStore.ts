/**
 * Enterprise BYOK (Bring Your Own Key) — server-side only.
 * Keys live under `.data/byok-<slug>.json` (gitignored). Never import this
 * module from client components or ship the raw key to the browser.
 */
import fs from 'fs'
import path from 'path'

export type ByokRecord = {
  apiKey: string
  updatedAt: string
}

function dataDir(): string {
  // Prefer local .data (gitignored). On Vercel FS is ephemeral — still fine for demos.
  const dir =
    process.env.VERCEL || process.env.NODE_ENV === 'production'
      ? path.join('/tmp', 'writeflow-byok')
      : path.join(process.cwd(), '.data')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

function storePath(slug: string): string {
  const safe = String(slug || 'product').replace(/[^a-zA-Z0-9_-]/g, '_')
  return path.join(dataDir(), `byok-${safe}.json`)
}

export function isValidOpenAiKey(key: string): boolean {
  const k = String(key || '').trim()
  if (!k) return false
  // Classic sk-… or project keys sk-proj-…; also accept long opaque tokens
  if (k.startsWith('sk-') && k.length >= 20) return true
  if (k.length >= 32 && /^[a-zA-Z0-9_-]+$/.test(k)) return true
  return false
}

export function maskApiKey(key: string): string {
  const k = String(key || '')
  if (k.length < 8) return '••••••••'
  return `${k.slice(0, 3)}…${k.slice(-4)}`
}

export function getByokRecord(slug: string): ByokRecord | null {
  try {
    const raw = JSON.parse(fs.readFileSync(storePath(slug), 'utf8')) as ByokRecord
    if (!raw?.apiKey || !isValidOpenAiKey(raw.apiKey)) return null
    return raw
  } catch {
    return null
  }
}

export function getByokKey(slug: string): string | null {
  return getByokRecord(slug)?.apiKey || null
}

export function hasByokKey(slug: string): boolean {
  return !!getByokKey(slug)
}

export function saveByokKey(slug: string, apiKey: string): ByokRecord {
  const key = String(apiKey || '').trim()
  if (!isValidOpenAiKey(key)) {
    throw new Error('Invalid API key format (expect sk-… or token length ≥ 32)')
  }
  const rec: ByokRecord = { apiKey: key, updatedAt: new Date().toISOString() }
  fs.writeFileSync(storePath(slug), JSON.stringify(rec), 'utf8')
  return rec
}

export function clearByokKey(slug: string): boolean {
  const p = storePath(slug)
  if (!fs.existsSync(p)) return false
  fs.unlinkSync(p)
  return true
}

export function byokStatus(slug: string): { configured: boolean; maskedKey?: string; updatedAt?: string } {
  const rec = getByokRecord(slug)
  if (!rec) return { configured: false }
  return {
    configured: true,
    maskedKey: maskApiKey(rec.apiKey),
    updatedAt: rec.updatedAt,
  }
}
