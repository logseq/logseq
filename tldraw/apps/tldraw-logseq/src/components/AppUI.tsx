import { observer } from 'mobx-react-lite'
import { ActionBar } from './ActionBar'
import { DevTools } from './Devtools'
import { PrimaryTools } from './PrimaryTools'
import { StatusBar } from './StatusBar'
import { isDev } from '@tldraw/core'
import { LogseqContext } from './../lib/logseq-context'
import React from 'react'


export const AppUI = observer(function AppUI() {
  const { isPublishing } = React.useContext(LogseqContext)

  return (
    <>
      {isDev() && <StatusBar />}
      {isDev() && <DevTools />}
      {!isPublishing && <PrimaryTools />}
      <ActionBar />
    </>
  )
})
