import { makeAutoObservable } from 'mobx'
import type { TLShape } from '../../shapes/TLShape'
import type { AppNode } from './AppNode'
import type { TLShortcut, TLStateEvents } from './shared'
import { TLBranchStateNode, TLStateNode } from './TLStateNode'
import type { TLToolStateNodeConstructor } from './ToolStateNode'

export interface TLToolNodeConstructor<
  S extends TLShape = TLShape,
  A extends AppNode<S> = AppNode<S>,
  C extends any = any
> {
  new (app: A): TLToolNode<S, A, C>
  id: string
}

export class TLToolNode<
  S extends TLShape = TLShape,
  A extends AppNode<S> = AppNode<S>,
  C extends any = any
> extends TLBranchStateNode<S, C & { app: A }> {
  id: string
  app: A
  context: C & { app: A }
  initial: string
  states: Record<string, TLStateNode<S>>
  currentState: TLStateNode<S>

  constructor(
    app: A,
    options: {
      id: string
      initial: string
      states?: TLToolStateNodeConstructor<S, A, TLToolNode<S, A, C>>[]
      shortcut?: string[]
      shortcuts?: TLShortcut<S>[]
      context?: C
    } & Partial<TLStateEvents<S, C & { app: A }>>
  ) {
    super()
    this.app = app
    this.id = options.id
    this.shortcuts = options.shortcuts
    this.context = { ...(options.context || ({} as any)), app: this } as C & { app: A }
    this.initial = options.initial
    this.states = options.states
      ? Object.fromEntries(
          options.states.map(stateConstructor => [
            stateConstructor.id,
            new stateConstructor(app, this),
          ])
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

  registerStates = (
    ...stateClasses: TLToolStateNodeConstructor<S, A, TLToolNode<S, A, C>>[]
  ): void => {
    stateClasses.forEach(
      StateClass => (this.states[StateClass.id] = new StateClass(this.app, this))
    )
  }

  deregisterStates = (...states: TLToolStateNodeConstructor<S, A, TLToolNode<S, A, C>>[]): void => {
    states.forEach(StateClass => {
      this.states[StateClass.id]?.dispose()
      delete this.states[StateClass.id]
    })
  }
}

export function createTool<
  S extends TLShape = TLShape,
  A extends AppNode<S> = AppNode<S>,
  C extends any = any
>(
  options: {
    id: string
    initial: string
    shortcut?: string[]
    shortcuts?: TLShortcut<S>[]
    context?: C
    states?: TLToolStateNodeConstructor<S, A, TLToolNode<S, A>>[]
  } & Partial<TLStateEvents<S, C & { app: A }>>
): {
  new (app: A): TLToolNode<S, A, C>
  id: string
  shortcut?: string[]
} {
  class ITool extends TLToolNode<S, A> {
    constructor(app: A) {
      super(app, options)
    }
    static id = options.id
    static shortcut = options.shortcut
  }

  return ITool
}
