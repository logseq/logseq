import { validUUID } from '@tldraw/core'
import React from 'react'
import { LogseqContext } from '../../lib/logseq-context'
import { TablerIcon } from '../icons'

export const BlockLink = ({ type, id }: { type?: 'P' | 'B'; id: string }) => {
  const {
    handlers: { isWhiteboardPage, redirectToPage, sidebarAddBlock, queryBlockByUUID },
    renderers: { Breadcrumb, PageNameLink },
  } = React.useContext(LogseqContext)

  let iconName = ''
  type = type ?? (validUUID(id) ? 'B' : 'P')

  if (validUUID(id)) {
    if (queryBlockByUUID(id)?.properties?.['ls-type'] === 'whiteboard-shape') {
      iconName = 'link-to-whiteboard'
    } else {
      iconName = 'link-to-block'
    }
  } else {
    if (isWhiteboardPage(id)) {
      iconName = 'link-to-whiteboard'
    } else {
      iconName = 'link-to-page'
    }
  }

  return (
    <button
      className="inline-flex gap-1 items-center w-full"
      onPointerDown={e => {
        e.stopPropagation()
        if (e.shiftKey) {
          sidebarAddBlock(id, type === 'B' ? 'block' : 'page')
        } else {
          redirectToPage(id)
        }
      }}
    >
      <TablerIcon name={iconName} />
      <span className="pointer-events-none">
        {type === 'P' ? <PageNameLink pageName={id} /> : <Breadcrumb levelLimit={1} blockId={id} />}
      </span>
    </button>
  )
}
