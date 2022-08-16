import { TLApp, TLShape, TLToolState } from '~lib'
import type { TLEventMap, TLStateEvents } from '~types'
import type { TLMoveTool } from '../TLMoveTool'

export class IdleState<
  S extends TLShape,
  K extends TLEventMap,
  R extends TLApp<S, K>,
  P extends TLMoveTool<S, K, R>
> extends TLToolState<S, K, R, P> {
  static id = 'idle'

  onEnter = (info: any) => {
    if (this.parent.prevTool && info.exit) {
      this.app.setCurrentState(this.parent.prevTool)
      setTimeout(() => {
        this.app.cursors.reset()
        this.app.cursors.setCursor(this.parent.prevTool.cursor)
      })
    }
  }

  onPointerDown: TLStateEvents<S, K>['onPointerDown'] = (info, e) => {
    if (info.order) return
    this.tool.transition('panning')
  }
}
