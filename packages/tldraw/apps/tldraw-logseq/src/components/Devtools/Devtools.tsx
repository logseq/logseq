import { useRendererContext } from '@tldraw/react'
import { observer } from 'mobx-react-lite'
import React from 'react'
import ReactDOM from 'react-dom'

const printPoint = (point: number[]) => {
  return `[${point.map(d => d?.toFixed(2) ?? '-').join(', ')}]`
}

export const DevTools = observer(() => {
  const {
    viewport: {
      bounds,
      camera: { point, zoom },
    },
    inputs,
  } = useRendererContext()

  const statusbarAnchorRef = React.useRef<HTMLElement | null>()

  React.useEffect(() => {
    const statusbarAnchor = document.getElementById('tl-statusbar-anchor')
    statusbarAnchorRef.current = statusbarAnchor
  }, [])

  const rendererStatusText = [
    ['Z', zoom?.toFixed(2) ?? 'null'],
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
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {rendererStatusText}
        </div>,
        statusbarAnchorRef.current
      )
    : null

  return (
    <>
      {rendererStatus}
    </>
  )
})
