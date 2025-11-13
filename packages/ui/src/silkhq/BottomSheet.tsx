import React from "react";
import { Sheet } from "@silk-hq/components";
import "./BottomSheet.css";

// ================================================================================================
// Root
// ================================================================================================

type SheetRootProps = React.ComponentPropsWithoutRef<typeof Sheet.Root>;
type BottomSheetRootProps = Omit<SheetRootProps, "license"> & {
  license?: SheetRootProps["license"];
};

const BottomSheetRoot = React.forwardRef<React.ElementRef<typeof Sheet.Root>, BottomSheetRootProps>(
  ({ children, ...restProps }, ref) => {
    return (
      <Sheet.Root license="commercial" {...restProps} ref={ref}>
        {children}
      </Sheet.Root>
    );
  }
);
BottomSheetRoot.displayName = "BottomSheet.Root";

// ================================================================================================
// View
// ================================================================================================

const BottomSheetView = React.forwardRef<
  React.ElementRef<typeof Sheet.View>,
  React.ComponentPropsWithoutRef<typeof Sheet.View>
>(({ children, className, ...restProps }, ref) => {
  return (
    <Sheet.View
      className={`BottomSheet-view ${className ?? ""}`.trim()}
      nativeEdgeSwipePrevention={true}
      {...restProps}
      ref={ref}
    >
      {children}
    </Sheet.View>
  );
});
BottomSheetView.displayName = "BottomSheet.View";

// ================================================================================================
// Backdrop
// ================================================================================================

const BottomSheetBackdrop = React.forwardRef<
  React.ElementRef<typeof Sheet.Backdrop>,
  React.ComponentPropsWithoutRef<typeof Sheet.Backdrop>
>(({ className, ...restProps }, ref) => {
  return (
    <Sheet.Backdrop
      className={`BottomSheet-backdrop ${className ?? ""}`.trim()}
      themeColorDimming="auto"
      {...restProps}
      ref={ref}
    />
  );
});
BottomSheetBackdrop.displayName = "BottomSheet.Backdrop";

// ================================================================================================
// Content
// ================================================================================================

const BottomSheetContent = React.forwardRef<
  React.ElementRef<typeof Sheet.Content>,
  React.ComponentPropsWithoutRef<typeof Sheet.Content>
>(({ children, className, ...restProps }, ref) => {
  return (
    <Sheet.Content
      className={`BottomSheet-content ${className ?? ""}`.trim()}
      {...restProps}
      ref={ref}
    >
      <Sheet.BleedingBackground className="BottomSheet-bleedingBackground" />
      {children}
    </Sheet.Content>
  );
});
BottomSheetContent.displayName = "BottomSheet.Content";

// ================================================================================================
// Handle
// ================================================================================================

const BottomSheetHandle = React.forwardRef<
  React.ElementRef<typeof Sheet.Handle>,
  React.ComponentPropsWithoutRef<typeof Sheet.Handle>
>(({ className, ...restProps }, ref) => {
  return (
    <Sheet.Handle
      className={`BottomSheet-handle ${className ?? ""}`.trim()}
      action="dismiss"
      {...restProps}
      ref={ref}
    />
  );
});
BottomSheetHandle.displayName = "BottomSheet.Handle";

// ================================================================================================
// Unchanged Components
// ================================================================================================

const BottomSheetPortal = Sheet.Portal;
const BottomSheetTrigger = Sheet.Trigger;
const BottomSheetOutlet = Sheet.Outlet;
const BottomSheetTitle = Sheet.Title;
const BottomSheetDescription = Sheet.Description;

export const BottomSheet = {
  Root: BottomSheetRoot,
  Portal: BottomSheetPortal,
  View: BottomSheetView,
  Backdrop: BottomSheetBackdrop,
  Content: BottomSheetContent,
  Trigger: BottomSheetTrigger,
  Handle: BottomSheetHandle,
  Outlet: BottomSheetOutlet,
  Title: BottomSheetTitle,
  Description: BottomSheetDescription,
};
