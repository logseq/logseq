import { TLApp, TLShape, TLTool } from '~lib'
import { TLCursor, TLEventMap, TLStateEvents } from '~types'
import { IdleHoldState, IdleState, PanningState, PinchingState } from './states'

export class TLMoveTool<
  S extends TLShape = TLShape,
  K extends TLEventMap = TLEventMap,
  R extends TLApp<S, K> = TLApp<S, K>
> extends TLTool<S, K, R> {
  static id = 'move'
  static shortcut = ['h']

  static states = [IdleState, IdleHoldState, PanningState, PinchingState]

  static initial = 'idle'

  cursor = TLCursor.Grab

  prevTool: any = null

  onEnter = (info: any) => {
    this.prevTool = info?.prevTool
  }

  onKeyDown: TLStateEvents<S>['onKeyDown'] = (info, e) => {
    switch (e.key) {
      case 'Escape': {
        this.app.transition('select')
        break
      }
    }
  }
}
