import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

// @ts-ignore
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm gap-1 ' +
  'font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none ' +
  'disabled:opacity-50 select-none',
  {
    variants: {
      variant: {
        default:
          'bg-primary/90 hover:bg-primary/100 active:opacity-90 text-primary-foreground hover:text-primary-foreground as-classic',
        solid:
          'bg-primary/90 hover:bg-primary/100 active:opacity-90 text-primary-foreground hover:text-primary-foreground as-solid',
        destructive:
          'bg-destructive/90 hover:bg-destructive/100 active:opacity-90 text-destructive-foreground hover:text-destructive-foreground as-destructive',
        outline:
          'border bg-background hover:bg-accent hover:text-accent-foreground active:opacity-80 as-outline',
        secondary:
          'bg-secondary/70 text-secondary-foreground hover:bg-secondary/100 active:opacity-80 as-secondary',
        ghost:
          'hover:bg-secondary/70 hover:text-secondary-foreground active:opacity-80 as-ghost',
        link:
          'text-primary underline-offset-4 hover:underline active:opacity-80 as-link',
      },
      size: {
        default: 'h-10 px-4 py-2',
        md: 'h-9 px-4 rounded-md py-2',
        lg: 'h-11 text-base rounded-md px-8',
        sm: 'h-7 rounded px-3 py-1',
        xs: 'h-6 text-xs rounded px-3',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(
          'ui__button',
          buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
