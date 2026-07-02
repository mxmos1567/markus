import { useParams } from 'react-router-dom'
import { useMemoryBySlug } from '../../hooks/useMemoryBySlug'
import { LoadingScreen } from '../../components/common/LoadingScreen'
import { MemoryView } from '../../components/memory/MemoryView'
import { SerifHeading } from '../../components/common/SerifHeading'
import { TimelineLink } from '../../components/common/TimelineLink'

export function MemoryPage() {
  const { slug } = useParams<{ slug: string }>()
  const state = useMemoryBySlug(slug)

  if (state.kind === 'loading') return <LoadingScreen />

  if (state.kind === 'not-found') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
        <SerifHeading className="text-3xl">This memory could not be found.</SerifHeading>
        <p className="max-w-sm text-sm text-mutedgray">
          Check the QR code or link and try again — it may have been removed.
        </p>
        <TimelineLink />
      </div>
    )
  }

  return <MemoryView memory={state.memory} />
}
