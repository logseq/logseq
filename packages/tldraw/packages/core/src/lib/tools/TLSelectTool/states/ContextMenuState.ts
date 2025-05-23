/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { TLShape } from '../../../shapes'
import type { TLApp } from '../../../TLApp'
import { TLToolState } from '../../../TLToolState'
import type { TLSelectTool } from '../TLSelectTool'
import type { TLEvents, TLEventMap, TLEventInfo } from '../../../../types'
import { TLTargetType } from '../../../../types'

export class ContextMenuState<
  S extends TLShape,
  K extends TLEventMap,
  R extends TLApp<S, K>,
  P extends TLSelectTool<S, K, R>
> extends TLToolState<S, K, R, P> {
  static id = 'contextMenu'

  onEnter = (info: TLEventInfo<S>) => {
    const {
      selectedIds,
      inputs: { shiftKey },
    } = this.app

    if (info.type === TLTargetType.Shape && !selectedIds.has(info.shape.id)) {
      const shape = this.app.getParentGroup(info.shape) ?? info.shape
      if (shiftKey) {
        this.app.setSelectedShapes([...Array.from(selectedIds.values()), shape.id])
        return
      }
      this.app.setSelectedShapes([shape])
    }
  }

  onPointerDown: TLEvents<S>['pointer'] = () => {
    this.tool.transition('idle')
  }
}
