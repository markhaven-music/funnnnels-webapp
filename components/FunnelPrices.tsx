"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { I } from "@/components/icons";
import type { FunnelItem, ItemRole } from "@/lib/catalog";
import { money, type Money } from "@/lib/launch";
import p from "./funnelPrices.module.css";

// What a funnel charges, on its map (components/FunnelMap.tsx): the prices on
// the order page's card and on each upsell's, and a drawer to change them (the
// top bar's Prices, or a click on a price): the main product, the order bumps
// and the upsells, in € and $. Saved through dashboard → Products' own API
// (/api/products/items, lib/catalog.ts), so the checkout charges the new price
// from the next order and the funnel's pages are refreshed.

export type PriceItem = FunnelItem & { sold: number };

export const priceId = (i: { role: ItemRole; key: string }) => `${i.role}/${i.key}`;

const both = (m: Money) => `${money(m.eur, "eur")} · ${money(m.usd, "usd")}`;

const TAG: Record<ItemRole, string> = { main: "Product", bump: "Order bump", upsell: "Upsell" };

/** The prices on a step's card; a click opens the drawer on that price. */
export function PriceList({ items, onEdit }: { items: PriceItem[]; onEdit: (id: string) => void }) {
  const first = items.find((i) => i.role === "bump") ?? items[0];
  return (
    <div className={p.list}>
      <div className={p.listHead}>
        <span>Prices</span>
        <button type="button" className={p.listEdit} onClick={() => onEdit(priceId(first))}>
          Edit prices
        </button>
      </div>
      {items.map((i) => (
        <button key={priceId(i)} type="button" className={p.line} onClick={() => onEdit(priceId(i))} title="Change this price">
          <span className={p.lineName}>{i.name}</span>
          <span className={`${p.tag} ${p[`tag_${i.role}`]}`}>{TAG[i.role]}</span>
          <span className={p.linePrice}>{both(i.price)}</span>
        </button>
      ))}
    </div>
  );
}

// ─── the drawer ────────────────────────────────────────────────

type Draft = { eur: string; usd: string };

const draftOf = (m: Money): Draft => ({ eur: String(m.eur), usd: String(m.usd) });
/** "7", "7.5" or "7,50" → 7.5; NaN when it isn't a price. */
const parse = (s: string) => (/^\d+([.,]\d{1,2})?$/.test(s.trim()) ? Number(s.trim().replace(",", ".")) : NaN);
const same = (d: Draft, m: Money) => parse(d.eur) === m.eur && parse(d.usd) === m.usd;

function problem(d: Draft): string | null {
  const eur = parse(d.eur);
  const usd = parse(d.usd);
  if (Number.isNaN(eur) || Number.isNaN(usd)) return "Type a price, like 7 or 7.50.";
  if (eur < 0.5 || usd < 0.5) return "Prices are 0.50 at least.";
  return null;
}

const GROUPS: { role: ItemRole; title: string; note: string }[] = [
  { role: "main", title: "Product", note: "what the order page sells" },
  { role: "bump", title: "Order bumps", note: "the tick-boxes on the order page" },
  { role: "upsell", title: "Upsells", note: "one click, after paying" },
];

type DrawerProps = {
  funnel: string;
  name: string;
  items: PriceItem[];
  focus: string; // the price to start on ("" for the first)
  onSaved: (items: PriceItem[]) => void;
  onClose: () => void;
};

