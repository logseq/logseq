import type { Side } from '@radix-ui/react-popper'
import Mousetrap from 'mousetrap'
import { MOD_KEY, validUUID } from '@tldraw/core'
import React from 'react'
import { NIL as NIL_UUID } from 'uuid'

import { LogseqContext } from '../../lib/logseq-context'
import { Button } from '../Button'
import { TablerIcon } from '../icons'
import { PopoverButton } from '../PopoverButton'
import { LogseqQuickSearch } from '../QuickSearch'

interface ShapeLinksInputProps extends React.HTMLAttributes<HTMLButtonElement> {
  shapeType: string
  side: Side
  refs: string[]
  pageId?: string // the portal referenced block id or page name
  portalType?: 'B' | 'P'
  onRefsChange: (value: string[]) => void
}

function ShapeLinkItem({
  id,
  type,
  onRemove,
}: {
  id: string
  type: 'B' | 'P'
  onRemove?: () => void
}) {
  const {
    handlers,
    renderers: { Breadcrumb, PageNameLink },
  } = React.useContext(LogseqContext)

  return (
    <div className="tl-shape-links-panel-item color-level">
      <TablerIcon name={type === 'P' ? 'page' : 'block'} />
      <div className="whitespace-pre break-all overflow-hidden text-ellipsis">
        {type === 'P' ? <PageNameLink pageName={id} /> : <Breadcrumb levelLimit={1} blockId={id} />}
      </div>
      <div className="flex-1" />
      <Button title="Open Page" type="button" onClick={() => handlers?.redirectToPage(id)}>
        <TablerIcon name="open-as-page" />
      </Button>
      <Button
        title="Open Page in Right Sidebar"
        type="button"
        onClick={() => handlers?.sidebarAddBlock(id, type === 'B' ? 'block' : 'page')}
      >
        <TablerIcon name="layout-sidebar-right" />
      </Button>
      {onRemove && (
        <Button title="Remove link" type="button" onClick={onRemove}>
          <TablerIcon name="x" />
        </Button>
      )}
    </div>
  )
}

export function ShapeLinksInput({
  pageId,
  portalType,
  shapeType,
  refs,
  side,
  onRefsChange,
  ...rest
}: ShapeLinksInputProps) {
  const noOfLinks = refs.length + (pageId ? 1 : 0)
  const [showQuickSearch, setShowQuickSearch] = React.useState(false)

  const addNewRef = (value?: string) => {
    if (value && !refs.includes(value)) {
      onRefsChange([...refs, value])
      setShowQuickSearch(false)
    }
  }

  React.useEffect(() => {
    if (!showQuickSearch) {
      const callback = (keyboardEvent: Mousetrap.ExtendedKeyboardEvent, combo: string) => {
        keyboardEvent.preventDefault()
        keyboardEvent.stopPropagation()
        ;(async () => {
          // TODO: thinking about how to make this more generic with usePaste hook
          // TODO: handle whiteboard shapes?
          const items = await navigator.clipboard.read()
          if (items.length > 0) {
            const blob = await items[0].getType('text/plain')
            const rawText = (await blob.text()).trim()

            if (rawText) {
              const text = rawText.trim()
              let newValue: string | undefined
              if (/^\(\(.*\)\)$/.test(rawText) && rawText.length === NIL_UUID.length + 4) {
                const blockRef = rawText.slice(2, -2)
                if (validUUID(blockRef)) {
                  newValue = blockRef
                }
              } else if (/^\[\[.*\]\]$/.test(rawText)) {
                newValue = rawText.slice(2, -2)
              }
              addNewRef(newValue)
            }
          }
        })()
      }

      Mousetrap.bind(`mod+shift+v`, callback, 'keydown')

      return () => {
        Mousetrap.unbind(`mod+shift+v`, 'keydown')
      }
    }
    return () => {}
  }, [showQuickSearch])

  const showReferencePanel = !!(pageId && portalType)

  return (
    <PopoverButton
      {...rest}
      side={side}
      align="start"
      alignOffset={-6}
      label={
        <div className="flex gap-1 relative items-center justify-center px-1">
          <TablerIcon name={noOfLinks > 0 ? "link" : "add-link"} />
          {noOfLinks > 0 && <div className="tl-shape-links-count">{noOfLinks}</div>}
        </div>
      }
    >
      <div className="color-level rounded-lg" data-show-reference-panel={showReferencePanel}>
        {showReferencePanel && (
          <div className="tl-shape-links-reference-panel">
            <div className="text-base font-bold inline-flex gap-1 items-center">
              <TablerIcon className="opacity-50" name="internal-link" />
              References
            </div>
            <div className="h-2" />
            <ShapeLinkItem type={portalType} id={pageId} />
          </div>
        )}
        <div className="tl-shape-links-panel color-level">
          <div className="text-base font-bold inline-flex gap-1 items-center">
            <TablerIcon className="opacity-50" name="add-link" />
            Your links
          </div>
          <div className="h-2" />
          <div className="whitespace-pre-wrap">
            This <strong>{shapeType}</strong> can be linked to any other block, page or whiteboard
            element you have stored in Logseq.
          </div>

          <div className="h-2" />

          {showQuickSearch ? (
            <LogseqQuickSearch
              style={{
                width: 'calc(100% - 46px)',
                marginLeft: '46px',
              }}
              onBlur={() => setShowQuickSearch(false)}
              placeholder="Start typing to search..."
              onChange={addNewRef}
            />
          ) : (
            <div>
              <Button
                className="tl-shape-links-panel-add-button"
                onClick={() => setShowQuickSearch(true)}
              >
                <TablerIcon name="plus" />
                Add a new link
              </Button>
            </div>
          )}
          <div className="h-2" />
          <div
            className="text-center"
            style={{ visibility: !showQuickSearch ? 'visible' : 'hidden' }}
          >
            <span className="opacity-50 mr-1">Paste from clipboard with</span>
            <span className="keyboard-shortcut">
              <code>{MOD_KEY}</code> <code>⇧</code> <code>V</code>
            </span>
          </div>
          {refs.length > 0 && (
            <>
              <div className="h-2" />
              <div className="flex flex-col items-stretch gap-2">
                {refs.map((ref, i) => {
                  return (
                    <ShapeLinkItem
                      key={ref}
                      id={ref}
                      type={validUUID(ref) ? 'B' : 'P'}
                      onRemove={() => {
                        onRefsChange(refs.filter((_, j) => i !== j))
                      }}
                    />
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </PopoverButton>
  )
}
