import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { BLOCK_SCHEMA_DOC, BLOCK_TYPES, type BlockType } from "@/lib/blocks";
import {
  addBlock,
  deleteBlock,
  getBlock,
  getFunnel,
  listBlocks,
  reorderBlocks,
  updateBlock,
  updateFunnel,
} from "@/lib/store";
import { effectivePrinciples, getWorkspace } from "@/lib/workspace";

export const runtime = "nodejs";

const MAX_ITERATIONS = 12;

const ALLOWED_MODELS = new Set([
  "claude-opus-4-7",
  "claude-sonnet-4-6",
  "claude-haiku-4-5-20251001",
]);
const DEFAULT_MODEL = "claude-opus-4-7";

const SYSTEM_PROMPT_HEADER = `You are Riley, the AI assistant inside funnnnels.com — a landing-page and sales-funnel builder.`;

const SYSTEM_PROMPT_BODY = `You directly edit the user's current funnel page using tools. Whenever the user asks you to change, add, remove, or rewrite something, USE THE TOOLS to make the change. Do not just describe what you would do.

Workflow:
1. Call list_blocks to see what's on the page.
2. Call get_block when you need the full props of a specific block before rewriting.
3. Make changes with add_block / update_block / delete_block / reorder_blocks. update_block is a partial patch — only include props you want to change.
4. When done, briefly tell the user what you changed (1-2 short sentences, no bullets, no headers).

DRAFT STRATEGY — IMPORTANT
When building a NEW funnel from scratch (page is empty), default to custom_html blocks for the visual, brand-led sections: hero, value-prop sections, "how it works", testimonials, image showcases, closing CTA. Each custom_html block is a complete <section> with its own embedded <style> tag — write real CSS (no Tailwind, classes won't be discovered). Design like a senior designer building a $50K landing page: real typography, generous whitespace, micro-interactions, modern CSS (clamp, grid, oklch, gradients, backdrop-filter), responsive @media queries, hover transitions.

Use STRUCTURED blocks only for pricing, forms, and FAQ — those are easier to edit field-by-field later. Or when the user explicitly asks for granular editing of a section.

Each custom_html block must be self-contained — scope CSS via a unique class on the root (e.g. \`.fb-h-a3b2\`). Never use generic global selectors like \`h1\` or \`section\` that could leak. Aim for 8-14 distinct CSS rules per section.

EDITING STRATEGY
- Small copy / color / spacing tweak on a custom_html block: use update_block with the full new html string. Preserve the existing root scope class so other parts of the page don't shift.
- User asks for a STRUCTURAL change to a custom_html block (e.g. "add a third tier", "let me edit each FAQ", "make this a form I can edit field-by-field"): first decide if conversion helps. If yes, get_block to read the custom HTML, then add the equivalent structured block(s) at the same position (use get the position via list_blocks), then delete_block on the original. Preserve the user-visible copy verbatim during conversion.
- If the user clicks "Make editable" (you'll receive a prompt like 'Convert custom_html block X into structured blocks'), do exactly that: read, convert, replace. Try to map sections cleanly — a hero custom block becomes a hero structured block, a pricing custom block becomes a pricing structured block. Don't invent new content.
- After a custom_html block is created, NEVER duplicate the same content as a separate structured block — pick one representation per page section.

${BLOCK_SCHEMA_DOC}

Quality bar — this is what separates a bad page from a great one. Internalize this:

HERO
- Headline: 4-9 words, one clear benefit, no buzzwords ("revolutionary", "game-changing", "next-gen", "world-class"). Specific > clever.
  - Bad: "Introducing the UltraBeat MIDI Drum Kit" (just names the product)
  - Good: "Drum like a pro, from your laptop"
- Eyebrow: optional, 1-3 words, sets category. Skip emojis unless the brand is playful.
- Subhead: one sentence, what it does + who it's for. No feature dumps.
- CTAs: action verbs ("Start free trial", "Get the kit", "Book a demo"). Never "Click here", "Learn more", "Shop Now" alone.

SOCIAL PROOF
- Use real-sounding specific quotes with concrete outcomes ("cut our onboarding time in half", "1,200 signups in week one"). Never generic praise like "amazing product".
- Attribution: name + role + company. No "Jordan M. — Studio Producer".

FORM
- 1-3 fields max for top-of-funnel. Email-only is often best.
- Button label is a promise ("Send me the guide"), not "Submit".

PRICING
- 3 tiers, middle one marked recommended. Prices end in 9 or are round (29, 49, 99). Include one differentiating feature per tier — don't repeat features.

FAQ
- 4-6 questions max. Answer the objection, not the question. Address pricing, refunds, who it's for, what's included.

CTA
- Restate the benefit, not the product. "Ready to ship faster?" beats "Ready to try our tool?"

GENERAL
- Match the tone the user asks for (playful, confident, technical, luxe, etc.). When unsure, default to confident and specific.
- Write FOR the target customer, not ABOUT the product. "You" beats "we".
- Build a full page (hero + social_proof + 1-2 value/text blocks + pricing or form + faq + cta) unless the user asks for something specific.
- Don't use markdown headers in your replies. Use **bold** for key terms. Keep replies under 3 short paragraphs.`;

