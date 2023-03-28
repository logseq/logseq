import { Vec } from '@tldraw/vec'
import type { TLEventMap, TLStateEvents } from '../../../../types'
import type { TLShape, TLLineShape } from '../../../shapes'
import type { TLApp } from '../../../TLApp'
import { TLToolState } from '../../../TLToolState'
import type { TLLineTool } from '../TLLineTool'

export class PointingState<
  S extends TLShape,
  T extends S & TLLineShape,
  K extends TLEventMap,
  R extends TLApp<S, K>,
  P extends TLLineTool<T, S, K, R>
> extends TLToolState<S, K, R, P> {
  static id = 'pointing'

  onPointerMove: TLStateEvents<S, K>['onPointerMove'] = () => {
    const { currentPoint, originPoint } = this.app.inputs
    if (Vec.dist(currentPoint, originPoint) > 5 && !this.app.readOnly) {
      this.tool.transition('creating')
      this.app.setSelectedShapes(this.app.currentPage.shapes)
    }
  }
}
