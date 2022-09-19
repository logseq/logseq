import { TLApp, TLTargetType, TLToolState, uniqueId } from '@tldraw/core'
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
      const shape = new LogseqPortalShape({
        id: uniqueId(),
        parentId: this.app.currentPage.id,
        point: Vec.sub(this.app.inputs.originPoint, this.offset),
        size: LogseqPortalShape.defaultProps.size,
      } as any)
      this.creatingShape = shape
      this.app.currentPage.addShapes(shape)
      this.app.setEditingShape(shape)
      this.app.setSelectedShapes([shape])
      if (this.app.viewport.camera.zoom < 0.8 || this.app.viewport.camera.zoom > 1.2) {
        this.app.api.resetZoomToCursor()
      }
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
  }
}
