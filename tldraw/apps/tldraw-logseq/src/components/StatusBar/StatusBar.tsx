/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useApp } from '@tldraw/react'
import { observer } from 'mobx-react-lite'
import type { Shape } from '../../lib'

export const StatusBar = observer(function StatusBar() {
  const app = useApp<Shape>()
  return (
    <div className="tl-statusbar" data-html2canvas-ignore="true">
      {app.selectedTool.id} | {app.selectedTool.currentState.id}
      <div style={{ flex: 1 }} />
      <div id="tl-statusbar-anchor" className="flex gap-1" />
    </div>
  )
})
