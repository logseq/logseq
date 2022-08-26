import { type TLEventMap, TLCursor } from '../../../types'
import type { TLDrawShape, TLShape, TLDrawShapeProps } from '../../shapes'
import type { TLApp } from '../../TLApp'
import { TLTool } from '../../TLTool'
import { IdleState, CreatingState } from './states'

export abstract class TLDrawTool<
  T extends TLDrawShape = TLDrawShape,
  S extends TLShape = TLShape,
  K extends TLEventMap = TLEventMap,
  R extends TLApp<S, K> = TLApp<S, K>
> extends TLTool<S, K, R> {
  static id = 'draw'

  static states = [IdleState, CreatingState]

  static initial = 'idle'

  cursor = TLCursor.Cross

  /** Whether to simplify the shape's points after creating. */
  simplify = true

  /** The minimum distance between points when simplifying a line. */
  simplifyTolerance = 1

  previousShape?: T

  abstract Shape: {
    new (props: TLDrawShapeProps): T
    id: string
  }
}
