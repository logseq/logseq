import { TLResizeCorner, TLResizeEdge } from '@tldraw/core'
import { observer } from 'mobx-react-lite'
import { SVGContainer } from '~components'
import type { TLReactShape } from '~lib'
import type { TLSelectionComponentProps } from '~types'
import { CornerHandle, EdgeHandle } from './handles'

export const SelectionForeground = observer(function SelectionForeground<S extends TLReactShape>({
  bounds,
  zoom,
  showResizeHandles,
  shapes,
}: TLSelectionComponentProps<S>) {
  const { width, height } = bounds

  const size = 8 / zoom
  const targetSize = 6 / zoom

  const canResize = shapes.length === 1 ? shapes[0].canResize : [true, true]

  return (
    <SVGContainer>
      <rect
        className="tl-bounds-fg"
        width={Math.max(width, 1)}
        height={Math.max(height, 1)}
        pointerEvents="none"
      />
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
      {/* {showRotateHandles && (
        <RotateHandle cx={width / 2} cy={0 - targetSize * 2} size={size} targetSize={targetSize} />
      )} */}
    </SVGContainer>
  )
})
