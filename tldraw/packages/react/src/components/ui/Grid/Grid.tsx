import { modulate, clamp } from '@tldraw/core'
import { observer } from 'mobx-react-lite'
import { useRendererContext } from '../../../hooks'
import type { TLGridProps } from '../../../types'

const STEPS = [
  [-1, 0.15, 64],
  [0.05, 0.375, 16],
  [0.15, 1, 4],
  [0.7, 2.5, 1],
]

const SVGGrid = observer(function CanvasGrid({ size }: TLGridProps) {
  const {
    viewport: {
      camera: { point, zoom },
    },
  } = useRendererContext()
  return (
    <svg
      className="tl-grid"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      data-html2canvas-ignore="true"
    >
      <defs>
        {STEPS.map(([min, mid, _size], i) => {
          const s = _size * size * zoom
          const xo = point[0] * zoom
          const yo = point[1] * zoom
          const gxo = xo > 0 ? xo % s : s + (xo % s)
          const gyo = yo > 0 ? yo % s : s + (yo % s)
          const opacity = modulate(zoom, [min, mid], [0, 1])

          const hide = opacity > 2 || opacity < 0.1

          return (
            <pattern
              key={`grid-pattern-${i}`}
              id={`grid-${i}`}
              width={s}
              height={s}
              patternUnits="userSpaceOnUse"
            >
              {!hide && (
                <circle
                  className={`tl-grid-dot`}
                  cx={gxo}
                  cy={gyo}
                  r={1.5}
                  opacity={clamp(opacity, 0, 1)}
                />
              )}
            </pattern>
          )
        })}
      </defs>
      {STEPS.map((_, i) => (
        <rect key={`grid-rect-${i}`} width="100%" height="100%" fill={`url(#grid-${i})`} />
      ))}
    </svg>
  )
})

export const Grid = observer(function Grid({ size }: TLGridProps) {
  return <SVGGrid size={size} />
})
