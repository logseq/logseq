import * as React from 'react'
import type { TLAppPropsWithoutApp, TLAppPropsWithApp } from '../components'
import type { TLReactShape, TLReactApp } from '../lib'

export function usePropControl<S extends TLReactShape, R extends TLReactApp<S> = TLReactApp<S>>(
  app: R,
  props: TLAppPropsWithoutApp<S> | TLAppPropsWithApp<S>
) {
  React.useEffect(() => {
    if (!('model' in props)) return
    if (props.model) app.loadDocumentModel(props.model)
  }, [(props as TLAppPropsWithoutApp<S>).model])
}
