'use client'

import { useState, useCallback, useMemo } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { highlightCode } from './semantic-highlight'

export function CopyableCodeBlock({ label, code, accentColor }: { label: string; code: string; accentColor?: string }) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast({ title: 'Скопировано', description: 'Команда скопирована в буфер обмена' })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось скопировать', variant: 'destructive' })
    }
  }, [code, toast])

  const highlighted = useMemo(() => highlightCode(code), [code])

  return (
    <div className="group/code rounded-lg border border-zinc-800 overflow-hidden bg-zinc-950">
      {/* Dark terminal-style header */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span
            className="size-2 rounded-full shrink-0"
            style={{ backgroundColor: accentColor ? accentColor + '99' : '#71717a99' }}
          />
          <span className="text-[11px] font-mono font-medium text-zinc-400">{label}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 gap-1.5 px-2 text-[11px] opacity-0 group-hover/code:opacity-100 transition-opacity font-mono text-zinc-400 hover:text-zinc-200"
          onClick={handleCopy}
        >
          {copied ? (
            <><Check className="size-3 text-terminal-accent" /><span className="text-terminal-accent">ok</span></>
          ) : (
            <><Copy className="size-3" /><span>copy</span></>
          )}
        </Button>
      </div>
      <pre className="px-4 py-3 overflow-x-auto text-[13px] leading-relaxed">
        <code className="font-mono whitespace-pre text-zinc-200/90">{highlighted}</code>
      </pre>
    </div>
  )
}
