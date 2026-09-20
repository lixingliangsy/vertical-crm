export const RULESET_VERSION = 'crm@2026-09-17'

export type RuleHit = {
  id: string
  title: string
  severity: 'low' | 'medium' | 'high'
  passed: boolean
  remediation?: string
  ref?: string
}

export function runDeterministicChecks(inputs: Record<string, string>): RuleHit[] {
  const blob = Object.values(inputs || {}).join('\n').trim()
  return [
    {
      id: 'R1',
      title: 'Input provided',
      severity: 'medium',
      passed: blob.length > 0,
      remediation: 'Provide the required inputs before running.',
      ref: 'https://schema.org/HowTo',
    },
    {
      id: 'R2',
      title: 'Decision-support only',
      severity: 'low',
      passed: true,
      ref: 'https://www.ftc.gov/business-guidance/resources/advertising-faqsa-guide-small-business',
    },
  ]
}
