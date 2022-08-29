/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useApp } from '@tldraw/react'
import { observer } from 'mobx-react-lite'
import * as React from 'react'
import type { Shape } from '../../lib'
import { TablerIcon } from '../icons'
import { ZoomMenu } from '../ZoomMenu'

export const ActionBar = observer(function ActionBar(): JSX.Element {
  const app = useApp<Shape>()
  const undo = React.useCallback(() => {
    app.api.undo()
  }, [app])

  const redo = React.useCallback(() => {
    app.api.redo()
  }, [app])

  return (
    <div className="tl-action-bar">
      <button onClick={undo}>
        <TablerIcon name="arrow-back-up" />
      </button>
      <button onClick={redo}>
        <TablerIcon name="arrow-forward-up" />
      </button>
      <ZoomMenu />
    </div>
  )
})
