import type { TLEvents } from '@tldraw/core'
import type { TLReactShape } from '../lib'
import type { TLReactEventMap } from './TLReactEventMap'

export type TLReactEvents<S extends TLReactShape> = TLEvents<S, TLReactEventMap>
