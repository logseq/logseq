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

        group.style.transform = `scale(${zoom}) translateX(${point[0]}px) translateY(${point[1]}px)`
      }),
    []
  )

  return (
    <svg className="tl-absolute tl-overlay" pointerEvents="none">
      <g ref={rGroup} pointerEvents="none">
        {children}
      </g>
    </svg>
  )
})
