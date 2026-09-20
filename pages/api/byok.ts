import type { NextApiRequest, NextApiResponse } from 'next'
import { PRODUCT } from '../../lib/product'
import {
  byokStatus,
  clearByokKey,
  isValidOpenAiKey,
  saveByokKey,
} from '../../lib/byokStore'

function slug(): string {
  return String((PRODUCT as any).slug || 'product')
}

/**
 * GET  → { configured, maskedKey?, updatedAt? }  (never returns full key)
 * POST → { action: 'save'|'clear', apiKey? }     (never echoes full key)
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const s = slug()

  if (req.method === 'GET') {
    return res.status(200).json(byokStatus(s))
  }

  if (req.method === 'POST') {
    const body = (req.body || {}) as { action?: string; apiKey?: string }
    const action = String(body.action || '').toLowerCase()

    if (action === 'clear') {
      clearByokKey(s)
      return res.status(200).json({ ok: true, configured: false })
    }

    if (action === 'save') {
      const apiKey = String(body.apiKey || '').trim()
      if (!isValidOpenAiKey(apiKey)) {
        return res.status(400).json({
          error: 'Invalid key. Use an OpenAI key starting with sk- (min length 20), or a token ≥ 32 chars.',
        })
      }
      try {
        saveByokKey(s, apiKey)
        // Re-read status so response never includes the raw key
        return res.status(200).json({ ok: true, ...byokStatus(s) })
      } catch (e: any) {
        return res.status(400).json({ error: e?.message || 'Failed to save key' })
      }
    }

    return res.status(400).json({ error: "action must be 'save' or 'clear'" })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
