import {
  getContextBarTranslation,
  HTMLContainer,
  TLContextBarComponent,
  useApp,
} from '@tldraw/react'
import { observer } from 'mobx-react-lite'
import * as Separator from '@radix-ui/react-separator'

import * as React from 'react'
import type { Shape } from '~lib/shapes'
import { getContextBarActionsForTypes as getContextBarActionsForShapes } from './contextBarActionFactory'

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

  const Actions = getContextBarActionsForShapes(shapes)

  return (
    <HTMLContainer centered>
      {Actions.length > 0 && (
        <div
          ref={rContextBar}
          className="tl-toolbar tl-context-bar"
          style={{
            visibility: hidden ? 'hidden' : 'visible',
            pointerEvents: hidden ? 'none' : 'all',
          }}
        >
          {Actions.map((Action, idx) => (
            <React.Fragment key={idx}>
              <Action />
              {idx < Actions.length - 1 && (
                <Separator.Root className="tl-toolbar-separator" orientation="vertical" />
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </HTMLContainer>
  )
}

export const ContextBar = observer(_ContextBar)
