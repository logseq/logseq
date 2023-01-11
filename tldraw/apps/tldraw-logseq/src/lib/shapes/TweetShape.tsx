/* eslint-disable @typescript-eslint/no-explicit-any */
import { TLBoxShape, TLBoxShapeProps, TLResizeInfo, TLResetBoundsInfo } from '@tldraw/core'
import { HTMLContainer, TLComponentProps, useApp } from '@tldraw/react'
import Vec from '@tldraw/vec'
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
  initialHeightCalculated = true
  getInnerHeight: (() => number) | null = null // will be overridden in the hook
  ref = React.createRef<HTMLDivElement>()

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
    const app = useApp<Shape>()

    const cpRefContainer = React.useRef<HTMLDivElement>(null)

    this.useComponentSize(cpRefContainer, '.twitter-tweet')

    React.useEffect(() => {
      if (!this.initialHeightCalculated) {
        setTimeout(() => {
          this.onResetBounds()
          app.persist(true)
        })
      }
    }, [this.initialHeightCalculated])

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
          className="rounded-xl w-full h-full relative shadow-xl"
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

  useComponentSize<T extends HTMLElement>(ref: React.RefObject<T> | null, selector = '') {
    const [size, setSize] = React.useState<[number, number]>([0, 0])
    const app = useApp<Shape>()
    React.useEffect(() => {
      if (ref?.current) {
        const el = selector ? ref.current.querySelector<HTMLElement>(selector) : ref.current
        if (el) {
          const updateSize = () => {
            const { width, height } = el.getBoundingClientRect()
            const bound = Vec.div([width, height], app.viewport.camera.zoom) as [number, number]
            setSize(bound)
            return bound
          }
          updateSize()
          this.getInnerHeight = () => updateSize()[1]
          const resizeObserver = new ResizeObserver(() => {
            updateSize()
          })
          resizeObserver.observe(el)
          return () => {
            resizeObserver.disconnect()
          }
        }
      }
      return () => {}
    }, [ref, selector])
    return size
  }

  getAutoResizeHeight() {
    if (this.getInnerHeight) {
      return this.getInnerHeight()
    }
    return null
  }

  onResetBounds = (info?: TLResetBoundsInfo) => {
    const height = this.getAutoResizeHeight()
    if (height !== null && Math.abs(height - this.props.size[1]) > 1) {
      this.update({
        size: [this.props.size[0], height],
      })
      this.initialHeightCalculated = true
    }
    return this
  }

  onResize = (initialProps: any, info: TLResizeInfo): this => {
    const {
      bounds,
      rotation,
      scale: [scaleX, scaleY],
    } = info
    const nextScale = [...this.scale]
    if (scaleX < 0) nextScale[0] *= -1
    if (scaleY < 0) nextScale[1] *= -1

    const height = this.getAutoResizeHeight() ?? bounds.height

    return this.update({
      point: [bounds.minX, bounds.minY],
      size: [Math.max(1, bounds.width), Math.max(1, height)],
      scale: nextScale,
      rotation,
    })
  }

  validateProps = (props: Partial<TweetShapeProps>) => {
    if (props.size !== undefined) {
      props.size[0] = Math.min(Math.max(props.size[0], 1), 550)
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
