import { Link } from 'react-router-dom'

export function TimelineLink({ className = '' }: { className?: string }) {
  return (
    <Link
      to="/timeline"
      className={`inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-mutedgray transition-colors duration-300 hover:text-gold-soft ${className}`}
    >
      <span aria-hidden className="h-px w-6 bg-current opacity-60" />
      The Timeline
    </Link>
  )
}
