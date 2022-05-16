/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react'
import { observer } from 'mobx-react-lite'
import type { TLReactShape } from '~lib'
import { useSetup, getAppContext, usePropControl, useAppSetup } from '~hooks'
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
