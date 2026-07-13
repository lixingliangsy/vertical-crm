import React from 'react'
import Head from 'next/head'
import Layout from '../components/Layout'
import Tool from '../components/Tool'
import { PRODUCT } from '../lib/product'

export default function Home() {
  return (
    <Layout>
      <Head>
        <title>{PRODUCT.name} — {PRODUCT.tagline}</title>
        <meta name="description" content={PRODUCT.description} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">{PRODUCT.name}</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">{PRODUCT.tagline}</p>
        <p className="text-gray-500 mt-3 max-w-2xl mx-auto">{PRODUCT.description}</p>
      </div>

      <Tool />

      <div id="features" className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {PRODUCT.features.map((f) => (
          <div key={f} className="bg-white p-5 rounded-xl shadow text-center">
            <div className="text-3xl mb-2">✨</div>
            <p className="text-gray-700 text-sm">{f}</p>
          </div>
        ))}
      </div>
    </Layout>
  )
}
