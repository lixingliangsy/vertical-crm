import fs from 'fs'
import path from 'path'

export function appendAudit(slug: string, row: Record<string, unknown>): void {
  try {
    const dir = path.join(process.cwd(), '.data', 'audit')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.appendFileSync(path.join(dir, `${slug}.jsonl`), JSON.stringify(row) + '\n', 'utf8')
  } catch {
    /* ignore */
  }
}

export async function writeAudit(row: Record<string, unknown>): Promise<void> {
  const slug = String((row as { slug?: string }).slug || 'product')
  appendAudit(slug, row)
}

/** legacy alias */
export function audit(event: string, meta: Record<string, unknown> = {}): void {
  appendAudit(String(meta.slug || 'product'), { event, ...meta })
}
