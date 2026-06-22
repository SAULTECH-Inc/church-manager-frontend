import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, style, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-xl px-3 py-2 text-sm text-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-white/30 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      style={{
        backgroundColor: 'var(--input-bg)',
        border: '1px solid rgb(var(--inv) / 0.10)',
        ...style,
      }}
      onFocus={e => { e.currentTarget.style.borderColor = 'rgba(124,107,255,0.6)'; e.currentTarget.style.boxShadow = '0 0 0 1px rgba(124,107,255,0.3)' }}
      onBlur={e => { e.currentTarget.style.borderColor = 'rgb(var(--inv) / 0.10)'; e.currentTarget.style.boxShadow = 'none' }}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = 'Input'

export { Input }
