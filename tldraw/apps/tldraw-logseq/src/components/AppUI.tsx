import { observer } from 'mobx-react-lite'
import { ActionBar } from './ActionBar'
import { DevTools } from './Devtools'
import { PrimaryTools } from './PrimaryTools'
import { StatusBar } from './StatusBar'
import { isDev } from '@tldraw/core'

export const AppUI = observer(function AppUI() {
  return (
    <>
      {isDev() && <StatusBar />}
      {isDev() && <DevTools />}
      <PrimaryTools />
      <ActionBar />
    </>
  )
})
