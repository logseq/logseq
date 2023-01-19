import { autorun } from 'mobx'
import { observer } from 'mobx-react-lite'
import * as React from 'react'
import { useRendererContext } from '../../hooks'

interface SVGLayerProps {
  children: React.ReactNode
}

export const SVGLayer = observer(function SVGLayer({ children }: SVGLayerProps) {
  const rGroup = React.useRef<SVGGElement>(null)

  const { viewport } = useRendererContext()

  React.useEffect(
    () =>
      autorun(() => {
        const group = rGroup.current
        if (!group) return

        const { zoom, point } = viewport.camera
        let transform = 'scale('
        transform += zoom
        transform += ') translateX('
        transform += point[0]
        transform += 'px) translateY('
        transform += point[1]
        transform += 'px)'

        group.style.transform = transform
      }),
    []
  )

  return (
    <svg className="tl-absolute tl-overlay" pointerEvents="none" style={{shapeRendering: 'optimizeSpeed', textRendering: viewport.camera.zoom < 0.5 ? 'optimizeSpeed' : 'auto'}}>
      <g ref={rGroup} pointerEvents="none">
        {children}
      </g>
    </svg>
  )
})
