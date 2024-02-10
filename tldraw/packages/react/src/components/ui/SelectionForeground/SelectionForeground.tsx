import { TLCloneDirection, TLResizeCorner, TLResizeEdge, TLRotateCorner } from '@tldraw/core'
import { observer } from 'mobx-react-lite'
import { useApp } from '../../../hooks'
import type { TLReactShape } from '../../../lib'
import type { TLSelectionComponentProps } from '../../../types'
import { SVGContainer } from '../../SVGContainer'
import { CornerHandle, EdgeHandle, CloneHandle } from './handles'
import { RotateCornerHandle } from './handles/RotateCornerHandle'

export const SelectionForeground = observer(function SelectionForeground<S extends TLReactShape>({
  bounds,
  showResizeHandles,
  showRotateHandles,
  showCloneHandles,
  shapes,
}: TLSelectionComponentProps<S>) {
  const app = useApp()
  let { width, height } = bounds
  const zoom = app.viewport.camera.zoom

  const size = 8 / zoom
  const targetSize = 6 / zoom
  const clonePadding = 30 / zoom
  const cloneHandleSize = size * 2

  const canResize = shapes.length === 1 ? shapes[0].canResize : [true, true]

  // @ts-expect-error ???
  const borderRadius = app.editingShape?.props['borderRadius'] ?? 0

  return (
    <>
      {shapes.length > 0 && (
        <SVGContainer>
          {!app.editingShape && (
            <rect
              className="tl-bounds-fg"
              width={Math.max(width, 1)}
              height={Math.max(height, 1)}
              rx={borderRadius}
              ry={borderRadius}
              pointerEvents="none"
            />
          )}
          <EdgeHandle
            x={targetSize * 2}
            y={0}
            width={width - targetSize * 4}
            height={0}
            targetSize={targetSize}
            edge={TLResizeEdge.Top}
            disabled={!canResize[1]}
            isHidden={!showResizeHandles}
          />
          <EdgeHandle
            x={width}
            y={targetSize * 2}
            width={0}
            height={height - targetSize * 4}
            targetSize={targetSize}
            edge={TLResizeEdge.Right}
            disabled={!canResize[0]}
            isHidden={!showResizeHandles}
          />
          <EdgeHandle
            x={targetSize * 2}
            y={height}
            width={width - targetSize * 4}
            height={0}
            targetSize={targetSize}
            edge={TLResizeEdge.Bottom}
            disabled={!canResize[1]}
            isHidden={!showResizeHandles}
          />
          <EdgeHandle
            x={0}
            y={targetSize * 2}
            width={0}
            height={height - targetSize * 4}
            targetSize={targetSize}
            edge={TLResizeEdge.Left}
            disabled={!canResize[0]}
            isHidden={!showResizeHandles}
          />
          <RotateCornerHandle
            cx={0}
            cy={0}
            targetSize={targetSize}
            corner={TLRotateCorner.TopLeft}
            isHidden={!showRotateHandles}
          />
          <RotateCornerHandle
            cx={width + targetSize * 2}
            cy={0}
            targetSize={targetSize}
            corner={TLRotateCorner.TopRight}
            isHidden={!showRotateHandles}
          />
          <RotateCornerHandle
            cx={width + targetSize * 2}
            cy={height + targetSize * 2}
            targetSize={targetSize}
            corner={TLRotateCorner.BottomRight}
            isHidden={!showRotateHandles}
          />
          <RotateCornerHandle
            cx={0}
            cy={height + targetSize * 2}
            targetSize={targetSize}
            corner={TLRotateCorner.BottomLeft}
            isHidden={!showRotateHandles}
          />
          <CloneHandle
            cx={- clonePadding}
            cy={height / 2}
            size={cloneHandleSize}
            direction={TLCloneDirection.Left}
            isHidden={!showCloneHandles}
          />
          <CloneHandle
            cx={width + clonePadding}
            cy={height / 2}
            size={cloneHandleSize}
            direction={TLCloneDirection.Right}
            isHidden={!showCloneHandles}
          />
          <CloneHandle
            cx={width / 2}
            cy={height + clonePadding}
            size={cloneHandleSize}
            direction={TLCloneDirection.Down}
            isHidden={!showCloneHandles}
          />
          {canResize?.every(r => r) && (
            <>
              <CornerHandle
                cx={0}
                cy={0}
                size={size}
                targetSize={targetSize}
                corner={TLResizeCorner.TopLeft}
                isHidden={!showResizeHandles}
              />
              <CornerHandle
                cx={width}
                cy={0}
                size={size}
                targetSize={targetSize}
                corner={TLResizeCorner.TopRight}
                isHidden={!showResizeHandles}
              />
              <CornerHandle
                cx={width}
                cy={height}
                size={size}
                targetSize={targetSize}
                corner={TLResizeCorner.BottomRight}
                isHidden={!showResizeHandles}
              />
              <CornerHandle
                cx={0}
                cy={height}
                size={size}
                targetSize={targetSize}
                corner={TLResizeCorner.BottomLeft}
                isHidden={!showResizeHandles}
              />
            </>
          )}
        </SVGContainer>
      )}
    </>
  )
})
