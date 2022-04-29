import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { ToolBar } from './Toolbar'
import { StatusBar } from './StatusBar'
import { PrimaryTools } from './PrimaryTools'

export const AppUI = observer(function AppUI() {
  return (
    <>
      {/* <ToolBar /> */}
      {/* <StatusBar /> */}
      <PrimaryTools />
    </>
  )
})
