import { cellRect, labelsPerSheet, type LabelTemplate } from '../../../domain/labelTemplates'

const SCALE = 0.42

interface Props {
  template: LabelTemplate
  startIndex: number
  onPick: (index: number) => void
}

/**
 * A single sheet of clickable cells for choosing where printing should
 * begin — for reusing a label sheet that already has some labels
 * peeled off. Positions before the chosen one are shown as already
 * used (■); the chosen position and everything after are free (□) and
 * will receive the next printed labels in order.
 */
export function LabelStartPicker({ template, startIndex, onPick }: Props) {
  const count = labelsPerSheet(template)

  return (
    <div
      className="overflow-hidden rounded-sm border border-line/60"
      style={{
        width: `calc(${template.pageWidthMm}mm * ${SCALE})`,
        height: `calc(${template.pageHeightMm}mm * ${SCALE})`,
      }}
    >
      <div
        className="relative bg-white"
        style={{
          width: `${template.pageWidthMm}mm`,
          height: `${template.pageHeightMm}mm`,
          transform: `scale(${SCALE})`,
          transformOrigin: 'top left',
        }}
      >
        {Array.from({ length: count }).map((_, index) => {
          const rect = cellRect(template, index)
          const used = index < startIndex
          return (
            <button
              key={index}
              type="button"
              title={used ? 'Already used' : 'Start printing here'}
              onClick={() => onPick(index)}
              className={used ? 'absolute bg-line/70' : 'absolute bg-transparent border border-gold/50 hover:bg-gold/20'}
              style={{
                left: `${rect.leftMm}mm`,
                top: `${rect.topMm}mm`,
                width: `${rect.widthMm}mm`,
                height: `${rect.heightMm}mm`,
                borderRadius: `${template.cornerRadiusMm}mm`,
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
