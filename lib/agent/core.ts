/** Support turn: retrieve, remember, answer from the KB or hand off. No silent mock. */
import { retrieve, isComplianceRelated, type KbEntry } from "./kb";
import { applyGuardrails, detectUserEscalation } from "./guardrails";
import { getRecent, appendTurn } from "./memory";
import { submitFeedback, dispatchEmail } from "../feedback";
import { SUPPORT } from "../support.config";
import type { SupportConfig } from "../support-kit/types";

export interface AgentTurnInput {
  sessionId: string;
  message: string;
  email?: string;
  
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  
  config?: SupportConfig;
}

export interface AgentCitation {
  id: string;
  title: string;
  source: string;
}

export interface AgentTurnResult {
  sessionId: string;
  answer: string;
  citations: AgentCitation[];
  escalated: boolean;
  note?: string;
  mode: "llm" | "kb-only" | "escalated";
}

function buildSystemPrompt(productName: string): string {
  return (
    `You are the official AI support assistant for ${productName}, serving indie developers and teams going global.\n` +
    "Your job: answer common questions about the product, features, pricing, payments, accounts, and compliance scans based ONLY on the knowledge base below.\n" +
    "Hard rules:\n" +
    "1. Only answer from the knowledge base. When you cite, mark it with [source: <source>]. Never invent product features, prices, or policies.\n" +
    "2. For compliance topics (GDPR / VAT / consumer protection / app-store / payment regulation), state that the answer is for reference only and not legal or professional advice.\n" +
    "3. If you cannot find a reliable basis in the knowledge base, or the user explicitly asks for a human, say you will hand off to a human and ask for their email.\n" +
    "4. Be concise and professional, and respond in English. Never ask for or reset the user's password."
  );
}

function buildContext(entries: KbEntry[]): string {
  if (!entries.length) return "(No relevant knowledge base entries)";
  return entries
    .map((e, i) => `[${i + 1}] ${e.title} (source: ${e.source})\n${e.body}`)
    .join("\n\n");
}

function toCitations(entries: KbEntry[]): AgentCitation[] {
  return entries.map((e) => ({ id: e.id, title: e.title, source: e.source }));
}

async function callSupportLLM(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  opts: { apiKey?: string; baseUrl?: string; model?: string }
): Promise<string | null> {
  const key = opts.apiKey || process.env.OPENAI_API_KEY;
  const base = (opts.baseUrl || process.env.OPENAI_BASE_URL || "https://integrate.api.nvidia.com/v1").replace(/\/$/, "");
  const model = opts.model || process.env.OPENAI_MODEL || "nvidia/nemotron-3-super-120b-a12b";
  if (!key) return null;

  // Upstream LLMs can hang: bound each attempt and retry once with a fallback model.
  const FALLBACK_MODEL = process.env.OPENAI_FALLBACK_MODEL || "mistralai/mistral-nemotron";
  const TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS || 15000);
  const models = model === FALLBACK_MODEL ? [model] : [model, FALLBACK_MODEL];
  for (const m of models) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(`${base}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: m, messages, temperature: 0.3, max_tokens: 900 }),
        signal: ac.signal,
      });
      clearTimeout(timer);
      if (!res.ok) continue;
      const json = await res.json();
      const text = json?.choices?.[0]?.message?.content;
      if (text) return String(text);
    } catch (e) {
      clearTimeout(timer);
      // timeout or network error -> try next model
    }
  }
  return null;
}

const ESCALATION_ANSWER =
  "I can't fully resolve this on my own yet, so I've handed it off to a human. Our team will reach out by email as soon as possible — if you can, please leave your email so we can follow up. You can also submit the details directly on the feedback page (/feedback).";

export async function runAgentTurn(input: AgentTurnInput): Promise<AgentTurnResult> {
  const cfg: SupportConfig = input.config ?? SUPPORT;
  const sessionId = input.sessionId;
  const message = String(input.message || "").trim();

  const { entries, topScore } = retrieve(message, 4, cfg.kb);
  const citations = toCitations(entries);
  const complianceRelated = isComplianceRelated(entries);

  const history = await getRecent(sessionId, 6);
  const historyText = history
    .map((t) => `${t.role === "user" ? "User" : "Assistant"}: ${t.text}`)
    .join("\n");

  let answer = "";
  let mode: AgentTurnResult["mode"] = "llm";
  const ctxText = buildContext(entries);

  const userContent =
    (historyText ? `Conversation history:\n${historyText}\n\n` : "") +
    `User's current question: ${message}\n\nKnowledge base (answer ONLY from these and cite the source):\n${ctxText}`;

  const llmText = await callSupportLLM(
    [
      { role: "system", content: buildSystemPrompt(cfg.productName) },
      { role: "user", content: userContent },
    ],
    { apiKey: input.apiKey, baseUrl: input.baseUrl, model: input.model }
  );

  if (llmText && llmText.trim()) {
    answer = llmText.trim();
    mode = "llm";
  } else if (entries.length) {
    // kb-only honest mode: return the matched entry body directly, clearly labelled
    answer = `${entries[0].body}\n\n(Above is an automated reply from the knowledge base: ${entries[0].source})`;
    mode = "kb-only";
  } else {
    answer = ESCALATION_ANSWER;
    mode = "escalated";
  }

  const gr = applyGuardrails({
    citations: entries,
    topScore,
    userMessage: message,
    answer,
    complianceRelated,
  });

  let escalated = gr.escalate || mode === "escalated";
  if (escalated && mode !== "escalated") {
    answer = ESCALATION_ANSWER;
    mode = "escalated";
  }

  if (gr.note && !answer.toLowerCase().includes("for reference only")) {
    answer = `${answer}\n\n${gr.note}`;
  }

  await appendTurn(sessionId, "user", message);
  await appendTurn(sessionId, "assistant", answer);

  if (escalated) {
    try {
      const fb = submitFeedback({
        category: "Other",
        body:
          `[${cfg.productName} · AI support auto hand-off]\n` +
          `Session ID: ${sessionId}\nUser email: ${input.email || "(not provided)"}\n` +
          `Receipt email: ${cfg.feedbackEmail}\n` +
          `User question: ${message}\nCompliance related: ${complianceRelated ? "Yes" : "No"}\nGuardrail flags: ${gr.violations.join(", ") || "none"}`,
        email: input.email,
      });
      void dispatchEmail(fb, {
        to: cfg.feedbackEmail,
        subjectPrefix: `[${cfg.productName} feedback]`,
      }).catch(() => {});
    } catch (e) {
      console.warn("[agent:core] escalation email failed (non-fatal):", (e as any)?.message);
    }
  }

  return {
    sessionId,
    answer,
    citations,
    escalated,
    note: gr.note || undefined,
    mode,
  };
}

export { detectUserEscalation };
