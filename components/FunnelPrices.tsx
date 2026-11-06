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
// from the next order and the funnel's pages are refreshed. The order bumps
// can also be put in order, taken out and added here (11-06, "rendere selezione
// order bump più semplice dal pannello funnel"): those save at once.

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
          Edit prices &amp; order bumps
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

  const draft = (i: PriceItem) => drafts[priceId(i)] ?? draftOf(i.price);
  const changed = items.filter((i) => !same(draft(i), i.price));
  const invalid = changed.some((i) => problem(draft(i)));

  // ─── the order bumps' list: order, out, in (saved at once) ───
  const [listBusy, setListBusy] = useState(false);
  const [listMsg, setListMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [products, setProducts] = useState<{ slug: string; name: string; file: string | null; image: string | null }[]>([]);
  const [pick, setPick] = useState("");
  const [pickPrice, setPickPrice] = useState<Draft>({ eur: "", usd: "" });
  useEffect(() => {
    fetch("/api/products", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setProducts((j.products ?? []).map((x: { slug: string; name: string; file: string | null; image: string | null }) => ({ slug: x.slug, name: x.name, file: x.file, image: x.image }))))
      .catch(() => {});
  }, []);
  async function listAct(method: "PUT" | "DELETE" | "POST", body: Record<string, unknown>, done: string) {
    setListBusy(true);
    setListMsg(null);
    try {
      const res = await fetch("/api/products/items", { method, headers: { "content-type": "application/json" }, body: JSON.stringify({ funnel, ...body }) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Couldn't save.");
      const fresh = await fetch(`/api/products/items?funnel=${encodeURIComponent(funnel)}`, { cache: "no-store" }).then((r) => r.json());
      onSaved(fresh.items ?? items);
      setListMsg({ ok: true, text: done });
      return true;
    } catch (err) {
      setListMsg({ ok: false, text: (err as Error).message });
      return false;
    } finally {
      setListBusy(false);
    }
  }
  const bumps = items.filter((i) => i.role === "bump");
  const addable = products.filter((x) => x.file && !items.some((i) => i.product === x.slug && i.role !== "upsell"));

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
        const price = { eur: parse(draft(i).eur), usd: parse(draft(i).usd) };
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
            <div className={p.title}>Prices &amp; order bumps</div>
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
                {!rows.length && <p className={p.none}>None yet: add one below.</p>}
                {rows.map((i) => {
                  const id = priceId(i);
                  const d = draft(i);
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
                      {i.role === "bump" && (
                        <div className={p.order}>
                          <span className={p.place}>
                            {bumps.indexOf(i) + 1} of {bumps.length} on the order form
                          </span>
                          <button type="button" className={p.mini} disabled={listBusy || bumps.indexOf(i) === 0} onClick={() => listAct("PUT", { role: "bump", key: i.key, move: -1 }, `${i.name} moved up.`)} aria-label={`Move ${i.name} up`}>
                            ↑ Up
                          </button>
                          <button type="button" className={p.mini} disabled={listBusy || bumps.indexOf(i) === bumps.length - 1} onClick={() => listAct("PUT", { role: "bump", key: i.key, move: 1 }, `${i.name} moved down.`)} aria-label={`Move ${i.name} down`}>
                            ↓ Down
                          </button>
                          <button
                            type="button"
                            className={`${p.mini} ${p.miniDanger}`}
                            disabled={listBusy}
                            onClick={() => window.confirm(`Take ${i.name} off ${name}'s order form?`) && listAct("DELETE", { role: "bump", key: i.key }, `${i.name} taken off the order form.`)}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                      {error && <div className={p.error}>{error}</div>}
                    </div>
                  );
                })}
                {g.role === "bump" && (
                  <div className={p.add}>
                    <div className={p.addHead}>Add an order bump</div>
                    <div className={p.addRow}>
                      <select
                        className={p.select}
                        value={pick}
                        onChange={(e) => setPick(e.target.value)}
                        aria-label="Product to add as an order bump"
                      >
                        <option value="">Choose a product…</option>
                        {addable.map((x) => (
                          <option key={x.slug} value={x.slug}>
                            {x.name}
                          </option>
                        ))}
                      </select>
                      {(["eur", "usd"] as const).map((cur) => (
                        <label key={cur} className={p.money}>
                          <span aria-hidden>{cur === "eur" ? "€" : "$"}</span>
                          <input
                            inputMode="decimal"
                            autoComplete="off"
                            aria-label={`New order bump, price in ${cur === "eur" ? "euros" : "dollars"}`}
                            value={pickPrice[cur]}
                            onChange={(e) => {
                              const v = e.target.value;
                              setPickPrice((d) => ({ ...d, [cur]: v, ...(cur === "eur" && d.usd === d.eur ? { usd: v } : {}) }));
                            }}
                          />
                        </label>
                      ))}
                      <button
                        type="button"
                        className="btn primary"
                        disabled={listBusy || !pick || !!problem(pickPrice)}
                        onClick={async () => {
                          const x = addable.find((a) => a.slug === pick);
                          const ok = await listAct("POST", { product: pick, role: "bump", price: { eur: parse(pickPrice.eur), usd: parse(pickPrice.usd) } }, `${x?.name ?? "It"} added, last on the order form.`);
                          if (ok) {
                            setPick("");
                            setPickPrice({ eur: "", usd: "" });
                          }
                        }}
                      >
                        Add
                      </button>
                    </div>
                    <p className={p.addNote}>It goes last; move it with ↑. Products without a zip can&rsquo;t be added: buyers would get nothing.</p>
                  </div>
                )}
                {g.role === "bump" && listMsg && <p className={listMsg.ok ? p.ok : p.error}>{listMsg.text}</p>}
              </section>
            );
          })}
          <p className={p.note}>
            The order form and the upsell pages show the new price. The pages&rsquo; words follow it too:
            reread any line that does math with it (&ldquo;90% off&rdquo;, &ldquo;usually €147&rdquo;). Names and pictures
            are in{" "}
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
