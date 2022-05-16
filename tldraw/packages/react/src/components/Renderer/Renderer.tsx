import * as React from 'react'
import type { TLReactShape } from '~lib'
import { Canvas, RendererContext, TLCanvasProps } from '~components'
import type { TLRendererContextProps } from './RendererContext'

export interface TLRendererProps<S extends TLReactShape>
  extends TLRendererContextProps<S>,
    Partial<TLCanvasProps<S>> {}

export function Renderer<S extends TLReactShape>({
  viewport,
  inputs,
  callbacks,
  components,
  ...rest
}: TLRendererProps<S>) {
  return (
    <RendererContext
      id={rest.id}
      viewport={viewport}
      inputs={inputs}
      callbacks={callbacks}
      components={components}
      meta={rest.meta}
    >
      <Canvas {...rest} />
    </RendererContext>
  )
}
