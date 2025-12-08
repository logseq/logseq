import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  Sheet,
  SheetStack,
  animate,
  useThemeColorDimmingOverlay,
  usePageScrollData,
  SheetViewProps,
  createComponentId,
} from '@silk-hq/components'
import './SheetWithDepth.css'

// ================================================================================================
// Stack Id
// ================================================================================================

const sheetWithDepthStackId = createComponentId()

// ================================================================================================
// StackRoot Context
// ================================================================================================

type SheetWithDepthStackRootContextValue = {
  stackBackgroundRef: React.RefObject<HTMLDivElement>;
  stackFirstSheetBackdropRef: React.RefObject<HTMLDivElement>;
  stackingCount: number;
  setStackingCount: React.Dispatch<React.SetStateAction<number>>;
};

const SheetWithDepthStackRootContext = createContext<SheetWithDepthStackRootContextValue | null>(
  null
)
const useSheetWithDepthStackRootContext = () => {
  const context = useContext(SheetWithDepthStackRootContext)
  if (!context) {
    throw new Error(
      'useSheetWithDepthStackRootContext must be used within a SheetWithDepthStackRootContext'
    )
  }
  return context
}

// ================================================================================================
// View Context
// ================================================================================================

const SheetWithDepthViewContext = createContext<{
  indexInStack: number;
} | null>(null)
const useSheetWithDepthViewContext = () => {
  const context = useContext(SheetWithDepthViewContext)
  if (!context) {
    throw new Error('useSheetWithDepthViewContext must be used within a SheetWithDepthViewContext')
  }
  return context
}

// ================================================================================================
// StackRoot
// ================================================================================================

const SheetWithDepthStackRoot = React.forwardRef<
  React.ElementRef<typeof SheetStack.Root>,
  React.ComponentProps<typeof SheetStack.Root>
>(({ children, ...restProps }, ref) => {
  const stackBackgroundRef = useRef<HTMLDivElement | null>(null)
  const stackFirstSheetBackdropRef = useRef<HTMLDivElement | null>(null)

  const [stackingCount, setStackingCount] = useState(0)

  const contextValue = useMemo(
    () => ({
      stackBackgroundRef,
      stackFirstSheetBackdropRef,
      stackingCount,
      setStackingCount,
    }),
    [stackingCount]
  )

  return (
    <SheetWithDepthStackRootContext.Provider value={contextValue}>
      <SheetStack.Root componentId={sheetWithDepthStackId} {...restProps} ref={ref}>
        {children}
      </SheetStack.Root>
    </SheetWithDepthStackRootContext.Provider>
  )
})
SheetWithDepthStackRoot.displayName = 'SheetWithDepthStack.Root'

// ================================================================================================
// StackSceneryOutlets
// ================================================================================================

// The SheetStack outlets that define the scenery of the stack
// (i.e. the content underneath) for the depth effect.

const isIOS = window.navigator.userAgent?.match(/iPhone|iPad/i)
const initialTopOffset = isIOS ?
  'max(env(safe-area-inset-top), 1.3vh)' : 'max(var(--safe-area-inset-top), 1.3vh)'

const SheetWithDepthStackSceneryOutlets = React.forwardRef<
  React.ElementRef<typeof SheetStack.Outlet>,
  Omit<React.ComponentProps<typeof SheetStack.Outlet>, 'asChild'>
