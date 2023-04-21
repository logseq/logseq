import { autorun } from 'mobx'
import * as React from 'react'
import { useApp } from './useApp'
import { useRendererContext } from './useRendererContext'
import { debounce } from '@tldraw/core'

export function useZoom(ref: React.RefObject<HTMLDivElement>) {
  const { viewport } = useRendererContext()
  const app = useApp()

  React.useLayoutEffect(() => {
    return autorun(() => {
      const debouncedZoom = debounce(() => {
        ref.current?.style.setProperty('--tl-zoom', viewport.camera.zoom.toString())
      }, 200);

      if (app.inputs.state !== 'pinching' && viewport.camera.zoom != null) {
        debouncedZoom()
      }
    })
  }, [])

}
