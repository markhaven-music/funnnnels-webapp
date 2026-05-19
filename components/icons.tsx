import type { CSSProperties, SVGProps } from "react";

type IconProps = {
  size?: number;
  sw?: number;
  fill?: string;
  style?: CSSProperties;
  className?: string;
} & Omit<SVGProps<SVGSVGElement>, "style" | "fill">;

function Base({
  size = 16,
  sw = 1.6,
  fill = "none",
  children,
  ...rest
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const I = {
  funnel: (p: IconProps) => (
    <Base {...p}>
      <path d="M3 5h18l-7 9v5l-4-2v-3L3 5z" />
    </Base>
  ),
  page: (p: IconProps) => (
    <Base {...p}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 7h6M9 11h6M9 15h4" />
    </Base>
  ),
  contacts: (p: IconProps) => (
    <Base {...p}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c1-3 3.5-5 6-5s5 2 6 5" />
      <circle cx="17" cy="7" r="2.2" />
      <path d="M15.5 14c1.5-1 3.5-1 5 0" />
    </Base>
  ),
  analytics: (p: IconProps) => (
    <Base {...p}>
      <path d="M4 19V5M4 19h16M8 15v-4M12 15V9M16 15v-7" />
    </Base>
  ),
  abtest: (p: IconProps) => (
    <Base {...p}>
      <path d="M5 4h6v6a3 3 0 1 0 6 0V4" />
      <path d="M19 14a4 4 0 1 1-4 4" />
      <path d="M9 10a4 4 0 1 1-4 4" />
    </Base>
  ),
  integrations: (p: IconProps) => (
    <Base {...p}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <path d="M14 17.5h7" />
    </Base>
  ),
  settings: (p: IconProps) => (
    <Base {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7 5.2l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V4a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V10a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </Base>
  ),
  search: (p: IconProps) => (
    <Base {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </Base>
  ),
  bell: (p: IconProps) => (
    <Base {...p}>
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9z" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </Base>
  ),
  plus: (p: IconProps) => (
    <Base {...p}>
      <path d="M12 5v14M5 12h14" />
    </Base>
  ),
  sparkles: (p: IconProps) => (
    <Base {...p}>
      <path d="M12 3l1.7 4.6L18 9l-4.3 1.4L12 15l-1.7-4.6L6 9l4.3-1.4L12 3z" />
      <path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14z" />
    </Base>
  ),
  arrow: (p: IconProps) => (
    <Base {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Base>
  ),
  arrowLeft: (p: IconProps) => (
    <Base {...p}>
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </Base>
  ),
  send: (p: IconProps) => (
    <Base {...p}>
      <path d="M22 2 11 13" />
      <path d="M22 2l-7 20-4-9-9-4 20-7z" />
    </Base>
  ),
  paperclip: (p: IconProps) => (
    <Base {...p}>
      <path d="M21 11l-9 9a5 5 0 0 1-7-7l9-9a3.5 3.5 0 0 1 5 5l-9 9a2 2 0 0 1-3-3l8-8" />
    </Base>
  ),
  globe: (p: IconProps) => (
    <Base {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </Base>
  ),
  copy: (p: IconProps) => (
    <Base {...p}>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
    </Base>
  ),
  refresh: (p: IconProps) => (
    <Base {...p}>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </Base>
  ),
  more: (p: IconProps) => (
    <Base {...p}>
      <circle cx="5" cy="12" r="1.2" />
      <circle cx="12" cy="12" r="1.2" />
      <circle cx="19" cy="12" r="1.2" />
    </Base>
  ),
  expand: (p: IconProps) => (
    <Base {...p}>
      <path d="M4 14v6h6M20 10V4h-6M14 10l6-6M10 14l-6 6" />
    </Base>
  ),
  close: (p: IconProps) => (
    <Base {...p}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Base>
  ),
  check: (p: IconProps) => (
    <Base {...p} sw={p.sw ?? 2.2}>
      <path d="M5 12l4 4L19 6" />
    </Base>
  ),
  bolt: (p: IconProps) => (
    <Base {...p}>
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
    </Base>
  ),
  layers: (p: IconProps) => (
    <Base {...p}>
      <path d="M12 3 2 8l10 5 10-5-10-5z" />
      <path d="M2 13l10 5 10-5M2 18l10 5 10-5" />
    </Base>
  ),
  brand: (p: IconProps) => (
    <Base {...p}>
      <path d="M4 4h16v6H4zM4 14h10v6H4zM18 14h2v6h-2z" />
    </Base>
  ),
  eye: (p: IconProps) => (
    <Base {...p}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </Base>
  ),
  rocket: (p: IconProps) => (
    <Base {...p}>
      <path d="M5 13l4 4M14 7l-7 7-2 5 5-2 7-7M14 7a5 5 0 0 1 5-5 5 5 0 0 1-5 5z" />
      <circle cx="16" cy="8" r="1" />
    </Base>
  ),
  device_desktop: (p: IconProps) => (
    <Base {...p}>
      <rect x="2" y="4" width="20" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </Base>
  ),
  device_tablet: (p: IconProps) => (
    <Base {...p}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M11 18h2" />
    </Base>
  ),
  device_mobile: (p: IconProps) => (
    <Base {...p}>
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <path d="M11 18h2" />
    </Base>
  ),
  person: (p: IconProps) => (
    <Base {...p}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1-4 4.5-6 8-6s7 2 8 6" />
    </Base>
  ),
  trash: (p: IconProps) => (
    <Base {...p}>
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </Base>
  ),
};

export type IconName = keyof typeof I;
