/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TLShape, TLApp } from '../lib'
import type { TLEventMap } from './TLEventMap'
import type { TLHandle } from './TLHandle'

export enum Color {
  Yellow = 'yellow',
  Red = 'red',
  Pink = 'pink',
  Green = 'green',
  Blue = 'blue',
  Purple = 'purple',
  Gray = 'gray',
  Default = '',
}

export enum Geometry {
  Box = 'box',
  Ellipse = 'ellipse',
  Polygon = 'polygon',
}

export enum AlignType {
  Top = 'top',
  CenterVertical = 'centerVertical',
  Bottom = 'bottom',
  Left = 'left',
  CenterHorizontal = 'centerHorizontal',
  Right = 'right',
}

export enum DistributeType {
  Horizontal = 'horizontal',
  Vertical = 'vertical',
}

export enum TLResizeEdge {
  Top = 'top_edge',
  Right = 'right_edge',
  Bottom = 'bottom_edge',
  Left = 'left_edge',
}

export enum TLCloneDirection {
  Up = 'up',
  Right = 'right',
  Down = 'down',
  Left = 'left',
}

export enum TLResizeCorner {
  TopLeft = 'top_left_corner',
  TopRight = 'top_right_corner',
  BottomRight = 'bottom_right_corner',
  BottomLeft = 'bottom_left_corner',
}

export enum TLRotateCorner {
  TopLeft = 'top_left_resize_corner',
  TopRight = 'top_right_resize_corner',
  BottomRight = 'bottom_right_resize_corner',
  BottomLeft = 'bottom_left_resize_corner',
}

export enum TLMoveDirection {
  Forward = 'forward',
  Backward = 'backward',
  ToFront = 'to_front',
  ToBack = 'to_back',
}

export type TLSelectionHandle =
  | TLResizeCorner
  | TLResizeEdge
  | TLRotateCorner
  | 'rotate'
  | 'background'
  | 'center'

export interface TLBoundsWithCenter extends TLBounds {
  midX: number
  midY: number
}

export enum TLSnapPoints {
  minX = 'minX',
  midX = 'midX',
  maxX = 'maxX',
  minY = 'minY',
  midY = 'midY',
  maxY = 'maxY',
}

export type TLSnap =
  | { id: TLSnapPoints; isSnapped: false }
  | {
      id: TLSnapPoints
      isSnapped: true
      to: number
      B: TLBoundsWithCenter
      distance: number
    }

export interface TLTheme {
  accent?: string
  brushFill?: string
  brushStroke?: string
  selectFill?: string
  binding?: string
  selectStroke?: string
  background?: string
  foreground?: string
  grid?: string
}

export interface TLBounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
  rotation?: number
}

export interface TLBinding {
  id: string
  toId: string
  fromId: string
  handleId: 'start' | 'end'
  distance: number
  point: number[]
}

export interface TLOffset {
  top: number
  right: number
  bottom: number
  left: number
  width: number
  height: number
}

export interface TLAsset {
  id: string
  type: string
  src: string
}

export type TLPasteEventInfo = {
  point: number[]
  shiftKey: boolean
  dataTransfer?: DataTransfer
  fromDrop?: boolean
}

export type TLCopyEventInfo = {
  text: string
  html: string
}

/* --------------------- Events --------------------- */

export type TLSubscriptionEvent =
  | {
      event: 'mount'
      info: null
    }
  | {
      event: 'persist'
      info: { replace: boolean }
    }
  | {
      event: 'undo'
      info: null
    }
  | {
      event: 'redo'
      info: null
    }
  | {
      event: 'load'
      info: null
    }
  | {
      event: 'error'
      info: Error
    }
  | {
      event: 'create-shapes'
      info: TLShape[]
    }
  | {
      event: 'delete-shapes'
      info: TLShape[]
    }
  | {
      event: 'drop'
      info: { dataTransfer: DataTransfer; point: number[] }
    }
  | {
      event: 'copy'
      info: TLCopyEventInfo
    }
  | {
      event: 'paste'
      info: TLPasteEventInfo
    }
  | {
      event: 'create-assets'
      info: { assets: TLAsset[] }
    }
  | {
      event: 'delete-assets'
      info: { assets: TLAsset[] }
    }
  | {
      event: 'canvas-dbclick'
      info: { point: number[] }
    }

export type TLSubscriptionEventName = TLSubscriptionEvent['event']

export type TLSubscriptionEventInfo<E extends TLSubscriptionEventName> = Extract<
  TLSubscriptionEvent,
  { event: E }
>['info']

export type TLCallback<
  S extends TLShape = TLShape,
  K extends TLEventMap = TLEventMap,
  R extends TLApp<S, K> = TLApp<S, K>,
  E extends TLSubscriptionEventName = TLSubscriptionEventName
> = (app: R, info: TLSubscriptionEventInfo<E>) => void

export type TLSubscription<
  S extends TLShape = TLShape,
  K extends TLEventMap = TLEventMap,
  R extends TLApp<S, K> = TLApp<S, K>,
  E extends TLSubscriptionEventName = TLSubscriptionEventName
> = {
  event: E
  callback: TLCallback<S, K, R, E>
}

export type TLSubscribe<
  S extends TLShape = TLShape,
  K extends TLEventMap = TLEventMap,
  R extends TLApp<S, K> = TLApp<S, K>
> = {
  <E extends TLSubscriptionEventName>(subscription: TLSubscription<S, K, R, E>): () => void
  <E extends TLSubscriptionEventName>(event: E, callback: TLCallback<S, K, R, E>): () => void
}

export interface TLCallbacks<
  S extends TLShape = TLShape,
  K extends TLEventMap = TLEventMap,
  R extends TLApp<S, K> = TLApp<S, K>
> {
  onMount: TLCallback<S, K, R, 'mount'>
  onPersist: TLCallback<S, K, R, 'persist'>
  onError: TLCallback<S, K, R, 'error'>
}

/* ----------------- Event Handlers ----------------- */

export enum TLTargetType {
  Canvas = 'canvas',
  Shape = 'shape',
  Minimap = 'minimap',
  Selection = 'selection',
  Handle = 'handle',
}

export type TLEventCanvasInfo = { type: TLTargetType.Canvas; order?: number }

export type TLEventMinimapInfo = { type: TLTargetType.Minimap; order?: number }

export type TLEventShapeInfo<S extends TLShape> = {
  type: TLTargetType.Shape
  shape: S
  order?: number
}

export type TLEventHandleInfo<S extends TLShape = TLShape> = {
  type: TLTargetType.Handle
  shape: S
  handle: TLHandle
  id: string
  order?: number
}

export type TLEventSelectionInfo = {
  type: TLTargetType.Selection
  handle: TLSelectionHandle
  order?: number
}

export type TLEventInfo<S extends TLShape = TLShape> =
  | TLEventCanvasInfo
  | TLEventMinimapInfo
  | TLEventShapeInfo<S>
  | TLEventHandleInfo<S>
  | TLEventSelectionInfo

/* ----------------- Type Assertion ----------------- */

export function isStringArray(arr: string[] | any[]): asserts arr is string[] {
  if (arr[0] && typeof arr[0] !== 'string') {
    throw Error('Expected a string array.')
  }
}

/* ---------------------- Misc ---------------------- */

export type AnyObject = { [key: string]: any }

export enum Decoration {
  Arrow = 'arrow',
}
