import { Vec } from '@tldraw/vec'
import type { TLEventMap, TLStateEvents } from '../../../../types'
import type { TLShape } from '../../../shapes'
import type { TLApp } from '../../../TLApp'
import { TLToolState } from '../../../TLToolState'
import type { TLEraseTool } from '../TLEraseTool'

export class ErasingState<
  S extends TLShape,
  K extends TLEventMap,
  R extends TLApp<S, K>,
  P extends TLEraseTool<S, K, R>
> extends TLToolState<S, K, R, P> {
  static id = 'erasing'

  private points: number[][] = [[0, 0, 0.5]]
  private hitShapes: Set<S> = new Set()

  onEnter: TLStateEvents<S, K>['onEnter'] = () => {
    const { originPoint } = this.app.inputs
    this.points = [originPoint]
    this.hitShapes.clear()
  }

  onPointerMove: TLStateEvents<S, K>['onPointerMove'] = () => {
    const { currentPoint, previousPoint } = this.app.inputs
    if (Vec.isEqual(previousPoint, currentPoint)) return
    this.points.push(currentPoint)

    this.app.shapesInViewport
      .filter(shape => shape.hitTestLineSegment(previousPoint, currentPoint))
      .forEach(shape => this.hitShapes.add(shape))

    this.app.setErasingShapes(Array.from(this.hitShapes.values()))
  }

  onPointerUp: TLStateEvents<S, K>['onPointerUp'] = () => {
    this.app.deleteShapes(Array.from(this.hitShapes.values()))
    this.tool.transition('idle')
  }

  onKeyDown: TLStateEvents<S>['onKeyDown'] = (info, e) => {
    switch (e.key) {
      case 'Escape': {
        this.app.setErasingShapes([])
        this.tool.transition('idle')
        break
      }
    }
  }
}
