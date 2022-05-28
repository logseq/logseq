import { Decoration, GeomUtils, rng, SvgPathUtils, TLLineShapeProps } from '@tldraw/core'
import { intersectCircleCircle, intersectCircleLineSegment } from '@tldraw/intersect'
import Vec from '@tldraw/vec'
import getStroke from 'perfect-freehand'
import { EASINGS } from './constants'

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

export function getBendPoint(handles: TLLineShapeProps['handles'], bend: number) {
  const { start, end } = handles

  const dist = Vec.dist(start.point, end.point)

  const midPoint = Vec.med(start.point, end.point)

  const bendDist = (dist / 2) * bend

  const u = Vec.uni(Vec.vec(start.point, end.point))

  const point = Vec.toFixed(
    Math.abs(bendDist) < 10 ? midPoint : Vec.add(midPoint, Vec.mul(Vec.per(u), bendDist))
  )

  return point
}

export function renderFreehandArrowShaft(
  id: string,
  start: number[],
  end: number[],
  decorationStart: Decoration | undefined,
  decorationEnd: Decoration | undefined
) {
  const getRandom = rng(id)
  const strokeWidth = 2
  const startPoint = decorationStart ? Vec.nudge(start, end, strokeWidth) : start
  const endPoint = decorationEnd ? Vec.nudge(end, start, strokeWidth) : end
  const stroke = getStroke([startPoint, endPoint], {
    size: strokeWidth,
    thinning: 0.618 + getRandom() * 0.2,
    easing: EASINGS.easeOutQuad,
    simulatePressure: true,
    streamline: 0,
    last: true,
  })
  return SvgPathUtils.getSvgPathFromStroke(stroke)
}

export function renderCurvedFreehandArrowShaft(
  id: string,
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
  const strokeWidth = 2
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

export function getCurvedArrowHeadPath(
  A: number[],
  r1: number,
  C: number[],
  r2: number,
  sweep: boolean
) {
  const { left, right } = getCurvedArrowHeadPoints(A, r1, C, r2, sweep)
  return `M ${left} L ${A} ${right}`
}

export function getStraightArrowHeadPath(A: number[], B: number[], r: number) {
  const { left, right } = getStraightArrowHeadPoints(A, B, r)
  return `M ${left} L ${A} ${right}`
}

export function getArrowPath(
  start: number[],
  end: number[],
  decorationStart: Decoration | undefined,
  decorationEnd: Decoration | undefined
) {
  const strokeWidth = 2
  const arrowDist = Vec.dist(start, end)
  const arrowHeadLength = Math.min(arrowDist / 3, strokeWidth * 8)
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

export function getArcPoints(start: number[], bend: number[], end: number[]) {
  if (Vec.dist2(bend, Vec.med(start, end)) <= 4) return [start, end]
  // The arc is curved; calculate twenty points along the arc
  const points: number[][] = []
  const circle = getCtp(start, bend, end)
  const center = [circle[0], circle[1]]
  const radius = circle[2]
  const startAngle = Vec.angle(center, start)
  const endAngle = Vec.angle(center, end)
  for (let i = 1 / 20; i < 1; i += 1 / 20) {
    const angle = GeomUtils.lerpAngles(startAngle, endAngle, i)
    points.push(Vec.nudgeAtAngle(center, angle, radius))
  }
  return points
}

export function isAngleBetween(a: number, b: number, c: number): boolean {
  if (c === a || c === b) return true
  const PI2 = Math.PI * 2
  const AB = (b - a + PI2) % PI2
  const AC = (c - a + PI2) % PI2
  return AB <= Math.PI !== AC > AB
}

export function getArcLength(C: number[], r: number, A: number[], B: number[]): number {
  const sweep = GeomUtils.getSweep(C, A, B)
  return r * (2 * Math.PI) * (sweep / (2 * Math.PI))
}
