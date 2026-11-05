import { bullets, bumpCopy, compare, faq, letter, orderBullets, reviews } from "./copy";
import { FORM, type FormWords } from "./formWords";

// Every word of TOP HITS' pages, so the dashboard can edit them (funnel map →
// Edit; lib/words.ts reads the edits by path). Marks: **bold**, __underline__,
// ==highlight==, _italic_, {c} = € or $, {price} = the bundle's price; "|"
// breaks a heading's line. ./copy.ts keeps the long lists, as on ClickFunnels.

const isMark = (v: string) => v === "yes" || v === "no" || v === "partial";

export const LANDING = {
  topbar: "BLACK FRIDAY: 90% Sale Ends Soon",
  hero: {
    for: "FOR Ambitious beatmakers, music producers, songwriters, artists...",
    title: "WE COPIED THE|CHORD PROGRESSIONS|OF TOP HITS|SO YOU CAN USE THEM.",
    swear: "We Swear This MIDI Pack Doesn't Contain Anything 'Illegal' Or 'Unethical'",
  },
  bullets: { lead: "**1,000** FAMOUS MIDI CHORD PROGRESSIONS", left: bullets.left, right: bullets.right },
  stock: "Hurry! Stock Of This Bundle {date}Is Low",
  stack: {
    head: "Here's What You Get Today",
    hired: "If you hired a world-class transcription service to rip these chord progressions note-for-note, you'd pay **at least {c}20 per transcription.** That's **{c}20,000 for all 1,000.**",
    now: "Right now, you're getting all of them for just =={c}{price}.==",
    rows: [
      ["1,000 Chord Progressions", "Included"],
      ["Transcribed 1:1 From Top Hits", "496 Artists"],
      ["Pro Transcription Cost ({c}20 each)", "{c}20,000"],
    ],
    total: ["Total Real Value", "{c}20,000"],
    final: "YOUR PRICE TODAY: {c}{price}",
    per: "That's just **{c}0.03 per chord progression**",
    scarcity: "Limited To The First 100 Copies",
  },
  cta: { main: "GET THE PACK!", sub: "90% OFF - Instant Download & Email Link" },
  yes: "YES!! I WANT THE BUNDLE",
  quote: '"THE CLOSEST THING TO SITTING IN THE STUDIO WITH A BILLBOARD SONGWRITER"',
  today: "Today",
  letter,
  sign: "The Grind Studio Team",
  songsTitle: 'LIST OF ALL SONGS|INCLUDED IN|"TOP HITS MIDI BUNDLE"',
  compare: {
    eyebrow: "DO THE MATH",
    title: "WHY THIS BEATS _EVERY ALTERNATIVE_",
    sub: "There are other ways to get hit chord progressions. None of them stack up.",
    columns: compare.columns.map((c) => ({ name: c.name, sub: c.sub })),
    // A ✓, ✗ or − cell isn't words: null here, drawn as the code has it.
    rows: compare.rows.map((r) => ({ label: r.label, values: r.values.map((v) => (isMark(v) ? null : v)) })),
  },
  faq: {
    eyebrow: "FREQUENTLY ASKED",
    title: "GOT _QUESTIONS?_",
    sub: "Everything you need to know before grabbing the pack.",
    items: faq,
  },
};
export type LandingWords = typeof LANDING;
export type FaqWords = LandingWords["faq"];
export type StackWords = LandingWords["stack"];
export type CompareWords = LandingWords["compare"];

export { FORM };
export type { FormWords };

export const ORDER = {
  redbar: "**BLACK FRIDAY:** 90% Sale Is Ending Soon",
  secure: "Secure Checkout",
  summaryTitle: "Order Summary:",
  dl: "Download link will be sent to your email.",
  bullets: orderBullets,
  completeTitle: "Complete Order:",
  reviews: reviews.map((r) => ({ quote: r.quote, name: r.name, role: r.role })),
  guarantee: {
    title: "Quality Guarantee",
    text: "Every pattern in this kit is tested before release. If anything's wrong with your files, email {email} within {days} days and we'll make it right — a fresh download, a replacement, or a refund if we can't fix it.",
  },
  payments: {
    title: "Secure Payments",
    text: "Payments are processed through all major credit cards and PayPal with full 256-bit SSL encryption. No payment details are ever stored.",
  },
  form: FORM,
  // The add-ons' words after "ONE-TIME OFFER:", by add-on (./offer.ts).
  bumps: bumpCopy,
};
export type OrderWords = typeof ORDER;

// The thank-you page (also Famous Beats').
export const THANKS = {
  paid: { title: "You're in!", lead: "Payment received. Your downloads are below. Bookmark this page: the buttons keep working when you come back." },
  pending: { title: "Payment processing…", lead: "Your bank is still confirming the payment. Refresh this page in a minute and your downloads will appear." },
  failed: { title: "Payment not completed", lead: "Nothing was charged. Go back and try again with another card or PayPal." },
  download: "Download {name}",
  receipt: "{provider} has emailed your receipt{to}. A file doesn't open? Email {support} and we fix it.",
  receiptTo: " to {email}",
  account: "Find your downloads anytime at {account}",
  back: "Back to checkout",
};
export type ThanksWords = typeof THANKS;
