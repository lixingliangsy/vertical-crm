/** Honesty guardrails for support answers. Escalate instead of inventing facts. */
import type { KbEntry } from "./kb";

export interface GuardrailContext {
  citations: KbEntry[];
  topScore: number;
  userMessage: string;
  answer: string;
  complianceRelated: boolean;
}

export interface GuardrailResult {
  
  escalate: boolean;
  
  note: string;
  violations: string[];
  
  needsHumanReview: boolean;
}

const ESCALATE_USER_PHRASES: RegExp[] = [
  /talk to (a |a real )?human/i,
  /speak to (a |an )?(agent|person|human|representative)/i,
  /(real|live) (person|agent|human)/i,
  /(complaint|refund|chargeback|dispute)/i,
  /(escalate|hand ?off|transfer) (me|this|to (a |an )?(human|agent|person))/i,
  /contact (sales|business|support)/i,
];

const ABSOLUTE_PHRASES: RegExp[] = [
  /\b(guarantee|100%|absolutely|promise)\b.*(compliant|pass|approv|success|resolve|refund|penalty)/i,
  /(guarantee|ensure|promise).{0,16}(no violation|no fine|zero risk|risk-?free)/i,
  /\bwe (guarantee|promise|ensure) (your|you)( account|subscription|compliance|data)/i,
];

const UNCERTAINTY_MARKER: RegExp =
  /(i'?m not sure|cannot (confirm|guarantee|verify)|not certain|i recommend (you )?(consult|contact|verify)|for reference|you may want to (check|verify)|beyond my|i don'?t (know|have))/i;

const COMPLIANCE_DISCLAIMER =
  "(The above is for reference only and is not legal, tax, or professional advice, and it is not a compliance certification.)";

const LOW_CONFIDENCE_THRESHOLD = 2;

export function detectUserEscalation(message: string): boolean {
  return ESCALATE_USER_PHRASES.some((re) => re.test(message || ""));
}

export function detectUncertainty(text: string): boolean {
  return UNCERTAINTY_MARKER.test(text || "");
}

export function applyGuardrails(ctx: GuardrailContext): GuardrailResult {
  const violations: string[] = [];
  let escalate = false;

  if (detectUserEscalation(ctx.userMessage)) {
    escalate = true;
    violations.push("H4_USER_ESCALATION");
  }

  if (ctx.topScore < LOW_CONFIDENCE_THRESHOLD && ctx.citations.length === 0) {
    escalate = true;
    violations.push("H1_LOW_CONFIDENCE");
  }

  for (const re of ABSOLUTE_PHRASES) {
    if (re.test(ctx.answer)) {
      violations.push("H2_ABSOLUTE_PROMISE");
      escalate = true;
    }
  }

  const needsHumanReview = detectUncertainty(ctx.answer);
  if (needsHumanReview && ctx.citations.length === 0) {
    escalate = true;
    violations.push("H5_UNCERTAINTY");
  }

  let note = "";
  if (ctx.complianceRelated) {
    note = COMPLIANCE_DISCLAIMER;
  }

  return { escalate, note, violations, needsHumanReview };
}
