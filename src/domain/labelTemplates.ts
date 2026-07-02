/**
 * A label sheet template describes a regular grid of labels on a page,
 * in millimeters. Adding a new template — a different Avery sheet, a
 * different page size — is just adding an entry to LABEL_TEMPLATES;
 * every other part of the label printing system (layout, preview,
 * print CSS) is generic and reads these numbers, never a template id.
 */
export interface LabelTemplate {
  id: string
  name: string
  pageWidthMm: number
  pageHeightMm: number
  columns: number
  rows: number
  labelWidthMm: number
  labelHeightMm: number
  /** Distance from the page's left edge to the first column's left edge. */
  marginLeftMm: number
  /** Distance from the page's top edge to the first row's top edge. */
  marginTopMm: number
  /** Left-edge-to-left-edge horizontal spacing between columns. */
  pitchXMm: number
  /** Top-edge-to-top-edge vertical spacing between rows. */
  pitchYMm: number
  cornerRadiusMm: number
}

// Geometry per Avery's own template definition: A4, 17.8x10mm labels,
// 10 columns x 27 rows, first label at (6mm, 13mm), 20.3mm horizontal /
// 10mm vertical pitch, 1.6mm corner radius.
export const AVERY_L4730REV_25: LabelTemplate = {
  id: 'avery-l4730rev-25',
  name: 'Avery L4730REV-25 (17.8 × 10mm, 270/sheet)',
  pageWidthMm: 210,
  pageHeightMm: 297,
  columns: 10,
  rows: 27,
  labelWidthMm: 17.8,
  labelHeightMm: 10,
  marginLeftMm: 6,
  marginTopMm: 13,
  pitchXMm: 20.3,
  pitchYMm: 10,
  cornerRadiusMm: 1.6,
}

export const LABEL_TEMPLATES: LabelTemplate[] = [AVERY_L4730REV_25]

export function getLabelTemplate(id: string): LabelTemplate {
  return LABEL_TEMPLATES.find((template) => template.id === id) ?? LABEL_TEMPLATES[0]
}

export function labelsPerSheet(template: LabelTemplate): number {
  return template.columns * template.rows
}

export interface LabelCellRect {
  leftMm: number
  topMm: number
  widthMm: number
  heightMm: number
}

/** Cells are indexed row-major, left-to-right then top-to-bottom (reading order). */
export function cellRect(template: LabelTemplate, index: number): LabelCellRect {
  const row = Math.floor(index / template.columns)
  const column = index % template.columns
  return {
    leftMm: template.marginLeftMm + column * template.pitchXMm,
    topMm: template.marginTopMm + row * template.pitchYMm,
    widthMm: template.labelWidthMm,
    heightMm: template.labelHeightMm,
  }
}
