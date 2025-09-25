import * as React from 'react'
import type { TLReactApp, TLReactShape } from '../lib'

const contextMap: Record<string, React.Context<any>> = {}

export function getAppContext<
  S extends TLReactShape = TLReactShape,
  R extends TLReactApp<S> = TLReactApp<S>
>(id = 'noid'): React.Context<R> {
  if (!contextMap[id]) {
    contextMap[id] = React.createContext({} as R)
  }
  return contextMap[id]
}

export function useApp<
  S extends TLReactShape = TLReactShape,
  R extends TLReactApp<S> = TLReactApp<S>
>(id = 'noid'): R {
  return React.useContext(getAppContext<S, R>(id))
}
