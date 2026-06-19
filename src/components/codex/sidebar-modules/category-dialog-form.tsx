'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface CategoryManualFormProps {
  name: string
  onNameChange: (v: string) => void
  color: string
  onColorChange: (v: string) => void
  isCreating: boolean
  onCreate: () => void
  autoFocus: boolean
}

export function CategoryManualForm({
  name,
  onNameChange,
  color,
  onColorChange,
  isCreating,
  onCreate,
  autoFocus,
}: CategoryManualFormProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="cat-name">Название</Label>
        <Input
          id="cat-name"
          placeholder="Введите название"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onCreate()}
          autoFocus={autoFocus}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="cat-color">Цвет</Label>
        <div className="flex items-center gap-3">
          <input
            id="cat-color"
            type="color"
            value={color}
            onChange={(e) => onColorChange(e.target.value)}
            className="size-9 rounded-md border border-input cursor-pointer"
          />
          <span className="text-sm text-muted-foreground">{color}</span>
        </div>
      </div>
      <Button onClick={onCreate} disabled={!name.trim() || isCreating}>
        {isCreating ? 'Создание...' : 'Создать вручную'}
      </Button>
    </div>
  )
}
