/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { useApp } from '@tldraw/react'
import type { Shape } from '../../lib'

export const StatusBar = observer(function StatusBar() {
  const app = useApp<Shape>()
  React.useEffect(() => {
    const canvas = document.querySelector<HTMLElement>('.logseq-tldraw-wrapper .tl-canvas')
    const actionBar = document.querySelector<HTMLElement>('.logseq-tldraw-wrapper .tl-action-bar')
    if (canvas) {
      canvas.style.height = 'calc(100% - 32px)'
    }

    if (actionBar) {
      actionBar.style.marginBottom = '32px'
    }

    return () => {
      if (canvas) {
        canvas.style.height = '100%'
      }

      if (actionBar) {
        actionBar.style.marginBottom = '0px'
      }
    }
  })
  return (
    <div className="tl-statusbar">
      {app.selectedTool.id} | {app.selectedTool.currentState.id}
      <div style={{ flex: 1 }} />
      <div id="tl-statusbar-anchor" style={{ display: 'flex' }} />
    </div>
  )
})
