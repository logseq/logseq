import { TLQuickLinksComponent, useApp } from '@tldraw/react'
import { observer } from 'mobx-react-lite'
import React from 'react'
import type { Shape } from '../../lib'
import { LogseqContext } from '../../lib/logseq-context'
import { BlockLink } from '../BlockLink'

export const QuickLinks: TLQuickLinksComponent<Shape> = observer(({ shape }) => {
  const app = useApp()
  const { handlers } = React.useContext(LogseqContext)
  const links = React.useMemo(() => {
    const links = [...(shape.props.refs ?? [])].map<[ref: string, showReferenceContent: boolean]>(
      // user added links should show the referenced block content
      l => [l, true]
    )

    if (shape.props.type === 'logseq-portal' && shape.props.pageId) {
      // portal reference should not show the block content
      links.unshift([shape.props.pageId, false])
    }

    // do not show links for the current page
    return links.filter(
      link =>
        link[0].toLowerCase() !== app.currentPage.name &&
        handlers.getBlockPageName(link[0]) !== app.currentPage.name
    )
  }, [shape.props.id, shape.props.type, shape.props.parentId, shape.props.refs])

  if (links.length === 0) return null

  return (
    <div className="tl-quick-links" title="Shape Quick Links">
      {links.map(([ref, showReferenceContent]) => {
        return (
          <div key={ref} className="tl-quick-links-row">
            <BlockLink id={ref} showReferenceContent={showReferenceContent} />
          </div>
        )
      })}
    </div>
  )
})
