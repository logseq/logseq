import React from 'react'
import { Sheet } from '@silk-hq/components'
import './Card.css'

// ================================================================================================
// Root
// ================================================================================================

type SheetRootProps = React.ComponentPropsWithoutRef<typeof Sheet.Root>;
type CardRootProps = Omit<SheetRootProps, 'license'> & {
  license?: SheetRootProps['license'];
};

const CardRoot = React.forwardRef<React.ElementRef<typeof Sheet.Root>, CardRootProps>(
  ({ children, ...restProps }, ref) => {
    return (
      <Sheet.Root license="commercial" {...restProps} ref={ref}>
        {children}
      </Sheet.Root>
    )
  }
)
CardRoot.displayName = 'Card.Root'

// ================================================================================================
// View
// ================================================================================================

const CardView = React.forwardRef<
  React.ElementRef<typeof Sheet.View>,
  React.ComponentPropsWithoutRef<typeof Sheet.View>
>(({ children, className, ...restProps }, ref) => {
  return (
    <Sheet.View
      className={`Card-view ${className ?? ''}`.trim()}
      contentPlacement="center"
      tracks="top"
      enteringAnimationSettings={{
        easing: 'spring',
        stiffness: 260,
        damping: 20,
        mass: 1,
      }}
      nativeEdgeSwipePrevention={true}
      {...restProps}
      ref={ref}
    >
      {children}
    </Sheet.View>
  )
})
CardView.displayName = 'Card.View'

// ================================================================================================
// Backdrop
// ================================================================================================

const CardBackdrop = React.forwardRef<
  React.ElementRef<typeof Sheet.Backdrop>,
  React.ComponentPropsWithoutRef<typeof Sheet.Backdrop>
>(({ className, ...restProps }, ref) => {
  return (
    <Sheet.Backdrop
      className={`Card-backdrop ${className ?? ''}`.trim()}
      travelAnimation={{
        opacity: ({ progress }) => Math.min(0.4 * progress, 0.4),
      }}
      themeColorDimming="auto"
      {...restProps}
      ref={ref}
    />
  )
})
CardBackdrop.displayName = 'Card.Backdrop'

// ================================================================================================
// Content
// ================================================================================================

const CardContent = React.forwardRef<
  React.ElementRef<typeof Sheet.Content>,
  React.ComponentPropsWithoutRef<typeof Sheet.Content>
>(({ children, className, ...restProps }, ref) => {
  return (
    <Sheet.Content
      className={`Card-content ${className ?? ''}`.trim()}
      travelAnimation={{ scale: [0.8, 1] }}
      {...restProps}
      ref={ref}
    >
      {children}
    </Sheet.Content>
  )
})
CardContent.displayName = 'Card.Content'

// ================================================================================================
// Unchanged Components
// ================================================================================================

const CardPortal = Sheet.Portal
const CardTrigger = Sheet.Trigger
const CardHandle = Sheet.Handle
const CardOutlet = Sheet.Outlet
const CardTitle = Sheet.Title
const CardDescription = Sheet.Description

export const Card = {
  Root: CardRoot,
  Portal: CardPortal,
  View: CardView,
  Backdrop: CardBackdrop,
  Content: CardContent,
  Trigger: CardTrigger,
  Handle: CardHandle,
  Outlet: CardOutlet,
  Title: CardTitle,
  Description: CardDescription,
}
