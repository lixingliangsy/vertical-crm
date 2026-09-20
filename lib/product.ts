export interface InputField {
  key: string
  label: string
  type: 'input' | 'textarea' | 'select'
  placeholder?: string
  options?: string[]
}

export const PRODUCT = {
  priceMonthly: 29,
  priceYearly: 290,
  name: "TradeCRM",
  slug: "vertical-crm",
  productId: "PROD_2ghQ0S5MgmiD6hqY6CH2l2",
  yearlyProductId: "PROD_1HEbddsCnbwcv4uR4l8CpT",

  checkoutUrl: "https://pancake.waffo.ai/store/lixingliang-ai-tools-6cilbw8v/checkout",
  tagline: "A CRM built for one trade",
  description: "Pick your trade and get a simple pipeline - leads, jobs, follow-ups. For solo pros who hate generic CRMs built for every business but none of them.",
  toolTitle: "Build your pipeline",
  resultLabel: "Your pipeline",
  ctaLabel: "Group leads",
  features: [
  "By-stage pipeline",
  "Next-action hints",
  "No setup",
  "Copy-ready"
],
  inputs: [
  {
    "key": "trade",
    "label": "Your trade",
    "type": "input",
    "placeholder": "e.g. wedding photographers"
  },
  {
    "key": "leads",
    "label": "Leads (one per line: Name - stage)",
    "type": "textarea",
    "placeholder": "Acme Co - lead\nSmith LLC - proposal\nDoe Inc - won"
  }
] as InputField[],
  definitionLead: "TradeCRM — A CRM built for one trade Use it as decision-support: demo mode works without a live key; live runs require configuration. No fabricated metrics, and no claims for SSO/CSV/Slack unless that surface is actually shipped.",
  geoFaq: [
    { q: "What is TradeCRM?", a: "A CRM built for one trade" },
    { q: "Who should use TradeCRM?", a: "Operators and builders who need a fast first draft or checklist from TradeCRM." },
    { q: "Does it work without an API key?", a: "Yes in explicit Demo mode. Live AI requires a configured key." },
    { q: "Does it guarantee outcomes?", a: "No. Outputs are decision-support; you still review before publishing or acting." },
    { q: "Does it include SSO, Slack, or bulk CSV?", a: "Only if those features are implemented in this product build — do not assume them from marketing copy." },
    { q: "Where does data go?", a: "Runs may be stored locally under the product's .data/ boundary; treat demos as ephemeral." },
  ],
  systemPrompt: "You are a CRM coach for solo trades. Given a trade and a list of leads (Name - stage), group them into a simple pipeline by stage and suggest the next action for the earliest-stage leads.",
  pricing: [
  {
    "tier": "Free",
    "price": "$0",
    "desc": "Unlimited"
  },
  {
    "tier": "Solo",
    "price": "$12/mo",
    "desc": "Next actions, reminders"
  },
  {
    "tier": "Studio",
    "price": "$29/mo",
    "desc": "Team, export"
  }
],
  mock: (inputs: Record<string, string>): string => {
  const trade = inputs['trade'] || 'your trade'
  const lines = (inputs['leads'] || '').split(/\n/).map(s => s.trim()).filter(Boolean)
  const stages: Record<string, string[]> = {}
  lines.forEach(l => {
    const p = l.split(/\s[\|\-]\s/)
    const name = (p[0] || l).trim()
    const stage = (p[1] || 'inbox').trim()
    ;(stages[stage] = stages[stage] || []).push(name)
  })
  const keys = Object.keys(stages)
  const out = keys.length ? keys.map(k => k.toUpperCase() + ' (' + stages[k].length + ')\n' + stages[k].map((n: string) => '  - ' + n).join('\n')).join('\n\n') : 'No leads yet - paste lines like:\n  Acme Co - lead\n  Smith LLC - won'
  return 'PIPELINE for ' + trade + '\n\n' + out + '\n\n--- (Mock grouping. Add OPENAI_API_KEY for stage suggestions + next actions.)'
}
}
