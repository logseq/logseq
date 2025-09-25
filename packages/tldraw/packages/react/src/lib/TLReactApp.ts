import { TLApp } from '@tldraw/core'
import type { TLReactEventMap } from '../types'
import type { TLReactShape } from './TLReactShape'

export class TLReactApp<S extends TLReactShape = TLReactShape> extends TLApp<S, TLReactEventMap> {}
