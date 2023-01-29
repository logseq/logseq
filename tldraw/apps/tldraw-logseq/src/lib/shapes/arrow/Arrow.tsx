import type { Decoration } from '@tldraw/core'
import Vec from '@tldraw/vec'
import * as React from 'react'
import { Arrowhead } from './ArrowHead'
import { getStraightArrowHeadPoints } from './arrowHelpers'
import type { SizeLevel } from '../'

interface ShapeStyles {
  stroke: string
  strokeWidth: number
  strokeType: 'line' | 'dashed'
  fill?: string
}

interface ArrowSvgProps {
  style: ShapeStyles
  start: number[]
  end: number[]
  decorationStart: Decoration | undefined
  decorationEnd: Decoration | undefined
  scaleLevel?: SizeLevel
}

const levelToScale = {
  xs: 10,
  sm: 16,
  md: 20,
  lg: 32,
  xl: 48,
  xxl: 60,
}

export const Arrow = React.memo(function StraightArrow({
  style,
  start,
  end,
  decorationStart,
  decorationEnd,
  scaleLevel,
}: ArrowSvgProps) {
  const arrowDist = Vec.dist(start, end)
  if (arrowDist < 2) return null
  const { strokeWidth } = style
  const sw = 1 + (strokeWidth * levelToScale[scaleLevel ?? 'md']) / 10
  // Path between start and end points
  const path = 'M' + Vec.toFixed(start) + 'L' + Vec.toFixed(end)
  // Arrowheads
  const arrowHeadLength = Math.min(arrowDist / 3, strokeWidth * levelToScale[scaleLevel ?? 'md'])
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
