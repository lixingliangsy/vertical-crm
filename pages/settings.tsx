import React, { FormEvent, useEffect, useState } from 'react'
import Head from 'next/head'
import { PRODUCT } from '../lib/product'

type ByokStatus = {
  configured: boolean
  maskedKey?: string
  updatedAt?: string
}

/**
 * Enterprise BYOK settings — key is POSTed to /api/byok and stored server-side only.
 * The full key is never rendered after save (only a masked preview).
 */
export default function SettingsPage() {
  const [status, setStatus] = useState<ByokStatus | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  async function refresh() {
    try {
      const r = await fetch('/api/byok')
      const data = (await r.json()) as ByokStatus
      setStatus(data)
    } catch {
      setStatus({ configured: false })
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function onSave(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErr('')
    setMsg('')
    try {
      const r = await fetch('/api/byok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', apiKey }),
      })
      const data = await r.json()
      if (!r.ok) {
        setErr(data.error || 'Save failed')
        return
      }
      setApiKey('')
      setStatus({
        configured: !!data.configured,
        maskedKey: data.maskedKey,
        updatedAt: data.updatedAt,
      })
      setMsg('BYOK saved. Enterprise Studio calls will use your key (no platform Fair Use).')
    } catch (ex: any) {
      setErr(ex?.message || 'Network error')
    } finally {
      setBusy(false)
    }
  }

  async function onClear() {
    if (!window.confirm('Remove your stored OpenAI key from this product?')) return
    setBusy(true)
    setErr('')
    setMsg('')
    try {
      const r = await fetch('/api/byok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' }),
      })
      const data = await r.json()
      if (!r.ok) {
        setErr(data.error || 'Clear failed')
        return
      }
      setStatus({ configured: false })
      setMsg('BYOK cleared. Studio will use the platform key + Fair Use quota again.')
    } catch (ex: any) {
      setErr(ex?.message || 'Network error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Head>
        <title>BYOK Settings · {PRODUCT.name}</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <div className="max-w-xl mx-auto px-6 py-16">
          <a href="/" className="text-sm font-semibold text-indigo-600">
            ← Back to {PRODUCT.name}
          </a>
          <h1 className="text-3xl font-extrabold mt-6 mb-2">Enterprise BYOK</h1>
          <p className="text-slate-600 mb-8 text-sm leading-relaxed">
            Bring your own OpenAI API key for Enterprise usage. The key is stored only on the server
            (never in the frontend bundle). Free/Pro keep using the platform key with Fair Use limits.
          </p>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 mb-6">
            <div className="text-sm font-bold mb-2">Status</div>
            {status === null ? (
              <p className="text-sm text-slate-500">Loading…</p>
            ) : status.configured ? (
              <p className="text-sm text-slate-700">
                Configured: <code className="bg-slate-100 px-1.5 py-0.5 rounded">{status.maskedKey}</code>
                {status.updatedAt ? (
                  <span className="text-slate-400 ml-2">updated {status.updatedAt.slice(0, 10)}</span>
                ) : null}
              </p>
            ) : (
              <p className="text-sm text-slate-500">Not configured — platform key + Fair Use applies.</p>
            )}
          </div>

          <form onSubmit={onSave} className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <label className="block text-sm font-bold">
              OpenAI API key
              <input
                type="password"
                autoComplete="off"
                spellCheck={false}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-…"
                className="mt-2 w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono"
                required
              />
            </label>
            <p className="text-xs text-slate-500">
              Must start with <code>sk-</code> (min 20 chars) or be a long opaque token (≥ 32). After save,
              only a masked preview is shown.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={busy || !apiKey.trim()}
                className="px-5 py-2.5 rounded-full bg-indigo-600 text-white font-bold text-sm disabled:opacity-50"
              >
                {busy ? 'Saving…' : 'Save BYOK'}
              </button>
              <button
                type="button"
                disabled={busy || !status?.configured}
                onClick={() => void onClear()}
                className="px-5 py-2.5 rounded-full border border-slate-200 font-bold text-sm disabled:opacity-40"
              >
                Clear key
              </button>
            </div>
            {msg ? <p className="text-sm text-emerald-700">{msg}</p> : null}
            {err ? <p className="text-sm text-rose-600">{err}</p> : null}
          </form>

          <p className="mt-8 text-xs text-slate-400">
            Studio tip: send <code>plan: &quot;enterprise&quot;</code> (or header <code>x-ai-plan: enterprise</code>)
            so <code>/api/tool</code> prefers BYOK and skips platform Fair Use.
          </p>
        </div>
      </main>
    </>
  )
}
