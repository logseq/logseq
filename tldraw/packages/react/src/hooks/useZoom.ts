import { autorun } from 'mobx'
import * as React from 'react'
import { useRendererContext } from './useRendererContext'

export function useZoom(ref: React.RefObject<HTMLDivElement>) {
  const { viewport } = useRendererContext()
  React.useLayoutEffect(() => {
    return autorun(() => {
      const { zoom } = viewport.camera
      const container = ref.current
      if (!container) return
      container.style.setProperty('--tl-zoom', zoom.toString())
    })
  }, [])
}
