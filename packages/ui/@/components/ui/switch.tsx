import * as React from 'react'
import * as SwitchPrimitives from '@radix-ui/react-switch'

// @ts-ignore
import { cn } from '@/lib/utils'

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> & { size?: string }
>(({ className, size, ...props }, ref) => {
    const isSmall = size === 'sm'
    return (<SwitchPrimitives.Root
      className={cn(
        'ui__switch',
        isSmall ? 'h-4 w-8' : 'h-6 w-11',
        'peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 ' +
        'border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ' +
        'focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed ' +
        'disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
        className
      )}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          isSmall ? 'h-3 w-3 data-[state=checked]:translate-x-4' : 'h-5 w-5 data-[state=checked]:translate-x-5',
          'pointer-events-none block rounded-full bg-background shadow-lg ' +
          'ring-0 transition-transform data-[state=unchecked]:translate-x-0'
        )}
      />
    </SwitchPrimitives.Root>)
  }
)
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
