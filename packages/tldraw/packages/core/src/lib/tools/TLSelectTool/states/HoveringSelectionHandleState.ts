/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { CURSORS } from '../../../../constants'
import {
  type TLEventMap,
  type TLSelectionHandle,
  type TLEventSelectionInfo,
  type TLEvents,
  TLTargetType,
  TLRotateCorner,
} from '../../../../types'
import { getFirstFromSet } from '../../../../utils'
import type { TLShape } from '../../../shapes'
import type { TLApp } from '../../../TLApp'
import { TLToolState } from '../../../TLToolState'
import type { TLSelectTool } from '../TLSelectTool'

export class HoveringSelectionHandleState<
  S extends TLShape,
  K extends TLEventMap,
  R extends TLApp<S, K>,
  P extends TLSelectTool<S, K, R>
> extends TLToolState<S, K, R, P> {
  static id = 'hoveringSelectionHandle'

  handle?: TLSelectionHandle

  onEnter = (info: TLEventSelectionInfo) => {
    this.app.cursors.setCursor(CURSORS[info.handle], this.app.selectionBounds!.rotation ?? 0)
    this.handle = info.handle
  }

  onExit = () => {
    this.app.cursors.reset()
  }

  onPinchStart: TLEvents<S>['pinch'] = (info, event) => {
    this.tool.transition('pinching', { info, event })
  }

  onPointerDown: TLEvents<S>['pointer'] = info => {
    switch (info.type) {
      case TLTargetType.Selection: {
        switch (info.handle) {
          case 'center': {
            break
          }
          case 'background': {
            break
          }
          case TLRotateCorner.TopLeft:
          case TLRotateCorner.TopRight:
          case TLRotateCorner.BottomRight:
          case TLRotateCorner.BottomLeft: {
            this.tool.transition('pointingRotateHandle', info)
            break
          }
          default: {
            this.tool.transition('pointingResizeHandle', info)
          }
        }
        break
      }
    }
  }

  onPointerLeave: TLEvents<S>['pointer'] = () => {
    this.tool.transition('idle')
  }

  onDoubleClick: TLEvents<S>['pointer'] = info => {
    if (info.order) return
    const isSingle = this.app.selectedShapes.size === 1
    if (!isSingle) return
    const selectedShape = getFirstFromSet(this.app.selectedShapes)

    if (selectedShape.canEdit && !this.app.readOnly && !selectedShape.props.isLocked) {
      switch (info.type) {
        case TLTargetType.Shape: {
          this.tool.transition('editingShape', info)
          break
        }
        case TLTargetType.Selection: {
          selectedShape.onResetBounds?.({
            zoom: this.app.viewport.camera.zoom,
          })
          if (this.app.selectedShapesArray.length === 1) {
            this.tool.transition('editingShape', {
              type: TLTargetType.Shape,
              target: selectedShape,
            })
          }
          break
        }
      }
    } else {
      const asset = selectedShape.props.assetId
        ? this.app.assets[selectedShape.props.assetId]
        : undefined
      selectedShape.onResetBounds({ asset, zoom: this.app.viewport.camera.zoom })
      this.tool.transition('idle')
    }
  }
}
