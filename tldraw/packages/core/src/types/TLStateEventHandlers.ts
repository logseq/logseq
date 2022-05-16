import type { TLShape } from '~lib'
import type { TLEventHandlers } from './TLEventHandlers'
import type { TLEvents } from './TLEvents'
import type { TLEventMap } from './TLEventMap'

export interface TLStateEvents<S extends TLShape = TLShape, K extends TLEventMap = TLEventMap>
  extends TLEventHandlers<S, K> {
  onEnter: (info: { fromId: string } & any) => void
  onExit: (info: { toId: string } & any) => void
  onTransition: (info: { toId: string; fromId: string } & any) => void
  onModifierKey: TLEvents<S, K>['keyboard']
}
