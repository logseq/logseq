import type React from 'react'
import type { TLEventMap } from '@tldraw/core'
import type { WebKitGestureEvent } from '@use-gesture/react'

export interface TLReactEventMap extends TLEventMap {
  wheel: WheelEvent | React.WheelEvent
  pointer: PointerEvent | React.PointerEvent
  touch: TouchEvent | React.TouchEvent
  keyboard: KeyboardEvent | React.KeyboardEvent
  gesture: WebKitGestureEvent
}
