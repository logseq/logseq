/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  TLPolygonShape,
  TLPolygonShapeProps,
  getComputedColor,
  getTextLabelSize,
} from '@tldraw/core'
import { SVGContainer, TLComponentProps } from '@tldraw/react'
import Vec from '@tldraw/vec'
import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { CustomStyleProps, withClampedStyles } from './style-props'
import { TextLabel } from './text/TextLabel'
import type { SizeLevel } from '.'
import { action, computed } from 'mobx'

interface PolygonShapeProps extends TLPolygonShapeProps, CustomStyleProps {
  type: 'polygon'
  label: string
  fontSize: number
  fontWeight: number
  italic: boolean
  scaleLevel?: SizeLevel
}

const font = '20px / 1 var(--ls-font-family)'

const levelToScale = {
  xs: 10,
  sm: 16,
  md: 20,
  lg: 32,
  xl: 48,
  xxl: 60,
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
    stroke: '',
    fill: '',
    fontWeight: 400,
    fontSize: 20,
    italic: false,
    noFill: false,
    strokeType: 'line',
    strokeWidth: 2,
    opacity: 1,
    label: '',
  }

  canEdit = true

  ReactComponent = observer(
    ({ events, isErasing, isSelected, isEditing, onEditingEnd }: TLComponentProps) => {
      const {
        offset: [x, y],
        props: {
          stroke,
          fill,
          noFill,
          strokeWidth,
          opacity,
          strokeType,
          label,
          italic,
          fontWeight,
          fontSize,
        },
      } = this

      const path = this.getVertices(strokeWidth / 2).join()

      const labelSize =
        label || isEditing
          ? getTextLabelSize(
              label,
              { fontFamily: 'var(--ls-font-family)', fontSize, lineHeight: 1, fontWeight },
              4
            )
          : [0, 0]
      // Using the centroid of the polygon as the label position is preferable in this case
      // This shape is an isosceles triangle at the time of writing this comment
      const midPoint = [this.props.size[0] / 2, (this.props.size[1] * 2) / 3]
      const scale = Math.max(
        0.5,
        Math.min(
          1,
          this.props.size[0] / (labelSize[0] * 2),
          this.props.size[1] / (labelSize[1] * 2)
        )
      )
      const bounds = this.getBounds()

      const offset = React.useMemo(() => {
        return Vec.sub(midPoint, Vec.toFixed([bounds.width / 2, bounds.height / 2]))
      }, [bounds, scale, midPoint])

      const handleLabelChange = React.useCallback(
        (label: string) => {
          this.update?.({ label })
        },
        [label]
      )

      return (
        <div {...events} style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
          <TextLabel
            font={font}
            text={label}
            fontSize={fontSize}
            color={getComputedColor(stroke, 'text')}
            offsetX={offset[0]}
            offsetY={offset[1] / scale}
            scale={scale}
            isEditing={isEditing}
            onChange={handleLabelChange}
            onBlur={onEditingEnd}
            fontStyle={italic ? 'italic' : 'normal'}
            fontWeight={fontWeight}
            pointerEvents={!!label}
          />
          <SVGContainer opacity={isErasing ? 0.2 : opacity}>
            <g transform={`translate(${x}, ${y})`}>
              <polygon
                className={isSelected || !noFill ? 'tl-hitarea-fill' : 'tl-hitarea-stroke'}
                points={path}
              />
              <polygon
                points={path}
                stroke={getComputedColor(stroke, 'stroke')}
                fill={noFill ? 'none' : getComputedColor(fill, 'background')}
                strokeWidth={strokeWidth}
                rx={2}
                ry={2}
                strokeLinejoin="round"
                strokeDasharray={strokeType === 'dashed' ? '8 2' : undefined}
              />
            </g>
          </SVGContainer>
        </div>
      )
    }
  )

  @computed get scaleLevel() {
    return this.props.scaleLevel ?? 'md'
  }

  @action setScaleLevel = async (v?: SizeLevel) => {
    this.update({
      scaleLevel: v,
      fontSize: levelToScale[v ?? 'md'],
      strokeWidth: levelToScale[v ?? 'md'] / 10,
    })
    this.onResetBounds()
  }

  ReactIndicator = observer(() => {
    const {
      offset: [x, y],
      props: { strokeWidth },
    } = this

    return (
      <g>
        <polygon
          transform={`translate(${x}, ${y})`}
          points={this.getVertices(strokeWidth / 2).join()}
        />
      </g>
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
          stroke={getComputedColor(stroke, 'stroke')}
          fill={noFill ? 'none' : getComputedColor(fill, 'background')}
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
