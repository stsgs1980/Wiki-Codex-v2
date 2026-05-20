# Task 3-a: Decompose instructions-view.tsx

## Summary
Decomposed the 1139-line monolith `instructions-view.tsx` into 16 focused modules under `src/components/codex/instructions/`, all under the 250-line limit.

## Files Created
| File | Lines | Content |
|------|-------|---------|
| types.ts | 35 | StepType, CodeBlock, Step, InstructionItem, TemplateGroup |
| step-type-config.tsx | 72 | STEP_TYPE_CONFIG, resolveStepType |
| semantic-highlight.tsx | 97 | highlightCode function |
| builtin-templates-a.tsx | 191 | First 4 template groups |
| builtin-templates-b.tsx | 87 | Last 3 template groups |
| builtin-templates.ts | 6 | Combines A+B, exports BUILTIN_TEMPLATES, BUILTIN_COUNT |
| hidden-templates.ts | 31 | localStorage helpers, useBuiltinVisibleCount |
| parse-steps.ts | 9 | parseSteps helper |
| copyable-code-block.tsx | 55 | CopyableCodeBlock component |
| step-callout.tsx | 21 | StepCallout component |
| step-card.tsx | 81 | StepCard component |
| template-card.tsx | 133 | TemplateCard component |
| db-instruction-card.tsx | 104 | DbInstructionCard component |
| use-instructions-data.ts | 146 | Custom hook with all state + handlers |
| instructions-view.tsx | 139 | Main composer component |
| index.ts | 4 | Barrel exports |

## Files Modified
- `instructions-view.tsx`: 1139 → 2 lines (re-export)
- `use-codex-data.ts`: Removed unused `InstructionsView` import

## Lint: Passed
