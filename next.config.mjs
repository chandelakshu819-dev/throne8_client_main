// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  typescript: {
    // TypeScript errors will not fail production build
    ignoreBuildErrors: true,
  },
  eslint: {
    // ESLint errors will not fail production build
    ignoreDuringBuilds: true,
  },

  // Remove console.log in production, preserve error and warn
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  experimental: {
    // Only import packages actually in use
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "react-icons",
      "framer-motion",
      "date-fns",
      "lodash",
    ],
  },
};

export default nextConfig;
