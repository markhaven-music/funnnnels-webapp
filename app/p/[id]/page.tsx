import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BlockView } from "@/components/blocks/BlockView";
import { getFunnel } from "@/lib/store";

export const dynamic = "force-dynamic";

type Params = { id: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const f = await getFunnel(id);
  if (!f || f.status !== "live") {
    return {
      title: "Not found",
      robots: { index: false, follow: false },
    };
  }
  const heroProps = f.pages[0]?.blocks?.find((b) => b.type === "hero")
    ?.props as { headline?: string; subhead?: string } | undefined;
  const description = heroProps?.subhead ?? heroProps?.headline ?? f.name;
  const title = heroProps?.headline ?? f.name;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `/p/${id}`,
      siteName: "funnnnels",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: { index: true, follow: true },
  };
}

export default async function PublicFunnelPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const funnel = await getFunnel(id);
  if (!funnel || funnel.status !== "live") notFound();
  const blocks = funnel.pages[0]?.blocks ?? [];

  return (
    <main className="public-page">
      {blocks.map((b) => (
        <div
          key={b.id}
          className={
            b.type === "custom_html" ? "public-block public-block--full" : "public-block"
          }
        >
          <BlockView block={b} />
        </div>
      ))}
      <footer className="public-foot">
        <span>
          built with <a href="/">funnnnels</a>
        </span>
      </footer>
    </main>
  );
}
