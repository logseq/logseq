import type { TLEventMap } from '../../../types'
import type { TLShape } from '../../shapes'
import type { TLApp } from '../../TLApp'
import { TLTool } from '../../TLTool'
import {
  IdleState,
  BrushingState,
  ContextMenuState,
  PointingCanvasState,
  PointingShapeState,
  PointingShapeBehindBoundsState,
  PointingBoundsBackgroundState,
  PointingSelectedShapeState,
  PointingResizeHandleState,
  PointingRotateHandleState,
  PointingHandleState,
  TranslatingHandleState,
  TranslatingState,
  ResizingState,
  RotatingState,
  PinchingState,
  HoveringSelectionHandleState,
  EditingShapeState,
  PointingMinimapState,
} from './states'

export class TLSelectTool<
  S extends TLShape = TLShape,
  K extends TLEventMap = TLEventMap,
  R extends TLApp<S, K> = TLApp<S, K>
> extends TLTool<S, K, R> {
  static id = 'select'

  static initial = 'idle'

  static shortcut = 'whiteboard/select'

  static states = [
    IdleState,
    BrushingState,
    ContextMenuState,
    PointingCanvasState,
    PointingShapeState,
    PointingShapeBehindBoundsState,
    PointingSelectedShapeState,
    PointingBoundsBackgroundState,
    HoveringSelectionHandleState,
    PointingResizeHandleState,
    PointingRotateHandleState,
    PointingMinimapState,
    PointingHandleState,
    TranslatingHandleState,
    TranslatingState,
    ResizingState,
    RotatingState,
    RotatingState,
    PinchingState,
    EditingShapeState,
  ]

  returnTo = ''

  onEnter = (info: { fromId: string; returnTo: string } & any) => {
    this.returnTo = info?.returnTo
  }
}
