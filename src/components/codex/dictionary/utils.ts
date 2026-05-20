export function getTermPlural(n: number): string {
  const abs = Math.abs(n) % 100
  const lastDigit = abs % 10
  if (abs > 10 && abs < 20) return 'терминов'
  if (lastDigit > 1 && lastDigit < 5) return 'термина'
  if (lastDigit === 1) return 'термин'
  return 'терминов'
}

export function getGroupKey(term: string): string {
  const letter = term.charAt(0).toUpperCase()
  if (/[A-Z]/.test(letter)) return letter
  if (/[А-ЯЁ]/.test(letter)) return letter
  return '#'
}
