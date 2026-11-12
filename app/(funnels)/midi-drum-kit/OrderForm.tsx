"use client";

import { useEffect, useMemo, useRef, useState } from "react";
// "pure": Stripe.js loads when loadStripe is called, not as soon as this file does.
import { loadStripe } from "@stripe/stripe-js/pure";
import { Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { cookieCountry, type Currency } from "@/lib/geo";
import { isPreview, track } from "@/lib/beacon";
import { readVariant } from "./abtest";
import { LP } from "./landingTest";
import { readPay, type PayVariant } from "./payTest";
import { BONUS, BONUS_WORDS } from "./bonusTest";
import { BonusItem, endBonus, useBonus } from "./BonusClock";
import { pixel } from "../jazz-midi-pack/Tracking";
import { CardFields, cardElements, payWithCard, payWithWallet, Wallet, useFirstTouch, type CardLook } from "../CardFields";
import { OwnerSkip } from "../OwnerSkip";
import { Arrow } from "../jazz-midi-pack/Cta";
import k from "../jazz-midi-pack/btn.module.css";
import j from "../jazz-midi-pack/checkout.module.css";
import { Rich } from "../top-hits-midi-bundle/Rich";
import d from "./order.module.css";
import { copyFor, type Copy } from "./copy";
import { funnel } from "./funnel";
import { money as fmt, paths, type Lang } from "./i18n";
import type { OrderOffer } from "./offer";

// The order form, in the page's language (words in ./copy, `form`). Its steps are the ClickFunnels form's
// (/spot-available-midi-drum-kit-ad-15m30); since 2026-11-12 it is drawn as the Jazz MIDI Pack's checkout
// (jazz-midi-pack/CheckoutWidget.tsx), with that page's own classes (checkout.module.css .light,
// btn.module.css), so the two stay the same ("make the checkout widget step 2 the same as the MIDI Jazz
// Pack order checkout widget. Same fonts sizes ways of presenting etc"):
//   1 · Your Info → first, last, email (saved as a lead), the key "GO TO STEP 2"
//   2 · Payment   → the product with its box ("Instant download", €297 crossed out, €27 · one payment),
//                   Card | PayPal, the tick-box offers each with its picture, the order's lines and total,
//                   the key "GET THE PACK!" with the total inside it, and on phones a "Pay" bar at the
//                   bottom of the screen while that key is off it (the step-2 test's winner, ./payTest.ts)
// The key is the Jazz page's, in the Drum Kit's orange (./order.module.css .dk sets the colour).
// Card fields are Stripe's, laid out like ClickFunnels' (../CardFields.tsx);
// PayPal sends the buyer to PayPal and back (/api/checkout/paypal → /api/checkout/paypal/return).
// What it sells (`offer`: names, prices, add-ons) comes from the server page,
// as dashboard → Products has it (./offer.ts). Prices shown here are only a
// preview: the server prices the order itself.

// The Jazz order page's card fields: its body face, black on white (jazz-midi-pack/CheckoutWidget.tsx GEIST).
const GEIST: CardLook = {
  font: "Geist, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontCss: "https://fonts.googleapis.com/css2?family=Geist:wght@400&display=swap",
  color: "#000000",
  placeholder: "#6b6b6b",
  focus: "#000000",
};
const BOX = "/funnels/midi-drum-kit/kit-box-v3-160.webp";

const PAYPAL_ON = Boolean(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID);

type Method = "card" | "paypal";
type Info = { firstName: string; lastName: string; email: string };
// afterOrder: the page after paying (the first upsell, or the thank-you page);
// keepCard: the card is kept for the one-click upsells (Stripe setup_future_usage,
// which the intent route sets too: both must say the same).
// form: the form's words with the dashboard's edits (../texts.ts), from the order page.
type Props = { lang: Lang; currency: Currency; country: string; publishableKey: string | null; afterOrder: string; keepCard: boolean; offer: OrderOffer; form?: Copy["form"] };

const stripeCache = new Map<string, ReturnType<typeof loadStripe>>();
function stripeFor(key: string) {
  if (!stripeCache.has(key)) stripeCache.set(key, loadStripe(key));
  return stripeCache.get(key)!;
}

// Step 2 survives a reload: iPads reload a tab left for a moment (to fetch a card,
// read a bank's text) and a refresh did the same, and the buyer was back on an
// empty step 1 ("dopo il primo step il sistema ritorna indietro", 2026-11-10).
// The tab remembers name, email and step for 2 hours (sessionStorage: this tab only).
const KEEP = `fv:co:${funnel.slug}`;
function keep(info: Info, step: 1 | 2) {
  try {
    if (info.email) sessionStorage.setItem(KEEP, JSON.stringify({ ...info, step, at: Date.now() }));
  } catch {
    // no storage: a reload starts over, as before
  }
}
function kept(): (Info & { step: 1 | 2 }) | null {
  try {
    const k = JSON.parse(sessionStorage.getItem(KEEP) ?? "null");
    if (!k || typeof k.email !== "string" || !k.email || Date.now() - k.at > 2 * 3600 * 1000) return null;
    return { firstName: String(k.firstName ?? ""), lastName: String(k.lastName ?? ""), email: k.email, step: k.step === 2 ? 2 : 1 };
  } catch {
    return null;
  }
}

export function OrderForm({ lang, currency, country, publishableKey, afterOrder, keepCard, offer, form }: Props) {
  const t = form ?? copyFor(lang, currency).form;
  const [step, setStep] = useState<1 | 2>(1);
  // The dashboard's editor (funnel map → Edit, "Step 2") opens the form on step 2, to edit its words.
  useEffect(() => {
    if (/[?&]edit=1(&|$)/.test(location.search) && /[?&]step=2(&|$)/.test(location.search)) setStep(2);
  }, []);
  const [info, setInfo] = useState<Info>({ firstName: "", lastName: "", email: "" });
  // Back after a reload: where they were, with what they typed. No lead, InitiateCheckout or "checkout" again.
  const [restored, setRestored] = useState(0);
  useEffect(() => {
    const k = kept();
    if (!k) return;
    setInfo({ firstName: k.firstName, lastName: k.lastName, email: k.email });
    setRestored(1);
    if (k.step === 2) {
      setWanted(true);
      setStep(2);
    }
  }, []);
  // The step-2 test's letter (./payTest.ts); set before this mounts by the page's script.
  const [pay, setPay] = useState<PayVariant>("b");
  useEffect(() => setPay(readPay() ?? "b"), []);
  // <html data-order-step>: step 2 hides the "reserved for" timer, the pay bar takes its place (./order.module.css).
  useEffect(() => {
    document.documentElement.setAttribute("data-order-step", String(step));
  }, [step]);
  const [picked, setPicked] = useState<string[]>([]);
  // The add-ons ticked, for the upsell pages: one already bought here is skipped (./upsell.ts).
  useEffect(() => {
    document.cookie = `fv_owned=${picked.join(",")}; path=/; max-age=7200; samesite=lax`;
  }, [picked]);
  const [method, setMethod] = useState<Method>("card");
  // The 5-minute bonus (./bonusTest.ts): while it runs the Expansions are in the
  // order for free, so their €7 add-on is off the form (and unticked).
  const bonus = useBonus();
  const bonusLive = bonus.live && offer.bumps.some((b) => b.id === BONUS.item);
  // In the bonus half: the row stays in step 2, as "Time's up" once the 5 minutes are over.
  const bonusOn = bonus.on && !bonus.gone && bonus.left !== null;
  useEffect(() => {
    if (bonusLive && picked.includes(BONUS.item)) setPicked(picked.filter((x) => x !== BONUS.item));
  }, [bonusLive, picked]);
  const price = offer.price;
  const total = price + offer.bumps.filter((b) => picked.includes(b.id)).reduce((n, b) => n + b.price, 0);
  // Stripe.js (≈150 KB of script) loads once the buyer starts on the form, not
  // with the page, which kept the order page under 90 on PageSpeed mobile (docs/page-speed.md).
  const [wanted, setWanted] = useState(false);
  // …or, sooner, once they do anything on the page (../CardFields.tsx useFirstTouch).
  const touched = useFirstTouch();
  const stripePromise = useMemo(() => (publishableKey && (wanted || touched) ? stripeFor(publishableKey) : null), [publishableKey, wanted, touched]);
  // The abandoned-checkout emails' link ("I've saved your cart", ?c=, lib/mail.ts resumeToken):
  // their name and email filled, straight to step 2. No InitiateCheckout again: they had theirs.
  useEffect(() => {
    const c = new URLSearchParams(location.search).get("c");
    if (!c) return;
    fetch("/api/checkout/resume", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ t: c, funnel: funnel.slug }) })
      .then((r) => (r.ok ? r.json() : null))
      .then((cart: Info | null) => {
        if (!cart?.email) return;
        const saved = { firstName: cart.firstName ?? "", lastName: cart.lastName ?? "", email: cart.email };
        setInfo(saved);
        keep(saved, 2);
        setWanted(true);
        setStep(2);
        track({ funnel: funnel.slug, page: "checkout", lang, abCookie: LP.cookie });
        // The token off the address bar: a shared or bookmarked link carries no one's cart.
        const url = new URL(location.href);
        url.searchParams.delete("c");
        history.replaceState(history.state, "", url);
        // On phones the form is under the summary: straight to it (a jump, not an animation, on arrival).
        window.scrollTo(0, document.getElementById("complete-order")?.offsetTop ?? 0);
      })
      .catch(() => {});
  }, [lang]);
  const state: PayState = { lang, t, currency, country, info, method, picked, setPicked, total, afterOrder, offer, keepCard, pay, bonusLive, bonusOn };

  // €27, not €27.00: as the Jazz checkout writes its prices.
  const cash = (n: number) => fmt(n, currency, lang, !Number.isInteger(n));

  return (
    <div className={`${j.widget} ${j.light}`} data-step={step} onFocusCapture={() => setWanted(true)} onPointerDownCapture={() => setWanted(true)}>
      <ol className={j.tabs}>
        <li>
          <button type="button" className={`${j.tab} ${step === 1 ? j.tabOn : ""}`} onClick={() => { if (step === 2) { keep(info, 1); setStep(1); } }}>
            <span className={j.tabNum}>1</span>
            <span>
              <span className={j.tabTitle}>{t.step1}</span>
              <span className={j.tabSub}>{t.step1Sub}</span>
            </span>
          </button>
        </li>
        <li>
          <div className={`${j.tab} ${step === 2 ? j.tabOn : ""}`} aria-current={step === 2}>
            <span className={j.tabNum}>2</span>
            <span>
              <span className={j.tabTitle}>{t.step2}</span>
              <span className={j.tabSub}>{t.step2Sub}</span>
            </span>
          </div>
        </li>
      </ol>

      <div className={j.body}>
        {/* While step 1 is filled in, Stripe's card fields load out of sight, so on
            step 2 they show at once ("ci mettono un po' a caricare"). */}
        {step === 1 && stripePromise && (
          <div aria-hidden style={{ position: "absolute", left: -10000, top: 0, width: 340, height: 0, overflow: "hidden" }}>
            <Elements stripe={stripePromise} options={cardElements(GEIST, lang, { total, currency })}>
              <CardFields look={GEIST} />
            </Elements>
          </div>
        )}
        {step === 1 ? (
          <InfoStep
            key={restored}
            t={t}
            lang={lang}
            info={info}
            onDone={(next) => {
              setInfo(next);
              keep(next, 2);
              setWanted(true);
              setStep(2);
              window.scrollTo({ top: document.getElementById("complete-order")?.offsetTop ?? 0, behavior: "smooth" });
              pixel("InitiateCheckout", { content_name: offer.product, value: price, currency: currency.toUpperCase(), ab_lp: readVariant(), ab_pay: readPay() });
              track({ funnel: funnel.slug, page: "checkout", lang, abCookie: LP.cookie });
            }}
          />
        ) : (
          <>
            <button type="button" className={j.back} onClick={() => { keep(info, 1); setStep(1); }}>
              ← {t.back}
            </button>

            <div className={`${j.orderBox} ${j.orderBoxPic}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={j.orderPic} src={BOX} alt="" width={52} height={67} />
              <span className={j.orderText}>
                <span className={j.orderTag}>{t.instant}</span>
                <span className={j.orderName}>{pay === "a" ? funnel.orderNameBefore : offer.name}</span>
                <span className={j.orderDesc}>{t.orderDesc}</span>
                <span className={j.orderPrice}>
                  {/* The price it's down from (funnel.ts wasPrice, the sales page's €297), then today's. */}
                  {pay !== "a" && funnel.wasPrice > price && <s className={d.was}>{cash(funnel.wasPrice)}</s>}
                  {cash(price)} · {t.onePayment}
                </span>
              </span>
            </div>

            <p className={j.label}>
              <span>{t.paymentInfo}</span>
            </p>
            {PAYPAL_ON && (
              <div className={j.methods} role="radiogroup" aria-label={t.paymentMethod}>
                <button type="button" role="radio" aria-checked={method === "card"} className={`${j.method} ${method === "card" ? j.methodOn : ""}`} onClick={() => setMethod("card")}>
                  <CardGlyph /> {t.card}
                </button>
                <button type="button" role="radio" aria-checked={method === "paypal"} className={`${j.method} ${method === "paypal" ? j.methodOn : ""}`} onClick={() => setMethod("paypal")}>
                  <PayPalGlyph /> {t.paypal}
                </button>
              </div>
            )}

            {stripePromise ? (
              <Elements stripe={stripePromise} options={cardElements(GEIST, lang, { total, currency })}>
                <CardPay {...state} stripePromise={stripePromise} />
              </Elements>
            ) : (
              <>
                {method === "card" && <div className={j.notConnected}>{t.notConnected}</div>}
                <PayBody {...state} cardOff />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function InfoStep({ t, lang, info, onDone }: { t: Copy["form"]; lang: Lang; info: Info; onDone: (info: Info) => void }) {
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Info;
    // The lead is saved in the background: step 2 opens at once either way.
    fetch("/api/checkout/lead", {
      method: "POST",
      headers: { "content-type": "application/json" },
      // own: an owner or test device (lib/beacon.ts isPreview): not counted as a real checkout start.
      body: JSON.stringify({ ...data, funnel: funnel.slug, lang, own: isPreview() }),
      keepalive: true,
    }).catch(() => {});
    onDone(data);
  }
  return (
    <form onSubmit={submit} className={j.form}>
      <div className={j.row}>
        <input name="firstName" placeholder={t.firstName} autoComplete="given-name" defaultValue={info.firstName} required className={j.input} />
        <input name="lastName" placeholder={t.lastName} autoComplete="family-name" defaultValue={info.lastName} className={j.input} />
      </div>
      <input name="email" type="email" placeholder={t.email} autoComplete="email" inputMode="email" defaultValue={info.email} required className={j.input} />
      <button className={`${k.btn} ${k.full}`}>
        <span className={k.shine} aria-hidden />
        <span className={k.label}>
          <span>{t.next}</span>
          <Arrow className={k.arrow} />
        </span>
      </button>
      <p className={j.fine}>{t.respect}</p>
      <OwnerSkip onSkip={() => onDone(info)} />
    </form>
  );
}

type PayState = {
  lang: Lang;
  afterOrder: string;
  t: Copy["form"];
  currency: Currency;
  country: string;
  info: Info;
  method: Method;
  picked: string[];
  setPicked: (ids: string[]) => void;
  total: number;
  offer: OrderOffer;
  keepCard: boolean;
  pay: PayVariant;
  bonusLive: boolean;
  bonusOn: boolean;
};

function CardPay({ stripePromise, ...props }: PayState & { stripePromise: ReturnType<typeof loadStripe> }) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasWallet, setHasWallet] = useState(false);
  // The card form doesn't ask for the country: Stripe needs it, so it's the one
  // we already know from the visit.
  const billing = {
    name: `${props.info.firstName} ${props.info.lastName}`.trim(),
    email: props.info.email,
    address: { country: cookieCountry(props.currency, props.country) },
  };

  // The PaymentIntent, at the server's price; its client secret.
  async function intent(): Promise<string> {
    const res = await fetch("/api/checkout/intent", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        funnel: funnel.slug,
        ...props.info,
        bumps: props.picked,
        // The landing the buyer saw (./landingTest.ts): what the dashboard counts this order under.
        // Step 2 (./payTest.ts) is judged by its days, so it needs no letter here.
        variant: readVariant() ?? "",
        // The Expansions free, as the page shows them (the server checks the 5 minutes).
        bonus: props.bonusLive,
        lang: props.lang,
        country: cookieCountry(props.currency, props.country),
        expected: props.total,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (json.bonusExpired) endBonus();
    if (!res.ok || !json.clientSecret) throw new Error(json.error ?? props.t.paymentFailed);
    return json.clientSecret;
  }

  async function payByCard() {
    if (!stripe || !elements) return;
    setPaying(true);
    setError(null);
    try {
      await payWithCard(stripe, elements, billing, intent, props.afterOrder);
    } catch (err) {
      setError((err as Error).message);
      setPaying(false);
    }
  }

  return (
    <>
      {/* Hidden, not unmounted, on the Paypal tab: switching back keeps what was typed. */}
      <div hidden={props.method !== "card"} className={j.cardPane}>
        <Elements
          stripe={stripePromise}
          options={{
            mode: "payment",
            amount: Math.round(props.total * 100),
            currency: props.currency,
            allowedPaymentMethodTypes: ["card"],
            locale: props.lang,
            ...(props.keepCard ? { setupFutureUsage: "off_session" as const } : {}),
          }}
        >
          <Wallet
            pay={(st, el) => payWithWallet(st, el, billing, intent, props.afterOrder)}
            onReady={setHasWallet}
            onError={setError}
          />
        </Elements>
        {hasWallet && (
          <div className={j.orCard}>
            <span>{props.t.orCard}</span>
          </div>
        )}
        <CardFields words={{ number: props.t.cardNumber, expiry: props.t.cardExpiry, cvc: props.t.cardCvc }} look={GEIST} />
      </div>
      <PayBody {...props} onCard={payByCard} cardPaying={paying || !stripe} cardError={error} />
    </>
  );
}

function PayBody({
  lang,
  t,
  currency,
  country,
  info,
  method,
  picked,
  setPicked,
  total,
  offer,
  onCard,
  cardPaying,
  cardOff,
  cardError,
  pay,
  bonusLive,
  bonusOn,
}: PayState & { onCard?: () => void; cardPaying?: boolean; cardOff?: boolean; cardError?: string | null }) {
  const [paypalBusy, setPaypalBusy] = useState(false);
  // The bar at the bottom shows while the real pay button is off screen (11-06: most
  // people who left step 2 did it within 35 s on a phone, the button ~1,050px down).
  const payRef = useRef<HTMLButtonElement>(null);
  const [payInView, setPayInView] = useState(true);
  useEffect(() => {
    const el = payRef.current;
    if (pay !== "b" || !el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setPayInView(e.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [pay]);
  const [paypalError, setPaypalError] = useState<string | null>(null);
  const paypal = method === "paypal";
  const busy = paypal ? paypalBusy : Boolean(cardPaying);
  const blocked = busy || (!paypal && (cardOff || !onCard));
  const error = paypal ? paypalError : cardError;

  async function payWithPayPal() {
    setPaypalBusy(true);
    setPaypalError(null);
    try {
      const res = await fetch("/api/checkout/paypal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          funnel: funnel.slug,
          ...info,
          bumps: picked,
          variant: readVariant() ?? "",
          bonus: bonusLive,
          country: cookieCountry(currency, country),
          origin: window.location.origin,
          lang,
          expected: total,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (json.bonusExpired) endBonus();
      if (!res.ok || !json.approveUrl) throw new Error(json.error ?? t.paypalFailed);
      window.location.assign(json.approveUrl);
    } catch (err) {
      setPaypalError((err as Error).message);
      setPaypalBusy(false);
    }
  }

  const toggle = (id: string, on: boolean) => setPicked(on ? [...picked, id] : picked.filter((x) => x !== id));
  const chosen = offer.bumps.filter((b) => picked.includes(b.id));
  // While the bonus runs, its add-on isn't offered: it's already in the order.
  const offered = bonusLive ? offer.bumps.filter((b) => b.id !== BONUS.item) : offer.bumps;
  const bonusBump = offer.bumps.find((b) => b.id === BONUS.item);
  const w = BONUS_WORDS[lang];

  const cash = (n: number) => fmt(n, currency, lang, !Number.isInteger(n));

  return (
    <>
      {paypal && (
        <div className={j.paypalNote}>
          <PayPalGlyph />
          <span>{t.paypalNote}</span>
        </div>
      )}

      {bonusOn && bonusBump && <BonusItem w={w} image={bonusBump.image} price={bonusBump.price} currency={currency} lang={lang} compact />}
      {offered.map((o) => (
        <BumpBox key={o.id} o={o} on={picked.includes(o.id)} toggle={toggle} t={t} currency={currency} price={cash(o.price)} />
      ))}

      {/* The order's lines, always open, as on the Jazz checkout. */}
      <div className={j.summary}>
        <div className={j.sumRow}>
          <span>{offer.name}</span>
          <span>{cash(offer.price)}</span>
        </div>
        {chosen.map((o) => (
          <div key={o.id} className={j.sumRow}>
            <span>{o.name}</span>
            <span>{cash(o.price)}</span>
          </div>
        ))}
        {bonusLive && bonusBump && (
          <div className={j.sumRow}>
            <span>
              <span className={d.bonusBadge}>{w.badge}</span> {bonusBump.name}
            </span>
            <span>
              <s className={d.was}>{cash(bonusBump.price)}</s> {w.free}
            </span>
          </div>
        )}
        <div className={`${j.sumRow} ${j.sumTotal}`}>
          <span>{t.total}</span>
          <span>{cash(total)}</span>
        </div>
      </div>

      <button ref={payRef} type="button" className={`${k.btn} ${k.full}`} disabled={blocked} onClick={() => (paypal ? payWithPayPal() : onCard?.())}>
        <span className={k.shine} aria-hidden />
        <span className={k.label}>
          <span>{busy && !cardOff ? (paypal ? t.openingPaypal : t.processing) : t.pay}</span>
          {!busy && <Arrow className={k.arrow} />}
        </span>
        <span className={k.inner}>
          {cash(total)} · {t.payInner}
        </span>
      </button>
      {error && (
        <p className={j.error} role="alert">
          {error}
        </p>
      )}
      {/* Always there, slid out of sight while the real button is on screen (./order.module.css .payBarOn). */}
      {pay === "b" && (
        <div className={`${d.payBar} ${payInView ? "" : d.payBarOn}`} aria-hidden={payInView} inert={payInView}>
          <button
            type="button"
            className={`${d.cta} ${d.ctaPay} ${d.payBarBtn}`}
            disabled={blocked}
            onClick={() => {
              // The real button does the paying (card errors show beside it), so bring it on screen too.
              payRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
              payRef.current?.click();
            }}
          >
            {busy && !cardOff ? (
              paypal ? t.openingPaypal : t.processing
            ) : (
              <>
                <svg viewBox="0 0 448 512" className={d.ctaArrow} aria-hidden>
                  <path
                    fill="currentColor"
                    d="M190.5 66.9l22.2-22.2c9.4-9.4 24.6-9.4 33.9 0L441 239c9.4 9.4 9.4 24.6 0 33.9L246.6 467.3c-9.4 9.4-24.6 9.4-33.9 0l-22.2-22.2c-9.5-9.5-9.3-25 .4-34.3L311.4 296H24c-13.3 0-24-10.7-24-24v-32c0-13.3 10.7-24 24-24h287.4L190.9 101.2c-9.8-9.3-10-24.8-.4-34.3z"
                  />
                </svg>
                {/* One line only in the bar ("togli get instant access"): the form's button keeps it. */}
                {t.pay}
              </>
            )}
          </button>
        </div>
      )}
    </>
  );
}

// One tick-box offer, as the Jazz checkout draws it: its picture, the red arrow until ticked, headline and
// price, then its words after the red "ONE-TIME OFFER:".
function BumpBox({
  o,
  on,
  toggle,
  t,
  currency,
  price,
}: {
  o: OrderOffer["bumps"][number];
  on: boolean;
  toggle: (id: string, on: boolean) => void;
  t: Copy["form"];
  currency: Currency;
  price: string;
}) {
  return (
    <label className={j.bump}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={j.bumpPic} src={o.image} alt="" width={84} height={84} loading="lazy" decoding="async" />
      <span className={j.bumpHead}>
        {/* Gone once ticked, as on ClickFunnels. */}
        {!on && <BumpArrow />}
        <input type="checkbox" checked={on} onChange={(e) => toggle(o.id, e.target.checked)} className={j.bumpCheck} />
        <span className={j.bumpTitle}>{o.headline}</span>
        <span className={j.bumpPrice}>{price}</span>
      </span>
      <span className={j.bumpPitch}>
        {o.body.map((p, i) => (
          <span key={i} className={j.bumpPara}>
            {i === 0 && <span className={j.bumpOffer}>{t.oto}</span>} <Rich text={p} currency={currency} />
          </span>
        ))}
      </span>
    </label>
  );
}

// ClickFunnels' red arrow: Font Awesome's long-arrow-alt-right at 16px, wobbling.
function BumpArrow() {
  return (
    <svg viewBox="0 0 448 512" className={j.bumpArrow} aria-hidden>
      <path
        fill="currentColor"
        d="M313.941 216H12c-6.627 0-12 5.373-12 12v56c0 6.627 5.373 12 12 12h301.941v46.059c0 21.382 25.851 32.09 40.971 16.971l86.059-86.059c9.373-9.373 9.373-24.569 0-33.941l-86.059-86.059c-15.119-15.119-40.971-4.411-40.971 16.971V216z"
      />
    </svg>
  );
}

function CardGlyph() {
  return (
    <svg viewBox="0 0 20 16" width="18" height="15" aria-hidden>
      <rect x="1" y="1" width="18" height="14" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="1" y="4.5" width="18" height="3" fill="currentColor" />
      <rect x="4" y="10.5" width="5" height="1.8" rx="0.9" fill="currentColor" />
    </svg>
  );
}

function PayPalGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden className={j.ppGlyph}>
      <path
        fill="#179bd7"
        d="M20.07 7.62c.02-.13.02-.27.02-.4C19.86 4 17.4 3 14.27 3H8.4c-.42 0-.78.3-.85.72L5.12 19.14c-.05.3.18.57.48.57h3.6l-.25 1.57c-.04.26.16.5.43.5h3.04c.37 0 .68-.27.74-.63l.03-.16.59-3.72.04-.2c.06-.37.37-.64.74-.64h.47c3.03 0 5.4-1.23 6.09-4.79.29-1.49.14-2.73-.63-3.6a3 3 0 0 0-.42-.42z"
      />
      <path
        fill="#253b80"
        d="M19.06 7.87c-.1-.06-.21-.11-.33-.15l-.4-.1-.42-.08a10.7 10.7 0 0 0-1.66-.12h-5.03a.8.8 0 0 0-.79.68l-1.07 6.79-.03.2c.07-.45.45-.78.9-.78h1.89c3.7 0 6.6-1.5 7.45-5.86l.07-.37a4.6 4.6 0 0 0-.58-.21zM10.43 7.4a.8.8 0 0 1 .79-.68h5.03c.6 0 1.15.04 1.66.12a7.9 7.9 0 0 1 1.15.28c.25.08.48.18.7.3.25-1.6 0-2.7-.87-3.7C17.94 2.63 16.2 2.1 13.96 2.1H7.48c-.46 0-.85.33-.92.78L3.86 19.98c-.05.34.21.65.55.65h4l1-6.36 1.02-6.87z"
      />
    </svg>
  );
}