>(({ children, className, stackingAnimation: stackingAnimationFromProps, ...restProps }, ref) => {
  const { stackBackgroundRef, stackFirstSheetBackdropRef } = useSheetWithDepthStackRootContext()

  const { nativePageScrollReplaced } = usePageScrollData()

  const [iOSStandalone, setiOSStandalone] = useState(false)
  useEffect(() => {
    setiOSStandalone(
      // @ts-ignore
      window.navigator.standalone && window.navigator.userAgent?.match(/iPhone|iPad/i)
    )
  }, [])

  const stackingAnimation: React.ComponentPropsWithoutRef<
    typeof Sheet.Outlet
  >['stackingAnimation'] = {
    // Clipping & border-radius. We have a different animation
    // when the native page scroll is replaced, and in iOS
    // standalone mode.
    ...(nativePageScrollReplaced
      ? iOSStandalone
        ? // In iOS standalone mode we don't need to animate the
          // border-radius because the corners are hidden by the
          // screen corners. So we just set the border-radius to
          // the needed value.
        {
          overflow: 'clip',
          borderRadius: '24px',
          transformOrigin: '50% 0',
        }
        : // Outside of iOS standalone mode we do animate
          // the border-radius because the scenery is a visible
          // rectangle.
        {
          overflow: 'clip',
          borderRadius: ({ progress }: any) => Math.min(progress * 24, 24) + 'px',
          transformOrigin: '50% 0',
        }
      : // When the native page scroll is not replaced we
        // need to use the Silk's special clip properties to cut
        // off the rest of the page.
      {
        clipBoundary: 'layout-viewport',
        clipBorderRadius: '24px',
        clipTransformOrigin: '50% 0',
      }),

    // Translate & scale
    translateY: ({ progress }) =>
      progress <= 1
        ? 'calc(' + progress + ' * ' + initialTopOffset + ')'
        : // prettier-ignore
        'calc(' + initialTopOffset + ' + 0.65vh * ' + (progress - 1) + ')',
    scale: [1, 0.91],

    // We merge animations coming from the props
    ...stackingAnimationFromProps,
  }

  return (
    <>
      {/* Element used as a black background representing the void under the stack. */}
      <div
        className={`SheetWithDepth-stackSceneryBackground nativePageScrollReplaced-${nativePageScrollReplaced}`}
        ref={stackBackgroundRef}
      />
      {/* Element used as a container for the content under the stack. */}
      <SheetStack.Outlet
        className={`SheetWithDepth-stackSceneryContainer ${className ?? ''}`.trim()}
        forComponent={sheetWithDepthStackId}
        stackingAnimation={stackingAnimation}
        {...restProps}
        ref={ref}
      >
        {children}
        {/* Element used as the first sheet's backdrop, which only covers the stackSceneryContainer, not the entire viewport. */}
        <div
          className="SheetWithDepth-stackSceneryFirstSheetBackdrop"
          ref={stackFirstSheetBackdropRef}
        />
      </SheetStack.Outlet>
    </>
  )
})
SheetWithDepthStackSceneryOutlets.displayName = 'SheetWithDepthStack.SceneryOutlets'

// ================================================================================================
// Root
// ================================================================================================

type SheetRootProps = React.ComponentPropsWithoutRef<typeof Sheet.Root>;
type SheetWithDepthRootProps = Omit<SheetRootProps, 'license'> & {
  license?: SheetRootProps['license'];
};

const SheetWithDepthRoot = React.forwardRef<
  React.ElementRef<typeof Sheet.Root>,
  SheetWithDepthRootProps
>((props, ref) => {
  return (
    <Sheet.Root license="commercial" forComponent={sheetWithDepthStackId} {...props} ref={ref}/>
  )
})
SheetWithDepthRoot.displayName = 'SheetWithDepth.Root'

// ================================================================================================
// View
// ================================================================================================

// We use animate(), animateDimmingOverlayOpacity() and the
// travelHandler instead of relying on stackingAnimation for the
// stackSceneryBackground and stackSceneryFirstSheetBackdrop
// elements in order to have a different (the default CSS
// "ease"), less abrupt animation easing for them.

const SheetWithDepthView = React.forwardRef<
  React.ElementRef<typeof Sheet.View>,
  React.ComponentPropsWithoutRef<typeof Sheet.View>
>(
  (
    { children, className, onTravelStatusChange, onTravel: travelHandlerFromProps, ...restProps },
    ref
  ) => {
    const {
      stackingCount,
      setStackingCount,

      stackBackgroundRef,
      stackFirstSheetBackdropRef,
    } = useSheetWithDepthStackRootContext()

    const [indexInStack, setIndexInStack] = useState(0)
    const [travelStatus, setTravelStatus] = useState('idleOutside')

    //
    // Define a dimming overlay

    const { setDimmingOverlayOpacity, animateDimmingOverlayOpacity } = useThemeColorDimmingOverlay({
      elementRef: stackBackgroundRef,
      dimmingColor: 'rgb(0, 0, 0)',
    })

    //
    // travelStatusChangeHandler

    const travelStatusChangeHandler = useCallback<
      NonNullable<SheetViewProps['onTravelStatusChange']>
    >(
      (newTravelStatus) => {
        // Set indexInStack & stackingCount
        if (travelStatus !== 'stepping' && newTravelStatus === 'idleInside') {
          setStackingCount((prevStackingCount: number) => prevStackingCount + 1)
          if (indexInStack === 0) {
            setIndexInStack(stackingCount + 1)
          }
        }
        //
        else if (newTravelStatus === 'idleOutside') {
          setStackingCount((prevStackingCount: number) => prevStackingCount - 1)
          setIndexInStack(0)
        }

        // Animate on entering
        if (newTravelStatus === 'entering' && stackingCount === 0) {
          animateDimmingOverlayOpacity({ keyframes: [0, 1] })
          animate(stackFirstSheetBackdropRef.current as HTMLElement, {
            opacity: [0, 0.33],
          })
        }

        // Animate on exiting
        if (newTravelStatus === 'exiting' && stackingCount === 1) {
          animateDimmingOverlayOpacity({ keyframes: [1, 0] })
          animate(stackFirstSheetBackdropRef.current as HTMLElement, {
            opacity: [0.33, 0],
          })
        }

        // Set the state
        onTravelStatusChange?.(newTravelStatus)
        setTravelStatus(newTravelStatus)
      },
      [
        travelStatus,
        indexInStack,
        stackingCount,
        setStackingCount,
        stackFirstSheetBackdropRef,
        animateDimmingOverlayOpacity,
        onTravelStatusChange,
      ]
    )

    //
    // travelHandler

    const travelHandler = useMemo(() => {
      if (indexInStack === 1 && travelStatus !== 'entering' && travelStatus !== 'exiting') {
        const handler: NonNullable<SheetViewProps['onTravel']> = ({ progress, ...rest }) => {
          setDimmingOverlayOpacity(progress)
          stackFirstSheetBackdropRef.current?.style.setProperty(
            'opacity',
            (progress * 0.33) as unknown as string
          )
          travelHandlerFromProps?.({ progress, ...rest })
        }
        return handler
      } else {
        return travelHandlerFromProps
      }
    }, [indexInStack, travelStatus, stackFirstSheetBackdropRef, setDimmingOverlayOpacity])

    //
    // Return

    return (
      <SheetWithDepthViewContext.Provider value={{ indexInStack }}>
        <Sheet.View
          className={`SheetWithDepth-view ${className ?? ''}`.trim()}
          contentPlacement="bottom"
          onTravelStatusChange={travelStatusChangeHandler}
          onTravel={travelHandler}
          nativeEdgeSwipePrevention={true}
          {...restProps}
          ref={ref}
        >
          {children}
        </Sheet.View>
      </SheetWithDepthViewContext.Provider>
    )
  }
)
SheetWithDepthView.displayName = 'SheetWithDepth.View'

