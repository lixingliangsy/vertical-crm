import { randomUUID } from 'crypto'

export type StepId = 'input' | 'process' | 'output'
export type RunStatus = 'running' | 'awaiting_confirm' | 'done' | 'failed'

export type RunState = {
  runId: string
  step: StepId
  inputs: Record<string, string>
  artifacts: Record<string, unknown>
  status: RunStatus
  pipelineId: string
  rulesetVersion?: string
  createdAt: string
  updatedAt: string
  error?: string
}

export const PIPELINE_ID = 'vertical-crm-v1'
export const STEP_ORDER: StepId[] = ['input', 'process', 'output']
export const STEP_LABELS: Record<StepId, string> = {
  input: "Step 1/3 · Capture inputs for TradeCRM",
  process: "Step 2/3 · Apply rules & draft with TradeCRM",
  output: "Step 3/3 · Deliver TradeCRM result",
}

export function createRun(inputs: Record<string, string>, pipelineId: string = PIPELINE_ID): RunState {
  const now = new Date().toISOString()
  return { runId: randomUUID(), step: STEP_ORDER[0], inputs, artifacts: {}, status: 'running', pipelineId, createdAt: now, updatedAt: now }
}
export function assertTransition(from: StepId, to: StepId) {
  const i = STEP_ORDER.indexOf(from); const j = STEP_ORDER.indexOf(to)
  if (j !== i + 1) throw new Error(`Invalid step transition: ${from} -> ${to}`)
}
export function advance(state: RunState, to: StepId): RunState {
  assertTransition(state.step, to)
  return { ...state, step: to, updatedAt: new Date().toISOString() }
}
export function completeRun(state: RunState, artifacts: Record<string, unknown>): RunState {
  return { ...state, step: STEP_ORDER[STEP_ORDER.length - 1], status: 'done', artifacts: { ...state.artifacts, ...artifacts }, updatedAt: new Date().toISOString() }
}
