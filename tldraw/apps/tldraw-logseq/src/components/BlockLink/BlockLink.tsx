import { validUUID } from '@tldraw/core'
import React from 'react'
import { LogseqContext } from '../../lib/logseq-context'
import { TablerIcon } from '../icons'

export const BlockLink = ({ id }: { id: string }) => {
  const {
    handlers: { isWhiteboardPage, redirectToPage, sidebarAddBlock, queryBlockByUUID },
    renderers: { Breadcrumb, PageName, BlockReference },
  } = React.useContext(LogseqContext)

  let iconName = ''
  let linkType = validUUID(id) ? 'B' : 'P'

  if (validUUID(id)) {
    const block = queryBlockByUUID(id)
    if (!block) {
      return <span className='p-2'>Invalid reference. Did you remove it?</span>
    }

    if (block.properties?.['ls-type'] === 'whiteboard-shape') {
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
          sidebarAddBlock(id, linkType === 'B' ? 'block' : 'page')
        } else {
          redirectToPage(id)
        }
      }}
    >
      <TablerIcon name={iconName} />
      <span className="pointer-events-none block-link-reference-row">
        {linkType === 'P' ? (
          <PageName pageName={id} />
        ) : (
          <>
            <Breadcrumb levelLimit={1} blockId={id} endSeparator />
            <BlockReference blockId={id} />
          </>
        )}
      </span>
    </button>
  )
}
