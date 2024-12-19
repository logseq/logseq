import { makeObservable } from 'mobx'
import { intersectLineSegmentEllipse, intersectEllipseBounds, TLBounds } from '@tldraw/intersect'
import { TLBoxShape, TLBoxShapeProps } from '../TLBoxShape'
import { BoundsUtils, PointUtils } from '../../../utils'

export interface TLEllipseShapeProps extends TLBoxShapeProps {
  point: number[]
}

export class TLEllipseShape<
  P extends TLEllipseShapeProps = TLEllipseShapeProps,
  M = any
> extends TLBoxShape<P, M> {
  constructor(props = {} as Partial<P>) {
    super(props)
    makeObservable(this)
  }

  static id = 'ellipse'

  static defaultProps: TLEllipseShapeProps = {
    id: 'ellipse',
    type: 'ellipse',
    parentId: 'page',
    point: [0, 0],
    size: [100, 100],
  }

  getBounds = (): TLBounds => {
    const {
      props: {
        point: [x, y],
        size: [w, h],
      },
    } = this
    return BoundsUtils.getRotatedEllipseBounds(x, y, w / 2, h / 2, 0)
  }

  getRotatedBounds = (): TLBounds => {
    const {
      props: {
        point: [x, y],
        size: [w, h],
        rotation,
      },
    } = this
    return BoundsUtils.getRotatedEllipseBounds(x, y, w / 2, h / 2, rotation)
  }

  hitTestPoint = (point: number[]) => {
    const {
      props: { size, rotation },
      center,
    } = this
    return PointUtils.pointInEllipse(point, center, size[0], size[1], rotation || 0)
  }

  hitTestLineSegment = (A: number[], B: number[]): boolean => {
    const {
      props: {
        size: [w, h],
        rotation = 0,
      },
      center,
    } = this
    return intersectLineSegmentEllipse(A, B, center, w, h, rotation).didIntersect
  }

  hitTestBounds = (bounds: TLBounds): boolean => {
    const {
      props: {
        size: [w, h],
        rotation = 0,
      },
      rotatedBounds,
    } = this
    return (
      BoundsUtils.boundsContain(bounds, rotatedBounds) ||
      intersectEllipseBounds(this.center, w / 2, h / 2, rotation, bounds).length > 0
    )
  }
}
