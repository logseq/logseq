/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { useApp } from '@tldraw/react'
import type { Shape } from '../../lib'

const HistoryStack = observer(function HistoryStack() {
  const app = useApp<Shape>()

  return (
    <div className="fixed left-4 top-4 flex gap-4">
      {app.history.stack.map((item, i) => (
        <div
          style={{
            background: app.history.pointer === i ? 'pink' : 'grey',
          }}
          key={i}
          onClick={() => app.history.setPointer(i)}
          className="flex items-center rounded-lg p-4"
        >
          {item.pages[0].nonce}
        </div>
      ))}
    </div>
  )
})

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
      <HistoryStack />
      {app.selectedTool.id} | {app.selectedTool.currentState.id}
      <div style={{ flex: 1 }} />
      <div id="tl-statusbar-anchor" style={{ display: 'flex' }} />
    </div>
  )
})
