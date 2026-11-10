/**
 * Next.js configuration.
 *
 * NOTE on security headers (F-01, F-02, F-06):
 *  - The Content-Security-Policy is generated PER-REQUEST with a fresh nonce in
 *    `src/middleware.ts`, so it is NOT duplicated here (a nonce cannot be static).
 *  - The static, request-independent hardening headers live here.
 *  - `poweredByHeader: false` removes the `X-Powered-By: Next.js` disclosure (F-02).
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  images: {
    formats: ["image/avif", "image/webp"],
    // No remote patterns: all imagery is local/self-hosted (F-05 / F-06).
    remotePatterns: [],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            // Deny powerful features the site does not use. Microphone/camera/
            // geolocation are OFF; autoplay is allowed same-origin for the player.
            value:
              "accelerometer=(), autoplay=(self), camera=(), display-capture=(), encrypted-media=(), fullscreen=(self), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
        ],
      },
    ];
  },
};

export default nextConfig;
