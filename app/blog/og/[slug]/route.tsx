import { ImageResponse } from "next/og";
import { BRAND } from "@/app/(funnels)/_kit/brand";
import { POSTS, post as find, roll, type RollKey } from "../../posts";

// A post's share picture (1200×630), at /blog/og/<slug>: its title over the
// notes of its first piano roll, white on black like the blog. Built with the
// site, one per post; proxy.ts hides a scheduled post's until its day.

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

const W = 1200;
const H = 630;
const ROLL = { x: 64, y: 372, w: W - 128, h: 190 };

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const p = find((await params).slug);
  if (!p) return new Response("Not found", { status: 404 });
  const first = p.blocks.find((b): b is { roll: RollKey; title: string } => "roll" in b);
  const r = first ? roll(first.roll) : null;
  // The first 16 beats, so the notes stay wide enough to read as a roll.
  const beats = r ? Math.min(r.beats, 16) : 0;
  const notes = r ? (r.notes as number[][]).filter((n) => n[0] < beats).slice(0, 140) : [];
  const lo = Math.min(...notes.map((n) => n[2]));
  const hi = Math.max(...notes.map((n) => n[2]));
  const row = ROLL.h / (hi - lo + 1 || 1);

  return new ImageResponse(
    (
      <div style={{ width: W, height: H, display: "flex", flexDirection: "column", background: "#070707", color: "#fff", padding: "56px 64px", position: "relative" }}>
        <div style={{ display: "flex", fontSize: 26, fontWeight: 700, letterSpacing: 6, color: "rgba(255,255,255,0.72)" }}>{BRAND.name.toUpperCase()} · BLOG</div>
        <div style={{ display: "flex", marginTop: 26, maxWidth: 1040, fontSize: p.title.length > 52 ? 60 : 70, fontWeight: 800, lineHeight: 1.08, letterSpacing: -2 }}>{p.title}</div>
        {notes.map((n, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: ROLL.x + (n[0] / beats) * ROLL.w,
              top: ROLL.y + (hi - n[2]) * row,
              width: Math.max(6, (Math.min(n[1], beats - n[0]) / beats) * ROLL.w - 4),
              height: Math.max(4, row - 3),
              borderRadius: 3,
              background: n[2] < 52 ? "rgba(255,255,255,0.42)" : "#fff",
            }}
          />
        ))}
      </div>
    ),
    { width: W, height: H },
  );
}
