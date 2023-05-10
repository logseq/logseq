import { TLMoveTool, TLSelectTool } from '@tldraw/core'
import { useApp } from '@tldraw/react'
import type { Side } from '@radix-ui/react-popper'
import { observer } from 'mobx-react-lite'
import type * as React from 'react'
import { Button } from '../Button'
import { TablerIcon } from '../icons'
import { KeyboardShortcut } from '../KeyboardShortcut'

export interface ToolButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  id: string
  icon: string | React.ReactNode
  tooltip: string
  tooltipSide?: Side
  handleClick: (e: React.MouseEvent<HTMLButtonElement>) => void
}

export const ToolButton = observer(
  ({ id, icon, tooltip, tooltipSide = 'left', handleClick, ...props }: ToolButtonProps) => {
    const app = useApp()

    // Tool must exist
    const Tool = [...app.Tools, TLSelectTool, TLMoveTool]?.find(T => T.id === id)

    const shortcuts = (Tool as any)?.['shortcut']

    const tooltipContent =
      shortcuts && tooltip ? (
        <div className="flex">
          {tooltip}
          <KeyboardShortcut action={shortcuts} />
        </div>
      ) : (
        tooltip
      )

    return (
      <Button
        {...props}
        tooltipSide={tooltipSide}
        tooltip={tooltipContent}
        data-tool={id}
        data-selected={id === app.selectedTool.id}
        onClick={handleClick}
      >
        {typeof icon === 'string' ? <TablerIcon name={icon} /> : icon}
      </Button>
    )
  }
)
