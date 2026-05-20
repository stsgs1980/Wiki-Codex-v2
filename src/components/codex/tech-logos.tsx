import type { SVGProps } from 'react'

type LogoProps = SVGProps<SVGSVGElement>

/**
 * Next.js official logo - simplified shield with "N"
 */
export function NextJsLogo({ className, ...props }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <path
        d="M12 2L2 20h20L12 2Z"
        fill="currentColor"
        opacity="0.15"
      />
      <path
        d="M12 2L2 20h20L12 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M9 16l5-7h2l-5 7H9Z"
        fill="currentColor"
      />
    </svg>
  )
}

/**
 * TypeScript official logo - "TS" in rounded square
 */
export function TypeScriptLogo({ className, ...props }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <rect
        x="3" y="3" width="18" height="18" rx="2"
        fill="currentColor"
        opacity="0.15"
      />
      <rect
        x="3" y="3" width="18" height="18" rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <text
        x="12" y="16.5"
        textAnchor="middle"
        fill="currentColor"
        fontSize="11"
        fontWeight="700"
        fontFamily="Inter, system-ui, sans-serif"
      >
        TS
      </text>
    </svg>
  )
}

/**
 * Tailwind CSS logo - three wind/wave strokes
 */
export function TailwindLogo({ className, ...props }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <path
        d="M12 6C9.5 6 8 7.5 8 9.5c0 3 4 3.5 4 5.5 0 1-0.5 1.5-1.5 1.5S8 15 8 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M12 6c2.5 0 4 1.5 4 3.5 0 3-4 3.5-4 5.5 0 1 0.5 1.5 1.5 1.5S16 15 16 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M9.5 3c-3 1.5-5 4-5 7 0 4 3.5 6 7.5 6s7.5-2 7.5-6c0-3-2-5.5-5-7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * PostgreSQL logo - elephant silhouette (simplified)
 */
export function PostgresqlLogo({ className, ...props }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <path
        d="M17 3c-1.5 0-3 .5-4 1.5C12 4 11 3.5 9.5 3.5 6.5 3.5 4 6 4 9.5c0 4.5 3.5 9 8 11 .5.2 1 .2 1.5 0 4.5-2 8-6.5 8-11C21.5 5.5 19.5 3 17 3Z"
        fill="currentColor"
        opacity="0.12"
      />
      <path
        d="M17 3c-1.5 0-3 .5-4 1.5C12 4 11 3.5 9.5 3.5 6.5 3.5 4 6 4 9.5c0 4.5 3.5 9 8 11 .5.2 1 .2 1.5 0 4.5-2 8-6.5 8-11C21.5 5.5 19.5 3 17 3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <text
        x="13" y="12"
        textAnchor="middle"
        fill="currentColor"
        fontSize="6"
        fontWeight="700"
        fontFamily="Inter, system-ui, sans-serif"
      >
        PG
      </text>
    </svg>
  )
}

/**
 * Prisma ORM logo - prism / crystal triangle
 */
export function PrismaLogo({ className, ...props }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <path
        d="M12 2L3 19h18L12 2Z"
        fill="currentColor"
        opacity="0.12"
      />
      <path
        d="M12 2L3 19h18L12 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M12 9L8 17h8L12 9Z"
        fill="currentColor"
        opacity="0.25"
      />
      <path
        d="M12 9L8 17h8L12 9Z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * Zustand logo - simplified bear icon
 */
export function ZustandLogo({ className, ...props }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} {...props}>
      {/* Ears */}
      <circle cx="8" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      {/* Head */}
      <path
        d="M5 10a7 7 0 0 1 14 0v4a7 7 0 0 1-14 0v-4Z"
        fill="currentColor"
        opacity="0.12"
      />
      <path
        d="M5 10a7 7 0 0 1 14 0v4a7 7 0 0 1-14 0v-4Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {/* Eyes */}
      <circle cx="9.5" cy="11" r="0.8" fill="currentColor" />
      <circle cx="14.5" cy="11" r="0.8" fill="currentColor" />
      {/* Nose */}
      <ellipse cx="12" cy="13.5" rx="1.2" ry="0.8" fill="currentColor" />
    </svg>
  )
}

/**
 * NEURO brand logo - coral R in box for footer
 */
export function NeuroLogoSmall({ className, ...props }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="3" fill="#FA3913" />
      <text
        x="12" y="16.5"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="14"
        fontWeight="700"
        fontFamily="Inter, system-ui, sans-serif"
      >
        R
      </text>
    </svg>
  )
}

export const TECH_ITEMS = [
  { name: 'Next.js', Logo: NextJsLogo },
  { name: 'TypeScript', Logo: TypeScriptLogo },
  { name: 'Tailwind CSS', Logo: TailwindLogo },
  { name: 'PostgreSQL', Logo: PostgresqlLogo },
  { name: 'Prisma ORM', Logo: PrismaLogo },
  { name: 'Zustand', Logo: ZustandLogo },
] as const
