/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Vec } from '@tldraw/vec'
import { TLApp, TLSelectTool, TLShape, TLToolState } from '~lib'
import { TLCursor, TLEventHandleInfo, TLEventMap, TLEvents, TLHandle } from '~types'
import { deepCopy } from '~utils'

export class TranslatingHandleState<
  S extends TLShape,
  K extends TLEventMap,
  R extends TLApp<S, K>,
  P extends TLSelectTool<S, K, R>
> extends TLToolState<S, K, R, P> {
  static id = 'translatingHandle'
  cursor = TLCursor.Grabbing

  private offset = [0, 0]
  private initialTopLeft = [0, 0]
  private index = 0
  private shape: S = {} as S
  private handleId: 'start' | 'end' = 'start'
  private initialShape: S['props'] = {} as S['props']
  private handle: TLHandle = {} as TLHandle
  private bindableShapeIds: string[] = []

  onEnter = (
    info: {
      fromId: string
    } & TLEventHandleInfo<S>
  ) => {
    this.app.history.pause()
    this.offset = [0, 0]
    this.index = info.index
    this.shape = info.shape
    this.handle = info.handle
    this.initialShape = deepCopy({ ...this.shape.props })
    this.initialTopLeft = [...info.shape.props.point]

    const page = this.app.currentPage

    this.bindableShapeIds = page.shapes
      .filter(shape => shape.canBind)
      .sort((a, b) => b.nonce - a.nonce)
      .map(s => s.id)

    // // TODO: find out why this the oppositeHandleBindingId is sometimes missing
    // const oppositeHandleBindingId =
    //   this.initialShape.handles[handleId === 'start' ? 'end' : 'start']?.bindingId

    // if (oppositeHandleBindingId) {
    //   const oppositeToId = page.bindings[oppositeHandleBindingId]?.toId
    //   if (oppositeToId) {
    //     this.bindableShapeIds = this.bindableShapeIds.filter(id => id !== oppositeToId)
    //   }
    // }
  }

  onExit = () => {
    this.app.history.resume()
  }

  onWheel: TLEvents<S>['wheel'] = (info, e) => {
    this.onPointerMove(info, e)
  }

  onPointerMove: TLEvents<S>['pointer'] = () => {
    const {
      inputs: { shiftKey, previousPoint, originPoint, currentPoint },
    } = this.app
    if (Vec.isEqual(previousPoint, currentPoint)) return
    const delta = Vec.sub(currentPoint, originPoint)
    if (shiftKey) {
      if (Math.abs(delta[0]) < Math.abs(delta[1])) {
        delta[0] = 0
      } else {
        delta[1] = 0
      }
    }
    const { shape, initialShape, index } = this
    shape.onHandleChange(initialShape, { index, delta })
  }

  onPointerUp: TLEvents<S>['pointer'] = () => {
    this.app.history.resume()
    this.app.persist()
    this.tool.transition('idle')
  }

  onKeyDown: TLEvents<S>['keyboard'] = (info, e) => {
    switch (e.key) {
      case 'Escape': {
        this.shape.update(this.initialShape)
        this.tool.transition('idle')
        break
      }
    }
  }
}
