import { type TLEventMap, TLCursor } from '../../../types'
import type { TLTextShape, TLShape } from '../../shapes'
import type { TLApp } from '../../TLApp'
import { TLTool } from '../../TLTool'
import { IdleState, CreatingState } from './states'

export abstract class TLTextTool<
  T extends TLTextShape = TLTextShape,
  S extends TLShape = TLShape,
  K extends TLEventMap = TLEventMap,
  R extends TLApp<S, K> = TLApp<S, K>
> extends TLTool<S, K, R> {
  static id = 'box'

  static states = [IdleState, CreatingState]

  static initial = 'idle'

  cursor = TLCursor.Cross

  abstract Shape: {
    new (props: Partial<T['props']>): T
    aspectRatio?: number
    id: string
    defaultProps: T['props']
  }
}
