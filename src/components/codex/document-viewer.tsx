'use client'

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useTheme } from 'next-themes'
import { formatDate, formatFileSize } from '@/lib/format'
import {
  ArrowLeft,
  Star,
  Trash2,
  Edit3,
  Save,
  X,
  Sparkles,
  Loader2,
  Eye,
  Calendar,
  HardDrive,
  FileText,
  Tag as TagIcon,
  FolderOpen,
  Check,
  RefreshCw,
  FileSearch,
  Copy,
  ChevronRight,
  LayoutDashboard,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/lib/store'
import type { Document, Category, AIAnalysis } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { TerminalFrame } from '@/components/codex/terminal-frame'

interface RelatedDocument extends Document {
  similarityScore: number
  reason: string
}

interface DocumentViewerProps {
  document: Document
  categories: Category[]
  onDelete: (id: string) => void
  onUpdate: (doc: Document) => void
  onAnalysisApplied: (doc: Document) => void
}

export function DocumentViewer({
  document: initialDoc,
  categories,
  onDelete,
  onUpdate,
  onAnalysisApplied,
}: DocumentViewerProps) {
  const { setView, selectDocument, setSelectedCategory } = useAppStore()
  const { toast } = useToast()
  const { theme } = useTheme()
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false)

  const [doc, setDoc] = useState<Document>(initialDoc)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(doc.title)
  const [editContent, setEditContent] = useState(doc.content)
  const [editCategoryId, setEditCategoryId] = useState(doc.categoryId || '')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [relatedDocs, setRelatedDocs] = useState<RelatedDocument[]>([])
  const [isRelatedLoading, setIsRelatedLoading] = useState(false)
  const [relatedFetched, setRelatedFetched] = useState(false)
  const [copiedBlockId, setCopiedBlockId] = useState<string | null>(null)

  useEffect(() => {
    setDoc(initialDoc)
    setEditTitle(initialDoc.title)
    setEditContent(initialDoc.content)
    setEditCategoryId(initialDoc.categoryId || '')
    setIsEditing(false)
    setAnalysis(null)
    setRelatedDocs([])
    setRelatedFetched(false)
  }, [initialDoc])

  const handleStar = async () => {
    try {
      const res = await fetch(`/api/documents/${doc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isStarred: !doc.isStarred }),
      })
      if (res.ok) {
        const updated = await res.json()
        setDoc(updated)
        onUpdate(updated)
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось обновить статус', variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/documents/${doc.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Удалено', description: `"${doc.title}" удален из базы знаний` })
        onDelete(doc.id)
        setView('documents')
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось удалить документ', variant: 'destructive' })
    }
  }

  const handleSave = async () => {
    if (!editTitle.trim()) {
      toast({ title: 'Необходим заголовок', variant: 'destructive' })
      return
    }
    setIsSaving(true)
    try {
      const res = await fetch(`/api/documents/${doc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          content: editContent,
          categoryId: editCategoryId && editCategoryId !== 'none' ? editCategoryId : null,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setDoc(updated)
        onUpdate(updated)
        setIsEditing(false)
        toast({ title: 'Сохранено', description: 'Документ успешно обновлен' })
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось сохранить документ', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: doc.content }),
      })
      if (res.ok) {
        const result = await res.json()
        setAnalysis(result)
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось проанализировать документ', variant: 'destructive' })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleApplyAnalysis = async () => {
    if (!analysis) return
    setIsSaving(true)
    try {
      let categoryId = analysis.suggestedCategory?.id || null
      const tagIds = [...analysis.matchedTags.map((t) => t.id)]

      if (analysis.suggestedNewCategory && !categoryId) {
        const catRes = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: analysis.suggestedNewCategory }),
        })
        if (catRes.ok) {
          const newCat = await catRes.json()
          categoryId = newCat.id
        }
      }

      for (const tagName of analysis.newTagNames) {
        const tagRes = await fetch('/api/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: tagName }),
        })
        if (tagRes.ok) {
          const newTag = await tagRes.json()
          tagIds.push(newTag.id)
        }
      }

      const res = await fetch(`/api/documents/${doc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: analysis.summary,
          categoryId,
          tagIds,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setDoc(updated)
        onAnalysisApplied(updated)
        toast({ title: 'Анализ применен', description: 'Предложения AI успешно сохранены' })
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось применить анализ', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const fetchRelatedDocuments = useCallback(async (docId: string) => {
    setIsRelatedLoading(true)
    try {
      const res = await fetch('/api/documents/related', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: docId, limit: 5 }),
      })
      if (res.ok) {
        const data = await res.json()
        setRelatedDocs(data.related || [])
      }
    } catch (error) {
      console.error('Error fetching related documents:', error)
    } finally {
      setIsRelatedLoading(false)
      setRelatedFetched(true)
    }
  }, [])

  useEffect(() => {
    if (doc.id) {
      fetchRelatedDocuments(doc.id)
    }
  }, [doc.id, fetchRelatedDocuments])

  const handleRelatedClick = (relDoc: RelatedDocument) => {
    selectDocument(relDoc.id)
    setView('document-view')
  }

  const handleCopyCodeBlock = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedBlockId(id)
      toast({ title: 'Скопировано', description: 'Код скопирован в буфер обмена' })
      setTimeout(() => setCopiedBlockId(null), 2000)
    }).catch(() => {
      toast({ title: 'Ошибка', description: 'Не удалось скопировать', variant: 'destructive' })
    })
  }, [toast])

  // =========================================================================
  // Editing mode - same pattern as note-editor.tsx
  // =========================================================================
  if (isEditing) {
    return (
      <TerminalFrame title="document/edit" className="m-3 sm:m-4 md:m-6 max-w-4xl mx-auto" headerRight={
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={() => {
            setIsEditing(false)
            setEditTitle(doc.title)
            setEditContent(doc.content)
            setEditCategoryId(doc.categoryId || '')
          }} className="gap-1.5 text-xs h-6">
            <X className="size-3" />
            <span className="hidden sm:inline">Отмена</span>
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-6">
            {isSaving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
            {isSaving ? '...' : 'save'}
          </Button>
        </div>
      }>
        <div className="p-3 sm:p-4 flex flex-col gap-4">
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Заголовок документа"
            className="text-base font-semibold font-mono"
          />
          <div className="flex items-center gap-2">
            <FolderOpen className="size-3.5 text-muted-foreground shrink-0" />
            <Select value={editCategoryId} onValueChange={setEditCategoryId}>
              <SelectTrigger className="w-48 text-xs font-mono h-7">
                <SelectValue placeholder="Категория" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Без категории</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="min-h-[500px] font-mono text-sm resize-y"
            placeholder="markdown..."
          />
        </div>
      </TerminalFrame>
    )
  }

  // =========================================================================
  // View mode - flat layout like notes-view / dictionary-view
  // =========================================================================
  return (
    <TerminalFrame title="document/view" className="m-3 sm:m-4 md:m-6 max-w-4xl mx-auto" headerRight={
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="size-6" onClick={handleStar} title={doc.isStarred ? 'Убрать из избранного' : 'В избранное'}>
          <Star className={cn('size-3.5', doc.isStarred ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground')} />
        </Button>
        <Button variant="ghost" size="sm" className="gap-1 text-xs h-6" onClick={() => setIsEditing(true)}>
          <Edit3 className="size-3" />
          <span className="hidden sm:inline">edit</span>
        </Button>
        <Button variant="ghost" size="icon" className="size-6 text-destructive hover:text-destructive" onClick={() => setShowDeleteDialog(true)}>
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    }>
      <div className="p-3 sm:p-4">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground mb-3">
          <button onClick={() => setView('dashboard')} className="hover:text-foreground transition-colors flex items-center gap-1">
            <LayoutDashboard className="size-3" />
            <span>~</span>
          </button>
          <ChevronRight className="size-3" />
          {doc.category ? (
            <>
              <button onClick={() => { setSelectedCategory(doc.category!.id); setView('documents') }} className="hover:text-foreground transition-colors">
                {doc.category.name}
              </button>
              <ChevronRight className="size-3" />
            </>
          ) : (
            <>
              <button onClick={() => setView('documents')} className="hover:text-foreground transition-colors">
                docs
              </button>
              <ChevronRight className="size-3" />
            </>
          )}
          <span className="text-foreground font-medium truncate">{doc.title}</span>
        </div>

        {/* Title */}
        <div className="flex items-center gap-2 mb-3">
          <FileText className="size-4 text-muted-foreground shrink-0" />
          <h1 className="text-lg sm:text-xl font-bold tracking-tight break-words truncate leading-tight font-mono">
            {doc.title}
          </h1>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 text-[11px] font-mono text-muted-foreground">
          {doc.category && (
            <div className="flex items-center gap-1">
              <FolderOpen className="size-3" />
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono" style={{ backgroundColor: doc.category.color + '20', color: doc.category.color }}>
                {doc.category.name}
              </Badge>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Calendar className="size-3" />
            <span>{formatDate(doc.createdAt)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="size-3" />
            <span>{doc.viewCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <HardDrive className="size-3" />
            <span>{formatFileSize(doc.fileSize)}</span>
          </div>
          <div className="flex items-center gap-1">
            <FileText className="size-3" />
            <span>{doc.fileType.toUpperCase()}</span>
          </div>
        </div>

        {/* Tags */}
        {doc.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            <TagIcon className="size-3 text-muted-foreground shrink-0" />
            {doc.tags.map((dt) => (
              <Badge key={dt.tag.id} variant="outline" className="text-[10px] font-mono" style={{ borderColor: dt.tag.color, color: dt.tag.color }}>
                {dt.tag.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Summary */}
        {doc.summary && (
          <div className="bg-muted rounded-md p-3 mb-3 border border-dashed">
            <p className="text-xs text-foreground break-words leading-relaxed">{doc.summary}</p>
          </div>
        )}

        {/* AI Analysis */}
        <div className="flex items-center gap-2 mb-3">
          <Button variant="outline" size="sm" onClick={handleAnalyze} disabled={isAnalyzing} className="gap-1.5 text-xs h-6 font-mono">
            {isAnalyzing ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
            analyze
          </Button>
          {analysis && !isAnalyzing && (
            <Button variant="outline" size="sm" onClick={handleApplyAnalysis} disabled={isSaving} className="gap-1.5 text-xs h-6 font-mono">
              {isSaving ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
              apply
            </Button>
          )}
        </div>

        {analysis && (
          <div className="border border-dashed rounded-md p-3 mb-3 flex flex-col gap-2 text-xs font-mono">
            <div>
              <span className="text-muted-foreground">summary: </span>
              <span className="text-foreground">{analysis.summary}</span>
            </div>
            <Separator />
            <div>
              <span className="text-muted-foreground">category: </span>
              {analysis.suggestedCategory ? (
                <Badge variant="secondary" className="text-[10px]">{analysis.suggestedCategory.name}</Badge>
              ) : analysis.suggestedNewCategory ? (
                <Badge variant="outline" className="text-[10px]">new: {analysis.suggestedNewCategory}</Badge>
              ) : (
                <span className="text-muted-foreground">--</span>
              )}
            </div>
            {analysis.matchedTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-muted-foreground">tags:</span>
                {analysis.matchedTags.map((t) => (
                  <Badge key={t.id} variant="outline" className="text-[10px]">{t.name}</Badge>
                ))}
                {analysis.newTagNames.map((n, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px]">+{n}</Badge>
                ))}
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Related Documents */}
        <div className="flex flex-col gap-2 my-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <FileSearch className="size-3 text-muted-foreground" />
              <span className="text-[11px] font-mono text-muted-foreground">related</span>
            </div>
            <Button variant="ghost" size="icon" className="size-5" onClick={() => fetchRelatedDocuments(doc.id)} disabled={isRelatedLoading}>
              <RefreshCw className={cn('size-3', isRelatedLoading && 'animate-spin')} />
            </Button>
          </div>

          {isRelatedLoading && (
            <div className="flex flex-col gap-1.5">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-8 rounded-sm" />
              ))}
            </div>
          )}

          {!isRelatedLoading && relatedDocs.length > 0 && (
            <div className="flex flex-col gap-1">
              {relatedDocs.map((relDoc) => (
                <div
                  key={relDoc.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-dashed px-2.5 py-1.5 hover:bg-accent/50 transition-colors cursor-pointer font-mono"
                  onClick={() => handleRelatedClick(relDoc)}
                >
                  <span className="text-xs text-foreground truncate min-w-0">{relDoc.title}</span>
                  <Badge
                    variant="secondary"
                    className={cn(
                      'shrink-0 text-[10px]',
                      relDoc.similarityScore >= 0.8
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : relDoc.similarityScore >= 0.6
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                    )}
                  >
                    {Math.round(relDoc.similarityScore * 100)}%
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {!isRelatedLoading && relatedFetched && relatedDocs.length === 0 && (
            <p className="text-[11px] font-mono text-muted-foreground">-- no related docs</p>
          )}
        </div>

        <Separator />

        {/* Markdown Content */}
        <div className="prose prose-stone dark:prose-invert prose-sm md:prose-base max-w-none break-words [&_pre]:overflow-x-auto [&_code]:break-all [&_a]:break-all mt-3">
          <ReactMarkdown
            components={{
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '')
                const isInline = !match
                const codeText = String(children).replace(/\n$/, '')
                const blockId = `code-${codeText.length}`

                if (isInline) {
                  return (
                    <code
                      className="bg-muted px-1 py-0.5 md:px-1.5 rounded text-foreground text-xs md:text-sm break-all whitespace-pre-wrap"
                      {...props}
                    >
                      {children}
                    </code>
                  )
                }

                return (
                  <div className="group relative">
                    <button
                      className="absolute top-2 right-2 z-10 flex items-center gap-1.5 rounded-md border bg-background/80 backdrop-blur-sm px-2 py-1 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent hover:text-accent-foreground"
                      onClick={() => handleCopyCodeBlock(codeText, blockId)}
                    >
                      {copiedBlockId === blockId ? (
                        <>
                          <Check className="size-3.5 text-green-600 dark:text-green-400" />
                          <span className="text-green-600 dark:text-green-400">ok</span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-3.5" />
                          <span>copy</span>
                        </>
                      )}
                    </button>
                    <SyntaxHighlighter
                      style={mounted && theme === 'dark' ? oneDark : oneLight}
                      language={match[1]}
                      PreTag="div"
                      className="rounded-md text-xs md:text-sm"
                      customStyle={{ overflowX: 'auto' }}
                    >
                      {codeText}
                    </SyntaxHighlighter>
                  </div>
                )
              },
              h1({ children }) {
                return <h1 className="text-xl md:text-2xl font-bold text-foreground mt-4 md:mt-6 mb-2 md:mb-3 leading-tight">{children}</h1>
              },
              h2({ children }) {
                return <h2 className="text-lg md:text-xl font-semibold text-foreground mt-3 md:mt-5 mb-1.5 md:mb-2 leading-tight">{children}</h2>
              },
              h3({ children }) {
                return <h3 className="text-base md:text-lg font-semibold text-foreground mt-3 md:mt-4 mb-1.5 md:mb-2 leading-tight">{children}</h3>
              },
              p({ children }) {
                return <p className="text-muted-foreground leading-relaxed mb-3 md:mb-4">{children}</p>
              },
              ul({ children }) {
                return <ul className="list-disc pl-5 md:pl-6 mb-3 md:mb-4 text-muted-foreground space-y-0.5 md:space-y-1">{children}</ul>
              },
              ol({ children }) {
                return <ol className="list-decimal pl-5 md:pl-6 mb-3 md:mb-4 text-muted-foreground space-y-0.5 md:space-y-1">{children}</ol>
              },
              blockquote({ children }) {
                return <blockquote className="border-l-4 border-border pl-4 italic text-muted-foreground mb-4">{children}</blockquote>
              },
              a({ href, children }) {
                return (
                  <a href={href} className="text-foreground underline hover:text-foreground/80 break-all" target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                )
              },
              table({ children }) {
                return (
                  <div className="overflow-x-auto mb-4">
                    <table className="min-w-full border border-border rounded-md">{children}</table>
                  </div>
                )
              },
              th({ children }) {
                return <th className="border border-border bg-muted px-3 py-2 text-left text-sm font-medium text-foreground">{children}</th>
              },
              td({ children }) {
                return <td className="border border-border px-3 py-2 text-sm text-muted-foreground">{children}</td>
              },
              hr() {
                return <hr className="border-border my-6" />
              },
            }}
          >
            {doc.content}
          </ReactMarkdown>
        </div>

        {/* Back button */}
        <div className="mt-4 pt-3 border-t border-dashed">
          <Button variant="ghost" size="sm" onClick={() => setView('documents')} className="gap-1.5 text-xs font-mono text-muted-foreground">
            <ArrowLeft className="size-3" />
            back
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удаление документа</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить &quot;{doc.title}&quot;? Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TerminalFrame>
  )
}


