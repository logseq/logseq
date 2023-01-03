import { useApp } from '@tldraw/react'

export function useCameraMovingRef() {
  const app = useApp()
  return app.inputs.state === 'panning' || app.inputs.state === 'pinching'
}
