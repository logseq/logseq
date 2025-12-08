import React, { createContext, useContext, useMemo, useRef, useState } from "react";
import { Sheet, Scroll, type SheetViewProps } from "@silk-hq/components";
import "./SheetWithDetent.css";

// ================================================================================================
// Context
// ================================================================================================

type SheetWithDetentContextValue = {
  reachedLastDetent: boolean;
  setReachedLastDetent: React.Dispatch<React.SetStateAction<boolean>>;
  viewRef: React.RefObject<HTMLElement>;
};

const SheetWithDetentContext = createContext<SheetWithDetentContextValue | null>(null);

const useSheetWithDetentContext = () => {
  const context = useContext(SheetWithDetentContext);
  if (!context) {
    throw new Error(
      "useSheetWithDetentContext must be used within a SheetWithDetentContextProvider"
    );
  }
  return context;
};

// ================================================================================================
// Root
// ================================================================================================

type SheetRootProps = React.ComponentPropsWithoutRef<typeof Sheet.Root>;
type SheetWithDetentRootProps = Omit<SheetRootProps, "license"> & {
  license?: SheetRootProps["license"];
};

const SheetWithDetentRoot = React.forwardRef<
  React.ElementRef<typeof Sheet.Root>,
  SheetWithDetentRootProps
>(({ children, ...restProps }, ref) => {
  const [reachedLastDetent, setReachedLastDetent] = useState(false);
  const viewRef = useRef<HTMLElement>(null);

  return (
    <SheetWithDetentContext.Provider
      value={{
        reachedLastDetent,
        setReachedLastDetent,
        viewRef,
      }}
    >
      <Sheet.Root license="commercial" {...restProps} ref={ref}>
        {children}
      </Sheet.Root>
    </SheetWithDetentContext.Provider>
  );
});
SheetWithDetentRoot.displayName = "SheetWithDetent.Root";

// ================================================================================================
// View
// ================================================================================================

const SheetWithDetentView = React.forwardRef<
  React.ElementRef<typeof Sheet.View>,
  React.ComponentPropsWithoutRef<typeof Sheet.View>
>(
  (
    { children, className, onTravelStatusChange, onTravelRangeChange, onTravel, ...restProps },
    ref
  ) => {
    const { reachedLastDetent, setReachedLastDetent, viewRef } = useSheetWithDetentContext();

    //

    const travelHandler = useMemo(() => {
      if (!reachedLastDetent) return onTravel;

      const handler: SheetViewProps["onTravel"] = ({ progress, ...rest }) => {
        if (!viewRef.current) return onTravel?.({ progress, ...rest });

        // Dismiss the on-screen keyboard.
        if (progress < 0.999) {
          viewRef.current.focus();
        }
        onTravel?.({ progress, ...rest });
      };
      return handler;
    }, [reachedLastDetent, onTravel, viewRef]);

    //

    const setRefs = React.useCallback((node: HTMLElement | null) => {
      // @ts-ignore - intentionally breaking the readonly nature for compatibility
      viewRef.current = node;

      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    }, []);

    return (
      <Sheet.View
        className={`SheetWithDetent-view ${className ?? ""}`.trim()}
        detents={!reachedLastDetent ? "66vh" : undefined}
        swipeOvershoot={false}
        nativeEdgeSwipePrevention={true}
        onTravelStatusChange={(travelStatus) => {
          if (travelStatus === "idleOutside") setReachedLastDetent(false);
          onTravelStatusChange?.(travelStatus);
        }}
        onTravelRangeChange={(range) => {
          if (range.start === 2) setReachedLastDetent(true);
          onTravelRangeChange?.(range);
        }}
        onTravel={travelHandler}
        ref={setRefs}
        {...restProps}
      >
        {children}
      </Sheet.View>
    );
  }
);
SheetWithDetentView.displayName = "SheetWithDetent.View";

// ================================================================================================
// Backdrop
// ================================================================================================

const SheetWithDetentBackdrop = React.forwardRef<
  React.ElementRef<typeof Sheet.Backdrop>,
  React.ComponentPropsWithoutRef<typeof Sheet.Backdrop>
>(({ className, ...restProps }, ref) => {
  return (
    <Sheet.Backdrop
      className={`SheetWithDetent-backdrop ${className ?? ""}`.trim()}
      themeColorDimming="auto"
      {...restProps}
      ref={ref}
    />
  );
});
SheetWithDetentBackdrop.displayName = "SheetWithDetent.Backdrop";

