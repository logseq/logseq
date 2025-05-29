import { observer } from 'mobx-react-lite'
import * as React from 'react'
import { useRendererContext } from '../../hooks'

interface HTMLLayerProps {
  children: React.ReactNode
}

export const HTMLLayer = observer(function HTMLLayer({ children }: HTMLLayerProps) {
  const rLayer = React.useRef<HTMLDivElement>(null)

  const { viewport } = useRendererContext()
  const layer = rLayer.current

  const { zoom, point } = viewport.camera

  React.useEffect(() => {
    if (!layer) return

    layer.style.transform = `scale(${zoom}) translate3d(${point[0]}px, ${point[1]}px, 0)`
  }, [zoom, point, layer])

  return (
    <div ref={rLayer} className="tl-absolute tl-layer">
      {children}
    </div>
  )
})
