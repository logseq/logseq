/* eslint-disable @typescript-eslint/ban-ts-comment */
import { reaction } from 'mobx'
import * as React from 'react'
import type { TLReactApp } from '../lib'
import { useApp } from './useApp'

const storingKey = 'logseq.tldraw.camera'

const cacheCamera = (app: TLReactApp) => {
  window.sessionStorage.setItem(
    storingKey + ':' + app.currentPageId,
    JSON.stringify(app.viewport.camera)
  )
}

const loadCamera = (app: TLReactApp) => {
  const camera = JSON.parse(
    window.sessionStorage.getItem(storingKey + ':' + app.currentPageId) ?? 'null'
  )
  if (camera) {
    app.viewport.update(camera)
  } else if (app.selectedIds.size) {
    app.api.zoomToSelection()
  } else {
    app.api.zoomToFit()
  }
}

export function useRestoreCamera(): void {
  const app = useApp()

  React.useEffect(() => {
    reaction(
      () => ({ ...app.viewport.camera }),
      () => cacheCamera(app)
    )
  }, [app.viewport.camera])

  React.useEffect(() => {
    loadCamera(app)
  }, [app])
}
