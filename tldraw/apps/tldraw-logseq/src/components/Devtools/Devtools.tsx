import { useApp, useRendererContext } from '@tldraw/react'
import { autorun } from 'mobx'
import { observer } from 'mobx-react-lite'
import React from 'react'
import ReactDOM from 'react-dom'
import type { Shape } from '../../lib'

const printPoint = (point: number[]) => {
  return `[${point.map(d => d.toFixed(2)).join(', ')}]`
}

const HistoryStack = observer(function HistoryStack() {
  const app = useApp<Shape>()
  const anchorRef = React.useRef<HTMLDivElement>()
  const [_, setTick] = React.useState(0)

  React.useEffect(() => {
    anchorRef.current = document.createElement('div')
    anchorRef.current.style.display = 'contents'
    document.body.append(anchorRef.current)
    setTick(tick => tick + 1)
    return () => {
      anchorRef.current?.remove()
    }
  }, [])

  React.useEffect(() => {
    requestIdleCallback(() => {
      anchorRef.current
        ?.querySelector(`[data-item-index="${app.history.pointer}"]`)
        ?.scrollIntoView()
    })
  }, [app.history.pointer])

  return anchorRef.current
    ? ReactDOM.createPortal(
        <div className="fixed z-[1000] left-4 max-w-[400px] top-4 overflow-scroll bg-gray-200 flex gap-2 p-2">
          {app.history.stack.map((item, i) => (
            <div
              data-item-index={i}
              style={{
                background: app.history.pointer === i ? 'pink' : 'grey',
              }}
              key={i}
              onClick={() => app.history.setPointer(i)}
              className="flex items-center rounded-lg px-2 h-[32px] whitespace-nowrap"
            >
              {item.pages[0].nonce}
            </div>
          ))}
        </div>,
        anchorRef.current
      )
    : null
})

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
      <HistoryStack />
    </>
  )
})
