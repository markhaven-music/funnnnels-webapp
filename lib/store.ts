import { promises as fs } from "node:fs";
import path from "node:path";
import {
  blockId,
  defaultProps,
  funnelId,
  pageId,
  type Block,
  type Page,
  type StoredFunnel,
} from "@/lib/blocks";

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "funnels.json");

type StoreShape = { funnels: StoredFunnel[] };

// Always read from disk — Next.js may load this module in separate realms
// for /api routes and server components, so an in-memory cache would go
// stale across processes.
async function load(): Promise<StoreShape> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw) as StoreShape;
  } catch {
    const fresh: StoreShape = { funnels: [] };
    await persist(fresh);
    return fresh;
  }
}

async function persist(state: StoreShape) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(state, null, 2), "utf-8");
}

function starterBlocks(): Block[] {
  return [
    {
      id: blockId(),
      type: "hero",
      props: {
        eyebrow: "New funnel",
        headline: "Tell Riley what you want.",
        subhead:
          "Ask in the chat on the right — Riley will rewrite this hero, add sections, and wire your CTAs.",
        primary_cta: "Get started",
        align: "center",
      },
    },
  ];
}

export async function listFunnels(): Promise<StoredFunnel[]> {
  const s = await load();
  return s.funnels;
}

export async function getFunnel(id: string): Promise<StoredFunnel | null> {
  const s = await load();
  return s.funnels.find((f) => f.id === id) ?? null;
}

export async function createFunnel(name: string): Promise<StoredFunnel> {
  const s = await load();
  const f: StoredFunnel = {
    id: funnelId(),
    name: name || "Untitled funnel",
    status: "draft",
    type: "Landing",
    tag: "new",
    palette: ["oklch(0.74 0.19 295)", "oklch(0.55 0.18 280)"],
    views: "—",
    cvr: "—",
    revenue: "—",
    updated: "just now",
    steps: 1,
    on: 0,
    pages: [
      {
        id: pageId(),
        name: "Landing",
        slug: "/",
        blocks: starterBlocks(),
      },
    ],
  };
  s.funnels.unshift(f);
  await persist(s);
  return f;
}

export async function updateFunnel(
  id: string,
  patch: Partial<Pick<StoredFunnel, "name" | "status">>,
): Promise<StoredFunnel | null> {
  const s = await load();
  const f = s.funnels.find((x) => x.id === id);
  if (!f) return null;
  if (patch.name !== undefined) f.name = patch.name;
  if (patch.status !== undefined) f.status = patch.status;
  f.updated = "just now";
  await persist(s);
  return f;
}

export async function deleteFunnel(id: string): Promise<boolean> {
  const s = await load();
  const before = s.funnels.length;
  s.funnels = s.funnels.filter((f) => f.id !== id);
  if (s.funnels.length === before) return false;
  await persist(s);
  return true;
}

function activePage(f: StoredFunnel): Page {
  if (f.pages.length === 0) {
    const p: Page = { id: pageId(), name: "Landing", slug: "/", blocks: [] };
    f.pages.push(p);
    return p;
  }
  return f.pages[0];
}

export async function listBlocks(
  funnelId: string,
): Promise<Array<Pick<Block, "id" | "type">> | null> {
  const f = await getFunnel(funnelId);
  if (!f) return null;
  return activePage(f).blocks.map((b) => ({ id: b.id, type: b.type }));
}

export async function getBlock(
  funnelId: string,
  id: string,
): Promise<Block | null> {
  const f = await getFunnel(funnelId);
  if (!f) return null;
  return activePage(f).blocks.find((b) => b.id === id) ?? null;
}

export async function addBlock(
  funnelId: string,
  type: Block["type"],
  props: Record<string, unknown>,
  position?: number,
): Promise<Block | null> {
  const s = await load();
  const f = s.funnels.find((x) => x.id === funnelId);
  if (!f) return null;
  const page = activePage(f);
  const merged = { ...defaultProps(type), ...props } as Block["props"];
  const block: Block = { id: blockId(), type, props: merged };
  const insertAt =
    typeof position === "number"
      ? Math.max(0, Math.min(position, page.blocks.length))
      : page.blocks.length;
  page.blocks.splice(insertAt, 0, block);
  f.updated = "just now";
  await persist(s);
  return block;
}

export async function updateBlock(
  funnelId: string,
  id: string,
  props: Record<string, unknown>,
): Promise<Block | null> {
  const s = await load();
  const f = s.funnels.find((x) => x.id === funnelId);
  if (!f) return null;
  const page = activePage(f);
  const b = page.blocks.find((x) => x.id === id);
  if (!b) return null;
  b.props = { ...b.props, ...props } as Block["props"];
  f.updated = "just now";
  await persist(s);
  return b;
}

export async function deleteBlock(
  funnelId: string,
  id: string,
): Promise<boolean> {
  const s = await load();
  const f = s.funnels.find((x) => x.id === funnelId);
  if (!f) return false;
  const page = activePage(f);
  const before = page.blocks.length;
  page.blocks = page.blocks.filter((x) => x.id !== id);
  if (page.blocks.length === before) return false;
  f.updated = "just now";
  await persist(s);
  return true;
}

export async function reorderBlocks(
  funnelId: string,
  orderedIds: string[],
): Promise<boolean> {
  const s = await load();
  const f = s.funnels.find((x) => x.id === funnelId);
  if (!f) return false;
  const page = activePage(f);
  const byId = new Map(page.blocks.map((b) => [b.id, b]));
  const next: Block[] = [];
  for (const id of orderedIds) {
    const b = byId.get(id);
    if (!b) return false;
    next.push(b);
    byId.delete(id);
  }
  for (const remaining of byId.values()) next.push(remaining);
  page.blocks = next;
  f.updated = "just now";
  await persist(s);
  return true;
}
