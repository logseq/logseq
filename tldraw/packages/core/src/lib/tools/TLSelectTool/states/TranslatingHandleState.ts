/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { toJS } from 'mobx'
import { type TLEventMap, TLCursor, type TLEventHandleInfo } from '../../../../types'
import { uniqueId } from '../../../../utils'
import type { TLShape, TLLineShape } from '../../../shapes'
import type { TLApp } from '../../../TLApp'
import { TLBaseLineBindingState } from '../../../TLBaseLineBindingState'
import type { TLSelectTool } from '../TLSelectTool'

export class TranslatingHandleState<
  S extends TLShape,
  T extends S & TLLineShape,
  K extends TLEventMap,
  R extends TLApp<S, K>,
  P extends TLSelectTool<S, K, R>
> extends TLBaseLineBindingState<S, T, K, R, P> {
  static id = 'translatingHandle'
  cursor = TLCursor.Grabbing

  onEnter = (
    info: {
      fromId: string
    } & TLEventHandleInfo<S>
  ) => {
    this.app.history.pause()
    this.newStartBindingId = uniqueId()
    this.draggedBindingId = uniqueId()

    const page = this.app.currentPage
    this.bindableShapeIds = page.getBindableShapes()

    this.handleId = info.id as 'start' | 'end'
    this.currentShape = info.shape as T
    this.initialShape = toJS(this.currentShape.props)
    this.app.setSelectedShapes([this.currentShape])
  }
}
