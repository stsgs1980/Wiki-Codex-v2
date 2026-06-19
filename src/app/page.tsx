'use client'

import { Sidebar, MobileSidebar } from '@/components/codex/sidebar'
import { Header } from '@/components/codex/header'
import { ScrollArea } from '@/components/ui/scroll-area'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { pluralize } from '@/lib/format'
import { TECH_ITEMS, NeuroLogoSmall } from '@/components/codex/tech-logos'
import { viewTransition } from '@/lib/motion'
import { useWikiCodex } from './use-wiki-codex'
import { ViewRouter } from './view-router'

export default function WikiCodex() {
  const wikiCodex = useWikiCodex()
  const reduceMotion = useReducedMotion()
  const {
    currentView, mobileMenuOpen, setMobileMenuOpen,
    counters, categories, tags, fetchCategoriesAndTags, refreshAll,
  } = wikiCodex

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <a
        href="#main-content"
        className="skip-to-content sr-only focus:not-sr-only focus:absolute focus:z-50 focus:left-4 focus:top-4 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg"
      >
        Перейти к содержимому
      </a>
      <Sidebar
        categories={categories}
        tags={tags}
        documentsCount={counters.allDocumentsCount}
        termsCount={counters.termsCount}
        notesCount={counters.notesCount}
        instructionsCount={counters.instructionsCount}
        onCategoryCreated={() => fetchCategoriesAndTags()}
        onTagCreated={() => fetchCategoriesAndTags()}
        onCategoryDeleted={() => { fetchCategoriesAndTags(); refreshAll() }}
        onTagDeleted={() => { fetchCategoriesAndTags(); refreshAll() }}
      />

      <MobileSidebar
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
        categories={categories}
        tags={tags}
        documentsCount={counters.allDocumentsCount}
        termsCount={counters.termsCount}
        notesCount={counters.notesCount}
        instructionsCount={counters.instructionsCount}
        onCategoryCreated={() => fetchCategoriesAndTags()}
        onTagCreated={() => fetchCategoriesAndTags()}
        onCategoryDeleted={() => { fetchCategoriesAndTags(); refreshAll() }}
        onTagDeleted={() => { fetchCategoriesAndTags(); refreshAll() }}
      />

      <div className="flex flex-1 flex-col min-w-0">
        <Header onMenuToggle={() => setMobileMenuOpen(true)} />

        <main id="main-content" tabIndex={-1} className="flex-1 min-h-0">
          <ScrollArea className="h-full overflow-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                variants={viewTransition}
                initial={reduceMotion ? false : 'initial'}
                animate="animate"
                exit={reduceMotion ? undefined : 'exit'}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }}
              >
                <ViewRouter {...wikiCodex} />
              </motion.div>
            </AnimatePresence>
          </ScrollArea>
        </main>

        <footer className="mt-auto border-t bg-card px-4 py-1.5 md:px-6 flex items-center justify-between gap-2 font-mono text-2xs">
          <span className="text-foreground/70 whitespace-nowrap flex items-center gap-2">
            <NeuroLogoSmall className="size-4 shrink-0" />
            <span className="text-terminal-accent">{'//>'}</span> Wiki Codex <span className="text-muted-foreground">v2.0</span>
            <span className="text-neuro-brand mx-1">|</span>
            <span className="text-muted-foreground">NEURO</span>
            <span className="hidden md:flex items-center gap-1.5 ml-2">
              {TECH_ITEMS.map(({ name, Logo }) => (
                <Logo key={name} className="size-3.5 text-muted-foreground" />
              ))}
            </span>
          </span>
          <span className="text-muted-foreground text-right tabular-nums">
            {counters.allDocumentsCount} {pluralize(counters.allDocumentsCount, ['doc', 'docs', 'docs'])}
          </span>
        </footer>
      </div>
    </div>
  )
}
