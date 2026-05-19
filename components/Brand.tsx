import Link from "next/link";

export function Brand() {
  return (
    <div className="logo-cell">
      <Link href="/" className="brand" style={{ textDecoration: "none", color: "inherit" }}>
        <div className="brand-mark" />
        <div className="brand-name">
          <b>funn</b>
          <i>nn</i>
          <b>els</b>
        </div>
      </Link>
    </div>
  );
}
