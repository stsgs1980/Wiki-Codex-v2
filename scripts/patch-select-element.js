/**
 * Postinstall patcher for @zai/select-element.
 *
 * Problem: package ships raw .tsx (not compiled .js + .d.ts).
 * When our CI runs `tsc --noEmit`, it type-checks inside the package
 * and trips on upstream TS errors.
 *
 * History:
 *   v2.3.3: 3 errors — DetailsPopover.tsx:205 (TS18047 source null),
 *           gh-theme.ts:29 (TS2698 spread of indexed access).
 *   v2.5.0: upstream fixed TS18047 (local copies sourceFile/sourceLine)
 *           and hydration bug (setState in render → useEffect).
 *           gh-theme.ts:29 TS2698 still present.
 *
 * Fix: prepend `// @ts-nocheck` to files with remaining TS errors.
 * Runtime is untouched (Next.js transpilePackages still compiles them).
 * The directive only silences tsc type-checking for those files.
 *
 * Idempotent: skips files already patched. Safe to re-run on every install.
 * If upstream fixes all errors, this script becomes a no-op but keeps working.
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const MARKER = '// @ts-nocheck — patched by scripts/patch-select-element.js (upstream gh-theme.ts TS2698)';

const TARGETS = [
  // v2.5.0: only gh-theme.ts:29 still has TS2698 (spread of indexed access).
  // DetailsPopover.tsx fixed upstream in v2.5.0 — removed from patch list.
  'node_modules/@zai/select-element/gh-theme.ts',
];

let patched = 0;
let skipped = 0;
let missing = 0;

for (const rel of TARGETS) {
  const full = path.resolve(process.cwd(), rel);
  if (!fs.existsSync(full)) {
    missing++;
    continue;
  }
  let content = fs.readFileSync(full, 'utf8');
  if (content.startsWith('// @ts-nocheck')) {
    skipped++;
    continue;
  }
  fs.writeFileSync(full, MARKER + '\n' + content);
  patched++;
  console.log(`[patch] @ts-nocheck prepended → ${rel}`);
}

console.log(
  `[patch] @zai/select-element: ${patched} patched, ${skipped} already patched, ${missing} missing`,
);
