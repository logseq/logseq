import { Vec } from '@tldraw/vec'
import type { TLEventMap, TLEvents, TLStateEvents } from '../../../../types'
import { lerp, uniqueId, PointUtils } from '../../../../utils'
import type { TLShape, TLDrawShape } from '../../../shapes'
import type { TLApp } from '../../../TLApp'
import { TLToolState } from '../../../TLToolState'
import type { TLDrawTool } from '../TLDrawTool'
import { debounce } from '../../../../utils'

export class CreatingState<
  S extends TLShape,
  T extends S & TLDrawShape,
  K extends TLEventMap,
  R extends TLApp<S, K>,
  P extends TLDrawTool<T, S, K, R>
> extends TLToolState<S, K, R, P> {
  static id = 'creating'

  private shape = {} as T
  private points: number[][] = [[0, 0, 0.5]]

  private persistDebounced = debounce(this.app.persist, 200)

  // Add a new point and offset the shape, if necessary
  private addNextPoint(point: number[]) {
    const { shape } = this
    const offset = Vec.min(point, [0, 0])
    this.points.push(point)
    if (offset[0] < 0 || offset[1] < 0) {
      this.points = this.points.map(pt => Vec.sub(pt, offset).concat(pt[2]))
      shape.update({
        point: Vec.add(shape.props.point, offset),
        points: this.points,
      })
    } else {
      shape.update({
        points: this.points,
      })
    }
  }

  onPinchStart: TLEvents<S>['pinch'] = (info, event) => {
    this.tool.transition('pinching', { info, event })
  }

  onEnter = () => {
    const { Shape, previousShape } = this.tool
    const { originPoint } = this.app.inputs
    this.app.history.pause()
    if (this.app.inputs.shiftKey && previousShape) {
      // Continue the previous shape. Create points between the shape's
      // last point and the new point, then add the new point to the shape
      // and offset the existing points, if necessary.
      this.shape = previousShape
      const { shape } = this
      const prevPoint = shape.props.points[shape.props.points.length - 1]
      const nextPoint = Vec.sub(originPoint, shape.props.point).concat(originPoint[2] ?? 0.5)
      this.points = [...shape.props.points, prevPoint, prevPoint]
      const len = Math.ceil(Vec.dist(prevPoint, originPoint) / 16)
      for (let i = 0, t = i / (len - 1); i < len; i++) {
        this.points.push(
          Vec.lrp(prevPoint, nextPoint, t).concat(lerp(prevPoint[2], nextPoint[2], t))
        )
      }
      this.addNextPoint(nextPoint)
    } else {
      // Create a new shape and add the first point.
      this.tool.previousShape = undefined
      this.points = [[0, 0, originPoint[2] ?? 0.5]]
      this.shape = new Shape({
        id: uniqueId(),
        type: Shape.id,
        parentId: this.app.currentPage.id,
        point: originPoint.slice(0, 2),
        points: this.points,
        isComplete: false,
        fill: this.app.settings.color,
        stroke: this.app.settings.color,
      })
      this.shape.setScaleLevel(this.app.settings.scaleLevel)
      this.app.currentPage.addShapes(this.shape)
    }
  }

  onPointerMove: TLStateEvents<S, K>['onPointerMove'] = () => {
    const { shape } = this
    const { currentPoint, previousPoint } = this.app.inputs
    if (Vec.isEqual(previousPoint, currentPoint)) return
    this.addNextPoint(Vec.sub(currentPoint, shape.props.point).concat(currentPoint[2]))
  }

  onPointerUp: TLStateEvents<S, K>['onPointerUp'] = () => {
    if (!this.shape) throw Error('Expected a creating shape.')
    this.app.history.resume()
    this.shape.update({
      isComplete: true,
      points: this.tool.simplify
        ? PointUtils.simplify2(this.points, this.tool.simplifyTolerance)
        : this.shape.props.points,
    })
    this.tool.previousShape = this.shape
    this.tool.transition('idle')
    let tool = this.app.selectedTool.id
    if (tool === 'pencil' || tool === 'highlighter') {
      this.persistDebounced()
    } else {
      this.app.persist()
    }
  }

  onKeyDown: TLStateEvents<S>['onKeyDown'] = (info, e) => {
    switch (e.key) {
      case 'Escape': {
        if (!this.shape) throw Error('Expected a creating shape.')
        this.app.deleteShapes([this.shape])
        this.tool.transition('idle')
        break
      }
    }
  }
}
