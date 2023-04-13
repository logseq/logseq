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
    <div className="tl-primary-tools" data-html2canvas-ignore="true">
      <div className="tl-toolbar tl-tools-floating-panel">
        <ToolButton tooltip="Select" id="select" icon="select-cursor" />
        <ToolButton
          tooltip="Move"
          id="move"
          icon={app.isIn('move.panning') ? 'hand-grab' : 'hand-stop'}
        />
        <Separator.Root className="tl-toolbar-separator" orientation="horizontal" />
        <ToolButton tooltip="Add block or page" id="logseq-portal" icon="circle-plus" />
        <ToolButton tooltip="Draw" id="pencil" icon="ballpen" />
        <ToolButton tooltip="Highlight" id="highlighter" icon="highlight" />
        <ToolButton tooltip="Eraser" id="erase" icon="eraser" />
        <ToolButton tooltip="Connector" id="line" icon="connector" />
        <ToolButton tooltip="Text" id="text" icon="text" />
        <GeometryTools />
        <Separator.Root
          className="tl-toolbar-separator"
          orientation="horizontal"
          style={{ margin: '0 -4px' }}
        />
        <ColorInput popoverSide="left" color={app.settings.color} setColor={handleSetColor} />
      </div>
    </div>
  )
})
