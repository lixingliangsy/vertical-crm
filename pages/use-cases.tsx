import Head from 'next/head'

export default function Page() {
  const NAME = "TradeCRM";
  return (
    <>
      <Head>
        <title>{NAME} — Use cases</title>
        <meta name="description" content={NAME + " — Use cases by team and role."} />
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
          <h1 className="text-3xl font-bold text-slate-900">Use cases</h1>
          <p className="mt-3 text-slate-600">A CRM built for one trade</p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="font-semibold text-slate-900">Operations &amp; compliance leads</h3>
            <p className="mt-2 text-sm text-slate-600"><span className="font-medium">Pain:</span> Need to standardize this without hiring a specialist team.</p>
            <p className="mt-2 text-sm text-slate-600"><span className="font-medium">How TradeCRM helps:</span> TradeCRM turns raw input into a reviewed, exportable result in minutes.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="font-semibold text-slate-900">Small teams &amp; agencies</h3>
            <p className="mt-2 text-sm text-slate-600"><span className="font-medium">Pain:</span> Lack the bandwidth to do this manually for every client.</p>
            <p className="mt-2 text-sm text-slate-600"><span className="font-medium">How TradeCRM helps:</span> Self-serve: paste input, get a structured deliverable and share it.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="font-semibold text-slate-900">Founders &amp; indie builders</h3>
            <p className="mt-2 text-sm text-slate-600"><span className="font-medium">Pain:</span> Want a defensible, repeatable this step in their product.</p>
            <p className="mt-2 text-sm text-slate-600"><span className="font-medium">How TradeCRM helps:</span> TradeCRM is the drop-in layer they can white-label or embed.</p>
          </div>
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
