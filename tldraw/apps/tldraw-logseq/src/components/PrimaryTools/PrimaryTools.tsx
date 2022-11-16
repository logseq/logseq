import { useApp } from '@tldraw/react'
import { observer } from 'mobx-react-lite'
import * as React from 'react'
import { ToolButton } from '../ToolButton'
import { ColorInput } from '../inputs/ColorInput'
import * as Separator from '@radix-ui/react-separator'

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

  const handleSetColor = React.useCallback((color: string) => {
    app.api.setColor(color)
  }, [])

  const handleSetOpacity = React.useCallback((opacity: number) => {
    app.api.setOpacity(opacity)
  }, [])

  return (
    <div className="tl-primary-tools">
      <div className="tl-toolbar tl-tools-floating-panel">
        <ToolButton title="Logseq Portal" id="logseq-portal" icon="circle-plus" />
        <Separator.Root className="tl-toolbar-separator" orientation="horizontal" style={{margin: "0 -4px"}}/>
        <ToolButton title="Draw" id="pencil" icon="ballpen" />
        <ToolButton title="Highlight" id="highlighter" icon="highlight" />
        <ToolButton title="Eraser" id="erase" icon="eraser" />
        <ToolButton title="Connector" id="line" icon="connector" />
        <ToolButton title="Text" id="text" icon="text" />
        <GeometryToolButtons />
        <Separator.Root className="tl-toolbar-separator" orientation="horizontal" style={{margin: "0 -4px"}}/>
        <ColorInput
          title="Color Picker"
          popoverSide="left"
          color={app.settings.color}
          opacity={app.settings.opacity}
          collisionRef={document.getElementById('main-content-container')}
          setOpacity={handleSetOpacity}
          setColor={handleSetColor}
        />
      </div>
    </div>
  )
})
