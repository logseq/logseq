import { TLMoveTool, TLSelectTool } from '@tldraw/core'
import { useApp } from '@tldraw/react'
import { observer } from 'mobx-react-lite'
import * as React from 'react'
import { Button } from '../Button'
import { TablerIcon, LogseqIcon } from '../icons'

interface ToolButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  id: string
  icon: string | React.ReactNode
}

const ToolButton = observer(({ id, icon, title, ...props }: ToolButtonProps) => {
  const app = useApp()

  const handleToolClick = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const tool = e.currentTarget.dataset.tool
      if (tool) app.selectTool(tool)
    },
    [app]
  )

  // Tool must exist
  const Tool = [...app.Tools, TLSelectTool, TLMoveTool]?.find(T => T.id === id)

  const shortcut = ((Tool as any)['shortcut'] as string[])?.[0]

  const titleWithShortcut = shortcut ? `${title} (${shortcut})` : title
  return (
    <Button
      {...props}
      title={titleWithShortcut}
      data-tool={id}
      data-selected={id === app.selectedTool.id}
      onClick={handleToolClick}
    >
      {typeof icon === 'string' ? <TablerIcon name={icon} /> : icon}
    </Button>
  )
})

const GeometryToolButtons = observer(() => {
  const geometries = [
    {
      id: 'box',
      icon: 'square',
      title: 'Rectangle',
    },
    {
      id: 'ellipse',
      icon: 'circle',
      title: 'Circle',
    },
    {
      id: 'polygon',
      icon: 'triangle',
      title: 'Triangle',
    },
  ]

  const app = useApp()
  const [activeGeomId, setActiveGeomId] = React.useState(
    () => (geometries.find(geo => geo.id === app.selectedTool.id) ?? geometries[0]).id
  )

  const [paneActive, setPaneActive] = React.useState(false)

  React.useEffect(() => {
    setActiveGeomId(prevId => {
      return geometries.find(geo => geo.id === app.selectedTool.id)?.id ?? prevId
    })
  }, [app.selectedTool.id])

  return (
    <div
      className="tl-geometry-tools-pane-anchor"
      onMouseEnter={() => setPaneActive(true)}
      onMouseLeave={() => setPaneActive(false)}
    >
      {<ToolButton {...geometries.find(geo => geo.id === activeGeomId)!} />}
      {paneActive && (
        <div className="tl-geometry-tools-pane">
          {geometries.map(props => (
            <ToolButton key={props.id} {...props} />
          ))}
        </div>
      )}
    </div>
  )
})

export const PrimaryTools = observer(function PrimaryTools() {
  const app = useApp()

  return (
    <div className="tl-primary-tools">
      <div
        className="tl-toolbar tl-tools-floating-panel"
        data-tool-locked={app.settings.isToolLocked}
      >
        <ToolButton title="Select" id="select" icon="select-cursor" />
        <ToolButton
          title="Move"
          id="move"
          icon={app.isIn('move.panning') ? 'hand-grab' : 'hand-stop'}
        />
        <ToolButton title="Draw" id="pencil" icon="ballpen" />
        <ToolButton title="Highlight" id="highlighter" icon="highlight" />
        <ToolButton title="Eraser" id="erase" icon="eraser" />
        <ToolButton title="Connector" id="line" icon="connector" />
        <ToolButton title="Text" id="text" icon="text" />
        <GeometryToolButtons />
        <ToolButton title="Logseq Portal" id="logseq-portal" icon={<LogseqIcon />} />
      </div>
    </div>
  )
})
