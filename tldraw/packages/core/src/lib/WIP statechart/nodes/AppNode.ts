import { makeAutoObservable } from 'mobx'
import type { TLShape } from '../../shapes/TLShape'
import type { TLShortcut, TLStateEvents } from './shared'
import { TLBranchStateNode, TLStateNode } from './TLStateNode'
import type { TLToolNodeConstructor } from './ToolNode'

export class AppNode<
  S extends TLShape = TLShape,
  X extends { app: AppNode<S> } = { app: AppNode<S> }
> extends TLBranchStateNode<S> {
  id: string
  initial: string
  states: Record<string, TLStateNode<S>>
  context: X
  currentState: TLStateNode<S>

  constructor(
    options: {
      id: string
      initial: string
      states?: TLToolNodeConstructor<S>[]
      shortcut?: string[]
      shortcuts?: TLShortcut<S>[]
    } & Partial<TLStateEvents<S>>
  ) {
    super()
    this.id = options.id
    this.shortcuts = options.shortcuts
    this.context = { app: this as AppNode<S> } as X
    this.initial = options.initial
    this.states = options.states
      ? Object.fromEntries(
          options.states.map(stateConstructor => [stateConstructor.id, new stateConstructor(this)])
        )
      : {}
    this.currentState = this.states[options.initial]

    this._onPointerDown = options.onPointerDown
    this._onPointerMove = options.onPointerMove
    this._onPointerUp = options.onPointerUp
    this._onPointerEnter = options.onPointerEnter
    this._onPointerLeave = options.onPointerLeave
    this._onKeyDown = options.onKeyDown
    this._onKeyUp = options.onKeyUp
    this._onPinchStart = options.onPinchStart
    this._onPinchEnd = options.onPinchEnd
    this._onPinch = options.onPinch
    this._onWheel = options.onWheel
    this._onEnter = options.onEnter
    this._onExit = options.onExit
    this._onModifierKey = options.onModifierKey
    makeAutoObservable(this)
  }

  registerStates = (...stateClasses: TLToolNodeConstructor<S, AppNode<S>>[]): void => {
    stateClasses.forEach(StateClass => (this.states[StateClass.id] = new StateClass(this)))
  }

  deregisterStates = (...states: TLToolNodeConstructor<S, AppNode<S>>[]): void => {
    states.forEach(StateClass => {
      this.states[StateClass.id]?.dispose()
      delete this.states[StateClass.id]
    })
  }
}
