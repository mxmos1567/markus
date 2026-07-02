const formatter = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
const monthFormatter = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long' })

export function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return formatter.format(date)
}

export function yearOf(iso: string): number {
  return new Date(iso).getFullYear()
}

export function monthLabelOf(iso: string): string {
  return monthFormatter.format(new Date(iso))
}
