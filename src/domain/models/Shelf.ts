import type { Entity } from './common'

export interface Shelf extends Entity {
  name: string
  slug: string
  description: string
  rows: number
  columns: number
}

export interface CreateShelfInput {
  name: string
  description: string
  rows: number
  columns: number
}

/** Column letters run A, B, C… Z, AA, AB… like spreadsheet columns. */
export function columnLabel(index: number): string {
  let n = index + 1
  let label = ''
  while (n > 0) {
    const rem = (n - 1) % 26
    label = String.fromCharCode(65 + rem) + label
    n = Math.floor((n - 1) / 26)
  }
  return label
}

/** Generates slot codes for a shelf, e.g. A1..A7, B1..B7 for a 7x7 shelf. */
export function generateSlotCodes(rows: number, columns: number): string[] {
  const codes: string[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      codes.push(`${columnLabel(r)}${c + 1}`)
    }
  }
  return codes
}
