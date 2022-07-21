/* eslint-disable @typescript-eslint/no-explicit-any */
import { intersectRayBounds } from '@tldraw/intersect'
import Vec from '@tldraw/vec'
import { action, computed, makeObservable, observable, reaction, toJS } from 'mobx'
import { BINDING_DISTANCE } from '~constants'
import type { TLApp, TLShape, TLShapeModel } from '~lib'
import type { TLLineShape } from '~lib/shapes'
import { TLBinding, TLBounds, TLEventMap, TLHandle, TLResizeCorner } from '~types'
import { BoundsUtils, deepCopy, deepEqual, PointUtils } from '~utils'

export interface TLPageModel<S extends TLShape = TLShape> {
  id: string
  name: string
  shapes: TLShapeModel<S['props']>[]
  bindings: Record<string, TLBinding>
  nonce?: number
}

export interface TLPageProps<S> {
  id: string
  name: string
  shapes: S[]
  bindings: Record<string, TLBinding>
}

export class TLPage<S extends TLShape = TLShape, E extends TLEventMap = TLEventMap> {
  constructor(app: TLApp<S, E>, props = {} as TLPageProps<S>) {
    const { id, name, shapes = [], bindings = {} } = props
    this.id = id
    this.name = name
    this.bindings = Object.assign({}, bindings) // make sure it is type of object
    this.app = app
    this.addShapes(...shapes)
    makeObservable(this)

    reaction(
      () => ({
        id: this.id,
        name: this.name,
        shapes: toJS(this.shapes.map(shape => toJS(shape.props))),
        bindings: toJS(this.bindings),
        nonce: this.nonce,
        editingShape: toJS(this.app.editingShape),
      }),
      (curr, prev) => {
        if (this.app.isInAny('creating')) return
        this.cleanup(curr, prev)
      }
    )
  }

  app: TLApp<S, E>

  @observable id: string

  @observable name: string

  @observable shapes: S[] = []

  @observable bindings: Record<string, TLBinding> = {}

  @computed get serialized(): TLPageModel<S> {
    return {
      id: this.id,
      name: this.name,
      // @ts-expect-error maybe later
      shapes: this.shapes
        .map(shape => shape.serialized)
        .filter(s => !!s)
        .map(s => toJS(s)),
      bindings: deepCopy(this.bindings),
      nonce: this.nonce,
    }
  }

  nonce = 0

  private bump = () => {
    this.nonce++
  }

  @action update(props: Partial<TLPageProps<S>>) {
    Object.assign(this, props)
    return this
  }

  @action updateBindings(bindings: Record<string, TLBinding>) {
    Object.assign(this.bindings, bindings)
    return this
  }

  @action addShapes(...shapes: S[] | TLShapeModel[]) {
    if (shapes.length === 0) return
    const shapeInstances =
      'getBounds' in shapes[0]
        ? (shapes as S[])
        : (shapes as TLShapeModel[]).map(shape => {
            const ShapeClass = this.app.getShapeClass(shape.type)
            return new ShapeClass(shape)
          })
    this.shapes.push(...shapeInstances)
    this.bump()
    return shapeInstances
  }

  private parseShapesArg<S>(shapes: S[] | string[]) {
    if (typeof shapes[0] === 'string') {
      return this.shapes.filter(shape => (shapes as string[]).includes(shape.id))
    } else {
      return shapes as S[]
    }
  }

  @action removeShapes(...shapes: S[] | string[]) {
    const shapeInstances = this.parseShapesArg(shapes)
    this.shapes = this.shapes.filter(shape => !shapeInstances.includes(shape))
    return shapeInstances
  }

  @action bringForward = (shapes: S[] | string[]): this => {
    const shapesToMove = this.parseShapesArg(shapes)
    shapesToMove
      .sort((a, b) => this.shapes.indexOf(b) - this.shapes.indexOf(a))
      .map(shape => this.shapes.indexOf(shape))
      .forEach(index => {
        if (index === this.shapes.length - 1) return
        const next = this.shapes[index + 1]
        if (shapesToMove.includes(next)) return
        const t = this.shapes[index]
        this.shapes[index] = this.shapes[index + 1]
        this.shapes[index + 1] = t
      })
    return this
  }

