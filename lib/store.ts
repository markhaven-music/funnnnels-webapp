import {
  blockId,
  defaultProps,
  funnelId,
  pageId,
  type Block,
  type Page,
  type StoredFunnel,
} from "@/lib/blocks";
import { supabase } from "@/lib/supabase";

const TABLE = "funnels";

type Row = {
  id: string;
  name: string;
  status: StoredFunnel["status"];
  type: string;
  tag: string | null;
  palette: string[];
  views: string;
  cvr: string;
  revenue: string;
  steps: number;
  on: number;
  pages: Page[];
  updated_at: string;
};

function rowToFunnel(r: Row): StoredFunnel {
  return {
    id: r.id,
    name: r.name,
    status: r.status,
    type: r.type as StoredFunnel["type"],
    tag: (r.tag ?? "") as StoredFunnel["tag"],
    palette: r.palette as StoredFunnel["palette"],
    views: r.views,
    cvr: r.cvr,
    revenue: r.revenue,
    steps: r.steps,
    on: r.on,
    pages: r.pages,
    updated: "just now",
  };
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
  const { data, error } = await supabase()
    .from(TABLE)
    .select("*")
    .order("position", { ascending: false });
  if (error) throw error;
  return (data as Row[]).map(rowToFunnel);
}

export async function getFunnel(id: string): Promise<StoredFunnel | null> {
  const { data, error } = await supabase()
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToFunnel(data as Row) : null;
}

export async function createFunnel(name: string): Promise<StoredFunnel> {
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
  const { error } = await supabase().from(TABLE).insert({
    id: f.id,
    name: f.name,
    status: f.status,
    type: f.type,
    tag: f.tag,
    palette: f.palette,
    views: f.views,
    cvr: f.cvr,
    revenue: f.revenue,
    steps: f.steps,
    on: f.on,
    pages: f.pages,
  });
  if (error) throw error;
  return f;
}

export async function updateFunnel(
  id: string,
  patch: Partial<Pick<StoredFunnel, "name" | "status">>,
): Promise<StoredFunnel | null> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.status !== undefined) update.status = patch.status;
  const { data, error } = await supabase()
    .from(TABLE)
    .update(update)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data ? rowToFunnel(data as Row) : null;
}

export async function deleteFunnel(id: string): Promise<boolean> {
  const { error, count } = await supabase()
    .from(TABLE)
    .delete({ count: "exact" })
    .eq("id", id);
  if (error) throw error;
  return (count ?? 0) > 0;
}

function activePage(f: StoredFunnel): Page {
  if (f.pages.length === 0) {
    const p: Page = { id: pageId(), name: "Landing", slug: "/", blocks: [] };
    f.pages.push(p);
    return p;
  }
  return f.pages[0];
}

async function savePages(id: string, pages: Page[]): Promise<void> {
  const { error } = await supabase()
    .from(TABLE)
    .update({ pages, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
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
  const f = await getFunnel(funnelId);
  if (!f) return null;
  const page = activePage(f);
  const merged = { ...defaultProps(type), ...props } as Block["props"];
  const block: Block = { id: blockId(), type, props: merged };
  const insertAt =
    typeof position === "number"
      ? Math.max(0, Math.min(position, page.blocks.length))
      : page.blocks.length;
  page.blocks.splice(insertAt, 0, block);
  await savePages(f.id, f.pages);
  return block;
}

export async function updateBlock(
  funnelId: string,
  id: string,
  props: Record<string, unknown>,
): Promise<Block | null> {
  const f = await getFunnel(funnelId);
  if (!f) return null;
  const page = activePage(f);
  const b = page.blocks.find((x) => x.id === id);
  if (!b) return null;
  b.props = { ...b.props, ...props } as Block["props"];
  await savePages(f.id, f.pages);
  return b;
}

export async function deleteBlock(
  funnelId: string,
  id: string,
): Promise<boolean> {
  const f = await getFunnel(funnelId);
  if (!f) return false;
  const page = activePage(f);
  const before = page.blocks.length;
  page.blocks = page.blocks.filter((x) => x.id !== id);
  if (page.blocks.length === before) return false;
  await savePages(f.id, f.pages);
  return true;
}

export async function reorderBlocks(
  funnelId: string,
  orderedIds: string[],
): Promise<boolean> {
  const f = await getFunnel(funnelId);
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
  await savePages(f.id, f.pages);
  return true;
}
