import { makeObservable } from 'mobx'
import { Vec } from '@tldraw/vec'
import { TLPolygonShape, TLPolygonShapeProps } from '../TLPolygonShape'
import { PolygonUtils } from '../../../utils'

export interface TLStarShapeProps extends TLPolygonShapeProps {
  sides: number
  ratio: number
  isFlippedY: boolean
}

/**
 * A star shape works just like a polygon shape, except it uses a different algorithm to find the
 * location of its vertices.
 */
export class TLStarShape<
  P extends TLStarShapeProps = TLStarShapeProps,
  M = any
> extends TLPolygonShape<P, M> {
  constructor(props = {} as Partial<P>) {
    super(props)
    makeObservable(this)
  }

  static id = 'star'

  static defaultProps: TLStarShapeProps = {
    id: 'star',
    parentId: 'page',
    type: 'star',
    point: [0, 0],
    size: [100, 100],
    sides: 3,
    ratio: 1,
    isFlippedY: false,
  }

  getVertices(padding = 0): number[][] {
    const { ratio, sides, size, isFlippedY } = this.props
    const [w, h] = size
    const vertices = PolygonUtils.getStarVertices(
      Vec.div([w, h], 2),
      [Math.max(1, w - padding), Math.max(1, h - padding)],
      Math.round(sides),
      ratio
    )
    if (isFlippedY) {
      return vertices.map(point => [point[0], h - point[1]])
    }
    return vertices
  }
}
