import React, { createContext, useContext } from "react";
import {
  Sheet,
  SheetStack,
  useClientMediaQuery,
  type SheetContentProps,
} from "@silk-hq/components";
import "./SheetWithStacking.css";

// ================================================================================================
// Context
// ================================================================================================

type SheetWithStackingContextValue = {
  travelStatus: string;
  setTravelStatus: (status: string) => void;
  contentPlacement: "right" | "bottom";
};

const SheetWithStackingContext = createContext<SheetWithStackingContextValue | null>(null);

// ================================================================================================
// Stack Root
// ================================================================================================

const SheetWithStackingStackRoot = React.forwardRef<
  React.ElementRef<typeof SheetStack.Root>,
  React.ComponentPropsWithoutRef<typeof SheetStack.Root>
>(({ children, ...restProps }, ref) => {
  return (
    <SheetStack.Root {...restProps} ref={ref}>
      {children}
    </SheetStack.Root>
  );
});
SheetWithStackingStackRoot.displayName = "SheetWithStackingStack.Root";

// ================================================================================================
// Root
// ================================================================================================

type SheetRootProps = React.ComponentPropsWithoutRef<typeof Sheet.Root>;
type SheetWithStackingRootProps = Omit<SheetRootProps, "license"> & {
  license?: SheetRootProps["license"];
};

const SheetWithStackingRoot = React.forwardRef<
  React.ElementRef<typeof Sheet.Root>,
  SheetWithStackingRootProps
>(({ children, ...restProps }, ref) => {
  const [travelStatus, setTravelStatus] = React.useState("idleOutside");
  const largeViewport = useClientMediaQuery("(min-width: 700px)");
  const contentPlacement = largeViewport ? "right" : "bottom";

  return (
    <SheetWithStackingContext.Provider
      value={{
        travelStatus,
        setTravelStatus,
        contentPlacement,
      }}
    >
      <Sheet.Root license="commercial" forComponent="closest" {...restProps} ref={ref}>
        {children}
      </Sheet.Root>
    </SheetWithStackingContext.Provider>
  );
});
SheetWithStackingRoot.displayName = "SheetWithStacking.Root";

// ================================================================================================
// View
// ================================================================================================

const SheetWithStackingView = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof Sheet.View>
>(({ children, className, ...restProps }, ref) => {
  const context = useContext(SheetWithStackingContext);
  if (!context)
    throw new Error(
      "SheetWithStackingView must be used within a SheetWithStackingContext.Provider"
    );
  const { setTravelStatus, contentPlacement } = context;

  return (
    <Sheet.View
      className={`SheetWithStacking-view contentPlacement-${contentPlacement} ${className ?? ""}`}
      contentPlacement={contentPlacement}
      nativeEdgeSwipePrevention={true}
      onTravelStatusChange={setTravelStatus}
      {...restProps}
      ref={ref}
    >
      {children}
    </Sheet.View>
  );
});
SheetWithStackingView.displayName = "SheetWithStacking.View";

// ================================================================================================
// Backdrop
// ================================================================================================

const SheetWithStackingBackdrop = React.forwardRef<
  React.ElementRef<typeof Sheet.Backdrop>,
  React.ComponentPropsWithoutRef<typeof Sheet.Backdrop>
>((props, ref) => {
  return (
    <Sheet.Backdrop
      travelAnimation={{ opacity: [0, 0.2] }}
      themeColorDimming="auto"
      {...props}
      ref={ref}
    />
  );
});
SheetWithStackingBackdrop.displayName = "SheetWithStacking.Backdrop";

// ================================================================================================
// Content
// ================================================================================================

const SheetWithStackingContent = React.forwardRef<
  React.ElementRef<typeof Sheet.Content>,
  React.ComponentPropsWithoutRef<typeof Sheet.Content>
>(({ children, className, stackingAnimation: stackingAnimationFromProps, ...restProps }, ref) => {
  const context = useContext(SheetWithStackingContext);
  if (!context)
    throw new Error(
      "SheetWithStackingContent must be used within a SheetWithStackingContext.Provider"
    );
  const { contentPlacement } = context;

  const stackingAnimation: SheetContentProps["stackingAnimation"] =
    contentPlacement === "right"
      ? {
          translateX: ({ progress }: { progress: number }) =>
            progress <= 1
              ? progress * -10 + "px"
              : // prettier-ignore
                "calc(-12.5px + 2.5px *" + progress + ")",
          scale: [1, 0.933],
          transformOrigin: "0 50%",
          ...stackingAnimationFromProps,
        }
      : {
          translateY: ({ progress }: { progress: number }) =>
            progress <= 1
              ? progress * -10 + "px"
              : // prettier-ignore
                "calc(-12.5px + 2.5px *" + progress + ")",
          scale: [1, 0.933],
          transformOrigin: "50% 0",
          ...stackingAnimationFromProps,
        };

  return (
    <Sheet.Content
      className={`SheetWithStacking-content contentPlacement-${contentPlacement} ${
        className ?? ""
      }`}
      stackingAnimation={stackingAnimation}
      {...restProps}
      ref={ref}
    >
      <div className="SheetWithStacking-innerContent">{children}</div>
    </Sheet.Content>
  );
});
SheetWithStackingContent.displayName = "SheetWithStacking.Content";

// ================================================================================================
// Unchanged Components
// ================================================================================================

const SheetWithStackingPortal = Sheet.Portal;
const SheetWithStackingTrigger = Sheet.Trigger;
const SheetWithStackingHandle = Sheet.Handle;
const SheetWithStackingOutlet = Sheet.Outlet;
const SheetWithStackingTitle = Sheet.Title;
const SheetWithStackingDescription = Sheet.Description;

export const SheetWithStackingStack = {
  Root: SheetWithStackingStackRoot,
};

export const SheetWithStacking = {
  Root: SheetWithStackingRoot,
  View: SheetWithStackingView,
  Portal: SheetWithStackingPortal,
  Backdrop: SheetWithStackingBackdrop,
  Content: SheetWithStackingContent,
  Trigger: SheetWithStackingTrigger,
  Handle: SheetWithStackingHandle,
  Outlet: SheetWithStackingOutlet,
  Title: SheetWithStackingTitle,
  Description: SheetWithStackingDescription,
};
