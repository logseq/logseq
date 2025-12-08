import React, { useEffect, useState, useRef, createContext, useContext } from 'react'
import { Sheet, useClientMediaQuery } from '@silk-hq/components'
import './Toast.css'

// ================================================================================================
// Context
// ================================================================================================

type ToastContextValue = {
  presented: boolean;
  setPresented: (presented: boolean) => void;
  pointerOver: boolean;
  setPointerOver: (pointerOver: boolean) => void;
  travelStatus: string;
  setTravelStatus: (status: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null)

// ================================================================================================
// Root
// ================================================================================================

type SheetRootProps = React.ComponentPropsWithoutRef<typeof Sheet.Root>;
type ToastRootProps = Omit<SheetRootProps, 'license'> & {
  license?: SheetRootProps['license'];
};

const ToastRoot = React.forwardRef<React.ElementRef<typeof Sheet.Root>, ToastRootProps>(
  ({ children, ...restProps }, ref) => {
    const [presented, setPresented] = useState(false)
    const [pointerOver, setPointerOver] = useState(false)
    const [travelStatus, setTravelStatus] = useState('idleOutside')
    const autoCloseTimeout = useRef<ReturnType<typeof setTimeout> | undefined>()

    useEffect(() => {
      const startAutoCloseTimeout = () => {
        autoCloseTimeout.current = setTimeout(() => setPresented(false), 5000)
      }

      const clearAutoCloseTimeout = () => {
        clearTimeout(autoCloseTimeout.current)
      }

      if (presented) {
        if (travelStatus === 'idleInside' && !pointerOver) {
          startAutoCloseTimeout()
        } else {
          clearAutoCloseTimeout()
        }
      }
      return clearAutoCloseTimeout
    }, [presented, travelStatus, pointerOver])

    return (
      <ToastContext.Provider
        value={{
          presented,
          setPresented,
          pointerOver,
          setPointerOver,
          travelStatus,
          setTravelStatus,
        }}
      >
        <Sheet.Root
          license="commercial"
          presented={presented}
          onPresentedChange={setPresented}
          sheetRole=""
          {...restProps}
          ref={ref}
        >
          {children}
        </Sheet.Root>
      </ToastContext.Provider>
    )
  }
)
ToastRoot.displayName = 'Toast.Root'

// ================================================================================================
// View
// ================================================================================================

const ToastView = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof Sheet.View>
>(({ children, className, ...restProps }, ref) => {
  const largeViewport = useClientMediaQuery('(min-width: 1000px)')
  const contentPlacement = largeViewport ? 'right' : 'top'

  const context = useContext(ToastContext)
  if (!context) throw new Error('ToastView must be used within a ToastContext.Provider')
  const { setTravelStatus } = context

  return (
    <div
      className={`Toast-container ${className ?? ''}`.trim()}
      role="status"
      aria-live="polite"
      {...restProps}
      ref={ref}
    >
      <Sheet.View
        className={`Toast-view ${className ?? ''}`.trim()}
        contentPlacement={contentPlacement}
        inertOutside={false}
        onPresentAutoFocus={{ focus: false }}
        onDismissAutoFocus={{ focus: false }}
        onClickOutside={{
          dismiss: false,
          stopOverlayPropagation: false,
        }}
        onEscapeKeyDown={{
          dismiss: false,
          stopOverlayPropagation: false,
        }}
        onTravelStatusChange={setTravelStatus}
      >
        {children}
      </Sheet.View>
    </div>
  )
})
ToastView.displayName = 'Toast.View'

// ================================================================================================
// Content
// ================================================================================================

const ToastContent = React.forwardRef<
  React.ElementRef<typeof Sheet.Content>,
  React.ComponentPropsWithoutRef<typeof Sheet.Content>
>(({ children, className, ...restProps }, ref) => {
  const context = useContext(ToastContext)
  if (!context) throw new Error('ToastContent must be used within ToastRoot')

  return (
    <Sheet.Content
      className={`Toast-content ${className ?? ''}`.trim()}
      asChild
      {...restProps}
      ref={ref}
    >
      <Sheet.SpecialWrapper.Root>
        <Sheet.SpecialWrapper.Content
          className="Toast-innerContent"
          onPointerEnter={() => context.setPointerOver(true)}
          onPointerLeave={() => context.setPointerOver(false)}
        >
          {children}
        </Sheet.SpecialWrapper.Content>
      </Sheet.SpecialWrapper.Root>
    </Sheet.Content>
  )
})
ToastContent.displayName = 'Toast.Content'

// ================================================================================================
// Unchanged Components
// ================================================================================================

const ToastPortal = Sheet.Portal
const ToastTrigger = Sheet.Trigger
const ToastHandle = Sheet.Handle
const ToastOutlet = Sheet.Outlet
const ToastTitle = Sheet.Title
const ToastDescription = Sheet.Description

export const Toast = {
  Root: ToastRoot,
  Portal: ToastPortal,
  View: ToastView,
  Content: ToastContent,
  Trigger: ToastTrigger,
  Title: ToastTitle,
  Description: ToastDescription,
  Handle: ToastHandle,
  Outlet: ToastOutlet,
}
