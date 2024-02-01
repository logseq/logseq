/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { TLBounds } from '@tldraw/intersect'
import { Vec } from '@tldraw/vec'
import { CURSORS } from '../../../../constants'
import {
  type TLEventMap,
  TLCursor,
  type TLHandle,
  type TLSelectionHandle,
  type TLEventSelectionInfo,
  type TLEvents,
} from '../../../../types'
import { BoundsUtils, deepCopy, GeomUtils } from '../../../../utils'
import type { TLShape } from '../../../shapes'
import type { TLApp } from '../../../TLApp'
import { TLToolState } from '../../../TLToolState'
import type { TLSelectTool } from '../TLSelectTool'

export class RotatingState<
  S extends TLShape,
  K extends TLEventMap,
  R extends TLApp<S, K>,
  P extends TLSelectTool<S, K, R>
> extends TLToolState<S, K, R, P> {
  static id = 'rotating'
  cursor = TLCursor.Rotate

  snapshot: Record<
    string,
    {
      point: number[]
      center: number[]
      rotation?: number
      handles?: TLHandle[]
    }
  > = {}

  initialCommonCenter = [0, 0]
  initialCommonBounds = {} as TLBounds
  initialAngle = 0
  initialSelectionRotation = 0
  handle = '' as TLSelectionHandle

  onEnter = (info: TLEventSelectionInfo) => {
    const { history, selectedShapesArray, selectionBounds } = this.app

    if (!selectionBounds) throw Error('Expected selected bounds.')

    history.pause()
    this.handle = info.handle
    this.initialSelectionRotation = this.app.selectionRotation
    this.initialCommonBounds = { ...selectionBounds }
    this.initialCommonCenter = BoundsUtils.getBoundsCenter(selectionBounds)
    this.initialAngle = Vec.angle(this.initialCommonCenter, this.app.inputs.currentPoint)
    this.snapshot = Object.fromEntries(
      selectedShapesArray.map(shape => [
        shape.id,
        {
          point: [...shape.props.point],
          center: [...shape.center],
          rotation: shape.props.rotation,
          handles: 'handles' in shape ? deepCopy((shape as any).handles) : undefined,
        },
      ])
    )

    this.updateCursor()
  }

  onExit = () => {
    this.app.history.resume()
    this.snapshot = {}
  }

  onPointerMove: TLEvents<S>['pointer'] = () => {
    const {
      selectedShapes,
      inputs: { shiftKey, currentPoint },
    } = this.app

    const { snapshot, initialCommonCenter, initialAngle, initialSelectionRotation } = this

    const currentAngle = Vec.angle(initialCommonCenter, currentPoint)

    let angleDelta = currentAngle - initialAngle

    if (shiftKey) {
      angleDelta = GeomUtils.snapAngleToSegments(angleDelta, 24)
    }

    selectedShapes.forEach(shape => {
      const initialShape = snapshot[shape.id]

      let initialAngle = 0

      if (shiftKey) {
        const { rotation = 0 } = initialShape
        initialAngle = GeomUtils.snapAngleToSegments(rotation, 24) - rotation
      }

      const relativeCenter = Vec.sub(initialShape.center, initialShape.point)
      const rotatedCenter = Vec.rotWith(initialShape.center, initialCommonCenter, angleDelta)

      if ('handles' in shape) {
        // Don't rotate shapes with handles; instead, rotate the handles
        const initialHandles = initialShape.handles!
        const handlePoints = initialHandles!.map(handle =>
          Vec.rotWith(handle.point, relativeCenter, angleDelta)
        )
        const topLeft = BoundsUtils.getCommonTopLeft(handlePoints)
        shape.update({
          point: Vec.add(topLeft, Vec.sub(rotatedCenter, relativeCenter)),
          handles: initialHandles.map((h, i) => ({
            ...h,
            point: Vec.sub(handlePoints[i], topLeft),
          })),
        })
      } else {
        shape.update({
          point: Vec.sub(rotatedCenter, relativeCenter),
          rotation: GeomUtils.clampRadians(
            (initialShape.rotation || 0) + angleDelta + initialAngle
          ),
        })
      }
    })

    const selectionRotation = GeomUtils.clampRadians(initialSelectionRotation + angleDelta)
    this.app.setSelectionRotation(
      shiftKey ? GeomUtils.snapAngleToSegments(selectionRotation, 24) : selectionRotation
    )
    this.updateCursor()
  }

  onPointerUp: TLEvents<S>['pointer'] = () => {
    this.app.history.resume()
    this.app.persist()
    this.tool.transition('idle')
  }

  onKeyDown: TLEvents<S>['keyboard'] = (info, e) => {
    switch (e.key) {
      case 'Escape': {
        this.app.selectedShapes.forEach(shape => {
          shape.update(this.snapshot[shape.id])
        })
        this.tool.transition('idle')
        break
      }
    }
  }

  private updateCursor() {
    this.app.cursors.setCursor(CURSORS[this.handle], this.app.selectionRotation)
  }
}
