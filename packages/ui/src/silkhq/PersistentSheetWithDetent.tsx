"use client";
import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Sheet, useThemeColorDimmingOverlay } from "@silk-hq/components";
import "./PersistentSheetWithDetent.css";

// ================================================================================================
// Utils
// ================================================================================================

const setRefs = <T,>(...refs: (React.Ref<T> | undefined)[]): ((node: T) => void) => {
  return (node: T) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        // @ts-ignore - intentionally breaking the readonly nature for compatibility
        ref.current = node;
      }
    });
  };
};

// ================================================================================================
// Context
// ================================================================================================

type PersistentSheetWithDetentContextValue = {
  range: { start: number; end: number };
  setRange: React.Dispatch<React.SetStateAction<{ start: number; end: number }>>;
  backdropRef: React.RefObject<HTMLDivElement>;
  themeColorDimmingControllerRef: React.RefObject<HTMLDivElement>;
  rectractedContentRef: React.RefObject<HTMLDivElement>;
  expandedContentRef: React.RefObject<HTMLDivElement>;
};

const PersistentSheetWithDetentContext =
  React.createContext<PersistentSheetWithDetentContextValue | null>(null);

const usePersistentSheetWithDetentContext = () => {
  const context = React.useContext(PersistentSheetWithDetentContext);
  if (!context) {
    throw new Error(
      "usePersistentSheetWithDetentContext must be used within a PersistentSheetWithDetentContextProvider"
    );
  }
  return context;
};

// ================================================================================================
// Root
// ================================================================================================

type SheetRootProps = React.ComponentPropsWithoutRef<typeof Sheet.Root>;
type PersistentSheetWithDetentRootProps = Omit<SheetRootProps, "license"> & {
  license?: SheetRootProps["license"];
};

const PersistentSheetWithDetentRoot = React.forwardRef<
  React.ElementRef<typeof Sheet.Root>,
  PersistentSheetWithDetentRootProps
>(({ children, ...restProps }, ref) => {
  const [range, setRange] = useState({ start: 0, end: 0 });
  const backdropRef = useRef<HTMLDivElement>(null);
  const themeColorDimmingControllerRef = useRef<HTMLDivElement>(null);
  const rectractedContentRef = useRef<HTMLDivElement>(null);
  const expandedContentRef = useRef<HTMLDivElement>(null);

  return (
    <PersistentSheetWithDetentContext.Provider
      value={{
        range,
        setRange,
        backdropRef,
        themeColorDimmingControllerRef,
        rectractedContentRef,
        expandedContentRef,
      }}
    >
      <Sheet.Root license="commercial" {...restProps} ref={ref}>
        <Sheet.Portal>
          {/* Using a custom backdrop because the real one's features are
              not needed, and to be able to put it outside of the view */}
          {range.end > 1 && (
            <>
              <Sheet.Outlet
                className="PersistentSheetWithDetent-customBackdrop"
                ref={backdropRef}
              />
              <div
                className="PersistentSheetWithDetent-themeColorDimmingController"
                ref={themeColorDimmingControllerRef}
              />
            </>
          )}
        </Sheet.Portal>
        {children}
      </Sheet.Root>
    </PersistentSheetWithDetentContext.Provider>
  );
});
PersistentSheetWithDetentRoot.displayName = "PersistentSheetWithDetent.Root";

// ================================================================================================
// View
// ================================================================================================

const PersistentSheetWithDetentView = React.forwardRef<
  React.ElementRef<typeof Sheet.View>,
  React.ComponentPropsWithoutRef<typeof Sheet.View> & {
    dimmingColor?: string;
  }
