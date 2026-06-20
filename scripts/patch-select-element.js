/**
 * Postinstall patcher for @zai/select-element.
 *
 * Problem: package ships raw .tsx (not compiled .js + .d.ts).
 * When our CI runs `tsc --noEmit`, it type-checks inside the package
 * and trips on 3 upstream TS errors in v2.3.3:
 *   - DetailsPopover.tsx:205 — elementInfo.source possibly null in callbacks
 *   - gh-theme.ts:29         — spread of possibly undefined indexed access
 *
 * Fix: prepend `// @ts-nocheck` to the two affected files. Runtime is
 * untouched (Next.js transpilePackages still compiles them). The directive
 * only silences tsc type-checking for those files.
 *
 * Idempotent: skips files already patched. Safe to re-run on every install.
 * If upstream fixes the errors, this script becomes a no-op but keeps working.
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const MARKER = '// @ts-nocheck — patched by scripts/patch-select-element.js (upstream v2.3.3 TS errors)';

const TARGETS = [
  'node_modules/@zai/select-element/DetailsPopover.tsx',
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
