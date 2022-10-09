import { Vec } from '@tldraw/vec'
import { computed, makeObservable } from 'mobx'
import { intersectLineSegmentPolyline, intersectPolygonBounds, TLBounds } from '@tldraw/intersect'
import { TLBoxShape, TLBoxShapeProps } from '../TLBoxShape'
import { PolygonUtils, BoundsUtils, PointUtils } from '../../../utils'

export interface TLPolygonShapeProps extends TLBoxShapeProps {
  sides: number
  ratio: number
  isFlippedY: boolean
}

export class TLPolygonShape<
  P extends TLPolygonShapeProps = TLPolygonShapeProps,
  M = any
> extends TLBoxShape<P, M> {
  constructor(props = {} as Partial<P>) {
    super(props)
    makeObservable(this)
  }

  static id = 'polygon'

  static defaultProps: TLPolygonShapeProps = {
    id: 'polygon',
    type: 'polygon',
    parentId: 'page',
    point: [0, 0],
    size: [100, 100],
    sides: 5,
    ratio: 1,
    isFlippedY: false,
  }

  @computed get vertices() {
    return this.getVertices()
  }

  @computed get pageVertices() {
    const {
      props: { point },
      vertices,
    } = this
    return vertices.map(vert => Vec.add(vert, point))
  }

  @computed get centroid() {
    const { vertices } = this
    return PolygonUtils.getPolygonCentroid(vertices)
  }

  @computed get rotatedVertices() {
    const {
      vertices,
      centroid,
      props: { rotation },
    } = this
    if (!rotation) return vertices
    return vertices.map(v => Vec.rotWith(v, centroid, rotation))
  }

  getRotatedBounds = (): TLBounds => {
    const {
      rotatedVertices,
      props: { point },
      offset,
    } = this
    return BoundsUtils.translateBounds(
      BoundsUtils.getBoundsFromPoints(rotatedVertices),
      Vec.add(point, offset)
    )
  }

  @computed get offset() {
    const {
      props: {
        size: [w, h],
      },
    } = this
    const center = BoundsUtils.getBoundsCenter(BoundsUtils.getBoundsFromPoints(this.vertices))
    return Vec.sub(Vec.div([w, h], 2), center)
  }

  getVertices(padding = 0): number[][] {
    const { ratio, sides, size, scale } = this.props
    const vertices =
      sides === 3
        ? PolygonUtils.getTriangleVertices(size, padding, ratio)
        : PolygonUtils.getPolygonVertices(size, sides, padding, ratio)

    // if (scale && scale[1] < 0) {
    //   return vertices.map(point => [point[0], size[1] - point[1]])
    // }

    return vertices
  }

  hitTestPoint = (point: number[]): boolean => {
    const { vertices } = this
    return PointUtils.pointInPolygon(Vec.add(point, this.props.point), vertices)
  }

  hitTestLineSegment = (A: number[], B: number[]): boolean => {
    const {
      vertices,
      props: { point },
    } = this
    return intersectLineSegmentPolyline(Vec.sub(A, point), Vec.sub(B, point), vertices).didIntersect
  }

  hitTestBounds = (bounds: TLBounds): boolean => {
    const {
      rotatedBounds,
      offset,
      rotatedVertices,
      props: { point },
    } = this
    const oBounds = BoundsUtils.translateBounds(bounds, Vec.neg(Vec.add(point, offset)))
    return (
      BoundsUtils.boundsContain(bounds, rotatedBounds) ||
      rotatedVertices.every(vert => PointUtils.pointInBounds(vert, oBounds)) ||
      intersectPolygonBounds(rotatedVertices, oBounds).length > 0
    )
  }

  validateProps = (props: Partial<P>) => {
    if (props.point) props.point = [0, 0]
    if (props.sides !== undefined && props.sides < 3) props.sides = 3
    return props
  }
}
