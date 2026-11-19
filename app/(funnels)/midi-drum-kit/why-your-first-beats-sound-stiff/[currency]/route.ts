import { articleRoute, currencyParams } from "../../article/articleRoute";

// The advertorial's "beginner" version (../../article/stiffDrums.ts VARIANTS), linked by that audience's ad set.
export const dynamic = "force-static";
export const revalidate = 3600;
export const generateStaticParams = currencyParams;
export const GET = articleRoute("beginner");
