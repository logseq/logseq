/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TLEventInfo } from './types'
import type { TLShape } from '~lib'
import type { TLEventMap } from './TLEventMap'

export interface TLEvents<
  S extends TLShape = TLShape,
  K extends TLEventMap = TLEventMap,
  E extends TLEventInfo<S> = TLEventInfo<S>
> {
  wheel: (info: E & { delta: number[]; point: number[] }, event: K['wheel']) => void
  pinch: (
    info: E & { delta: number[]; point: number[]; offset: number[] },
    event: K['wheel'] | K['pointer'] | K['touch'] | K['keyboard'] | K['gesture']
  ) => void
  pointer: (info: E, event: K['pointer'] | K['wheel']) => void
  keyboard: (info: E, event: K['keyboard']) => void
}
