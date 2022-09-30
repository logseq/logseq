import { type TLEventMap, TLCursor, type TLStateEvents } from '../../../types'
import type { TLShape } from '../../shapes'
import type { TLApp } from '../../TLApp'
import { TLTool } from '../../TLTool'
import { IdleHoldState, IdleState, PanningState, PinchingState } from './states'

export class TLMoveTool<
  S extends TLShape = TLShape,
  K extends TLEventMap = TLEventMap,
  R extends TLApp<S, K> = TLApp<S, K>
> extends TLTool<S, K, R> {
  static id = 'move'
  static shortcut = ['2']

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
