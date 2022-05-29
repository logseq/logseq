/* eslint-disable @typescript-eslint/no-explicit-any */
import { Decoration, TLLineShape, TLLineShapeProps } from '@tldraw/core'
import { HTMLContainer, SVGContainer, TLComponentProps } from '@tldraw/react'
import { observer } from 'mobx-react-lite'
import * as React from 'react'
import { getArrowPath } from './arrow/arrowHelpers'
import { Arrow } from './arrow/Arrow'
import { CustomStyleProps, withClampedStyles } from './style-props'
import { TextLabel } from './text/TextLabel'
import { getTextLabelSize } from './text/getTextSize'
import Vec from '@tldraw/vec'

interface LineShapeProps extends CustomStyleProps, TLLineShapeProps {
  type: 'line'
  label: string
}

const font = '28px / 1 "Source Code Pro"'

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
    stroke: '#000000',
    fill: '#ffffff',
    strokeWidth: 1,
    opacity: 1,
    decorations: {
      end: Decoration.Arrow,
    },
    label: '',
  }

  hideSelection = true

  ReactComponent = observer(({ events, isErasing, isEditing, onEditingEnd }: TLComponentProps) => {
    const {
      stroke,
      fill,
      strokeWidth,
      decorations,
      handles: { start, end },
      opacity,
      label,
    } = this.props
    const labelSize = label || isEditing ? getTextLabelSize(label, font) : [0, 0]
    const midPoint = Vec.med(start.point, end.point)
    const dist = Vec.dist(start.point, end.point)
    const scale = Math.max(
      0.5,
      Math.min(1, Math.max(dist / (labelSize[1] + 128), dist / (labelSize[0] + 128)))
    )
    const bounds = this.getBounds()
    const offset = React.useMemo(() => {
      const offset = Vec.sub(midPoint, Vec.toFixed([bounds.width / 2, bounds.height / 2]))
      return offset
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
          color={stroke}
          offsetX={offset[0]}
          offsetY={offset[1]}
          scale={scale}
          isEditing={isEditing}
          onChange={handleLabelChange}
          onBlur={onEditingEnd}
        />
        <SVGContainer opacity={isErasing ? 0.2 : opacity}>
          <g pointerEvents="none">
            <Arrow
              style={{
                stroke,
                fill,
                strokeWidth,
              }}
              start={start.point}
              end={end.point}
              decorationStart={decorations?.start}
              decorationEnd={decorations?.end}
            />
          </g>
        </SVGContainer>
      </div>
    )
  })

  ReactIndicator = observer(() => {
    const {
      decorations,
      strokeWidth,
      handles: { start, end },
    } = this.props
    return (
      <path
        d={getArrowPath(
          { strokeWidth },
          start.point,
          end.point,
          decorations?.start,
          decorations?.end
        )}
      />
    )
  })

  validateProps = (props: Partial<LineShapeProps>) => {
    return withClampedStyles(props)
  }
}
