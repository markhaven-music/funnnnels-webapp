// Grind Studio · bottoni in vetro in rilievo (the brand kit's buttons).
// Style: styles/glass-buttons.css. Font: Inter Tight (app/shop/fonts.ts, set
// on the store's <main> as --font-inter-tight).
// A link by default; with onClick (and no href) a <button>, for "Add to cart".
import type { ReactNode } from "react";
import "@/styles/glass-buttons.css";

type Variant = "clear" | "glass" | "dark" | "solid";
type Size = "xl" | "lg" | "md" | "sm";

type Props = {
  href?: string;
  onClick?: () => void;
  variant?: Variant;
  size?: Size;
  /** testo principale, es. "Get the kit" */
  label: ReactNode;
  /** seconda riga sotto il testo, es. "MIDI Drum Kit · €27" (solo size="xl") */
  sub?: ReactNode;
  /** prezzo nel chip a destra, es. "€27" (variant="glass") */
  price?: string;
  /** icona a sinistra, es. il carrello (variant="dark") */
  icon?: ReactNode;
  className?: string;
  /** marks the page's main CTA (data-cta), as the funnels' buttons */
  cta?: boolean;
};

export function GlassButton({ href, onClick, variant = "clear", size = "xl", label, sub, price, icon, className = "", cta = false }: Props) {
  const cls = `gs-btn gs-btn--${variant} gs-btn--${size} ${className}`.trim();
  const inner = (
    <>
      {icon}
      <span className="gs-btn__label">{label}</span>
      {sub && <span className="gs-btn__sub">{sub}</span>}
      {price && <span className="gs-btn__price">{price}</span>}
    </>
  );
  if (!href) {
    return (
      <button type="button" className={cls} onClick={onClick} {...(cta ? { "data-cta": "" } : {})}>
        {inner}
      </button>
    );
  }
  return (
    <a href={href} className={cls} {...(cta ? { "data-cta": "" } : {})}>
      {inner}
    </a>
  );
}

export function CartIcon() {
  return (
    <svg className="gs-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" aria-hidden="true">
      <path d="M5 8h14l-1.2 12H6.2L5 8z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}
