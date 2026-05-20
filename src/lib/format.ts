export function pluralize(n: number, forms: [string, string, string]): string {
  const abs = n % 100
  const last = abs % 10
  if (abs > 10 && abs < 20) return forms[2]
  if (last === 1) return forms[0]
  if (last > 1 && last < 5) return forms[1]
  return forms[2]
}

// Native Intl formatter — replaces date-fns (saves ~21 MB from bundle)
const dateFmt = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export function formatDate(dateStr: string): string {
  return dateFmt.format(new Date(dateStr))
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

export function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then

  if (diffMs < 0) return 'только что'

  const seconds = Math.floor(diffMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return 'только что'
  if (minutes < 60) {
    return `${minutes} ${pluralize(minutes, ['мин назад', 'мин назад', 'мин назад'])}`
  }
  if (hours < 24) {
    return `${hours} ${pluralize(hours, ['час назад', 'часа назад', 'часов назад'])}`
  }
  if (days === 1) return 'вчера'
  if (days < 7) {
    return `${days} ${pluralize(days, ['день назад', 'дня назад', 'дней назад'])}`
  }
  return formatDate(dateStr)
}
