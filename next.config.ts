import type { NextConfig } from "next";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  publicExcludes: ["!noprecache/**/*"],
  buildExcludes: [/middleware-manifest\.json$/],
  runtimeCaching: [
    {
      urlPattern: /^https?:\/\/[^\/]+\/(?:home|play|leaderboard|global|authentication)?(?:\/.*)?$/,
      handler: "NetworkFirst",
      options: {
        cacheName: "eartle-pages",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60 * 7,
        },
        networkTimeoutSeconds: 3,
      },
    },
    {
      urlPattern: /\/_next\/static\/.*$/,
      handler: "CacheFirst",
      options: {
        cacheName: "eartle-static",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 24 * 60 * 60 * 365,
        },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
      handler: "CacheFirst",
      options: {
        cacheName: "eartle-images",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 24 * 60 * 60 * 30,
        },
      },
    },
    {
      urlPattern: /^https?:\/\/[^\/]+\/api\/(?!auth).*$/,
      handler: "NetworkFirst",
      options: {
        cacheName: "eartle-api",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60,
        },
        networkTimeoutSeconds: 5,
      },
    },
  ],
});

const nextConfig: NextConfig = {};

export default withPWA(nextConfig);
