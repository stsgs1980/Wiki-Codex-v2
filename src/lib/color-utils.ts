/** Build a CSS color with alpha from a var() color token using color-mix */
export function withAlpha(color: string, alpha: number): string {
  return `color-mix(in srgb, ${color} ${alpha}%, transparent)`
}
