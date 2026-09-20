import fs from 'fs'
import path from 'path'

export type Lead = {
  id: string
  email: string
  plan: 'free' | 'pro' | 'enterprise' | 'sales'
  source: string
  note?: string
  createdAt: string
  updatedAt: string
}

// PROD-SAFE: Vercel serverless FS is read-only and ephemeral.
// Use /tmp (writable at runtime, per-instance) on Vercel; cwd/data locally.
const DATA_DIR =
  process.env.VERCEL || process.env.NODE_ENV === 'production'
    ? '/tmp/vertical-crm-leads'
    : path.join(process.cwd(), 'data')
const FILE = path.join(DATA_DIR, 'leads.json')

function ensure() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
    if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, '[]', 'utf-8')
  } catch (e) {
    // Read-only FS (e.g. static build) — lead capture still works via webhook.
    console.warn('[leadsStore] ensure() skipped (read-only FS):', (e as any)?.message)
  }
}

export function listLeads(): Lead[] {
  ensure()
  try {
    const raw = JSON.parse(fs.readFileSync(FILE, 'utf-8'))
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

export function saveLeads(rows: Lead[]) {
  ensure()
  try {
    fs.writeFileSync(FILE, JSON.stringify(rows, null, 2), 'utf-8')
  } catch (e) {
    // Non-fatal: on serverless the file may not persist; webhook keeps the truth.
    console.warn('[leadsStore] save failed (non-fatal):', (e as any)?.message)
  }
}

export function upsertLead(
  partial: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): Lead {
  const rows = listLeads()
  const now = new Date().toISOString()
  if (partial.id) {
    const i = rows.findIndex((r) => r.id === partial.id)
    if (i >= 0) {
      rows[i] = { ...rows[i], ...partial, updatedAt: now }
      saveLeads(rows)
      return rows[i]
    }
  }
  // de-dupe by email+plan
  const existing = rows.find(
    (r) => r.email.toLowerCase() === partial.email.toLowerCase() && r.plan === partial.plan
  )
  if (existing) {
    existing.note = partial.note || existing.note
    existing.source = partial.source || existing.source
    existing.updatedAt = now
    saveLeads(rows)
    return existing
  }
  const row: Lead = {
    id: 'ld_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    email: partial.email,
    plan: partial.plan,
    source: partial.source,
    note: partial.note,
    createdAt: now,
    updatedAt: now,
  }
  rows.unshift(row)
  saveLeads(rows)
  // Best-effort external persistence for production (set LEADS_WEBHOOK_URL).
  void forwardLeadToWebhook(row)
  return row
}

export function deleteLead(id: string): boolean {
  const rows = listLeads()
  const next = rows.filter((r) => r.id !== id)
  if (next.length === rows.length) return false
  saveLeads(next)
  return true
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Optional production pipeline: pipe every lead to your CRM / email / Sheets.
async function forwardLeadToWebhook(lead: Lead) {
  const url = process.env.LEADS_WEBHOOK_URL
  if (!url) return
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...lead, product: 'vertical-crm' }),
    })
  } catch (e) {
    console.warn('[leadsStore] webhook forward failed:', (e as any)?.message)
  }
}
