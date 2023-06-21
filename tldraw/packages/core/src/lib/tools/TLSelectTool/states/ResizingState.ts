import type { TLBounds } from '@tldraw/intersect'
import { GRID_SIZE } from '@tldraw/core'
import { Vec } from '@tldraw/vec'
import {
  type TLEventMap,
  TLResizeCorner,
  TLResizeEdge,
  TLCursor,
  type TLEvents,
} from '../../../../types'
import { BoundsUtils, getFirstFromSet } from '../../../../utils'
import type { TLShape, TLShapeModel } from '../../../shapes'
import type { TLApp } from '../../../TLApp'
import { TLToolState } from '../../../TLToolState'
import type { TLSelectTool } from '../TLSelectTool'

export class ResizingState<
  S extends TLShape,
  K extends TLEventMap,
  R extends TLApp<S, K>,
  P extends TLSelectTool<S, K, R>
> extends TLToolState<S, K, R, P> {
  static id = 'resizing'

  private isSingle = false

  private handle: TLResizeCorner | TLResizeEdge = TLResizeCorner.BottomRight

  private snapshots: Record<
    string,
    {
      props: TLShapeModel<S['props']>
      bounds: TLBounds
      transformOrigin: number[]
      innerTransformOrigin: number[]
      isAspectRatioLocked: boolean
    }
  > = {}

  private initialCommonBounds = {} as TLBounds

  private selectionRotation = 0

  private resizeType = 'corner'

  static CURSORS: Record<TLResizeCorner | TLResizeEdge, TLCursor> = {
    [TLResizeEdge.Bottom]: TLCursor.NsResize,
    [TLResizeEdge.Top]: TLCursor.NsResize,
    [TLResizeEdge.Left]: TLCursor.EwResize,
    [TLResizeEdge.Right]: TLCursor.EwResize,
    [TLResizeCorner.BottomLeft]: TLCursor.NeswResize,
    [TLResizeCorner.BottomRight]: TLCursor.NwseResize,
    [TLResizeCorner.TopLeft]: TLCursor.NwseResize,
    [TLResizeCorner.TopRight]: TLCursor.NeswResize,
  }

  onEnter = (info: { handle: TLResizeCorner | TLResizeEdge }) => {
    const { history, selectedShapesArray, selectionBounds } = this.app
    if (!selectionBounds) throw Error('Expected a selected bounds.')
    this.handle = info.handle
    this.resizeType =
      info.handle === TLResizeEdge.Left || info.handle === TLResizeEdge.Right
        ? 'horizontal-edge'
        : info.handle === TLResizeEdge.Top || info.handle === TLResizeEdge.Bottom
        ? 'vertical-edge'
        : 'corner'
    this.app.cursors.setCursor(
      ResizingState.CURSORS[info.handle],
      this.app.selectionBounds?.rotation
    )
    history.pause()
    const initialInnerBounds = BoundsUtils.getBoundsFromPoints(
      selectedShapesArray.map(shape => BoundsUtils.getBoundsCenter(shape.bounds))
    )
    this.isSingle = selectedShapesArray.length === 1
    this.selectionRotation = this.isSingle ? selectedShapesArray[0].props.rotation ?? 0 : 0
    this.initialCommonBounds = { ...selectionBounds }
    // @ts-expect-error maybe later
    this.snapshots = Object.fromEntries(
      selectedShapesArray.map(shape => {
        const bounds = { ...shape.bounds }
        const [cx, cy] = BoundsUtils.getBoundsCenter(bounds)
        return [
          shape.id,
          {
            props: shape.serialized,
            bounds,
            transformOrigin: [
              (cx - this.initialCommonBounds.minX) / this.initialCommonBounds.width,
              (cy - this.initialCommonBounds.minY) / this.initialCommonBounds.height,
            ],
            innerTransformOrigin: [
              (cx - initialInnerBounds.minX) / initialInnerBounds.width,
              (cy - initialInnerBounds.minY) / initialInnerBounds.height,
            ],
            isAspectRatioLocked:
              shape.props.isAspectRatioLocked ||
              Boolean(!shape.canChangeAspectRatio || shape.props.rotation),
          },
        ]
      })
    )
    selectedShapesArray.forEach(shape => {
      shape.onResizeStart?.({ isSingle: this.isSingle })
    })
  }

  onExit = () => {
    this.app.cursors.reset()
    this.snapshots = {}
    this.initialCommonBounds = {} as TLBounds
    this.selectionRotation = 0
    this.app.history.resume()
  }

  onPointerMove: TLEvents<S>['pointer'] = () => {
    const {
      inputs: { altKey, shiftKey, ctrlKey, originPoint, currentPoint },
    } = this.app
    const { handle, snapshots, initialCommonBounds } = this
    let delta = Vec.sub(currentPoint, originPoint)
    if (altKey) {
      delta = Vec.mul(delta, 2)
    }
    const firstShape = getFirstFromSet(this.app.selectedShapes)
    const useAspectRatioLock =
      shiftKey ||
      (this.isSingle &&
        (ctrlKey
          ? !('clipping' in firstShape.props)
          : !firstShape.canChangeAspectRatio || firstShape.props.isAspectRatioLocked))
    let nextBounds = BoundsUtils.getTransformedBoundingBox(
      initialCommonBounds,
      handle,
      delta,
      this.selectionRotation,
      useAspectRatioLock
    )
    if (altKey) {
      nextBounds = {
        ...nextBounds,
        ...BoundsUtils.centerBounds(nextBounds, BoundsUtils.getBoundsCenter(initialCommonBounds)),
      }
    }
    const { scaleX, scaleY } = nextBounds
    let resizeDimension: number
    switch (this.resizeType) {
      case 'horizontal-edge': {
        resizeDimension = Math.abs(scaleX)
        break
      }
      case 'vertical-edge': {
        resizeDimension = Math.abs(scaleY)
        break
      }
      case 'corner': {
        resizeDimension = Math.min(Math.abs(scaleX), Math.abs(scaleY))
      }
    }
    this.app.selectedShapes.forEach(shape => {
      const {
        isAspectRatioLocked,
        props: initialShapeProps,
        bounds: initialShapeBounds,
        transformOrigin,
        innerTransformOrigin,
      } = snapshots[shape.id]
      let relativeBounds = BoundsUtils.getRelativeTransformedBoundingBox(
        nextBounds,
        initialCommonBounds,
        initialShapeBounds,
        scaleX < 0,
        scaleY < 0
      )
      const canResizeAny = shape.canResize.some(r => r)
      // If the shape can't resize and it's the only shape selected, bail
      if (!(canResizeAny || shape.props.isSizeLocked) && this.isSingle) {
        return
      }
      let scale = [scaleX, scaleY]
      let rotation = initialShapeProps.rotation ?? 0
      let center = BoundsUtils.getBoundsCenter(relativeBounds)
      // If the shape can't flip, make sure that scale is [+,+]
      if (!shape.canFlip) {
        scale = Vec.abs(scale)
      }
      // If the shape can't scale, keep the shape's initial scale
      if (!shape.canScale) {
        scale = initialShapeProps.scale ?? [1, 1]
      }
      // If we're flipped and the shape is rotated, flip the rotation
      if ((rotation && scaleX < 0 && scaleY >= 0) || (scaleY < 0 && scaleX >= 0)) {
        rotation *= -1
      }
      // If the shape is aspect ratio locked or size locked...
      // FIXME: the following is buggy
      // if (isAspectRatioLocked || !canResizeAny || shape.props.isSizeLocked) {
      //   // console.log('aspect ratio locked', isAspectRatioLocked, canResizeAny, shape.props.isSizeLocked)
      //   relativeBounds.width = initialShapeBounds.width
      //   relativeBounds.height = initialShapeBounds.height
      //   if (isAspectRatioLocked) {
      //     // Scale the width and height to the longer dimension
      //     relativeBounds.width *= resizeDimension
      //     relativeBounds.height *= resizeDimension
      //   }
      //   // Find the center using the inner transform origin
      //   center = [
      //     nextBounds.minX +
      //       (scaleX < 0 ? 1 - innerTransformOrigin[0] : innerTransformOrigin[0]) *
      //         (nextBounds.width - relativeBounds.width) +
      //       relativeBounds.width / 2,
      //     nextBounds.minY +
      //       (scaleY < 0 ? 1 - innerTransformOrigin[1] : innerTransformOrigin[1]) *
      //         (nextBounds.height - relativeBounds.height) +
      //       relativeBounds.height / 2,
      //   ]
      //   // Position the bounds at the center
      //   relativeBounds = BoundsUtils.centerBounds(relativeBounds, center)
      // }

      if (this.app.settings.snapToGrid) {
        relativeBounds = BoundsUtils.snapBoundsToGrid(relativeBounds, GRID_SIZE)
      }

      shape.onResize(initialShapeProps, {
        center,
        rotation,
        scale,
        bounds: relativeBounds,
        type: handle,
        clip: ctrlKey,
        transformOrigin,
      })
    })
    this.updateCursor(scaleX, scaleY)
    this.app.viewport.panToPointWhenNearBounds(currentPoint)
  }

  onPointerUp: TLEvents<S>['pointer'] = () => {
    this.app.history.resume()
    this.app.persist()
    this.tool.transition('idle')
  }

  onKeyDown: TLEvents<S>['keyboard'] = (info, e) => {
    switch (e.key) {
      case 'Escape': {
        this.app.selectedShapes.forEach(shape => {
          shape.update({ ...this.snapshots[shape.id].props })
        })
        this.tool.transition('idle')
        break
      }
    }
  }

  private updateCursor(scaleX: number, scaleY: number) {
    const isFlippedX = scaleX < 0 && scaleY >= 0
    const isFlippedY = scaleY < 0 && scaleX >= 0
    switch (this.handle) {
      case TLResizeCorner.TopLeft:
      case TLResizeCorner.BottomRight: {
        if (isFlippedX || isFlippedY) {
          if (this.app.cursors.cursor === TLCursor.NwseResize) {
            this.app.cursors.setCursor(TLCursor.NeswResize, this.app.selectionBounds?.rotation)
          }
        } else {
          if (this.app.cursors.cursor === TLCursor.NeswResize) {
            this.app.cursors.setCursor(TLCursor.NwseResize, this.app.selectionBounds?.rotation)
          }
        }
        break
      }
      case TLResizeCorner.TopRight:
      case TLResizeCorner.BottomLeft: {
        if (isFlippedX || isFlippedY) {
          if (this.app.cursors.cursor === TLCursor.NeswResize) {
            this.app.cursors.setCursor(TLCursor.NwseResize, this.app.selectionBounds?.rotation)
          }
        } else {
          if (this.app.cursors.cursor === TLCursor.NwseResize) {
            this.app.cursors.setCursor(TLCursor.NeswResize, this.app.selectionBounds?.rotation)
          }
        }
        break
      }
    }
  }
}
