/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react'
import { TLEllipseShapeProps, TLEllipseShape } from '@tldraw/core'
import { SVGContainer, TLComponentProps } from '@tldraw/react'
import { observer } from 'mobx-react-lite'
import { CustomStyleProps, withClampedStyles } from './style-props'

export interface EllipseShapeProps extends TLEllipseShapeProps, CustomStyleProps {
  type: 'ellipse'
  size: number[]
}

export class EllipseShape extends TLEllipseShape<EllipseShapeProps> {
  static id = 'ellipse'

  static defaultProps: EllipseShapeProps = {
    id: 'ellipse',
    parentId: 'page',
    type: 'ellipse',
    point: [0, 0],
    size: [100, 100],
    stroke: '#000000',
    fill: '#ffffff',
    strokeWidth: 2,
    opacity: 1,
  }

  ReactComponent = observer(({ isSelected, isErasing, events }: TLComponentProps) => {
    const {
      size: [w, h],
      stroke,
      fill,
      strokeWidth,
      opacity,
    } = this.props
    return (
      <SVGContainer {...events} opacity={isErasing ? 0.2 : opacity}>
        <ellipse
          className={isSelected ? 'tl-hitarea-fill' : 'tl-hitarea-stroke'}
          cx={w / 2}
          cy={h / 2}
          rx={Math.max(0.01, (w - strokeWidth) / 2)}
          ry={Math.max(0.01, (h - strokeWidth) / 2)}
        />
        <ellipse
          cx={w / 2}
          cy={h / 2}
          rx={Math.max(0.01, (w - strokeWidth) / 2)}
          ry={Math.max(0.01, (h - strokeWidth) / 2)}
          strokeWidth={strokeWidth}
          stroke={stroke}
          fill={fill}
        />
      </SVGContainer>
    )
  })

  ReactIndicator = observer(() => {
    const {
      size: [w, h],
    } = this.props
    return (
      <ellipse cx={w / 2} cy={h / 2} rx={w / 2} ry={h / 2} strokeWidth={2} fill="transparent" />
    )
  })

  validateProps = (props: Partial<EllipseShapeProps>) => {
    if (props.size !== undefined) {
      props.size[0] = Math.max(props.size[0], 1)
      props.size[1] = Math.max(props.size[1], 1)
    }
    return withClampedStyles(props)
  }
}