  @action sendBackward = (shapes: S[] | string[]): this => {
    const shapesToMove = this.parseShapesArg(shapes)
    shapesToMove
      .sort((a, b) => this.shapes.indexOf(a) - this.shapes.indexOf(b))
      .map(shape => this.shapes.indexOf(shape))
      .forEach(index => {
        if (index === 0) return
        const next = this.shapes[index - 1]
        if (shapesToMove.includes(next)) return
        const t = this.shapes[index]
        this.shapes[index] = this.shapes[index - 1]
        this.shapes[index - 1] = t
      })
    return this
  }

  @action bringToFront = (shapes: S[] | string[]): this => {
    const shapesToMove = this.parseShapesArg(shapes)
    this.shapes = this.shapes.filter(shape => !shapesToMove.includes(shape)).concat(shapesToMove)
    return this
  }

  @action sendToBack = (shapes: S[] | string[]): this => {
    const shapesToMove = this.parseShapesArg(shapes)
    this.shapes = shapesToMove.concat(this.shapes.filter(shape => !shapesToMove.includes(shape)))
    return this
  }

  flip = (shapes: S[] | string[], direction: 'horizontal' | 'vertical'): this => {
    const shapesToMove = this.parseShapesArg(shapes)
    const commonBounds = BoundsUtils.getCommonBounds(shapesToMove.map(shape => shape.bounds))
    shapesToMove.forEach(shape => {
      const relativeBounds = BoundsUtils.getRelativeTransformedBoundingBox(
        commonBounds,
        commonBounds,
        shape.bounds,
        direction === 'horizontal',
        direction === 'vertical'
      )
      if (shape.serialized) {
        shape.onResize(shape.serialized, {
          bounds: relativeBounds,
          center: BoundsUtils.getBoundsCenter(relativeBounds),
          rotation: shape.props.rotation ?? 0 * -1,
          type: TLResizeCorner.TopLeft,
          scale:
            shape.canFlip && shape.props.scale
              ? direction === 'horizontal'
                ? [-shape.props.scale[0], 1]
                : [1, -shape.props.scale[1]]
              : [1, 1],
          clip: false,
          transformOrigin: [0.5, 0.5],
        })
      }
    })
    return this
  }

  getBindableShapes() {
    return this.shapes
      .filter(shape => shape.canBind)
      .sort((a, b) => b.nonce - a.nonce)
      .map(s => s.id)
  }

  getShapeById = <T extends S>(id: string): T | undefined => {
    const shape = this.shapes.find(shape => shape.id === id) as T
    return shape
  }

  /**
   * Recalculate binding positions etc. Will also persist state when needed.
   *
   * @param curr
   * @param prev
   */
  @action
  cleanup = (curr: TLPageModel, prev: TLPageModel) => {
    const updated = deepCopy(curr)
    const changedShapes: Record<string, TLShapeModel<S['props']> | undefined> = {}
    const prevShapes = Object.fromEntries(prev.shapes.map(shape => [shape.id, shape]))
    const currShapes = Object.fromEntries(curr.shapes.map(shape => [shape.id, shape]))

    // TODO: deleted shapes?
    curr.shapes.forEach(shape => {
      if (deepEqual(shape, prevShapes[shape.id])) {
        changedShapes[shape.id] = shape
      }
    })

    // Get bindings related to the changed shapes
    const bindingsToUpdate = getRelatedBindings(curr, Object.keys(changedShapes))

    const visitedShapes = new Set<TLShapeModel>()

    // Update all of the bindings we've just collected
    bindingsToUpdate.forEach(binding => {
      if (!updated.bindings[binding.id]) {
        return
      }

      const toShape = currShapes[binding.toId]
      const fromShape = currShapes[binding.fromId]

      if (!(toShape && fromShape)) {
        delete updated.bindings[binding.id]
        return
      }

      if (visitedShapes.has(fromShape)) {
        return
      }

      // We only need to update the binding's "from" shape (an arrow)
      // @ts-expect-error ???
      const fromDelta = this.updateArrowBindings(this.getShapeById<TLLineShape>(fromShape.id))
      visitedShapes.add(fromShape)

      if (fromDelta) {
        const nextShape = {
          ...fromShape,
          ...fromDelta,
        }
        const idx = updated.shapes.findIndex(s => s.id === nextShape.id)
        if (idx !== -1) {
          updated.shapes[idx] = nextShape
        }
      }
    })

    // Cleanup outdated bindings
    Object.keys(updated.bindings).forEach(id => {
      if (
        !updated.shapes.find(
          shape => shape.id === updated.bindings[id].toId || updated.bindings[id].fromId
        )
      ) {
        delete updated.bindings[id]
      }
    })

    if (!deepEqual(updated, curr)) {
      this.update({
        bindings: updated.bindings,
      })

      updated.shapes.forEach(shape => {
        this.getShapeById(shape.id)?.update(shape)
      })

      this.app.persist(true)
    }
  }

