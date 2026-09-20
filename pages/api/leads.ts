import type { NextApiRequest, NextApiResponse } from 'next'
import { deleteLead, isValidEmail, listLeads, upsertLead } from '../../lib/leadsStore'

/**
 * Leads CRUD for signup / contact-sales on the single landing page.
 * GET    ?plan=&q=     list (optional filter)
 * POST   { email, plan, source, note }  create/upsert
 * PUT    { id, email?, plan?, note? }   update
 * DELETE { id } | ?id=                  delete
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const plan = String(req.query.plan || '')
      const q = String(req.query.q || '')
        .trim()
        .toLowerCase()
      let rows = listLeads()
      if (plan) rows = rows.filter((r) => r.plan === plan)
      if (q) rows = rows.filter((r) => r.email.toLowerCase().includes(q) || (r.note || '').toLowerCase().includes(q))
      return res.status(200).json({ ok: true, leads: rows, total: rows.length })
    }

    if (req.method === 'POST') {
      const body = req.body || {}
      const email = String(body.email || '')
        .trim()
        .toLowerCase()
      const plan = (body.plan || 'free') as 'free' | 'pro' | 'enterprise' | 'sales'
      const source = String(body.source || 'signup')
      const note = body.note ? String(body.note) : undefined
      if (!isValidEmail(email)) {
        return res.status(400).json({ ok: false, error: 'Invalid email address' })
      }
      if (!['free', 'pro', 'enterprise', 'sales'].includes(plan)) {
        return res.status(400).json({ ok: false, error: 'Invalid plan' })
      }
      const lead = upsertLead({ email, plan, source, note })
      return res.status(201).json({ ok: true, lead })
    }

    if (req.method === 'PUT') {
      const body = req.body || {}
      const id = String(body.id || '')
      if (!id) return res.status(400).json({ ok: false, error: 'Missing id' })
      const existing = listLeads().find((r) => r.id === id)
      if (!existing) return res.status(404).json({ ok: false, error: 'Lead not found' })
      const email = body.email
        ? String(body.email)
            .trim()
            .toLowerCase()
        : existing.email
      if (!isValidEmail(email)) {
        return res.status(400).json({ ok: false, error: 'Invalid email address' })
      }
      const lead = upsertLead({
        id,
        email,
        plan: (body.plan || existing.plan) as any,
        source: existing.source,
        note: body.note !== undefined ? String(body.note) : existing.note,
      })
      return res.status(200).json({ ok: true, lead })
    }

    if (req.method === 'DELETE') {
      const id = String(req.query.id || req.body?.id || '')
      if (!id) return res.status(400).json({ ok: false, error: 'Missing id' })
      const ok = deleteLead(id)
      if (!ok) return res.status(404).json({ ok: false, error: 'Lead not found' })
      return res.status(200).json({ ok: true })
    }

    res.setHeader('Allow', 'GET,POST,PUT,DELETE')
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  } catch (e: any) {
    console.error('[leads]', e)
    return res.status(500).json({ ok: false, error: e?.message || 'Server error' })
  }
}
