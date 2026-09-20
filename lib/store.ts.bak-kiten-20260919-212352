/**
 * lib/store.ts —— 持久层抽象（AIActRadar M2 的 JSON 文件模式升级版）
 *
 * 设计要点（遵循 AIActRadar 工程红线）：
 * - dev：JSON 文件（.data/<collection>.json），零外部依赖。
 * - prod：CloudBase 文档/MySQL（STORE_MODE=cloudbase），规避 Vercel serverless FS 易失。
 * - 绝不静默 mock：CloudBase 模式若未接入则显式抛错，由调用方降级。
 * - 每集合串行化写入，避免并发写损坏（简单 Promise 队列）。
 */

import fs from "fs";
import path from "path";

export interface Entity {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

type Maybe<T> = T | null;

const DATA_DIR = path.join(process.cwd(), ".data");
const WRITE_QUEUES = new Map<string, Promise<unknown>>();

function queue(collection: string, task: () => Promise<unknown>): Promise<unknown> {
  const prev = WRITE_QUEUES.get(collection) ?? Promise.resolve();
  const next = prev.then(task, task);
  WRITE_QUEUES.set(collection, next);
  return next;
}

function fileFor(collection: string): string {
  return path.join(DATA_DIR, `${collection}.json`);
}

async function readFile<T extends Entity>(collection: string): Promise<T[]> {
  try {
    const raw = await fs.promises.readFile(fileFor(collection), "utf8");
    return JSON.parse(raw) as T[];
  } catch (e: any) {
    if (e?.code === "ENOENT") return [];
    // 损坏文件不静默吞掉，但降级为空数组并告警（非主流程阻断）
    console.warn(`[store] read ${collection} failed, treating as empty:`, e?.message);
    return [];
  }
}

async function writeFile<T extends Entity>(collection: string, items: T[]): Promise<void> {
  await fs.promises.mkdir(DATA_DIR, { recursive: true });
  const tmp = fileFor(collection) + ".tmp";
  await fs.promises.writeFile(tmp, JSON.stringify(items, null, 2), "utf8");
  await fs.promises.rename(tmp, fileFor(collection)); // 原子替换
}

export interface Store {
  list<T extends Entity>(collection: string): Promise<T[]>;
  get<T extends Entity>(collection: string, id: string): Promise<Maybe<T>>;
  findBy<T extends Entity>(collection: string, pred: (x: T) => boolean): Promise<Maybe<T>>;
  insert<T extends Entity>(collection: string, item: T): Promise<T>;
  update<T extends Entity>(collection: string, id: string, patch: Partial<T>): Promise<Maybe<T>>;
  remove(collection: string, id: string): Promise<boolean>;
}

class FileStore implements Store {
  async list<T extends Entity>(c: string) {
    return readFile<T>(c);
  }
  async get<T extends Entity>(c: string, id: string) {
    const all = await readFile<T>(c);
    return all.find((x) => x.id === id) ?? null;
  }
  async findBy<T extends Entity>(c: string, pred: (x: T) => boolean) {
    const all = await readFile<T>(c);
    return all.find(pred) ?? null;
  }
  async insert<T extends Entity>(c: string, item: T) {
    return queue(c, async () => {
      const all = await readFile<T>(c);
      all.push(item);
      await writeFile(c, all);
      return item;
    }) as Promise<T>;
  }
  async update<T extends Entity>(c: string, id: string, patch: Partial<T>) {
    return queue(c, async () => {
      const all = await readFile<T>(c);
      const i = all.findIndex((x) => x.id === id);
      if (i < 0) return null;
      all[i] = { ...all[i], ...patch, updatedAt: new Date().toISOString() };
      await writeFile(c, all);
      return all[i];
    }) as Promise<Maybe<T>>;
  }
  async remove(c: string, id: string) {
    return queue(c, async () => {
      const all = await readFile(c);
      const next = all.filter((x) => (x as Entity).id !== id);
      await writeFile(c, next);
      return next.length !== all.length;
    }) as Promise<boolean>;
  }
}

class CloudBaseStore implements Store {
  // Phase 7 部署时接入 @cloudbase/node-sdk；此处显式抛错，绝不静默回退到文件。
  private notWired(): never {
    throw new Error(
      "STORE_MODE=cloudbase 但 CloudBase 适配器尚未接入（Phase 7 部署时完成）。" +
        "请先设置 STORE_MODE=file，或完成 CloudBase 连接。"
    );
  }
  list<T extends Entity>(): Promise<T[]> { return this.notWired(); }
  get<T extends Entity>(): Promise<Maybe<T>> { return this.notWired(); }
  findBy<T extends Entity>(): Promise<Maybe<T>> { return this.notWired(); }
  insert<T extends Entity>(): Promise<T> { return this.notWired(); }
  update<T extends Entity>(): Promise<Maybe<T>> { return this.notWired(); }
  remove(): Promise<boolean> { return this.notWired(); }
}

let singleton: Store | null = null;

export function getStore(): Store {
  if (singleton) return singleton;
  const mode = (process.env.STORE_MODE || "file").toLowerCase();
  singleton = mode === "cloudbase" ? new CloudBaseStore() : new FileStore();
  return singleton;
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
