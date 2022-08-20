import {
  getContextBarTranslation,
  HTMLContainer,
  TLContextBarComponent,
  useApp,
} from '@tldraw/react'
import { observer } from 'mobx-react-lite'
import * as React from 'react'
import type { Shape } from '~lib/shapes'
import { getContextBarActionsForTypes } from './contextBarActionFactory'

const _ContextBar: TLContextBarComponent<Shape> = ({ shapes, offsets, hidden }) => {
  const app = useApp()
  const rSize = React.useRef<[number, number] | null>(null)
  const rContextBar = React.useRef<HTMLDivElement>(null)

  React.useLayoutEffect(() => {
    setTimeout(() => {
      const elm = rContextBar.current
      if (!elm) return
      const { offsetWidth, offsetHeight } = elm
      rSize.current = [offsetWidth, offsetHeight]
    })
  })

  React.useLayoutEffect(() => {
    const elm = rContextBar.current
    if (!elm) return
    const size = rSize.current ?? [0, 0]
    const [x, y] = getContextBarTranslation(size, { ...offsets, bottom: offsets.bottom - 32 })
    elm.style.setProperty('transform', `translateX(${x}px) translateY(${y}px)`)
  }, [offsets])

  if (!app) return null

  const Actions = getContextBarActionsForTypes(shapes.map(s => s.props.type))

  return (
    <HTMLContainer centered>
      {Actions.length > 0 && (
        <div
          ref={rContextBar}
          className="tl-contextbar"
          style={{ pointerEvents: hidden ? 'none' : 'all' }}
        >
          {Actions.map((Action, idx) => (
            <Action key={idx} />
          ))}
        </div>
      )}
    </HTMLContainer>
  )
}

export const ContextBar = observer(_ContextBar)
