import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a phone on the same Wi-Fi open the dev server at http://<mac-name>.local:3000
  allowedDevOrigins: ["*.local"],
  // Paid files live in /private (git-ignored, never public). Ship them with
  // the download route only, which checks the payment before sending a byte.
  outputFileTracingIncludes: {
    "/jazz-midi-pack/download": ["./private/jazz-midi-pack/**/*"],
  },
};

export default nextConfig;
