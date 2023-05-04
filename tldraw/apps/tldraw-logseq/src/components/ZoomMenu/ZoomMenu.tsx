import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { useApp } from '@tldraw/react'
import { KeyboardShortcut } from '../KeyboardShortcut'
import { MOD_KEY } from '@tldraw/core'
import { observer } from 'mobx-react-lite'
import * as React from 'react'

export const ZoomMenu = observer(function ZoomMenu(): JSX.Element {
  const app = useApp()
  const preventEvent = (e: Event) => {
    e.preventDefault()
  }

  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger className="tl-button text-sm px-2 important" id="tl-zoom">
        {(app.viewport.camera.zoom * 100).toFixed(0) + '%'}
      </DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Content
        onCloseAutoFocus={e => e.preventDefault()}
        className="tl-menu"
        id="zoomPopup"
        sideOffset={12}
      >
        <DropdownMenuPrimitive.Item
          className="tl-menu-item"
          onSelect={preventEvent}
          onClick={app.api.zoomToFit}
        >
          Zoom to drawing
          <KeyboardShortcut action="whiteboard/zoom-to-fit" />
        </DropdownMenuPrimitive.Item>
        <DropdownMenuPrimitive.Item
          className="tl-menu-item"
          onSelect={preventEvent}
          onClick={app.api.zoomToSelection}
          disabled={app.selectedShapesArray.length === 0}
        >
          Zoom to fit selection
          <KeyboardShortcut action="whiteboard/zoom-to-selection" />
        </DropdownMenuPrimitive.Item>
        <DropdownMenuPrimitive.Item
          className="tl-menu-item"
          onSelect={preventEvent}
          onClick={app.api.zoomIn}
        >
          Zoom in
          <KeyboardShortcut action="whiteboard/zoom-in" />
        </DropdownMenuPrimitive.Item>
        <DropdownMenuPrimitive.Item
          className="tl-menu-item"
          onSelect={preventEvent}
          onClick={app.api.zoomOut}
        >
          Zoom out
          <KeyboardShortcut action="whiteboard/zoom-out" />
        </DropdownMenuPrimitive.Item>
        <DropdownMenuPrimitive.Item
          className="tl-menu-item"
          onSelect={preventEvent}
          onClick={app.api.resetZoom}
        >
          Reset zoom
          <KeyboardShortcut action="whiteboard/reset-zoom" />
        </DropdownMenuPrimitive.Item>
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Root>
  )
})

export default ZoomMenu
