import * as React from 'react'
import { useApp } from '@tldraw/react'
import {
  CursorArrowIcon,
  Pencil1Icon,
  ShadowIcon,
  VideoIcon,
  TextIcon,
} from '@radix-ui/react-icons'
import { observer } from 'mobx-react-lite'
import { Button } from '~components/Button'
import { EraserIcon, ArrowIcon, LogseqIcon } from '~components/icons'

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
    <div className="primary-tools">
      <div className="panel floating-panel" data-tool-locked={app.settings.isToolLocked}>
        <Button
          data-tool="select"
          data-selected={selectedToolId === 'select'}
          onClick={handleToolClick}
        >
          <CursorArrowIcon />
        </Button>
        <Button data-tool="pen" data-selected={selectedToolId === 'pen'} onClick={handleToolClick}>
          <Pencil1Icon />
        </Button>
        <Button
          data-tool="highlighter"
          data-selected={selectedToolId === 'highlighter'}
          onClick={handleToolClick}
        >
          <ShadowIcon />
        </Button>
        <Button
          data-tool="erase"
          data-selected={selectedToolId === 'erase'}
          onClick={handleToolClick}
        >
          <EraserIcon />
        </Button>
        <Button
          data-tool="line"
          data-selected={selectedToolId === 'line'}
          onClick={handleToolClick}
          onDoubleClick={handleToolDoubleClick}
        >
          <ArrowIcon />
        </Button>
        <Button
          data-tool="text"
          data-selected={selectedToolId === 'text'}
          onClick={handleToolClick}
          onDoubleClick={handleToolDoubleClick}
        >
          <TextIcon />
        </Button>
        <Button
          data-tool="youtube"
          data-selected={selectedToolId === 'youtube'}
          onClick={handleToolClick}
          onDoubleClick={handleToolDoubleClick}
        >
          <VideoIcon />
        </Button>
        <Button
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
