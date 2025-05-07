import Vec from '@tldraw/vec'
import { makeObservable } from 'mobx'
import type { TLHandle, Decoration } from '../../../types'
import { deepMerge, deepCopy, BoundsUtils } from '../../../utils'
import { TLPolylineShape, TLPolylineShapeProps } from '../TLPolylineShape'

export interface TLLineShapeProps extends TLPolylineShapeProps {
  handles: Record<'start' | 'end' | string, TLHandle>
  decorations?: {
    start?: Decoration
    end?: Decoration
  }
}

export class TLLineShape<
  P extends TLLineShapeProps = TLLineShapeProps,
  M = any
> extends TLPolylineShape<P, M> {
  constructor(props = {} as Partial<P>) {
    super(props)
    makeObservable(this)
  }

  hideResizeHandles = true
  hideRotateHandle = true

  static id = 'line'

  static defaultProps: TLLineShapeProps = {
    id: 'line',
    type: 'line',
    parentId: 'page',
    point: [0, 0],
    handles: {
      start: { id: 'start', canBind: true, point: [0, 0] },
      end: { id: 'end', canBind: true, point: [1, 1] },
    },
  }

  validateProps = (props: Partial<P>) => {
    if (props.point) props.point = [0, 0]
    if (props.handles !== undefined && Object.values(props.handles).length < 1)
      props.handles = TLLineShape.defaultProps['handles']
    return props
  }

  getHandlesChange = (shape: P, handles: Partial<P['handles']>): Partial<P> | undefined => {
    let nextHandles = deepMerge(shape.handles, handles)

    nextHandles = deepMerge(nextHandles, {
      start: {
        point: Vec.toFixed(nextHandles.start.point),
      },
      end: {
        point: Vec.toFixed(nextHandles.end.point),
      },
    })

    // This will produce NaN values
    if (Vec.isEqual(nextHandles.start.point, nextHandles.end.point)) return

    const nextShape = {
      point: shape.point,
      handles: deepCopy(nextHandles),
    }

    // Zero out the handles to prevent handles with negative points. If a handle's x or y
    // is below zero, we need to move the shape left or up to make it zero.
    const topLeft = shape.point

    const nextBounds = BoundsUtils.translateBounds(
      BoundsUtils.getBoundsFromPoints(Object.values(nextHandles).map(h => h.point)),
      nextShape.point
    )

    const offset = Vec.sub([nextBounds.minX, nextBounds.minY], topLeft)

    if (!Vec.isEqual(offset, [0, 0])) {
      Object.values(nextShape.handles).forEach(handle => {
        handle.point = Vec.toFixed(Vec.sub(handle.point, offset))
      })
      nextShape.point = Vec.toFixed(Vec.add(nextShape.point, offset))
    }

    // @ts-expect-error ???
    return nextShape
  }
}
