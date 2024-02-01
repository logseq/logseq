import type { Side } from '@radix-ui/react-popper'
import { validUUID } from '@tldraw/core'
import { useApp } from '@tldraw/react'
import React from 'react'

import { observer } from 'mobx-react-lite'
import { LogseqContext } from '../../lib/logseq-context'
import { BlockLink } from '../BlockLink'
import { Button } from '../Button'
import { Tooltip } from '../Tooltip'
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
  showContent,
}: {
  id: string
  type: 'B' | 'P'
  onRemove?: () => void
  showContent?: boolean
}) {
  const app = useApp<Shape>()
  const { handlers } = React.useContext(LogseqContext)
  const t = handlers.t

  return (
    <div className="tl-shape-links-panel-item color-level relative">
      <div className="whitespace-pre break-all overflow-hidden text-ellipsis inline-flex">
        <BlockLink id={id} showReferenceContent={showContent} />
      </div>
      <div className="flex-1" />
      {handlers.getBlockPageName(id) !== app.currentPage.name && (
        <Button
          tooltip={t('whiteboard/open-page')}
          type="button"
          onClick={() => handlers?.redirectToPage(id)}
        >
          <TablerIcon name="open-as-page" />
        </Button>
      )}
      <Button
        tooltip={t('whiteboard/open-page-in-sidebar')}
        type="button"
        onClick={() => handlers?.sidebarAddBlock(id, type === 'B' ? 'block' : 'page')}
      >
        <TablerIcon name="move-to-sidebar-right" />
      </Button>
      {onRemove && (
        <Button
          className="tl-shape-links-panel-item-remove-button"
          tooltip={t('whiteboard/remove-link')}
          type="button"
          onClick={onRemove}
        >
          <TablerIcon name="x" className="!translate-y-0" />
        </Button>
      )}
    </div>
  )
}

export const ShapeLinksInput = observer(function ShapeLinksInput({
  pageId,
  portalType,
  shapeType,
  refs,
  side,
  onRefsChange,
  ...rest
}: ShapeLinksInputProps) {
  const {
    handlers: { t },
  } = React.useContext(LogseqContext)

  const noOfLinks = refs.length + (pageId ? 1 : 0)
  const canAddLink = refs.length === 0

  const addNewRef = (value?: string) => {
    if (value && !refs.includes(value) && canAddLink) {
      onRefsChange([...refs, value])
    }
  }

  const showReferencePanel = !!(pageId && portalType)

  return (
    <PopoverButton
      {...rest}
      side={side}
      align="start"
      alignOffset={-6}
      label={
        <Tooltip content={t('whiteboard/link')} sideOffset={14}>
          <div className="flex gap-1 relative items-center justify-center px-1">
            <TablerIcon name={noOfLinks > 0 ? 'link' : 'add-link'} />
            {noOfLinks > 0 && <div className="tl-shape-links-count">{noOfLinks}</div>}
          </div>
        </Tooltip>
      }
    >
      <div className="color-level rounded-lg" data-show-reference-panel={showReferencePanel}>
        {showReferencePanel && (
          <div className="tl-shape-links-reference-panel">
            <div className="text-base inline-flex gap-1 items-center">
              <TablerIcon className="opacity-50" name="internal-link" />
              {t('whiteboard/references')}
            </div>
            <ShapeLinkItem type={portalType} id={pageId} />
          </div>
        )}
        <div className="tl-shape-links-panel color-level">
          <div className="text-base inline-flex gap-1 items-center">
            <TablerIcon className="opacity-50" name="add-link" />
            {t('whiteboard/link-to-any-page-or-block')}
          </div>

          {canAddLink && (
            <LogseqQuickSearch
              style={{
                width: 'calc(100% - 46px)',
                marginLeft: '46px',
              }}
              placeholder={t('whiteboard/start-typing-to-search')}
              onChange={addNewRef}
            />
          )}

          {refs.length > 0 && (
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
                    showContent
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>
    </PopoverButton>
  )
})
