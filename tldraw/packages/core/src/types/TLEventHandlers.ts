import type { TLEventInfo } from './types'
import type { TLEvents } from './TLEvents'
import type { TLEventMap } from './TLEventMap'
import type { TLShape } from '../lib'

export interface TLEventHandlers<
  S extends TLShape = TLShape,
  K extends TLEventMap = TLEventMap,
  E extends TLEventInfo<S> = TLEventInfo<S>
> {
  onPointerDown: TLEvents<S, K, E>['pointer']
  onPointerUp: TLEvents<S, K, E>['pointer']
  onPointerMove: TLEvents<S, K, E>['pointer']
  onPointerEnter: TLEvents<S, K, E>['pointer']
  onPointerLeave: TLEvents<S, K, E>['pointer']
  onDoubleClick: TLEvents<S, K, E>['pointer']
  onKeyDown: TLEvents<S, K, E>['keyboard']
  onKeyUp: TLEvents<S, K, E>['keyboard']
  onPinchStart: TLEvents<S, K, E>['pinch']
  onPinch: TLEvents<S, K, E>['pinch']
  onPinchEnd: TLEvents<S, K, E>['pinch']
}
