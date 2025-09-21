import * as React from 'react'
import { observer } from 'mobx-react-lite'
import type { TLBounds } from '@tldraw/core'

/* eslint-disable @typescript-eslint/no-non-null-assertion */
interface ContainerProps extends React.HTMLProps<HTMLDivElement> {
  id?: string
  bounds: TLBounds
  scale?: number[]
  zIndex?: number
  rotation?: number
  className?: string
  children: React.ReactNode
}

export const Container = observer<ContainerProps>(function Container({
  id,
  bounds,
  zIndex,
  rotation = 0,
  className = '',
  children,
  ...props
}) {
  const rBounds = React.useRef<HTMLDivElement>(null)

  React.useLayoutEffect(() => {
    const elm = rBounds.current!
    elm.style.transform = `translate(
        calc(${bounds.minX}px - var(--tl-padding)),
        calc(${bounds.minY}px - var(--tl-padding)))
        rotate(${rotation + (bounds.rotation || 0)}rad)`
  }, [bounds.minX, bounds.minY, rotation, bounds.rotation])

  React.useLayoutEffect(() => {
    const elm = rBounds.current!
    elm.style.width = `calc(${Math.floor(bounds.width)}px + (var(--tl-padding) * 2))`
    elm.style.height = `calc(${Math.floor(bounds.height)}px + (var(--tl-padding) * 2))`
  }, [bounds.width, bounds.height])

  React.useLayoutEffect(() => {
    const elm = rBounds.current!
    if (zIndex !== undefined) elm.style.zIndex = zIndex.toString()
  }, [zIndex])

  return (
    <div
      id={id}
      ref={rBounds}
      className={`tl-positioned ${className}`}
      aria-label="container"
      {...props}
    >
      {children}
    </div>
  )
})
