// pages/api/checkout.ts — Server-side Waffo checkout redirect.
// Follows the official Waffo Pancake integration guide: mint a fresh session with
// client.checkout.createSession(), then 302-redirect. Never expose the private key to the browser.
import type { NextApiRequest, NextApiResponse } from 'next'
import { PRODUCT } from '../../lib/product'
import { createCheckout } from '../../lib/waffo'

function withUtm(url: string): string {
  try {
    const u = new URL(url)
    u.searchParams.set('utm_campaign', 'opc_launch')
    u.searchParams.set('utm_content', PRODUCT.slug)
    u.searchParams.set('utm_source', 'product_site')
    u.searchParams.set('utm_medium', 'checkout_cta')
    return u.toString()
  } catch {
    return url
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Which billing cycle? Default monthly; use yearly only if the product defines one.
  const cycle =
    req.query && req.query.cycle === 'yearly' && PRODUCT.yearlyProductId ? 'yearly' : 'monthly'
  const productId = cycle === 'yearly' ? PRODUCT.yearlyProductId : PRODUCT.productId

  if (productId) {
    try {
      const session = await createCheckout(productId, {
        slug: PRODUCT.slug,
        successUrl: `https://${req.headers.host}/?checkout=success&cycle=${cycle}`,
      })
      if (session?.checkoutUrl) {
        return res.redirect(302, withUtm(session.checkoutUrl))
      }
    } catch (e: any) {
      console.error('[checkout] mint failed:', e?.message || e)
    }
  } else {
    console.warn('[checkout] missing productId for', PRODUCT.slug)
  }

  // Graceful fallback: send the user to the stable Waffo store product page (never expires).
  const storeBase = process.env.WAFFO_STORE_URL || ''
  if (storeBase) {
    const target = storeBase.endsWith('/') ? storeBase + PRODUCT.slug : storeBase + '/' + PRODUCT.slug
    return res.redirect(302, target)
  }
  return res.redirect(302, PRODUCT.checkoutUrl || '/#pricing')
}
