import { observer } from 'mobx-react-lite'
import { ActionBar } from './ActionBar'
import { DevTools } from './Devtools'
import { PrimaryTools } from './PrimaryTools'
import { StatusBar } from './StatusBar'
import { isDev } from '@tldraw/core'
import { useApp } from '@tldraw/react'

export const AppUI = observer(function AppUI() {
  const app = useApp()

  return (
    <>
      {isDev() && <StatusBar />}
      {isDev() && <DevTools />}
      {!app.readOnly && <PrimaryTools />}
      <ActionBar />
    </>
  )
})
