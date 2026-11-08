import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a phone on the same Wi-Fi open the dev server at http://<mac-name>.local:3000
  allowedDevOrigins: ["*.local"],
  // Paid files are all in R2 (lib/r2.ts) since 2026-11-08: nothing in the git-ignored
  // private/ folder ships with a deployment, so no deploy can drop a zip.
  // The funnels' pictures (public/funnels): a returning visitor's browser keeps
  // them for a week instead of asking again each time. A changed picture gets
  // a new file name.
  async headers() {
    return [{ source: "/funnels/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }] }];
  },
};

export default nextConfig;
