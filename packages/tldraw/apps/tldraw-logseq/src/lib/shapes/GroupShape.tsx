import { GROUP_PADDING, TLGroupShape, TLGroupShapeProps } from '@tldraw/core'
import { SVGContainer, TLComponentProps, useApp } from '@tldraw/react'
import { observer } from 'mobx-react-lite'

export interface GroupShapeProps extends TLGroupShapeProps {}

export class GroupShape extends TLGroupShape<GroupShapeProps> {
  static id = 'group'

  static defaultProps: GroupShapeProps = {
    id: 'group',
    type: 'group',
    parentId: 'page',
    point: [0, 0],
    size: [0, 0],
    children: [],
  }

  // TODO: add styles for arrow binding states
  ReactComponent = observer(({ events }: TLComponentProps) => {
    const strokeWidth = 2
    const bounds = this.getBounds()
    const app = useApp()

    const childSelected = app.selectedShapesArray.some(s => {
      return app.shapesInGroups([this]).includes(s)
    })

    const Indicator = this.ReactIndicator

    return (
      <SVGContainer {...events} className="tl-group-container">
        <rect
          className={'tl-hitarea-fill'}
          x={strokeWidth / 2}
          y={strokeWidth / 2}
          width={Math.max(0.01, bounds.width - strokeWidth)}
          height={Math.max(0.01, bounds.height - strokeWidth)}
          pointerEvents="all"
        />
        {childSelected && (
          <g stroke="var(--color-selectedFill)">
            <Indicator />
          </g>
        )}
      </SVGContainer>
    )
  })

  ReactIndicator = observer(() => {
    const bounds = this.getBounds()
    return (
      <rect
        strokeDasharray="8 2"
        x={-GROUP_PADDING}
        y={-GROUP_PADDING}
        rx={GROUP_PADDING / 2}
        ry={GROUP_PADDING / 2}
        width={bounds.width + GROUP_PADDING * 2}
        height={bounds.height + GROUP_PADDING * 2}
        fill="transparent"
      />
    )
  })
}
