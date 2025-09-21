import { TLDotShape, TLDotShapeProps } from '@tldraw/core'
import { SVGContainer, TLComponentProps } from '@tldraw/react'
import { observer } from 'mobx-react-lite'
import { CustomStyleProps, withClampedStyles } from './style-props'

export interface DotShapeProps extends TLDotShapeProps, CustomStyleProps {
  type: 'dot'
}

export class DotShape extends TLDotShape<DotShapeProps> {
  static id = 'dot'

  static defaultProps: DotShapeProps = {
    id: 'dot',
    parentId: 'page',
    type: 'dot',
    point: [0, 0],
    radius: 4,
    stroke: '#000000',
    fill: 'var(--ls-secondary-background-color)',
    noFill: false,
    strokeType: 'line',
    strokeWidth: 2,
    opacity: 1,
  }

  ReactComponent = observer(({ events, isErasing }: TLComponentProps) => {
    const { radius, stroke, fill, strokeWidth, opacity } = this.props
    return (
      <SVGContainer {...events} opacity={isErasing ? 0.2 : opacity}>
        <circle className="tl-hitarea-fill" cx={radius} cy={radius} r={radius} />
        <circle
          cx={radius}
          cy={radius}
          r={radius}
          stroke={stroke}
          fill={fill}
          strokeWidth={strokeWidth}
          pointerEvents="none"
        />
      </SVGContainer>
    )
  })

  ReactIndicator = observer(() => {
    const { radius, isLocked } = this.props
    return (
      <circle
        cx={radius}
        cy={radius}
        r={radius}
        pointerEvents="all"
        strokeDasharray={isLocked ? '8 2' : 'undefined'}
      />
    )
  })

  validateProps = (props: Partial<DotShapeProps>) => {
    if (props.radius !== undefined) props.radius = Math.max(props.radius, 1)
    return withClampedStyles(this, props)
  }
}
