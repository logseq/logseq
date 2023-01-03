/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react'
import type { TLRendererContext } from '../components'
import type { TLReactShape } from '../lib'

export const contextMap: Record<string, React.Context<TLRendererContext<any>>> = {}

export function getRendererContext<S extends TLReactShape = TLReactShape>(
  id = 'noid'
): React.Context<TLRendererContext<S>> {
  if (!contextMap[id]) {
    contextMap[id] = React.createContext({} as TLRendererContext<S>)
  }
  return contextMap[id]
}

export function useRendererContext<S extends TLReactShape = TLReactShape>(
  id = 'noid'
): TLRendererContext<S> {
  return React.useContext(getRendererContext<S>(id))
}
