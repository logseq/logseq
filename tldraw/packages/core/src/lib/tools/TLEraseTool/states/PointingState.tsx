import { Vec } from '@tldraw/vec'
import { TLApp, TLShape, TLToolState } from '~lib'
import type { TLEventMap, TLStateEvents } from '~types'
import type { TLEraseTool } from '../TLEraseTool'

export class PointingState<
  S extends TLShape,
  K extends TLEventMap,
  R extends TLApp<S, K>,
  P extends TLEraseTool<S, K, R>
> extends TLToolState<S, K, R, P> {
  static id = 'pointing'

  onEnter = () => {
    const { currentPoint } = this.app.inputs

    this.app.setErasingShapes(
      this.app.shapesInViewport.filter(shape => shape.hitTestPoint(currentPoint))
    )
  }

  onPointerMove: TLStateEvents<S, K>['onPointerDown'] = () => {
    const { currentPoint, originPoint } = this.app.inputs
    if (Vec.dist(currentPoint, originPoint) > 5) {
      this.tool.transition('erasing')

      this.app.setSelectedShapes([])
    }
  }

  onPointerUp: TLStateEvents<S, K>['onPointerUp'] = () => {
    const shapesToDelete = [...this.app.erasingShapes]
    this.app.setErasingShapes([])
    this.app.deleteShapes(shapesToDelete)
    this.tool.transition('idle')
  }
}
