import React, { createContext, useContext, useRef, useState } from 'react'
import { createComponentId, Island, Sheet, SheetStack } from '@silk-hq/components'
import './ParallaxPage.css'

// ================================================================================================
// Utils
// ================================================================================================

const setRefs = <T, >(...refs: (React.Ref<T> | undefined)[]): ((node: T) => void) => {
  return (node: T) => {
    refs.forEach((ref) => {
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        // @ts-ignore - intentionally breaking the readonly nature for compatibility
        ref.current = node
      }
    })
  }
}

// ================================================================================================
// Stack Id
// ================================================================================================

const ParallaxPageExampleStackId = createComponentId()

// ================================================================================================
// StackRoot Context
// ================================================================================================

type ParallaxPageStackRootContextValue = {
  pageContainer: HTMLElement | null;
  setPageContainer: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
  dismissTriggerContainerRef: React.RefObject<HTMLDivElement>;
  topBarTitleContainerRef: React.RefObject<HTMLDivElement>;
};

const ParallaxPageStackRootContext = createContext<ParallaxPageStackRootContextValue | null>(null)
const useParallaxPageStackRootContext = () => {
  const context = useContext(ParallaxPageStackRootContext)
  if (!context) {
    throw new Error(
      'useParallaxPageStackRootContext must be used within a ParallaxPageStackRootContext'
    )
  }
  return context
}

// ================================================================================================
// Stack Root
// ================================================================================================

// In this component, the stack root is designed to receive the
// parallax page Views.

const ParallaxPageStackRoot = React.forwardRef<
  React.ElementRef<typeof SheetStack.Root>,
  React.ComponentPropsWithoutRef<typeof SheetStack.Root>
>(({ componentId, ...restProps }, ref) => {
  const [pageContainer, setPageContainer] = useState<HTMLElement | null>(null)
  const dismissTriggerContainerRef = useRef<HTMLDivElement>(null)
  const topBarTitleContainerRef = useRef<HTMLDivElement>(null)

  return (
    <ParallaxPageStackRootContext.Provider
      value={{
        pageContainer,
        setPageContainer,
        dismissTriggerContainerRef,
        topBarTitleContainerRef,
      }}
    >
      <SheetStack.Root
        //  Using a componentId to associate the SheetStack
        //  with the ParallaxPageStackIslandRoot
        componentId={componentId ?? ParallaxPageExampleStackId}
        {...restProps}
        ref={setRefs(ref, setPageContainer)}
      />
    </ParallaxPageStackRootContext.Provider>
  )
})
ParallaxPageStackRoot.displayName = 'ParallaxPageStack.Root'

// ================================================================================================
// Stack Scenery Outlet
// ================================================================================================

// An outlet meant to wrap the content below the stack for the
// initial parallax effect.

const ParallaxPageStackSceneryOutlet = React.forwardRef<
  React.ElementRef<typeof SheetStack.Outlet>,
  React.ComponentPropsWithoutRef<typeof SheetStack.Outlet>
>((props, ref) => {
  return (
    <SheetStack.Outlet
      stackingAnimation={{
        transformOrigin: '50% 0px',
        translateX: ({ progress }) => (progress <= 1 ? progress * -80 + 'px' : '-80px'),
      }}
      {...props}
      ref={ref}
    />
  )
})
ParallaxPageStackSceneryOutlet.displayName = 'ParallaxPageStack.SceneryOutlet'

// ================================================================================================
// Stack Island Root
// ================================================================================================

// An Island meant to wrap the top bar, but which can be used
// elsewhere as well.

const ParallaxPageStackIslandRoot = React.forwardRef<
  React.ElementRef<typeof Island.Root>,
  React.ComponentPropsWithoutRef<typeof Island.Root>
>(({ forComponent, ...restProps }, ref) => {
  return (
    <Island.Root
      forComponent={forComponent ?? ParallaxPageExampleStackId}
      {...restProps}
      ref={ref}
    />
  )
})
ParallaxPageStackIslandRoot.displayName = 'ParallaxPageStack.IslandRoot'

// ================================================================================================
// Stack Island Content
// ================================================================================================

const ParallaxPageStackIslandContent = Island.Content

// ================================================================================================
// Stack Top Bar Dismiss Trigger Container
// ================================================================================================

// A container meant to receive the parallax pages dismiss
// triggers in the top bar.

const ParallaxPageStackTopBarDismissTriggerContainer = ({
  className,
  ...restProps
}: React.ComponentPropsWithoutRef<'div'>) => {
  const { dismissTriggerContainerRef } = useParallaxPageStackRootContext()

  return (
    <div
      className={`ParallaxPage-stackTopBarDismissTriggerContainer ${className ?? ''}`.trim()}
      {...restProps}
      ref={dismissTriggerContainerRef}
    />
  )
}
ParallaxPageStackTopBarDismissTriggerContainer.displayName =
  'ParallaxPageStack.TopBarDismissTriggerContainer'

// ================================================================================================
// Stack Top Bar Title Outlet
// ================================================================================================

