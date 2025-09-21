import { type TLEventMap, TLCursor, TLEvents } from '../../../types'
import type { TLDrawShape, TLShape, TLDrawShapeProps } from '../../shapes'
import type { TLApp } from '../../TLApp'
import { TLTool } from '../../TLTool'
import { IdleState, CreatingState, PinchingState } from './states'

export abstract class TLDrawTool<
  T extends TLDrawShape = TLDrawShape,
  S extends TLShape = TLShape,
  K extends TLEventMap = TLEventMap,
  R extends TLApp<S, K> = TLApp<S, K>
> extends TLTool<S, K, R> {
  static id = 'draw'

  static states = [IdleState, CreatingState, PinchingState]

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

  onPinchStart: TLEvents<S>['pinch'] = (info, event) => {
    this.transition('pinching', { info, event })
  }
}
