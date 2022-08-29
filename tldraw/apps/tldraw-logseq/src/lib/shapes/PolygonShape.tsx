/* eslint-disable @typescript-eslint/no-explicit-any */
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
    sides: 3,
    ratio: 1,
    isFlippedY: false,
    stroke: '#000000',
    fill: 'var(--ls-secondary-background-color)',
    noFill: false,
    strokeType: 'line',
    strokeWidth: 2,
    opacity: 1,
  }

  ReactComponent = observer(({ events, isErasing, isSelected }: TLComponentProps) => {
    const {
      offset: [x, y],
      props: { stroke, fill, noFill, strokeWidth, opacity, strokeType },
    } = this
    const path = this.getVertices(strokeWidth / 2).join()
    return (
      <SVGContainer {...events} opacity={isErasing ? 0.2 : opacity}>
        <g transform={`translate(${x}, ${y})`}>
          <polygon
            className={isSelected || !noFill ? 'tl-hitarea-fill' : 'tl-hitarea-stroke'}
            points={path}
          />
          <polygon
            points={path}
            stroke={noFill ? fill : stroke}
            fill={noFill ? 'none' : fill}
            strokeWidth={strokeWidth}
            rx={2}
            ry={2}
            strokeLinejoin="round"
            strokeDasharray={strokeType === 'dashed' ? '8 2' : undefined}
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
    return withClampedStyles(this, props)
  }

  /**
   * Get a svg group element that can be used to render the shape with only the props data. In the
   * base, draw any shape as a box. Can be overridden by subclasses.
   */
  getShapeSVGJsx(opts: any) {
    // Do not need to consider the original point here
    const {
      offset: [x, y],
      props: { stroke, fill, noFill, strokeWidth, opacity, strokeType },
    } = this
    const path = this.getVertices(strokeWidth / 2).join()

    return (
      <g transform={`translate(${x}, ${y})`} opacity={opacity}>
        <polygon className={!noFill ? 'tl-hitarea-fill' : 'tl-hitarea-stroke'} points={path} />
        <polygon
          points={path}
          stroke={noFill ? fill : stroke}
          fill={noFill ? 'none' : fill}
          strokeWidth={strokeWidth}
          rx={2}
          ry={2}
          strokeLinejoin="round"
          strokeDasharray={strokeType === 'dashed' ? '8 2' : undefined}
        />
      </g>
    )
  }
}
