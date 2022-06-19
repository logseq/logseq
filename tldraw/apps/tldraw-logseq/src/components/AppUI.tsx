import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { ToolBar } from './Toolbar'
import { StatusBar } from './StatusBar'
import { PrimaryTools } from './PrimaryTools'
import { DevTools } from './Devtools'
import { Minimap } from './Minimap'

const isDev = process.env.NODE_ENV === 'development'

export const AppUI = observer(function AppUI() {
  return (
    <>
      {/* <ToolBar /> */}
      {/* <Minimap /> */}
      {isDev && <StatusBar />}
      {isDev && <DevTools />}
      <PrimaryTools />
    </>
  )
})
