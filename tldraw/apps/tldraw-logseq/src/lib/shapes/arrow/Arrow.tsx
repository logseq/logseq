import type { Decoration } from '@tldraw/core'
import { rng } from '@tldraw/core'
import { EASINGS } from './constants'
import Vec from '@tldraw/vec'
import * as React from 'react'
import { Arrowhead } from './ArrowHead'
import {
  getArcLength,
  getArrowArcPath,
  getCtp,
  renderCurvedFreehandArrowShaft,
  getCurvedArrowHeadPoints,
  ShapeStyles,
} from './arrowHelpers'

interface ArrowSvgProps {
  id: string
  style: ShapeStyles
  start: number[]
  bend: number[]
  end: number[]
  arrowBend: number
  decorationStart: Decoration | undefined
  decorationEnd: Decoration | undefined
  isDraw: boolean
}

export const Arrow = React.memo(function CurvedArrow({
  id,
  style,
  start,
  bend,
  end,
  arrowBend,
  decorationStart,
  decorationEnd,
  isDraw,
}: ArrowSvgProps) {
  const arrowDist = Vec.dist(start, end)
  if (arrowDist < 2) return null
  const { strokeWidth } = style
  const sw = 1 + strokeWidth * 1.618
  // Calculate a path as a segment of a circle passing through the three points start, bend, and end
  const circle = getCtp(start, bend, end)
  const center = [circle[0], circle[1]]
  const radius = circle[2]
  const length = getArcLength(center, radius, start, end)
  const getRandom = rng(id)
  const easing = EASINGS[getRandom() > 0 ? 'easeInOutSine' : 'easeInOutCubic']
  // Path between start and end points
  const path = isDraw
    ? renderCurvedFreehandArrowShaft(
        id,
        style,
        start,
        end,
        decorationStart,
        decorationEnd,
        center,
        radius,
        length,
        easing
      )
    : getArrowArcPath(start, end, circle, arrowBend)
  // Arrowheads
  const arrowHeadLength = Math.min(arrowDist / 3, strokeWidth * 8)
  const startArrowHead = decorationStart
    ? getCurvedArrowHeadPoints(start, arrowHeadLength, center, radius, length < 0)
    : null
  const endArrowHead = decorationEnd
    ? getCurvedArrowHeadPoints(end, arrowHeadLength, center, radius, length >= 0)
    : null
  return (
    <>
      <path className="tl-stroke-hitarea" d={path} />
      <path
        d={path}
        strokeWidth={sw}
        stroke={style.stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={style.strokeType === 'dashed' ? '8 4' : undefined}
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
