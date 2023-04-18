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

    const [, innerHeight] = this.useComponentSize(cpRefContainer)

    React.useEffect(() => {
      const latestInnerHeight = this.getInnerHeight?.() ?? innerHeight
      const newHeight = latestInnerHeight
      if (innerHeight && Math.abs(newHeight - this.props.size[1]) > 1) {
        this.update({
          size: [this.props.size[0], newHeight],
        })
        app.persist(true)
      }
    }, [innerHeight])

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
          className="rounded-xl w-full h-full relative shadow-xl tl-tweet-container"
          style={{
            pointerEvents: isEditing ? 'all' : 'none',
            userSelect: 'none',
          }}
        >
          {this.embedId ? (
            <div ref={cpRefContainer}>
              <Tweet tweetId={this.embedId} />
            </div>
          ) : null}
        </div>
      </HTMLContainer>
    )
  })

  ReactIndicator = observer(() => {
    const {
      props: {
        size: [w, h],
        isLocked,
      },
    } = this
    return (
      <rect
        width={w}
        height={h}
        fill="transparent"
        rx={8}
        ry={8}
        strokeDasharray={isLocked ? '8 2' : 'undefined'}
      />
    )
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
      props.size[0] = Math.min(Math.max(props.size[0], 300), 550)
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
        <g>
          <rect width={bounds.width} height={bounds.height} fill="#15202b" rx={8} ry={8} />
          <svg
            x={bounds.width / 4}
            y={bounds.height / 4}
            width={bounds.width / 2}
            height={bounds.height / 2}
            viewBox="0 0 15 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="m13.464 4.4401c0.0091 0.13224 0.0091 0.26447 0.0091 0.39793 0 4.0664-3.0957 8.7562-8.7562 8.7562v-0.0024c-1.6721 0.0024-3.3095-0.47658-4.7172-1.3797 0.24314 0.02925 0.48751 0.04387 0.73248 0.04448 1.3857 0.0013 2.7319-0.46374 3.8221-1.3199-1.3169-0.024981-2.4717-0.8836-2.8751-2.1371 0.4613 0.08897 0.93662 0.070688 1.3894-0.053016-1.4357-0.29007-2.4686-1.5515-2.4686-3.0165v-0.039001c0.42779 0.23827 0.90676 0.37051 1.3967 0.38513-1.3522-0.90372-1.769-2.7026-0.95247-4.1091 1.5625 1.9226 3.8678 3.0914 6.3425 3.2151-0.24802-1.0689 0.090798-2.1889 0.89031-2.9403 1.2395-1.1651 3.1889-1.1054 4.3541 0.13346 0.68921-0.13589 1.3498-0.38879 1.9543-0.74711-0.22974 0.71237-0.71054 1.3175-1.3528 1.702 0.60999-0.071907 1.206-0.23522 1.7672-0.48446-0.41316 0.61913-0.93358 1.1584-1.5356 1.5942z"
              fill="#1d9bf0"
              fillRule="evenodd"
              clipRule="evenodd"
            ></path>
          </svg>
        </g>
      )
    }
    return super.getShapeSVGJsx({})
  }
}
