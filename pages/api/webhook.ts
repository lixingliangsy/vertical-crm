// pages/api/webhook.ts — Waffo Pancake webhook receiver (PRODUCTION-HARDENED).
// Official guide: read RAW body, verify with RSA-SHA256 (verifyWebhook),
// then handle subscription / order / refund events.
//
// CRITICAL: signature verification needs the RAW request body. Next.js parses JSON
// by default and corrupts the signature, so we disable the body parser and read the
// stream ourselves.
//
// PRODUCTION MODEL (per payment-webhook best practices):
//  - Verify signature on the RAW body first; reject bad signatures with 401.
//  - Respond 200 immediately after verification + durable logging; do NOT block on
//    fulfillment work. (Serverless cold starts / retries otherwise cause double-fire.)
//  - Idempotency by event.id (delivery dedup) AND by data.orderId (fulfillment dedup).
//  - Waffo's API is the SOURCE OF TRUTH. This webhook is a notification; reconcile
//    against Waffo GraphQL whenever needed.
//  - For stateless micro-tools with no user-account system, "provisioning" = mint a
//    license token per paid order (email + slug + plan), append to fulfilled-orders,
//    and console.log it (Vercel retains function logs). The founder fulfills manually
//    or wires self-serve unlock later. This guarantees no paid order is silently lost.
import type { NextApiRequest, NextApiResponse } from 'next'
import { verifyWebhook, WebhookEventType } from '@waffo/pancake-ts'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

export const config = {
  api: { bodyParser: false },
}

const SEEN_FILE = path.join(process.cwd(), '.waffo-webhook-seen.json')
const EVENT_LOG = path.join(process.cwd(), 'webhook-events.log.jsonl')
const DATA_DIR = path.join(process.cwd(), '.data')
const FULFILLED_FILE = path.join(DATA_DIR, 'fulfilled-orders.jsonl')
try { fs.mkdirSync(DATA_DIR, { recursive: true }) } catch (e) { /* best-effort */ }

function readRaw(req: NextApiRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => (data += chunk))
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

function loadJson(p: string): Record<string, any> {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8'))
  } catch {
    return {}
  }
}

function alreadySeen(id: string): boolean {
  try {
    return !!loadJson(SEEN_FILE)[id]
  } catch {
    return false
  }
}

function markSeen(id: string) {
  try {
    const seen = loadJson(SEEN_FILE)
    seen[id] = Date.now()
    fs.writeFileSync(SEEN_FILE, JSON.stringify(seen))
  } catch {
    /* non-fatal */
  }
}

function alreadyFulfilled(orderId: string): boolean {
  if (!orderId) return false
  try {
    const lines = fs.existsSync(FULFILLED_FILE)
      ? fs.readFileSync(FULFILLED_FILE, 'utf-8').split('\n')
      : []
    return lines.some((l) => l.includes(`"orderId":"${orderId}"`))
  } catch {
    return false
  }
}

function logEvent(e: any) {
  try {
    const d = e.data || {}
    const meta = d.orderMetadata || {}
    const row = {
      id: e.id,
      ts: e.timestamp,
      type: e.eventType,
      mode: e.mode, // "test" | "prod"
      email: d.buyerEmail || '',
      slug: meta.slug || d.productName || '',
      plan: meta.plan || d.productName || '',
      amount: d.amount || '',
      currency: d.currency || '',
      orderId: d.orderId || '',
      provisioning: 'RECEIVED', // audit trail; fulfillment handled below
    }
    fs.appendFileSync(EVENT_LOG, JSON.stringify(row) + '\n')
    console.log('[webhook][received]', JSON.stringify(row))
  } catch {
    /* non-fatal */
  }
}

// Mint a license token for a paid order. Stateless tools can later accept this token
// to unlock "pro" mode; for now it is the durable fulfillment record.
function fulfillOrder(e: any) {
  const d = e.data || {}
  const meta = d.orderMetadata || {}
  const orderId = d.orderId || ''
  const email = d.buyerEmail || ''
  const slug = meta.slug || d.productName || ''
  const plan = meta.plan || d.productName || ''
  if (!orderId || alreadyFulfilled(orderId)) return
  const row = {
    orderId,
    email,
    slug,
    plan,
    mode: e.mode,
    license: crypto.randomUUID(),
    ts: e.timestamp,
  }
  try {
    fs.appendFileSync(FULFILLED_FILE, JSON.stringify(row) + '\n')
  } catch {
    /* non-fatal */
  }
  console.log('[webhook][fulfilled]', JSON.stringify(row))
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const sig = req.headers['x-waffo-signature']
  if (!sig || Array.isArray(sig)) return res.status(401).end('Missing signature')

  const raw = await readRaw(req)

  let event
  try {
    // RSA-SHA256 against Waffo's built-in public keys. Auto-detects test/prod.
    event = verifyWebhook(raw, sig as string)
  } catch {
    return res.status(401).end('Invalid signature')
  }

  // Delivery dedup (per instance). Real idempotency also enforced by orderId below.
  if (alreadySeen(event.id)) return res.status(200).end('OK')
  markSeen(event.id)

  logEvent(event)

  // Lightweight, non-blocking fulfillment decisions. Respond 200 right after.
  // `event.data` shape varies by event; treat as any to stay version-agnostic.
  const d: any = (event as any).data || {}
  try {
    switch (event.eventType) {
      case WebhookEventType.SubscriptionActivated:
      case WebhookEventType.SubscriptionPaymentSucceeded:
      case WebhookEventType.OrderCompleted:
        fulfillOrder(event)
        break
      case WebhookEventType.SubscriptionCanceling:
        console.log('[webhook][canceling] keep access until period end', d.orderId)
        break
      case WebhookEventType.SubscriptionCanceled:
      case WebhookEventType.SubscriptionPastDue:
        console.log('[webhook][revoke] flag access for', d.buyerEmail)
        break
      case WebhookEventType.SubscriptionUpdated:
        console.log('[webhook][updated] apply plan change for', d.buyerEmail)
        break
      case WebhookEventType.RefundSucceeded:
        console.log('[webhook][refund] revoke/adjust for', d.buyerEmail)
        break
      default:
        break
    }
  } catch (e: any) {
    console.error('[webhook] handler error:', e?.message || e)
  }

  return res.status(200).end('OK')
}
