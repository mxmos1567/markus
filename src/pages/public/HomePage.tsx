import { SerifHeading } from '../../components/common/SerifHeading'
import { GoldDivider } from '../../components/common/GoldDivider'
import { TimelineLink } from '../../components/common/TimelineLink'

export function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="animate-fade-in max-w-lg space-y-6">
        <p className="text-xs uppercase tracking-[0.35em] text-gold">Memory Shelf</p>
        <SerifHeading className="text-4xl md:text-5xl">A digital museum for memories.</SerifHeading>
        <p className="text-sm leading-relaxed text-mutedgray">
          Every compartment on the shelf holds one memory. Scan the QR code inside a shelf compartment to open it —
          there is no list to browse, only the moment you were meant to find.
        </p>
        <GoldDivider className="mx-auto w-16" />
        <TimelineLink className="justify-center" />
      </div>
    </div>
  )
}
