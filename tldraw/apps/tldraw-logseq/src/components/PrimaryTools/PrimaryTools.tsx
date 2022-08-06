import { useApp } from '@tldraw/react'
import { observer } from 'mobx-react-lite'
import * as React from 'react'
import { Button } from '~components/Button'
import { LogseqIcon, TablerIcon } from '~components/icons'

export const PrimaryTools = observer(function PrimaryTools() {
  const app = useApp()

  const handleToolClick = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const tool = e.currentTarget.dataset.tool
      if (tool) app.selectTool(tool)
    },
    [app]
  )

  const handleToolDoubleClick = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const tool = e.currentTarget.dataset.tool
      if (tool) app.selectTool(tool)
      app.settings.update({ isToolLocked: true })
    },
    [app]
  )

  const selectedToolId = app.selectedTool.id

  return (
    <div className="tl-primary-tools">
      <div className="tl-tools-floating-panel" data-tool-locked={app.settings.isToolLocked}>
        <Button
          title="Select tool"
          data-tool="select"
          data-selected={selectedToolId === 'select'}
          onClick={handleToolClick}
        >
          <TablerIcon name="click" />
        </Button>
        <Button
          title="Draw tool"
          data-tool="pencil"
          data-selected={selectedToolId === 'pencil'}
          onClick={handleToolClick}
        >
          <TablerIcon name="ballpen" />
        </Button>
        <Button
          title="Highlight tool"
          data-tool="highlighter"
          data-selected={selectedToolId === 'highlighter'}
          onClick={handleToolClick}
        >
          <TablerIcon name="highlight" />
        </Button>
        <Button
          title="Eraser tool"
          data-tool="erase"
          data-selected={selectedToolId === 'erase'}
          onClick={handleToolClick}
        >
          <TablerIcon name="eraser" />
        </Button>
        <Button
          title="Line tool"
          data-tool="line"
          data-selected={selectedToolId === 'line'}
          onClick={handleToolClick}
          onDoubleClick={handleToolDoubleClick}
        >
          <TablerIcon name="line" />
        </Button>
        <Button
          title="Text tool"
          data-tool="text"
          data-selected={selectedToolId === 'text'}
          onClick={handleToolClick}
          onDoubleClick={handleToolDoubleClick}
        >
          <TablerIcon name="text-resize" />
        </Button>
        <Button
          title="Logseq Portal tool"
          data-tool="logseq-portal"
          data-selected={selectedToolId === 'logseq-portal'}
          onClick={handleToolClick}
          onDoubleClick={handleToolDoubleClick}
        >
          <LogseqIcon />
        </Button>
      </div>
    </div>
  )
})
