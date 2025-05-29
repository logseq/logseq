import type { TLApp, TLTool } from '@tldraw/core'
import type { TLReactShape } from '../lib'
import type { TLReactEventMap } from './TLReactEventMap'

export interface TLReactToolConstructor<
  S extends TLReactShape = TLReactShape,
  K extends TLReactEventMap = TLReactEventMap,
  R extends TLApp<S, K> = TLApp<S, K>
> {
  new (parent: R, app: R): TLTool<S, K, R>
  id: string
}
