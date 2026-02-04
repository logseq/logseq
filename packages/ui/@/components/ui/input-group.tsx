import * as React from 'react'

import { Button, type ButtonProps } from '@/components/ui/button'
// @ts-ignore
import { cn } from '@/lib/utils'

export interface InputGroupProps
  extends React.HTMLAttributes<HTMLDivElement> {}

const InputGroup = React.forwardRef<HTMLDivElement, InputGroupProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex w-full flex-col gap-2 rounded-lg border border-input bg-background p-2 ring-offset-background ' +
          'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        className
      )}
      {...props}
    />
  )
)
InputGroup.displayName = 'InputGroup'

export interface InputGroupAddonProps
  extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'block-start' | 'block-end' | 'center'
}

const InputGroupAddon = React.forwardRef<HTMLDivElement, InputGroupAddonProps>(
  ({ className, align = 'center', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center gap-2 text-sm text-muted-foreground',
        align === 'block-start' && 'mb-auto',
        align === 'block-end' && 'mt-auto',
        className
      )}
      {...props}
    />
  )
)
InputGroupAddon.displayName = 'InputGroupAddon'

export interface InputGroupTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const InputGroupTextarea = React.forwardRef<
  HTMLTextAreaElement,
  InputGroupTextareaProps
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'min-h-[44px] w-full flex-1 resize-none border-0 bg-transparent px-0 py-1 text-sm leading-relaxed ' +
        'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0',
      className
    )}
    {...props}
  />
))
InputGroupTextarea.displayName = 'InputGroupTextarea'

export interface InputGroupButtonProps extends ButtonProps {}

const InputGroupButton = React.forwardRef<
  HTMLButtonElement,
  InputGroupButtonProps
>(({ className, ...props }, ref) => (
  <Button ref={ref} className={cn('shrink-0', className)} {...props} />
))
InputGroupButton.displayName = 'InputGroupButton'

export { InputGroup, InputGroupAddon, InputGroupTextarea, InputGroupButton }
