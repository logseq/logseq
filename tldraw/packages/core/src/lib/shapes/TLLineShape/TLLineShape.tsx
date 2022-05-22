import Vec from '@tldraw/vec'
import { makeObservable } from 'mobx'
import type { TLHandle } from '~types'
import { BoundsUtils, deepMerge } from '~utils'
import { TLPolylineShape, TLPolylineShapeProps } from '../TLPolylineShape'

interface TLLineHandle extends TLHandle {
  id: 'start' | 'end'
}

export interface TLLineShapeProps extends TLPolylineShapeProps {
  handles: TLLineHandle[]
}

export class TLLineShape<
  P extends TLLineShapeProps = TLLineShapeProps,
  M = any
> extends TLPolylineShape<P, M> {
  constructor(props = {} as Partial<P>) {
    super(props)
    makeObservable(this)
  }

  static id = 'line'

  static defaultProps: TLLineShapeProps = {
    id: 'line',
    type: 'line',
    parentId: 'page',
    point: [0, 0],
    handles: [
      { id: 'start', canBind: true, point: [0, 0] },
      { id: 'end', canBind: true, point: [1, 1] },
    ],
  }

  validateProps = (props: Partial<P>) => {
    if (props.point) props.point = [0, 0]
    if (props.handles !== undefined && props.handles.length < 1)
      props.handles = [{ point: [0, 0], id: 'start' }]
    return props
  }

  getHandlesChange = (initialShape: P, handles: Partial<TLLineHandle>[]): P | void => {
    let nextHandles = handles.map((h, i) => deepMerge(initialShape.handles[i] ?? {}, h))
    nextHandles = nextHandles.map(h => ({ ...h, point: Vec.toFixed(h.point) }))

    if (nextHandles.length !== 2 || Vec.isEqual(nextHandles[0].point, nextHandles[1].point)) {
      return
    }

    const nextShape = {
      ...initialShape,
      handles: nextHandles,
    }

    // Zero out the handles to prevent handles with negative points. If a handle's x or y
    // is below zero, we need to move the shape left or up to make it zero.
    const topLeft = initialShape.point

    const nextBounds = BoundsUtils.translateBounds(
      BoundsUtils.getBoundsFromPoints(nextHandles.map(h => h.point)),
      nextShape.point
    )

    const offset = Vec.sub([nextBounds.minX, nextBounds.minY], topLeft)

    if (!Vec.isEqual(offset, [0, 0])) {
      Object.values(nextShape.handles).forEach(handle => {
        handle.point = Vec.toFixed(Vec.sub(handle.point, offset))
      })
      nextShape.point = Vec.toFixed(Vec.add(nextShape.point, offset))
    }
    return nextShape
  }
}
