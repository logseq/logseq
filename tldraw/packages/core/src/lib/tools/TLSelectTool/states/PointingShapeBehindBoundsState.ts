import { Vec } from '@tldraw/vec'
import type { TLEventMap, TLEventShapeInfo, TLEvents } from '../../../../types'
import type { TLShape } from '../../../shapes'
import type { TLApp } from '../../../TLApp'
import { TLToolState } from '../../../TLToolState'
import type { TLSelectTool } from '../TLSelectTool'

export class PointingShapeBehindBoundsState<
  S extends TLShape,
  K extends TLEventMap,
  R extends TLApp<S, K>,
  P extends TLSelectTool<S, K, R>
> extends TLToolState<S, K, R, P> {
  static id = 'pointingShapeBehindBounds'

  private info = {} as TLEventShapeInfo<S>

  onEnter = (info: TLEventShapeInfo<S>) => {
    this.info = info
  }

  onPointerMove: TLEvents<S>['pointer'] = () => {
    const { currentPoint, originPoint } = this.app.inputs
    if (Vec.dist(currentPoint, originPoint) > 5 && !this.app.readOnly) {
      this.tool.transition('translating')
    }
  }

  onPointerUp: TLEvents<S>['pointer'] = () => {
    const {
      selectedIds,
      inputs: { shiftKey },
    } = this.app
    // unlike PointingShapeState, always select the shape behind the group
    if (shiftKey) {
      this.app.setSelectedShapes([...Array.from(selectedIds.values()), this.info.shape.id])
    } else {
      this.app.setSelectedShapes([this.info.shape.id])
    }
    this.tool.transition('idle')
  }

  onPinchStart: TLEvents<S>['pinch'] = (info, event) => {
    this.tool.transition('pinching', { info, event })
  }
}
