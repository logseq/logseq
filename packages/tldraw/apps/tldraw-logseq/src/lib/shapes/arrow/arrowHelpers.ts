import type { Decoration } from '@tldraw/core'
import { intersectCircleLineSegment } from '@tldraw/intersect'
import Vec from '@tldraw/vec'

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
