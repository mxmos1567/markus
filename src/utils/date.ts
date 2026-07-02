const formatter = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
const monthYearFormatter = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long' })

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

/** Memory dates are either "YYYY-MM-DD" (exact) or "YYYY-MM" (month only, day unknown). */
export function hasExactDay(date: string): boolean {
  return date.length >= 10
}

export function parseYearMonth(date: string): { year: number; month: number } {
  const [year, month] = date.split('-').map(Number)
  return { year, month }
}

export function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return formatter.format(date)
}

/** "July 2, 2026" for exact dates, "July 2026" when only the month is known. */
export function formatApproximateDate(date: string): string {
  if (hasExactDay(date)) return formatDate(date)
  const { year, month } = parseYearMonth(date)
  return `${MONTH_NAMES[month - 1] ?? ''} ${year}`.trim()
}

export function yearOf(date: string): number {
  return parseYearMonth(date).year
}

/** Calendar month, 1-12, independent of year — for "this month" matching. */
export function monthOf(date: string): number {
  return parseYearMonth(date).month
}

/** "July 2026" — a distinct label per year+month, e.g. for the timeline's month filter. */
export function monthLabelOf(date: string): string {
  return monthYearFormatter.format(new Date(date))
}

export function yearsAgo(year: number): string {
  const diff = new Date().getFullYear() - year
  if (diff <= 0) return 'This year'
  if (diff === 1) return '1 year ago'
  return `${diff} years ago`
}
