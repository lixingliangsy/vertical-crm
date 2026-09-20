import React from 'react'
import Head from 'next/head'
import { buildFaqJsonLd, buildHowToJsonLd } from '../lib/schema'
import Layout from '../components/Layout'
import { PRODUCT } from '../lib/product'
import { geoPosts } from '../data/geoPosts'

const SBA = 'https://www.sba.gov/'
const HUBSPOT = 'https://www.hubspot.com/'
const SCORE = 'https://www.score.org/'

const posts = [
  {
    slug: 'what-is-a-trade-crm',
    title: 'What is a trade CRM? (and why generic CRMs fail solo pros)',
    type: 'Definitional · FAQPage',
    query: 'what is a trade crm',
    body: 'A trade CRM is a customer-relationship tool built around one trade\'s pipeline — leads, jobs, and follow-ups in the language of that work, not generic "accounts and opportunities." For a solo pro, a trade CRM means the pipeline fits how the work actually flows. TradeCRM groups your leads by stage and suggests the next action, with no setup.',
    refs: [SBA, HUBSPOT],
  },
  {
    slug: 'why-leads-fall-through-cracks',
    title: 'Why leads fall through the cracks (and the cost to solo pros)',
    type: 'Definitional + examples',
    query: 'why leads fall through cracks',
    body: 'A lead falls through the cracks the moment you cannot see its stage or its next step. For a solo pro juggling delivery, an un-followed-up lead is silent lost revenue — often worth more than a new marketing spend. The fix is a visible, by-stage pipeline with next-action hints, not another tab to forget.',
    refs: [HUBSPOT, SCORE],
  },
  {
    slug: 'how-to-build-a-sales-pipeline',
    title: 'How to build a simple sales pipeline by stage',
    type: 'How-to · HowTo',
    query: 'how to build a sales pipeline',
    body: 'List every lead with its stage (inbox / proposal / won / lost), group them, and write the next action for the earliest-stage ones. A pipeline is just that — a staged list with a next step per lead. TradeCRM does the grouping from "Name - stage" lines so you see the gaps immediately.',
    refs: [HUBSPOT, SBA],
  },
  {
    slug: 'crm-vs-spreadsheet',
    title: 'CRM vs spreadsheet: when a solo pro upgrades',
    type: 'Definitional + examples',
    query: 'crm vs spreadsheet',
    body: 'A spreadsheet is fine until leads start slipping — no stage visibility, no follow-up reminder, no next-action hint. The upgrade moment is when you cannot tell, at a glance, what to do next with each lead. A simple pipeline beats a spreadsheet once you have more than a handful of active leads.',
    refs: [SBA, SCORE],
  },
  {
    slug: 'solo-pro-lead-pipeline-checklist',
    title: 'Solo-pro lead pipeline checklist',
    type: 'How-to · HowTo',
    query: 'solo pro lead pipeline checklist',
    body: 'Before you chase, make sure the foundation is solid: every lead has a stage, every stage has a next action, and the earliest-stage leads are visible daily. Then follow-up becomes a habit, not a panic. TradeCRM slots into the grouping step so the pipeline exists the moment you paste your leads.',
    refs: [HUBSPOT, SCORE],
  },
]

const faqs = [
  {
    "question": "What is a trade CRM?",
    "answer": "A CRM built around one trade's pipeline — leads, jobs, and follow-ups in the language of that work, instead of generic accounts and opportunities. TradeCRM groups your leads by stage and suggests the next action, with no setup."
  },
  {
    "question": "When should a solo pro move off a spreadsheet?",
    "answer": "When leads start slipping — no stage visibility, no follow-up, no clear next step — or you can't see what to do next at a glance. A simple pipeline beats a spreadsheet once you have more than a handful of active leads."
  },
  {
    "question": "Do I need to set up fields and workflows?",
    "answer": "TradeCRM is no-setup: pick your trade, paste leads as 'Name - stage', and get a grouped pipeline. You add structure only if you want it. The point is a visible pipeline in minutes, not a configuration project."
  },
  {
    "question": "Will a CRM guarantee I close more deals?",
    "answer": "No. A CRM makes follow-up consistent and visible; it doesn't sell for you or guarantee wins. It reduces leads falling through cracks, which usually lifts conversion — but it is a system, not a closer."
  },
  {
    "question": "Is TradeCRM only for one trade?",
    "answer": "It is built for one trade at a time (e.g. wedding photographers, electricians) so the pipeline language fits your work. You can re-run it for a different trade when you need to."
  }
] as { question: string; answer: string }[]

