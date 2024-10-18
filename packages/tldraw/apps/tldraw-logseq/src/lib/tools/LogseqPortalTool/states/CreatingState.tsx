import { TLApp, TLTargetType, TLToolState, uniqueId, GRID_SIZE } from '@tldraw/core'
import type { TLReactEventMap, TLReactEvents } from '@tldraw/react'
import Vec from '@tldraw/vec'
import { transaction } from 'mobx'
import { type Shape, LogseqPortalShape } from '../../../shapes'
import type { LogseqPortalTool } from '../LogseqPortalTool'

export class CreatingState extends TLToolState<
  Shape,
  TLReactEventMap,
  TLApp<Shape, TLReactEventMap>,
  LogseqPortalTool
> {
  static id = 'creating'

  creatingShape?: LogseqPortalShape

  offset: number[] = [0, 0]

  onEnter = () => {
    this.app.history.pause()
    transaction(() => {
      let point = Vec.sub(this.app.inputs.originPoint, this.offset)

      if (this.app.settings.snapToGrid) {
        point = Vec.snap(point, GRID_SIZE)
      }

      const shape = new LogseqPortalShape({
        id: uniqueId(),
        parentId: this.app.currentPage.id,
        point: point,
        size: LogseqPortalShape.defaultProps.size,
        fill: this.app.settings.color,
        stroke: this.app.settings.color,
      } as any)
      this.creatingShape = shape
      this.app.currentPage.addShapes(shape)
      this.app.setEditingShape(shape)
      this.app.setSelectedShapes([shape])
    })
  }

  onPointerDown: TLReactEvents<Shape>['pointer'] = info => {
    switch (info.type) {
      case TLTargetType.Shape: {
        if (info.shape === this.creatingShape) return
        this.app.selectTool('select')
        break
      }
      case TLTargetType.Selection: {
        break
      }
      case TLTargetType.Handle: {
        break
      }
      case TLTargetType.Canvas: {
        if (!info.order) {
          this.app.selectTool('select')
        }
        break
      }
    }
  }

  onExit = () => {
    if (!this.creatingShape) return
    this.app.history.resume()

    if (this.creatingShape?.props.pageId) {
      this.app.setSelectedShapes([this.creatingShape.id])
    } else {
      this.app.deleteShapes([this.creatingShape.id])
      this.app.setEditingShape()
    }
    this.creatingShape = undefined
  }
}
