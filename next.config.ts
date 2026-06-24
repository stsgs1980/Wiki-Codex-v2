import type { NextConfig } from "next";
import { dataSrcPlugin } from './vendor/fab-inspector/plugins/data-src-plugin';

const nextConfig: NextConfig = {
  // FabInspector is a git submodule at vendor/fab-inspector shipping raw .tsx.
  // transpilePackages lets Next.js compile it through the bundler.
  transpilePackages: ['FabInspector'],
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
    // FabInspector: auto-inject data-src="file:line" on JSX elements in dev.
    // Enables source inspection without manual data-src attributes.
    // Dev-only — Next.js does not invoke turbo plugins in production build.
    turbo: {
      plugins: [dataSrcPlugin()],
    },
  },
};

export default nextConfig;
