import { Fragment } from "react";
import s from "./landing.module.css";

// The words' marks: **bold**, ==highlight== (the yellow), "|" = a line break.
export function Rich({ text }: { text: string }) {
  const lines = text.split("|");
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          <Inline text={line} />
        </Fragment>
      ))}
    </>
  );
}

function Inline({ text }: { text: string }) {
  // A highlight left open runs to the end of its line ("That ==drunk feeling.").
  const parts = text.split(/(\*\*[^*]+\*\*|==[^=]+(?:==|$))/g).filter(Boolean);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") ? (
          <b key={i}>{p.slice(2, -2)}</b>
        ) : p.startsWith("==") ? (
          <span key={i} className={s.hl}>
            {p.replace(/^==|==$/g, "")}
          </span>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}
