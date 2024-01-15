import { validUUID } from '@tldraw/core'
import React from 'react'
import { LogseqContext } from '../../lib/logseq-context'
import { TablerIcon } from '../icons'

export const BlockLink = ({
  id,
  showReferenceContent = false,
}: {
  id: string
  showReferenceContent?: boolean
}) => {
  const {
    handlers: { isWhiteboardPage, redirectToPage, sidebarAddBlock, queryBlockByUUID },
    renderers: { Breadcrumb, PageName },
  } = React.useContext(LogseqContext)

  let iconName = ''
  let linkType = validUUID(id) ? 'B' : 'P'
  let blockContent = ''

  if (validUUID(id)) {
    const block = queryBlockByUUID(id)
    if (!block) {
      return <span className="p-2">Invalid reference. Did you remove it?</span>
    }

    blockContent = block.content

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

  const slicedContent =
    blockContent && blockContent.length > 23 ? blockContent.slice(0, 20) + '...' : blockContent

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
            <Breadcrumb levelLimit={1} blockId={id} endSeparator={showReferenceContent} />
            {showReferenceContent && slicedContent}
          </>
        )}
      </span>
    </button>
  )
}
