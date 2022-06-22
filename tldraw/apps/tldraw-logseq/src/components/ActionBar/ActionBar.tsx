/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react'
import { observer } from 'mobx-react-lite'
import type { Shape } from '~lib'
import { App, useApp } from '@tldraw/react'
import { Minimap } from '~components/Minimap'
import { RedoIcon, UndoIcon } from '~components/icons'

export const ActionBar = observer(function ToolBar(): JSX.Element {
  const app = useApp<Shape>()
  
  return (
    <div className="action-bar">
      <button onClick={app.api.undo}>
        <UndoIcon></UndoIcon>
      </button>

      <button onClick={app.api.redo}>
        <RedoIcon></RedoIcon>
      </button>
    </div>
  )
})
