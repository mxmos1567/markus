import { useParams } from 'react-router-dom'
import { useSlotMemory } from '../../hooks/useSlotMemory'
import { LoadingScreen } from '../../components/common/LoadingScreen'
import { EmptySlotPage } from './EmptySlotPage'
import { MemoryView } from '../../components/memory/MemoryView'
import { SerifHeading } from '../../components/common/SerifHeading'
import { TimelineLink } from '../../components/common/TimelineLink'

export function SlotPage() {
  const { shelf: shelfSlug, slot: code } = useParams<{ shelf: string; slot: string }>()
  const state = useSlotMemory(shelfSlug, code)

  if (state.kind === 'loading') return <LoadingScreen />

  if (state.kind === 'not-found') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
        <SerifHeading className="text-3xl">No such compartment exists.</SerifHeading>
        <p className="max-w-sm text-sm text-mutedgray">
          The shelf or slot in this link could not be found. Check the QR code and try again.
        </p>
        <TimelineLink />
      </div>
    )
  }

  if (state.kind === 'private') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
        <SerifHeading className="text-3xl">This memory is kept private.</SerifHeading>
        <p className="max-w-sm text-sm text-mutedgray">Only the archive's owner may open this compartment.</p>
        <TimelineLink />
      </div>
    )
  }

  if (state.kind === 'empty') {
    return <EmptySlotPage shelf={state.shelf} slot={state.slot} />
  }

  return <MemoryView memory={state.memory} />
}
