/**
 * Folder input — label-wrapped <input type=file webkitdirectory>.
 *
 * Accepts a folder via the native OS file dialog. The browser returns every
 * file in the folder (recursively) with `file.webkitRelativePath` set to
 * "FolderName/sub/path/file.md". We filter by accepted text extensions and
 * call back with the resulting File[].
 *
 * Note: webkitdirectory is non-standard but supported in all evergreen
 * browsers (Chrome, Firefox, Edge, Safari 11+). iOS Safari still does not
 * support it — users get a single-file picker as graceful fallback.
 */
'use client'

import { FolderUp } from 'lucide-react'

const ACCEPTED_TEXT_EXT = new Set([
  'md', 'adoc', 'txt', 'json', 'js', 'ts', 'tsx', 'jsx',
  'py', 'yaml', 'yml', 'toml', 'xml', 'html', 'css',
  'sql', 'sh', 'csv',
])

export interface FolderInputProps {
  onSelect: (files: File[], folderName: string) => void
  disabled?: boolean
}

function extOf(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? ''
}

function isAccepted(file: File): boolean {
  // Browsers infer type from extension for plain text. Accept either way.
  return ACCEPTED_TEXT_EXT.has(extOf(file.name))
}

export function FolderInput({ onSelect, disabled }: FolderInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files
    if (!list || list.length === 0) return

    // Derive the folder name from the first file's relative path: "Root/..."
    const firstPath = list[0].webkitRelativePath || list[0].name
    const folderName = firstPath.split('/')[0] || 'folder'

    const accepted: File[] = []
    for (let i = 0; i < list.length; i++) {
      const f = list[i]
      if (isAccepted(f) && f.size > 0) accepted.push(f)
    }

    onSelect(accepted, folderName)
    // Reset so the same folder can be re-selected (onChange won't fire twice otherwise)
    e.target.value = ''
  }

  return (
    <label
      htmlFor="upload-folder-input"
      className={
        'block border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center transition-colors ' +
        (disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'cursor-pointer hover:border-primary/50 hover:bg-muted/30')
      }
    >
      <FolderUp className="size-10 mx-auto mb-3 text-muted-foreground" />
      <p className="text-sm text-muted-foreground mb-1">
        Нажмите для выбора папки
      </p>
      <p className="text-xs text-muted-foreground/60">
        Рекурсивно: все поддерживаемые текстовые файлы внутри
        <br />
        (.md, .adoc, .txt, .json, .js, .ts, .py, .yaml, .yml, .toml, .xml, .html, .css, .sql, .sh, .csv)
      </p>
      <input
        type="file"
        id="upload-folder-input"
        webkitdirectory=""
        directory=""
        multiple
        className="sr-only"
        onChange={handleChange}
        disabled={disabled}
        aria-label="Выбрать папку для загрузки"
      />
    </label>
  )
}
