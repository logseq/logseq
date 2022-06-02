import { useRendererContext } from '@tldraw/react'
import { observer } from 'mobx-react-lite'
import React from 'react'
import ReactDOM from 'react-dom'

const printPoint = (point: number[]) => {
  return `[${point.map(d => d.toFixed(2)).join(', ')}]`
}

export const DevTools = observer(() => {
  const {
    viewport: {
      bounds,
      camera: { point, zoom },
    },
    inputs,
  } = useRendererContext()

  const canvasAnchorRef = React.useRef<HTMLElement | null>()
  const statusbarAnchorRef = React.useRef<HTMLElement | null>()

  React.useEffect(() => {
    const canvasAnchor = document.getElementById('tl-dev-tools-canvas-anchor')
    canvasAnchorRef.current = canvasAnchor

    const statusbarAnchor = document.getElementById('tl-statusbar-anchor')
    statusbarAnchorRef.current = statusbarAnchor
  }, [])

  const originPoint = canvasAnchorRef.current
    ? ReactDOM.createPortal(
        <svg className="tl-renderer-dev-tools tl-grid">
          <circle cx={point[0] * zoom} cy={point[1] * zoom} r="4" fill="red" />
        </svg>,
        canvasAnchorRef.current
      )
    : null

  const rendererStatusText = [
    ['Z', zoom.toFixed(2)],
    ['MP', printPoint(inputs.currentPoint)],
    ['MS', printPoint(inputs.currentScreenPoint)],
    ['VP', printPoint(point)],
    ['VBR', printPoint([bounds.maxX, bounds.maxY])],
  ]
    .map(p => p.join(''))
    .join('|')

  const rendererStatus = statusbarAnchorRef.current
    ? ReactDOM.createPortal(
        <div
          style={{
            flex: 1,
          }}
        >
          {rendererStatusText}
        </div>,
        statusbarAnchorRef.current
      )
    : null

  return (
    <>
      {originPoint}
      {rendererStatus}
    </>
  )
})
