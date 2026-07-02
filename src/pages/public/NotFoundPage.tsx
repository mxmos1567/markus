import { SerifHeading } from '../../components/common/SerifHeading'
import { TimelineLink } from '../../components/common/TimelineLink'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <SerifHeading className="text-3xl">This page does not exist.</SerifHeading>
      <TimelineLink />
    </div>
  )
}
