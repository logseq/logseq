/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { useApp } from '@tldraw/react'
import type { Shape } from '~lib'

export const StatusBar = observer(function StatusBar() {
  const app = useApp<Shape>()
  React.useEffect(() => {
    const canvas = document.querySelector<HTMLElement>('.logseq-tldraw-wrapper .tl-canvas')
    if (canvas) {
      canvas.style.height = 'calc(100% - 32px)'
    }
  }, [])
  return (
    <div className="statusbar">
      {app.selectedTool.id} | {app.selectedTool.currentState.id}
      <div style={{ flex: 1 }} />
      <div id="tl-statusbar-anchor" />
    </div>
  )
})
