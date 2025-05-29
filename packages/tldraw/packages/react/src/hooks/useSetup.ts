import * as React from 'react'
import type { TLAppPropsWithApp, TLAppPropsWithoutApp } from '../components'
import type { TLReactApp, TLReactShape } from '../lib'

declare const window: Window & { tlapps?: Record<string, TLReactApp<any>> }

export function useSetup<
  S extends TLReactShape = TLReactShape,
  R extends TLReactApp<S> = TLReactApp<S>
>(app: R, props: TLAppPropsWithApp<S, R> | TLAppPropsWithoutApp<S, R>) {
  const {
    onPersist,
    onError,
    onMount,
    onCreateAssets,
    onCreateShapes,
    onDeleteAssets,
    onDeleteShapes,
    onDrop,
    onPaste,
    onCopy,
    onCanvasDBClick,
  } = props

  React.useLayoutEffect(() => {
    const unsubs: (() => void)[] = []
    if (!app) return
    if (typeof window !== undefined) {
      window['tlapps'] = window['tlapps'] || {}
      window['tlapps'][app.uuid] = app
    }
    if (onMount) onMount(app, null)
    return () => {
      unsubs.forEach(unsub => unsub())
      if (typeof window !== undefined && window['tlapps']) {
        delete window['tlapps'][app.uuid]
      }
    }
  }, [app])

  React.useLayoutEffect(() => {
    const unsubs: (() => void)[] = []
    if (onPersist) unsubs.push(app.subscribe('persist', onPersist))
    if (onError) unsubs.push(app.subscribe('error', onError))
    if (onCreateShapes) unsubs.push(app.subscribe('create-shapes', onCreateShapes))
    if (onCreateAssets) unsubs.push(app.subscribe('create-assets', onCreateAssets))
    if (onDeleteShapes) unsubs.push(app.subscribe('delete-shapes', onDeleteShapes))
    if (onDeleteAssets) unsubs.push(app.subscribe('delete-assets', onDeleteAssets))
    if (onDrop) unsubs.push(app.subscribe('drop', onDrop))
    if (onPaste) unsubs.push(app.subscribe('paste', onPaste))
    if (onCopy) unsubs.push(app.subscribe('copy', onCopy))
    if (onCanvasDBClick) unsubs.push(app.subscribe('canvas-dbclick', onCanvasDBClick))
    // Kind of unusual, is this the right pattern?
    return () => unsubs.forEach(unsub => unsub())
  }, [app, onPersist, onError])
}
