import type { Step } from './types'

export function parseSteps(stepsJson: string): Step[] {
  try {
    return JSON.parse(stepsJson)
  } catch {
    return []
  }
}
