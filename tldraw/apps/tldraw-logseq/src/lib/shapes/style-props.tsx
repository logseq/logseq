import { darken } from 'polished'
import { noStrokeShapes } from '~components/ContextBar/contextBarActionFactory'
import type { Shape } from '~lib'

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

  const fill = props.fill ?? (self.props as any).fill
  if (fill !== undefined) {
    const strokeOnly = noStrokeShapes.includes(self.props.type)
    const strokeColor = darken(0.3, fill)
    props.stroke = strokeOnly ? fill : strokeColor
  }

  return props
}