// An outlet meant to wrap the initial title of the top bar.

const ParallaxPageStackTopBarTitleOutlet = React.forwardRef<
  React.ElementRef<typeof SheetStack.Outlet>,
  React.ComponentPropsWithoutRef<typeof SheetStack.Outlet>
>(({ stackingAnimation, ...restProps }, ref) => {
  return (
    <SheetStack.Outlet
      stackingAnimation={{
        opacity: ({ progress }) => 0.75 - (1 / 0.75) * (progress - 0.25),
        ...stackingAnimation,
      }}
      {...restProps}
      ref={ref}
    />
  )
})
ParallaxPageStackTopBarTitleOutlet.displayName = 'ParallaxPageStack.TopBarTitleOutlet'

// ================================================================================================
// Stack Top Bar Title Container
// ================================================================================================

// A container meant to receive the parallax pages titles in the
// top bar.

const ParallaxPageStackTopBarTitleContainer = ({
  className,
  ...restProps
}: React.ComponentPropsWithoutRef<'div'>) => {
  const { topBarTitleContainerRef } = useParallaxPageStackRootContext()

  return (
    <div
      className={`ParallaxPage-stackTopBarTitleContainer ${className ?? ''}`.trim()}
      {...restProps}
      ref={topBarTitleContainerRef}
    />
  )
}
ParallaxPageStackTopBarTitleContainer.displayName = 'ParallaxPageStack.TopBarTitleContainer'

// ================================================================================================
// Root
// ================================================================================================

type SheetRootProps = React.ComponentPropsWithoutRef<typeof Sheet.Root>;
type ParallaxPageRootProps = Omit<SheetRootProps, 'license'> & {
  license?: SheetRootProps['license'];
};

const ParallaxPageRoot = React.forwardRef<
  React.ElementRef<typeof Sheet.Root>,
  ParallaxPageRootProps
>((props, ref) => {
  return (
    <Sheet.Root
      license="commercial"
      // By default, the Sheet will be associated with the
      // closest SheetStack
      forComponent="closest"
      {...props}
      ref={ref}
    />
  )
})
ParallaxPageRoot.displayName = 'ParallaxPage.Root'

// ================================================================================================
// View Portal
// ================================================================================================

// A portal that will render the View in the stack root by
// default.

const ParallaxPageViewPortal = (props: React.ComponentPropsWithoutRef<typeof Sheet.Portal>) => {
  const { pageContainer } = useParallaxPageStackRootContext()

  return <Sheet.Portal container={pageContainer as HTMLElement} {...props} />
}
ParallaxPageViewPortal.displayName = 'ParallaxPage.ViewPortal'

// ================================================================================================
// View
// ================================================================================================

const ParallaxPageView = React.forwardRef<
  React.ElementRef<typeof Sheet.View>,
  React.ComponentPropsWithoutRef<typeof Sheet.View>
>(
  (
    { className, contentPlacement, swipeOvershoot, nativeEdgeSwipePrevention, ...restProps },
    ref
  ) => {
    return (
      <Sheet.View
        className={`ParallaxPage-view ${className ?? ''}`.trim()}
        contentPlacement={contentPlacement ?? 'right'}
        swipeOvershoot={swipeOvershoot ?? false}
        nativeEdgeSwipePrevention={nativeEdgeSwipePrevention ?? true}
        {...restProps}
        ref={ref}
      />
    )
  }
)
ParallaxPageView.displayName = 'ParallaxPage.View'

// ================================================================================================
// Backdrop
// ================================================================================================

const ParallaxPageBackdrop = React.forwardRef<
  React.ElementRef<typeof Sheet.Backdrop>,
  React.ComponentPropsWithoutRef<typeof Sheet.Backdrop>
>(({ travelAnimation, ...restProps }, ref) => {
  return (
    <Sheet.Backdrop
      travelAnimation={{ opacity: [0, 0.25], ...travelAnimation }}
      {...restProps}
      ref={ref}
    />
  )
})

ParallaxPageBackdrop.displayName = 'ParallaxPage.Backdrop'

// ================================================================================================
// Content
// ================================================================================================

const ParallaxPageContent = React.forwardRef<
  React.ElementRef<typeof Sheet.Content>,
  React.ComponentPropsWithoutRef<typeof Sheet.Content>
>(({ stackingAnimation, ...restProps }, ref) => {
  return (
    <Sheet.Content
      className="ParallaxPage-content"
      stackingAnimation={{
        translateX: ({ progress }) => (progress <= 1 ? progress * -80 + 'px' : '-80px'),
        ...stackingAnimation,
      }}
      {...restProps}
      ref={ref}
    />
  )
})
ParallaxPageContent.displayName = 'ParallaxPage.Content'

// ================================================================================================
// Top Bar Dismiss Trigger Portal
// ================================================================================================

// A portal that will render the dismiss trigger in the top bar
// dismiss trigger container by default.

