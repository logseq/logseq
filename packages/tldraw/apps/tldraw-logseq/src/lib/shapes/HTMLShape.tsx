/* eslint-disable @typescript-eslint/no-explicit-any */
import { delay, TLBoxShape, TLBoxShapeProps, TLResetBoundsInfo } from '@tldraw/core'
import { HTMLContainer, TLComponentProps, useApp } from '@tldraw/react'
import Vec from '@tldraw/vec'
import { action, computed } from 'mobx'
import { observer } from 'mobx-react-lite'
import * as React from 'react'
import type { SizeLevel, Shape } from '.'
import { useCameraMovingRef } from '../../hooks/useCameraMoving'
import { withClampedStyles } from './style-props'

export interface HTMLShapeProps extends TLBoxShapeProps {
  type: 'html'
  html: string
  scaleLevel?: SizeLevel
}

const levelToScale = {
  xs: 0.5,
  sm: 0.8,
  md: 1,
  lg: 1.5,
  xl: 2,
  xxl: 3,
}

export class HTMLShape extends TLBoxShape<HTMLShapeProps> {
  static id = 'html'

  static defaultProps: HTMLShapeProps = {
    id: 'html',
    type: 'html',
    parentId: 'page',
    point: [0, 0],
    size: [600, 0],
    html: '',
  }

  canChangeAspectRatio = true
  canFlip = false
  canEdit = true
  htmlAnchorRef = React.createRef<HTMLDivElement>()

  @computed get scaleLevel() {
    return this.props.scaleLevel ?? 'md'
  }

  @action setScaleLevel = async (v?: SizeLevel) => {
    const newSize = Vec.mul(
      this.props.size,
      levelToScale[(v as SizeLevel) ?? 'md'] / levelToScale[this.props.scaleLevel ?? 'md']
    )
    this.update({
      scaleLevel: v,
    })
    await delay()
    this.update({
      size: newSize,
    })
  }

  onResetBounds = (info?: TLResetBoundsInfo) => {
    if (this.htmlAnchorRef.current) {
      const rect = this.htmlAnchorRef.current.getBoundingClientRect()
      const [w, h] = Vec.div([rect.width, rect.height], info?.zoom ?? 1)
      const clamp = (v: number) => Math.max(Math.min(v || 400, 1400), 10)
      this.update({
        size: [clamp(w), clamp(h)],
      })
    }
    return this
  }

  ReactComponent = observer(({ events, isErasing, isEditing }: TLComponentProps) => {
    const {
      props: { html, scaleLevel },
    } = this
    const isMoving = useCameraMovingRef()
    const app = useApp<Shape>()
    const isSelected = app.selectedIds.has(this.id)

    const tlEventsEnabled =
      isMoving || (isSelected && !isEditing) || app.selectedTool.id !== 'select'
    const stop = React.useCallback(
      e => {
        if (!tlEventsEnabled) {
          // TODO: pinching inside Logseq Shape issue
          e.stopPropagation()
        }
      },
      [tlEventsEnabled]
    )

    const scaleRatio = levelToScale[scaleLevel ?? 'md']

    React.useEffect(() => {
      if (this.props.size[1] === 0) {
        this.onResetBounds({ zoom: app.viewport.camera.zoom })
        app.persist(true)
      }
    }, [])

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
          onWheelCapture={stop}
          onPointerDown={stop}
          onPointerUp={stop}
          className="tl-html-container"
          style={{
            pointerEvents: !isMoving && (isEditing || isSelected) ? 'all' : 'none',
            overflow: isEditing ? 'auto' : 'hidden',
            width: `calc(100% / ${scaleRatio})`,
            height: `calc(100% / ${scaleRatio})`,
            transform: `scale(${scaleRatio})`,
          }}
        >
          <div
            ref={this.htmlAnchorRef}
            className="tl-html-anchor"
            dangerouslySetInnerHTML={{ __html: html.trim() }}
          />
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
        strokeDasharray={isLocked ? '8 2' : 'undefined'}
      />
    )
  })

  validateProps = (props: Partial<HTMLShapeProps>) => {
    if (props.size !== undefined) {
      props.size[0] = Math.max(props.size[0], 1)
      props.size[1] = Math.max(props.size[1], 1)
    }
    return withClampedStyles(this, props)
  }
}
