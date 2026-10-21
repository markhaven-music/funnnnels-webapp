import Link from "next/link";

export function Brand() {
  return (
    <div className="logo-cell">
      <Link href="/" className="brand" style={{ textDecoration: "none", color: "inherit" }}>
        <img className="brand-mark" src="/funnels/dashboard/brand-mark.webp" width={26} height={26} alt="" />
        <div className="brand-name">
          <b>funn</b>
          <i>nn</i>
          <b>els</b>
        </div>
      </Link>
    </div>
  );
}
