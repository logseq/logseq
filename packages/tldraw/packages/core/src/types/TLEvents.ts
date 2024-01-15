/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TLEventInfo } from './types'
import type { TLEventMap } from './TLEventMap'
import type { TLShape } from '../lib'

export interface TLEvents<
  S extends TLShape = TLShape,
  K extends TLEventMap = TLEventMap,
  E extends TLEventInfo<S> = TLEventInfo<S>
> {
  pinch: (
    info: E & { delta: number[]; point: number[]; offset: number[] },
    event: K['pointer'] | K['touch'] | K['keyboard'] | K['gesture']
  ) => void
  pointer: (info: E, event: K['pointer']) => void
  keyboard: (info: E, event: K['keyboard']) => void
}
