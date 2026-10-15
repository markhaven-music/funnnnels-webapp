# funnnnels.com

A dark-themed ClickFunnels alternative: landing pages, a two-step checkout (Stripe + PayPal), contacts. Pages are
edited by hand in the editor (click any text, add / delete / drag sections), or as code with Claude Code.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind v4 (reset only; dashboard is hand-rolled CSS in [globals.css](app/globals.css))
- Supabase (server-side, service-role key) for funnels, contacts and workspace settings
- Geist + Geist Mono via `next/font/google`

## Setup

```bash
cp .env.local.example .env.local
npm run dev
```

Open http://localhost:3000.

## Routes

| Path | What it is |
| --- | --- |
| `/` | Dashboard — sidebar, stats, funnel grid |
| `/funnels/new` | Name a funnel; creates it with a starter page and opens the editor |
| `/funnels/[id]/edit` | Editor — the page as boxes: edit text in place, add / delete / drag sections, Undo, Publish |
| `/api/funnels` | POST → create a new funnel |
| `/api/funnels/[id]` | GET → the funnel's current state |
| `/api/funnels/[id]/blocks` | POST `{ type }` → add a section with its default content |
| `/api/funnels/[id]/blocks/[blockId]` | PATCH `{ props }` → edit · DELETE → remove |

## Block schema

See [`lib/blocks.ts`](lib/blocks.ts). Each block has `{ id, type, props }`. Code funnels (the Jazz page) use their
own section types instead (`app/(funnels)/jazz-midi-pack/content.ts`); [`lib/addable.ts`](lib/addable.ts) decides
which ones the editor's "Add section" bar offers.

## Where to extend

- **Multi-page funnels** — `StoredFunnel.pages` is already an array; the UI assumes one page.
- **Auth / multi-tenant** — single shared store behind `ADMIN_PASSWORD`; add real auth before opening up.

## Code funnels (built with Claude Code)

Funnels can also live as code, one folder per funnel under `app/(funnels)/`:

| File | What it holds |
| --- | --- |
| `funnel.ts` | product, prices (`eur` / `usd`), opt-in source + tags, checkout switch |
| `page.tsx` + `*.module.css` | the landing page |
| `public/funnels/<slug>/` | audio previews, free sample zip |

- **Price by country:** `lib/geo.ts` reads Vercel's `x-vercel-ip-country`; Europe sees euros, everyone else dollars. Preview locally with `?country=IT` / `?country=US`.
- **Opt-in:** forms POST to `/api/optin` with the funnel slug; tags are chosen server-side and the same email is merged, never duplicated.
- **Password:** `proxy.ts` locks everything except funnel pages, `/p/*`, funnel assets and `/api/optin` behind `ADMIN_PASSWORD`.
- **Checkout:** a two-step order form modeled on the ClickFunnels one (`CheckoutWidget.tsx`): step 1 name + email (saved in the background as `checkout-started`), step 2 the product box, Card | PayPal tabs (card: Stripe Payment Element; PayPal: our own account, `/api/checkout/paypal` → PayPal → `/api/checkout/paypal/return`), the yellow order bump (`funnel.bump`), summary, one button, and for EU buyers a withdrawal-waiver notice under it. Both routes price the order server-side. Needs `STRIPE_SECRET_KEY` + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`; without them the widget shows "payments switch on once the Stripe keys are added".
- **Previews:** `python3 tools/render_previews.py` renders MP3s + piano-roll JSON from the pack's MIDI. Drop real bounces over the MP3s with the same names.
