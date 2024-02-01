/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Vec } from '@tldraw/vec'
import { CURSORS } from '../../../../constants'
import type { TLEventMap, TLEventSelectionInfo, TLEvents } from '../../../../types'
import type { TLShape } from '../../../shapes'
import type { TLApp } from '../../../TLApp'
import { TLToolState } from '../../../TLToolState'
import type { TLSelectTool } from '../TLSelectTool'

export class PointingResizeHandleState<
  S extends TLShape,
  K extends TLEventMap,
  R extends TLApp<S, K>,
  P extends TLSelectTool<S, K, R>
> extends TLToolState<S, K, R, P> {
  static id = 'pointingResizeHandle'

  private info = {} as TLEventSelectionInfo

  onEnter = (info: TLEventSelectionInfo) => {
    this.info = info
    this.updateCursor()
  }

  onExit = () => {
    this.app.cursors.reset()
  }

  onPointerMove: TLEvents<S>['pointer'] = () => {
    const { currentPoint, originPoint } = this.app.inputs
    if (Vec.dist(currentPoint, originPoint) > 5) {
      this.tool.transition('resizing', this.info)
    }
  }

  onPointerUp: TLEvents<S>['pointer'] = () => {
    this.tool.transition('hoveringSelectionHandle', this.info)
  }

  onPinchStart: TLEvents<S>['pinch'] = (info, event) => {
    this.tool.transition('pinching', { info, event })
  }

  private updateCursor() {
    const rotation = this.app.selectionBounds!.rotation
    const cursor = CURSORS[this.info.handle]
    this.app.cursors.setCursor(cursor, rotation)
  }
}
