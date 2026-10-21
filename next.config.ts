import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a phone on the same Wi-Fi open the dev server at http://<mac-name>.local:3000
  allowedDevOrigins: ["*.local"],
  // Paid files live in /private (git-ignored, never public). Ship them with
  // the download route only, which checks the payment before sending a byte.
  // The Jazz zips are products of the catalog too (lib/catalog.ts), so every
  // route that can hand out a product carries them (4 MB).
  outputFileTracingIncludes: {
    "/jazz-midi-pack/download": ["./private/jazz-midi-pack/**/*"],
    "/midi-drum-kit/download": ["./private/jazz-midi-pack/**/*"],
    "/top-hits-midi-bundle/download": ["./private/jazz-midi-pack/**/*"],
    "/shop/download": ["./private/jazz-midi-pack/**/*"],
  },
  // The funnels' pictures (public/funnels): a returning visitor's browser keeps
  // them for a week instead of asking again each time. A changed picture gets
  // a new file name.
  async headers() {
    return [{ source: "/funnels/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }] }];
  },
};

export default nextConfig;