const howToBlocks = [
  {
    "name": "How to build a simple sales pipeline by stage",
    "steps": [
      {
        "name": "Overview",
        "text": "List every lead with its stage (inbox / proposal / won / lost), group them, and write the next action for the earliest-stage ones. A pipeline is a staged list with a next step per lead. TradeCRM does the grouping from 'Name - stage' lines."
      }
    ]
  },
  {
    "name": "Solo-pro lead pipeline checklist",
    "steps": [
      {
        "name": "Overview",
        "text": "Before you chase, make sure every lead has a stage, every stage has a next action, and the earliest-stage leads are visible daily. Then follow-up becomes a habit, not a panic. TradeCRM slots into the grouping step."
      }
    ]
  },
  {
    "name": "CRM vs spreadsheet: when a solo pro upgrades",
    "steps": [
      {
        "name": "Overview",
        "text": "A spreadsheet is fine until leads slip — no stage visibility, no follow-up, no next-action hint. Upgrade when you can't tell at a glance what to do next with each lead. A simple pipeline wins past a handful of active leads."
      }
    ]
  }
] as { name: string; steps: { name: string; text: string }[] }[]

export default function BlogPage() {
  return (
    <Layout>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqJsonLd(faqs)) }}
        />
        {howToBlocks.map((block, i) => (
          <script
            key={`howto-${i}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(buildHowToJsonLd(block.name, block.steps)),
            }}
          />
        ))}

        <title>{`${PRODUCT.name} — Blog`}</title>
        <meta name="description" content="Definitional and how-to posts on trade CRMs, why leads fall through cracks, building a by-stage pipeline, CRM vs spreadsheet, and solo-pro follow-up — the questions solo pros ask before they pick a CRM." />
      </Head>
      <div className="max-w-3xl">
        <div className="text-xs font-bold tracking-widest uppercase text-indigo-600 mb-3">Blog · GEO</div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">A CRM for one trade, explained</h1>
        <p className="text-lg text-slate-600 mb-10">Own the definitional queries solo pros ask before they pick a CRM that fits their work.</p>

        <div className="space-y-8">
          {posts.map((p) => (
            <article key={p.slug} className="border-b border-slate-200 pb-8">
              <div className="text-xs font-semibold text-indigo-600 mb-1">{p.type}</div>
              <h2 className="text-2xl font-bold mb-2 text-slate-900">{p.title}</h2>
              <p className="text-sm text-slate-600 mb-2"><span className="font-semibold">Target query:</span> {p.query}</p>
              <p className="text-slate-700 leading-relaxed">{p.body}</p>
              <p className="text-xs text-slate-400 mt-3">refs: {p.refs.join(' · ')}</p>
            </article>
          ))}
        </div>

        <h2 className="text-2xl font-bold mt-14 mb-2 text-slate-900">Deep-dives (GEO)</h2>
        <p className="text-sm text-slate-500 mb-6">Long-form, cited explainers. Each carries authoritative small-business / CRM references and an honesty disclaimer.</p>
        <div className="space-y-5">
          {geoPosts.map((p) => (
            <div key={p.slug} className="border-b border-slate-200 pb-5">
              <h3 className="text-xl font-semibold">
                <a href={`/blog/${p.slug}`} className="text-indigo-700 hover:underline">{p.title}</a>
              </h3>
              <p className="text-sm text-slate-600 mt-1">{p.description}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-400 mt-8">Publish + syndicate per gtm-launch (IH + GEO indexes). Each post carries authoritative refs.</p>
      </div>
    </Layout>
  )
}
