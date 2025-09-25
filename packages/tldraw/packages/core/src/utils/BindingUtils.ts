import Vec from '@tldraw/vec'
import { uniqueId } from '.'
import { TLLineShape, TLLineShapeProps, TLShape } from '../lib'
import type { TLBinding } from '../types'

export function findBindingPoint(
  shape: TLLineShapeProps,
  target: TLShape,
  handleId: 'start' | 'end',
  bindingId: string,
  point: number[],
  origin: number[],
  direction: number[],
  bindAnywhere: boolean
) {
  const bindingPoint = target.getBindingPoint(
    point, // fix dead center bug
    origin,
    direction,
    bindAnywhere
  )

  // Not all shapes will produce a binding point
  if (!bindingPoint) return

  return {
    id: bindingId,
    type: 'line',
    fromId: shape.id,
    toId: target.id,
    handleId: handleId,
    point: Vec.toFixed(bindingPoint.point),
    distance: bindingPoint.distance,
  }
}

/** Given source & target, calculate a new Line shape from the center of source and to the center of target */
export function createNewLineBinding(
  source: TLShape,
  target: TLShape
): [TLLineShapeProps, TLBinding[]] | null {
  // cs -> center of source, etc
  const cs = source.getCenter()
  const ct = target.getCenter()
  const lineId = uniqueId()
  const lineShape = {
    ...TLLineShape.defaultProps,
    id: lineId,
    type: TLLineShape.id,
    parentId: source.props.parentId,
    point: cs,
  }

  const startBinding = findBindingPoint(
    lineShape,
    source,
    'start',
    uniqueId(),
    cs,
    cs,
    Vec.uni(Vec.sub(ct, cs)),
    false
  )

  const endBinding = findBindingPoint(
    lineShape,
    target,
    'end',
    uniqueId(),
    ct,
    ct,
    Vec.uni(Vec.sub(cs, ct)),
    false
  )

  if (startBinding && endBinding) {
    lineShape.handles.start.point = [0, 0]
    lineShape.handles.end.point = Vec.sub(ct, cs)
    lineShape.handles.start.bindingId = startBinding.id
    lineShape.handles.end.bindingId = endBinding.id

    return [lineShape, [startBinding, endBinding]]
  }
  return null
}
