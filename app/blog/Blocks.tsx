import type { ReactNode } from "react";
import { PlayableRoll } from "@/app/(funnels)/jazz-midi-pack/PlayableRoll";
import { GlassButton } from "@/components/ui/GlassButton";
import { packUrl, roll, type Block, type Post, type RollKey } from "./posts";
import { isLive } from "./schedule";
import b from "./blog.module.css";

// A post's blocks as HTML (posts.ts). Server-rendered; the piano rolls are the
// Jazz landing's own island (PlayableRoll + piano.ts), fed the file's notes as
// a prop, so a post carries only the rolls it shows.

/** "the **ii-V-I** [explained](/blog/…)" → text, <strong>, <a>. `{pack}` is the pack's page. */
export function inline(text: string, slug: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) out.push(<strong key={m.index}>{inline(m[1], slug)}</strong>);
    else {
      const pack = m[3] === "{pack}";
      // A link to a post that isn't out yet stays plain words until its day (schedule.ts).
      const other = m[3].match(/^\/blog\/([a-z0-9-]+)$/)?.[1];
      if (other && !isLive(other)) out.push(m[2]);
      else
      out.push(
        <a key={m.index} href={pack ? packUrl(slug, "text") : m[3]} {...(pack ? { "data-cta": "" } : {})}>
          {m[2]}
        </a>,
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** An h2's anchor: "1. ii-V-I" → "ii-v-i". */
export const anchor = (h: string) =>
  h
    .toLowerCase()
    .replace(/^\d+\.\s*/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export function Blocks({ post }: { post: Post }) {
  const { slug } = post;
  // The last panel is the post's closing one; any earlier one counts as "box".
  const lastCta = post.blocks.findLastIndex((x) => "cta" in x);
  return post.blocks.map((x: Block, i) => {
    if ("h2" in x)
      return (
        <h2 key={i} id={anchor(x.h2)} className={b.h2}>
          {x.h2}
        </h2>
      );
    if ("h3" in x)
      return (
        <h3 key={i} className={b.h3}>
          {x.h3}
        </h3>
      );
    if ("p" in x) return <p key={i}>{inline(x.p, slug)}</p>;
    if ("note" in x)
      return (
        <p key={i} className={b.note}>
          {inline(x.note, slug)}
        </p>
      );
    if ("ul" in x)
      return (
        <ul key={i} className={b.list}>
          {x.ul.map((t) => (
            <li key={t}>{inline(t, slug)}</li>
          ))}
        </ul>
      );
    if ("ol" in x)
      return (
        <ol key={i} className={b.list}>
          {x.ol.map((t) => (
            <li key={t}>{inline(t, slug)}</li>
          ))}
        </ol>
      );
    if ("chords" in x)
      return (
        <figure key={i} className={b.chords}>
          <ul>
            {x.chords.map((c, n) => (
              <li key={n}>{c}</li>
            ))}
          </ul>
          {x.label && <figcaption>{x.label}</figcaption>}
        </figure>
      );
    if ("table" in x)
      return (
        <div key={i} className={b.tableWrap}>
          <table className={b.table}>
            <thead>
              <tr>
                {x.table.head.map((h) => (
                  <th key={h} scope="col">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {x.table.rows.map((r) => (
                <tr key={r[0]}>
                  {r.map((c, n) => (n === 0 ? <th key={n} scope="row">{c}</th> : <td key={n}>{c}</td>))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    if ("chart" in x) return <Chart key={i} id={x.chart} caption={x.caption} />;
    if ("roll" in x)
      return (
        <div key={i} className={b.roll}>
          <PlayableRoll roll={roll(x.roll)} title={x.title} playLabel={`Play ${x.title}`} lazy={i > 6} />
        </div>
      );
    return <PackPanel key={i} slug={slug} text={x.cta} spot={i === lastCta ? "end" : "box"} />;
  });
}

/** A file's chords bar by bar, four bars to a line, read from the file's chord markers. A bar with no new chord repeats the last one, dimmed. */
function Chart({ id, caption }: { id: RollKey; caption?: string }) {
  const r = roll(id);
  const starts = r.chords as (number | string)[][];
  let bars = Math.ceil(r.beats / 4);
  const inBar = (n: number) => starts.filter((c) => (c[0] as number) >= n * 4 && (c[0] as number) < n * 4 + 4).map((c) => c[1] as string);
  while (bars > 1 && inBar(bars - 1).length === 0) bars--; // a loop's ringing tail
  let last = "";
  const cells = Array.from({ length: bars }, (_, n) => {
    const names = inBar(n);
    const cell = names.length ? { names, held: false } : { names: [last], held: true };
    if (names.length) last = names[names.length - 1];
    return cell;
  });
  return (
    <figure className={b.chart}>
      <ol>
        {cells.map((c, n) => (
          <li key={n} className={c.held ? b.held : undefined}>
            <span className={b.barNo}>{n + 1}</span>
            {c.names.map((name, k) => (
              <span key={k}>{name}</span>
            ))}
          </li>
        ))}
      </ol>
      <figcaption>{caption ?? `${bars} bars, one box per bar. Two chords in a box get two beats each.`}</figcaption>
    </figure>
  );
}

/** The Jazz MIDI Pack beside a few lines and the button: the Jazz landing's panel (box left, copy right). */
export function PackPanel({ slug, text, spot }: { slug: string; text: string; spot: "box" | "end" }) {
  const href = packUrl(slug, spot);
  return (
    <aside className={b.pack}>
      <a href={href} className={b.packPic} tabIndex={-1} aria-hidden>
        <img src="/funnels/jazz-midi-pack/box-520.webp" width={520} height={741} alt="" loading="lazy" decoding="async" />
      </a>
      <div className={b.packText}>
        <p className={b.packName}>Jazz MIDI Pack</p>
        <p>{text}</p>
        <GlassButton href={href} variant="clear" size="lg" label="See the pack" cta />
        <p className={b.packNote}>One payment · instant download · any DAW</p>
      </div>
    </aside>
  );
}
