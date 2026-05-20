import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Adjusts a hex color for readability in light/dark modes.
 * In light mode: ensures the color is dark enough for text on white.
 * In dark mode: returns the color as-is (assumes it's already visible on dark).
 */
export function accessibleColor(hex: string, isDark: boolean): string {
  if (isDark) return hex

  // Parse hex to RGB
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  // If luminance is too high (color too light for white bg), darken it
  if (luminance > 0.55) {
    // Blend with dark version to bring luminance down to ~0.35
    const factor = 0.35 / luminance
    const dr = Math.round(r * factor)
    const dg = Math.round(g * factor)
    const db = Math.round(b * factor)
    return `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`
  }

  return hex
}

/**
 * Creates a semi-transparent background from a hex color.
 * Light mode: uses 15% opacity
 * Dark mode: uses 20% opacity
 */
export function colorToBg(hex: string, isDark: boolean): string {
  const alpha = isDark ? '25' : '18'
  return hex + alpha
}
