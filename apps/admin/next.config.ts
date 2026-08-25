import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
  // @react-pdf/renderer must run in Node.js, not be bundled by webpack.
  // Without this, the PDF route throws "Cannot find module 'canvas'" or similar.
  serverExternalPackages: ['@react-pdf/renderer'],
};

export default nextConfig;
