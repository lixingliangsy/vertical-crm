import React, { FormEvent, useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import { PRODUCT } from '../lib/product'

type Lead = {
  id: string
  email: string
  plan: string
  source: string
  note?: string
  createdAt: string
}

const Check = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

const DEMO_STEPS = [
  'Open studio…',
  'Read your brief…',
  'Draft structured output…',
  'Polish tone & clarity…',
  'Ready — copy or upgrade',
]

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [email, setEmail] = useState('')
  const [signupBusy, setSignupBusy] = useState(false)
  const [signupMsg, setSignupMsg] = useState('')
  const [topic, setTopic] = useState('Quick demo for ' + PRODUCT.name)
  const [result, setResult] = useState('')
  const [toolBusy, setToolBusy] = useState(false)
  const [toolStatus, setToolStatus] = useState('')
  const [leads, setLeads] = useState<Lead[]>([])
  const [leadFilter, setLeadFilter] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [demoOpen, setDemoOpen] = useState(false)
  const [demoStep, setDemoStep] = useState(0)
  const [demoPlaying, setDemoPlaying] = useState(false)
  const price = (PRODUCT as any).priceMonthly ?? 29
  const priceYearly = (PRODUCT as any).priceYearly ?? Math.round(price * 10)
  const features: string[] = (PRODUCT as any).features || []
  const mark = (PRODUCT.name || 'A').trim().charAt(0).toUpperCase()

  function showToast(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2600)
  }

  function openDemo(e?: React.MouseEvent) {
    e?.preventDefault()
    setDemoOpen(true)
    setDemoPlaying(true)
    setDemoStep(0)
  }

  useEffect(() => {
    if (!demoOpen || !demoPlaying) return
    if (demoStep >= DEMO_STEPS.length - 1) {
      setDemoPlaying(false)
      return
    }
    const t = window.setTimeout(() => setDemoStep((s) => s + 1), 900)
    return () => window.clearTimeout(t)
  }, [demoOpen, demoPlaying, demoStep])

  async function loadLeads() {
    try {
      const qs = new URLSearchParams()
      if (planFilter) qs.set('plan', planFilter)
      if (leadFilter.trim()) qs.set('q', leadFilter.trim())
      const r = await fetch('/api/leads?' + qs.toString())
      const data = await r.json()
      if (r.ok && data.ok) setLeads(data.leads || [])
    } catch {
      /* optional */
    }
  }

  useEffect(() => {
    loadLeads()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planFilter, leadFilter])

  useEffect(() => {
    const accs = Array.from(document.querySelectorAll<HTMLDetailsElement>('details.acc'))
    const onToggle = (ev: Event) => {
      const t = ev.currentTarget as HTMLDetailsElement
      if (t.open) accs.forEach((o) => {
        if (o !== t) o.open = false
      })
    }
    accs.forEach((a) => a.addEventListener('toggle', onToggle))
    return () => accs.forEach((a) => a.removeEventListener('toggle', onToggle))
  }, [])

  async function submitLead(plan: 'free' | 'pro' | 'enterprise' | 'sales', source: string, note?: string) {
    const value = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setSignupMsg('Please enter a valid email.')
      return null
    }
    setSignupBusy(true)
    setSignupMsg('')
    try {
      const r = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value, plan, source, note }),
      })
      const data = await r.json()
      if (!r.ok || !data.ok) throw new Error(data.error || 'Signup failed')
      setSignupMsg("You're in — opening the studio…")
      showToast('Lead saved: ' + value)
      await loadLeads()
      document.getElementById('studio')?.scrollIntoView({ behavior: 'smooth' })
      return data.lead as Lead
    } catch (e: any) {
      setSignupMsg(e?.message || 'Signup failed')
      return null
    } finally {
      setSignupBusy(false)
    }
  }

  async function onSignup(e: FormEvent) {
    e.preventDefault()
    await submitLead('free', 'final_cta')
  }

  async function runStudio(e?: FormEvent) {
    e?.preventDefault()
    setToolBusy(true)
    setToolStatus('')
    try {
      const r = await fetch('/api/tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useMock: true, inputs: { topic, text: topic } }),
      })
      if (r.ok) {
        const data = await r.json()
        setResult(String(data.result || JSON.stringify(data, null, 2)).replace(/\\n/g, '\n'))
        setToolStatus(data.mock || data.degraded ? 'Demo mode' : 'Live')
      } else {
        setResult(PRODUCT.name + ' DEMO\n\n' + topic + '\n\n---\nPreview based on your input. Upgrade to Pro for full runs.')
        setToolStatus('Local demo')
      }
    } catch {
      setResult(PRODUCT.name + ' DEMO\n\n' + topic + '\n\n---\nLocal demo (tool API unavailable).')
      setToolStatus('Local demo')
    } finally {
      setToolBusy(false)
    }
  }

  async function deleteLeadRow(id: string) {
    try {
      const r = await fetch('/api/leads?id=' + encodeURIComponent(id), { method: 'DELETE' })
      const data = await r.json()
      if (!r.ok || !data.ok) throw new Error(data.error || 'Delete failed')
      showToast('Lead deleted')
      await loadLeads()
    } catch (e: any) {
      showToast(e?.message || 'Delete failed')
    }
  }

  function goCheckout(path: string, e?: React.MouseEvent) {
    e?.preventDefault()
    window.location.href = path
  }

  const filteredHint = useMemo(() => {
    if (!planFilter && !leadFilter) return `${leads.length} leads`
    return `${leads.length} filtered`
  }, [leads, planFilter, leadFilter])

  const featCards = (features.length ? features : ['Fast setup', 'Clear results', 'Export anytime', 'Cancel anytime']).slice(0, 4)

  return (
    <>
      <Head>
        <title>{`${PRODUCT.name} — ${PRODUCT.tagline}`}</title>
        <meta name="description" content={PRODUCT.description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-white text-slate-900">
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <a href="#top" className="flex items-center gap-2 font-extrabold text-lg">
              <span className="w-9 h-9 rounded-xl bg-indigo-600 text-white grid place-items-center">{mark}</span>
              {PRODUCT.name}
            </a>
            <nav className="hidden md:flex gap-7 text-sm font-semibold text-slate-500">
              <a href="#features" className="hover:text-slate-900">Features</a>
              <a href="#how" className="hover:text-slate-900">How it works</a>
              <a href="#studio" className="hover:text-slate-900">Studio</a>
              <a href="#pricing" className="hover:text-slate-900">Pricing</a>
              <a href="#faq" className="hover:text-slate-900">FAQ</a>
            </nav>
            <div className="hidden md:flex gap-3">
              <a href="#signup" className="px-4 py-2 rounded-full border border-slate-200 font-semibold text-sm">Sign in</a>
              <a href="#signup" className="px-4 py-2 rounded-full bg-indigo-600 text-white font-semibold text-sm">Start free trial</a>
            </div>
            <button type="button" className="md:hidden p-2" aria-label="Menu" onClick={() => setMenuOpen((v) => !v)}>
              <span className="block w-6 h-0.5 bg-slate-900 mb-1" />
              <span className="block w-6 h-0.5 bg-slate-900 mb-1" />
              <span className="block w-6 h-0.5 bg-slate-900" />
            </button>
          </div>
          {menuOpen ? (
            <div className="md:hidden px-6 pb-4 flex flex-col gap-2 border-b border-slate-200">
              {['features', 'how', 'studio', 'pricing', 'faq', 'signup'].map((id) => (
                <a key={id} href={`#${id}`} onClick={() => setMenuOpen(false)} className="py-2 font-semibold text-slate-600 capitalize">
                  {id === 'signup' ? 'Start free trial' : id}
                </a>
              ))}
            </div>
          ) : null}
        </header>

        <section id="top" className="py-16 bg-gradient-to-br from-indigo-50 via-white to-violet-50">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="text-xs font-bold tracking-widest uppercase text-indigo-600 mb-3">Micro SaaS</div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">{PRODUCT.tagline}</h1>
              <p className="text-lg text-slate-600 mb-6">{PRODUCT.description}</p>
              <div className="flex flex-wrap gap-3">
                <a href="#signup" className="px-6 py-3 rounded-full bg-indigo-600 text-white font-bold">Start Free Trial</a>
                <button type="button" onClick={openDemo} className="px-6 py-3 rounded-full border border-slate-200 font-bold bg-white">
                  ▶ Watch Demo
                </button>
              </div>
              <p className="mt-4 text-sm text-slate-500">No credit card required · Cancel anytime</p>
            </div>
            <button type="button" onClick={openDemo} className="text-left rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden group cursor-pointer">
              <div className="flex gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200 items-center justify-between">
                <div className="flex gap-2">
                  <i className="w-3 h-3 rounded-full bg-red-400 block" />
                  <i className="w-3 h-3 rounded-full bg-amber-400 block" />
                  <i className="w-3 h-3 rounded-full bg-emerald-400 block" />
                </div>
                <span className="text-xs font-bold text-indigo-600 group-hover:underline">Play demo ▶</span>
              </div>
              <div className="p-6 space-y-3 relative min-h-[180px]">
                <div className="h-3 bg-slate-100 rounded w-4/5 animate-pulse" />
                <div className="h-3 bg-slate-100 rounded w-3/5 animate-pulse" />
                <div className="h-3 bg-slate-100 rounded w-2/5" />
                <div className="mt-4 text-sm font-semibold text-indigo-600">{PRODUCT.name} · Click to watch walkthrough</div>
              </div>
            </button>
          </div>
        </section>

        <section className="bg-slate-950 text-white py-10">
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[['10k+', 'Builders'], ['4.9★', 'Avg rating'], ['99.9%', 'Uptime'], ['<2 min', 'Time to value']].map(([n, l]) => (
              <div key={l}>
                <div className="text-3xl font-black text-indigo-300">{n}</div>
                <div className="text-slate-400 text-sm font-semibold mt-1">{l}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <div className="text-xs font-bold tracking-widest uppercase text-indigo-600 mb-3">Why {PRODUCT.name}</div>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-3">Everything you need to ship faster</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              {featCards.map((f) => (
                <div key={f} className="rounded-2xl border border-slate-200 p-6 shadow-sm hover:-translate-y-1 transition bg-white">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 grid place-items-center font-black mb-4">✦</div>
                  <h3 className="font-bold mb-2">{f}</h3>
                  <p className="text-sm text-slate-600">Built for founders who need results without a learning curve.</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how" className="py-20 bg-slate-50">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold">From idea to result in 3 steps</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                ['1', 'Input', 'Describe your goal in plain language.'],
                ['2', 'Process', PRODUCT.name + ' structures the work and runs the workflow.'],
                ['3', 'Ship', 'Copy, export, or upgrade for unlimited runs.'],
              ].map(([n, t, d]) => (
                <div key={n} className="bg-white rounded-2xl border border-slate-200 p-6">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white grid place-items-center font-black mb-4">{n}</div>
                  <h3 className="font-bold text-lg mb-2">{t}</h3>
                  <p className="text-slate-600 text-sm">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="studio" className="py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <div className="text-xs font-bold tracking-widest uppercase text-indigo-600 mb-3">Live studio</div>
              <h2 className="text-3xl md:text-4xl font-extrabold">Try it on this page</h2>
              <p className="text-slate-600 mt-2">
                <button type="button" className="text-indigo-600 font-bold underline" onClick={openDemo}>Watch demo</button>
                {' '}or generate below.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <form onSubmit={runStudio} className="rounded-2xl border border-slate-200 p-6 bg-white shadow-sm">
                <h3 className="font-bold mb-4">Controls</h3>
                <label className="block text-sm font-semibold mb-2">Topic / input</label>
                <textarea className="w-full border border-slate-200 rounded-xl p-3 min-h-[140px]" value={topic} onChange={(e) => setTopic(e.target.value)} />
                <button type="submit" disabled={toolBusy} className="mt-4 w-full py-3 rounded-full bg-indigo-600 text-white font-bold disabled:opacity-60">
                  {toolBusy ? 'Generating…' : 'Generate'}
                </button>
                {toolStatus ? <p className="mt-3 text-sm text-emerald-600">{toolStatus}</p> : null}
              </form>
              <div className="rounded-2xl border border-slate-200 p-6 bg-white shadow-sm">
                <h3 className="font-bold mb-4">Result</h3>
                <pre className="whitespace-pre-wrap text-sm bg-slate-50 border border-slate-200 rounded-xl p-4 min-h-[180px]">{result || 'Your output will appear here.'}</pre>
                <div className="flex flex-wrap gap-3 mt-4">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-full border border-slate-200 font-semibold"
                    onClick={() => {
                      if (result) {
                        navigator.clipboard?.writeText(result)
                        showToast('Copied')
                      }
                    }}
                  >
                    Copy
                  </button>
                  <a href="/api/checkout" onClick={(e) => goCheckout('/api/checkout', e)} className="px-4 py-2 rounded-full bg-indigo-600 text-white font-semibold">
                    ${price}/mo — Upgrade
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="testimonials" className="py-20 bg-slate-50">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-12">Loved by operators who ship</h2>
            <div className="grid md:grid-cols-3 gap-5">
              {[
                ['AL', 'Alex R.', 'Indie founder', '"Cut my first-pass work in half."'],
                ['MK', 'Maya K.', 'Ops lead', '"Clear pricing and a demo that actually works."'],
                ['JT', 'Jordan T.', 'Consultant', '"FAQ answered every objection before checkout."'],
              ].map(([av, nm, role, q]) => (
                <div key={nm} className="bg-white rounded-2xl border border-slate-200 p-6">
                  <div className="text-amber-400 mb-3">★★★★★</div>
                  <p className="text-slate-700 mb-4">{q}</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white grid place-items-center font-bold">{av}</div>
                    <div>
                      <div className="font-bold text-sm">{nm}</div>
                      <div className="text-xs text-slate-500">{role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold">Simple plans that scale</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="rounded-2xl border border-slate-200 p-6">
                <div className="font-bold text-lg">Free</div>
                <div className="text-4xl font-black my-3">$0</div>
                <ul className="space-y-2 text-sm text-slate-600 mb-6">
                  <li className="flex gap-2"><Check /> Limited daily runs</li>
                  <li className="flex gap-2"><Check /> Studio demo</li>
                </ul>
                <button type="button" className="w-full py-3 rounded-full border border-slate-200 font-bold" onClick={() => document.getElementById('signup')?.scrollIntoView({ behavior: 'smooth' })}>
                  Get started free
                </button>
              </div>
              <div className="rounded-2xl border-2 border-indigo-600 p-6 relative shadow-lg">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold bg-indigo-600 text-white px-3 py-1 rounded-full">Most popular</div>
                <div className="font-bold text-lg">Pro</div>
                <div className="text-4xl font-black my-3">
                  ${price}
                  <span className="text-base font-semibold text-slate-500">/mo</span>
                </div>
                <ul className="space-y-2 text-sm text-slate-600 mb-6">
                  <li className="flex gap-2"><Check /> Unlimited runs</li>
                  <li className="flex gap-2"><Check /> Priority support</li>
                  <li className="flex gap-2"><Check /> Yearly ${priceYearly}</li>
                </ul>
                <a href="/api/checkout" onClick={(e) => goCheckout('/api/checkout', e)} className="block text-center w-full py-3 rounded-full bg-indigo-600 text-white font-bold">
                  Start free trial
                </a>
                <a href="/api/checkout?cycle=yearly" onClick={(e) => goCheckout('/api/checkout?cycle=yearly', e)} className="block text-center mt-3 text-sm font-semibold text-indigo-600">
                  Or pay yearly
                </a>
              </div>
              <div className="rounded-2xl border border-slate-200 p-6">
                <div className="font-bold text-lg">Enterprise</div>
                <div className="text-4xl font-black my-3">Custom</div>
                <ul className="space-y-2 text-sm text-slate-600 mb-6">
                  <li className="flex gap-2"><Check /> Team seats</li>
                  <li className="flex gap-2"><Check /> SSO / API</li>
                </ul>
                <button
                  type="button"
                  className="w-full py-3 rounded-full border border-slate-200 font-bold"
                  onClick={async () => {
                    await submitLead('sales', 'pricing_contact', 'enterprise')
                  }}
                >
                  Contact sales
                </button>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="py-20 bg-slate-50">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-3xl font-extrabold text-center mb-10">FAQ</h2>
            <div className="space-y-3">
              {[
                ['Can I cancel anytime?', 'Yes. Self-serve plans cancel anytime; access continues until period end.'],
                ['Do I need a credit card for the free trial?', 'No. Start with email signup, then upgrade when ready.'],
                ['Is checkout secure?', 'Payments are processed by Waffo Pancake (merchant of record).'],
                ['What happens after I pay?', 'You receive access confirmation; fulfillment is tracked via webhook + order logs.'],
              ].map(([q, a]) => (
                <details key={q} className="acc bg-white border border-slate-200 rounded-xl p-4">
                  <summary className="font-bold cursor-pointer">{q}</summary>
                  <p className="mt-2 text-slate-600 text-sm">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div id="signup" className="max-w-3xl mx-auto px-6 text-center rounded-3xl bg-slate-950 text-white p-10">
            <h2 className="text-3xl font-extrabold mb-3">Start smarter today</h2>
            <p className="text-slate-300 mb-6">Join builders using {PRODUCT.name}. Free to try — no card needed.</p>
            <form onSubmit={onSignup} className="flex flex-col sm:flex-row gap-3 justify-center">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className="px-4 py-3 rounded-full text-slate-900 min-w-[260px]" />
              <button type="submit" disabled={signupBusy} className="px-6 py-3 rounded-full bg-indigo-500 font-bold disabled:opacity-60">
                {signupBusy ? 'Saving…' : 'Get started'}
              </button>
            </form>
            <p className="text-sm text-slate-400 mt-4">{signupMsg || 'Trusted · Cancel anytime'}</p>
          </div>
        </section>

        <section className="pb-16">
          <div className="max-w-6xl mx-auto px-6 rounded-2xl border border-slate-200 p-6">
            <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
              <h3 className="font-bold">Leads inbox (demo CRUD)</h3>
              <div className="text-sm text-slate-500">{filteredHint}</div>
            </div>
            <div className="flex flex-wrap gap-3 mb-4">
              <input className="border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Filter email…" value={leadFilter} onChange={(e) => setLeadFilter(e.target.value)} />
              <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm" value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}>
                <option value="">All plans</option>
                <option value="free">free</option>
                <option value="pro">pro</option>
                <option value="enterprise">enterprise</option>
                <option value="sales">sales</option>
              </select>
            </div>
            {leads.length === 0 ? (
              <div className="text-sm text-slate-500">No leads yet — submit the signup form.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b">
                      <th className="py-2">Email</th>
                      <th>Plan</th>
                      <th>Source</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((l) => (
                      <tr key={l.id} className="border-b border-slate-100">
                        <td className="py-2">{l.email}</td>
                        <td>{l.plan}</td>
                        <td>{l.source}</td>
                        <td>
                          <button type="button" className="text-red-600 font-semibold" onClick={() => deleteLeadRow(l.id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <footer className="border-t border-slate-200 py-10">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-4 gap-8 text-sm">
            <div>
              <div className="font-extrabold text-lg mb-2">{PRODUCT.name}</div>
              <p className="text-slate-500">{PRODUCT.tagline}</p>
            </div>
            <div className="flex flex-col gap-2 text-slate-600">
              <div className="font-bold text-slate-900">Product</div>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#studio">Studio</a>
              <a href="#faq">FAQ</a>
            </div>
            <div className="flex flex-col gap-2 text-slate-600">
              <div className="font-bold text-slate-900">Company</div>
              <a href="#signup">About</a>
              <a href="#signup">Contact</a>
            </div>
            <div className="flex flex-col gap-2 text-slate-600">
              <div className="font-bold text-slate-900">Legal</div>
              <a href="/privacy.html">Privacy</a>
              <a href="/terms.html">Terms</a>
              <a href="/support.html">Support</a>
            </div>
          </div>
          <div className="max-w-6xl mx-auto px-6 mt-8 text-slate-400 text-xs">© 2026 {PRODUCT.name}. All rights reserved.</div>
        </footer>

        {toast ? <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg font-semibold z-50">{toast}</div> : null}

        {demoOpen ? (
          <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50">
                <div className="font-bold">{PRODUCT.name} · Product demo</div>
                <button type="button" className="font-bold text-slate-500" onClick={() => setDemoOpen(false)}>
                  ✕
                </button>
              </div>
              <div className="p-6">
                <div className="rounded-xl border border-slate-200 bg-slate-950 text-white p-5 min-h-[220px]">
                  <div className="text-xs text-slate-400 mb-3">DEMO RECORDING · step {demoStep + 1}/{DEMO_STEPS.length}</div>
                  <div className="text-lg font-bold mb-4">{DEMO_STEPS[demoStep]}</div>
                  <div className="space-y-2">
                    {DEMO_STEPS.map((s, i) => (
                      <div key={s} className={`text-sm px-3 py-2 rounded-lg ${i <= demoStep ? 'bg-indigo-600' : 'bg-slate-800 text-slate-500'}`}>
                        {i + 1}. {s}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 mt-5">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-full bg-indigo-600 text-white font-bold"
                    onClick={() => {
                      setDemoPlaying(true)
                      setDemoStep(0)
                    }}
                  >
                    Replay
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-full border border-slate-200 font-bold"
                    onClick={() => {
                      setDemoOpen(false)
                      document.getElementById('studio')?.scrollIntoView({ behavior: 'smooth' })
                    }}
                  >
                    Try studio
                  </button>
                  <a
                    href="#signup"
                    className="px-4 py-2 rounded-full border border-slate-200 font-bold"
                    onClick={() => setDemoOpen(false)}
                  >
                    Start free
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  )
}
