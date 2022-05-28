import type { Decoration } from '@tldraw/core'
import Vec from '@tldraw/vec'
import * as React from 'react'
import { Arrowhead } from './ArrowHead'
import { getStraightArrowHeadPoints } from './arrowHelpers'

interface ShapeStyles {
  stroke: string
  strokeWidth: number
  fill: string
}

interface ArrowSvgProps {
  style: ShapeStyles
  start: number[]
  end: number[]
  decorationStart: Decoration | undefined
  decorationEnd: Decoration | undefined
}

export const StraightArrow = React.memo(function StraightArrow({
  style,
  start,
  end,
  decorationStart,
  decorationEnd,
}: ArrowSvgProps) {
  const arrowDist = Vec.dist(start, end)
  if (arrowDist < 2) return null
  const { strokeWidth } = style
  const sw = 1 + strokeWidth * 1.618
  // Path between start and end points
  const path = 'M' + Vec.toFixed(start) + 'L' + Vec.toFixed(end)
  // Arrowheads
  const arrowHeadLength = Math.min(arrowDist / 3, strokeWidth * 8)
  const startArrowHead = decorationStart
    ? getStraightArrowHeadPoints(start, end, arrowHeadLength)
    : null
  const endArrowHead = decorationEnd
    ? getStraightArrowHeadPoints(end, start, arrowHeadLength)
    : null
  return (
    <>
      <path className="tl-stroke-hitarea" d={path} />
      <path
        d={path}
        fill={style.stroke}
        strokeWidth={sw}
        stroke={style.stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        pointerEvents="stroke"
      />
      {startArrowHead && (
        <Arrowhead
          left={startArrowHead.left}
          middle={start}
          right={startArrowHead.right}
          stroke={style.stroke}
          strokeWidth={sw}
        />
      )}
      {endArrowHead && (
        <Arrowhead
          left={endArrowHead.left}
          middle={end}
          right={endArrowHead.right}
          stroke={style.stroke}
          strokeWidth={sw}
        />
      )}
    </>
  )
})
