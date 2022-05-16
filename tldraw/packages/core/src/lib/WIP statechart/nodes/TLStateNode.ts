import type { TLShape } from '../../shapes/TLShape'
import type { AnyObject, TLShortcut, TLEvent, TLEvents, TLStateEvent } from './shared'
import { action } from 'mobx'

export interface TLStateNodeConstructor<S extends TLShape = TLShape, C extends any = any> {
  new (): TLStateNode<S, C>
  id: string
}

export abstract class TLStateNode<S extends TLShape = TLShape, C extends any = any> {
  static id: string
  static shortcut?: string[]

  abstract id: string
  abstract context: C

  shortcuts?: TLShortcut<S>[]

  _onWheel?: TLStateEvent<S, C>['wheel']
  _onPointerDown?: TLStateEvent<S, C>['pointer']
  _onPointerUp?: TLStateEvent<S, C>['pointer']
  _onPointerMove?: TLStateEvent<S, C>['pointer']
  _onPointerEnter?: TLStateEvent<S, C>['pointer']
  _onPointerLeave?: TLStateEvent<S, C>['pointer']
  _onKeyDown?: TLStateEvent<S, C>['keyboard']
  _onKeyUp?: TLStateEvent<S, C>['keyboard']
  _onPinchStart?: TLStateEvent<S, C>['pinch']
  _onPinch?: TLStateEvent<S, C>['pinch']
  _onPinchEnd?: TLStateEvent<S, C>['pinch']
  _onEnter?: TLStateEvent<S, C>['onEnter']
  _onExit?: TLStateEvent<S, C>['onExit']
  _onTransition?: TLStateEvent<S, C>['onTransition']
  _onModifierKey?: TLStateEvent<S, C>['onModifierKey']

  protected _isActive = false

  get isActive() {
    return this._isActive
  }

  /* ----------- Subscriptions / Disposables ---------- */

  protected _disposables: (() => void)[] = []

  dispose() {
    this._disposables.forEach(disposable => disposable())
    return this
  }

  /* --------------------- Events --------------------- */

  onTransition: TLEvent<S>['onTransition'] = info => {
    // this._onTransition?.(info, this.context)
  }

  onEnter: TLEvent<S>['onEnter'] = info => {
    this._isActive = true
    // this._onEnter?.(info, this.context)
  }

  onExit: TLEvent<S>['onExit'] = info => {
    this._isActive = false
    // this._onExit?.(info, this.context)
  }

  onWheel: TLEvent<S>['wheel'] = (info, event) => {
    this._onWheel?.(info, this.context, event)
  }

  onPointerDown: TLEvent<S>['pointer'] = (info, event) => {
    this._onPointerDown?.(info, this.context, event)
  }

  onPointerMove: TLEvent<S>['pointer'] = (info, event) => {
    this._onPointerMove?.(info, this.context, event)
  }

  onPointerUp: TLEvent<S>['pointer'] = (info, event) => {
    this._onPointerUp?.(info, this.context, event)
  }

  onPointerEnter: TLEvent<S>['pointer'] = (info, event) => {
    this._onPointerEnter?.(info, this.context, event)
  }

  onPointerLeave: TLEvent<S>['pointer'] = (info, event) => {
    this._onPointerLeave?.(info, this.context, event)
  }

  onKeyDown: TLEvent<S>['keyboard'] = (info, event) => {
    this.onModifierKey(info, event)
    this._onKeyDown?.(info, this.context, event)
  }

  onKeyUp: TLEvent<S>['keyboard'] = (info, event) => {
    this.onModifierKey(info, event)
    this._onKeyUp?.(info, this.context, event)
  }

  onPinchStart: TLEvent<S>['pinch'] = (info, event) => {
    this._onPinchStart?.(info, this.context, event)
  }

  onPinch: TLEvent<S>['pinch'] = (info, event) => {
    this._onPinch?.(info, this.context, event)
  }

  onPinchEnd: TLEvent<S>['pinch'] = (info, event) => {
    this._onPinchEnd?.(info, this.context, event)
  }

  onModifierKey: TLEvent<S>['keyboard'] = (info, event) => {
    switch (event.key) {
      case 'Shift':
      case 'Alt':
      case 'Ctrl':
      case 'Meta': {
        this.onPointerMove(info, event)
        break
      }
    }
  }
}

export abstract class TLLeafStateNode<
  S extends TLShape = TLShape,
  C extends any = any,
  X extends C & Record<string, unknown> = C & Record<string, unknown>,
  R extends TLBranchStateNode<S> = TLBranchStateNode<S>,
  P extends TLBranchStateNode<S> = TLBranchStateNode<S>
