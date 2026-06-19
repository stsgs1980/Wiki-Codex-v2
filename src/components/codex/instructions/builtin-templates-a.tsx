'use client'

import type { TemplateGroup } from './types'
import { TEMPLATES_A_PART_1 } from './builtin-templates-a-data-1'
import { TEMPLATES_A_PART_2 } from './builtin-templates-a-data-2'

/**
 * Built-in instruction templates group A.
 * Combines part 1 (survival-guide, git-bundle) and part 2 (git-basics, project-setup).
 * Rendered by `instructions-view.tsx` via `TemplateCard`.
 */
export const TEMPLATES_A: TemplateGroup[] = [
  ...TEMPLATES_A_PART_1,
  ...TEMPLATES_A_PART_2,
]
