import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'

// @ts-ignore
import { cn } from '@/lib/utils'

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipArrow = TooltipPrimitive.Arrow

const TooltipPortal = TooltipPrimitive.TooltipPortal

/**
 * Internal bordered arrow SVG component (Base UI technique).
 * Creates a seamless "boolean union" effect where the arrow appears as
 * an extension of the tooltip body with continuous border.
 *
 * Uses FILLED PATHS for border (not strokes) - this is more resilient during
 * scale animations and avoids stroke-linecap/linejoin issues at the tip.
 *
 * NOTE: This is positioned via CSS, NOT via Radix's TooltipPrimitive.Arrow.
 * This gives us full control and avoids Radix's positioning recalculations
 * that caused arrow shift after animation.
 */
const BorderedArrowSvg: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg
      width={20}
      height={10}
      viewBox="0 0 20 10"
      fill="none"
      className={cn('ui__tooltip-arrow-svg', className)}
      aria-hidden="true"
    >
      {/* Fill path - background color with overlap rectangle at base */}
      <path
        d="M9.66437 2.60207L4.80758 6.97318C4.07308 7.63423 3.11989 8 2.13172 8H0V10H20V8H18.5349C17.5468 8 16.5936 7.63423 15.8591 6.97318L11.0023 2.60207C10.622 2.2598 10.0447 2.25979 9.66437 2.60207Z"
        className="ui__tooltip-arrow-fill"
        fill="hsl(var(--popover))"
      />
      {/* Border path - filled 1px outline (not a stroke!) */}
      <path
        d="M10.3333 3.34539L5.47654 7.71648C4.55842 8.54279 3.36693 9 2.13172 9H0V8H2.13172C3.11989 8 4.07308 7.63423 4.80758 6.97318L9.66437 2.60207C10.0447 2.25979 10.622 2.2598 11.0023 2.60207L15.8591 6.97318C16.5936 7.63423 17.5468 8 18.5349 8H20V9H18.5349C17.2998 9 16.1083 8.54278 15.1901 7.71648L10.3333 3.34539Z"
        className="ui__tooltip-arrow-border"
        fill="hsl(var(--border))"
      />
    </svg>
  )
}

interface TooltipContentProps
  extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> {
  /**
   * Whether to show the bordered arrow.
   * @default false
   */
  showArrow?: boolean
  /**
   * Additional class name for the arrow element.
   */
  arrowClassName?: string
}

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  TooltipContentProps
>(({ className, sideOffset = 4, showArrow = false, arrowClassName, children, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    // Increase offset when showing arrow to account for arrow height
    sideOffset={showArrow ? 10 : sideOffset}
    className={cn(
      'ui__tooltip-content z-50 rounded-md border bg-popover px-3 py-1.5 text-sm ' +
      'text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out ' +
      'data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 ' +
      'data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
      // Add relative positioning for CSS-positioned arrow
      showArrow ? 'relative' : 'overflow-hidden',
      className
    )}
    {...props}
  >
    {/* Arrow positioned via CSS, NOT Radix - this prevents position recalc issues */}
    {showArrow && (
      <div className={cn('ui__tooltip-arrow', arrowClassName)}>
        <BorderedArrowSvg />
      </div>
    )}
    {children}
  </TooltipPrimitive.Content>
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, TooltipPortal, TooltipArrow }
