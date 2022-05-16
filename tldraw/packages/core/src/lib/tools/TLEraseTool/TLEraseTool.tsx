import { IdleState, PointingState, ErasingState } from './states'
import { TLTool, TLApp, TLShape } from '~lib'
import { TLEventMap, TLCursor } from '~types'

export abstract class TLEraseTool<
  S extends TLShape = TLShape,
  K extends TLEventMap = TLEventMap,
  R extends TLApp<S, K> = TLApp<S, K>
> extends TLTool<S, K, R> {
  static id = 'erase'

  static states = [IdleState, PointingState, ErasingState]

  static initial = 'idle'

  cursor = TLCursor.Cross
}