// ================================================================================================
// Backdrop
// ================================================================================================

const SheetWithDepthBackdrop = React.forwardRef<
  React.ElementRef<typeof Sheet.Backdrop>,
  React.ComponentPropsWithoutRef<typeof Sheet.Backdrop>
// @ts-ignore
>(({ className, ...restProps }, ref) => {
  const { stackingCount } = useSheetWithDepthStackRootContext()
  const { indexInStack } = useSheetWithDepthViewContext()

  return (
    // We don't render the Backdrop for the first sheet in the
    // stack, instead we use the stackSceneryFirstSheetBackdrop
    // element.
    stackingCount > 0 &&
    indexInStack !== 1 && (
      <Sheet.Backdrop
        className={`SheetWithDepth-backdrop ${className ?? ''}`.trim()}
        travelAnimation={{ opacity: [0, 0.33] }}
        {...restProps}
        ref={ref}
      />
    )
  )
})
SheetWithDepthBackdrop.displayName = 'SheetWithDepth.Backdrop'

// ================================================================================================
// Content
// ================================================================================================

const SheetWithDepthContent = React.forwardRef<
  React.ElementRef<typeof Sheet.Content>,
  React.ComponentProps<typeof Sheet.Content>
>(({ children, className, stackingAnimation, ...restProps }, ref) => {
  return (
    <Sheet.Content
      className={`SheetWithDepth-content ${className ?? ''}`.trim()}
      stackingAnimation={{
        translateY: ({ progress }) =>
          progress <= 1
            ? progress * -1.3 + 'vh'
            : // prettier-ignore
            'calc(-1.3vh + 0.65vh * ' + (progress - 1) + ')',
        scale: [1, 0.91],
        transformOrigin: '50% 0',
        ...stackingAnimation,
      }}
      {...restProps}
      ref={ref}
    >
      <Sheet.BleedingBackground className="SheetWithDepth-bleedingBackground"/>
      {children}
    </Sheet.Content>
  )
})
SheetWithDepthContent.displayName = 'SheetWithDepth.Content'

// ================================================================================================
// Unchanged components
// ================================================================================================

const SheetWithDepthPortal = Sheet.Portal
const SheetWithDepthTrigger = Sheet.Trigger
const SheetWithDepthHandle = Sheet.Handle
const SheetWithDepthOutlet = Sheet.Outlet
const SheetWithDepthTitle = Sheet.Title
const SheetWithDepthDescription = Sheet.Description

export const SheetWithDepthStack = {
  Root: SheetWithDepthStackRoot,
  SceneryOutlets: SheetWithDepthStackSceneryOutlets,
}

export const SheetWithDepth = {
  Root: SheetWithDepthRoot,
  Portal: SheetWithDepthPortal,
  View: SheetWithDepthView,
  Content: SheetWithDepthContent,
  Backdrop: SheetWithDepthBackdrop,
  Trigger: SheetWithDepthTrigger,
  Handle: SheetWithDepthHandle,
  Outlet: SheetWithDepthOutlet,
  Title: SheetWithDepthTitle,
  Description: SheetWithDepthDescription,
}
