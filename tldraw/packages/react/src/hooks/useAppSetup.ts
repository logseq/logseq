import * as React from 'react'
import type { TLAppPropsWithoutApp, TLAppPropsWithApp } from '../components'
import { type TLReactShape, TLReactApp } from '../lib'

export function useAppSetup<S extends TLReactShape, R extends TLReactApp<S> = TLReactApp<S>>(
  props: TLAppPropsWithoutApp<S, R> | TLAppPropsWithApp<S, R>
): R {
  if ('app' in props) return props.app
  const [app] = React.useState<R>(
    () => new TLReactApp(props.model, props.Shapes, props.Tools, props.readOnly) as R
  )

  React.useLayoutEffect(() => {
    return () => {
      app.dispose()
    }
  }, [app])

  return app
}