function buildSystemPrompt(principles: string): string {
  return `${SYSTEM_PROMPT_HEADER}

═══════════════════════════════════════════════════════════════════
FUNNEL FIRST PRINCIPLES — ALWAYS APPLY. This is the difference between
what you build and a generic website. These are workspace-editable; the
user has chosen this exact set.
═══════════════════════════════════════════════════════════════════
${principles}
═══════════════════════════════════════════════════════════════════

${SYSTEM_PROMPT_BODY}`;
}

type ChatMessage = { role: "user" | "assistant"; content: string };

type Op = {
  tool: string;
  ok: boolean;
  summary: string;
};

const tools: Anthropic.Tool[] = [
  {
    name: "list_blocks",
    description:
      "List all blocks on the current funnel page in order. Returns id and type for each.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get_block",
    description:
      "Get full props for one block. Call this before editing if you don't already know the props.",
    input_schema: {
      type: "object",
      properties: { block_id: { type: "string" } },
      required: ["block_id"],
    },
  },
  {
    name: "add_block",
    description:
      "Insert a new block on the page. Position defaults to end. See system prompt for prop schemas per block type.",
    input_schema: {
      type: "object",
      properties: {
        type: { type: "string", enum: [...BLOCK_TYPES] },
        props: {
          type: "object",
          description:
            "Props for the block, matching the schema for that block type. Unspecified props will use sensible defaults.",
        },
        position: {
          type: "integer",
          description: "0-indexed insert position. Omit to append at end.",
        },
      },
      required: ["type", "props"],
    },
  },
  {
    name: "update_block",
    description:
      "Update specific props of a block. Provide ONLY the props you want to change — others are preserved (partial patch).",
    input_schema: {
      type: "object",
      properties: {
        block_id: { type: "string" },
        props: { type: "object" },
      },
      required: ["block_id", "props"],
    },
  },
  {
    name: "delete_block",
    description: "Delete a block by id.",
    input_schema: {
      type: "object",
      properties: { block_id: { type: "string" } },
      required: ["block_id"],
    },
  },
  {
    name: "reorder_blocks",
    description:
      "Reorder all blocks on the page. Provide the full ordered list of block ids. Any block id you omit is moved to the end.",
    input_schema: {
      type: "object",
      properties: {
        ordered_ids: { type: "array", items: { type: "string" } },
      },
      required: ["ordered_ids"],
    },
  },
  {
    name: "rename_funnel",
    description:
      "Rename the funnel itself (not a block). Use only when the user explicitly asks to rename.",
    input_schema: {
      type: "object",
      properties: { name: { type: "string" } },
      required: ["name"],
    },
  },
];

