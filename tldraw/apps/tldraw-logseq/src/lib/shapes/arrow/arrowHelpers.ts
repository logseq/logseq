import type { Decoration } from '@tldraw/core'
import { GeomUtils, SvgPathUtils, rng } from '@tldraw/core'
import { intersectCircleCircle, intersectCircleLineSegment } from '@tldraw/intersect'
import getStroke from 'perfect-freehand'
import { EASINGS } from './constants'
import Vec from '@tldraw/vec'

export interface ShapeStyles {
  stroke: string
  strokeWidth: number
  strokeType: 'line' | 'dashed'
  fill: string
}

export function getArrowArcPath(start: number[], end: number[], circle: number[], bend: number) {
  return [
    'M',
    start[0],
    start[1],
    'A',
    circle[2],
    circle[2],
    0,
    0,
    bend < 0 ? 0 : 1,
    end[0],
    end[1],
  ].join(' ')
}

export function getStraightArrowHeadPoints(A: number[], B: number[], r: number) {
  const ints = intersectCircleLineSegment(A, r, A, B).points
  if (!ints) {
    console.warn('Could not find an intersection for the arrow head.')
    return { left: A, right: A }
  }
  const int = ints[0]
  const left = int ? Vec.rotWith(int, A, Math.PI / 6) : A
  const right = int ? Vec.rotWith(int, A, -Math.PI / 6) : A
  return { left, right }
}

export function getStraightArrowHeadPath(A: number[], B: number[], r: number) {
  const { left, right } = getStraightArrowHeadPoints(A, B, r)
  return `M ${left} L ${A} ${right}`
}

export function getArrowPath(
  style: {
    strokeWidth: number
  },
  start: number[],
  end: number[],
  decorationStart: Decoration | undefined,
  decorationEnd: Decoration | undefined
) {
  const strokeWidth = style.strokeWidth
  const arrowDist = Vec.dist(start, end)
  const arrowHeadLength = Math.min(arrowDist / 3, strokeWidth * 16)
  const path: (string | number)[] = []
  path.push(`M ${start} L ${end}`)
  if (decorationStart) {
    path.push(getStraightArrowHeadPath(start, end, arrowHeadLength))
  }
  if (decorationEnd) {
    path.push(getStraightArrowHeadPath(end, start, arrowHeadLength))
  }
  return path.join(' ')
}

export function getCtp(start: number[], bend: number[], end: number[]) {
  return GeomUtils.circleFromThreePoints(start, end, bend)
}

export function getCurvedArrowHeadPoints(
  A: number[],
  r1: number,
  C: number[],
  r2: number,
  sweep: boolean
) {
  const ints = intersectCircleCircle(A, r1 * 0.618, C, r2).points
  if (!ints) {
    console.warn('Could not find an intersection for the arrow head.')
    return { left: A, right: A }
  }
  const int = sweep ? ints[0] : ints[1]
  const left = int ? Vec.nudge(Vec.rotWith(int, A, Math.PI / 6), A, r1 * -0.382) : A
  const right = int ? Vec.nudge(Vec.rotWith(int, A, -Math.PI / 6), A, r1 * -0.382) : A
  return { left, right }
}

export function renderCurvedFreehandArrowShaft(
  id: string,
  style: ShapeStyles,
  start: number[],
  end: number[],
  decorationStart: Decoration | undefined,
  decorationEnd: Decoration | undefined,
  center: number[],
  radius: number,
  length: number,
  easing: (t: number) => number
) {
  const getRandom = rng(id)
  const strokeWidth = 1
  const startPoint = decorationStart ? Vec.rotWith(start, center, strokeWidth / length) : start
  const endPoint = decorationEnd ? Vec.rotWith(end, center, -(strokeWidth / length)) : end
  const startAngle = Vec.angle(center, startPoint)
  const endAngle = Vec.angle(center, endPoint)
  const points: number[][] = []
  const count = 8 + Math.floor((Math.abs(length) / 20) * 1 + getRandom() / 2)
  for (let i = 0; i < count; i++) {
    const t = easing(i / count)
    const angle = GeomUtils.lerpAngles(startAngle, endAngle, t)
    points.push(Vec.toFixed(Vec.nudgeAtAngle(center, angle, radius)))
  }
  const stroke = getStroke([startPoint, ...points, endPoint], {
    size: 1 + strokeWidth,
    thinning: 0.618 + getRandom() * 0.2,
    easing: EASINGS.easeOutQuad,
    simulatePressure: false,
    streamline: 0,
    last: true,
  })
  return SvgPathUtils.getSvgPathFromStroke(stroke)
}

export function getArcLength(C: number[], r: number, A: number[], B: number[]): number {
  const sweep = GeomUtils.getSweep(C, A, B)
  return r * (2 * Math.PI) * (sweep / (2 * Math.PI))
}
