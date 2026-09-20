import fs from 'fs'
import path from 'path'
import type { RunState } from './pipeline'

function runsDir() {
  const dir = path.join(process.cwd(), '.data', 'runs')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

export function saveRun(state: RunState) {
  const p = path.join(runsDir(), `${state.runId}.json`)
  fs.writeFileSync(p, JSON.stringify(state, null, 2), 'utf8')
  return p
}

export function loadRun(runId: string): RunState | null {
  const p = path.join(runsDir(), `${runId}.json`)
  if (!fs.existsSync(p)) return null
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8')) as RunState
  } catch {
    return null
  }
}

export function listRuns(limit = 100): RunState[] {
  const dir = runsDir()
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'))
  const rows: RunState[] = []
  for (const f of files.slice(-limit).reverse()) {
    try {
      rows.push(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) as RunState)
    } catch {
      /* skip */
    }
  }
  return rows
}
