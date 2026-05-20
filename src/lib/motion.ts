'use client'

import { type Variants } from 'framer-motion'

/** Fade + slight slide up for view transitions */
export const viewTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

/** Staggered children container */
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
}

/** Single staggered child — fade + slide up */
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 400, damping: 30 },
  },
}

/** Hover tap for interactive cards */
export const cardHover = {
  whileHover: { y: -2, transition: { type: 'spring', stiffness: 400, damping: 25 } },
  whileTap: { scale: 0.985 },
}

/** Hover tap for list items (subtler) */
export const listItemHover = {
  whileHover: { x: 4, transition: { type: 'spring', stiffness: 500, damping: 30 } },
  whileTap: { scale: 0.99 },
}

/** Stats counter animation */
export const countUp: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 20 },
  },
}

/** Section header entrance */
export const sectionEntrance: Variants = {
  initial: { opacity: 0, x: -8 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring', stiffness: 400, damping: 30 },
  },
}

/** Sidebar nav item hover — subtle slide right */
export const navItemHover = {
  whileHover: { x: 3, transition: { type: 'spring', stiffness: 500, damping: 30 } },
  whileTap: { scale: 0.98 },
}

/** Terminal dot pulse — for status indicator */
export const dotPulse: Variants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.2, 1],
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
  },
}

/** Fade in — generic entrance */
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
}

/** Scale pop — for badges, counters */
export const scalePop = {
  whileHover: { scale: 1.05, transition: { type: 'spring', stiffness: 400, damping: 20 } },
  whileTap: { scale: 0.95 },
}
