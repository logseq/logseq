/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react'
import { observer } from 'mobx-react-lite'
import type { Shape } from '~lib'
import { useApp } from '@tldraw/react'
import { Minimap } from '~components/Minimap'
import { RedoIcon, UndoIcon } from '~components/icons'
import { ZoomMenu } from '~components/ZoomMenu'

export const ActionBar = observer(function ToolBar(): JSX.Element {
  const app = useApp<Shape>()
  //Use state isOpen
  const undo = React.useCallback(() => {
    app.api.undo()
  }, [app])

  const redo = React.useCallback(() => {
    app.api.redo()
  }, [app])

  return (
    <div className="action-bar">
      {/* <button>minimap</button> */}
      <Minimap></Minimap>
      <button onClick={undo}>
        <UndoIcon></UndoIcon>
      </button>
      <ZoomMenu></ZoomMenu>
      <button onClick={redo}>
        <RedoIcon></RedoIcon>
      </button>
    </div>
  )
})
