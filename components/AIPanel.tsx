"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { I } from "@/components/icons";
import { SUGGESTED } from "@/lib/data";

type Op = { tool: string; ok: boolean; summary: string };

type Message = {
  id: string;
  role: "user" | "ai";
  content: string;
  thinking?: boolean;
  ops?: Op[];
  chips?: string[];
};

function renderMarkdown(text: string): ReactNode {
  const parts: ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < text.length) {
    const bStart = text.indexOf("**", i);
    const cStart = text.indexOf("`", i);
    const positions = [bStart, cStart].filter((n) => n !== -1).sort((a, b) => a - b);
    const next = positions[0];
    if (next === undefined) {
      parts.push(text.slice(i));
      break;
    }
    if (next > i) parts.push(text.slice(i, next));
    if (next === bStart) {
      const end = text.indexOf("**", bStart + 2);
      if (end === -1) {
        parts.push(text.slice(i));
        break;
      }
      parts.push(<strong key={key++}>{text.slice(bStart + 2, end)}</strong>);
      i = end + 2;
    } else {
      const end = text.indexOf("`", cStart + 1);
      if (end === -1) {
        parts.push(text.slice(i));
        break;
      }
      parts.push(<code key={key++}>{text.slice(cStart + 1, end)}</code>);
      i = end + 1;
    }
  }
  return <>{parts}</>;
}

const TOOL_LABELS: Record<string, string> = {
  list_blocks: "Read page",
  get_block: "Read block",
  add_block: "Add block",
  update_block: "Update block",
  delete_block: "Delete block",
  reorder_blocks: "Reorder blocks",
  rename_funnel: "Rename funnel",
};

