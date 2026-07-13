import React, { ReactNode } from 'react'
import { PRODUCT } from '../lib/product'

const Layout: React.FC<{ children: ReactNode }> = ({ children }) => (
  <div className="min-h-screen flex flex-col bg-gray-50">
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <span className="text-2xl font-bold text-brand">{PRODUCT.name}</span>
        <nav className="flex gap-4 text-sm">
          <a href="/" className="text-gray-600 hover:text-brand">Home</a>
          <a href="#features" className="text-gray-600 hover:text-brand">Features</a>
          <a href="/pricing.html" className="text-gray-600 hover:text-brand">Pricing</a>
        </nav>
      </div>
    </header>

    <main className="flex-grow container mx-auto px-4 py-10">{children}</main>

    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="container mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">{PRODUCT.name}</h3>
          <p className="text-sm">{PRODUCT.tagline}</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Features</h3>
          <ul className="text-sm space-y-1">
            {PRODUCT.features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Legal</h3>
          <ul className="text-sm space-y-1">
            <li><a className="hover:text-white" href="/terms.html">Terms</a></li>
            <li><a className="hover:text-white" href="/privacy.html">Privacy</a></li>
            <li><a className="hover:text-white" href="/refund-policy.html">Refund</a></li>
            <li><a className="hover:text-white" href="/support.html">Support</a></li>
          </ul>
        </div>
      </div>
      <div className="text-center text-xs text-gray-500 py-4">
        &copy; 2026 {PRODUCT.name}. All rights reserved.
      </div>
    </footer>
  </div>
)
export default Layout
