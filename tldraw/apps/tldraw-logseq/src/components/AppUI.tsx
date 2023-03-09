import { observer } from 'mobx-react-lite'
import { ActionBar } from './ActionBar'
import { DevTools } from './Devtools'
import { PrimaryTools } from './PrimaryTools'
import { StatusBar } from './StatusBar'

const isDev = window?.logseq?.api?.get_state_from_store?.('ui/developer-mode?') || process.env.NODE_ENV === 'development'

export const AppUI = observer(function AppUI() {
  return (
    <>
      {isDev && <StatusBar />}
      {isDev && <DevTools />}
      <PrimaryTools />
      <ActionBar />
    </>
  )
})
