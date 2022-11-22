import type { TLQuickLinksComponent } from '@tldraw/react'
import { observer } from 'mobx-react-lite'
import type { Shape } from '../../lib'
import { BlockLink } from '../BlockLink'

export const QuickLinks: TLQuickLinksComponent<Shape> = observer(({ id, shape }) => {
  const refs = shape.props.refs ?? []
  const portalType = shape.props.type === 'logseq-portal' && shape.props.blockType

  if (refs.length === 0 && !portalType) return null

  return (
    <div className="tl-quick-links">
      {portalType && shape.props.type === 'logseq-portal' && (
        <>
          <div className="tl-quick-links-row tl-quick-links-row-primary">
            <BlockLink id={shape.props.pageId} type={portalType} />
          </div>
        </>
      )}
      {refs.map(ref => {
        return (
          <div key={ref} className="tl-quick-links-row tl-quick-links-row-secondary">
            <BlockLink id={ref} />
          </div>
        )
      })}
    </div>
  )
})
