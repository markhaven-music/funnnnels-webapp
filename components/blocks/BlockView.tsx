import type {
  Block,
  CtaProps,
  FaqProps,
  FormProps,
  HeroProps,
  ImageProps,
  PricingProps,
  SocialProofProps,
  TextProps,
} from "@/lib/blocks";

function Hero({ p }: { p: HeroProps }) {
  const align = p.align ?? "center";
  return (
    <div
      className={`fb-hero ${align === "left" ? "fb-hero--left" : ""}`}
      data-block="hero"
    >
      {p.eyebrow && <div className="fb-hero__eyebrow">{p.eyebrow}</div>}
      <h1 className="fb-hero__headline">{p.headline}</h1>
      {p.subhead && <p className="fb-hero__sub">{p.subhead}</p>}
      <div className="fb-hero__ctas">
        {p.primary_cta && (
          <button className="fb-btn fb-btn--primary">{p.primary_cta}</button>
        )}
        {p.secondary_cta && (
          <button className="fb-btn fb-btn--ghost">{p.secondary_cta}</button>
        )}
      </div>
    </div>
  );
}

function Text({ p }: { p: TextProps }) {
  return (
    <div className="fb-text" data-block="text">
      {p.heading && <h2 className="fb-h2">{p.heading}</h2>}
      <p className="fb-body">{p.body}</p>
    </div>
  );
}

function Cta({ p }: { p: CtaProps }) {
  return (
    <div className="fb-cta" data-block="cta">
      {p.headline && <h2 className="fb-h2">{p.headline}</h2>}
      {p.subhead && <p className="fb-body">{p.subhead}</p>}
      <button
        className={`fb-btn ${p.variant === "secondary" ? "fb-btn--ghost" : "fb-btn--primary"}`}
      >
        {p.button_label}
      </button>
    </div>
  );
}

function Image({ p }: { p: ImageProps }) {
  const [c1, c2] = p.palette ?? [
    "oklch(0.74 0.19 295)",
    "oklch(0.55 0.18 280)",
  ];
  return (
    <div className="fb-image" data-block="image">
      <div
        className="fb-image__placeholder"
        style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
        aria-label={p.alt ?? "Image placeholder"}
      />
      {p.caption && <div className="fb-image__caption">{p.caption}</div>}
    </div>
  );
}

function SocialProof({ p }: { p: SocialProofProps }) {
  return (
    <div className="fb-social" data-block="social_proof">
      {p.heading && <div className="fb-social__heading">{p.heading}</div>}
      {p.logos && p.logos.length > 0 && (
        <div className="fb-social__logos">
          {p.logos.map((l) => (
            <span key={l} className="fb-social__logo">
              {l}
            </span>
          ))}
        </div>
      )}
      {p.quote && (
        <blockquote className="fb-social__quote">
          “{p.quote}”
          {p.attribution && (
            <cite className="fb-social__attr">— {p.attribution}</cite>
          )}
        </blockquote>
      )}
    </div>
  );
}

function FormBlock({ p }: { p: FormProps }) {
  return (
    <form
      className="fb-form"
      data-block="form"
      onSubmit={(e) => e.preventDefault()}
    >
      {p.heading && <h2 className="fb-h2">{p.heading}</h2>}
      {p.subhead && <p className="fb-body">{p.subhead}</p>}
      <div className="fb-form__fields">
        {p.fields.map((f) => (
          <label key={f.name} className="fb-form__field">
            <span className="fb-form__label">
              {f.label}
              {f.required && <span className="fb-form__req"> *</span>}
            </span>
            {f.type === "textarea" ? (
              <textarea
                className="fb-form__input"
                rows={3}
                placeholder={f.placeholder}
              />
            ) : f.type === "select" ? (
              <select className="fb-form__input">
                <option>Choose…</option>
              </select>
            ) : (
              <input
                className="fb-form__input"
                type={f.type}
                placeholder={f.placeholder}
              />
            )}
          </label>
        ))}
      </div>
      <button type="submit" className="fb-btn fb-btn--primary fb-form__submit">
        {p.submit_label}
      </button>
    </form>
  );
}

function Pricing({ p }: { p: PricingProps }) {
  return (
    <div className="fb-pricing" data-block="pricing">
      {p.heading && <h2 className="fb-h2 fb-pricing__heading">{p.heading}</h2>}
      {p.subhead && <p className="fb-body fb-pricing__sub">{p.subhead}</p>}
      <div className="fb-pricing__tiers">
        {p.tiers.map((t) => (
          <div
            key={t.name}
            className={`fb-tier ${t.featured ? "fb-tier--featured" : ""}`}
          >
            <div className="fb-tier__name">{t.name}</div>
            <div className="fb-tier__price">
              {t.price}
              {t.period && (
                <span className="fb-tier__period">{t.period}</span>
              )}
            </div>
            <ul className="fb-tier__features">
              {t.features.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
            {t.cta_label && (
              <button
                className={`fb-btn ${t.featured ? "fb-btn--primary" : "fb-btn--ghost"} fb-tier__cta`}
              >
                {t.cta_label}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Faq({ p }: { p: FaqProps }) {
  return (
    <div className="fb-faq" data-block="faq">
      {p.heading && <h2 className="fb-h2">{p.heading}</h2>}
      <div className="fb-faq__list">
        {p.items.map((it, i) => (
          <details key={i} className="fb-faq__item">
            <summary className="fb-faq__q">{it.q}</summary>
            <p className="fb-faq__a">{it.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

export function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "hero":
      return <Hero p={block.props as HeroProps} />;
    case "text":
      return <Text p={block.props as TextProps} />;
    case "cta":
      return <Cta p={block.props as CtaProps} />;
    case "image":
      return <Image p={block.props as ImageProps} />;
    case "social_proof":
      return <SocialProof p={block.props as SocialProofProps} />;
    case "form":
      return <FormBlock p={block.props as FormProps} />;
    case "pricing":
      return <Pricing p={block.props as PricingProps} />;
    case "faq":
      return <Faq p={block.props as FaqProps} />;
    default:
      return (
        <div className="fb-unknown">Unknown block type: {block.type}</div>
      );
  }
}
