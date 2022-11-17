import { isSafari, modulate } from '@tldraw/core'
import { observer } from 'mobx-react-lite'
import { transparentize } from 'polished'
import React from 'react'
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
    <svg className="tl-grid" version="1.1" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {STEPS.map(([min, mid, _size], i) => {
          const s = _size * size * zoom
          const xo = point[0] * zoom
          const yo = point[1] * zoom
          const gxo = xo > 0 ? xo % s : s + (xo % s)
          const gyo = yo > 0 ? yo % s : s + (yo % s)
          const opacity = zoom < mid ? modulate(zoom, [min, mid], [0, 1]) : 1

          return (
            <pattern
              key={`grid-pattern-${i}`}
              id={`grid-${i}`}
              width={s}
              height={s}
              patternUnits="userSpaceOnUse"
            >
              <circle className={`tl-grid-dot`} cx={gxo} cy={gyo} r={1.5} opacity={opacity} />
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

// Grid is slow to render. Maybe we render it using canvas?
const CanvasGrid = observer(function Grid({ size }: TLGridProps) {
  const {
    viewport: {
      camera: { point, zoom },
      bounds,
    },
  } = useRendererContext()

  const ref = React.useRef<HTMLCanvasElement>(null)

  // Use useEffect will cause the render flickering
  React.useLayoutEffect(() => {
    if (ref.current) {
      const canvas = ref.current
      if (canvas?.getContext) {
        const fillColor = getComputedStyle(canvas)
          .getPropertyValue('--ls-quaternary-background-color')
          .trim()
        const ctx = canvas.getContext('2d')
        if (ctx && fillColor) {
          const { width, height } = canvas
          // fill the canvas with dots
          ctx.clearRect(0, 0, width, height)

          const xo = point[0] * zoom
          const yo = point[1] * zoom

          STEPS.forEach(([min, mid, _size]) => {
            const s = _size * size * zoom
            const gxo = xo > 0 ? xo % s : s + (xo % s)
            const gyo = yo > 0 ? yo % s : s + (yo % s)
            const opacity = zoom < mid ? modulate(zoom, [min, mid], [0, 1], true) : 1
            ctx.fillStyle = transparentize(1 - opacity, fillColor)

            if (opacity < 0.5 || s < 32) return
            for (let i = gyo; i < height; i += s) {
              for (let j = gxo; j < width; j += s) {
                ctx.beginPath()
                ctx.arc(j, i, 1.5, 0, 2 * Math.PI)
                ctx.closePath()
                ctx.fill()
              }
            }
            // Pattern should have better performance, but I cannot make the offset correctly ...
            // for (let i = 0; i < height; i += _size) {
            //   const y = i * _size
            //   for (let j = 0; j < width; j += _size) {
            //     const x = j * _size
            //     ctx.fillRect(x, y, _size, _size)
            //   }
            // }
            // const pattern = document.createElement('canvas').getContext('2d')
            // if (pattern) {
            //   const s = _size * size * zoom
            //   if (s < 1) {
            //     return
            //   }
            //   const xo = point[0] * zoom
            //   const yo = point[1] * zoom
            //   const gxo = xo > 0 ? xo % s : s + (xo % s)
            //   const gyo = yo > 0 ? yo % s : s + (yo % s)
            //   const opacity = zoom < mid ? modulate(zoom, [min, mid], [0, 1]) : 1
            //   pattern.canvas.width = s
            //   pattern.canvas.height = s
            //   pattern.beginPath()
            //   pattern.arc(gxo, gyo, 1.5, 0, 2 * Math.PI)
            //   pattern.fillStyle = transparentize(1 - opacity, fillColor)
            //   pattern.fill()
            //   pattern.closePath()
            //   ctx.fillStyle = ctx.createPattern(pattern.canvas, 'repeat')!
            //   ctx.fillRect(0, 0, width, height)
            // }
          })
        }
      }
    }
  }, [point[0], point[1], zoom, bounds.width, bounds.height])

  return <canvas ref={ref} width={bounds.width} height={bounds.height} className="tl-grid-canvas" />
})

export const Grid = observer(function Grid({ size }: TLGridProps) {
  if (isSafari()) {
    return <CanvasGrid size={size} />
  }
  return <SVGGrid size={size} />
})
