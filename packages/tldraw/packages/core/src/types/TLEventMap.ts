// export interface TLEventMap {
//   wheel: WheelEvent
//   pointer: PointerEvent
//   touch: TouchEvent
//   keyboard: KeyboardEvent
//   gesture: PointerEvent & {
//     scale: number
//     rotation: number
//   }
// }

import type { AnyObject } from './types'

export interface TLEventMap {
  pointer: AnyObject
  touch: AnyObject
  keyboard: AnyObject
  gesture: AnyObject & {
    scale: number
    rotation: number
  }
}
