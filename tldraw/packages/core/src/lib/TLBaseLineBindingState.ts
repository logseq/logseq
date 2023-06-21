import Vec from '@tldraw/vec'
import { transaction } from 'mobx'
import type { TLBinding, TLEventMap, TLHandle, TLStateEvents } from '../types'
import { deepMerge, GeomUtils } from '../utils'
import { findBindingPoint } from '../utils/BindingUtils'
import type { TLLineShape, TLLineShapeProps, TLShape } from './shapes'
import type { TLApp } from './TLApp'
import type { TLTool } from './TLTool'
import { TLToolState } from './TLToolState'
import { GRID_SIZE } from '@tldraw/core'
export class TLBaseLineBindingState<
  S extends TLShape,
  T extends S & TLLineShape,
  K extends TLEventMap,
  R extends TLApp<S, K>,
  P extends TLTool<S, K, R>
> extends TLToolState<S, K, R, P> {
  static id = 'creating'

  handle: TLHandle = {} as TLHandle
  handleId: 'start' | 'end' = 'end'
  currentShape = {} as T
  initialShape = {} as T['props']
  bindableShapeIds: string[] = []
  startBindingShapeId?: string
  newStartBindingId = ''
  // Seems this value is never assigned to other than the default?
  draggedBindingId = ''

  onPointerMove: TLStateEvents<S, K>['onPointerMove'] = () => {
    const {
      inputs: { shiftKey, previousPoint, originPoint, currentPoint, modKey, altKey },
      settings: { snapToGrid },
    } = this.app
    // @ts-expect-error just ignore
    const shape = this.app.getShapeById<TLLineShape>(this.initialShape.id)!

    const { handles } = this.initialShape
    const handleId = this.handleId
    const otherHandleId = this.handleId === 'start' ? 'end' : 'start'
    if (Vec.isEqual(previousPoint, currentPoint)) return
    let delta = Vec.sub(currentPoint, originPoint)

    if (shiftKey) {
      const A = handles[otherHandleId].point
      const B = handles[handleId].point
      const C = Vec.add(B, delta)
      const angle = Vec.angle(A, C)
      const adjusted = Vec.rotWith(C, A, GeomUtils.snapAngleToSegments(angle, 24) - angle)
      delta = Vec.add(delta, Vec.sub(adjusted, C))
    }

    const nextPoint = Vec.add(handles[handleId].point, delta)

    const handleChanges = {
      [handleId]: {
        ...handles[handleId],
        point: snapToGrid ? Vec.snap(nextPoint, GRID_SIZE) : Vec.toFixed(nextPoint),
        bindingId: undefined,
      },
    }

    let updated = this.currentShape.getHandlesChange(this.initialShape, handleChanges)

    // If the handle changed produced no change, bail here
    if (!updated) return

    // If nothing changes, we want these to be the same object reference as
    // before. If it does change, we'll redefine this later on. And if we've
    // made it this far, the shape should be a new object reference that
    // incorporates the changes we've made due to the handle movement.
    const next: { shape: TLLineShapeProps; bindings: Record<string, TLBinding> } = {
      shape: deepMerge(shape.props, updated),
      bindings: {},
    }

    let draggedBinding: TLBinding | undefined

    const draggingHandle = next.shape.handles[handleId]
    const oppositeHandle = next.shape.handles[otherHandleId]

    // START BINDING
    // If we have a start binding shape id, the recompute the binding
    // point based on the current end handle position

    if (this.startBindingShapeId) {
      let nextStartBinding: TLBinding | undefined

      const startTarget = this.app.getShapeById(this.startBindingShapeId)
      if (startTarget) {
        const center = startTarget.getCenter()

        const startHandle = next.shape.handles.start
        const endHandle = next.shape.handles.end

        const rayPoint = Vec.add(startHandle.point, next.shape.point)

        if (Vec.isEqual(rayPoint, center)) rayPoint[1]++ // Fix bug where ray and center are identical

        const rayOrigin = center

        const isInsideShape = startTarget.hitTestPoint(currentPoint)

        const rayDirection = Vec.uni(Vec.sub(rayPoint, rayOrigin))

        const hasStartBinding = this.app.currentPage.bindings[this.newStartBindingId] !== undefined

        // Don't bind the start handle if both handles are inside of the target shape.
        if (!modKey && !startTarget.hitTestPoint(Vec.add(next.shape.point, endHandle.point))) {
          nextStartBinding = findBindingPoint(
            shape.props,
            startTarget,
            'start',
            this.newStartBindingId,
            center,
            rayOrigin,
            rayDirection,
            isInsideShape
          )
        }

        if (nextStartBinding && !hasStartBinding) {
          next.bindings[this.newStartBindingId] = nextStartBinding
          next.shape.handles.start.bindingId = nextStartBinding.id
        } else if (!nextStartBinding && hasStartBinding) {
          console.log('removing start binding')
          delete next.bindings[this.newStartBindingId]
          next.shape.handles.start.bindingId = undefined
        }
      }
    }

    if (!modKey) {
      const rayOrigin = Vec.add(oppositeHandle.point, next.shape.point)

      const rayPoint = Vec.add(draggingHandle.point, next.shape.point)

      const rayDirection = Vec.uni(Vec.sub(rayPoint, rayOrigin))

      const startPoint = Vec.add(next.shape.point, next.shape.handles.start.point)

      const endPoint = Vec.add(next.shape.point, next.shape.handles.end.point)

      const targets = this.bindableShapeIds
        .map(id => this.app.getShapeById(id)!)
        .sort((a, b) => b.nonce - a.nonce)
        .filter(shape => {
          return ![startPoint, endPoint].every(point => shape.hitTestPoint(point))
        })

      for (const target of targets) {
        draggedBinding = findBindingPoint(
          shape.props,
          target,
          this.handleId,
          this.draggedBindingId,
          rayPoint,
          rayOrigin,
          rayDirection,
          altKey
        )

        if (draggedBinding) break
      }
    }

    if (draggedBinding) {
      // Create the dragged point binding
      next.bindings[this.draggedBindingId] = draggedBinding

      next.shape = deepMerge(next.shape, {
        handles: {
          [this.handleId]: {
            bindingId: this.draggedBindingId,
          },
        },
      })
    } else {
      // Remove the dragging point binding
      const currentBindingId = shape.props.handles[this.handleId].bindingId

      if (currentBindingId !== undefined) {
        delete next.bindings[currentBindingId]

        next.shape = deepMerge(next.shape, {
          handles: {
            [this.handleId]: {
              bindingId: undefined,
            },
          },
        })
      }
    }

    updated = this.currentShape.getHandlesChange(next.shape, next.shape.handles)

    transaction(() => {
      if (updated) {
        this.currentShape.update(updated)
        this.app.currentPage.updateBindings(next.bindings)
        const bindingShapes = Object.values(updated.handles ?? {})
          .map(handle => handle.bindingId!)
          .map(id => this.app.currentPage.bindings[id])
          .filter(Boolean)
          .flatMap(binding => [binding.toId, binding.fromId].filter(Boolean))
        this.app.setBindingShapes(bindingShapes)
      }
    })
  }

  onPointerUp: TLStateEvents<S, K>['onPointerUp'] = () => {
    this.tool.transition('idle')
    if (this.currentShape) {
      this.app.setSelectedShapes([this.currentShape])
    }
    this.app.transition('select')
    this.app.persist()
  }

  onExit: TLStateEvents<S, K>['onExit'] = () => {
    this.app.clearBindingShape()
    this.app.history.resume()
    this.app.persist()
  }

  onKeyDown: TLStateEvents<S>['onKeyDown'] = (info, e) => {
    switch (e.key) {
      case 'Escape': {
        this.app.deleteShapes([this.currentShape])
        this.tool.transition('idle')
        break
      }
    }
  }
}
