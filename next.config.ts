import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Allows cross-domain requests to dev server from sandbox preview panel.
  // Without this, browser on chatglm.site/space-z.ai blocks requests to localhost:3000,
  // causing 502 Bad Gateway in the Z.ai sandbox preview.
  allowedDevOrigins: ['*'],
  // @zai/select-element ships raw .ts/.tsx (no build step) — must be transpiled by Next.
  transpilePackages: ['@zai/select-element'],
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      '@radix-ui/react-icons',
      'react-syntax-highlighter',
      'z-ai-web-dev-sdk',
    ],
  },
};

export default nextConfig;
