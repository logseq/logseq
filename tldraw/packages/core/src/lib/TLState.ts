/* eslint-disable @typescript-eslint/no-explicit-any */
import { action, makeObservable, observable, transaction } from 'mobx'
import type {
  TLEventMap,
  TLEventHandlers,
  TLCursor,
  AnyObject,
  TLStateEvents,
  TLShortcut,
  TLEvents,
} from '../types'
import type { TLShape } from './shapes'

export interface TLStateClass<
  S extends TLShape,
  K extends TLEventMap,
  R extends TLRootState<S, K> = TLRootState<S, K>,
  P extends R | TLState<S, K, R, any> = any
> {
  new (parent: P, root: R): TLState<S, K, R>
  id: string
}

export abstract class TLRootState<S extends TLShape, K extends TLEventMap>
  implements Partial<TLEventHandlers<S, K>>
{
  constructor() {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const id = this.constructor['id'] as string

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const initial = this.constructor['initial'] as string | undefined

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const states = this.constructor['states'] as TLStateClass<S>[]

    this._id = id
    this._initial = initial
    this._states = states
  }

  private _id: string
  private _initial?: string
  protected _states: TLStateClass<S, K, any, any>[]
  private _isActive = false
  readonly cursor?: TLCursor

  protected _disposables: (() => void)[] = []

  dispose() {
    this._disposables.forEach(disposable => disposable())
    this._disposables = []
    return this
  }

  get initial() {
    return this._initial
  }

  get states() {
    return this._states
  }

  get id() {
    return this._id
  }

  get isActive(): boolean {
    return this._isActive
  }

  get ascendants(): TLRootState<S, K>[] {
    return [this]
  }

  get descendants(): (TLState<S, K, this, any> | this)[] {
    return Array.from(this.children.values()).flatMap(state => [state, ...state.descendants])
  }

  /* ------------------ Child States ------------------ */

  children = new Map<string, TLState<S, K, any, any>>([])

  registerStates = (stateClasses: TLStateClass<S, K, any>[]) => {
    stateClasses.forEach(StateClass => this.children.set(StateClass.id, new StateClass(this, this)))
    return this
  }

  deregisterStates = (states: TLStateClass<S, K, any>[]) => {
    states.forEach(StateClass => {
      this.children.get(StateClass.id)?.dispose()
      this.children.delete(StateClass.id)
    })
    return this
  }

  @observable currentState: TLState<S, any, any> = {} as TLState<S, any, any>

  @action setCurrentState(state: TLState<S, any, any>) {
    this.currentState = state
  }

  /**
   * Transition to a new active state.
   *
   * @param id The id of the new active state.
   * @param data (optional) Any data to send to the new active state's `onEnter` method.
   */
  transition = (id: string, data: AnyObject = {}) => {
    if (this.children.size === 0)
      throw Error(`Tool ${this.id} has no states, cannot transition to ${id}.`)
    const nextState = this.children.get(id)
    const prevState = this.currentState
    if (!nextState) throw Error(`Could not find a state named ${id}.`)
    transaction(() => {
      if (this.currentState) {
        prevState._events.onExit({ ...data, toId: id })
        prevState.dispose()
        this.setCurrentState(nextState)
        this._events.onTransition({ ...data, fromId: prevState.id, toId: id })
        nextState._events.onEnter({ ...data, fromId: prevState.id })
      } else {
        this.currentState = nextState
        nextState._events.onEnter({ ...data, fromId: '' })
      }
    })
    return this
  }

  isIn = (path: string) => {
    const ids = path.split('.').reverse()
    let state = this as TLRootState<any, any>
    while (ids.length > 0) {
      const id = ids.pop()
      if (!id) {
        return true
      }
      if (state.currentState.id === id) {
        if (ids.length === 0) {
          return true
        }
        state = state.currentState
        continue
      } else {
        return false
      }
    }
    return false
  }

  isInAny = (...paths: string[]) => {
    return paths.some(this.isIn)
  }

  /* ----------------- Internal Events ---------------- */

  private forwardEvent = <
    E extends keyof TLStateEvents<S, K>,
    A extends Parameters<TLStateEvents<S, K>[E]>
  >(
    eventName: keyof TLStateEvents<S, K>,
    ...args: A
  ) => {
    if (this.currentState?._events?.[eventName]) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      transaction(() => this.currentState._events?.[eventName](...args))
    }
  }

  _events: TLStateEvents<S, K> = {
    /**
     * Handle the change from inactive to active.
     *
     * @param info The previous state and any info sent via the transition.
     */
    onTransition: info => {
      this.onTransition?.(info)
    },
    /**
     * Handle the change from inactive to active.
     *
     * @param info The previous state and any info sent via the transition.
     */
    onEnter: info => {
      this._isActive = true
      if (this.initial) this.transition(this.initial, info)
      this.onEnter?.(info)
    },

    /**
     * Handle the change from active to inactive.
     *
     * @param info The next state and any info sent via the transition.
     */
    onExit: info => {
      this._isActive = false
      this.currentState?.onExit?.({ toId: 'parent' })
      this.onExit?.(info)
    },

    /**
     * Respond to pointer down events forwarded to the state by its parent. Run the current active
     * child state's handler, then the state's own handler.
     *
     * @param info The event info from TLInputs.
     * @param event The DOM event.
     */
    onPointerDown: (info, event) => {
      this.onPointerDown?.(info, event)
      this.forwardEvent('onPointerDown', info, event)
    },

    /**
     * Respond to pointer up events forwarded to the state by its parent. Run the current active
     * child state's handler, then the state's own handler.
     *
     * @param info The event info from TLInputs.
     * @param event The DOM event.
     */
    onPointerUp: (info, event) => {
      this.onPointerUp?.(info, event)
      this.forwardEvent('onPointerUp', info, event)
    },

    /**
     * Respond to pointer move events forwarded to the state by its parent. Run the current active
     * child state's handler, then the state's own handler.
     *
     * @param info The event info from TLInputs.
     * @param event The DOM event.
     */
    onPointerMove: (info, event) => {
      this.onPointerMove?.(info, event)
      this.forwardEvent('onPointerMove', info, event)
    },

    /**
     * Respond to pointer enter events forwarded to the state by its parent. Run the current active
     * child state's handler, then the state's own handler.
     *
     * @param info The event info from TLInputs.
     * @param event The DOM event.
     */
    onPointerEnter: (info, event) => {
      this.onPointerEnter?.(info, event)
      this.forwardEvent('onPointerEnter', info, event)
    },

    /**
     * Respond to pointer leave events forwarded to the state by its parent. Run the current active
     * child state's handler, then the state's own handler.
     *
     * @param info The event info from TLInputs.
     * @param event The DOM event.
     */
    onPointerLeave: (info, event) => {
      this.onPointerLeave?.(info, event)
      this.forwardEvent('onPointerLeave', info, event)
    },

    /**
     * Respond to double click events forwarded to the state by its parent. Run the current active
     * child state's handler, then the state's own handler.
     *
     * @param info The event info from TLInputs.
     * @param event The DOM event.
     */
    onDoubleClick: (info, event) => {
      this.onDoubleClick?.(info, event)
      this.forwardEvent('onDoubleClick', info, event)
    },

    /**
     * Respond to key down events forwarded to the state by its parent. Run the current active child
     * state's handler, then the state's own handler.
     *
     * @param info The event info from TLInputs.
     * @param event The DOM event.
     */
    onKeyDown: (info, event) => {
      this._events.onModifierKey(info, event)
      this.onKeyDown?.(info, event)
      this.forwardEvent('onKeyDown', info, event)
    },

    /**
     * Respond to key up events forwarded to the state by its parent. Run the current active child
     * state's handler, then the state's own handler.
     *
     * @param info The event info from TLInputs.
     * @param event The DOM event.
     */
    onKeyUp: (info, event) => {
      this._events.onModifierKey(info, event)
      this.onKeyUp?.(info, event)
      this.forwardEvent('onKeyUp', info, event)
    },

    /**
     * Respond to pinch start events forwarded to the state by its parent. Run the current active
     * child state's handler, then the state's own handler.
     *
     * @param info The event info from TLInputs.
     * @param gesture The gesture info from useGesture.
     * @param event The DOM event.
     */
    onPinchStart: (info, event) => {
      this.onPinchStart?.(info, event)
      this.forwardEvent('onPinchStart', info, event)
    },

    /**
     * Respond to pinch events forwarded to the state by its parent. Run the current active child
     * state's handler, then the state's own handler.
     *
     * @param info The event info from TLInputs.
     * @param gesture The gesture info from useGesture.
     * @param event The DOM event.
     */
    onPinch: (info, event) => {
      this.onPinch?.(info, event)
      this.forwardEvent('onPinch', info, event)
    },

    /**
     * Respond to pinch end events forwarded to the state by its parent. Run the current active
     * child state's handler, then the state's own handler.
     *
     * @param info The event info from TLInputs.
     * @param gesture The gesture info from useGesture.
     * @param event The DOM event.
     */
    onPinchEnd: (info, event) => {
      this.onPinchEnd?.(info, event)
      this.forwardEvent('onPinchEnd', info, event)
    },

    /**
     * When a modifier key is pressed, treat it as a pointer move.
     *
     * @private
     * @param info The event info from TLInputs.
     * @param event The DOM event.
     */
    onModifierKey: (info, event) => {
      switch (event.key) {
        case 'Shift':
        case 'Alt':
        case 'Ctrl':
        case 'Meta': {
          this._events.onPointerMove(info, event as unknown as K['pointer'])
          break
        }
      }
    },
  }

  /* ----------------- For Subclasses ----------------- */

  static id: string

  static shortcuts?: TLShortcut<any, any, any>[]

  onEnter?: TLStateEvents<S, K>['onEnter']
  onExit?: TLStateEvents<S, K>['onExit']
  onTransition?: TLStateEvents<S, K>['onTransition']
  onPointerDown?: TLEvents<S, K>['pointer']
  onPointerUp?: TLEvents<S, K>['pointer']
  onPointerMove?: TLEvents<S, K>['pointer']
  onPointerEnter?: TLEvents<S, K>['pointer']
  onPointerLeave?: TLEvents<S, K>['pointer']
  onDoubleClick?: TLEvents<S, K>['pointer']
  onKeyDown?: TLEvents<S, K>['keyboard']
  onKeyUp?: TLEvents<S, K>['keyboard']
  onPinchStart?: TLEvents<S, K>['pinch']
  onPinch?: TLEvents<S, K>['pinch']
  onPinchEnd?: TLEvents<S, K>['pinch']
}

