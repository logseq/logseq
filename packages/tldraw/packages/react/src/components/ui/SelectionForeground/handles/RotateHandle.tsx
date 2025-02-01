import { observer } from 'mobx-react-lite'
import { useBoundsEvents } from '../../../../hooks'

interface RotateHandleProps {
  cx: number
  cy: number
  size: number
  targetSize: number
  isHidden?: boolean
}

export const RotateHandle = observer<RotateHandleProps>(function RotateHandle({
  cx,
  cy,
  size,
  targetSize,
  isHidden,
}): JSX.Element {
  const events = useBoundsEvents('rotate')

  return (
    <g opacity={isHidden ? 0 : 1} {...events}>
      <circle
        className="tl-transparent "
        aria-label="rotate target"
        cx={cx}
        cy={cy}
        r={targetSize}
        pointerEvents={isHidden ? 'none' : 'all'}
      />
      <circle
        className="tl-rotate-handle"
        aria-label="rotate handle"
        cx={cx}
        cy={cy}
        r={size / 2}
        pointerEvents="none"
      />
    </g>
  )
})
