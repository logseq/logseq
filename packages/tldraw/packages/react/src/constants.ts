/* eslint-disable @typescript-eslint/no-explicit-any */
import { TLResizeCorner, TLResizeEdge } from '@tldraw/core'

export const PI = Math.PI
export const TAU = PI / 2
export const PI2 = PI * 2
export const EPSILON = Math.PI / 180
export const FIT_TO_SCREEN_PADDING = 100
export const DOUBLE_CLICK_DURATION = 300
export const CARDINAL_DIRECTIONS = ['north', 'east', 'south', 'west']
export const NOOP = () => void null
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
export const IMAGE_EXTENSIONS = ['.png', '.svg', '.jpg', '.jpeg', '.gif']
export const VIDEO_EXTENSIONS = isSafari ? [] : ['.mp4', '.webm']

export const EMPTY_OBJECT: any = {}
export const EMPTY_ARRAY: any[] = []

export const CURSORS = {
  canvas: 'default',
  grab: 'grab',
  grabbing: 'grabbing',
  [TLResizeCorner.TopLeft]: 'resize-nwse',
  [TLResizeCorner.TopRight]: 'resize-nesw',
  [TLResizeCorner.BottomRight]: 'resize-nwse',
  [TLResizeCorner.BottomLeft]: 'resize-nesw',
  [TLResizeEdge.Top]: 'resize-ns',
  [TLResizeEdge.Right]: 'resize-ew',
  [TLResizeEdge.Bottom]: 'resize-ns',
  [TLResizeEdge.Left]: 'resize-ew',
}
