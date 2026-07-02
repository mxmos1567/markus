import { type ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'primary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-gold text-void-deep hover:bg-gold-soft border border-gold/60',
  ghost:
    'bg-transparent text-warmwhite border border-line hover:border-gold/50 hover:text-gold-soft',
  danger:
    'bg-transparent text-red-300 border border-red-400/30 hover:bg-red-400/10 hover:border-red-400/60',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', className = '', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 rounded-sm px-5 py-2.5 text-sm tracking-wide transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-40 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  )
})
