import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Allows cross-domain requests to dev server from sandbox preview panel.
  // Without this, browser on chatglm.site/space-z.ai blocks requests to localhost:3000,
  // causing 502 Bad Gateway in the Z.ai sandbox preview.
  allowedDevOrigins: ['*'],
  // Fix "Next.js inferred your workspace root, but it may not be correct" warning.
  // The FabInspector submodule under src/components/inspector has its own package.json,
  // which confuses Turbopack's workspace-root detection. Pin root explicitly to project dir.
  turbopack: {
    root: dirname(fileURLToPath(import.meta.url)),
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      '@radix-ui/react-icons',
      'react-syntax-highlighter',
      'z-ai-web-dev-sdk',
    ],
  },
  // FabInspector: авто-data-src через Turbopack ОТКЛЮЧЁН.
  // В Next.js 16 API experimental.turbo.plugins удалён.
  // Альтернатива turbopack.rules + loader работает, но наивная регулярка
  // плагина ломает TypeScript generics (typeof, Array<T>, React.FC<Props>).
  // Корректное решение — SWC plugin с настоящим парсером. Отдельная задача.
  // Пока: проставляйте data-src вручную на ключевых элементах,
  // инспектор работает для тех элементов, где data-src есть.
};

export default nextConfig;
