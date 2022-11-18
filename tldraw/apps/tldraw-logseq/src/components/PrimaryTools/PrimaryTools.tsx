import { useApp } from '@tldraw/react'
import { observer } from 'mobx-react-lite'
import * as React from 'react'
import { ToolButton } from '../ToolButton'
import { GeometryTools } from '../GeometryTools'
import { ColorInput } from '../inputs/ColorInput'
import * as Separator from '@radix-ui/react-separator'

export const PrimaryTools = observer(function PrimaryTools() {
  const app = useApp()

  const handleSetColor = React.useCallback((color: string) => {
    app.api.setColor(color)
  }, [])

  return (
    <div className="tl-primary-tools">
      <div className="tl-toolbar tl-tools-floating-panel">
        <ToolButton title="Add block or page" id="logseq-portal" icon="circle-plus" />
        <Separator.Root className="tl-toolbar-separator" orientation="horizontal" />
        <ToolButton title="Draw" id="pencil" icon="ballpen" />
        <ToolButton title="Highlight" id="highlighter" icon="highlight" />
        <ToolButton title="Eraser" id="erase" icon="eraser" />
        <ToolButton title="Connector" id="line" icon="connector" />
        <ToolButton title="Text" id="text" icon="text" />
        <GeometryTools />
        <Separator.Root
          className="tl-toolbar-separator"
          orientation="horizontal"
          style={{ margin: '0 -4px' }}
        />
        <ColorInput
          title="Color Picker"
          popoverSide="left"
          color={app.settings.color}
          collisionRef={document.getElementById('main-content-container')}
          setColor={handleSetColor}
        />
      </div>
    </div>
  )
})
