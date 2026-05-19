# funnnnels.com

An AI-first, dark-themed ClickFunnels alternative. Riley — the AI panel — actually edits your funnel pages via tool use, the same way Claude Code edits files.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind v4 (reset only; dashboard is hand-rolled CSS in [globals.css](app/globals.css))
- `@anthropic-ai/sdk` running a server-side tool-use loop on `claude-sonnet-4-6`
- Geist + Geist Mono via `next/font/google`
- File-backed funnel store at `.data/funnels.json` (gitignored; seeded on first run)

## Setup

```bash
cp .env.local.example .env.local
# add your ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:3000.

## Routes

| Path | What it is |
| --- | --- |
| `/` | Dashboard — sidebar, stats, funnel grid, Riley panel |
| `/funnels/new` | Server action: creates a fresh funnel and redirects to its editor |
| `/funnels/[id]/edit` | Editor — canvas + Riley panel side by side |
| `/api/chat` | POST `{ funnelId, messages }` → `{ reply, operations, mutated }` |
| `/api/funnels` | POST → create a new funnel |
| `/api/funnels/[id]` | GET → the funnel's current state |

## How Riley edits pages

The `/api/chat` route runs a real tool-use loop. Riley has these tools:

| Tool | What it does |
| --- | --- |
| `list_blocks` | Read the page outline (id + type per block) |
| `get_block` | Read full props for one block before editing |
| `add_block` | Insert a new block (`hero`, `text`, `cta`, `image`, `social_proof`, `form`, `pricing`, `faq`) |
| `update_block` | Partial patch on a block's props |
| `delete_block` | Remove a block |
| `reorder_blocks` | Rearrange the page |
| `rename_funnel` | Rename the funnel itself |

The system prompt documents the schema for every block type. Loop caps at 8 iterations and the API persists changes to `.data/funnels.json` after each tool call. The client refetches the funnel when the response reports `mutated: true`, and new/edited blocks flash on the canvas.

### Try it

Open an existing funnel (e.g. http://localhost:3000/funnels/f1/edit) and ask Riley:

- "Rewrite the hero for designers, more confident tone"
- "Add a 3-tier pricing section after the social proof"
- "Make the form ask for company name and team size"
- "Delete the social proof block"
- "Reorder so the form is at the top"

Each turn shows a **Tools used** card in the chat with the operations Riley ran. The canvas updates immediately afterward.

## Block schema

See [`lib/blocks.ts`](lib/blocks.ts). Each block has `{ id, type, props }`; props per type are documented in `BLOCK_SCHEMA_DOC` (which is also injected into Riley's system prompt so it knows what shape to send).

## Where to extend

- **Drag/drop reordering** — Riley can reorder via tool, but a manual UI affordance is still TODO. The block boundaries already light up on hover.
- **Property panels** — clicking a block doesn't open an editor yet. Today you ask Riley to change it.
- **Multi-page funnels** — `StoredFunnel.pages` is already an array; the UI assumes one page.
- **Auth / multi-tenant** — single shared store; add NextAuth or Clerk before opening up.
- **Real publishing** — the publish button is wired to nothing. Build a publish step that renders a static page from the block tree.
