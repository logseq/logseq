"use client";
import React from "react";
import { Sheet, VisuallyHidden } from "@silk-hq/components";
import "./Sidebar.css";

// ================================================================================================
// Root
// ================================================================================================

type SheetRootProps = React.ComponentPropsWithoutRef<typeof Sheet.Root>;
type SidebarRootProps = Omit<SheetRootProps, "license"> & {
  license?: SheetRootProps["license"];
};

const SidebarRoot = React.forwardRef<React.ElementRef<typeof Sheet.Root>, SidebarRootProps>(
  ({ children, ...restProps }, ref) => {
    return (
      <Sheet.Root license="commercial" sheetRole="dialog" {...restProps} ref={ref}>
        {children}
      </Sheet.Root>
    );
  }
);
SidebarRoot.displayName = "Sidebar.Root";

// ================================================================================================
// View
// ================================================================================================

const SidebarView = React.forwardRef<
  React.ElementRef<typeof Sheet.View>,
  React.ComponentPropsWithoutRef<typeof Sheet.View>
>(({ children, className, ...restProps }, ref) => {
  return (
    <Sheet.View
      className={`Sidebar-view ${className ?? ""}`.trim()}
      contentPlacement="left"
      swipeOvershoot={false}
      nativeEdgeSwipePrevention={true}
      {...restProps}
      ref={ref}
    >
      {children}
    </Sheet.View>
  );
});
SidebarView.displayName = "Sidebar.View";

// ================================================================================================
// Backdrop
// ================================================================================================

const SidebarBackdrop = React.forwardRef<
  React.ElementRef<typeof Sheet.Backdrop>,
  React.ComponentPropsWithoutRef<typeof Sheet.Backdrop>
>(({ className, ...restProps }, ref) => {
  return (
    <Sheet.Backdrop
      className={`Sidebar-backdrop ${className ?? ""}`.trim()}
      {...restProps}
      ref={ref}
    />
  );
});
SidebarBackdrop.displayName = "Sidebar.Backdrop";

// ================================================================================================
// Content
// ================================================================================================

const SidebarContent = React.forwardRef<
  React.ElementRef<typeof Sheet.Content>,
  React.ComponentPropsWithoutRef<typeof Sheet.Content>
>(({ children, className, ...restProps }, ref) => {
  return (
    <Sheet.Content className={`Sidebar-content ${className ?? ""}`.trim()} {...restProps} ref={ref}>
      <VisuallyHidden.Root>
        <Sheet.Title>Sidebar Example</Sheet.Title>
        <Sheet.Trigger action="dismiss">Close Sidebar example</Sheet.Trigger>
      </VisuallyHidden.Root>
      {children}
    </Sheet.Content>
  );
});
SidebarContent.displayName = "Sidebar.Content";

// ================================================================================================
// Unchanged Components
// ================================================================================================

const SidebarPortal = Sheet.Portal;
const SidebarTrigger = Sheet.Trigger;
const SidebarHandle = Sheet.Handle;
const SidebarOutlet = Sheet.Outlet;
const SidebarTitle = Sheet.Title;
const SidebarDescription = Sheet.Description;

export const Sidebar = {
  Root: SidebarRoot,
  Portal: SidebarPortal,
  View: SidebarView,
  Backdrop: SidebarBackdrop,
  Content: SidebarContent,
  Trigger: SidebarTrigger,
  Handle: SidebarHandle,
  Outlet: SidebarOutlet,
  Title: SidebarTitle,
  Description: SidebarDescription,
};
