/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react'
import { autorun } from 'mobx'
import { observer } from 'mobx-react-lite'
import { EMPTY_OBJECT, TLEventHandlers, TLInputs, TLViewport } from '@tldraw/core'
import { getRendererContext } from '../../hooks'
import type { TLReactShape } from '../../lib'
import type { TLReactEventMap, TLReactComponents } from '../../types'

import {
  SelectionBackground as _SelectionBackground,
  SelectionForeground as _SelectionForeground,
  SelectionDetail as _SelectionDetail,
  Grid as _Grid,
  Brush as _Brush,
  Handle as _Handle,
  DirectionIndicator as _DirectionIndicator,
} from '../../components'

type RendererCallbacks<S extends TLReactShape = TLReactShape> = Partial<
  TLEventHandlers<S, TLReactEventMap>
>

export interface TLRendererContextProps<S extends TLReactShape = TLReactShape> {
  id?: string
  viewport: TLViewport
  inputs: TLInputs<TLReactEventMap>
  callbacks?: RendererCallbacks<S>
  components?: Partial<TLReactComponents<S>>
  meta?: any
  children?: React.ReactNode
}

export interface TLRendererContext<S extends TLReactShape = TLReactShape> {
  id: string
  viewport: TLViewport
  inputs: TLInputs<TLReactEventMap>
  callbacks: RendererCallbacks<S>
  components: Partial<TLReactComponents<S>>
  meta: any
}

export const RendererContext = observer(function App<S extends TLReactShape>({
  id = 'noid',
  viewport,
  inputs,
  callbacks = EMPTY_OBJECT,
  meta = EMPTY_OBJECT,
  components = EMPTY_OBJECT,
  children,
}: TLRendererContextProps<S>): JSX.Element {
  const [currentContext, setCurrentContext] = React.useState<TLRendererContext<S>>(() => {
    const {
      Brush,
      ContextBar,
      DirectionIndicator,
      Grid,
      Handle,
      SelectionBackground,
      SelectionDetail,
      SelectionForeground,
      ...rest
    } = components

    return {
      id,
      viewport,
      inputs,
      callbacks,
      meta,
      components: {
        ...rest,
        Brush: Brush === null ? undefined : _Brush,
        ContextBar,
        DirectionIndicator: DirectionIndicator === null ? undefined : _DirectionIndicator,
        Grid: Grid === null ? undefined : _Grid,
        Handle: Handle === null ? undefined : _Handle,
        SelectionBackground: SelectionBackground === null ? undefined : _SelectionBackground,
        SelectionDetail: SelectionDetail === null ? undefined : _SelectionDetail,
        SelectionForeground: SelectionForeground === null ? undefined : _SelectionForeground,
      },
    }
  })

  React.useLayoutEffect(() => {
    const {
      Brush,
      ContextBar,
      DirectionIndicator,
      Grid,
      Handle,
      SelectionBackground,
      SelectionDetail,
      SelectionForeground,
      ...rest
    } = components

    return autorun(() => {
      setCurrentContext({
        id,
        viewport,
        inputs,
        callbacks,
        meta,
        components: {
          ...rest,
          Brush: Brush === null ? undefined : _Brush,
          ContextBar,
          DirectionIndicator: DirectionIndicator === null ? undefined : _DirectionIndicator,
          Grid: Grid === null ? undefined : _Grid,
          Handle: Handle === null ? undefined : _Handle,
          SelectionBackground: SelectionBackground === null ? undefined : _SelectionBackground,
          SelectionDetail: SelectionDetail === null ? undefined : _SelectionDetail,
          SelectionForeground: SelectionForeground === null ? undefined : _SelectionForeground,
        },
      })
    })
  }, [])

  const context = getRendererContext<S>(id)

  return <context.Provider value={currentContext}>{children}</context.Provider>
})
