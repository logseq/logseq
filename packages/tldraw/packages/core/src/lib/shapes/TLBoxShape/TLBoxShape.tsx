import type { TLBounds } from '@tldraw/intersect'
import { makeObservable } from 'mobx'
import { BoundsUtils } from '../../../utils'
import { TLResizeInfo, TLShape, TLShapeProps } from '../TLShape'

export interface TLBoxShapeProps extends TLShapeProps {
  size: number[]
}

export class TLBoxShape<P extends TLBoxShapeProps = TLBoxShapeProps, M = any> extends TLShape<
  P,
  M
> {
  constructor(props = {} as Partial<P>) {
    super(props)
    makeObservable(this)
  }

  static id = 'box'

  canBind = true

  static defaultProps: TLBoxShapeProps = {
    id: 'box',
    type: 'box',
    parentId: 'page',
    point: [0, 0],
    size: [100, 100],
  }

  getBounds = (): TLBounds => {
    const [x, y] = this.props.point
    const [width, height] = this.props.size
    return {
      minX: x,
      minY: y,
      maxX: x + width,
      maxY: y + height,
      width,
      height,
    }
  }

  getRotatedBounds = (): TLBounds => {
    return BoundsUtils.getBoundsFromPoints(
      BoundsUtils.getRotatedCorners(this.bounds, this.props.rotation)
    )
  }

  onResize = (initialProps: any, info: TLResizeInfo): this => {
    const {
      bounds,
      rotation,
      scale: [scaleX, scaleY],
    } = info
    const nextScale = [...this.scale]
    if (scaleX < 0) nextScale[0] *= -1
    if (scaleY < 0) nextScale[1] *= -1
    this.update({ point: [bounds.minX, bounds.minY], scale: nextScale, rotation })
    return this.update({
      rotation,
      point: [bounds.minX, bounds.minY],
      size: [Math.max(1, bounds.width), Math.max(1, bounds.height)],
      scale: nextScale,
    })
  }

  validateProps = (props: Partial<P>) => {
    if (props.size !== undefined) {
      props.size[0] = Math.max(props.size[0], 1)
      props.size[1] = Math.max(props.size[1], 1)
    }
    return props
  }
}
