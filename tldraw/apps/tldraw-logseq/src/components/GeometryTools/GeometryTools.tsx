import { observer } from 'mobx-react-lite'
import type { Side } from '@radix-ui/react-popper'
import { ToolButton } from '../ToolButton'
import * as Popover from '@radix-ui/react-popover'
import { TablerIcon } from '../icons'

interface GeometryToolsProps extends React.HTMLAttributes<HTMLElement> {
  popoverSide?: Side
  activeGeometry?: string
  setGeometry: (e: React.MouseEvent<HTMLButtonElement>) => void
  chevron?: boolean
}

export const GeometryTools = observer(function GeometryTools({
  popoverSide = "left",
  setGeometry,
  activeGeometry,
  chevron = true,
  ...rest}: GeometryToolsProps) {
  const geometries = [
    {
      id: 'box',
      icon: 'square',
      tooltip: 'Rectangle',
    },
    {
      id: 'ellipse',
      icon: 'circle',
      tooltip: 'Circle',
    },
    {
      id: 'polygon',
      icon: 'triangle',
      tooltip: 'Triangle',
    },
  ]

  const shapes = {
    id: 'shapes',
    icon: 'triangle-square-circle',
    tooltip: 'Shape',
  }

  const activeTool = activeGeometry ? geometries.find(geo => geo.id === activeGeometry) : shapes

  return (
    <Popover.Root>
      <Popover.Trigger asChild >
        <div {...rest} className="tl-geometry-tools-pane-anchor">
          <ToolButton {...activeTool} tooltipSide={popoverSide} />
          {chevron &&
            <TablerIcon
              data-selected={activeGeometry}
              className="tl-popover-indicator"
              name="chevron-down-left"
            />
          }
        </div>
      </Popover.Trigger>

      <Popover.Content className="tl-popover-content" side={popoverSide} sideOffset={15}>
        <div className={`tl-toolbar tl-geometry-toolbar ${["left", "right"].includes(popoverSide) ? "flex-col" : "flex-row" }`}>
          {geometries.map(props => (
            <ToolButton key={props.id} id={props.id} icon={props.icon} tooltip={activeGeometry ? props.tooltip : ''} handleClick={setGeometry} tooltipSide={popoverSide} />
          ))}
        </div>

        <Popover.Arrow className="tl-popover-arrow" />
      </Popover.Content>
    </Popover.Root>
  )
})
