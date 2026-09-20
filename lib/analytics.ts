// Umami analytics helpers (replaces the old GA4 gtag layer).
// Env-driven and build-safe: reads NEXT_PUBLIC_UMAMI_URL / NEXT_PUBLIC_UMAMI_ID
// at compile time. Every function NO-OPs gracefully when Umami is not configured
// (UMAMI_ID undefined) so the app never crashes without analytics.

export const UMAMI_ID = process.env.NEXT_PUBLIC_UMAMI_ID
export const UMAMI_URL = (process.env.NEXT_PUBLIC_UMAMI_URL || '').replace(/\/$/, '')

export function umamiTrack(event: string, payload: Record<string, any> = {}) {
  if (typeof window === 'undefined') return
  const umami = (window as any).umami
  if (!umami || typeof umami.track !== 'function') return
  umami.track(event, payload)
}

export function trackCheckoutCta(p: {
  itemId: string
  itemName: string
  price: number
  value: number
  currency?: string
}) {
  const currency = p.currency || 'USD'
  umamiTrack('generate_lead', { currency, value: p.value, item_id: p.itemId, item_name: p.itemName })
  umamiTrack('begin_checkout', { currency, value: p.price, item_id: p.itemId, item_name: p.itemName })
}

export function trackToolUsed(itemId: string, success: boolean, llmReal: boolean) {
  umamiTrack('tool_used', { item_id: itemId, success, llm_real: llmReal })
}