function OpList({ ops }: { ops: Op[] }) {
  return (
    <div className="tool">
      <div className="tool-head">
        <span className="pip" />
        <span>
          <b>Tools used</b>
        </span>
        <span style={{ marginLeft: "auto", color: "var(--fg-3)" }}>
          {ops.length} call{ops.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="tool-body">
        <ul className="tool-steps">
          {ops.map((o, i) => (
            <li key={i} className={o.ok ? "" : "pending"}>
              <span className="check">
                {o.ok ? (
                  <I.check size={10} />
                ) : (
                  <I.close size={10} />
                )}
              </span>
              <span>
                <span style={{ color: "var(--accent-2)" }}>
                  {TOOL_LABELS[o.tool] ?? o.tool}
                </span>
                <span style={{ color: "var(--fg-3)" }}> · {o.summary}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ChatMessage({
  m,
  onChip,
}: {
  m: Message;
  onChip: (c: string) => void;
}) {
  if (m.role === "user") {
    return (
      <div className="msg user">
        <div className="bubble">{m.content}</div>
        <div className="av">
          <I.person size={13} />
        </div>
      </div>
    );
  }
  return (
    <div className="msg ai">
      <div className="av">
        <I.sparkles size={12} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="who">Riley · funnnnels AI</div>
        <div className="bubble">
          {m.thinking ? (
            <div className="typing">
              <span />
              <span />
              <span />
            </div>
          ) : (
            renderMarkdown(m.content || "")
          )}
          {m.ops && m.ops.length > 0 && <OpList ops={m.ops} />}
          {m.chips && m.chips.length > 0 && (
            <div className="chips">
              {m.chips.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  className="chip"
                  onClick={() => onChip(c)}
                >
                  <span className="pl">+</span>
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const DASHBOARD_INTRO =
  "Hey — I'm **Riley**. Tell me what you want to build and I'll spin up a funnel for you. Or open one you've already started and I'll edit it directly.";

function editorIntro(name: string) {
  return `Editing **${name}**. Ask me to rewrite the hero, add a pricing section, swap the form for a calendar booking, change the tone — I'll edit the page directly. Try \`list the blocks\` to see what's on it.`;
}

function defaultChips(funnelOpen: boolean) {
  return funnelOpen
    ? [
        "Rewrite the hero",
        "Add a 3-tier pricing section",
        "Make the CTA more urgent",
      ]
    : [
        "Build a SaaS landing page",
        "Build a webinar registration funnel",
        "Build a lead-magnet opt-in",
      ];
}

type Props = {
  funnelId?: string | null;
  funnelName?: string;
  pendingPrompt: string | null;
  onPromptConsumed: () => void;
  onMutate?: () => void | Promise<void>;
};

export function AIPanel({
  funnelId = null,
  funnelName,
  pendingPrompt,
  onPromptConsumed,
  onMutate,
}: Props) {
  const initialId = useId();
  const initial: Message = {
    id: initialId,
    role: "ai",
    content: funnelId && funnelName ? editorIntro(funnelName) : DASHBOARD_INTRO,
    chips: defaultChips(!!funnelId),
  };
  const [messages, setMessages] = useState<Message[]>([initial]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [contextOn, setContextOn] = useState(true);
  const [model, setModel] = useState<string>("claude-opus-4-7");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const msgCounter = useRef(0);

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages]);

  const mkId = () => {
    msgCounter.current += 1;
    return `m-${msgCounter.current}`;
  };

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text || sending) return;
      const userMsg: Message = { id: mkId(), role: "user", content: text };
      const placeholderId = mkId();
      const placeholder: Message = {
        id: placeholderId,
        role: "ai",
        content: "",
        thinking: true,
      };

      const priorHistory = messages
        .filter((m) => m.content)
        .map((m) => ({
          role: m.role === "ai" ? ("assistant" as const) : ("user" as const),
          content: m.content,
        }));

      setMessages((prev) => [...prev, userMsg, placeholder]);
      setInput("");
      setSending(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            funnelId,
            model,
            messages: [...priorHistory, { role: "user", content: text }],
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `Request failed (${res.status})`);
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === placeholderId
              ? {
                  ...m,
                  thinking: false,
                  content: data.reply ?? "",
                  ops: (data.operations ?? []) as Op[],
                }
              : m,
          ),
        );

        if (data.mutated && onMutate) {
          await onMutate();
        }
      } catch (err) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === placeholderId
              ? {
                  ...m,
                  thinking: false,
                  content:
                    err instanceof Error
                      ? `Hmm — ${err.message}. Check your \`ANTHROPIC_API_KEY\` and try again.`
                      : "Hmm — couldn't reach the model just now.",
                }
              : m,
          ),
        );
      } finally {
        setSending(false);
      }
    },
    [messages, sending, funnelId, model, onMutate],
  );

  useEffect(() => {
    if (pendingPrompt) {
      sendMessage(pendingPrompt);
      onPromptConsumed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPrompt]);

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input.trim());
    }
  };

  const resetChat = () => {
    setMessages([{ ...initial, id: mkId() }]);
  };

  const contextLabel = funnelName ?? "No funnel open";

  return (
    <aside className="ai-pane">
      <header className="ai-top">
        <div className="title">
          <span className="orb" />
          Riley
        </div>
        <select
          className="model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          title="Model"
        >
          <option value="claude-opus-4-7">Opus 4.7 · best</option>
          <option value="claude-sonnet-4-6">Sonnet 4.6 · fast</option>
          <option value="claude-haiku-4-5-20251001">Haiku 4.5 · cheap</option>
        </select>
        <div className="actions">
          <button
            type="button"
            className="tiny-btn"
            title="New chat"
            onClick={resetChat}
          >
            <I.refresh size={13} />
          </button>
        </div>
      </header>

      <section className="ai">
        <div className="chat" ref={scrollerRef}>
          {messages.map((m) => (
            <ChatMessage key={m.id} m={m} onChip={(c) => sendMessage(c)} />
          ))}
        </div>

        <div className="composer">
          {messages.length <= 1 && (
            <div className="composer-suggested">
              {SUGGESTED.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  className="chip"
                  onClick={() => sendMessage(s)}
                >
                  <span className="pl">›</span>
                  {s}
                </button>
              ))}
            </div>
          )}
          <div className="composer-box">
            <textarea
              placeholder={
                funnelId
                  ? `Ask Riley to edit ${funnelName ?? "this funnel"}…`
                  : "Ask Riley to build, edit, or analyze a funnel…"
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
            />
            <div className="composer-controls">
              <button
                type="button"
                className={`ck ${contextOn ? "on" : ""}`}
                onClick={() => setContextOn((v) => !v)}
                title="Current context"
              >
                <I.layers size={11} /> {contextLabel}
              </button>
              <button
                type="button"
                className="send"
                onClick={() => sendMessage(input.trim())}
                disabled={!input.trim() || sending}
              >
                <I.send size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>
    </aside>
  );
}
