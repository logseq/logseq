/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { TLShape } from '../../../shapes'
import type { TLApp } from '../../../TLApp'
import { TLToolState } from '../../../TLToolState'
import type { TLSelectTool } from '../TLSelectTool'
import type { TLEvents, TLSelectionHandle, TLEventMap, TLEventSelectionInfo } from '../../../../types'

export class ContextMenuState<
  S extends TLShape,
  K extends TLEventMap,
  R extends TLApp<S, K>,
  P extends TLSelectTool<S, K, R>
> extends TLToolState<S, K, R, P> {
  static id = 'contextMenu'

  handle?: TLSelectionHandle

  onEnter = (info: TLEventSelectionInfo) => {
    this.handle = info.handle
  }

  onPointerDown: TLEvents<S>['pointer'] = () => {
    this.tool.transition('idle')
  }
}
