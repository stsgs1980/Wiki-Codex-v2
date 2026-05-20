'use client'

import { Search, Sparkles, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TerminalFrame } from '@/components/codex/terminal-frame'
import { TemplateCard } from './template-card'
import { DbInstructionCard } from './db-instruction-card'
import { useInstructionsData } from './use-instructions-data'

export function InstructionsView({ onCountChange }: { onCountChange?: () => void }) {
  const {
    searchQuery, setSearchQuery,
    isExtracting,
    extractDialogOpen, setExtractDialogOpen,
    selectedDocId, setSelectedDocId,
    documents,
    filteredTemplates,
    filteredDb,
    totalCount,
    handleExtract,
    handleHideTemplate,
    handleDelete,
  } = useInstructionsData(onCountChange)

  return (
    <TerminalFrame title="instructions" className="m-4 md:m-6" headerRight={
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0">
          {totalCount}
        </Badge>
        <Dialog open={extractDialogOpen} onOpenChange={setExtractDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs" disabled={documents.length === 0}>
              <Sparkles className="size-3 text-amber-500" />
              <span className="hidden sm:inline">extract</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Извлечь инструкции</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 pt-2">
              <p className="text-sm text-muted-foreground">
                AI проанализирует документ и извлечёт все пошаговые инструкции автоматически.
              </p>
              <Select value={selectedDocId} onValueChange={setSelectedDocId}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите документ..." />
                </SelectTrigger>
                <SelectContent>
                  {documents.map((doc) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      {doc.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleExtract}
                disabled={!selectedDocId || isExtracting}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              >
                {isExtracting ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                {isExtracting ? 'AI анализирует...' : 'Извлечь инструкции'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    }>
      <div className="flex flex-col gap-4 p-3 sm:p-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input
          placeholder="grep -r ... (search instructions)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 font-mono text-xs h-8"
        />
      </div>

      {/* DB Instructions (extracted) */}
      {filteredDb.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <span className="text-green-600 dark:text-green-400 select-none">$</span>
            <span>extracted from documents</span>
          </div>
          {filteredDb.map((instr) => (
            <DbInstructionCard key={instr.id} instruction={instr} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Separator */}
      {filteredDb.length > 0 && filteredTemplates.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border border-dashed" />
          <span className="text-[10px] font-mono text-muted-foreground/60">built-in</span>
          <div className="flex-1 h-px bg-border border-dashed" />
        </div>
      )}

      {/* Templates (built-in) */}
      <div className="flex flex-col gap-4">
        {filteredTemplates.length === 0 && filteredDb.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="font-mono text-xs text-muted-foreground mb-1">~ no match found</p>
            <p className="text-muted-foreground text-sm">
              Ничего не найдено по запросу &quot;{searchQuery}&quot;
            </p>
          </div>
        ) : (
          filteredTemplates.map((group, idx) => (
            <TemplateCard key={group.id} group={group} defaultExpanded={filteredDb.length === 0 && idx === 0} onHide={handleHideTemplate} />
          ))
        )}
      </div>
      </div>
    </TerminalFrame>
  )
}
