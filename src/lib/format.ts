import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

export function pluralize(n: number, forms: [string, string, string]): string {
  const abs = n % 100
  const last = abs % 10
  if (abs > 10 && abs < 20) return forms[2]
  if (last === 1) return forms[0]
  if (last > 1 && last < 5) return forms[1]
  return forms[2]
}

export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'd MMM yyyy', { locale: ru })
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Б'
  const k = 1024
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1)
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export function pluralDocs(n: number): string {
  return pluralize(n, ['документ', 'документа', 'документов'])
}

export function pluralTerms(n: number): string {
  return pluralize(n, ['термин', 'термина', 'терминов'])
}