  private updateArrowBindings = (lineShape: TLLineShape) => {
    const result = {
      start: deepCopy(lineShape.props.handles.start),
      end: deepCopy(lineShape.props.handles.end),
    }
    type HandleInfo = {
      handle: TLHandle
      point: number[] // in page space
    } & (
      | {
          isBound: false
        }
      | {
          isBound: true
          hasDecoration: boolean
          binding: TLBinding
          target: TLShape
          bounds: TLBounds
          expandedBounds: TLBounds
          intersectBounds: TLBounds
          center: number[]
        }
    )
    let start: HandleInfo = {
      isBound: false,
      handle: lineShape.props.handles.start,
      point: Vec.add(lineShape.props.handles.start.point, lineShape.props.point),
    }
    let end: HandleInfo = {
      isBound: false,
      handle: lineShape.props.handles.end,
      point: Vec.add(lineShape.props.handles.end.point, lineShape.props.point),
    }
    if (lineShape.props.handles.start.bindingId) {
      const hasDecoration = lineShape.props.decorations?.start !== undefined
      const handle = lineShape.props.handles.start
      const binding = this.bindings[lineShape.props.handles.start.bindingId]
      // if (!binding) throw Error("Could not find a binding to match the start handle's bindingId")
      const target = this.getShapeById(binding?.toId)
      if (target) {
        const bounds = target.getBounds()
        const expandedBounds = target.getExpandedBounds()
        const intersectBounds = BoundsUtils.expandBounds(
          bounds,
          hasDecoration ? binding.distance : 1
        )
        const { minX, minY, width, height } = expandedBounds
        const anchorPoint = Vec.add(
          [minX, minY],
          Vec.mulV(
            [width, height],
            Vec.rotWith(binding.point, [0.5, 0.5], target.props.rotation || 0)
          )
        )
        start = {
          isBound: true,
          hasDecoration,
          binding,
          handle,
          point: anchorPoint,
          target,
          bounds,
          expandedBounds,
          intersectBounds,
          center: target.getCenter(),
        }
      }
    }
    if (lineShape.props.handles.end.bindingId) {
      const hasDecoration = lineShape.props.decorations?.end !== undefined
      const handle = lineShape.props.handles.end
      const binding = this.bindings[lineShape.props.handles.end.bindingId]
      const target = this.getShapeById(binding?.toId)
      if (target) {
        const bounds = target.getBounds()
        const expandedBounds = target.getExpandedBounds()
        const intersectBounds = hasDecoration
          ? BoundsUtils.expandBounds(bounds, binding.distance)
          : bounds
        const { minX, minY, width, height } = expandedBounds
        const anchorPoint = Vec.add(
          [minX, minY],
          Vec.mulV(
            [width, height],
            Vec.rotWith(binding.point, [0.5, 0.5], target.props.rotation || 0)
          )
        )
        end = {
          isBound: true,
          hasDecoration,
          binding,
          handle,
          point: anchorPoint,
          target,
          bounds,
          expandedBounds,
          intersectBounds,
          center: target.getCenter(),
        }
      }
    }

    for (const ID of ['end', 'start'] as const) {
      const A = ID === 'start' ? start : end
      const B = ID === 'start' ? end : start
      if (A.isBound) {
        if (!A.binding.distance) {
          // If the binding distance is zero, then the arrow is bound to a specific point
          // in the target shape. The resulting handle should be exactly at that point.
          result[ID].point = Vec.sub(A.point, lineShape.props.point)
        } else {
          // We'll need to figure out the handle's true point based on some intersections
          // between the opposite handle point and this handle point. This is different
          // for each type of shape.
          const direction = Vec.uni(Vec.sub(A.point, B.point))
          switch (A.target.type) {
            // TODO: do we need to support othershapes?
            default: {
              const hits = intersectRayBounds(
                B.point,
                direction,
                A.intersectBounds,
                A.target.props.rotation
              )
                .filter(int => int.didIntersect)
                .map(int => int.points[0])
                .sort((a, b) => Vec.dist(a, B.point) - Vec.dist(b, B.point))
              if (!hits[0]) continue
              let bHit: number[] | undefined = undefined
              if (B.isBound) {
                const bHits = intersectRayBounds(
                  B.point,
                  direction,
                  B.intersectBounds,
                  B.target.props.rotation
                )
                  .filter(int => int.didIntersect)
                  .map(int => int.points[0])
                  .sort((a, b) => Vec.dist(a, B.point) - Vec.dist(b, B.point))
                bHit = bHits[0]
              }
              if (
                B.isBound &&
                (hits.length < 2 ||
                  (bHit &&
                    hits[0] &&
                    Math.ceil(Vec.dist(hits[0], bHit)) < BINDING_DISTANCE * 2.5) ||
                  BoundsUtils.boundsContain(A.expandedBounds, B.expandedBounds) ||
                  BoundsUtils.boundsCollide(A.expandedBounds, B.expandedBounds))
              ) {
                // If the other handle is bound, and if we need to fallback to the short arrow method...
                const shortArrowDirection = Vec.uni(Vec.sub(B.point, A.point))
                const shortArrowHits = intersectRayBounds(
                  A.point,
                  shortArrowDirection,
                  A.bounds,
                  A.target.props.rotation
                )
                  .filter(int => int.didIntersect)
                  .map(int => int.points[0])
                if (!shortArrowHits[0]) continue
                result[ID].point = Vec.toFixed(Vec.sub(shortArrowHits[0], lineShape.props.point))
                result[ID === 'start' ? 'end' : 'start'].point = Vec.toFixed(
                  Vec.add(
                    Vec.sub(shortArrowHits[0], lineShape.props.point),
                    Vec.mul(
                      shortArrowDirection,
                      Math.min(
                        Vec.dist(shortArrowHits[0], B.point),
                        BINDING_DISTANCE *
                          2.5 *
                          (BoundsUtils.boundsContain(B.bounds, A.intersectBounds) ? -1 : 1)
                      )
                    )
                  )
                )
              } else if (
                !B.isBound &&
                ((hits[0] && Vec.dist(hits[0], B.point) < BINDING_DISTANCE * 2.5) ||
                  PointUtils.pointInBounds(B.point, A.intersectBounds))
              ) {
                // Short arrow time!
                const shortArrowDirection = Vec.uni(Vec.sub(A.center, B.point))
                return lineShape.getHandlesChange?.(lineShape.props, {
                  [ID]: {
                    ...lineShape.props.handles[ID],
                    point: Vec.toFixed(
                      Vec.add(
                        Vec.sub(B.point, lineShape.props.point),
                        Vec.mul(shortArrowDirection, BINDING_DISTANCE * 2.5)
                      )
                    ),
                  },
                })
              } else if (hits[0]) {
                result[ID].point = Vec.toFixed(Vec.sub(hits[0], lineShape.props.point))
              }
            }
          }
        }
      }
    }

    return lineShape.getHandlesChange(lineShape.props, result)
  }
}

function getRelatedBindings(page: TLPageModel, ids: string[]): TLBinding[] {
  const changedShapeIds = new Set(ids)
  const bindingsArr = Object.values(page.bindings)

  // Start with bindings that are directly bound to our changed shapes
  const bindingsToUpdate = new Set(
    bindingsArr.filter(
      binding => changedShapeIds.has(binding.toId) || changedShapeIds.has(binding.fromId)
    )
  )

  // Next, look for other bindings that effect the same shapes
  let prevSize = bindingsToUpdate.size
  let delta = -1

  while (delta !== 0) {
    bindingsToUpdate.forEach(binding => {
      const fromId = binding.fromId

      for (const otherBinding of bindingsArr) {
        if (otherBinding.fromId === fromId) {
          bindingsToUpdate.add(otherBinding)
        }

        if (otherBinding.toId === fromId) {
          bindingsToUpdate.add(otherBinding)
        }
      }
    })

    // Continue until we stop finding new bindings to update
    delta = bindingsToUpdate.size - prevSize

    prevSize = bindingsToUpdate.size
  }

  return Array.from(bindingsToUpdate.values())
}