async function executeTool(
  funnelId: string,
  name: string,
  input: Record<string, unknown>,
): Promise<{ payload: unknown; op: Op }> {
  try {
    switch (name) {
      case "list_blocks": {
        const blocks = await listBlocks(funnelId);
        if (!blocks) {
          return {
            payload: { error: "funnel not found" },
            op: { tool: name, ok: false, summary: "Funnel not found" },
          };
        }
        return {
          payload: { blocks },
          op: {
            tool: name,
            ok: true,
            summary: `Listed ${blocks.length} block${blocks.length === 1 ? "" : "s"}`,
          },
        };
      }
      case "get_block": {
        const block = await getBlock(funnelId, String(input.block_id));
        if (!block) {
          return {
            payload: { error: "block not found" },
            op: { tool: name, ok: false, summary: "Block not found" },
          };
        }
        return {
          payload: { block },
          op: { tool: name, ok: true, summary: `Read ${block.type} block` },
        };
      }
      case "add_block": {
        const type = String(input.type) as BlockType;
        if (!BLOCK_TYPES.includes(type)) {
          return {
            payload: { error: `unknown block type: ${type}` },
            op: { tool: name, ok: false, summary: `Unknown block type: ${type}` },
          };
        }
        const props = (input.props ?? {}) as Record<string, unknown>;
        const position =
          typeof input.position === "number" ? input.position : undefined;
        const block = await addBlock(funnelId, type, props, position);
        if (!block) {
          return {
            payload: { error: "could not add block" },
            op: { tool: name, ok: false, summary: "Could not add block" },
          };
        }
        return {
          payload: { block },
          op: { tool: name, ok: true, summary: `Added ${type} block` },
        };
      }
      case "update_block": {
        const props = (input.props ?? {}) as Record<string, unknown>;
        const block = await updateBlock(
          funnelId,
          String(input.block_id),
          props,
        );
        if (!block) {
          return {
            payload: { error: "block not found" },
            op: { tool: name, ok: false, summary: "Block not found" },
          };
        }
        return {
          payload: { block },
          op: { tool: name, ok: true, summary: `Updated ${block.type} block` },
        };
      }
      case "delete_block": {
        const ok = await deleteBlock(funnelId, String(input.block_id));
        return {
          payload: { ok },
          op: {
            tool: name,
            ok,
            summary: ok ? "Deleted block" : "Block not found",
          },
        };
      }
      case "reorder_blocks": {
        const orderedIds = Array.isArray(input.ordered_ids)
          ? (input.ordered_ids as string[])
          : [];
        const ok = await reorderBlocks(funnelId, orderedIds);
        return {
          payload: { ok },
          op: {
            tool: name,
            ok,
            summary: ok ? "Reordered blocks" : "Reorder failed",
          },
        };
      }
      case "rename_funnel": {
        const next = await updateFunnel(funnelId, {
          name: String(input.name),
        });
        if (!next) {
          return {
            payload: { error: "funnel not found" },
            op: { tool: name, ok: false, summary: "Funnel not found" },
          };
        }
        return {
          payload: { funnel: { id: next.id, name: next.name } },
          op: {
            tool: name,
            ok: true,
            summary: `Renamed funnel to "${next.name}"`,
          },
        };
      }
      default:
        return {
          payload: { error: `unknown tool: ${name}` },
          op: { tool: name, ok: false, summary: `Unknown tool: ${name}` },
        };
    }
  } catch (e) {
    return {
      payload: {
        error: e instanceof Error ? e.message : String(e),
      },
      op: {
        tool: name,
        ok: false,
        summary: e instanceof Error ? e.message : "Tool error",
      },
    };
  }
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "ANTHROPIC_API_KEY is not set. Add it to .env.local to enable Riley.",
      },
      { status: 500 },
    );
  }

  let history: ChatMessage[];
  let funnelId: string | null = null;
  let model: string = DEFAULT_MODEL;
  try {
    const body = await req.json();
    history = body.messages;
    funnelId = body.funnelId ?? null;
    if (typeof body.model === "string" && ALLOWED_MODELS.has(body.model)) {
      model = body.model;
    }
    if (!Array.isArray(history) || history.length === 0) {
      return NextResponse.json(
        { error: "messages must be a non-empty array" },
        { status: 400 },
      );
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Context block — tells Riley which funnel they're editing.
  let contextNote = "";
  if (funnelId) {
    const f = await getFunnel(funnelId);
    if (f) {
      const page = f.pages[0];
      const summary = page
        ? page.blocks.map((b) => `${b.id}:${b.type}`).join(", ") || "(empty page)"
        : "(no page)";
      contextNote = `\n\nCurrent funnel: "${f.name}" (id: ${f.id}, status: ${f.status}). Page blocks (id:type): ${summary}.`;
    }
  } else {
    contextNote =
      "\n\nNo specific funnel is open. The user is on the dashboard. If they ask you to edit something, ask which funnel — or have them open one first.";
  }

  const workspace = await getWorkspace();
  const systemPrompt = buildSystemPrompt(effectivePrinciples(workspace));

  const client = new Anthropic({ apiKey });
  const messages: Anthropic.MessageParam[] = history.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const ops: Op[] = [];
  let finalText = "";

  try {
    for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
      const response = await client.messages.create({
        model,
        max_tokens: 16384,
        system: [
          {
            type: "text",
            text: systemPrompt,
            cache_control: { type: "ephemeral" },
          },
          { type: "text", text: contextNote },
        ],
        tools: funnelId ? tools : [],
        messages,
      });

      const toolUses = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
      );

      if (response.stop_reason === "tool_use" && toolUses.length > 0 && funnelId) {
        messages.push({ role: "assistant", content: response.content });

        const toolResults: Anthropic.ToolResultBlockParam[] = [];
        for (const tu of toolUses) {
          const { payload, op } = await executeTool(
            funnelId,
            tu.name,
            (tu.input ?? {}) as Record<string, unknown>,
          );
          ops.push(op);
          toolResults.push({
            type: "tool_result",
            tool_use_id: tu.id,
            content: JSON.stringify(payload),
            is_error: !op.ok,
          });
        }

        messages.push({ role: "user", content: toolResults });
        continue;
      }

      finalText = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      break;
    }

    return NextResponse.json({
      reply: finalText,
      operations: ops,
      mutated: ops.some(
        (o) =>
          o.ok &&
          [
            "add_block",
            "update_block",
            "delete_block",
            "reorder_blocks",
            "rename_funnel",
          ].includes(o.tool),
      ),
    });
  } catch (error) {
    console.error("[chat] request failed:", error);
    const toStr = (v: unknown): string => {
      if (typeof v === "string") return v;
      if (v && typeof v === "object" && "message" in v) {
        const m = (v as { message: unknown }).message;
        if (typeof m === "string") return m;
        try {
          return JSON.stringify(m);
        } catch {
          return String(m);
        }
      }
      try {
        return JSON.stringify(v);
      } catch {
        return String(v);
      }
    };
    if (error instanceof Anthropic.APIError) {
      const msg = toStr(error.message) || `Anthropic API error (${error.status ?? "unknown"})`;
      return NextResponse.json(
        { error: msg, operations: ops },
        { status: error.status ?? 500 },
      );
    }
    const msg = error instanceof Error ? toStr(error.message) : toStr(error);
    return NextResponse.json(
      { error: msg || "Unknown error", operations: ops },
      { status: 500 },
    );
  }
}
