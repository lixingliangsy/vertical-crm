// build-geo-posts-vertical-crm.mjs
// Reads GEO article markdown files from opc-doc (vertical-crm), extracts frontmatter + JSON-LD +
// FAQ + disclaimer + CTA, converts body markdown -> HTML, and emits data/geoPosts.ts
// for the Next.js blog/[slug] route. Run with managed Node 22.
import fs from 'fs'
import path from 'path'

const ARTICLES_DIR = 'E:/AgentCPM/07_一人公司出海项目/opc-doc/outputs/07-conversion/articles-vertical-crm'
const OUT_TS = 'E:/AgentCPM/07_一人公司出海项目/12_Micro_SaaS出海/vertical-crm/data/geoPosts.ts'
// NOTE: Vercel alias is NOT vertical-crm.lxsaihub.com — after first deploy, replace both PROD_URL and
// LIVE_DOMAIN with the real alias (e.g. vertical-crm-<random>.vercel.app) and re-run this script + redeploy.
const PROD_URL = 'https://vertical-crm.lxsaihub.com'
const LIVE_DOMAIN = 'https://vertical-crm.lxsaihub.com'

function readFileSafe(p) {
  try { return fs.readFileSync(p, 'utf8') } catch { return null }
}

// ---- markdown inline -> html ----
function inline(s) {
  s = s.replace(/<!--[\s\S]*?-->/g, '')
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) =>
    `<a href="${u}"${u.startsWith('http') ? ' target="_blank" rel="noopener noreferrer"' : ''}>${t}</a>`)
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>')
  return s
}

function splitRow(line) {
  return line.trim().replace(/^\||\|$/g, '').split('|').map((x) => x.trim())
}
function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function mdToHtml(md) {
  md = md.replace(/^#\s+.*\n/, '')
  const lines = md.split('\n')
  let html = ''
  let para = []
  const flush = () => {
    if (para.length) { html += '<p>' + inline(para.join(' ')) + '</p>\n'; para = [] }
  }
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const t = line.trim()
    if (t.startsWith('```')) {
      flush(); i++
      let code = ''
      while (i < lines.length && !lines[i].trim().startsWith('```')) { code += lines[i] + '\n'; i++ }
      i++
      html += '<pre><code>' + escapeHtml(code) + '</code></pre>\n'
      continue
    }
    if (t.startsWith('|') && i + 1 < lines.length && lines[i + 1].trim().startsWith('|') &&
        /^\|[\s:|-]+\|$/.test(lines[i + 1].trim())) {
      flush()
      const header = splitRow(line)
      i += 2
      const rows = []
      while (i < lines.length && lines[i].trim().startsWith('|')) { rows.push(splitRow(lines[i])); i++ }
      html += '<table><thead><tr>' + header.map((h) => '<th>' + inline(h) + '</th>').join('') +
        '</tr></thead><tbody>' + rows.map((r) => '<tr>' + r.map((c) => '<td>' + inline(c) + '</td>').join('') +
        '</tr>').join('') + '</tbody></table>\n'
      continue
    }
    const h = line.match(/^(#{1,6})\s+(.*)$/)
    if (h) { flush(); const lvl = h[1].length; html += `<h${lvl}>` + inline(h[2]) + `</h${lvl}>\n`; i++; continue }
    if (t.startsWith('>')) {
      flush()
      let quote = ''
      while (i < lines.length && lines[i].trim().startsWith('>')) { quote += lines[i].replace(/^>\s?/, '') + '\n'; i++ }
      html += '<blockquote>' + mdToHtml(quote) + '</blockquote>\n'
      continue
    }
    if (/^\s*-\s+/.test(line)) {
      flush()
      const items = []
      while (i < lines.length && /^\s*-\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*-\s+/, '')); i++ }
      html += '<ul>' + items.map((it) => '<li>' + inline(it) + '</li>').join('') + '</ul>\n'
      continue
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      flush()
      const items = []
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*\d+\.\s+/, '')); i++ }
      html += '<ol>' + items.map((it) => '<li>' + inline(it) + '</li>').join('') + '</ol>\n'
      continue
    }
    if (t === '') { flush(); i++; continue }
    para.push(t)
    i++
  }
  flush()
  return html
}

function parseFrontmatter(md) {
  // Preferred: Owner line, blank line, --- fenced frontmatter --- (matches template Part A).
  const m = md.match(/^Owner:[^\n]*\n\n---\n([\s\S]*?)\n---\n/)
  if (m) {
    const fm = {}
    for (const line of m[1].split('\n')) {
      const mm = line.match(/^(\w+):\s*(.*)$/)
      if (mm) fm[mm[1]] = mm[2].replace(/^"(.*)"$/, '$1').trim()
    }
    return { fm, rest: md.slice(m[0].length) }
  }
  const lines = md.split('\n')
  let i = 0
  if (/^Owner:/i.test(lines[0] || '')) i = 1
  const fm = {}
  while (i < lines.length) {
    const line = lines[i]
    if (line.trim() === '') { i++; continue }
    if (/^#{1,6}\s/.test(line)) break
    const mm = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/)
    if (mm) { fm[mm[1]] = mm[2].replace(/^"(.*)"$/, '$1').trim(); i++ }
    else break
  }
  return { fm, rest: lines.slice(i).join('\n') }
}

