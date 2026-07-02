import { labelsPerSheet, type LabelTemplate } from './labelTemplates'

export type LabelCell<T> = { kind: 'blocked' } | { kind: 'empty' } | { kind: 'content'; item: T }

/**
 * Lays out a batch of items onto one or more label sheets, in reading
 * order (left-to-right, top-to-bottom). On the first sheet, positions
 * before `startIndex` are marked "blocked" — labels already peeled off
 * a partially-used physical sheet — and printing begins at
 * `startIndex`. If items overflow the first sheet's remaining
 * capacity, printing automatically continues on additional full
 * sheets. Any leftover positions on the last sheet are "empty".
 */
export function paginateLabels<T>(template: LabelTemplate, startIndex: number, items: T[]): LabelCell<T>[][] {
  const perSheet = labelsPerSheet(template)
  const sheets: LabelCell<T>[][] = []
  let itemIndex = 0
  let sheetIndex = 0

  do {
    const sheetStart = sheetIndex === 0 ? Math.min(startIndex, perSheet) : 0
    const sheet: LabelCell<T>[] = []
    for (let position = 0; position < perSheet; position++) {
      if (position < sheetStart) {
        sheet.push({ kind: 'blocked' })
      } else if (itemIndex < items.length) {
        sheet.push({ kind: 'content', item: items[itemIndex] })
        itemIndex++
      } else {
        sheet.push({ kind: 'empty' })
      }
    }
    sheets.push(sheet)
    sheetIndex++
  } while (itemIndex < items.length)

  return sheets
}