>(({ children, className, dimmingColor, onTravel, ...restProps }, ref) => {
  const viewRef = useRef<HTMLDivElement>(null);
  const [inertOutside, setInertOutside] = useState(restProps.inertOutside);

  const {
    range,
    setRange,
    backdropRef,
    themeColorDimmingControllerRef,
    rectractedContentRef,
    expandedContentRef,
  } = usePersistentSheetWithDetentContext();

  const rangeChangeHandler: NonNullable<
    React.ComponentProps<typeof Sheet.View>["onTravelRangeChange"]
  > = useCallback(
    (newRange) => {
      setRange(newRange);
      setInertOutside(newRange.start === 2 && newRange.end === 2);
    },
    [setRange]
  );

  //
  // Height setter

  // We set the height only when the sheet is resting on a
  // detent.

  useEffect(() => {
    const updateHeight = () => {
      if (viewRef.current && range.start === range.end) {
        const height = window.innerHeight;
        viewRef.current.style.height = `${height + 1}px`;
      }
    };

    if (range.start === range.end) {
      updateHeight();
    }

    visualViewport?.addEventListener("resize", updateHeight);

    return () => {
      visualViewport?.removeEventListener("resize", updateHeight);
    };
  }, [range.start, range.end]);

  useEffect(() => {setInertOutside(restProps.inertOutside)}, [restProps.inertOutside]);

  //
  // Travel handler

  // We use a travel handler instead of travel animations because
  // it is not (yet) to define animation based on the progress
  // during a specific range.

  const { setDimmingOverlayOpacity } = useThemeColorDimmingOverlay({
    elementRef: themeColorDimmingControllerRef,
    dimmingColor: dimmingColor ?? "rgba(63, 165, 225, 1)",
  });

  const travelHandler: NonNullable<React.ComponentProps<typeof Sheet.View>["onTravel"]> =
    useCallback(
      (data) => {
        if (typeof onTravel === 'function') {
          onTravel(data)
        }

        const { progress, range, progressAtDetents } = data
        if (!progressAtDetents) return;

        if (range.end > 1) {
          const normalisedProgress = (progress - progressAtDetents[1]) / (1 - progressAtDetents[1]);

          setDimmingOverlayOpacity(normalisedProgress);

          rectractedContentRef.current?.style.setProperty(
            "opacity",
            (1 - normalisedProgress) as unknown as string
          );
          backdropRef.current?.style.setProperty(
            "opacity",
            (normalisedProgress * 0.25) as unknown as string
          );
          expandedContentRef.current?.style.setProperty(
            "opacity",
            normalisedProgress as unknown as string
          );
        }
      },
      [setDimmingOverlayOpacity]
    );

  //
  // Return

  const onDetent2 = useMemo(() => range.start === 2 && range.end === 2, [range.start, range.end]);

  return (
    <Sheet.View
      ref={setRefs(viewRef, ref)}
      className={`PersistentSheetWithDetent-view onDetent2-${onDetent2} ${className ?? ""}`.trim()}
      detents="max(env(safe-area-inset-bottom, 0px) - 10px + var(--retracted-height), var(--retracted-height))"
      swipeOvershoot={false}
      swipeDismissal={false}
      onTravelRangeChange={rangeChangeHandler}
      inertOutside={inertOutside}
      onClickOutside={{ dismiss: range.end === 2 }}
      onTravel={travelHandler}
      nativeEdgeSwipePrevention={range.end !== 1}
      {...restProps}
    >
      {children}
    </Sheet.View>
  );
});
PersistentSheetWithDetentView.displayName = "PersistentSheetWithDetent.View";

// ================================================================================================
// Content
// ================================================================================================

const PersistentSheetWithDetentContent = React.forwardRef<
  React.ElementRef<typeof Sheet.Content>,
  React.ComponentPropsWithoutRef<typeof Sheet.Content>
>(({ children, className, ...restProps }, ref) => {
  return (
    <Sheet.Content
      className={`PersistentSheetWithDetent-content ${className ?? ""}`.trim()}
      {...restProps}
      ref={ref}
    >
      <Sheet.SpecialWrapper.Root>
        <Sheet.SpecialWrapper.Content>
          <div className="PersistentSheetWithDetent-innerContent">{children}</div>
        </Sheet.SpecialWrapper.Content>
      </Sheet.SpecialWrapper.Root>
    </Sheet.Content>
  );
});
PersistentSheetWithDetentContent.displayName = "PersistentSheetWithDetent.Content";

// ================================================================================================
// Retracted Content
// ================================================================================================

const PersistentSheetWithDetentRetractedContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, className, ...restProps }, ref) => {
  const { range, rectractedContentRef } = usePersistentSheetWithDetentContext();

  if (range.start >= 2) return null;

  return (
    <div
      className={`PersistentSheetWithDetent-retractedContent ${className ?? ""}`.trim()}
      ref={setRefs(rectractedContentRef, ref)}
      {...restProps}
    >
      {children}
    </div>
  );
});
PersistentSheetWithDetentRetractedContent.displayName =
  "PersistentSheetWithDetent.RetractedContent";

// ================================================================================================
// Expanded Content
// ================================================================================================

const PersistentSheetWithDetentExpandedContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, className, ...restProps }, ref) => {
  const { range, expandedContentRef } = usePersistentSheetWithDetentContext();

  if (range.end <= 1) return null;

  return (
    <div
      className={`PersistentSheetWithDetent-expandedContent ${className ?? ""}`.trim()}
      ref={setRefs(expandedContentRef, ref)}
      {...restProps}
    >
      {children}
    </div>
  );
});
PersistentSheetWithDetentExpandedContent.displayName = "PersistentSheetWithDetent.ExpandedContent";

// ================================================================================================
// Unchanged components
// ================================================================================================

const PersistentSheetWithDetentPortal = Sheet.Portal;
const PersistentSheetWithDetentTrigger = Sheet.Trigger;
const PersistentSheetWithDetentHandle = Sheet.Handle;
const PersistentSheetWithOutlet = Sheet.Outlet;
const PersistentSheetWithTitle = Sheet.Title;
const PersistentSheetWithDescription = Sheet.Description;

export const PersistentSheetWithDetent = {
  Root: PersistentSheetWithDetentRoot,
  Portal: PersistentSheetWithDetentPortal,
  View: PersistentSheetWithDetentView,
  Content: PersistentSheetWithDetentContent,
  Trigger: PersistentSheetWithDetentTrigger,
  Handle: PersistentSheetWithDetentHandle,
  RetractedContent: PersistentSheetWithDetentRetractedContent,
  ExpandedContent: PersistentSheetWithDetentExpandedContent,
  Outlet: PersistentSheetWithOutlet,
  Title: PersistentSheetWithTitle,
  Description: PersistentSheetWithDescription,
};
