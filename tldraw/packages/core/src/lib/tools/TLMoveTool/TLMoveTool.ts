import { TLApp, TLShape, TLTool } from '~lib'
import { TLCursor, TLEventMap } from '~types'
import { IdleHoldState, IdleState, PanningState } from './states'

export class TLMoveTool<
  S extends TLShape = TLShape,
  K extends TLEventMap = TLEventMap,
  R extends TLApp<S, K> = TLApp<S, K>
> extends TLTool<S, K, R> {
  static id = 'move'
  static shortcut = ['h']

  static states = [IdleState, IdleHoldState, PanningState]

  static initial = 'idle'

  cursor = TLCursor.Grab

  prevTool: any = null

  onEnter = (info: any) => {
    this.prevTool = info?.prevTool
  }
}
