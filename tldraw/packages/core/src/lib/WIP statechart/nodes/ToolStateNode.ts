import type { TLShape } from '../../shapes/TLShape'
import type { AppNode } from './AppNode'
import type { TLShortcut, TLStateEvents } from './shared'
import { TLStateNode } from './TLStateNode'
import type { TLToolNode } from './ToolNode'

export interface TLToolStateNodeConstructor<
  S extends TLShape = TLShape,
  A extends AppNode<S> = AppNode<S>,
  P extends TLToolNode<S, A> = TLToolNode<S, A>,
  C extends any = any
> {
  new (app: A, tool: P): TLToolStateNode<S, A, P, C>
  id: string
}

export class TLToolStateNode<
  S extends TLShape = TLShape,
  A extends AppNode<S> = AppNode<S>,
  P extends TLToolNode<S, A> = TLToolNode<S, A>,
  C extends any = any
> extends TLStateNode<S, C & { app: A; tool: P }> {
  id: string
  app: A
  tool: P
  context: C & { app: A; tool: P }

  constructor(
    app: A,
    tool: P,
    options: {
      id: string
      shortcut?: string[]
      shortcuts?: TLShortcut<S>[]
      context?: C
    } & Partial<TLStateEvents<S, C & { app: A; tool: P }>>
  ) {
    super()
    this.app = app
    this.tool = tool
    this.id = options.id
    this.shortcuts = options.shortcuts
    this.context = { ...(options.context || ({} as any)), tool, app } as C & { app: A; tool: P }

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
  }
}

export function createToolState<
  S extends TLShape = TLShape,
  A extends AppNode<S> = AppNode<S>,
  P extends TLToolNode<S, A> = TLToolNode<S, A>,
  C extends any = any
>(
  options: {
    id: string
    shortcut?: string[]
    shortcuts?: TLShortcut<S>[]
    context?: C
  } & Partial<TLStateEvents<S, C & { app: A; tool: P }>>
): {
  new (app: A, tool: P): TLToolStateNode<S, A, P, C>
  id: string
  shortcut?: string[]
} {
  class IToolState extends TLToolStateNode<S, A, P> {
    constructor(app: A, tool: P) {
      super(app, tool, options)
    }
    static id = options.id
    static shortcut = options.shortcut
  }

  return IToolState
}