// ================================================================================================
// Content
// ================================================================================================

const SheetWithDetentContent = React.forwardRef<
  React.ElementRef<typeof Sheet.Content>,
  React.ComponentPropsWithoutRef<typeof Sheet.Content>
>(({ children, className, ...restProps }, ref) => {
  return (
    <Sheet.Content
      className={`SheetWithDetent-content ${className ?? ""}`.trim()}
      {...restProps}
      ref={ref}
    >
      {children}
    </Sheet.Content>
  );
});
SheetWithDetentContent.displayName = "SheetWithDetent.Content";

// ================================================================================================
// Handle
// ================================================================================================

const SheetWithDetentHandle = React.forwardRef<
  React.ElementRef<typeof Sheet.Handle>,
  React.ComponentPropsWithoutRef<typeof Sheet.Handle>
>(({ className, ...restProps }, ref) => {
  const { reachedLastDetent } = useSheetWithDetentContext();

  return (
    <Sheet.Handle
      className={`SheetWithDetent-handle ${className ?? ""}`.trim()}
      action={reachedLastDetent ? "dismiss" : "step"}
      {...restProps}
      ref={ref}
    />
  );
});
SheetWithDetentHandle.displayName = "SheetWithDetent.Handle";

// ================================================================================================
// Scroll Root
// ================================================================================================

const SheetWithDetentScrollRoot = React.forwardRef<
  React.ElementRef<typeof Scroll.Root>,
  React.ComponentPropsWithoutRef<typeof Scroll.Root>
>(({ children, ...restProps }, ref) => {
  return (
    <Scroll.Root {...restProps} ref={ref}>
      {children}
    </Scroll.Root>
  );
});
SheetWithDetentScrollRoot.displayName = "SheetWithDetent.ScrollRoot";

// ================================================================================================
// Scroll View
// ================================================================================================

const SheetWithDetentScrollView = React.forwardRef<
  React.ElementRef<typeof Scroll.View>,
  React.ComponentPropsWithoutRef<typeof Scroll.View>
>(({ children, className, ...restProps }, ref) => {
  const { reachedLastDetent } = useSheetWithDetentContext();

  return (
    <Scroll.View
      className={`SheetWithDetent-scrollView ${className ?? ""}`.trim()}
      scrollGestureTrap={{ yEnd: true }}
      scrollGesture={!reachedLastDetent ? false : "auto"}
      safeArea="layout-viewport"
      onScrollStart={{ dismissKeyboard: true }}
      {...restProps}
      ref={ref}
    >
      {children}
    </Scroll.View>
  );
});
SheetWithDetentScrollView.displayName = "SheetWithDetent.ScrollView";

// ================================================================================================
// Scroll Content
// ================================================================================================

const SheetWithDetentScrollContent = React.forwardRef<
  React.ElementRef<typeof Scroll.Content>,
  React.ComponentPropsWithoutRef<typeof Scroll.Content>
>(({ children, className, ...restProps }, ref) => {
  return (
    <Scroll.Content
      className={`SheetWithDetent-scrollContent ${className ?? ""}`.trim()}
      {...restProps}
      ref={ref}
    >
      {children}
    </Scroll.Content>
  );
});
SheetWithDetentScrollContent.displayName = "SheetWithDetent.ScrollContent";

// ================================================================================================
// Unchanged Components
// ================================================================================================

const SheetWithDetentPortal = Sheet.Portal;
const SheetWithDetentTrigger = Sheet.Trigger;
const SheetWithDetentOutlet = Sheet.Outlet;
const SheetWithDetentTitle = Sheet.Title;
const SheetWithDetentDescription = Sheet.Description;

export const SheetWithDetent = {
  Root: SheetWithDetentRoot,
  Portal: SheetWithDetentPortal,
  View: SheetWithDetentView,
  Backdrop: SheetWithDetentBackdrop,
  Content: SheetWithDetentContent,
  Trigger: SheetWithDetentTrigger,
  Handle: SheetWithDetentHandle,
  Outlet: SheetWithDetentOutlet,
  Title: SheetWithDetentTitle,
  Description: SheetWithDetentDescription,
  //
  ScrollRoot: SheetWithDetentScrollRoot,
  ScrollView: SheetWithDetentScrollView,
  ScrollContent: SheetWithDetentScrollContent,
};
