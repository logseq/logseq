/* eslint-disable @typescript-eslint/no-explicit-any */
import { Decoration, TLLineShape, TLLineShapeProps, getComputedColor } from '@tldraw/core'
import { SVGContainer, TLComponentProps } from '@tldraw/react'
import Vec from '@tldraw/vec'
import { observer } from 'mobx-react-lite'
import * as React from 'react'
import { Arrow } from './arrow/Arrow'
import { getArrowPath } from './arrow/arrowHelpers'
import { CustomStyleProps, withClampedStyles } from './style-props'
import { getTextLabelSize } from '@tldraw/core'
import { LabelMask } from './text/LabelMask'
import { TextLabel } from './text/TextLabel'
import type { SizeLevel } from '.'
import { action, computed } from 'mobx'

interface LineShapeProps extends CustomStyleProps, TLLineShapeProps {
  type: 'line'
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

export class LineShape extends TLLineShape<LineShapeProps> {
  static id = 'line'

  static defaultProps: LineShapeProps = {
    id: 'line',
    parentId: 'page',
    type: 'line',
    point: [0, 0],
    handles: {
      start: { id: 'start', canBind: true, point: [0, 0] },
      end: { id: 'end', canBind: true, point: [1, 1] },
    },
    stroke: '',
    fill: '',
    noFill: true,
    fontWeight: 400,
    fontSize: 20,
    italic: false,
    strokeType: 'line',
    strokeWidth: 1,
    opacity: 1,
    decorations: {
      end: Decoration.Arrow,
    },
    label: '',
  }

  hideSelection = true
  canEdit = true

  ReactComponent = observer(({ events, isErasing, isEditing, onEditingEnd }: TLComponentProps) => {
    const {
      stroke,
      handles: { start, end },
      opacity,
      label,
      italic,
      fontWeight,
      fontSize,
      id,
    } = this.props
    const labelSize =
      label || isEditing
        ? getTextLabelSize(
            label || 'Enter text',
            { fontFamily: 'var(--ls-font-family)', fontSize, lineHeight: 1, fontWeight },
            6
          )
        : [0, 0]
    const midPoint = Vec.med(start.point, end.point)
    const dist = Vec.dist(start.point, end.point)
    const scale = Math.max(
      0.5,
      Math.min(1, Math.max(dist / (labelSize[1] + 128), dist / (labelSize[0] + 128)))
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
      <div
        {...events}
        style={{ width: '100%', height: '100%', overflow: 'hidden' }}
        className="tl-line-container"
      >
        <TextLabel
          font={font}
          text={label}
          fontSize={fontSize}
          color={getComputedColor(stroke, 'text')}
          offsetX={offset[0]}
          offsetY={offset[1]}
          scale={scale}
          isEditing={isEditing}
          onChange={handleLabelChange}
          onBlur={onEditingEnd}
          fontStyle={italic ? 'italic' : 'normal'}
          fontWeight={fontWeight}
          pointerEvents={!!label}
        />
        <SVGContainer opacity={isErasing ? 0.2 : opacity} id={id + '_svg'}>
          <LabelMask id={id} bounds={bounds} labelSize={labelSize} offset={offset} scale={scale} />
          <g pointerEvents="none" mask={label || isEditing ? `url(#${id}_clip)` : ``}>
            {this.getShapeSVGJsx({ preview: false })}
          </g>
        </SVGContainer>
      </div>
    )
  })

  @computed get scaleLevel() {
    return this.props.scaleLevel ?? 'md'
  }

  @action setScaleLevel = async (v?: SizeLevel) => {
    this.update({
      scaleLevel: v,
      fontSize: levelToScale[v ?? 'md'],
    })
    this.onResetBounds()
  }

  ReactIndicator = observer(({ isEditing }: TLComponentProps) => {
    const {
      id,
      decorations,
      label,
      strokeWidth,
      fontSize,
      fontWeight,
      handles: { start, end },
      isLocked,
    } = this.props
    const bounds = this.getBounds()
    const labelSize =
      label || isEditing
        ? getTextLabelSize(
            label,
            { fontFamily: 'var(--ls-font-family)', fontSize, lineHeight: 1, fontWeight },
            6
          )
        : [0, 0]
    const midPoint = Vec.med(start.point, end.point)
    const dist = Vec.dist(start.point, end.point)
    const scale = Math.max(
      0.5,
      Math.min(1, Math.max(dist / (labelSize[1] + 128), dist / (labelSize[0] + 128)))
    )
    const offset = React.useMemo(() => {
      return Vec.sub(midPoint, Vec.toFixed([bounds.width / 2, bounds.height / 2]))
    }, [bounds, scale, midPoint])
    return (
      <g>
        <path
          mask={label ? `url(#${id}_clip)` : ``}
          d={getArrowPath(
            { strokeWidth },
            start.point,
            end.point,
            decorations?.start,
            decorations?.end
          )}
          strokeDasharray={isLocked ? '8 2' : 'undefined'}
        />
        {label && !isEditing && (
          <rect
            x={bounds.width / 2 - (labelSize[0] / 2) * scale + offset[0]}
            y={bounds.height / 2 - (labelSize[1] / 2) * scale + offset[1]}
            width={labelSize[0] * scale}
            height={labelSize[1] * scale}
            rx={4 * scale}
            ry={4 * scale}
            fill="transparent"
          />
        )}
      </g>
    )
  })

  validateProps = (props: Partial<LineShapeProps>) => {
    return withClampedStyles(this, props)
  }

  getShapeSVGJsx({ preview }: any) {
    const {
      stroke,
      fill,
      strokeWidth,
      strokeType,
      decorations,
      label,
      scaleLevel,
      handles: { start, end },
    } = this.props
    const midPoint = Vec.med(start.point, end.point)
    return (
      <>
        <Arrow
          style={{
            stroke: getComputedColor(stroke, 'text'),
            fill,
            strokeWidth,
            strokeType,
          }}
          scaleLevel={scaleLevel}
          start={start.point}
          end={end.point}
          decorationStart={decorations?.start}
          decorationEnd={decorations?.end}
        />
        {preview && (
          <>
            <text
              style={{
                transformOrigin: 'top left',
              }}
              fontFamily="Inter"
              fontSize={20}
              transform={`translate(${midPoint[0]}, ${midPoint[1]})`}
              textAnchor="middle"
              fill={getComputedColor(stroke, 'text')}
              stroke={getComputedColor(stroke, 'text')}
            >
              {label}
            </text>
          </>
        )}
      </>
    )
  }
}
