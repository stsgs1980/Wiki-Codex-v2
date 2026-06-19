import {
  NextJsLogo,
  TypeScriptLogo,
  TailwindLogo,
  PostgresqlLogo,
  PrismaLogo,
  ZustandLogo,
  NeuroLogoSmall,
} from './tech-logos/icons'

export { NeuroLogoSmall }

/**
 * Tech stack items rendered in the footer.
 * Each entry pairs a human-readable name with its SVG Logo component.
 */
export const TECH_ITEMS = [
  { name: 'Next.js', Logo: NextJsLogo },
  { name: 'TypeScript', Logo: TypeScriptLogo },
  { name: 'Tailwind CSS', Logo: TailwindLogo },
  { name: 'PostgreSQL', Logo: PostgresqlLogo },
  { name: 'Prisma ORM', Logo: PrismaLogo },
  { name: 'Zustand', Logo: ZustandLogo },
] as const
