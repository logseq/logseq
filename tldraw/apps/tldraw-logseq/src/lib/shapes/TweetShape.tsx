/* eslint-disable @typescript-eslint/no-explicit-any */
import { TLBoxShape, TLBoxShapeProps } from '@tldraw/core'
import { HTMLContainer, TLComponentProps } from '@tldraw/react'
import { action, computed } from 'mobx'
import { observer } from 'mobx-react-lite'
import { withClampedStyles } from './style-props'
import { LogseqContext } from '../logseq-context'
import * as React from 'react'

export const TWITTER_REGEX = /https?:\/\/twitter.com\/[0-9a-zA-Z_]{1,20}\/status\/([0-9]*)/

export interface TweetShapeProps extends TLBoxShapeProps {
  type: 'tweet'
  url: string
}

export class TweetShape extends TLBoxShape<TweetShapeProps> {
  static id = 'tweet'

  static defaultProps: TweetShapeProps = {
    id: 'tweet',
    type: 'tweet',
    parentId: 'page',
    point: [0, 0],
    size: [331, 290],
    url: '',
  }

  canFlip = false

  canEdit = true

  @computed get embedId() {
    const url = this.props.url
    const match = url.match(TWITTER_REGEX)
    const embedId = match?.[1] ?? url ?? ''
    return embedId
  }

  @action onTwitterLinkChange = (url: string) => {
    this.update({ url, size: TweetShape.defaultProps.size })
  }

  ReactComponent = observer(({ events, isErasing, isEditing, isSelected }: TLComponentProps) => {
    const {
      renderers: { Tweet },
    } = React.useContext(LogseqContext)

    return (
      <HTMLContainer
        style={{
          overflow: 'hidden',
          pointerEvents: 'all',
          opacity: isErasing ? 0.2 : 1,
        }}
        {...events}
      >
        <div
          className="rounded-lg w-full h-full relative overflow-hidden shadow-xl"
          style={{
            pointerEvents: isEditing ? 'all' : 'none',
            userSelect: 'none',
          }}
        >
          {this.embedId ? (
              <Tweet tweetId={this.embedId}/>
          ) : (null)}
        </div>
      </HTMLContainer>
    )
  })

  ReactIndicator = observer(() => {
    const {
      props: {
        size: [w, h],
      },
    } = this
    return <rect width={w} height={h} fill="transparent" rx={8} ry={8} />
  })

  validateProps = (props: Partial<TweetShapeProps>) => {
    if (props.size !== undefined) {
      props.size[0] = Math.max(props.size[0], 1)
      props.size[1] = Math.max(props.size[1], 1)
    }
    return withClampedStyles(this, props)
  }

  getShapeSVGJsx() {
    // Do not need to consider the original point here
    const bounds = this.getBounds()
    const embedId = this.embedId

    if (embedId) {
      return (
        <g></g>
      )
    }
    return super.getShapeSVGJsx({})
  }
}
