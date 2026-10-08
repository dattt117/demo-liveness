import type { NextConfig } from "next"

function normalizeBasePath(value?: string): string {
  if (!value) return ""
  const trimmed = value.trim()
  if (!trimmed || trimmed === "/") return ""
  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`
  return withLeadingSlash.replace(/\/+$/, "")
}

const basePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH)

const nextConfig: NextConfig = {
  basePath,
  assetPrefix: basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
}

export default nextConfig
