import { Vec } from '@tldraw/vec'
import { transaction } from 'mobx'
import { TLApp, TLSelectTool, TLShape, TLToolState } from '~lib'
import type { TLEventMap, TLEvents } from '~types'
import { uniqueId } from '~utils'

export class PointingCanvasState<
  S extends TLShape,
  K extends TLEventMap,
  R extends TLApp<S, K>,
  P extends TLSelectTool<S, K, R>
> extends TLToolState<S, K, R, P> {
  static id = 'pointingCanvas'

  onEnter = () => {
    const { shiftKey } = this.app.inputs
    if (!shiftKey) {
      this.app.setSelectedShapes([])
      this.app.setActivatedShapes([])
    }
  }

  onWheel: TLEvents<S>['wheel'] = (info, e) => {
    this.onPointerMove(info, e)
  }

  onPointerMove: TLEvents<S>['pointer'] = () => {
    const { currentPoint, originPoint } = this.app.inputs
    if (Vec.dist(currentPoint, originPoint) > 5) {
      this.tool.transition('brushing')
    }
  }

  onPointerUp: TLEvents<S>['pointer'] = () => {
    if (!this.app.inputs.shiftKey) {
      this.app.setSelectedShapes([])
    }
    this.tool.transition('idle')
  }

  onPinchStart: TLEvents<S>['pinch'] = (info, event) => {
    this.tool.transition('pinching', { info, event })
  }

  onDoubleClick: TLEvents<S>['pointer'] = () => {
    transaction(() => {
      const Shape = this.app.SmartShape
      if (Shape) {
        const shape = new Shape({
          id: uniqueId(),
          type: Shape.id,
          parentId: this.app.currentPage.id,
          point: [...this.app.inputs.originPoint],
        })
        shape.setDraft(true)
        this.app.setActivatedShapes([shape.id])
        this.app.currentPage.addShapes(shape)
      }
    })
  }
}
