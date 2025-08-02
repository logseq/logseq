import React from 'react'
import { Sheet } from '@silk-hq/components'
import './Page.css'

// ================================================================================================
// Root
// ================================================================================================

type SheetRootProps = React.ComponentPropsWithoutRef<typeof Sheet.Root>;
type PageRootProps = Omit<SheetRootProps, 'license'> & {
  license?: SheetRootProps['license'];
};

const PageRoot = React.forwardRef<React.ElementRef<typeof Sheet.Root>, PageRootProps>(
  ({ children, ...restProps }, ref) => {
    return (
      <Sheet.Root license="commercial" {...restProps} ref={ref}>
        {children}
      </Sheet.Root>
    )
  }
)
PageRoot.displayName = 'Page.Root'

// ================================================================================================
// View
// ================================================================================================

const PageView = React.forwardRef<
  React.ElementRef<typeof Sheet.View>,
  React.ComponentPropsWithoutRef<typeof Sheet.View>
>(({ children, className, ...restProps }, ref) => {
  return (
    <Sheet.View
      className={`Page-view ${className ?? ''}`.trim()}
      contentPlacement="right"
      swipeOvershoot={false}
      nativeEdgeSwipePrevention={true}
      {...restProps}
      ref={ref}
    >
      {children}
    </Sheet.View>
  )
})
PageView.displayName = 'Page.View'

// ================================================================================================
// Backdrop
// ================================================================================================

const PageBackdrop = React.forwardRef<
  React.ElementRef<typeof Sheet.Backdrop>,
  React.ComponentPropsWithoutRef<typeof Sheet.Backdrop>
>(({ className, ...restProps }, ref) => {
  return (
    <Sheet.Backdrop
      className={`Page-backdrop ${className ?? ''}`.trim()}
      {...restProps}
      ref={ref}
    />
  )
})
PageBackdrop.displayName = 'Page.Backdrop'

// ================================================================================================
// Content
// ================================================================================================

const PageContent = React.forwardRef<
  React.ElementRef<typeof Sheet.Content>,
  React.ComponentPropsWithoutRef<typeof Sheet.Content>
>(({ children, className, ...restProps }, ref) => {
  return (
    <Sheet.Content className={`Page-content ${className ?? ''}`.trim()} {...restProps} ref={ref}>
      {children}
    </Sheet.Content>
  )
})
PageContent.displayName = 'Page.Content'

// ================================================================================================
// Unchanged Components
// ================================================================================================

const PagePortal = Sheet.Portal
const PageTrigger = Sheet.Trigger
const PageHandle = Sheet.Handle
const PageOutlet = Sheet.Outlet
const PageTitle = Sheet.Title
const PageDescription = Sheet.Description

export const Page = {
  Root: PageRoot,
  Portal: PagePortal,
  View: PageView,
  Backdrop: PageBackdrop,
  Content: PageContent,
  Trigger: PageTrigger,
  Handle: PageHandle,
  Outlet: PageOutlet,
  Title: PageTitle,
  Description: PageDescription,
}
