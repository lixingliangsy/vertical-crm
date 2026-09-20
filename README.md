# TradeCRM

> A CRM built for one trade
>
> Pick your trade and get a simple pipeline - leads, jobs, follow-ups. For solo pros who hate generic CRMs built for every business but none of them.

AI-powered micro-SaaS — part of the OPC product factory. Web-first (Next.js 14),
deployable to Vercel, subscription-ready.

## Run locally

```bash
npm install
cp .env.example .env.local   # optional: add OPENAI_API_KEY for real AI
npm run dev                  # http://localhost:3000
```

Without an API key the app runs in **Mock mode** (returns a demo output).

## Build & deploy (Vercel)

```bash
npm run build
# Vercel: import repo, set framework = Next.js, root = 12_Micro_SaaS出海/vertical-crm
```

## Payments (subscription)

Wire Stripe or Waffo in `pages/api/checkout` (template not included — add per product).
Web-first checkout keeps fees at 2–5% and avoids the 30% app-store cut.

## Config

All product-specific text lives in `lib/product.ts` (name, inputs, system prompt,
pricing, mock). To clone a new product, copy this folder and edit `lib/product.ts`.

## Related
A directory of 100+ vertical AI micro-saaS tools I built: [lxsaihub.com](https://lxsaihub.com)
— includes AIActRadar (EU AI Act risk mapping) and AgentRedTeam (AI agent red-teaming).
