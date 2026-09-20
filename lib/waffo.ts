// lib/waffo.ts — Canonical Waffo Pancake client (server-only).
// Follows the official Waffo Pancake SDK integration guide.
//
// IMPORTANT (SDK 0.12.0 facts, verified against @waffo/pancake-ts types):
//  - WaffoPancakeConfig takes ONLY { merchantId, privateKey, baseUrl? } — there is NO `environment` param.
//  - The environment is selected by WHICH private key you sign with (test key => test mode, prod key => prod mode).
//  - Webhook verification is RSA-SHA256 using the SDK's built-in public keys (verifyWebhook). No shared secret needed.
//  - Webhook event data.amount / data.taxAmount are STRINGS (e.g. "9.99"), not numbers.
//
// Never import this module from any client/browser code — it holds the RSA private key.

import { WaffoPancake } from '@waffo/pancake-ts'

let _client: WaffoPancake | null = null

function resolveCreds(): { merchantId: string; privateKey: string } {
  // Honor WAFFO_ENVIRONMENT=test by switching to the test-scoped key/merchant when present.
  const useTest = process.env.WAFFO_ENVIRONMENT === 'test'
  const merchantId =
    (useTest ? process.env.WAFFO_TEST_MERCHANT_ID : process.env.WAFFO_MERCHANT_ID) ||
    process.env.WAFFO_MERCHANT_ID ||
    ''
  const privateKey =
    (useTest ? process.env.WAFFO_TEST_PRIVATE_KEY : process.env.WAFFO_PRIVATE_KEY) ||
    process.env.WAFFO_PRIVATE_KEY ||
    ''
  return { merchantId, privateKey }
}

/** Returns a cached WaffoPancake client, or throws if credentials are missing. */
export function getWaffoClient(): WaffoPancake {
  if (_client) return _client
  const { merchantId, privateKey } = resolveCreds()
  if (!merchantId || !privateKey) {
    throw new Error(
      'Missing Waffo credentials. Set WAFFO_MERCHANT_ID + WAFFO_PRIVATE_KEY (or WAFFO_ENVIRONMENT=test + WAFFO_TEST_*).'
    )
  }
  _client = new WaffoPancake({
    merchantId,
    privateKey,
    baseUrl: process.env.WAFFO_BASE_URL || 'https://api.waffo.ai',
  })
  return _client
}

export interface CreateCheckoutOptions {
  /** Pre-fill buyer email on the checkout page. */
  buyerEmail?: string
  /** URL Waffo redirects to after a successful payment. */
  successUrl?: string
  /** Product slug, recorded in checkout metadata for later attribution. */
  slug?: string
}

/**
 * Mint a fresh checkout session for a subscription product.
 * Sessions expire (~45 min), so always resolve server-side — never hardcode a cs_* link.
 * Returns { sessionId, checkoutUrl, expiresAt }.
 */
export async function createCheckout(productId: string, opts: CreateCheckoutOptions = {}) {
  const client = getWaffoClient()
  const session = await client.checkout.createSession({
    productId,
    currency: 'USD',
    buyerEmail: opts.buyerEmail,
    successUrl: opts.successUrl,
    metadata: opts.slug ? { slug: opts.slug, source: 'product_site' } : undefined,
  })
  return session
}
