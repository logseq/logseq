/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useApp } from '@tldraw/react'
import { observer } from 'mobx-react-lite'
import * as React from 'react'

import * as ReactContextMenu from '@radix-ui/react-context-menu'

const preventDefault = (e: Event) => e.stopPropagation()

interface ContextMenuProps {
  children: React.ReactNode
}

export const ContextMenu = observer(function ContextMenu({ children }: ContextMenuProps) {
  const app = useApp()
  const rContent = React.useRef<HTMLDivElement>(null)

  return (
    <ReactContextMenu.Root>
      <ReactContextMenu.Trigger data-state={app.showContextMenu ? "open" : "closed"}>{children}</ReactContextMenu.Trigger>
      <ReactContextMenu.Content className="tl-context-menu" data-state={app.showContextMenu ? "open" : "closed"}
      ref={rContent}
      onEscapeKeyDown={preventDefault}
      asChild
      tabIndex={-1}>
        <div>
          <ReactContextMenu.Item className="tl-context-menu-button" onClick={app.copy}>
            Copy
            <div className="tl-context-menu-right-slot">⌘+C</div>
          </ReactContextMenu.Item>
          <ReactContextMenu.Item className="tl-context-menu-button" onClick={app.paste}>
            Paste
            <div className="tl-context-menu-right-slot">⌘+V</div>
          </ReactContextMenu.Item>
          <ReactContextMenu.Item className="tl-context-menu-button" onClick={app.api.selectAll}>
            Select All
            <div className="tl-context-menu-right-slot">⌘+A</div>
          </ReactContextMenu.Item>
          {/*TODO: Add paste to this menu*/}
          {app.selectedShapes && app.selectedShapes.size > 0 && (
            <>
              <ReactContextMenu.Item
                className="tl-context-menu-button"
                onClick={() => {
                  app.api.deleteShapes()
                }}>
                Delete
                <div className="tl-context-menu-right-slot">Delete</div>
              </ReactContextMenu.Item>
              <ReactContextMenu.Item className="tl-context-menu-button">
                  Duplicate
                  <div className="tl-context-menu-right-slot">⌘+D</div>
                </ReactContextMenu.Item>
              <ReactContextMenu.Item
                className="tl-context-menu-button"
                onClick={() => {
                  app.flipHorizontal(app.selectedShapesArray)
                }}>
                  Flip Horizontally
              </ReactContextMenu.Item>
              <ReactContextMenu.Item
                  className="tl-context-menu-button"
                  onClick={() => {
                    app.flipVertical(app.selectedShapesArray)
                  }}>
                  Flip Vertically
              </ReactContextMenu.Item>
              <ReactContextMenu.Item
                className="tl-context-menu-button"
                onClick={() => {
                  app.bringToFront(app.selectedShapesArray)
                }}
              >
                Move to Front
                <div className="tl-context-menu-right-slot">⇧+]</div>
              </ReactContextMenu.Item>
              <ReactContextMenu.Item
                className="tl-context-menu-button"
                onClick={() => {
                  app.bringForward(app.selectedShapesArray)
                }}
              >
                Move forwards
                <div className="tl-context-menu-right-slot">]</div>
              </ReactContextMenu.Item>
              <ReactContextMenu.Item
                className="tl-context-menu-button"
                onClick={() => {
                  app.sendToBack(app.selectedShapesArray)
                }}
              >
                Move to back
                <div className="tl-context-menu-right-slot">⇧+[</div>
              </ReactContextMenu.Item>
              <ReactContextMenu.Item
                className="tl-context-menu-button"
                onClick={() => {
                  app.sendBackward(app.selectedShapesArray)
                }}
              >
                Move backwards
                <div className="tl-context-menu-right-slot">[</div>
              </ReactContextMenu.Item>
            </>
          )}
        </div>
      </ReactContextMenu.Content>
    </ReactContextMenu.Root>
  )
})
