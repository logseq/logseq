/* eslint-disable @typescript-eslint/no-explicit-any */
import { observer } from 'mobx-react-lite'
import { getAppContext, useAppSetup, usePropControl, useSetup } from '../hooks'
import type { TLReactShape } from '../lib'
import type { TLAppPropsWithApp, TLAppPropsWithoutApp } from './App'

export const AppProvider = observer(function App<S extends TLReactShape>(
  props: TLAppPropsWithoutApp<S> | TLAppPropsWithApp<S>
): JSX.Element {
  const app = useAppSetup(props)
  const context = getAppContext<S>(props.id)
  usePropControl(app, props)
  useSetup(app, props)
  return <context.Provider value={app}>{props.children}</context.Provider>
})
