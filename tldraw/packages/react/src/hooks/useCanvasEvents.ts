import * as React from 'react'
import { useRendererContext } from '~hooks'
import { TLTargetType } from '@tldraw/core'
import type { TLReactCustomEvents } from '~types'
import { useApp } from './useApp'

export function useCanvasEvents() {
  const app = useApp()
  const { callbacks } = useRendererContext()

  const events = React.useMemo(() => {
    const onPointerMove: TLReactCustomEvents['pointer'] = e => {
      const { order = 0 } = e
      callbacks.onPointerMove?.({ type: TLTargetType.Canvas, order }, e)
    }

    const onPointerDown: TLReactCustomEvents['pointer'] = e => {
      const { order = 0 } = e
      if (!order) e.currentTarget?.setPointerCapture(e.pointerId)
      callbacks.onPointerDown?.({ type: TLTargetType.Canvas, order }, e)
    }

    const onPointerUp: TLReactCustomEvents['pointer'] = e => {
      const { order = 0 } = e
      if (!order) e.currentTarget?.releasePointerCapture(e.pointerId)
      callbacks.onPointerUp?.({ type: TLTargetType.Canvas, order }, e)
    }

    const onPointerEnter: TLReactCustomEvents['pointer'] = e => {
      const { order = 0 } = e
      callbacks.onPointerEnter?.({ type: TLTargetType.Canvas, order }, e)
    }

    const onPointerLeave: TLReactCustomEvents['pointer'] = e => {
      const { order = 0 } = e
      callbacks.onPointerLeave?.({ type: TLTargetType.Canvas, order }, e)
    }

    const onDrop = async (e: React.DragEvent<Element>) => {
      e.preventDefault()
      if (!e.dataTransfer.files?.length) return
      const point = [e.clientX, e.clientY]
      app.dropFiles(e.dataTransfer.files, point)
    }

    const onDragOver = (e: React.DragEvent<Element>) => {
      e.preventDefault()
    }

    return {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerEnter,
      onPointerLeave,
      onDrop,
      onDragOver,
    }
  }, [callbacks])

  return events
}

function fileToBase64(file: Blob): Promise<string | ArrayBuffer | null> {
  return new Promise((resolve, reject) => {
    if (file) {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = error => reject(error)
      reader.onabort = error => reject(error)
    }
  })
}

function getSizeFromSrc(dataURL: string): Promise<number[]> {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => resolve([img.width, img.height])
    img.src = dataURL
  })
}
