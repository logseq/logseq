/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react'
import { TLPolygonShape, TLPolygonShapeProps } from '@tldraw/core'
import { SVGContainer, TLComponentProps } from '@tldraw/react'
import { observer } from 'mobx-react-lite'
import { CustomStyleProps, withClampedStyles } from './style-props'

interface PolygonShapeProps extends TLPolygonShapeProps, CustomStyleProps {
  type: 'polygon'
}

export class PolygonShape extends TLPolygonShape<PolygonShapeProps> {
  static id = 'polygon'

  static defaultProps: PolygonShapeProps = {
    id: 'polygon',
    parentId: 'page',
    type: 'polygon',
    point: [0, 0],
    size: [100, 100],
    sides: 5,
    ratio: 1,
    isFlippedY: false,
    stroke: '#000000',
    fill: '#ffffff',
    strokeWidth: 2,
    opacity: 1,
  }

  ReactComponent = observer(({ events, isErasing, isSelected }: TLComponentProps) => {
    const {
      offset: [x, y],
      props: { stroke, fill, strokeWidth, opacity },
    } = this
    const path = this.getVertices(strokeWidth / 2).join()
    return (
      <SVGContainer {...events} opacity={isErasing ? 0.2 : opacity}>
        <g transform={`translate(${x}, ${y})`}>
          <polygon className={isSelected ? 'tl-hitarea-fill' : 'tl-hitarea-stroke'} points={path} />
          <polygon
            points={path}
            stroke={stroke}
            fill={fill}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        </g>
      </SVGContainer>
    )
  })

  ReactIndicator = observer(() => {
    const {
      offset: [x, y],
      props: { strokeWidth },
    } = this
    return (
      <polygon
        transform={`translate(${x}, ${y})`}
        points={this.getVertices(strokeWidth / 2).join()}
      />
    )
  })

  validateProps = (props: Partial<PolygonShapeProps>) => {
    if (props.sides !== undefined) props.sides = Math.max(props.sides, 3)
    return withClampedStyles(props)
  }
}
