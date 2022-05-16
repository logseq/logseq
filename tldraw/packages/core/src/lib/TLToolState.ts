/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TLApp, TLShape, TLTool } from '~lib'
import type { TLEventMap } from '~types'
import { TLState } from './TLState'

export interface TLToolStateClass<
  S extends TLShape = TLShape,
  K extends TLEventMap = TLEventMap,
  R extends TLApp<S, K> = TLApp<S, K>,
  P extends TLTool<S, K, R> = TLTool<S, K, R>
> {
  new (tool: P, app: R): TLToolState<S, K, R, P>
  id: string
  defaultProps: S['props']
}

export abstract class TLToolState<
  S extends TLShape,
  K extends TLEventMap,
  R extends TLApp<S, K>,
  P extends TLTool<S, K, R>
> extends TLState<S, K, R, P> {
  get app() {
    return this.root
  }

  get tool() {
    return this.parent
  }
}
