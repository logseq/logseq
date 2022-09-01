import { useApp } from '@tldraw/react'
import { MOD_KEY } from '@tldraw/core'
import { observer } from 'mobx-react-lite'
import * as React from 'react'

import * as ReactContextMenu from '@radix-ui/react-context-menu'

const preventDefault = (e: Event) => e.stopPropagation()

interface ContextMenuProps {
  children: React.ReactNode
  collisionRef: React.RefObject<HTMLDivElement>
}

export const ContextMenu = observer(function ContextMenu({
  children,
  collisionRef,
}: ContextMenuProps) {
  const app = useApp()
  const rContent = React.useRef<HTMLDivElement>(null)

  const runAndTransition = (f: Function) => {
    f()
    app.transition('select')
  }

  return (
    <ReactContextMenu.Root>
      <ReactContextMenu.Trigger>{children}</ReactContextMenu.Trigger>
      <ReactContextMenu.Content
        className="tl-context-menu"
        ref={rContent}
        onEscapeKeyDown={() => app.transition('select')}
        collisionBoundary={collisionRef.current}
        asChild
        tabIndex={-1}
      >
        <div>
          {app.selectedShapes?.size > 0 && (
            <>
              <ReactContextMenu.Item
                className="tl-context-menu-button"
                onClick={() => runAndTransition(app.cut)}
              >
                Cut
                <div className="tl-context-menu-right-slot">
                  <span className="keyboard-shortcut">
                    <code>{MOD_KEY}</code> <code>X</code>
                  </span>
                </div>
              </ReactContextMenu.Item>
              <ReactContextMenu.Item
                className="tl-context-menu-button"
                onClick={() => runAndTransition(app.copy)}
              >
                Copy
                <div className="tl-context-menu-right-slot">
                  <span className="keyboard-shortcut">
                    <code>{MOD_KEY}</code> <code>C</code>
                  </span>
                </div>
              </ReactContextMenu.Item>
            </>
          )}
          <ReactContextMenu.Item
            className="tl-context-menu-button"
            onClick={() => runAndTransition(app.paste)}
          >
            Paste
            <div className="tl-context-menu-right-slot">
              <span className="keyboard-shortcut">
                <code>{MOD_KEY}</code> <code>V</code>
              </span>
            </div>
          </ReactContextMenu.Item>
          <ReactContextMenu.Separator className="menu-separator" />
          <ReactContextMenu.Item
            className="tl-context-menu-button"
            onClick={() => runAndTransition(app.api.selectAll)}
          >
            Select all
            <div className="tl-context-menu-right-slot">
              <span className="keyboard-shortcut">
                <code>{MOD_KEY}</code> <code>A</code>
              </span>
            </div>
          </ReactContextMenu.Item>
          {app.selectedShapes?.size > 1 && (
            <ReactContextMenu.Item
              className="tl-context-menu-button"
              onClick={() => runAndTransition(app.api.deselectAll)}
            >
              Deselect all
            </ReactContextMenu.Item>
          )}
          {app.selectedShapes?.size > 0 && (
            <>
              <ReactContextMenu.Item
                className="tl-context-menu-button"
                onClick={() => runAndTransition(app.api.deleteShapes)}
              >
                Delete
                <div className="tl-context-menu-right-slot">
                  <span className="keyboard-shortcut">
                    <code>Del</code>
                  </span>
                </div>
              </ReactContextMenu.Item>
              {app.selectedShapes?.size > 1 && (
                <>
                  <ReactContextMenu.Separator className="menu-separator" />
                  <ReactContextMenu.Item
                    className="tl-context-menu-button"
                    onClick={() => runAndTransition(app.flipHorizontal)}
                  >
                    Flip horizontally
                  </ReactContextMenu.Item>
                  <ReactContextMenu.Item
                    className="tl-context-menu-button"
                    onClick={() => runAndTransition(app.flipVertical)}
                  >
                    Flip vertically
                  </ReactContextMenu.Item>
                </>
              )}
              <ReactContextMenu.Separator className="menu-separator" />
              <ReactContextMenu.Item
                className="tl-context-menu-button"
                onClick={() => runAndTransition(app.bringToFront)}
              >
                Move to front
                <div className="tl-context-menu-right-slot">
                  <span className="keyboard-shortcut">
                    <code>⇧</code> <code>]</code>
                  </span>
                </div>
              </ReactContextMenu.Item>
              <ReactContextMenu.Item
                className="tl-context-menu-button"
                onClick={() => runAndTransition(app.sendToBack)}
              >
                Move to back
                <div className="tl-context-menu-right-slot">
                  <span className="keyboard-shortcut">
                    <code>⇧</code> <code>[</code>
                  </span>
                </div>
              </ReactContextMenu.Item>
            </>
          )}
        </div>
      </ReactContextMenu.Content>
    </ReactContextMenu.Root>
  )
})
