import React from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { useApp } from '@tldraw/react'
import { observer } from 'mobx-react-lite'

export const ZoomMenu = observer(function ZoomMenu(): JSX.Element {
  const app = useApp()
  const preventEvent = (e: Event) => {
    e.preventDefault()
  }
  return (
    <div>
      <DropdownMenuPrimitive.Root>
        <DropdownMenuPrimitive.Trigger>
          <button>{(app.viewport.camera.zoom * 100).toFixed(0) + '%'} </button>
        </DropdownMenuPrimitive.Trigger>
        <DropdownMenuPrimitive.Content
          className="dropdown-menu-button"
          id="zoomPopup"
          sideOffset={12}
        >
          <DropdownMenuPrimitive.Arrow style={{ fill: 'white' }}></DropdownMenuPrimitive.Arrow>
          <DropdownMenuPrimitive.Item
            className="dropdown-item"
            onSelect={preventEvent}
            onClick={app.api.zoomToFit}
          >
            Zoom to Fit <div className="right-slot"></div>
          </DropdownMenuPrimitive.Item>
          <DropdownMenuPrimitive.Item
            className="dropdown-item"
            onSelect={preventEvent}
            onClick={app.api.zoomToSelection}
          >
            Zoom to Selection <div className="right-slot">⌘+Minus</div>
          </DropdownMenuPrimitive.Item>
          <DropdownMenuPrimitive.Item
            className="dropdown-item"
            onSelect={preventEvent}
            onClick={app.api.zoomIn}
          >
            Zoom In <div className="right-slot">⌘+Plus</div>
          </DropdownMenuPrimitive.Item>
          <DropdownMenuPrimitive.Item
            className="dropdown-item"
            onSelect={preventEvent}
            onClick={app.api.zoomOut}
          >
            Zoom Out <div className="right-slot">⌘+Minus</div>
          </DropdownMenuPrimitive.Item>
          <DropdownMenuPrimitive.Item
            className="dropdown-item"
            onSelect={preventEvent}
            onClick={app.api.resetZoom}
          >
            Reset Zoom <div className="right-slot">⇧+0</div>
          </DropdownMenuPrimitive.Item>
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Root>
    </div>
  )
})

export default ZoomMenu
