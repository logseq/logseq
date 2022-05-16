import { TLApp } from '@tldraw/core'
import type { TLReactShape } from './TLReactShape'
import type { TLReactEventMap } from '~types'

export class TLReactApp<S extends TLReactShape = TLReactShape> extends TLApp<S, TLReactEventMap> {}
