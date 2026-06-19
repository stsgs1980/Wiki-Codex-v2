'use client'

import { Sidebar, MobileSidebar } from '@/components/codex/sidebar'
import { Header } from '@/components/codex/header'
import { ScrollArea } from '@/components/ui/scroll-area'
import { motion, AnimatePresence } from 'framer-motion'
import { pluralize } from '@/lib/format'
import { TECH_ITEMS, NeuroLogoSmall } from '@/components/codex/tech-logos'
import { viewTransition } from '@/lib/motion'
import { useWikiCodex } from './use-wiki-codex'
import { ViewRouter } from './view-router'

export default function WikiCodex() {
  const wikiCodex = useWikiCodex()
  const {
    currentView, mobileMenuOpen, setMobileMenuOpen,
    counters, categories, tags, fetchCategoriesAndTags, refreshAll,
  } = wikiCodex

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
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

        <ScrollArea className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              variants={viewTransition}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <ViewRouter {...wikiCodex} />
            </motion.div>
          </AnimatePresence>
        </ScrollArea>

        <footer className="mt-auto border-t bg-card px-4 py-1.5 md:px-6 flex items-center justify-between gap-2 font-mono text-[11px]">
          <span className="text-muted-foreground whitespace-nowrap flex items-center gap-2">
            <NeuroLogoSmall className="size-4 shrink-0" />
            <span className="text-terminal-accent">{'//>'}</span> Wiki Codex <span className="text-muted-foreground/70">v2.0</span>
            <span className="text-neuro-brand mx-1">|</span>
            <span className="text-muted-foreground/80">NEURO</span>
            <span className="hidden md:flex items-center gap-1.5 ml-2">
              {TECH_ITEMS.map(({ name, Logo }) => (
                <Logo key={name} className="size-3.5 text-muted-foreground/80" />
              ))}
            </span>
          </span>
          <span className="text-muted-foreground/80 text-right tabular-nums">
            {counters.allDocumentsCount} {pluralize(counters.allDocumentsCount, ['doc', 'docs', 'docs'])}
          </span>
        </footer>
      </div>
    </div>
  )
}
