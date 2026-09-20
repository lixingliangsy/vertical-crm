import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

const SLUG = 'vertical-crm'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const body = (req.body || {}) as { runId?: string; thumbs?: 'up' | 'down'; correction?: string }
  try {
    const dir = path.join(process.cwd(), '.data', 'feedback')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    const row = {
      ts: new Date().toISOString(),
      runId: String(body.runId || ''),
      thumbs: body.thumbs || null,
      correction: String(body.correction || '').slice(0, 2000),
    }
    fs.appendFileSync(path.join(dir, `${SLUG}.jsonl`), JSON.stringify(row) + '\n', 'utf8')
  } catch (e) {
    // read-only serverless FS: feedback is best-effort, degrade gracefully
  }
  return res.status(200).json({ ok: true })
}
