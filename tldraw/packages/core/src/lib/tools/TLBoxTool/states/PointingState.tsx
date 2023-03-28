import { Vec } from '@tldraw/vec'
import type { TLEventMap, TLStateEvents } from '../../../../types'
import type { TLShape, TLBoxShape } from '../../../shapes'
import type { TLApp } from '../../../TLApp'
import { TLToolState } from '../../../TLToolState'
import type { TLBoxTool } from '../TLBoxTool'

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
    if (Vec.dist(currentPoint, originPoint) > 5 && !this.app.readOnly) {
      this.tool.transition('creating')
      this.app.setSelectedShapes(this.app.currentPage.shapes)
    }
  }

  onPointerUp = () => {
    this.tool.transition('idle')
  }
}
