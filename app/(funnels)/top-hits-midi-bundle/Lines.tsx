import { Fragment, type ReactNode } from "react";

// Small renderers for the words in ./words.ts beside ./Rich.tsx.

/** A heading's lines: "|" breaks the line. */
export function Lines({ text }: { text: string }): ReactNode {
  return text.split("|").map((part, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {part}
    </Fragment>
  ));
}

/** **words** as <b> (where the page's styles bold a b, not a strong). */
export function B({ text }: { text: string }): ReactNode {
  return text.split(/\*\*(.+?)\*\*/).map((part, i) => (i % 2 ? <b key={i}>{part}</b> : <Fragment key={i}>{part}</Fragment>));
}

/** The text with each {name} replaced by a node (a link, a bold name); other text as it is. */
export function Slots({ text, slots }: { text: string; slots: Record<string, ReactNode> }): ReactNode {
  return text.split(/\{(\w+)\}/).map((part, i) => <Fragment key={i}>{i % 2 ? (slots[part] ?? `{${part}}`) : part}</Fragment>);
}
