import type { TLEventInfo, TLEvents } from '@tldraw/core'
import type { TLReactShape } from '../lib'
import type { TLReactEventMap } from './TLReactEventMap'

export interface TLReactEventHandlers<
  S extends TLReactShape = TLReactShape,
  E extends TLEventInfo<S> = TLEventInfo<S>
> {
  onPointerDown: TLEvents<S, TLReactEventMap, E>['pointer']
  onPointerUp: TLEvents<S, TLReactEventMap, E>['pointer']
  onPointerMove: TLEvents<S, TLReactEventMap, E>['pointer']
  onPointerEnter: TLEvents<S, TLReactEventMap, E>['pointer']
  onPointerLeave: TLEvents<S, TLReactEventMap, E>['pointer']
  onKeyDown: TLEvents<S, TLReactEventMap, E>['keyboard']
  onKeyUp: TLEvents<S, TLReactEventMap, E>['keyboard']
  onPinchStart: TLEvents<S, TLReactEventMap, E>['pinch']
  onPinch: TLEvents<S, TLReactEventMap, E>['pinch']
  onPinchEnd: TLEvents<S, TLReactEventMap, E>['pinch']
}
