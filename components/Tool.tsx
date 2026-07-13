import { useState } from 'react'
import { PRODUCT } from '../lib/product'

export default function Tool() {
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [useMock, setUseMock] = useState(true)

  const setVal = (k: string, v: string) =>
    setInputs((s) => ({ ...s, [k]: v }))

  const submit = async () => {
    setLoading(true)
    setError('')
    setResult('')
    try {
      const r = await fetch('/api/tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs, useMock }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Request failed')
      setResult(d.result)
    } catch (e: any) {
      setError(e.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">{PRODUCT.toolTitle}</h2>
          <label className="flex items-center text-sm text-gray-600">
            <input
              type="checkbox"
              checked={useMock}
              onChange={(e) => setUseMock(e.target.checked)}
              className="mr-2"
            />
            Mock (no API key)
          </label>
        </div>

        {PRODUCT.inputs.map((f) => (
          <div key={f.key} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {f.label}
            </label>
            {f.type === 'textarea' ? (
              <textarea
                value={inputs[f.key] || ''}
                onChange={(e) => setVal(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="w-full h-28 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:outline-none"
              />
            ) : f.type === 'select' ? (
              <select
                value={inputs[f.key] || ''}
                onChange={(e) => setVal(f.key, e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:outline-none"
              >
                <option value="">Select...</option>
                {f.options?.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={inputs[f.key] || ''}
                onChange={(e) => setVal(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:outline-none"
              />
            )}
          </div>
        ))}

        <button
          onClick={submit}
          disabled={loading}
          className="w-full bg-brand text-white py-3 rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Generating...' : PRODUCT.ctaLabel}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-800">{PRODUCT.resultLabel}</h3>
            <button
              onClick={() => navigator.clipboard.writeText(result)}
              className="text-sm text-brand hover:opacity-80"
            >
              Copy
            </button>
          </div>
          <pre className="whitespace-pre-wrap text-gray-700 text-sm bg-gray-50 p-4 rounded-lg overflow-x-auto">
            {result}
          </pre>
          {useMock && (
            <p className="text-xs text-gray-400 mt-2">
              Demo output (mock mode). Add an API key in .env.local for real AI generation.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