export abstract class TLState<
  S extends TLShape,
  K extends TLEventMap,
  R extends TLRootState<S, K>,
  P extends R | TLState<S, K, R, any> = any
> extends TLRootState<S, K> {
  constructor(parent: P, root: R) {
    super()
    this._parent = parent
    this._root = root

    if (this.states && this.states.length > 0) {
      this.registerStates(this.states)
      const initialId = this.initial ?? this.states[0].id
      const state = this.children.get(initialId)
      if (state) {
        this.setCurrentState(state)
        this.currentState?._events.onEnter({ fromId: 'initial' })
      }
    }

    makeObservable(this)
  }

  static cursor?: TLCursor

  /* --------------------- States --------------------- */

  protected _root: R
  protected _parent: P

  get root() {
    return this._root
  }

  get parent() {
    return this._parent
  }

  get ascendants(): (P | TLState<S, K, R, any>)[] {
    if (!this.parent) return [this]
    if (!('ascendants' in this.parent)) return [this.parent, this]
    return [...this.parent.ascendants, this]
  }

  children = new Map<string, TLState<S, K, R, any>>([])

  registerStates = (stateClasses: TLStateClass<S, K, R, any>[]) => {
    stateClasses.forEach(StateClass =>
      this.children.set(StateClass.id, new StateClass(this, this._root))
    )
    return this
  }

  deregisterStates = (states: TLStateClass<S, K, R, any>[]) => {
    states.forEach(StateClass => {
      this.children.get(StateClass.id)?.dispose()
      this.children.delete(StateClass.id)
    })
    return this
  }
}
