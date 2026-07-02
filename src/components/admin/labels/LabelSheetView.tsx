import type { CSSProperties } from 'react'
import type { LabelCell } from '../../../domain/labelLayout'
import { cellRect, type LabelTemplate } from '../../../domain/labelTemplates'

export interface LabelItem {
  qrDataUrl: string
  text?: string
}

export function LabelSheetView({
  template,
  cells,
  scale,
}: {
  template: LabelTemplate
  cells: LabelCell<LabelItem>[]
  scale: number
}) {
  return (
    <div
      className="label-sheet-frame"
      style={{
        width: `calc(${template.pageWidthMm}mm * ${scale})`,
        height: `calc(${template.pageHeightMm}mm * ${scale})`,
      }}
    >
      <div
        className="label-sheet relative"
        style={
          {
            width: `${template.pageWidthMm}mm`,
            height: `${template.pageHeightMm}mm`,
            '--label-scale': scale,
          } as CSSProperties
        }
      >
        {cells.map((cell, index) => {
          const rect = cellRect(template, index)
          const style: CSSProperties = {
            left: `${rect.leftMm}mm`,
            top: `${rect.topMm}mm`,
            width: `${rect.widthMm}mm`,
            height: `${rect.heightMm}mm`,
            borderRadius: `${template.cornerRadiusMm}mm`,
          }
          if (cell.kind !== 'content') {
            return <div key={index} className="absolute" style={style} />
          }
          return (
            <div key={index} className="absolute flex items-center gap-[0.5mm] overflow-hidden" style={style}>
              <img
                src={cell.item.qrDataUrl}
                alt=""
                style={{ height: `${rect.heightMm - 1}mm`, width: `${rect.heightMm - 1}mm` }}
                className="shrink-0"
              />
              {cell.item.text && (
                <span
                  className="truncate leading-none text-black"
                  style={{ fontSize: '2.1mm' }}
                >
                  {cell.item.text}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
