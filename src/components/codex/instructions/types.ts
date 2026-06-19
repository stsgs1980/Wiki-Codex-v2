export type StepType = 'step' | 'warning' | 'info' | 'tip' | 'important'

export interface CodeBlock {
  label: string
  code: string
}

export interface Step {
  title: string
  description: string
  codeBlocks: CodeBlock[]
  type?: StepType
  tags?: string[]
}

export interface InstructionItem {
  id: string
  title: string
  description: string
  steps: string // JSON string from DB
  sourceDocId: string | null
  sourceDoc: { id: string; title: string } | null
  isBuiltIn: boolean
  createdAt: string
  updatedAt: string
}

export interface TemplateGroup {
  id: string
  icon: React.ReactNode
  title: string
  description: string
  color: string
  steps: Step[]
}
