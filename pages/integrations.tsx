import Head from 'next/head'

export default function Page() {
  const NAME = "TradeCRM";
  return (
    <>
      <Head>
        <title>{NAME} — Integrations</title>
        <meta name="description" content={NAME + " — Export, API and webhook integrations."} />
      </Head>
      <div className="min-h-screen bg-slate-50 text-slate-800">
        <header className="border-b border-slate-200 bg-white">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <a href="/" className="font-bold text-slate-900">{NAME}</a>
            <nav className="hidden md:flex gap-6 text-sm font-semibold text-slate-500">
              <a href="/use-cases" className="hover:text-slate-900">Use cases</a>
              <a href="/integrations" className="hover:text-slate-900">Integrations</a>
              <a href="/how-it-works" className="hover:text-slate-900">How it works</a>
              <a href="/security" className="hover:text-slate-900">Security</a>
              <a href="/blog" className="hover:text-slate-900">Blog</a>
            </nav>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-6 py-14">
          <h1 className="text-3xl font-bold text-slate-900">Integrations</h1>
          <h2 className="mt-8 text-xl font-semibold text-slate-900">Export</h2>
          <p className="mt-2 text-slate-600">Download results as <strong>JSON</strong> and <strong>CSV</strong> for any downstream tool.</p>
          <h2 className="mt-6 text-xl font-semibold text-slate-900">API &amp; webhooks</h2>
          <p className="mt-2 text-slate-600">A REST endpoint backs the web form, so you can call TradeCRM from your own pipeline. Webhook-ready: fulfillment events are delivered via the Waffo Pancake webhook.</p>
          <div className="mt-8 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            <strong>Honesty note:</strong> We only claim connectors that exist today. If you need a specific integration (Zapier, Slack, Notion, Salesforce), tell us — we add the ones users actually request. We do not list "available soon" connectors as if they shipped.
          </div>
        </main>
        <footer className="border-t border-slate-200 bg-white">
          <div className="max-w-5xl mx-auto px-6 py-8 text-sm text-slate-500 flex flex-wrap gap-6">
            <a href="/security" className="hover:text-slate-900">Security</a>
            <a href="/use-cases" className="hover:text-slate-900">Use cases</a>
            <a href="/integrations" className="hover:text-slate-900">Integrations</a>
            <a href="/how-it-works" className="hover:text-slate-900">How it works</a>
            <a href="/blog" className="hover:text-slate-900">Blog</a>
          </div>
        </footer>
      </div>
    </>
  )
}