const ParallaxPageTopBarDismissTriggerPortal = ({
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof Sheet.Portal>) => {
  const { dismissTriggerContainerRef } = useParallaxPageStackRootContext()

  return (
    <Sheet.Portal container={dismissTriggerContainerRef.current as HTMLElement} {...props}>
      {children}
    </Sheet.Portal>
  )
}
ParallaxPageTopBarDismissTriggerPortal.displayName = 'ParallaxPage.TopBarDismissTriggerPortal'

// ================================================================================================
// Top Bar Dismiss Trigger
// ================================================================================================

// The top bar dismiss trigger associated with the parallax page.

const ParallaxPageTopBarDismissTrigger = React.forwardRef<
  React.ElementRef<typeof Sheet.Trigger>,
  React.ComponentPropsWithoutRef<typeof Sheet.Trigger>
>(({ className, action, travelAnimation, ...restProps }, ref) => {
  return (
    <Sheet.Trigger
      className={`ParallaxPage-topBarDismissTrigger ${className ?? ''}`.trim()}
      action={action ?? 'dismiss'}
      travelAnimation={{
        visibility: 'visible',
        opacity: ({ progress }) => (1 / 0.75) * (progress - 0.25),
        ...travelAnimation,
      }}
      {...restProps}
      ref={ref}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="ParallaxPage-topBarDismissIcon"
      >
        <path
          fillRule="evenodd"
          d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
          clipRule="evenodd"
        />
      </svg>
    </Sheet.Trigger>
  )
})
ParallaxPageTopBarDismissTrigger.displayName = 'ParallaxPage.TopBarDismissTrigger'

// ================================================================================================
// Top Bar Title Portal
// ================================================================================================

// A portal that will render the top bar title in the top bar
// title container by default.

const ParallaxPageTopBarTitlePortal = ({
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof Sheet.Outlet>) => {
  const { topBarTitleContainerRef } = useParallaxPageStackRootContext()

  return (
    <Sheet.Portal container={topBarTitleContainerRef.current as HTMLElement} {...props}>
      {children}
    </Sheet.Portal>
  )
}
ParallaxPageTopBarTitlePortal.displayName = 'ParallaxPage.TopBarTitlePortal'

// ================================================================================================
// Top Bar Title
// ================================================================================================

// The top bar title associated with the parallax page.

const ParallaxPageTopBarTitle = React.forwardRef<
  React.ElementRef<typeof Sheet.Outlet>,
  React.ComponentPropsWithoutRef<typeof Sheet.Outlet>
>(({ className, travelAnimation, stackingAnimation, ...restProps }, ref) => {
  return (
    <Sheet.Outlet
      className={`ParallaxPage-topBarTitle ${className ?? ''}`.trim()}
      travelAnimation={{
        opacity: ({ progress }) => (1 / 0.75) * (progress - 0.25),
        ...travelAnimation,
      }}
      stackingAnimation={{
        opacity: ({ progress }) => 0.75 - (1 / 0.75) * (progress - 0.25),
        ...stackingAnimation,
      }}
      {...restProps}
      ref={ref}
    />
  )
})
ParallaxPageTopBarTitle.displayName = 'ParallaxPage.TopBarTitle'

// ================================================================================================
// Unchanged components
// ================================================================================================

const ParallaxPagePortal = Sheet.Portal
const ParallaxPageTrigger = Sheet.Trigger
const ParallaxPageHandle = Sheet.Handle
const ParallaxPageOutlet = Sheet.Outlet
const ParallaxPageTitle = Sheet.Title
const ParallaxPageDescription = Sheet.Description

export const ParallaxPageStack = {
  // Stack
  Root: ParallaxPageStackRoot,
  SceneryOutlet: ParallaxPageStackSceneryOutlet,
  // Stack top bar components
  IslandRoot: ParallaxPageStackIslandRoot,
  IslandContent: ParallaxPageStackIslandContent,
  TopBarDismissTriggerContainer: ParallaxPageStackTopBarDismissTriggerContainer,
  TopBarTitleOutlet: ParallaxPageStackTopBarTitleOutlet,
  TopBarTitleContainer: ParallaxPageStackTopBarTitleContainer,
}

export const ParallaxPage = {
  // Page
  Root: ParallaxPageRoot,
  ViewPortal: ParallaxPageViewPortal,
  View: ParallaxPageView,
  Backdrop: ParallaxPageBackdrop,
  Content: ParallaxPageContent,
  Trigger: ParallaxPageTrigger,
  Handle: ParallaxPageHandle,
  Outlet: ParallaxPageOutlet,
  Portal: ParallaxPagePortal,
  Title: ParallaxPageTitle,
  Description: ParallaxPageDescription,
  // Top Bar page components
  TopBarDismissTriggerPortal: ParallaxPageTopBarDismissTriggerPortal,
  TopBarDismissTrigger: ParallaxPageTopBarDismissTrigger,
  TopBarTitlePortal: ParallaxPageTopBarTitlePortal,
  TopBarTitle: ParallaxPageTopBarTitle,
}
