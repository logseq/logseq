import { transaction } from 'mobx'
import { TLEventMap, TLEvents, TLTargetType } from '../../../../types'
import type { TLShape } from '../../../shapes'
import type { TLApp } from '../../../TLApp'
import { TLToolState } from '../../../TLToolState'
import type { TLSelectTool } from '../TLSelectTool'

export class EditingShapeState<
  S extends TLShape,
  K extends TLEventMap,
  R extends TLApp<S, K>,
  P extends TLSelectTool<S, K, R>
> extends TLToolState<S, K, R, P> {
  static id = 'editingShape'

  private editingShape = {} as S

  onEnter = (info: { type: TLTargetType.Shape; shape: S; order?: number }) => {
    this.editingShape = info.shape
    this.app.setEditingShape(info.shape)
  }

  onExit = () => {
    // cleanup text shapes
    if (this.editingShape && 'text' in this.editingShape.props) {
      // @ts-expect-error better typing
      const newText = this.editingShape.props['text'].trim()

      if (newText === '' && this.editingShape.props.type === 'text') {
        this.app.deleteShapes([this.editingShape])
      } else {
        this.editingShape.onResetBounds()
        this.editingShape.update({
          text: newText,
        })
      }
    }

    this.app.persist()
    this.app.setEditingShape()

    // Reset focus when exit idle
    document.querySelector<HTMLElement>('.tl-canvas')?.focus()
  }

  onPinchStart: TLEvents<S>['pinch'] = (info, event) => {
    this.tool.transition('pinching', { info, event })
  }

  onPointerDown: TLEvents<S>['pointer'] = info => {
    switch (info.type) {
      case TLTargetType.Shape: {
        if (info.shape === this.editingShape) return
        this.tool.transition('idle', info)
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
          this.tool.transition('idle', info)
        }
        break
      }
    }
  }

  onKeyDown: TLEvents<S>['keyboard'] = (info, e) => {
    switch (e.key) {
      case 'Escape': {
        transaction(() => {
          e.stopPropagation()
          this.app.setSelectedShapes([this.editingShape])
          this.tool.transition('idle')
        })
        break
      }
    }
  }
}
