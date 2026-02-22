import * as React from 'react'
import { cn } from '@/lib/utils'

function Select({ children, value, onValueChange, ...props }) {
  return (
    <select
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
      className={cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        props.className
      )}
      {...props}
    >
      {children}
    </select>
  )
}

export { Select }
