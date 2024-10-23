import { computed, makeObservable } from 'mobx'
import { Vec } from '@tldraw/vec'
import {
  intersectBoundsLineSegment,
  intersectLineSegmentPolyline,
  intersectPolylineBounds,
  TLBounds,
} from '@tldraw/intersect'
import { TLShapeProps, TLResizeInfo, TLShape } from '../TLShape'
import type { TLHandle } from '../../../types'
import { PolygonUtils, BoundsUtils, PointUtils } from '../../../utils'

export interface TLPolylineShapeProps extends TLShapeProps {
  handles: Record<string, TLHandle>
}

export class TLPolylineShape<
  P extends TLPolylineShapeProps = TLPolylineShapeProps,
  M = any
> extends TLShape<P, M> {
  constructor(props = {} as Partial<P>) {
    super(props)
    makeObservable(this)
  }

  static id = 'polyline'

  static defaultProps: TLPolylineShapeProps = {
    id: 'polyline',
    type: 'polyline',
    parentId: 'page',
    point: [0, 0],
    handles: {},
  }

  @computed get points() {
    return Object.values(this.props.handles).map(h => h.point)
  }

  @computed get centroid() {
    const { points } = this
    return PolygonUtils.getPolygonCentroid(points)
  }

  @computed get rotatedPoints() {
    const {
      centroid,
      props: { handles, rotation },
    } = this
    if (!rotation) return this.points
    return Object.values(handles).map(h => Vec.rotWith(h.point, centroid, rotation))
  }

  getBounds = (): TLBounds => {
    const {
      points,
      props: { point },
    } = this
    return BoundsUtils.translateBounds(BoundsUtils.getBoundsFromPoints(points), point)
  }

  getRotatedBounds = (): TLBounds => {
    const {
      rotatedPoints,
      props: { point },
    } = this
    return BoundsUtils.translateBounds(BoundsUtils.getBoundsFromPoints(rotatedPoints), point)
  }

  private normalizedHandles: number[][] = []

  onResizeStart = () => {
    const {
      props: { handles },
      bounds,
    } = this
    this.scale = [...(this.props.scale ?? [1, 1])]
    const size = [bounds.width, bounds.height]
    this.normalizedHandles = Object.values(handles).map(h => Vec.divV(h.point, size))
    return this
  }

  onResize = (initialProps: any, info: TLResizeInfo) => {
    const {
      bounds,
      scale: [scaleX, scaleY],
    } = info
    const {
      props: { handles },
      normalizedHandles,
    } = this
    const size = [bounds.width, bounds.height]
    const nextScale = [...this.scale]
    if (scaleX < 0) nextScale[0] *= -1
    if (scaleY < 0) nextScale[1] *= -1
    return this.update({
      point: [bounds.minX, bounds.minY],
      handles: Object.values(handles).map((handle, i) => ({
        ...handle,
        point: Vec.mulV(normalizedHandles[i], size),
      })),
      scale: nextScale,
    })
  }

  hitTestPoint = (point: number[]): boolean => {
    const { points } = this
    return PointUtils.pointNearToPolyline(Vec.sub(point, this.props.point), points)
  }

  hitTestLineSegment = (A: number[], B: number[]): boolean => {
    const {
      bounds,
      points,
      props: { point },
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
      points,
      props: { point },
    } = this
    const oBounds = BoundsUtils.translateBounds(bounds, Vec.neg(point))
    return (
      BoundsUtils.boundsContain(bounds, rotatedBounds) ||
      points.every(vert => PointUtils.pointInBounds(vert, oBounds)) ||
      (BoundsUtils.boundsCollide(bounds, rotatedBounds) &&
        intersectPolylineBounds(points, oBounds).length > 0)
    )
  }

  validateProps = (props: Partial<P>) => {
    if (props.point) props.point = [0, 0]
    if (props.handles !== undefined && Object.values(props.handles).length < 1)
      props.handles = TLPolylineShape.defaultProps['handles']
    return props
  }
}
