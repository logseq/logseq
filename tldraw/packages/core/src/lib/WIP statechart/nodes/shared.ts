import type { TLTargetType, TLSelectionHandle } from '~types'
import type { TLShape } from '../../shapes/TLShape'

export type TLEventInfo<S extends TLShape> =
  | { type: TLTargetType.Canvas; target: 'canvas'; order: number }
  | { type: TLTargetType.Shape; target: S; order: number }
  | {
      type: TLTargetType.Selection
      target: TLSelectionHandle
      order: number
    }

export interface TLPointerEvent<T = Element> extends React.MouseEvent<T, PointerEvent> {
  pointerId: number
  pressure: number
  tangentialPressure: number
  tiltX: number
  tiltY: number
  twist: number
  width: number
  height: number
  pointerType: 'mouse' | 'pen' | 'touch'
  isPrimary: boolean
  order?: number
}

export type AnyObject = { [key: string]: any }

export type TLShortcut<C extends unknown> = {
  keys: string | string[]
  fn: (info: C) => void
}

// Events as they come in from the Renderer
export interface TLEvent<S extends TLShape = TLShape, E extends TLEventInfo<S> = TLEventInfo<S>> {
  wheel: (info: E & { delta: number[]; point: number[] }, event: WheelEvent) => void
  pinch: (
    info: E & { delta: number[]; point: number[]; offset: number[] },
    event:
      | WheelEvent
      | PointerEvent
      | TouchEvent
      | (PointerEvent & {
          scale: number
          rotation: number
        })
  ) => void
  pointer: (
    info: E,
    event: TLPointerEvent | KeyboardEvent | WheelEvent | React.KeyboardEvent
  ) => void
  keyboard: (info: E, event: React.KeyboardEvent) => void
  onModifierKey: <E extends TLEventInfo<S>>(info: E, event: React.KeyboardEvent) => void
  onEnter: <E = { fromId: string }>(info: E) => void
  onExit: <E = { toId: string }>(info: E) => void
  onTransition: <E = { toId: string; fromId: string }>(info: E) => void
}

export type TLEvents<
  S extends TLShape = TLShape,
  C extends any = any,
  E extends TLEventInfo<S> = TLEventInfo<S>
> = {
  onWheel: TLEvent<S, E>['wheel']
  onPointerDown: TLEvent<S, E>['pointer']
  onPointerUp: TLEvent<S, E>['pointer']
  onPointerMove: TLEvent<S, E>['pointer']
  onPointerEnter: TLEvent<S, E>['pointer']
  onPointerLeave: TLEvent<S, E>['pointer']
  onKeyDown: TLEvent<S, E>['keyboard']
  onKeyUp: TLEvent<S, E>['keyboard']
  onPinchStart: TLEvent<S, E>['pinch']
  onPinch: TLEvent<S, E>['pinch']
  onPinchEnd: TLEvent<S, E>['pinch']
  onEnter: TLEvent<S, E>['onEnter']
  onExit: TLEvent<S, E>['onExit']
  onTransition: TLEvent<S, E>['onTransition']
  onModifierKey: TLEvent<S, E>['onModifierKey']
}

// Events as they are handled on states
export interface TLStateEvent<
  S extends TLShape = TLShape,
  C extends any = any,
  E extends TLEventInfo<S> = TLEventInfo<S>
> {
  wheel: (info: E & { delta: number[]; point: number[] }, context: C, event: WheelEvent) => void
  pinch: (
    info: E & { delta: number[]; point: number[]; offset: number[] },
    context: C,
    event:
      | WheelEvent
      | PointerEvent
      | TouchEvent
      | (PointerEvent & {
          scale: number
          rotation: number
        })
  ) => void
  pointer: (
    info: E,
    context: C,
    event: TLPointerEvent | KeyboardEvent | WheelEvent | React.KeyboardEvent
  ) => void
  keyboard: (info: E, context: C, event: React.KeyboardEvent) => void
  onModifierKey: (info: TLEventInfo<S>, context: C, event: React.KeyboardEvent) => void
  onEnter: (info: { fromId: string }, context: C) => void
  onExit: (info: { toId: string }, context: C) => void
  onTransition: (info: { toId: string; fromId: string }, context: C) => void
}

export type TLStateEvents<
  S extends TLShape = TLShape,
  C extends any = any,
  E extends TLEventInfo<S> = TLEventInfo<S>
> = {
  onWheel: TLStateEvent<S, C, E>['wheel']
  onPointerDown: TLStateEvent<S, C, E>['pointer']
  onPointerUp: TLStateEvent<S, C, E>['pointer']
  onPointerMove: TLStateEvent<S, C, E>['pointer']
  onPointerEnter: TLStateEvent<S, C, E>['pointer']
  onPointerLeave: TLStateEvent<S, C, E>['pointer']
  onKeyDown: TLStateEvent<S, C, E>['keyboard']
  onKeyUp: TLStateEvent<S, C, E>['keyboard']
  onPinchStart: TLStateEvent<S, C, E>['pinch']
  onPinch: TLStateEvent<S, C, E>['pinch']
  onPinchEnd: TLStateEvent<S, C, E>['pinch']
  onEnter: TLStateEvent<S, C, E>['onEnter']
  onExit: TLStateEvent<S, C, E>['onExit']
  onTransition: TLStateEvent<S, C, E>['onTransition']
  onModifierKey: TLStateEvent<S, C, E>['onModifierKey']
}
