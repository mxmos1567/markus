import type { ReactNode } from 'react'
import type { LabelTemplate } from '../../../domain/labelTemplates'

/**
 * Wraps the rendered label sheets for both the on-screen preview and
 * the actual print output (same markup, see .label-sheet-frame /
 * .label-sheet in index.css). The page size for @page comes from the
 * template's own dimensions, so a future non-A4 template prints
 * correctly with no changes here.
 */
export function LabelPrintArea({ template, children }: { template: LabelTemplate; children: ReactNode }) {
  return (
    <>
      <style>{`@page { size: ${template.pageWidthMm}mm ${template.pageHeightMm}mm; margin: 0; }`}</style>
      <div className="label-print-area flex flex-col items-start gap-4">{children}</div>
    </>
  )
}
