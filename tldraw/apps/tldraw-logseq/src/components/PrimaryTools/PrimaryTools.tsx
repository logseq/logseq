import { useApp } from '@tldraw/react'
import { Geometry } from '@tldraw/core'
import { observer } from 'mobx-react-lite'
import * as React from 'react'
import { ToolButton } from '../ToolButton'
import { GeometryTools } from '../GeometryTools'
import { ColorInput } from '../inputs/ColorInput'
import { ScaleInput } from '../inputs/ScaleInput'
import * as Separator from '@radix-ui/react-separator'
import { LogseqContext } from '../../lib/logseq-context'

export const PrimaryTools = observer(function PrimaryTools() {
  const app = useApp()
  const {
    handlers: { t },
  } = React.useContext(LogseqContext)

  const handleSetColor = React.useCallback((color: string) => {
    app.api.setColor(color)
  }, [])

  const handleToolClick = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const tool = e.currentTarget.dataset.tool
    if (tool) app.selectTool(tool)
  }, [])

  const [activeGeomId, setActiveGeomId] = React.useState(
    () =>
      Object.values(Geometry).find((geo: string) => geo === app.selectedTool.id) ??
      Object.values(Geometry)[0]
  )

  React.useEffect(() => {
    setActiveGeomId((prevId: Geometry) => {
      return Object.values(Geometry).find((geo: string) => geo === app.selectedTool.id) ?? prevId
    })
  }, [app.selectedTool.id])

  return (
    <div className="tl-primary-tools" data-html2canvas-ignore="true">
      <div className="tl-toolbar tl-tools-floating-panel">
        <ToolButton
          handleClick={() => app.selectTool('select')}
          tooltip={t('whiteboard/select')}
          id="select"
          icon="select-cursor"
        />
        <ToolButton
          handleClick={() => app.selectTool('move')}
          tooltip={t('whiteboard/pan')}
          id="move"
          icon={app.isIn('move.panning') ? 'hand-grab' : 'hand-stop'}
        />
        <Separator.Root className="tl-toolbar-separator" orientation="horizontal" />
        <ToolButton
          handleClick={() => app.selectTool('logseq-portal')}
          tooltip={t('whiteboard/add-block-or-page')}
          id="logseq-portal"
          icon="circle-plus"
        />
        <ToolButton
          handleClick={() => app.selectTool('pencil')}
          tooltip={t('whiteboard/draw')}
          id="pencil"
          icon="ballpen"
        />
        <ToolButton
          handleClick={() => app.selectTool('highlighter')}
          tooltip={t('whiteboard/highlight')}
          id="highlighter"
          icon="highlight"
        />
        <ToolButton
          handleClick={() => app.selectTool('erase')}
          tooltip={t('whiteboard/eraser')}
          id="erase"
          icon="eraser"
        />
        <ToolButton
          handleClick={() => app.selectTool('line')}
          tooltip={t('whiteboard/connector')}
          id="line"
          icon="connector"
        />
        <ToolButton
          handleClick={() => app.selectTool('text')}
          tooltip={t('whiteboard/text')}
          id="text"
          icon="text"
        />
        <GeometryTools activeGeometry={activeGeomId} setGeometry={handleToolClick} />
        <Separator.Root
          className="tl-toolbar-separator"
          orientation="horizontal"
          style={{ margin: '0 -4px' }}
        />
        <ColorInput popoverSide="left" color={app.settings.color} setColor={handleSetColor} />
        <ScaleInput scaleLevel={app.settings.scaleLevel} popoverSide="left" compact={true} />
      </div>
    </div>
  )
})
