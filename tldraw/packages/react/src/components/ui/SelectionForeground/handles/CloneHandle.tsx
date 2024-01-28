import { observer } from 'mobx-react-lite'
import type { TLCloneDirection, } from '@tldraw/core'
import { useApp } from '../../../../hooks'
interface CloneHandleProps {
    cx: number
    cy: number
    size: number
    direction: TLCloneDirection
    isHidden?: boolean
}

export const CloneHandle = observer(function CloneHandle({
    cx,
    cy,
    size,
    direction,
    isHidden,
}: CloneHandleProps): JSX.Element {
    const app = useApp()

    return (
        <g className="tl-clone-handle" opacity={isHidden ? 0 : 1}>
            <circle
                aria-label={`${direction} handle`}
                pointerEvents="all"
                onPointerDown={(e) => app.api.clone(direction)}
                cx={cx}
                cy={cy}
                r={size}
            />
            <line 
                x1={cx - size / 2}
                y1={cy}
                x2={cx + size / 2}
                y2={cy} 
            />
            <line 
                x1={cx}
                y1={cy - size / 2}
                x2={cx}
                y2={cy + size / 2} 
            />
        </g>
    )
})
