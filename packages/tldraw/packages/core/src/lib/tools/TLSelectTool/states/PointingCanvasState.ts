import { Vec } from '@tldraw/vec'
import type { TLEventMap, TLEvents } from '../../../../types'
import type { TLShape } from '../../../shapes'
import type { TLApp } from '../../../TLApp'
import { TLToolState } from '../../../TLToolState'
import type { TLSelectTool } from '../TLSelectTool'

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
      this.app.setEditingShape()
      window.getSelection()?.removeAllRanges()
    }
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
    this.app.notify('canvas-dbclick', { point: this.app.inputs.originPoint })
  }
}
