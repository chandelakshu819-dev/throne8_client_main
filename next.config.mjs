// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  typescript: {
    // ⚠️ Temporary — TS errors build ko fail nahi karenge
    ignoreBuildErrors: true,
  },
  eslint: {
    // ⚠️ Temporary — ESLint errors build ko fail nahi karenge
    ignoreDuringBuilds: true,
  },

  // Production build me console.log hat jayenge, error/warn bache rahenge
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
    // Sirf wahi imports bundle me aayenge jo use ho rahe hain
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