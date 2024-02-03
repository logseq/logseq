import { observer } from 'mobx-react-lite'
import type { Side } from '@radix-ui/react-popper'
import { ToolButton } from '../ToolButton'
import { TablerIcon } from '../icons'
import React from 'react'
import { LogseqContext } from '../../lib/logseq-context'

// @ts-ignore
const LSUI = window.LSUI

interface GeometryToolsProps extends React.HTMLAttributes<HTMLElement> {
  popoverSide?: Side
  activeGeometry?: string
  setGeometry: (e: React.MouseEvent<HTMLButtonElement>) => void
  chevron?: boolean
}

export const GeometryTools = observer(function GeometryTools({
  popoverSide = 'left',
  setGeometry,
  activeGeometry,
  chevron = true,
  ...rest
}: GeometryToolsProps) {
  const {
    handlers: { t },
  } = React.useContext(LogseqContext)

  const geometries = [
    {
      id: 'box',
      icon: 'square',
      tooltip: t('whiteboard/rectangle'),
    },
    {
      id: 'ellipse',
      icon: 'circle',
      tooltip: t('whiteboard/circle'),
    },
    {
      id: 'polygon',
      icon: 'triangle',
      tooltip: t('whiteboard/triangle'),
    },
  ]

  const shapes = {
    id: 'shapes',
    icon: 'triangle-square-circle',
    tooltip: t('whiteboard/shape'),
  }

  const activeTool = activeGeometry ? geometries.find(geo => geo.id === activeGeometry) : shapes

  return (
    <LSUI.Popover>
      <LSUI.PopoverTrigger asChild>
        <div {...rest} className="tl-geometry-tools-pane-anchor">
          <ToolButton {...activeTool} tooltipSide={popoverSide} />
          {chevron && (
            <TablerIcon
              data-selected={activeGeometry}
              className="tl-popover-indicator"
              name="chevron-down-left"
            />
          )}
        </div>
      </LSUI.PopoverTrigger>

      <LSUI.PopoverContent
        className="p-0 w-auto"
        side={popoverSide}
        sideOffset={15}
        collisionBoundary={document.querySelector('.logseq-tldraw')}>
        <div
          className={`tl-toolbar tl-geometry-toolbar ${
            ['left', 'right'].includes(popoverSide) ? 'flex-col' : 'flex-row'
          }`}
        >
          {geometries.map(props => (
            <ToolButton
              key={props.id}
              id={props.id}
              icon={props.icon}
              handleClick={setGeometry}
              tooltipSide={popoverSide}
            />
          ))}
        </div>
      </LSUI.PopoverContent>
    </LSUI.Popover>
  )
})
