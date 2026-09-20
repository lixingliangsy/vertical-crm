/** Session memory with a 30-minute TTL. Store failures do not block chat. */
import { getStore, type Entity } from "../store";

const COLL = "chat_mem";
const TTL_MS = 30 * 60 * 1000;

export interface ChatTurn {
  role: "user" | "assistant";
  text: string;
  at: string;
}

export interface ChatSession extends Entity {
  id: string;
  turns: ChatTurn[];
  createdAt: string;
  lastActive: string;
}

function emptySession(id: string): ChatSession {
  const now = new Date().toISOString();
  return { id, turns: [], createdAt: now, lastActive: now };
}

async function load(id: string): Promise<ChatSession> {
  try {
    const s = await getStore().get<ChatSession>(COLL, id);
    if (!s) return emptySession(id);
    if (Date.now() - new Date(s.lastActive).getTime() > TTL_MS) {
      const fresh = emptySession(id);
      fresh.createdAt = s.createdAt;
      return fresh;
    }
    return s;
  } catch {
    return emptySession(id);
  }
}

async function save(s: ChatSession): Promise<void> {
  try {
    s.lastActive = new Date().toISOString();
    const existing = await getStore().get<ChatSession>(COLL, s.id);
    if (existing) await getStore().update<ChatSession>(COLL, s.id, { turns: s.turns, lastActive: s.lastActive });
    else await getStore().insert<ChatSession>(COLL, s);
  } catch (e) {
    console.warn("[agent:memory] save failed (non-fatal):", (e as any)?.message);
  }
}

export async function getRecent(id: string, n = 6): Promise<ChatTurn[]> {
  const s = await load(id);
  return s.turns.slice(-n);
}

export async function appendTurn(id: string, role: ChatTurn["role"], text: string): Promise<void> {
  const s = await load(id);
  s.turns.push({ role, text, at: new Date().toISOString() });
  if (s.turns.length > 20) s.turns = s.turns.slice(-20);
  await save(s);
}

export async function pruneStaleSessions(): Promise<number> {
  try {
    const all = await getStore().list<ChatSession>(COLL);
    let removed = 0;
    for (const s of all) {
      if (Date.now() - new Date(s.lastActive).getTime() > TTL_MS) {
        await getStore().remove(COLL, s.id);
        removed++;
      }
    }
    return removed;
  } catch {
    return 0;
  }
}
