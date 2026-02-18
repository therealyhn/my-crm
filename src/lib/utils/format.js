export function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString()
}

export function formatHours(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '0'
  return Number(value).toFixed(2)
}

export function formatCurrency(value) {
  const amount = Number(value)
  if (Number.isNaN(amount)) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}
