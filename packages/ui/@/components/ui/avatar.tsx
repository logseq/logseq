import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

// @ts-ignore
import { cn } from "@/lib/utils"

// Shape support: `data-shape="circle" | "rounded-rect"`. The class chain
// always emits `rounded-full` as the visual default; the rounded-rect
// override is handled by `[data-shape="rounded-rect"]` selectors in
// src/main/frontend/components/icon.css. Doing it that way avoids
// Tailwind JIT issues with arbitrary-value classes generated dynamically.
type ShapeProps = { "data-shape"?: "circle" | "rounded-rect" }

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & ShapeProps
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "ui__avatar relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image> & ShapeProps
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> & ShapeProps
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "avatar-fallback flex h-full w-full items-center justify-center rounded-full bg-muted whitespace-nowrap leading-none",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
