import { useApp } from '@tldraw/react'
import { MOD_KEY} from '@tldraw/core'
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
    <ReactContextMenu.Root onOpenChange={state => {if (!state) app.transition('select')}}>
      <ReactContextMenu.Trigger>{children}</ReactContextMenu.Trigger>
      <ReactContextMenu.Portal>
        <ReactContextMenu.Content className="tl-context-menu"
        ref={rContent}
        onEscapeKeyDown={preventDefault}
        asChild
        tabIndex={-1}
        >
          <div>
            {app.selectedShapes?.size > 0 && (
              <>
                <ReactContextMenu.Item
                  className="tl-context-menu-button"
                  onClick={() => app.copy()}>
                    Copy
                    <div className="tl-context-menu-right-slot">
                      <span className="keyboard-shortcut"><code>{MOD_KEY}</code> <code>C</code></span>
                    </div>
                </ReactContextMenu.Item>
              </>
            )}
            <ReactContextMenu.Item
              className="tl-context-menu-button"
              onClick={() => app.paste()}>
                Paste
                <div className="tl-context-menu-right-slot">
                  <span className="keyboard-shortcut"><code>{MOD_KEY}</code> <code>V</code></span>
                </div>
            </ReactContextMenu.Item>
            <ReactContextMenu.Separator className="menu-separator"/>
            <ReactContextMenu.Item
              className="tl-context-menu-button"
              onClick={() => app.api.selectAll()}>
                Select All
              <div className="tl-context-menu-right-slot">
                <span className="keyboard-shortcut"><code>{MOD_KEY}</code> <code>A</code></span>
              </div>
            </ReactContextMenu.Item>
            {app.selectedShapes?.size > 1 && (
              <ReactContextMenu.Item
                className="tl-context-menu-button"
                onClick={() => app.api.deselectAll()}>
                  Deselect All
              </ReactContextMenu.Item>
            )}
            {app.selectedShapes?.size > 0 && (
              <>
                <ReactContextMenu.Item
                  className="tl-context-menu-button"
                  onClick={() => app.api.deleteShapes()}>
                  Delete
                  <div className="tl-context-menu-right-slot">
                    <span className="keyboard-shortcut"><code>Del</code></span>
                  </div>
                </ReactContextMenu.Item>
                {app.selectedShapes?.size > 1 && (
                  <>
                    <ReactContextMenu.Separator className="menu-separator"/>
                    <ReactContextMenu.Item
                      className="tl-context-menu-button"
                      onClick={() => app.flipHorizontal()}>
                        Flip Horizontally
                    </ReactContextMenu.Item>
                    <ReactContextMenu.Item
                      className="tl-context-menu-button"
                      onClick={() => app.flipVertical()}>
                        Flip Vertically
                    </ReactContextMenu.Item>
                  </>
                )}
                <ReactContextMenu.Separator className="menu-separator"/>
                <ReactContextMenu.Item
                  className="tl-context-menu-button"
                  onClick={() => app.bringToFront()}>
                    Move to Front
                  <div className="tl-context-menu-right-slot">
                    <span className="keyboard-shortcut"><code>⇧</code> <code>]</code></span>
                  </div>
                </ReactContextMenu.Item>
                <ReactContextMenu.Item
                  className="tl-context-menu-button">
                    Move forwards
                  <div className="tl-context-menu-right-slot">
                    <span className="keyboard-shortcut"><code>]</code></span>
                  </div>
                </ReactContextMenu.Item>
                <ReactContextMenu.Item
                  className="tl-context-menu-button"
                  onClick={() => app.sendToBack()}>
                    Move to back
                  <div className="tl-context-menu-right-slot">
                    <span className="keyboard-shortcut"><code>⇧</code> <code>[</code></span>
                  </div>
                </ReactContextMenu.Item>
                <ReactContextMenu.Item
                  className="tl-context-menu-button"
                  onClick={() => app.sendBackward()}>
                    Move backwards
                  <div className="tl-context-menu-right-slot">
                    <span className="keyboard-shortcut"><code>[</code></span>
                  </div>
                </ReactContextMenu.Item>
              </>
            )}
          </div>
        </ReactContextMenu.Content>
      </ReactContextMenu.Portal>
    </ReactContextMenu.Root>
  )
})
