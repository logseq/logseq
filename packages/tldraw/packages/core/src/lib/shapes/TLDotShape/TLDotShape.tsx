import type { TLBounds } from '@tldraw/intersect'
import { makeObservable } from 'mobx'
import { BoundsUtils } from '../../../utils'
import { TLShape, TLResizeInfo, TLShapeProps } from '../TLShape'

export interface TLDotShapeProps extends TLShapeProps {
  radius?: number
}

export class TLDotShape<P extends TLDotShapeProps = TLDotShapeProps, M = any> extends TLShape<
  P,
  M
> {
  constructor(props = {} as Partial<P>) {
    super(props)
    makeObservable(this)
  }

  static id = 'dot'

  static defaultProps: TLDotShapeProps = {
    id: 'dot',
    type: 'dot',
    parentId: 'page',
    point: [0, 0],
    radius: 6,
  }

  hideSelection = true
  hideResizeHandles = true
  hideRotateHandle = true
  hideSelectionDetail = true

  getBounds = (): TLBounds => {
    const {
      props: {
        point: [x, y],
        radius = 0,
      },
    } = this
    return {
      minX: x,
      minY: y,
      maxX: x + radius * 2,
      maxY: y + radius * 2,
      width: radius * 2,
      height: radius * 2,
    }
  }

  getRotatedBounds = (): TLBounds => {
    return BoundsUtils.getBoundsFromPoints(
      BoundsUtils.getRotatedCorners(this.bounds, this.props.rotation)
    )
  }

  onResize = (initialProps: any, info: TLResizeInfo): this => {
    const {
      props: { radius = 0 },
    } = this
    return this.update({
      point: [
        info.bounds.minX + info.bounds.width / 2 - radius,
        info.bounds.minY + info.bounds.height / 2 - radius,
      ],
    })
  }
}
