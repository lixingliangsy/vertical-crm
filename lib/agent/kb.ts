import type { KbEntry } from "../support-kit/types";
export type { KbEntry };

export const KB: KbEntry[] = [
  {
    id: "what",
    title: "What TradeCRM does",
    keywords: ["TradeCRM", "vertical-crm", "what", "product", "about", "A CRM built for one trade"],
    body: "TradeCRM — A CRM built for one trade Use it as decision-support: demo mode works without a live key; live runs require configuration. No fabricated metrics, and no claims for SSO/CSV/Slack unless that surface is actually shipped.",
    source: "TradeCRM product definition",
    tags: [],
  },
  {
    id: "features",
    title: "TradeCRM features",
    keywords: ["features", "feature", "can", "does", "By-stage pipeline", "Next-action hints", "No setup", "Copy-ready"],
    body: "TradeCRM includes: By-stage pipeline; Next-action hints; No setup; Copy-ready. It does not add capabilities that are not listed here.",
    source: "TradeCRM feature list",
    tags: [],
  },
  {
    id: "pricing",
    title: "TradeCRM pricing",
    keywords: ["price", "pricing", "plan", "cost", "billing", "subscription", "monthly", "yearly"],
    body: "Listed prices for TradeCRM: $29/month and $290/year. Checkout uses the in-app checkout route. This assistant cannot change a subscription or issue a refund.",
    source: "TradeCRM pricing fields",
    tags: [],
  },
  {
    id: "howto",
    title: "How to use TradeCRM",
    keywords: ["how", "start", "use", "tool", "run", "Build your pipeline"],
    body: "Open TradeCRM and use Build your pipeline. The form asks for: Your trade; Leads (one per line: Name - stage).",
    source: "TradeCRM tool fields",
    tags: [],
  },
  {
    id: "faq-1",
    title: "What is TradeCRM?",
    keywords: ["What", "is", "TradeCRM?"],
    body: "A CRM built for one trade",
    source: "TradeCRM FAQ",
    tags: [],
  },
  {
    id: "faq-2",
    title: "Who should use TradeCRM?",
    keywords: ["Who", "should", "use", "TradeCRM?"],
    body: "Operators and builders who need a fast first draft or checklist from TradeCRM.",
    source: "TradeCRM FAQ",
    tags: [],
  },
  {
    id: "faq-3",
    title: "Does it work without an API key?",
    keywords: ["Does", "it", "work", "without", "an", "API"],
    body: "Yes in explicit Demo mode. Live AI requires a configured key.",
    source: "TradeCRM FAQ",
    tags: [],
  },
  {
    id: "honesty",
    title: "What this assistant will not claim",
    keywords: ["legal", "advice", "guarantee", "demo", "human", "refund", "support"],
    body: "Answers about TradeCRM are decision support only, not legal, tax, accessibility-certification, or compliance sign-off. This assistant does not invent integrations, SSO, CSV export, or Slack connections unless they are already in the product description. If live AI is unavailable, the product must not pretend a demo result is live. Say you want a human and leave an email if you need a person.",
    source: "TradeCRM support policy",
    tags: ["compliance"],
  },
];

function normalize(s: string): string {
  return (s || "").toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ");
}
function toWords(s: string): string[] {
  return normalize(s).split(/\s+/).map((w) => w.trim()).filter(Boolean);
}
function cjkBigrams(s: string): string[] {
  const grams: string[] = [];
  const han = /[\u4e00-\u9fff]/;
  for (const w of toWords(s)) {
    if (han.test(w) && w.length >= 2) {
      for (let i = 0; i < w.length - 1; i++) grams.push(w.slice(i, i + 2));
    }
  }
  return grams;
}
function scoreEntry(entry: KbEntry, query: string): number {
  const q = normalize(query);
  const qWords = new Set(toWords(q));
  const qGrams = new Set(cjkBigrams(q));
  let s = 0;
  for (const kw of entry.keywords) {
    const k = kw.toLowerCase();
    if (q.includes(k)) s += 3;
  }
  for (const tw of toWords(entry.title)) {
    if (qWords.has(tw)) s += 2;
  }
  const idx = normalize(entry.keywords.join(" ") + " " + entry.title + " " + entry.body.slice(0, 400));
  for (const g of qGrams) if (idx.includes(g)) s += 0.5;
  return s;
}

export interface RetrieveResult {
  entries: KbEntry[];
  topScore: number;
}

export function retrieve(query: string, topK = 4, entries: KbEntry[] = KB): RetrieveResult {
  const scored = entries
    .map((e) => ({ e, s: scoreEntry(e, query) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, topK);
  return { entries: scored.map((x) => x.e), topScore: scored.length ? scored[0].s : 0 };
}

export function isComplianceRelated(entries: KbEntry[]): boolean {
  return entries.some((e) => e.tags.includes("compliance"));
}
