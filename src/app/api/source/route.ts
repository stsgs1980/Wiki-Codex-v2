// FabInspector source endpoint.
// Handler инлайнен напрямую — re-export из '@/components/inspector/api-source-route'
// тянет в server-route компиляцию всего модуля (с 'use client' и framer-motion),
// что подвешивает Turbopack. Поэтому держим handler здесь.
//
// При обновлении модуля — синхронизировать с src/components/inspector/api-source-route.ts.
// При переходе на npm-пакет @stsgs1980/fab-inspector можно будет сделать:
//   export { GET } from '@stsgs1980/fab-inspector/api/source';
// (после того как пакет будет шлёт pre-built dist/, а не исходники)

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { resolve } from 'path';

const PROJECT_ROOT = process.cwd();
const ALLOWED_PREFIXES = [
  resolve(PROJECT_ROOT, 'src/components/'),
  resolve(PROJECT_ROOT, 'src/app/'),
  resolve(PROJECT_ROOT, 'src/content/'),
  resolve(PROJECT_ROOT, 'src/hooks/'),
  resolve(PROJECT_ROOT, 'src/lib/'),
];

function isAllowed(filePath: string): boolean {
  const resolved = resolve(PROJECT_ROOT, filePath);
  return ALLOWED_PREFIXES.some((prefix) => resolved.startsWith(prefix));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get('file');
  const line = parseInt(searchParams.get('line') || '1', 10);
  const ctx = parseInt(searchParams.get('ctx') || '8', 10);

  if (!file || !isAllowed(file)) {
    return NextResponse.json({ error: 'File not allowed' }, { status: 403 });
  }

  try {
    const filePath = resolve(PROJECT_ROOT, file);
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    const start = Math.max(0, line - 1 - ctx);
    const end = Math.min(lines.length, line - 1 + ctx + 1);
    const snippet = lines.slice(start, end);
    const startLine = start + 1;

    return NextResponse.json({
      file,
      line,
      totalLines: lines.length,
      snippet: {
        startLine,
        lines: snippet,
        highlightLine: line,
      },
    });
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
