import { Vec } from '@tldraw/vec'
import type { TLBoxTool } from '../TLBoxTool'
import { TLShape, TLApp, TLToolState, TLBoxShape } from '~lib'
import type { TLEventMap, TLStateEvents } from '~types'

export class PointingState<
  S extends TLShape,
  T extends TLBoxShape,
  K extends TLEventMap,
  R extends TLApp<S, K>,
  P extends TLBoxTool<T, S, K, R>
> extends TLToolState<S, K, R, P> {
  static id = 'pointing'

  onPointerMove: TLStateEvents<S, K>['onPointerMove'] = () => {
    const { currentPoint, originPoint } = this.app.inputs
    if (Vec.dist(currentPoint, originPoint) > 5) {
      this.tool.transition('creating')
      this.app.setSelectedShapes(this.app.currentPage.shapes)
    }
  }

  onPointerUp = () => {
    this.tool.transition('idle')
  }
}
