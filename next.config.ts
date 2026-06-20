import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@zai/select-element'],
  reactStrictMode: true,
  // Allows cross-domain requests to dev server from sandbox preview panel.
  // Without this, browser on chatglm.site/space-z.ai blocks requests to localhost:3000,
  // causing 502 Bad Gateway in the Z.ai sandbox preview.
  allowedDevOrigins: ['*'],
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
