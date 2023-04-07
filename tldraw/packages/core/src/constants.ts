/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  type TLSelectionHandle,
  TLCursor,
  TLResizeEdge,
  TLResizeCorner,
  TLRotateCorner,
} from './types'

export const PI = Math.PI

export const TAU = PI / 2

export const PI2 = PI * 2

export const EPSILON = Math.PI / 180

export const CARDINAL_DIRECTIONS = ['north', 'east', 'south', 'west'] as const

export const FIT_TO_SCREEN_PADDING = 100

export const BINDING_DISTANCE = 4

export const ZOOM_UPDATE_FACTOR = 0.8

export const GRID_SIZE = 8

export const EXPORT_PADDING = 8

export const EMPTY_OBJECT: any = {}

export const EMPTY_ARRAY: any[] = []

export const GROUP_PADDING = 8

export const CURSORS: Record<TLSelectionHandle, TLCursor> = {
  [TLResizeEdge.Bottom]: TLCursor.NsResize,
  [TLResizeEdge.Top]: TLCursor.NsResize,
  [TLResizeEdge.Left]: TLCursor.EwResize,
  [TLResizeEdge.Right]: TLCursor.EwResize,
  [TLResizeCorner.BottomLeft]: TLCursor.NeswResize,
  [TLResizeCorner.BottomRight]: TLCursor.NwseResize,
  [TLResizeCorner.TopLeft]: TLCursor.NwseResize,
  [TLResizeCorner.TopRight]: TLCursor.NeswResize,
  [TLRotateCorner.BottomLeft]: TLCursor.SwneRotate,
  [TLRotateCorner.BottomRight]: TLCursor.SenwRotate,
  [TLRotateCorner.TopLeft]: TLCursor.NwseRotate,
  [TLRotateCorner.TopRight]: TLCursor.NeswRotate,
  rotate: TLCursor.Rotate,
  center: TLCursor.Grab,
  background: TLCursor.Grab,
}
