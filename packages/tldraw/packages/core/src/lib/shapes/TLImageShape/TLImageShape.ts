import { makeObservable } from 'mobx'
import type { TLAsset } from '../../../types'
import { TLBoxShape, TLBoxShapeProps } from '../TLBoxShape'
import type { TLResetBoundsInfo, TLResizeInfo } from '../TLShape'

export interface TLImageAsset extends TLAsset {
  type: 'image'
  size: number[]
  src: string
}

export interface TLImageShapeProps extends TLBoxShapeProps {
  clipping: number | number[]
  objectFit: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down'
  assetId: string
}

export class TLImageShape<
  P extends TLImageShapeProps = TLImageShapeProps,
  M = any
> extends TLBoxShape<P, M> {
  constructor(props = {} as Partial<P>) {
    super(props)
    makeObservable(this)
  }

  static id = 'ellipse'

  static defaultProps: TLImageShapeProps = {
    id: 'ellipse',
    type: 'ellipse',
    parentId: 'page',
    point: [0, 0],
    size: [100, 100],
    clipping: 0,
    objectFit: 'none',
    assetId: '',
  }

  onResetBounds: (info?: TLResetBoundsInfo | undefined) => this = (info: any) => {
    const { clipping, size, point } = this.props
    if (clipping) {
      const [t, r, b, l] = Array.isArray(clipping)
        ? clipping
        : [clipping, clipping, clipping, clipping]

      return this.update({
        clipping: 0,
        point: [point[0] - l, point[1] - t],
        size: [size[0] + (l - r), size[1] + (t - b)],
      })
    } else if (info.asset) {
      const {
        size: [w, h],
      } = info.asset
      this.update({
        clipping: 0,
        point: [point[0] + size[0] / 2 - w / 2, point[1] + size[1] / 2 - h / 2],
        size: [w, h],
      })
    }

    return this
  }

  onResize = (initialProps: any, info: TLResizeInfo) => {
    const { bounds, clip, scale } = info
    let { clipping } = this.props
    const { clipping: iClipping } = initialProps

    if (clip) {
      const {
        point: [x, y],
        size: [w, h],
      } = initialProps

      const [t, r, b, l] = iClipping
        ? Array.isArray(iClipping)
          ? iClipping
          : [iClipping, iClipping, iClipping, iClipping]
        : [0, 0, 0, 0]

      clipping = [
        t + (bounds.minY - y),
        r + (bounds.maxX - (x + w)),
        b + (bounds.maxY - (y + h)),
        l + (bounds.minX - x),
      ]
    } else {
      if (iClipping !== undefined) {
        clipping = Array.isArray(iClipping)
          ? iClipping
          : [iClipping, iClipping, iClipping, iClipping]
        clipping = [
          clipping[0] * scale[1],
          clipping[1] * scale[0],
          clipping[2] * scale[1],
          clipping[3] * scale[0],
        ]
      }
    }

    if (clipping && Array.isArray(clipping)) {
      const c = clipping
      if (c.every((v, i) => i === 0 || v === c[i - 1])) {
        clipping = c[0]
      }
    }

    return this.update({
      point: [bounds.minX, bounds.minY],
      size: [Math.max(1, bounds.width), Math.max(1, bounds.height)],
      clipping,
    })
  }
}
