/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { TLApp, TLSelectTool, TLShape, TLToolState } from '~lib'
import type { TLEvents, TLSelectionHandle, TLEventMap, TLEventSelectionInfo } from '~types'

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
