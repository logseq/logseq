import { observer } from 'mobx-react-lite'
import type { TLCloneDirection } from '@tldraw/core'
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
        <circle
            pointerEvents="all"
            onPointerDown={() => app.api.clone(direction)}
            opacity={isHidden ? 0 : 1}
            className="tl-clone-handle"
            aria-label={`${direction} handle`}
            cx={cx}
            cy={cy}
            r={size}
        />
    )
})
