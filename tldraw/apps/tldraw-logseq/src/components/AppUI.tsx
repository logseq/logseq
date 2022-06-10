import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { ToolBar } from './Toolbar'
import { StatusBar } from './StatusBar'
import { PrimaryTools } from './PrimaryTools'
import { DevTools } from './Devtools'
import { useApp } from '@tldraw/react'
import { WhiteboardPreview } from '~lib'

const isDev = process.env.NODE_ENV === 'development'

export const AppUI = observer(function AppUI() {
  const app = useApp()

  const preview = React.useMemo(() => {
    const WP = new WhiteboardPreview(app.serialized)
    return WP.getPreview(app.viewport)
  }, [
    app.serialized,
    app.viewport.camera.point,
  ])

  return (
    <>
      {/* <ToolBar /> */}
      {preview}
      {isDev && <StatusBar />}
      {isDev && <DevTools />}
      <PrimaryTools />
    </>
  )
})
