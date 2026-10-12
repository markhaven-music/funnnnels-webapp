import b from "./btn.module.css";

// The one call to action. Same label everywhere; scrolls to the checkout.
// `data-cta` is what Tracking listens to for LandingCTAClick.
export function Cta({
  label = "Get the pack",
  inner,
  note,
  className,
}: {
  label?: string;
  inner?: string;
  note?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <a href="#buy" className={b.btn} data-cta>
        <span className={b.shine} aria-hidden />
        <span className={b.label}>
          <span>{label}</span>
          <Arrow className={b.arrow} />
        </span>
        {inner && <span className={b.inner}>{inner}</span>}
      </a>
      {note && <p className={b.note}>{note}</p>}
    </div>
  );
}

export function Arrow({ className }: { className?: string }) {
  return (
    <svg className={className} aria-hidden width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path
        d="M13 5l7 7-7 7M4 12h16"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