> {
  abstract root: R
  abstract parent: P
  abstract context: X
}

export abstract class TLBranchStateNode<
  S extends TLShape = TLShape,
  C extends any = any
> extends TLStateNode<S, C> {
  static id: string
  static shortcut?: string[]

  abstract id: string
  abstract initial: string
  abstract context: C
  abstract currentState: TLStateNode<S>

  // Child States

  abstract states: Record<string, TLStateNode<S>>

  @action setCurrentState(state: TLStateNode<S>) {
    this.currentState = state
  }

  transition = (id: string, data: AnyObject = {}) => {
    const nextState = this.states[id]
    const prevState = this.currentState
    if (!nextState) throw Error(`Could not find a state named ${id}.`)
    if (this.currentState) {
      prevState.onExit({ ...data, toId: id })
      // prevState.dispose()
      // nextState.registerKeyboardShortcuts()
      this.setCurrentState(nextState)
      this.onTransition({ ...data, fromId: prevState.id, toId: id })
      nextState.onEnter({ ...data, fromId: prevState.id })
    } else {
      this.currentState = nextState
      nextState.onEnter({ ...data, fromId: '' })
    }
  }

  // Active

  forwardEvent = <K extends keyof TLEvents>(eventName: K, ...args: Parameters<TLEvents[K]>) => {
    if (this.currentState?.[eventName]) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      this.currentState?.[eventName](...args)
    }
  }

  onTransition: TLEvent<S>['onTransition'] = info => {
    // this._onTransition?.(info, this.context)
  }

  onEnter: TLEvent<S>['onEnter'] = info => {
    this._isActive = true
    if (this.initial) this.transition(this.initial, info)
    // this._onEnter?.(info, this.context)
  }

  onExit: TLEvent<S>['onExit'] = info => {
    this._isActive = false
    this.currentState?.onExit?.({ fromId: 'parent' })
    // this._onExit?.(info, this.context)
  }

  onWheel: TLEvent<S>['wheel'] = (info, event) => {
    this._onWheel?.(info, this.context, event)
    this.forwardEvent('onWheel', info, event)
  }

  onPointerDown: TLEvent<S>['pointer'] = (info, event) => {
    this._onPointerDown?.(info, this.context, event)
    this.forwardEvent('onPointerDown', info, event)
  }

  onPointerMove: TLEvent<S>['pointer'] = (info, event) => {
    this._onPointerMove?.(info, this.context, event)
    this.forwardEvent('onPointerMove', info, event)
  }

  onPointerUp: TLEvent<S>['pointer'] = (info, event) => {
    this._onPointerUp?.(info, this.context, event)
    this.forwardEvent('onPointerUp', info, event)
  }

  onPointerEnter: TLEvent<S>['pointer'] = (info, event) => {
    this._onPointerEnter?.(info, this.context, event)
    this.forwardEvent('onPointerEnter', info, event)
  }

  onPointerLeave: TLEvent<S>['pointer'] = (info, event) => {
    this._onPointerLeave?.(info, this.context, event)
    this.forwardEvent('onPointerLeave', info, event)
  }

  onKeyDown: TLEvent<S>['keyboard'] = (info, event) => {
    this.onModifierKey(info, event)
    this._onKeyDown?.(info, this.context, event)
    this.forwardEvent('onKeyDown', info, event)
  }

  onKeyUp: TLEvent<S>['keyboard'] = (info, event) => {
    this.onModifierKey(info, event)
    this._onKeyUp?.(info, this.context, event)
    this.forwardEvent('onKeyUp', info, event)
  }

  onPinchStart: TLEvent<S>['pinch'] = (info, event) => {
    this._onPinchStart?.(info, this.context, event)
    this.forwardEvent('onPinchStart', info, event)
  }

  onPinch: TLEvent<S>['pinch'] = (info, event) => {
    this._onPinch?.(info, this.context, event)
    this.forwardEvent('onPinch', info, event)
  }

  onPinchEnd: TLEvent<S>['pinch'] = (info, event) => {
    this._onPinchEnd?.(info, this.context, event)
    this.forwardEvent('onPinchEnd', info, event)
  }

  onModifierKey: TLEvent<S>['keyboard'] = (info, event) => {
    switch (event.key) {
      case 'Shift':
      case 'Alt':
      case 'Ctrl':
      case 'Meta': {
        this.onPointerMove(info, event)
        break
      }
    }
  }
}
