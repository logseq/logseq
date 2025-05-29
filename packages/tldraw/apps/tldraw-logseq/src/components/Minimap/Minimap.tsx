import { deepEqual } from '@tldraw/core'
import { useApp, useMinimapEvents } from '@tldraw/react'
import { reaction } from 'mobx'
import { observer } from 'mobx-react-lite'
import React from 'react'
import { PreviewManager } from '../../lib'
import { TablerIcon } from '../icons'

export const Minimap = observer(function Minimap() {
  const app = useApp()

  const [whiteboardPreviewManager] = React.useState(() => new PreviewManager(app.serialized))
  const [preview, setPreview] = React.useState(() =>
    whiteboardPreviewManager.generatePreviewJsx(app.viewport)
  )

  const [active, setActive] = React.useState(false)

  const events = useMinimapEvents()

  React.useEffect(() => {
    return reaction(
      () => {
        return {
          serialized: app.serialized,
          viewport: app.viewport,
          cameraPoint: app.viewport.camera.point,
        }
      },
      ({ serialized, viewport }, prev) => {
        if (!deepEqual(prev.serialized, serialized)) {
          whiteboardPreviewManager.load(serialized)
        }
        setPreview(whiteboardPreviewManager.generatePreviewJsx(viewport))
      }
    )
  }, [app])

  return (
    <>
      {active && (
        <div className="tl-preview-minimap" {...events}>
          {preview}
        </div>
      )}
      <button
        // className="tl-preview-minimap-toggle"
        data-active={active}
        onClick={() => setActive(a => !a)}
      >
        <TablerIcon name="crosshair2" />
      </button>
    </>
  )
})
