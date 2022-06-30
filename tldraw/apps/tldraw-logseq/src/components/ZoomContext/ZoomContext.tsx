import * as React from 'react'
import {
  HTMLContainer,
  TLContextBarComponent,
  useApp,
  getContextBarTranslation,
} from '@tldraw/react'
import { observer } from 'mobx-react-lite'
import type { TextShape, PolygonShape, Shape } from '~lib/shapes'

const _ZoomContext = () => {
  const app = useApp()
  const rSize = React.useRef<[number, number] | null>(null)
  const rContextBar = React.useRef<HTMLDivElement>(null)

  

  if (!app) return null



  return (
    <HTMLContainer centered>
      <div ref={rContextBar} className="contextbar">
        <label>Hi</label>
      </div>
    </HTMLContainer>
  )
}

export const ZoomContext = observer(_ZoomContext)
