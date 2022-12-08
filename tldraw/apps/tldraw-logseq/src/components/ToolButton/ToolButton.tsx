import { TLMoveTool, TLSelectTool } from '@tldraw/core'
import { useApp } from '@tldraw/react'
import { observer } from 'mobx-react-lite'
import * as React from 'react'
import { Button } from '../Button'
import { TablerIcon } from '../icons'

export interface ToolButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  id: string
  icon: string | React.ReactNode
}

export const ToolButton = observer(({ id, icon, title, ...props }: ToolButtonProps) => {
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

  const shortcut = ((Tool as any)['shortcut'] as string[])?.join(', ').toUpperCase()

  const titleWithShortcut = shortcut ? `${title} - ${shortcut}` : title
  return (
    <Button
      {...props}
      tooltipSide="left"
      title={titleWithShortcut}
      data-tool={id}
      data-selected={id === app.selectedTool.id}
      onClick={handleToolClick}
    >
      {typeof icon === 'string' ? <TablerIcon name={icon} /> : icon}
    </Button>
  )
})
