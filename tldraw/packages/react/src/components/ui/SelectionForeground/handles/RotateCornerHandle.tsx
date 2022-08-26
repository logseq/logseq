import { observer } from 'mobx-react-lite'
import * as React from 'react'
import type { TLRotateCorner } from '@tldraw/core'
import { useBoundsEvents } from '../../../../hooks'

interface RotateCornerHandleProps {
  cx: number
  cy: number
  targetSize: number
  corner: TLRotateCorner
  isHidden?: boolean
}

export const RotateCornerHandle = observer(function RotateCornerHandle({
  cx,
  cy,
  targetSize,
  corner,
  isHidden,
}: RotateCornerHandleProps): JSX.Element {
  const events = useBoundsEvents(corner)

  return (
    <g opacity={isHidden ? 0 : 1} {...events}>
      <rect
        className="tl-transparent"
        aria-label={`${corner} target`}
        x={cx - targetSize * 2.5}
        y={cy - targetSize * 2.5}
        width={targetSize * 3}
        height={targetSize * 3}
        pointerEvents={isHidden ? 'none' : 'all'}
      />
    </g>
  )
})
