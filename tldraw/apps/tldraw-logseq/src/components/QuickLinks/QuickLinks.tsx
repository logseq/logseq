import { validUUID } from '@tldraw/core'
import type { TLQuickLinksComponent } from '@tldraw/react'
import { observer } from 'mobx-react-lite'
import * as React from 'react'
import type { Shape } from '../../lib'
import { LogseqContext } from '../../lib/logseq-context'
import { TablerIcon } from '../icons'

const BlockLink = ({ type, id }: { type?: 'P' | 'B'; id: string }) => {
  const {
    renderers: { Breadcrumb, PageNameLink },
  } = React.useContext(LogseqContext)

  type = type ?? (validUUID(id) ? 'B' : 'P')

  return (
    <>
      <TablerIcon name={type === 'P' ? 'link-to-page' : 'link-to-block'} />
      {type === 'P' ? <PageNameLink pageName={id} /> : <Breadcrumb levelLimit={1} blockId={id} />}
    </>
  )
}

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
          <div key={ref} className="tl-quick-links-row">
            <BlockLink id={ref} />
          </div>
        )
      })}
    </div>
  )
})
