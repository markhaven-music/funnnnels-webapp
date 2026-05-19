import type {
  Block,
  CtaProps,
  CustomHtmlProps,
  FaqProps,
  FormProps,
  HeroProps,
  ImageProps,
  PricingProps,
  SocialProofProps,
  TextProps,
} from "@/lib/blocks";
import { sanitizeBlockHtml } from "@/lib/sanitize";
import { EditableText } from "@/components/blocks/EditableText";

type PatchFn = (propsPatch: Record<string, unknown>) => void;

type BlockProps<P> = {
  p: P;
  patch?: PatchFn;
};

function CustomHtml({ p }: { p: CustomHtmlProps }) {
  const safe = sanitizeBlockHtml(p.html || "");
  return (
    <div
      className="fb-custom"
      data-block="custom_html"
      data-intent={p.intent}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}

function Hero({ p, patch }: BlockProps<HeroProps>) {
  const align = p.align ?? "center";
  const editable = !!patch;
  return (
    <div
      className={`fb-hero ${align === "left" ? "fb-hero--left" : ""}`}
      data-block="hero"
    >
      {(p.eyebrow || editable) && (
        <EditableText
          as="div"
          className="fb-hero__eyebrow"
          value={p.eyebrow ?? ""}
          onChange={patch ? (v) => patch({ eyebrow: v }) : undefined}
          placeholder="Eyebrow"
        />
      )}
      <EditableText
        as="h1"
        className="fb-hero__headline"
        value={p.headline}
        onChange={patch ? (v) => patch({ headline: v }) : undefined}
        placeholder="Headline"
      />
      {(p.subhead || editable) && (
        <EditableText
          as="p"
          className="fb-hero__sub"
          value={p.subhead ?? ""}
          onChange={patch ? (v) => patch({ subhead: v }) : undefined}
          placeholder="Subhead"
          multiline
        />
      )}
      <div className="fb-hero__ctas">
        {(p.primary_cta || editable) && (
          <button className="fb-btn fb-btn--primary">
            <EditableText
              value={p.primary_cta ?? ""}
              onChange={
                patch ? (v) => patch({ primary_cta: v }) : undefined
              }
              placeholder="Primary CTA"
            />
          </button>
        )}
        {(p.secondary_cta || editable) && (
          <button className="fb-btn fb-btn--ghost">
            <EditableText
              value={p.secondary_cta ?? ""}
              onChange={
                patch ? (v) => patch({ secondary_cta: v }) : undefined
              }
              placeholder="Secondary CTA"
            />
          </button>
        )}
      </div>
    </div>
  );
}

function Text({ p, patch }: BlockProps<TextProps>) {
  const editable = !!patch;
  return (
    <div className="fb-text" data-block="text">
      {(p.heading || editable) && (
        <EditableText
          as="h2"
          className="fb-h2"
          value={p.heading ?? ""}
          onChange={patch ? (v) => patch({ heading: v }) : undefined}
          placeholder="Heading"
        />
      )}
      <EditableText
        as="p"
        className="fb-body"
        value={p.body}
        onChange={patch ? (v) => patch({ body: v }) : undefined}
        placeholder="Body text"
        multiline
      />
    </div>
  );
}

function Cta({ p, patch }: BlockProps<CtaProps>) {
  const editable = !!patch;
  return (
    <div className="fb-cta" data-block="cta">
      {(p.headline || editable) && (
        <EditableText
          as="h2"
          className="fb-h2"
          value={p.headline ?? ""}
          onChange={patch ? (v) => patch({ headline: v }) : undefined}
          placeholder="Headline"
        />
      )}
      {(p.subhead || editable) && (
        <EditableText
          as="p"
          className="fb-body"
          value={p.subhead ?? ""}
          onChange={patch ? (v) => patch({ subhead: v }) : undefined}
          placeholder="Subhead"
          multiline
        />
      )}
      <button
        className={`fb-btn ${p.variant === "secondary" ? "fb-btn--ghost" : "fb-btn--primary"}`}
      >
        <EditableText
          value={p.button_label}
          onChange={patch ? (v) => patch({ button_label: v }) : undefined}
          placeholder="Button label"
        />
      </button>
    </div>
  );
}

function Image({ p, patch }: BlockProps<ImageProps>) {
  return (
    <div className="fb-image" data-block="image">
      <div
        className="fb-image__placeholder"
        aria-label={p.alt ?? "Image placeholder"}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="9" cy="9" r="1.5" fill="currentColor" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
        <EditableText
          value={p.alt ?? "Image"}
          onChange={patch ? (v) => patch({ alt: v }) : undefined}
          placeholder="Alt text"
        />
      </div>
      {(p.caption || patch) && (
        <EditableText
          as="div"
          className="fb-image__caption"
          value={p.caption ?? ""}
          onChange={patch ? (v) => patch({ caption: v }) : undefined}
          placeholder="Caption"
        />
      )}
    </div>
  );
}

function SocialProof({ p, patch }: BlockProps<SocialProofProps>) {
  const editable = !!patch;
  return (
    <div className="fb-social" data-block="social_proof">
      {(p.heading || editable) && (
        <EditableText
          as="div"
          className="fb-social__heading"
          value={p.heading ?? ""}
          onChange={patch ? (v) => patch({ heading: v }) : undefined}
          placeholder="Heading"
        />
      )}
      {p.logos && p.logos.length > 0 && (
        <div className="fb-social__logos">
          {p.logos.map((l, i) => (
            <EditableText
              key={`${i}-${l}`}
              as="span"
              className="fb-social__logo"
              value={l}
              onChange={
                patch
                  ? (v) => {
                      const next = [...(p.logos ?? [])];
                      next[i] = v;
                      patch({ logos: next });
                    }
                  : undefined
              }
              placeholder="Logo"
            />
          ))}
        </div>
      )}
      {(p.quote || editable) && (
        <blockquote className="fb-social__quote">
          <EditableText
            value={p.quote ?? ""}
            onChange={patch ? (v) => patch({ quote: v }) : undefined}
            placeholder="Quote"
            multiline
          />
          {(p.attribution || editable) && (
            <EditableText
              as="cite"
              className="fb-social__attr"
              value={p.attribution ?? ""}
              onChange={
                patch ? (v) => patch({ attribution: v }) : undefined
              }
              placeholder="— Attribution"
            />
          )}
        </blockquote>
      )}
    </div>
  );
}

function FormBlock({ p, patch }: BlockProps<FormProps>) {
  const editable = !!patch;
  return (
    <form
      className="fb-form"
      data-block="form"
      onSubmit={(e) => e.preventDefault()}
    >
      {(p.heading || editable) && (
        <EditableText
          as="h2"
          className="fb-h2"
          value={p.heading ?? ""}
          onChange={patch ? (v) => patch({ heading: v }) : undefined}
          placeholder="Heading"
        />
      )}
      {(p.subhead || editable) && (
        <EditableText
          as="p"
          className="fb-body"
          value={p.subhead ?? ""}
          onChange={patch ? (v) => patch({ subhead: v }) : undefined}
          placeholder="Subhead"
          multiline
        />
      )}
      <div className="fb-form__fields">
        {p.fields.map((f, i) => (
          <label key={f.name} className="fb-form__field">
            <span className="fb-form__label">
              <EditableText
                value={f.label}
                onChange={
                  patch
                    ? (v) => {
                        const next = [...p.fields];
                        next[i] = { ...next[i], label: v };
                        patch({ fields: next });
                      }
                    : undefined
                }
                placeholder="Field label"
              />
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
        <EditableText
          value={p.submit_label}
          onChange={patch ? (v) => patch({ submit_label: v }) : undefined}
          placeholder="Submit label"
        />
      </button>
    </form>
  );
}

function Pricing({ p, patch }: BlockProps<PricingProps>) {
  const editable = !!patch;
  return (
    <div className="fb-pricing" data-block="pricing">
      {(p.heading || editable) && (
        <EditableText
          as="h2"
          className="fb-h2 fb-pricing__heading"
          value={p.heading ?? ""}
          onChange={patch ? (v) => patch({ heading: v }) : undefined}
          placeholder="Heading"
        />
      )}
      {(p.subhead || editable) && (
        <EditableText
          as="p"
          className="fb-body fb-pricing__sub"
          value={p.subhead ?? ""}
          onChange={patch ? (v) => patch({ subhead: v }) : undefined}
          placeholder="Subhead"
          multiline
        />
      )}
      <div className="fb-pricing__tiers">
        {p.tiers.map((t, i) => {
          const patchTier = patch
            ? (tierPatch: Partial<typeof t>) => {
                const next = [...p.tiers];
                next[i] = { ...next[i], ...tierPatch };
                patch({ tiers: next });
              }
            : undefined;
          return (
            <div
              key={`${i}-${t.name}`}
              className={`fb-tier ${t.featured ? "fb-tier--featured" : ""}`}
            >
              <EditableText
                as="div"
                className="fb-tier__name"
                value={t.name}
                onChange={
                  patchTier ? (v) => patchTier({ name: v }) : undefined
                }
                placeholder="Tier name"
              />
              <div className="fb-tier__price">
                <EditableText
                  value={t.price}
                  onChange={
                    patchTier ? (v) => patchTier({ price: v }) : undefined
                  }
                  placeholder="$0"
                />
                {(t.period || editable) && (
                  <EditableText
                    as="span"
                    className="fb-tier__period"
                    value={t.period ?? ""}
                    onChange={
                      patchTier
                        ? (v) => patchTier({ period: v })
                        : undefined
                    }
                    placeholder="/mo"
                  />
                )}
              </div>
              <ul className="fb-tier__features">
                {t.features.map((f, fi) => (
                  <li key={fi}>
                    <EditableText
                      value={f}
                      onChange={
                        patchTier
                          ? (v) => {
                              const next = [...t.features];
                              next[fi] = v;
                              patchTier({ features: next });
                            }
                          : undefined
                      }
                      placeholder="Feature"
                    />
                  </li>
                ))}
              </ul>
              {(t.cta_label || editable) && (
                <button
                  className={`fb-btn ${t.featured ? "fb-btn--primary" : "fb-btn--ghost"} fb-tier__cta`}
                >
                  <EditableText
                    value={t.cta_label ?? ""}
                    onChange={
                      patchTier
                        ? (v) => patchTier({ cta_label: v })
                        : undefined
                    }
                    placeholder="CTA label"
                  />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Faq({ p, patch }: BlockProps<FaqProps>) {
  const editable = !!patch;
  return (
    <div className="fb-faq" data-block="faq">
      {(p.heading || editable) && (
        <EditableText
          as="h2"
          className="fb-h2"
          value={p.heading ?? ""}
          onChange={patch ? (v) => patch({ heading: v }) : undefined}
          placeholder="Heading"
        />
      )}
      <div className="fb-faq__list">
        {p.items.map((it, i) => {
          const patchItem = patch
            ? (itemPatch: Partial<typeof it>) => {
                const next = [...p.items];
                next[i] = { ...next[i], ...itemPatch };
                patch({ items: next });
              }
            : undefined;
          return (
            <details key={i} className="fb-faq__item">
              <summary className="fb-faq__q">
                <EditableText
                  value={it.q}
                  onChange={
                    patchItem ? (v) => patchItem({ q: v }) : undefined
                  }
                  placeholder="Question"
                />
              </summary>
              <EditableText
                as="p"
                className="fb-faq__a"
                value={it.a}
                onChange={
                  patchItem ? (v) => patchItem({ a: v }) : undefined
                }
                placeholder="Answer"
                multiline
              />
            </details>
          );
        })}
      </div>
    </div>
  );
}

export function BlockView({
  block,
  patch,
}: {
  block: Block;
  patch?: PatchFn;
}) {
  switch (block.type) {
    case "custom_html":
      return <CustomHtml p={block.props as CustomHtmlProps} />;
    case "hero":
      return <Hero p={block.props as HeroProps} patch={patch} />;
    case "text":
      return <Text p={block.props as TextProps} patch={patch} />;
    case "cta":
      return <Cta p={block.props as CtaProps} patch={patch} />;
    case "image":
      return <Image p={block.props as ImageProps} patch={patch} />;
    case "social_proof":
      return (
        <SocialProof p={block.props as SocialProofProps} patch={patch} />
      );
    case "form":
      return <FormBlock p={block.props as FormProps} patch={patch} />;
    case "pricing":
      return <Pricing p={block.props as PricingProps} patch={patch} />;
    case "faq":
      return <Faq p={block.props as FaqProps} patch={patch} />;
    default:
      return (
        <div className="fb-unknown">Unknown block type: {block.type}</div>
      );
  }
}
