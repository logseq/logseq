import { autorun } from 'mobx'
import * as React from 'react'
import { useApp } from './useApp'
import { useRendererContext } from './useRendererContext'

export function useZoom(ref: React.RefObject<HTMLDivElement>) {
  const { viewport } = useRendererContext()
  const app = useApp()
  React.useLayoutEffect(() => {
    return autorun(() => {
      const zoom = viewport.camera.zoom
      if (app.inputs.state !== 'pinching') {
        ref.current?.style.setProperty('--tl-zoom', zoom.toString())
      }
    })
  }, [])
}
