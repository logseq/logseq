import * as React from 'react'

// @ts-ignore
import { cn } from '@/lib/utils'

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'ui__textarea',
          'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 ' +
          'py-2 text-sm placeholder:text-muted-foreground focus:border-input ' +
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ' +
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
