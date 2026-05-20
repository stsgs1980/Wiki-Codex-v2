import { TEMPLATES_A } from './builtin-templates-a'
import { TEMPLATES_B } from './builtin-templates-b'
import type { TemplateGroup } from './types'

export const BUILTIN_TEMPLATES: TemplateGroup[] = [...TEMPLATES_A, ...TEMPLATES_B]
export const BUILTIN_COUNT = BUILTIN_TEMPLATES.length
