import type { NextApiRequest, NextApiResponse } from 'next'
import { PRODUCT } from '../../lib/product'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const { inputs, useMock } = req.body as {
      inputs: Record<string, string>
      useMock?: boolean
    }
    const hasKey = !!process.env.OPENAI_API_KEY

    // Mock mode: no key needed, returns a demo output.
    if (useMock || !hasKey) {
      return res.status(200).json({ result: PRODUCT.mock(inputs), mock: true })
    }

    const inputText = PRODUCT.inputs
      .map((f) => `${f.label}: ${inputs[f.key] || '(not provided)'}`)
      .join('\n')

    const base = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

    const r = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: PRODUCT.systemPrompt },
          { role: 'user', content: inputText },
        ],
        temperature: 0.7,
      }),
    })

    if (!r.ok) {
      const t = await r.text()
      return res.status(502).json({ error: 'AI request failed: ' + t.slice(0, 200) })
    }
    const data = await r.json()
    return res.status(200).json({
      result: data.choices?.[0]?.message?.content || '',
      mock: false,
    })
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Server error' })
  }
}
