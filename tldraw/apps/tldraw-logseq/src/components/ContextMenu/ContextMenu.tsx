import { useApp } from '@tldraw/react'
import { LogseqContext } from '../../lib/logseq-context'
import { MOD_KEY, AlignType, DistributeType, isDev, EXPORT_PADDING } from '@tldraw/core'
import { observer } from 'mobx-react-lite'
import { TablerIcon } from '../icons'
import { Button } from '../Button'
import * as React from 'react'

import * as ReactContextMenu from '@radix-ui/react-context-menu'
import * as Separator from '@radix-ui/react-separator'
import { toJS } from 'mobx'

interface ContextMenuProps {
  children: React.ReactNode
  collisionRef: React.RefObject<HTMLDivElement>
}

export const ContextMenu = observer(function ContextMenu({
  children,
  collisionRef,
}: ContextMenuProps) {
  const app = useApp()
  const { handlers } = React.useContext(LogseqContext)
  const rContent = React.useRef<HTMLDivElement>(null)

  const runAndTransition = (f: Function) => {
    f()
    app.transition('select')
  }

  const developerMode = React.useMemo(() => {
    return isDev()
  }, [])

  return (
    <ReactContextMenu.Root
      onOpenChange={open => {
        if (open && !app.isIn('select.contextMenu')) {
          app.transition('select').selectedTool.transition('contextMenu')
        } else if (!open && app.isIn('select.contextMenu')) {
          app.selectedTool.transition('idle')
        }
      }}
    >
      <ReactContextMenu.Trigger
        disabled={app.editingShape && Object.keys(app.editingShape).length !== 0}
      >
        {children}
      </ReactContextMenu.Trigger>
      <ReactContextMenu.Content
        className="tl-menu tl-context-menu"
        ref={rContent}
        onEscapeKeyDown={() => app.transition('select')}
        collisionBoundary={collisionRef.current}
        asChild
        tabIndex={-1}
      >
        <div>
          {app.selectedShapes?.size > 1 && !app.readOnly && (
            <>
              <ReactContextMenu.Item>
                <div className="tl-menu-button-row pb-0">
                  <Button
                    tooltip="Align left"
                    onClick={() => runAndTransition(() => app.align(AlignType.Left))}
                  >
                    <TablerIcon name="layout-align-left" />
                  </Button>
                  <Button
                    tooltip="Align center horizontally"
                    onClick={() => runAndTransition(() => app.align(AlignType.CenterHorizontal))}
                  >
                    <TablerIcon name="layout-align-center" />
                  </Button>
                  <Button
                    tooltip="Align right"
                    onClick={() => runAndTransition(() => app.align(AlignType.Right))}
                  >
                    <TablerIcon name="layout-align-right" />
                  </Button>
                  <Separator.Root className="tl-toolbar-separator" orientation="vertical" />
                  <Button
                    tooltip="Distribute horizontally"
                    onClick={() =>
                      runAndTransition(() => app.distribute(DistributeType.Horizontal))
                    }
                  >
                    <TablerIcon name="layout-distribute-vertical" />
                  </Button>
                </div>
                <div className="tl-menu-button-row pt-0">
                  <Button
                    tooltip="Align top"
                    onClick={() => runAndTransition(() => app.align(AlignType.Top))}
                  >
                    <TablerIcon name="layout-align-top" />
                  </Button>
                  <Button
                    tooltip="Align center vertically"
                    onClick={() => runAndTransition(() => app.align(AlignType.CenterVertical))}
                  >
                    <TablerIcon name="layout-align-middle" />
                  </Button>
                  <Button
                    tooltip="Align bottom"
                    onClick={() => runAndTransition(() => app.align(AlignType.Bottom))}
                  >
                    <TablerIcon name="layout-align-bottom" />
                  </Button>
                  <Separator.Root className="tl-toolbar-separator" orientation="vertical" />
                  <Button
                    tooltip="Distribute vertically"
                    onClick={() => runAndTransition(() => app.distribute(DistributeType.Vertical))}
                  >
                    <TablerIcon name="layout-distribute-horizontal" />
                  </Button>
                </div>
              </ReactContextMenu.Item>
              <ReactContextMenu.Separator className="menu-separator" />
              <ReactContextMenu.Item
                className="tl-menu-item"
                onClick={() => runAndTransition(app.packIntoRectangle)}
              >
                <TablerIcon className="tl-menu-icon" name="layout-grid" />
                Pack into rectangle
              </ReactContextMenu.Item>
              <ReactContextMenu.Separator className="menu-separator" />
            </>
          )}
          {app.selectedShapes?.size > 0 && (
            <>
              <ReactContextMenu.Item
                className="tl-menu-item"
                onClick={() => runAndTransition(app.api.zoomToSelection)}
              >
                Zoom to fit
                <div className="tl-menu-right-slot">
                  <span className="keyboard-shortcut">
                    <code>{MOD_KEY}</code> <code>⇧</code> <code>1</code>
                  </span>
                </div>
              </ReactContextMenu.Item>
              <ReactContextMenu.Separator className="menu-separator" />
            </>
          )}
          {(app.selectedShapesArray.some(s => s.type === 'group' || app.getParentGroup(s)) ||
            app.selectedShapesArray.length > 1) &&
            !app.readOnly && (
              <>
                {app.selectedShapesArray.some(s => s.type === 'group' || app.getParentGroup(s)) && (
                  <ReactContextMenu.Item
                    className="tl-menu-item"
                    onClick={() => runAndTransition(app.api.unGroup)}
                  >
                    <TablerIcon className="tl-menu-icon" name="ungroup" />
                    Ungroup
                    <div className="tl-menu-right-slot">
                      <span className="keyboard-shortcut">
                        <code>{MOD_KEY}</code> <code>⇧</code> <code>G</code>
                      </span>
                    </div>
                  </ReactContextMenu.Item>
                )}
                {app.selectedShapesArray.length > 1 && (
                  <ReactContextMenu.Item
                    className="tl-menu-item"
                    onClick={() => runAndTransition(app.api.doGroup)}
                  >
                    <TablerIcon className="tl-menu-icon" name="group" />
                    Group
                    <div className="tl-menu-right-slot">
                      <span className="keyboard-shortcut">
                        <code>{MOD_KEY}</code> <code>G</code>
                      </span>
                    </div>
                  </ReactContextMenu.Item>
                )}
                <ReactContextMenu.Separator className="menu-separator" />
              </>
            )}
          {app.selectedShapes?.size > 0 && (
            <>
              {!app.readOnly && (
                <ReactContextMenu.Item
                  className="tl-menu-item"
                  onClick={() => runAndTransition(app.cut)}
                >
                  <TablerIcon className="tl-menu-icon" name="cut" />
                  Cut
                  <div className="tl-menu-right-slot">
                    <span className="keyboard-shortcut">
                      <code>{MOD_KEY}</code> <code>X</code>
                    </span>
                  </div>
                </ReactContextMenu.Item>
              )}
              <ReactContextMenu.Item
                className="tl-menu-item"
                onClick={() => runAndTransition(app.copy)}
              >
                <TablerIcon className="tl-menu-icon" name="copy" />
                Copy
                <div className="tl-menu-right-slot">
                  <span className="keyboard-shortcut">
                    <code>{MOD_KEY}</code> <code>C</code>
                  </span>
                </div>
              </ReactContextMenu.Item>
            </>
          )}
          {!app.readOnly && (
            <ReactContextMenu.Item
              className="tl-menu-item"
              onClick={() => runAndTransition(app.paste)}
            >
              <TablerIcon className="tl-menu-icon" name="clipboard" />
              Paste
              <div className="tl-menu-right-slot">
                <span className="keyboard-shortcut">
                  <code>{MOD_KEY}</code> <code>V</code>
                </span>
              </div>
            </ReactContextMenu.Item>
          )}
          {app.selectedShapes?.size === 1 && !app.readOnly && (
            <ReactContextMenu.Item
              className="tl-menu-item"
              onClick={() => runAndTransition(() => app.paste(undefined, true))}
            >
              Paste as link
              <div className="tl-menu-right-slot">
                <span className="keyboard-shortcut">
                  <code>{MOD_KEY}</code> <code>⇧</code> <code>V</code>
                </span>
              </div>
            </ReactContextMenu.Item>
          )}
          <ReactContextMenu.Separator className="menu-separator" />
          <ReactContextMenu.Item
            className="tl-menu-item"
            onClick={() =>
              runAndTransition(() =>
                handlers.exportToImage(app.currentPageId, {
                  x: app.selectionBounds.minX + app.viewport.camera.point[0] - EXPORT_PADDING,
                  y: app.selectionBounds.minY + app.viewport.camera.point[1] - EXPORT_PADDING,
                  width: app.selectionBounds?.width + EXPORT_PADDING * 2,
                  height: app.selectionBounds?.height + EXPORT_PADDING * 2,
                  zoom: app.viewport.camera.zoom,
                })
              )
            }
          >
            <TablerIcon className="tl-menu-icon" name="file-export" />
            Export
            <div className="tl-menu-right-slot">
              <span className="keyboard-shortcut"></span>
            </div>
          </ReactContextMenu.Item>
          <ReactContextMenu.Separator className="menu-separator" />
          <ReactContextMenu.Item
            className="tl-menu-item"
            onClick={() => runAndTransition(app.api.selectAll)}
          >
            Select all
            <div className="tl-menu-right-slot">
              <span className="keyboard-shortcut">
                <code>{MOD_KEY}</code> <code>A</code>
              </span>
            </div>
          </ReactContextMenu.Item>
          {app.selectedShapes?.size > 1 && (
            <ReactContextMenu.Item
              className="tl-menu-item"
              onClick={() => runAndTransition(app.api.deselectAll)}
            >
              Deselect all
            </ReactContextMenu.Item>
          )}
          {app.selectedShapes?.size > 0 && !app.readOnly && (
            <>
              <ReactContextMenu.Item
                className="tl-menu-item"
                onClick={() => runAndTransition(app.api.deleteShapes)}
              >
                <TablerIcon className="tl-menu-icon" name="backspace" />
                Delete
                <div className="tl-menu-right-slot">
                  <span className="keyboard-shortcut">
                    <code>Del</code>
                  </span>
                </div>
              </ReactContextMenu.Item>
              {app.selectedShapes?.size > 1 && !app.readOnly && (
                <>
                  <ReactContextMenu.Separator className="menu-separator" />
                  <ReactContextMenu.Item
                    className="tl-menu-item"
                    onClick={() => runAndTransition(app.flipHorizontal)}
                  >
                    <TablerIcon className="tl-menu-icon" name="flip-horizontal" />
                    Flip horizontally
                  </ReactContextMenu.Item>
                  <ReactContextMenu.Item
                    className="tl-menu-item"
                    onClick={() => runAndTransition(app.flipVertical)}
                  >
                    <TablerIcon className="tl-menu-icon" name="flip-vertical" />
                    Flip vertically
                  </ReactContextMenu.Item>
                </>
              )}
              {!app.readOnly && (
                <>
                  <ReactContextMenu.Separator className="menu-separator" />
                  <ReactContextMenu.Item
                    className="tl-menu-item"
                    onClick={() => runAndTransition(app.bringToFront)}
                  >
                    Move to front
                    <div className="tl-menu-right-slot">
                      <span className="keyboard-shortcut">
                        <code>⇧</code> <code>]</code>
                      </span>
                    </div>
                  </ReactContextMenu.Item>
                  <ReactContextMenu.Item
                    className="tl-menu-item"
                    onClick={() => runAndTransition(app.sendToBack)}
                  >
                    Move to back
                    <div className="tl-menu-right-slot">
                      <span className="keyboard-shortcut">
                        <code>⇧</code> <code>[</code>
                      </span>
                    </div>
                  </ReactContextMenu.Item>
                </>
              )}

              {developerMode && (
                <ReactContextMenu.Item
                  className="tl-menu-item"
                  onClick={() => {
                    if (app.selectedShapesArray.length === 1) {
                      console.log(toJS(app.selectedShapesArray[0].serialized))
                    } else {
                      console.log(app.selectedShapesArray.map(s => toJS(s.serialized)))
                    }
                  }}
                >
                  (Dev) Print shape props
                </ReactContextMenu.Item>
              )}
            </>
          )}
        </div>
      </ReactContextMenu.Content>
    </ReactContextMenu.Root>
  )
})
