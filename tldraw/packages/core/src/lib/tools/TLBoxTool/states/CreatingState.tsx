import type { TLBoxTool } from '../TLBoxTool'
import Vec from '@tldraw/vec'
import { GRID_SIZE } from '@tldraw/core'
import type { TLBounds } from '@tldraw/intersect'
import { type TLEventMap, TLCursor, type TLStateEvents, TLResizeCorner } from '../../../../types'
import { uniqueId, BoundsUtils } from '../../../../utils'
import type { TLBoxShape, TLShape } from '../../../shapes'
import type { TLApp } from '../../../TLApp'
import { TLToolState } from '../../../TLToolState'

export class CreatingState<
  T extends TLBoxShape,
  S extends TLShape,
  K extends TLEventMap,
  R extends TLApp<S, K>,
  P extends TLBoxTool<T, S, K, R>
> extends TLToolState<S, K, R, P> {
  static id = 'creating'

  cursor = TLCursor.Cross
  creatingShape?: T
  aspectRatio?: number
  initialBounds = {} as TLBounds

  onEnter = () => {
    const {
      currentPage,
      inputs: { originPoint, currentPoint },
    } = this.app
    const { Shape } = this.tool
    const shape = new Shape({
      id: uniqueId(),
      type: Shape.id,
      parentId: currentPage.id,
      point: [...originPoint],
      fill: this.app.settings.color,
      stroke: this.app.settings.color,
      size: Vec.abs(Vec.sub(currentPoint, originPoint)),
    })
    this.initialBounds = {
      minX: originPoint[0],
      minY: originPoint[1],
      maxX: originPoint[0] + 1,
      maxY: originPoint[1] + 1,
      width: 1,
      height: 1,
    }
    // toJS(shape.bounds)
    if (!shape.canChangeAspectRatio) {
      if (shape.aspectRatio) {
        this.aspectRatio = shape.aspectRatio
        this.initialBounds.height = this.aspectRatio
        this.initialBounds.width = 1
      } else {
        this.aspectRatio = 1
        this.initialBounds.height = 1
        this.initialBounds.width = 1
      }
      this.initialBounds.maxY = this.initialBounds.minY + this.initialBounds.height
    }
    this.creatingShape = shape
    this.creatingShape.setScaleLevel(this.app.settings.scaleLevel)
    this.app.currentPage.addShapes(shape as unknown as S)
    this.app.setSelectedShapes([shape as unknown as S])
  }

  onPointerMove: TLStateEvents<S, K>['onPointerMove'] = info => {
    if (info.order) return
    if (!this.creatingShape) throw Error('Expected a creating shape.')
    const { initialBounds } = this
    const { currentPoint, originPoint, shiftKey } = this.app.inputs
    let bounds = BoundsUtils.getTransformedBoundingBox(
      initialBounds,
      TLResizeCorner.BottomRight,
      Vec.sub(currentPoint, originPoint),
      0,
      shiftKey ||
        this.creatingShape.props.isAspectRatioLocked ||
        !this.creatingShape.canChangeAspectRatio
    )

    if (this.app.settings.snapToGrid) {
      bounds = BoundsUtils.snapBoundsToGrid(bounds, GRID_SIZE)
    }

    this.creatingShape.update({
      point: [bounds.minX, bounds.minY],
      size: [bounds.width, bounds.height],
    })
  }

  onPointerUp: TLStateEvents<S, K>['onPointerUp'] = () => {
    this.tool.transition('idle')
    if (this.creatingShape) {
      this.app.setSelectedShapes([this.creatingShape as unknown as S])
      this.app.api.editShape(this.creatingShape)
    } else {
      this.app.transition('select')
    }
    this.app.persist()
  }

  onKeyDown: TLStateEvents<S>['onKeyDown'] = (info, e) => {
    switch (e.key) {
      case 'Escape': {
        if (!this.creatingShape) throw Error('Expected a creating shape.')
        this.app.deleteShapes([this.creatingShape as unknown as S])
        this.tool.transition('idle')
        break
      }
    }
  }
}
