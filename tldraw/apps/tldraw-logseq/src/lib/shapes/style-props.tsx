import { darken } from 'polished'
import type { Shape } from '.'
import { withFillShapes } from '../../components/ContextBar/contextBarActionFactory'
import { isBuiltInColor } from '@tldraw/core'
export interface CustomStyleProps {
  noFill: boolean
  fill: string
  stroke: string
  strokeWidth: number
  strokeType: 'dashed' | 'line'
  opacity: number
}

export function withClampedStyles<P>(self: Shape, props: P & Partial<CustomStyleProps>) {
  if (props.strokeWidth !== undefined) props.strokeWidth = Math.max(props.strokeWidth, 1)
  if (props.opacity !== undefined) props.opacity = Math.min(1, Math.max(props.opacity, 0))

  let fill = props.fill ?? (self.props as any).fill
  if (
    fill !== undefined &&
    !isBuiltInColor(fill) &&
    fill !== 'var(--ls-secondary-background-color)' &&
    !props.noFill &&
    withFillShapes.includes(self.props.type)
  ) {
    const strokeColor = darken(0.3, fill)
    props.stroke = strokeColor
  }

  return props
}
