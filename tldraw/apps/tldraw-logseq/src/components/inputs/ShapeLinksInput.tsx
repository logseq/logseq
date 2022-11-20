import type { Side } from '@radix-ui/react-popper'
import { validUUID } from '@tldraw/core'
import React from 'react'
import { LogseqContext } from '../../lib/logseq-context'
import { Button } from '../Button'
import { TablerIcon } from '../icons'
import { PopoverButton } from '../PopoverButton'
import { TextInput } from './TextInput'

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
      {type === 'P' ? <PageNameLink pageName={id} /> : <Breadcrumb levelLimit={2} blockId={id} />}
      <div className="flex-1" />
      <Button title="Open Page" type="button" onClick={() => handlers?.redirectToPage(id)}>
        <TablerIcon name="external-link" />
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
  const [value, setValue] = React.useState('')

  return (
    <PopoverButton
      {...rest}
      side={side}
      label={
        <div className="flex gap-1 relative items-center justify-center px-1">
          <TablerIcon name="link" />
          {noOfLinks > 0 && <div className="tl-shape-links-count">{noOfLinks}</div>}
        </div>
      }
    >
      <div className="color-level">
        {pageId && portalType && (
          <div className="tl-shape-links-reference-panel">
            <div className="text-base font-bold inline-flex gap-1 items-center">
              <TablerIcon name="external-link" />
              Your Reference
            </div>
            <div className="h-2" />
            <ShapeLinkItem type={portalType} id={pageId} />
          </div>
        )}
        <div className="tl-shape-links-panel color-level">
          <div className="text-base font-bold inline-flex gap-1 items-center">
            <TablerIcon name="link" />
            Your Links
          </div>
          <div className="h-2" />
          <div className="whitespace-pre-wrap">
            This <strong>{shapeType}</strong> can be linked to any other block, page or whiteboard
            element you have stored in Logseq.
          </div>
          <TextInput
            value={value}
            onChange={e => {
              setValue(e.target.value)
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                if (value && !refs.includes(value)) {
                  onRefsChange([...refs, value])
                }
              }
              e.stopPropagation()
            }}
          />
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
        </div>
      </div>
    </PopoverButton>
  )
}
