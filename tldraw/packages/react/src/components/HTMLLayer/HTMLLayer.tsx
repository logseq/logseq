import { autorun } from 'mobx'
import { observer } from 'mobx-react-lite'
import * as React from 'react'
import { useRendererContext } from '../../hooks'
import { useApp } from '@tldraw/react'

interface HTMLLayerProps {
  children: React.ReactNode
}

export const HTMLLayer = observer(function HTMLLayer({ children }: HTMLLayerProps) {
  const rLayer = React.useRef<HTMLDivElement>(null)
  const app = useApp()

  const { viewport } = useRendererContext()
  const layer = rLayer.current

  const { zoom, point } = viewport.camera

  React.useEffect(
    () => {
        if (!layer) return

        let transform = 'scale('
        transform += zoom
        transform += ') translateX('
        transform += point[0]
        transform += 'px) translateY('
        transform += point[1]
        transform += 'px)'

        layer.style.transform = transform
      },
    [zoom, point, layer]
  )

  return (
    <div ref={rLayer} className="tl-absolute tl-layer" style={{willChange: 'transform',  textRendering: viewport.camera.zoom < 0.5 ? 'optimizeSpeed' : 'auto'}}>
      {children}
    </div>
  )
})
