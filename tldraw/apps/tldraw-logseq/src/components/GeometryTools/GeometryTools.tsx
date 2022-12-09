import { useApp } from '@tldraw/react'
import { observer } from 'mobx-react-lite'
import * as React from 'react'
import { ToolButton } from '../ToolButton'
import * as Popover from '@radix-ui/react-popover'
import { TablerIcon } from '../icons'

export const GeometryTools = observer(function GeometryTools() {
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

  const app = useApp()
  const [activeGeomId, setActiveGeomId] = React.useState(
    () => (geometries.find(geo => geo.id === app.selectedTool.id) ?? geometries[0]).id
  )

  React.useEffect(() => {
    setActiveGeomId(prevId => {
      return geometries.find(geo => geo.id === app.selectedTool.id)?.id ?? prevId
    })
  }, [app.selectedTool.id])

  return (
    <Popover.Root>
      <Popover.Trigger className="tl-geometry-tools-pane-anchor">
        <ToolButton {...geometries.find(geo => geo.id === activeGeomId)!} />
        <TablerIcon
          data-selected={geometries.some(geo => geo.id === app.selectedTool.id)}
          className="tl-popover-indicator"
          name="chevron-down-left"
        />
      </Popover.Trigger>

      <Popover.Content className="tl-popover-content" side="left" sideOffset={15}>
        <div className="tl-toolbar tl-geometry-toolbar">
          {geometries.map(props => (
            <ToolButton key={props.id} {...props} />
          ))}
        </div>

        <Popover.Arrow className="tl-popover-arrow" />
      </Popover.Content>
    </Popover.Root>
  )
})
