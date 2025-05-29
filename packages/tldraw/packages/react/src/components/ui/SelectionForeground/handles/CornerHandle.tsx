import { TLResizeCorner } from '@tldraw/core'
import { observer } from 'mobx-react-lite'
import { useBoundsEvents } from '../../../../hooks'

const cornerBgClassnames = {
  [TLResizeCorner.TopLeft]: 'tl-cursor-nwse',
  [TLResizeCorner.TopRight]: 'tl-cursor-nesw',
  [TLResizeCorner.BottomRight]: 'tl-cursor-nwse',
  [TLResizeCorner.BottomLeft]: 'tl-cursor-nesw',
}

interface CornerHandleProps {
  cx: number
  cy: number
  size: number
  targetSize: number
  corner: TLResizeCorner
  isHidden?: boolean
}

export const CornerHandle = observer(function CornerHandle({
  cx,
  cy,
  size,
  targetSize,
  corner,
  isHidden,
}: CornerHandleProps): JSX.Element {
  const events = useBoundsEvents(corner)

  return (
    <g opacity={isHidden ? 0 : 1} {...events}>
      <rect
        className={'tl-transparent ' + (isHidden ? '' : cornerBgClassnames[corner])}
        aria-label={`${corner} target`}
        x={cx - targetSize * 1.25}
        y={cy - targetSize * 1.25}
        width={targetSize * 2.5}
        height={targetSize * 2.5}
        pointerEvents={isHidden ? 'none' : 'all'}
      />
      <rect
        className="tl-corner-handle"
        aria-label={`${corner} handle`}
        x={cx - size / 2}
        y={cy - size / 2}
        width={size}
        height={size}
        pointerEvents="none"
      />
    </g>
  )
})
