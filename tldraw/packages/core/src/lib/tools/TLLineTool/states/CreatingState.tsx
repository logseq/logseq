import type { TLLineTool } from '../TLLineTool'
import { TLShape, TLApp, TLToolState, TLLineShape, TLLineShapeProps } from '~lib'
import type { TLEventMap, TLLineBinding, TLStateEvents } from '~types'
import Vec from '@tldraw/vec'
import { deepCopy, deepMerge, GeomUtils, PointUtils, uniqueId } from '~utils'
import { toJS } from 'mobx'

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
      id: uniqueId(),
      type: Shape.id,
      parentId: this.app.currentPage.id,
      point: originPoint,
      handles: [
        { id: 'start', canBind: true, point: [0, 0] },
        { id: 'end', canBind: true, point: [1, 1] },
      ],
    })
    this.initialShape = toJS(shape.props)
    this.creatingShape = shape
    this.app.currentPage.addShapes(shape)
    this.app.setSelectedShapes([shape])

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
    const curIndex = 1
    const oppIndex = 0
    if (Vec.isEqual(previousPoint, currentPoint)) return
    let delta = Vec.sub(currentPoint, originPoint)

    if (shiftKey) {
      const A = handles[oppIndex].point
      const B = handles[curIndex].point
      const C = Vec.add(B, delta)
      const angle = Vec.angle(A, C)
      const adjusted = Vec.rotWith(C, A, GeomUtils.snapAngleToSegments(angle, 24) - angle)
      delta = Vec.add(delta, Vec.sub(adjusted, C))
    }

    const nextPoint = Vec.add(handles[curIndex].point, delta)

    const handleChanges = deepCopy(handles)
    handleChanges[curIndex].point = showGrid
      ? Vec.snap(nextPoint, currentGrid)
      : Vec.toFixed(nextPoint)

    let updated = this.creatingShape.getHandlesChange(this.initialShape, handleChanges)

    // If the handle changed produced no change, bail here
    if (!updated) return

    // If nothing changes, we want these to be the same object reference as
    // before. If it does change, we'll redefine this later on. And if we've
    // made it this far, the shape should be a new object reference that
    // incorporates the changes we've made due to the handle movement.
    const next: { props: TLLineShapeProps; bindings: Record<string, TLLineBinding> } = {
      props: {
        ...deepCopy(shape.props),
        ...updated,
        handles: updated.handles.map((h, idx) => deepMerge(shape.props.handles[idx], h)),
      },
      bindings: this.app.currentPage.bindings.reduce(
        (acc, binding) => ({ ...acc, [binding.id]: binding }),
        {}
      ),
    }

    let draggedBinding: TLLineBinding | undefined

    const draggingHandle = next.props.handles[curIndex]
    const oppositeHandle = next.props.handles[oppIndex]

    // START BINDING
    // If we have a start binding shape id, the recompute the binding
    // point based on the current end handle position

    if (this.startBindingShapeId) {
      let nextStartBinding: TLLineBinding | undefined

      const startTarget = this.app.getShapeById(this.startBindingShapeId)
      const center = startTarget.getCenter()

      const startHandle = next.props.handles[0]
      const endHandle = next.props.handles[1]

      const rayPoint = Vec.add(startHandle.point, next.props.point)

      if (Vec.isEqual(rayPoint, center)) rayPoint[1]++ // Fix bug where ray and center are identical

      const rayOrigin = center

      const isInsideShape = startTarget.hitTestPoint(currentPoint)

      const rayDirection = Vec.uni(Vec.sub(rayPoint, rayOrigin))

      const hasStartBinding = this.app.currentPage.bindings.some(
        b => b.id === this.newStartBindingId
      )

      // Don't bind the start handle if both handles are inside of the target shape.
      if (!modKey && !startTarget.hitTestPoint(Vec.add(next.props.point, endHandle.point))) {
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
        next.props.handles[0].bindingId = nextStartBinding.id
      } else if (!nextStartBinding && hasStartBinding) {
        delete next.bindings[this.newStartBindingId]
        next.props.handles[0].bindingId = undefined
      }
    }

    updated = this.creatingShape.getHandlesChange(next.props, next.props.handles)

    if (updated) {
      this.creatingShape.update(updated)
      this.app.currentPage.bindings = Object.values(next.bindings)
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
