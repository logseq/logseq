import { useApp } from '@tldraw/react'
import { KeyboardShortcut } from '../KeyboardShortcut'
import { observer } from 'mobx-react-lite'

// @ts-ignore
const LSUI = window.LSUI

export const ZoomMenu = observer(function ZoomMenu(): JSX.Element {
  const app = useApp()
  const preventEvent = (e: Event) => {
    e.preventDefault()
  }

  return (
    <LSUI.DropdownMenu>
      <LSUI.DropdownMenuTrigger className="tl-button text-sm px-2 important" id="tl-zoom">
        {(app.viewport.camera.zoom * 100).toFixed(0) + '%'}
      </LSUI.DropdownMenuTrigger>
      <LSUI.DropdownMenuContent
        onCloseAutoFocus={e => e.preventDefault()}
        id="zoomPopup"
        sideOffset={12}
      >
        <LSUI.DropdownMenuItem
          onSelect={preventEvent}
          onClick={app.api.zoomToFit}
        >
          Zoom to drawing
          <KeyboardShortcut action="whiteboard/zoom-to-fit" />
        </LSUI.DropdownMenuItem>
        <LSUI.DropdownMenuItem
          onSelect={preventEvent}
          onClick={app.api.zoomToSelection}
          disabled={app.selectedShapesArray.length === 0}
        >
          Zoom to fit selection
          <KeyboardShortcut action="whiteboard/zoom-to-selection" />
        </LSUI.DropdownMenuItem>
        <LSUI.DropdownMenuItem
          onSelect={preventEvent}
          onClick={app.api.zoomIn}
        >
          Zoom in
          <KeyboardShortcut action="whiteboard/zoom-in" />
        </LSUI.DropdownMenuItem>
        <LSUI.DropdownMenuItem
          onSelect={preventEvent}
          onClick={app.api.zoomOut}
        >
          Zoom out
          <KeyboardShortcut action="whiteboard/zoom-out" />
        </LSUI.DropdownMenuItem>
        <LSUI.DropdownMenuItem
          onSelect={preventEvent}
          onClick={app.api.resetZoom}
        >
          Reset zoom
          <KeyboardShortcut action="whiteboard/reset-zoom" />
        </LSUI.DropdownMenuItem>
      </LSUI.DropdownMenuContent>
    </LSUI.DropdownMenu>
  )
})

export default ZoomMenu