export function PricesDrawer({ funnel, name, items, focus, onSaved, onClose }: DrawerProps) {
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() => Object.fromEntries(items.map((i) => [priceId(i), draftOf(i.price)])));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const body = useRef<HTMLDivElement>(null);

  const changed = items.filter((i) => !same(drafts[priceId(i)], i.price));
  const invalid = changed.some((i) => problem(drafts[priceId(i)]));

  useEffect(() => {
    const el = (focus && body.current?.querySelector<HTMLInputElement>(`input[data-id="${focus}"]`)) || body.current?.querySelector("input");
    el?.focus();
    el?.select();
    // Only on opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => {
    if (changed.length && !window.confirm("Close without saving the new prices?")) return;
    onClose();
  };
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && closeRef.current();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, []);

  const edit = (id: string, cur: "eur" | "usd", value: string) => {
    setSaved(null);
    setErrors(({ [id]: _, ...rest }) => rest);
    setDrafts((d) => {
      const was = d[id];
      // The $ price follows the € one while they match: most prices are the same number in both.
      const follow = cur === "eur" && was.usd === was.eur;
      return { ...d, [id]: { ...was, [cur]: value, ...(follow ? { usd: value } : {}) } };
    });
  };

  async function save() {
    if (!changed.length || invalid || busy) return;
    setBusy(true);
    setSaved(null);
    const results = await Promise.all(
      changed.map(async (i) => {
        const id = priceId(i);
        const price = { eur: parse(drafts[id].eur), usd: parse(drafts[id].usd) };
        const res = await fetch("/api/products/items", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ funnel, role: i.role, key: i.key, name: i.name, price }),
        }).catch(() => null);
        const json = res ? await res.json().catch(() => ({})) : {};
        return { id, price, error: res?.ok ? null : ((json.error as string | undefined) ?? "Couldn't save: check the connection.") };
      }),
    );
    const done = new Map(results.flatMap((r) => (r.error ? [] : [[r.id, r.price] as const])));
    setErrors(Object.fromEntries(results.flatMap((r) => (r.error ? [[r.id, r.error]] : []))));
    setDrafts((d) => ({ ...d, ...Object.fromEntries([...done].map(([id, m]) => [id, draftOf(m)])) }));
    if (done.size) {
      onSaved(items.map((i) => ({ ...i, price: done.get(priceId(i)) ?? i.price })));
      const failed = results.length - done.size;
      setSaved(
        failed
          ? `${done.size} saved; ${failed} not saved, see the message in red.`
          : `Saved: the checkout charges ${done.size === 1 ? "the new price" : "the new prices"} from the next order.`,
      );
    }
    setBusy(false);
  }

  return (
    <>
      <div className={p.scrim} onClick={close} aria-hidden />
      <form
        className={p.drawer}
        role="dialog"
        aria-modal="true"
        aria-label={`${name} prices`}
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <header className={p.head}>
          <div>
            <div className={p.title}>Prices</div>
            <p className={p.sub}>
              What {name} charges. € for buyers in Europe, $ for everyone else, in every language. Typing the € price
              fills in the $ one while they match.
            </p>
          </div>
          <button type="button" className={p.x} onClick={close} aria-label="Close">
            <I.close size={16} />
          </button>
        </header>

        <div className={p.body} ref={body}>
          {GROUPS.map((g) => {
            const rows = items.filter((i) => i.role === g.role);
            if (!rows.length && g.role !== "bump") return null;
            return (
              <section key={g.role} className={p.group}>
                <div className={p.groupHead}>
                  {g.title} <span>{g.note}</span>
                </div>
                {!rows.length && (
                  <p className={p.none}>
                    None yet. Any product can be one: open it in{" "}
                    <Link href="/?nav=products" className={p.link}>
                      Products
                    </Link>{" "}
                    and use &ldquo;Sell it in a funnel&rdquo;.
                  </p>
                )}
                {rows.map((i) => {
                  const id = priceId(i);
                  const d = drafts[id];
                  const isChanged = !same(d, i.price);
                  const error = errors[id] ?? (isChanged ? problem(d) : null);
                  return (
                    <div key={id} className={`${p.row} ${isChanged ? p.rowChanged : ""}`}>
                      {i.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img className={p.thumb} src={i.image} alt="" width={44} height={44} />
                      ) : (
                        <span className={p.thumb} />
                      )}
                      <div className={p.info}>
                        <div className={p.name}>{i.name}</div>
                        <div className={p.meta}>
                          {i.sold} sold{isChanged ? ` · was ${both(i.price)}` : ""}
                        </div>
                      </div>
                      <div className={p.inputs}>
                        {(["eur", "usd"] as const).map((cur) => (
                          <label key={cur} className={`${p.money} ${error && !errors[id] && Number.isNaN(parse(d[cur])) ? p.moneyBad : ""}`}>
                            <span aria-hidden>{cur === "eur" ? "€" : "$"}</span>
                            <input
                              data-id={cur === "eur" ? id : undefined}
                              inputMode="decimal"
                              autoComplete="off"
                              aria-label={`${i.name}, price in ${cur === "eur" ? "euros" : "dollars"}`}
                              value={d[cur]}
                              onChange={(e) => edit(id, cur, e.target.value)}
                            />
                          </label>
                        ))}
                      </div>
                      {error && <div className={p.error}>{error}</div>}
                    </div>
                  );
                })}
              </section>
            );
          })}
          <p className={p.note}>
            The order form and the upsell pages show the new price. The pages&rsquo; words follow it too:
            reread any line that does math with it (&ldquo;90% off&rdquo;, &ldquo;usually €147&rdquo;). Names, pictures and
            new order bumps are in{" "}
            <Link href="/?nav=products" className={p.link}>
              Products
            </Link>
            .
          </p>
        </div>

        <footer className={p.foot}>
          <span className={saved ? p.ok : p.status}>
            {saved ?? (changed.length ? `${changed.length} price${changed.length === 1 ? "" : "s"} changed` : "No changes")}
          </span>
          <button
            type="button"
            className={p.undo}
            disabled={!changed.length || busy}
            onClick={() => {
              setDrafts((d) => ({ ...d, ...Object.fromEntries(changed.map((i) => [priceId(i), draftOf(i.price)])) }));
              setErrors({});
            }}
          >
            Undo
          </button>
          <button type="submit" className={`btn primary ${p.save}`} disabled={!changed.length || invalid || busy}>
            {busy ? "Saving…" : "Save"}
          </button>
        </footer>
      </form>
    </>
  );
}
