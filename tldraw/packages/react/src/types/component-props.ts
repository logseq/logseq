/* -------------------- App Props ------------------- */

import type { TLBounds, TLHandle, TLOffset } from '@tldraw/core'
import type { TLReactShape } from '../lib'

/* ------------------- Components ------------------- */

export type TLSelectionComponentProps<S extends TLReactShape = TLReactShape> = {
  shapes: S[]
  bounds: TLBounds
  showResizeHandles?: boolean
  showRotateHandles?: boolean
}

export type TLBoundsComponent<S extends TLReactShape = TLReactShape> = (
  props: TLSelectionComponentProps<S>
) => JSX.Element | null

export type TLContextBarProps<S extends TLReactShape = TLReactShape> = {
  shapes: S[]
  bounds: TLBounds
  scaledBounds: TLBounds
  rotation: number
  offsets: TLOffset
  hidden: boolean
}

export type TLContextBarComponent<S extends TLReactShape = TLReactShape> = (
  props: TLContextBarProps<S>
) => JSX.Element | null

export type TLSelectionDetailProps<S extends TLReactShape = TLReactShape> = {
  shapes: S[]
  bounds: TLBounds
  scaledBounds: TLBounds
  zoom: number
  rotation?: number
  detail?: 'size' | 'rotation'
}

export type TLSelectionDetailComponent<S extends TLReactShape = TLReactShape> = (
  props: TLSelectionDetailProps<S>
) => JSX.Element | null

export type TLDirectionIndicatorProps<S extends TLReactShape = TLReactShape> = {
  shapes: S[]
  bounds: TLBounds
  direction: number[]
}

export type TLDirectionIndicatorComponent<S extends TLReactShape = TLReactShape> = (
  props: TLDirectionIndicatorProps<S>
) => JSX.Element

export interface TLBrushProps {
  bounds: TLBounds
}

export type TLBrushComponent = (props: TLBrushProps) => JSX.Element | null

export interface TLHandleComponentProps<
  S extends TLReactShape = TLReactShape,
  H extends TLHandle = TLHandle
> {
  shape: S
  handle: H
  id: string
}

export type TLHandleComponent<
  S extends TLReactShape = TLReactShape,
  H extends TLHandle = TLHandle
> = (props: TLHandleComponentProps<S, H>) => JSX.Element | null

export interface TLBacklinksCountComponentProps<S extends TLReactShape = TLReactShape> {
  shape: S
  id: string
  className?: string
}

export type TLBacklinksCountComponent<S extends TLReactShape = TLReactShape> = (
  props: TLBacklinksCountComponentProps<S>
) => JSX.Element | null

export interface TLQuickLinksComponentProps<S extends TLReactShape = TLReactShape> {
  shape: S
  id: string
  className?: string
}

export type TLQuickLinksComponent<S extends TLReactShape = TLReactShape> = (
  props: TLQuickLinksComponentProps<S>
) => JSX.Element | null

export interface TLGridProps {
  size: number
}

export type TLGridComponent = (props: TLGridProps) => JSX.Element | null

export type TLReactComponents<S extends TLReactShape = TLReactShape> = {
  SelectionBackground?: TLBoundsComponent<S> | null
  SelectionForeground?: TLBoundsComponent<S> | null
  SelectionDetail?: TLSelectionDetailComponent<S> | null
  BacklinksCount?: TLBacklinksCountComponent<S> | null
  QuickLinks?: TLQuickLinksComponent<S> | null
  DirectionIndicator?: TLDirectionIndicatorComponent<S> | null
  Handle?: TLHandleComponent<S> | null
  ContextBar?: TLContextBarComponent<S> | null
  Brush?: TLBrushComponent | null
  Grid?: TLGridComponent | null
}
