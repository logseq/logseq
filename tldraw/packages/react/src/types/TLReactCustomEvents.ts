import type { TLReactEventMap } from './TLReactEventMap'

export interface TLReactCustomEvents {
  wheel: (event: TLReactEventMap['wheel'] & { order?: number }) => void
  pinch: (event: TLReactEventMap['gesture'] & { order?: number }) => void
  pointer: (event: React.PointerEvent & { order?: number }) => void
  keyboard: (event: TLReactEventMap['keyboard'] & { order?: number }) => void
}
