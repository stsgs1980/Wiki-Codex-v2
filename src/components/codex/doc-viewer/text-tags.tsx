'use client'

import { Fragment, isValidElement, cloneElement, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * TextTagsRenderer — STD-DOC-002 §4.4
 * Parses text tags [OK] [FAIL] [DONE] [TODO] [WARNING] [WARN] [INFO]
 * and renders them as colored terminal-style badges.
 *
 * Replaces Unicode emoji/icon status indicators per No-Unicode Policy.
 * Same rule = same severity: these tags are the ONLY allowed status markers.
 */

type TagConfig = {
  label: string
  className: string
}

const TAG_MAP: Record<string, TagConfig> = {
  OK: {
    label: 'OK',
    className: 'bg-terminal-accent/15 text-terminal-accent border-terminal-accent/40',
  },
  DONE: {
    label: 'DONE',
    className: 'bg-terminal-accent/15 text-terminal-accent border-terminal-accent/40',
  },
  PASS: {
    label: 'PASS',
    className: 'bg-terminal-accent/15 text-terminal-accent border-terminal-accent/40',
  },
  FAIL: {
    label: 'FAIL',
    className: 'bg-destructive/15 text-destructive border-destructive/40',
  },
  ERROR: {
    label: 'ERROR',
    className: 'bg-destructive/15 text-destructive border-destructive/40',
  },
  TODO: {
    label: 'TODO',
    className: 'bg-star/15 text-star border-star/40',
  },
  WARNING: {
    label: 'WARN',
    className: 'bg-star/15 text-star border-star/40',
  },
  WARN: {
    label: 'WARN',
    className: 'bg-star/15 text-star border-star/40',
  },
  INFO: {
    label: 'INFO',
    className: 'bg-neuro-brand/15 text-neuro-brand border-neuro-brand/40',
  },
  NOTE: {
    label: 'NOTE',
    className: 'bg-neuro-brand/15 text-neuro-brand border-neuro-brand/40',
  },
}

const TAG_REGEX = /\[(OK|DONE|PASS|FAIL|ERROR|TODO|WARNING|WARN|INFO|NOTE)\]/g

export function renderTextTags(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let keyIdx = 0
  let match: RegExpExecArray | null

  TAG_REGEX.lastIndex = 0
  while ((match = TAG_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <Fragment key={`txt-${keyIdx++}`}>
          {text.slice(lastIndex, match.index)}
        </Fragment>
      )
    }
    const cfg = TAG_MAP[match[1]]
    if (cfg) {
      nodes.push(
        <span
          key={`tag-${keyIdx++}`}
          className={cn(
            'inline-flex items-center rounded border px-1.5 py-px mx-0.5',
            'text-[0.7em] font-mono font-semibold uppercase tracking-wide align-baseline',
            'leading-none select-none',
            cfg.className,
          )}
        >
          {cfg.label}
        </span>
      )
    } else {
      nodes.push(
        <Fragment key={`unk-${keyIdx++}`}>{match[0]}</Fragment>
      )
    }
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) {
    nodes.push(
      <Fragment key={`txt-${keyIdx++}`}>{text.slice(lastIndex)}</Fragment>
    )
  }
  return nodes
}

/**
 * Recursively walks ReactNode tree and applies text-tag rendering to string leaves.
 * Handles strings, numbers, arrays, and React elements (recurses into element.props.children).
 * Use this to inject tag badges into existing markdown renderer output without
 * restructuring every component override.
 */
export function renderTextTagsInNode(node: ReactNode): ReactNode {
  if (node == null || node === false || node === true) return node
  if (typeof node === 'string') {
    return <>{renderTextTags(node)}</>
  }
  if (typeof node === 'number') {
    return <>{renderTextTags(String(node))}</>
  }
  if (Array.isArray(node)) {
    return node.map((child, i) => (
      <Fragment key={i}>{renderTextTagsInNode(child)}</Fragment>
    ))
  }
  if (isValidElement(node)) {
    const element = node as React.ReactElement<{ children?: ReactNode }>
    if (element.props && element.props.children != null) {
      return cloneElement(element, {
        ...element.props,
        children: renderTextTagsInNode(element.props.children),
      })
    }
  }
  return node
}