function splitSections(rest) {
  const faqIdx = rest.indexOf('\n## FAQ')
  const discIdx = rest.indexOf('\n## Disclaimer')
  const jsonIdx = rest.indexOf('\n## JSON-LD')
  const body = faqIdx >= 0 ? rest.slice(0, faqIdx) : rest
  const faq = (faqIdx >= 0 && discIdx >= 0) ? rest.slice(faqIdx, discIdx) : ''
  const disclaimer = (discIdx >= 0 && jsonIdx >= 0) ? rest.slice(discIdx, jsonIdx) : ''
  return { body, faq, disclaimer }
}

function extractJsonLd(rest) {
  const blocks = []
  const re = /```json\n([\s\S]*?)```/g
  let m
  while ((m = re.exec(rest))) {
    try { blocks.push(JSON.parse(m[1])) } catch { /* ignore */ }
  }
  return blocks
}

function parseFaq(faqMd) {
  const faqs = []
  const re = /\*\*Q:\s*([^*]+?)\*\*\s*\n\s*A:\s*([\s\S]*?)(?=\n\*\*Q:|$)/g
  let m
  while ((m = re.exec(faqMd))) {
    faqs.push({ question: m[1].trim(), answer: m[2].trim().replace(/\s+/g, ' ') })
  }
  return faqs
}

function parseDisclaimer(discMd) {
  let t = discMd.replace(/^##\s+Disclaimer[^\n]*\n/, '')
  t = t.replace(/^Disclaimer\s*\([^)]*\):\s*\n/, '')
  t = t.trim()
  return '<p>' + t.split(/\n{2,}/).map((p) => inline(p.replace(/\n/g, ' '))).join('</p><p>') + '</p>'
}

function parseCta(rest) {
  const idx = rest.indexOf('<!-- WAITLIST_CTA -->')
  if (idx < 0) return ''
  const after = rest.slice(idx + '<!-- WAITLIST_CTA -->'.length)
  const line = after.split('\n').map((s) => s.trim()).find((s) => s.length > 0)
  if (!line) return ''
  const text = line.replace(/\[WAITLIST_URL\]/g, `<a href="${PROD_URL}" class="underline font-semibold">try TradeCRM</a>`)
  return '<p>' + inline(text) + '</p>'
}

function fixDomain(obj) {
  return JSON.parse(JSON.stringify(obj).replace(/https:\/\/vertical-crm\.vercel\.app/g, LIVE_DOMAIN))
}

// ---- main ----
const files = fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith('.md'))
const posts = []
for (const f of files) {
  const md = readFileSafe(path.join(ARTICLES_DIR, f))
  if (!md) continue
  const { fm, rest } = parseFrontmatter(md)
  if (!fm.slug) { console.warn('skip (no slug):', f); continue }
  const { body, faq, disclaimer } = splitSections(rest)
  const jsonLd = extractJsonLd(rest)
  const blogPosting = fixDomain(jsonLd.find((j) => j['@type'] === 'BlogPosting') || {})
  const faqPage = fixDomain(jsonLd.find((j) => j['@type'] === 'FAQPage') || { '@type': 'FAQPage', mainEntity: [] })
  const description = (blogPosting.description || '').replace(/https:\/\/vertical-crm\.vercel\.app/g, LIVE_DOMAIN)
  posts.push({
    slug: fm.slug,
    title: fm.title || blogPosting.headline || f,
    datePublished: fm.date || blogPosting.datePublished || '2026-07-26',
    dateModified: blogPosting.dateModified || fm.date || '2026-07-26',
    description,
    html: mdToHtml(body).replace(/https:\/\/vertical-crm\.vercel\.app/g, LIVE_DOMAIN),
    faq: parseFaq(faq),
    disclaimer: parseDisclaimer(disclaimer),
    cta: parseCta(rest),
    blogPosting,
    faqPage,
  })
}
posts.sort((a, b) => a.slug.localeCompare(b.slug))

const ts = `// AUTO-GENERATED by scripts/build-geo-posts-vertical-crm.mjs — do not edit by hand.
export interface GeoFaq { question: string; answer: string }
export interface GeoPost {
  slug: string
  title: string
  datePublished: string
  dateModified: string
  description: string
  html: string
  faq: GeoFaq[]
  disclaimer: string
  cta: string
  blogPosting: any
  faqPage: any
}
export const geoPosts: GeoPost[] = ${JSON.stringify(posts, null, 2)}
export function getGeoPost(slug: string): GeoPost | undefined {
  return geoPosts.find((p) => p.slug === slug)
}
`
fs.writeFileSync(OUT_TS, ts, 'utf8')
console.log(`Wrote ${posts.length} GEO posts -> ${OUT_TS}`)
for (const p of posts) console.log(' -', p.slug, '| faq:', p.faq.length, '| html len:', p.html.length)
