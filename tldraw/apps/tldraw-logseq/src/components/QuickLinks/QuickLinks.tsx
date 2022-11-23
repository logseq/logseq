import type { TLQuickLinksComponent } from '@tldraw/react'
import { observer } from 'mobx-react-lite'
import React from 'react'
import type { Shape } from '../../lib'
import { BlockLink } from '../BlockLink'

export const QuickLinks: TLQuickLinksComponent<Shape> = observer(({ id, shape }) => {
  const links = React.useMemo(() => {
    const links = [...(shape.props.refs ?? [])]

    if (shape.props.type === 'logseq-portal' && shape.props.pageId) {
      links.unshift(shape.props.pageId)
    }

    return links
  }, [shape.props.type, shape.props.parentId, shape.props.refs])

  if (links.length === 0) return null

  return (
    <div className="tl-quick-links" title="Shape Quick Links">
      {links.map(ref => {
        return (
          <div key={ref} className="tl-quick-links-row">
            <BlockLink id={ref} />
          </div>
        )
      })}
    </div>
  )
})
