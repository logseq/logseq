/* eslint-disable @typescript-eslint/no-explicit-any */
import { Decoration, TLLineShape, TLLineShapeProps } from '@tldraw/core'
import { SVGContainer, TLComponentProps } from '@tldraw/react'
import { observer } from 'mobx-react-lite'
import * as React from 'react'
import { getArrowPath } from './arrow/arrowHelpers'
import { Arrow } from './arrow/Arrow'
import { CustomStyleProps, withClampedStyles } from './style-props'

interface LineShapeProps extends CustomStyleProps, TLLineShapeProps {
  type: 'line'
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
    stroke: '#000000',
    fill: '#ffffff',
    strokeWidth: 1,
    opacity: 1,
    decorations: {
      end: Decoration.Arrow,
    },
  }

  hideSelection = true

  ReactComponent = observer(({ events, isErasing }: TLComponentProps) => {
    const {
      stroke,
      fill,
      strokeWidth,
      decorations,
      handles: { start, end },
      opacity,
    } = this.props
    return (
      <SVGContainer {...events} opacity={isErasing ? 0.2 : opacity}>
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
