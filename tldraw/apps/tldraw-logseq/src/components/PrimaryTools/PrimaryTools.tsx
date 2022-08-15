import { TLSelectTool } from '@tldraw/core'
import { useApp } from '@tldraw/react'
import { observer } from 'mobx-react-lite'
import * as React from 'react'
import { Button } from '~components/Button'
import { LogseqIcon, TablerIcon } from '~components/icons'

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
  const Tool = app.Tools?.find(T => T.id === id) ?? TLSelectTool

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

export const PrimaryTools = observer(function PrimaryTools() {
  const app = useApp()

  return (
    <div className="tl-primary-tools">
      <div className="tl-tools-floating-panel" data-tool-locked={app.settings.isToolLocked}>
        <ToolButton title="Select" id="select" icon="select-cursor" />
        <ToolButton title="Draw" id="pencil" icon="ballpen" />
        <ToolButton title="Highlight" id="highlighter" icon="highlight" />
        <ToolButton title="Eraser" id="erase" icon="eraser" />
        <ToolButton title="Connector" id="line" icon="connector" />
        <ToolButton title="Text" id="text" icon="text" />
        <ToolButton title="Logseq Portal" id="logseq-portal" icon={<LogseqIcon />} />
      </div>
    </div>
  )
})
