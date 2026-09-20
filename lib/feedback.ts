/** Persist support feedback first. Email is optional and never blocks the reply. */
import path from "path";
import fs from "fs";
import { getStore, uid, type Entity } from "./store";
import { FEEDBACK_CATEGORIES } from "./feedback-constants";

export { FEEDBACK_CATEGORIES };
export type FeedbackStatus = "received" | "emailed" | "queued" | "failed";

export interface Feedback extends Entity {
  id: string;
  category: string;
  body: string;
  email?: string;
  attachmentName?: string;
  attachmentPath?: string;
  status: FeedbackStatus;
  attempts: number;
  createdAt?: string;
  updatedAt?: string;
}

const COLL = "feedback";
const UPLOAD_DIR = path.join(process.cwd(), ".data/uploads");
const QUEUE = path.join(process.cwd(), ".data/feedback-queue.jsonl");

export function validCategory(c: string): boolean {
  return FEEDBACK_CATEGORIES.includes(c);
}

export function submitFeedback(input: {
  category: string;
  body: string;
  email?: string;
  attachment?: { name: string; data: string }; // base64
}): Feedback {
  const category = validCategory(input.category) ? input.category : "Other";
  const body = String(input.body || "").trim();
  if (body.length < 5) throw new Error("BODY_TOO_SHORT");
  if (body.length > 5000) throw new Error("BODY_TOO_LONG");

  const fb: Feedback = {
    id: uid("fb"),
    category,
    body,
    email: input.email || undefined,
    status: "received",
    attempts: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Attachment: decode base64 to disk (dev: .data/uploads, prod: CloudBase / object storage)
  if (input.attachment && input.attachment.name && input.attachment.data) {
    try {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      const safe = input.attachment.name.replace(/[^\w.\-]/g, "_").slice(0, 80);
      const rel = `${fb.id}_${safe}`;
      fs.writeFileSync(path.join(UPLOAD_DIR, rel), Buffer.from(input.attachment.data, "base64"));
      fb.attachmentName = input.attachment.name;
      fb.attachmentPath = rel;
    } catch (e) {
      console.warn("[feedback] attachment save failed (non-fatal):", (e as any)?.message);
    }
  }

  getStore().insert<Feedback>(COLL, fb);
  return fb;
}

export async function listFeedback(): Promise<Feedback[]> {
  const all = await getStore().list<Feedback>(COLL);
  return all.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

export async function setStatus(id: string, status: FeedbackStatus): Promise<void> {
  await getStore().update<Feedback>(COLL, id, { status, updatedAt: new Date().toISOString() });
}

type MailTransporter = { sendMail: (opts: Record<string, string>) => Promise<unknown> };

let _transporter: MailTransporter | null = null;
async function getTransporter(): Promise<MailTransporter | null> {
  if (_transporter) return _transporter;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  try {
    // Optional SMTP dep. String is split so tsc/webpack do not require the package.
    const spec = "node" + "mailer";
    const loader = new Function("id", "return import(id)") as (id: string) => Promise<{
      default?: { createTransport: (opts: Record<string, unknown>) => MailTransporter };
      createTransport?: (opts: Record<string, unknown>) => MailTransporter;
    }>;
    const mod = await loader(spec);
    const nm = mod.default || mod;
    if (!nm.createTransport) return null;
    _transporter = nm.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "1",
      auth: { user, pass },
    });
    return _transporter;
  } catch {
    return null;
  }
}

export interface SendEmailOptions {
  /** Overrides FEEDBACK_TO_EMAIL; each product instance passes its own */
  to?: string;
  
  subjectPrefix?: string;
}

export async function sendFeedbackEmail(fb: Feedback, opts: SendEmailOptions = {}): Promise<void> {
  const t = await getTransporter();
  if (!t) throw new Error("SMTP_NOT_CONFIGURED");
  const to = opts.to || process.env.FEEDBACK_TO_EMAIL || "lixingliangsy@163.com";
  const prefix = opts.subjectPrefix || "[Support feedback]";
  await t.sendMail({
    from: process.env.SMTP_FROM || to,
    to,
    subject: `${prefix} ${fb.category}`,
    text: `Category: ${fb.category}\nFrom: ${fb.email || "(anonymous)"}\nAttachment: ${fb.attachmentName || "none"}\n\n${fb.body}`,
  });
}

const BACKOFF = [0, 5000, 30000];

export async function dispatchEmail(fb: Feedback, opts: SendEmailOptions = {}): Promise<void> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    if (attempt > 1) await new Promise((r) => setTimeout(r, BACKOFF[attempt - 1] || 30000));
    try {
      await sendFeedbackEmail(fb, opts);
      await setStatus(fb.id, "emailed");
      return;
    } catch (e: any) {
      console.warn(`[feedback] send attempt ${attempt} failed:`, e?.message);
      if (attempt === 3) {
        await setStatus(fb.id, "queued");
        enqueue(fb);
      }
    }
  }
}

function enqueue(fb: Feedback) {
  try {
    fs.mkdirSync(path.dirname(QUEUE), { recursive: true });
    fs.appendFileSync(QUEUE, JSON.stringify({ id: fb.id, category: fb.category, ts: Date.now() }) + "\n");
  } catch (e) {
    console.error("[feedback] queue write failed", e);
  }
}
