import Head from 'next/head'

export default function Page() {
  const NAME = "TradeCRM";
  return (
    <>
      <Head>
        <title>{NAME} — How it works</title>
        <meta name="description" content={NAME + " — How TradeCRM turns your input into a structured result in three steps."} />
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
          <h1 className="text-3xl font-bold text-slate-900">How it works</h1>
          <p className="mt-3 text-slate-600">A CRM built for one trade</p>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="text-sm font-bold text-indigo-600">Step 1</div>
            <h3 className="mt-1 font-semibold text-slate-900">Input</h3>
            <p className="mt-2 text-sm text-slate-600">Describe or paste what you want analyzed (see the form on the home page).</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="text-sm font-bold text-indigo-600">Step 2</div>
            <h3 className="mt-1 font-semibold text-slate-900">Run</h3>
            <p className="mt-2 text-sm text-slate-600">TradeCRM processes it with its rule set and returns a structured result.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="text-sm font-bold text-indigo-600">Step 3</div>
            <h3 className="mt-1 font-semibold text-slate-900">Act</h3>
            <p className="mt-2 text-sm text-slate-600">Review, copy as Markdown/text, and drop the output into your workflow.</p>
          </div>
          </div>
          <p className="mt-6 text-sm text-slate-500">In demo mode you get a realistic sample; the live run uses the same structure with your real data.</p>
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
