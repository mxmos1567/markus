import type { ElementType, ReactNode } from 'react'

interface SerifHeadingProps {
  as?: ElementType
  children: ReactNode
  className?: string
}

export function SerifHeading({ as: Tag = 'h1', children, className = '' }: SerifHeadingProps) {
  return (
    <Tag className={`font-display text-balance text-warmwhite ${className}`}>
      {children}
    </Tag>
  )
}
