import type { Shape } from '.'

export interface CustomStyleProps {
  stroke: string
  fill: string
  noFill: boolean
  strokeWidth: number
  strokeType: 'dashed' | 'line'
  opacity: number
}

export function withClampedStyles<P>(self: Shape, props: P & Partial<CustomStyleProps>) {
  if (props.strokeWidth !== undefined) props.strokeWidth = Math.max(props.strokeWidth, 1)
  if (props.opacity !== undefined) props.opacity = Math.min(1, Math.max(props.opacity, 0))

  return props
}
