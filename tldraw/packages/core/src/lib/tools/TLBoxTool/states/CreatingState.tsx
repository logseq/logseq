import type { TLBoxTool } from '../TLBoxTool'
import { TLShape, TLApp, TLToolState, TLBoxShape } from '~lib'
import Vec from '@tldraw/vec'
import { TLCursor, TLEventMap, TLResizeCorner, TLStateEvents } from '~types'
import type { TLBounds } from '@tldraw/intersect'
import { BoundsUtils, uniqueId } from '~utils'

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
    this.app.currentPage.addShapes(shape as unknown as S)
    this.app.setSelectedShapes([shape as unknown as S])
  }

  onPointerMove: TLStateEvents<S, K>['onPointerMove'] = info => {
    if (info.order) return
    if (!this.creatingShape) throw Error('Expected a creating shape.')
    const { initialBounds } = this
    const { currentPoint, originPoint, shiftKey } = this.app.inputs
    const bounds = BoundsUtils.getTransformedBoundingBox(
      initialBounds,
      TLResizeCorner.BottomRight,
      Vec.sub(currentPoint, originPoint),
      0,
      shiftKey ||
        this.creatingShape.props.isAspectRatioLocked ||
        !this.creatingShape.canChangeAspectRatio
    )

    this.creatingShape.update({
      point: [bounds.minX, bounds.minY],
      size: [bounds.width, bounds.height],
    })
  }

  onPointerUp: TLStateEvents<S, K>['onPointerUp'] = () => {
    this.tool.transition('idle')
    if (this.creatingShape) {
      this.app.setSelectedShapes([this.creatingShape as unknown as S])
    }
    if (!this.app.settings.isToolLocked) {
      this.app.transition('select')
    }
  }

  onWheel: TLStateEvents<S, K>['onWheel'] = (info, e) => {
    this.onPointerMove(info, e)
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
