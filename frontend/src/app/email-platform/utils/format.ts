const DEFAULT_LOCALE = 'zh-CN'

export function formatDateTime(value?: string | number | Date | null): string {
  if (value === null || value === undefined || value === '') return '-'

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleString(DEFAULT_LOCALE)
}

export function formatDate(value?: string | number | Date | null): string {
  if (value === null || value === undefined || value === '') return '-'

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleDateString(DEFAULT_LOCALE)
}

export function formatAmount(value: number | string, digits: number = 2): string {
  const amount = Number(value)
  if (Number.isNaN(amount)) return '0.00'
  return amount.toFixed(digits)
}
