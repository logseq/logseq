import { computed, makeObservable } from 'mobx'
import { TLShape, TLResizeInfo, TLShapeProps } from '../TLShape'
import { Vec } from '@tldraw/vec'
import {
  intersectBoundsLineSegment,
  intersectLineSegmentPolyline,
  intersectPolylineBounds,
  TLBounds,
} from '@tldraw/intersect'
import { BoundsUtils, PointUtils } from '../../../utils'

export interface TLDrawShapeProps extends TLShapeProps {
  points: number[][]
  isComplete: boolean
}

export class TLDrawShape<P extends TLDrawShapeProps = any, M = any> extends TLShape<P, M> {
  constructor(props = {} as Partial<P>) {
    super(props)
    makeObservable(this)
  }

  static id = 'draw'

  static defaultProps: TLDrawShapeProps = {
    id: 'draw',
    type: 'draw',
    parentId: 'page',
    point: [0, 0],
    points: [],
    isComplete: false,
  }

  /** The shape's bounds in "shape space". */
  @computed get pointBounds(): TLBounds {
    const {
      props: { points },
    } = this
    return BoundsUtils.getBoundsFromPoints(points)
  }

  /** The shape's bounds in "page space". */
  getBounds = (): TLBounds => {
    const {
      pointBounds,
      props: { point },
    } = this
    return BoundsUtils.translateBounds(pointBounds, point)
  }

  /** The shape's rotated points in "shape space". */
  @computed get rotatedPoints(): number[][] {
    const {
      props: { point, points, rotation },
      center,
    } = this
    if (!rotation) return points
    const relativeCenter = Vec.sub(center, point)
    return points.map(point => Vec.rotWith(point, relativeCenter, rotation))
  }

  /** The shape's rotated bounds in "page space". */
  getRotatedBounds = (): TLBounds => {
    const {
      props: { rotation, point },
      bounds,
      rotatedPoints,
    } = this
    if (!rotation) return bounds
    return BoundsUtils.translateBounds(BoundsUtils.getBoundsFromPoints(rotatedPoints), point)
  }

  /**
   * A snapshot of the shape's points normalized against its bounds. For performance and memory
   * reasons, this property must be set manually with `setNormalizedPoints`.
   */
  normalizedPoints: number[][] = []
  isResizeFlippedX = false
  isResizeFlippedY = false

  /** Prepare the shape for a resize session. */
  onResizeStart = () => {
    const {
      bounds,
      props: { points },
    } = this
    this.scale = [...(this.props.scale ?? [1, 1])]
    const size = [bounds.width, bounds.height]
    this.normalizedPoints = points.map(point => Vec.divV(point, size))
    return this
  }

  /**
   * Resize the shape to fit a new bounding box.
   *
   * @param bounds
   * @param info
   */
  onResize = (initialProps: any, info: TLResizeInfo) => {
    const {
      bounds,
      scale: [scaleX, scaleY],
    } = info
    const size = [bounds.width, bounds.height]
    const nextScale = [...this.scale]
    if (scaleX < 0) nextScale[0] *= -1
    if (scaleY < 0) nextScale[1] *= -1
    return this.update(
      scaleX || scaleY
        ? {
            point: [bounds.minX, bounds.minY],
            points: this.normalizedPoints.map(point => Vec.mulV(point, size).concat(point[2])),
            scale: nextScale,
          }
        : {
            point: [bounds.minX, bounds.minY],
            points: this.normalizedPoints.map(point => Vec.mulV(point, size).concat(point[2])),
          }
    )
  }

  hitTestPoint = (point: number[]): boolean => {
    const {
      props: { points, point: ownPoint },
    } = this
    return PointUtils.pointNearToPolyline(Vec.sub(point, ownPoint), points)
  }

  hitTestLineSegment = (A: number[], B: number[]): boolean => {
    const {
      bounds,
      props: { points, point },
    } = this
    if (
      PointUtils.pointInBounds(A, bounds) ||
      PointUtils.pointInBounds(B, bounds) ||
      intersectBoundsLineSegment(bounds, A, B).length > 0
    ) {
      const rA = Vec.sub(A, point)
      const rB = Vec.sub(B, point)
      return (
        intersectLineSegmentPolyline(rA, rB, points).didIntersect ||
        !!points.find(point => Vec.dist(rA, point) < 5 || Vec.dist(rB, point) < 5)
      )
    }
    return false
  }

  hitTestBounds = (bounds: TLBounds): boolean => {
    const {
      rotatedBounds,
      props: { points, point },
    } = this
    const oBounds = BoundsUtils.translateBounds(bounds, Vec.neg(point))
    return (
      BoundsUtils.boundsContain(bounds, rotatedBounds) ||
      points.every(vert => PointUtils.pointInBounds(vert, oBounds)) ||
      (BoundsUtils.boundsCollide(bounds, rotatedBounds) &&
        intersectPolylineBounds(points, oBounds).length > 0)
    )
  }
}
