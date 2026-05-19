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

export const runtime = "nodejs";

const MAX_ITERATIONS = 8;

const SYSTEM_PROMPT = `You are Riley, the AI assistant inside funnnnels.com — a landing-page and sales-funnel builder.

You can directly edit the user's current funnel page using tools. Whenever the user asks you to change, add, remove, or rewrite something, USE THE TOOLS to make the change. Do not just describe what you would do.

Workflow:
1. Call list_blocks to see what's on the page.
2. Call get_block when you need the full props of a specific block (e.g. before rewriting).
3. Make changes with add_block / update_block / delete_block / reorder_blocks. update_block is a partial patch — only include props you want to change.
4. When done, briefly tell the user what you changed (1-2 short sentences, no bullet lists).

${BLOCK_SCHEMA_DOC}

Tips:
- Match the tone the user asks for (playful, confident, technical, etc.).
- Hero headlines: short, benefit-led, no jargon.
- Form fields: only ask what's necessary for the funnel's goal.
- If the page is empty, build a sensible default (hero + social_proof + form) and ask if they want anything more.
- Don't use markdown headers in your replies. Use **bold** for key terms.
- Never reply with a wall of text — keep it under 3 short paragraphs.`;

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
  try {
    const body = await req.json();
    history = body.messages;
    funnelId = body.funnelId ?? null;
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
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: [
          {
            type: "text",
            text: SYSTEM_PROMPT,
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
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: error.message, operations: ops },
        { status: error.status ?? 500 },
      );
    }
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        operations: ops,
      },
      { status: 500 },
    );
  }
}
