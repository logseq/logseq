/* eslint-disable @typescript-eslint/no-unused-vars */
import Vec from '@tldraw/vec'
import { BoundsUtils } from '@tldraw/core'
import { intersectRayLineSegment } from '@tldraw/intersect'
import { observer } from 'mobx-react-lite'
import * as React from 'react'
import { useRendererContext } from '../../../hooks'
import type { TLReactShape } from '../../../lib'
import type { TLDirectionIndicatorProps } from '../../../types'

export const DirectionIndicator = observer(function DirectionIndicator<
  S extends TLReactShape = TLReactShape
>({ direction }: TLDirectionIndicatorProps<S>) {
  const {
    viewport: { bounds },
  } = useRendererContext()
  const rIndicator = React.useRef<HTMLDivElement>(null)
  React.useLayoutEffect(() => {
    const elm = rIndicator.current
    if (!elm) return
    // Find the center of the bounds, offset by its point
    const center = [bounds.width / 2, bounds.height / 2]
    const insetBoundSides = BoundsUtils.getRectangleSides(
      [12, 12],
      [bounds.width - 24, bounds.height - 24]
    )
    for (const [_, [A, B]] of insetBoundSides) {
      const int = intersectRayLineSegment(center, direction, A, B)
      if (!int.didIntersect) continue
      const point = int.points[0]
      elm.style.transform = `translate(${point[0] - 6}px,${point[1] - 6}px) rotate(${Vec.toAngle(
        direction
      )}rad)`
    }
  }, [direction, bounds])
  return (
    <div ref={rIndicator} className="tl-direction-indicator" data-html2canvas-ignore="true">
      <svg height={12} width={12}>
        <polygon points="0,0 12,6 0,12" />
      </svg>
    </div>
  )
})
