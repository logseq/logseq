import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { useApp } from '@tldraw/react'
import { MOD_KEY } from '@tldraw/core'
import { observer } from 'mobx-react-lite'

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
          <div className="tl-menu-right-slot">
            <span className="keyboard-shortcut">
              <code>⇧</code> <code>1</code>
            </span>
          </div>
        </DropdownMenuPrimitive.Item>
        <DropdownMenuPrimitive.Item
          className="tl-menu-item"
          onSelect={preventEvent}
          onClick={app.api.zoomToSelection}
          disabled={app.selectedShapesArray.length === 0}
        >
          Zoom to fit selection
          <div className="tl-menu-right-slot">
            <span className="keyboard-shortcut">
              <code>⇧</code> <code>2</code>
            </span>
          </div>
        </DropdownMenuPrimitive.Item>
        <DropdownMenuPrimitive.Item
          className="tl-menu-item"
          onSelect={preventEvent}
          onClick={app.api.zoomIn}
        >
          Zoom in
          <div className="tl-menu-right-slot">
            <span className="keyboard-shortcut">
              <code>{MOD_KEY}</code> <code>+</code>
            </span>
          </div>
        </DropdownMenuPrimitive.Item>
        <DropdownMenuPrimitive.Item
          className="tl-menu-item"
          onSelect={preventEvent}
          onClick={app.api.zoomOut}
        >
          Zoom out
          <div className="tl-menu-right-slot">
            <span className="keyboard-shortcut">
              <code>{MOD_KEY}</code> <code>-</code>
            </span>
          </div>
        </DropdownMenuPrimitive.Item>
        <DropdownMenuPrimitive.Item
          className="tl-menu-item"
          onSelect={preventEvent}
          onClick={app.api.resetZoom}
        >
          Reset zoom
          <div className="tl-menu-right-slot">
            <span className="keyboard-shortcut">
              <code>⇧</code> <code>0</code>
            </span>
          </div>
        </DropdownMenuPrimitive.Item>
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Root>
  )
})

export default ZoomMenu
