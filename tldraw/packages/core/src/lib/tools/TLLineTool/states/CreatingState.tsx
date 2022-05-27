import Vec from '@tldraw/vec'
import { toJS } from 'mobx'
import { TLApp, TLLineShape, TLLineShapeProps, TLShape, TLToolState } from '~lib'
import type { TLEventMap, TLBinding, TLStateEvents } from '~types'
import { deepMerge, GeomUtils, PointUtils, uniqueId } from '~utils'
import type { TLLineTool } from '../TLLineTool'

export class CreatingState<
  S extends TLShape,
  T extends S & TLLineShape,
  K extends TLEventMap,
  R extends TLApp<S, K>,
  P extends TLLineTool<T, S, K, R>
> extends TLToolState<S, K, R, P> {
  static id = 'creating'

  creatingShape = {} as T
  initialShape = {} as T['props']
  bindableShapeIds: string[] = []
  startBindingShapeId?: string
  newStartBindingId = uniqueId()
  draggedBindingId = uniqueId()

  onEnter = () => {
    const { Shape } = this.tool
    const { originPoint } = this.app.inputs

    const shape = new Shape({
      ...Shape.defaultProps,
      id: uniqueId(),
      type: Shape.id,
      parentId: this.app.currentPage.id,
      point: originPoint,
    })
    this.initialShape = toJS(shape.props)
    this.creatingShape = shape
    this.app.currentPage.addShapes(shape)
    this.app.setSelectedShapes([shape])
    this.newStartBindingId = uniqueId()
    this.draggedBindingId = uniqueId()

    const page = this.app.currentPage

    this.bindableShapeIds = page.getBindableShapes()

    this.startBindingShapeId = this.bindableShapeIds
      .map(id => this.app.getShapeById(id))
      .filter(s => PointUtils.pointInBounds(originPoint, s.bounds))[0]?.id

    if (this.startBindingShapeId) {
      this.bindableShapeIds.splice(this.bindableShapeIds.indexOf(this.startBindingShapeId), 1)
      this.app.setBindingShape(this.startBindingShapeId)
    }
  }

  onPointerMove: TLStateEvents<S, K>['onPointerMove'] = () => {
    const {
      inputs: { shiftKey, previousPoint, originPoint, currentPoint, modKey },
      settings: { showGrid },
      currentGrid,
    } = this.app
    // @ts-expect-error just ignore
    const shape = this.app.getShapeById<TLLineShape>(this.initialShape.id)

    const { handles } = this.initialShape
    const handleId = 'end'
    const otherHandleId = 'start'
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
        // FIXME Snap not working properly
        point: showGrid ? Vec.snap(nextPoint, currentGrid) : Vec.toFixed(nextPoint),
        bindingId: undefined,
      },
    }

    let updated = this.creatingShape.getHandlesChange(this.initialShape, handleChanges)

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
        nextStartBinding = this.findBindingPoint(
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

    updated = this.creatingShape.getHandlesChange(next.shape, next.shape.handles)

    if (updated) {
      this.creatingShape.update(updated)
      this.app.currentPage.updateBindings(next.bindings)
    }
  }

  onPointerUp: TLStateEvents<S, K>['onPointerUp'] = () => {
    this.tool.transition('idle')
    if (this.creatingShape) {
      this.app.setSelectedShapes([this.creatingShape])
    }
    if (!this.app.settings.isToolLocked) {
      this.app.transition('select')
    }
    this.app.persist()
  }

  onWheel: TLStateEvents<S, K>['onWheel'] = (info, e) => {
    this.onPointerMove(info, e)
  }

  onExit: TLStateEvents<S, K>['onExit'] = () => {
    this.app.clearBindingShape()
  }

  onKeyDown: TLStateEvents<S>['onKeyDown'] = (info, e) => {
    switch (e.key) {
      case 'Escape': {
        this.app.deleteShapes([this.creatingShape])
        this.tool.transition('idle')
        break
      }
    }
  }

  private findBindingPoint = (
    shape: TLLineShapeProps,
    target: TLShape,
    handleId: 'start' | 'end',
    bindingId: string,
    point: number[],
    origin: number[],
    direction: number[],
    bindAnywhere: boolean
  ) => {
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
}
