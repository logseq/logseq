/* eslint-disable @typescript-eslint/no-explicit-any */
import { TLBoxShape, TLBoxShapeProps } from '@tldraw/core'
import { HTMLContainer, TLComponentProps, useApp } from '@tldraw/react'
import { observer } from 'mobx-react-lite'
import * as React from 'react'
import { useCameraMovingRef } from '~hooks/useCameraMoving'
import type { Shape } from '~lib'
import { withClampedStyles } from './style-props'

export interface HTMLShapeProps extends TLBoxShapeProps {
  type: 'html'
  html: string
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
  hideContextBar = true

  ReactComponent = observer(({ events, isErasing, isEditing }: TLComponentProps) => {
    const {
      props: { html },
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

    const anchorRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
      if (this.props.size[1] === 0 && anchorRef.current) {
        this.update({
          size: [this.props.size[0], anchorRef.current.offsetHeight || 400],
        })
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
          }}
        >
          <div
            ref={anchorRef}
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
      },
    } = this
    return <rect width={w} height={h} fill="transparent" />
  })

  validateProps = (props: Partial<HTMLShapeProps>) => {
    if (props.size !== undefined) {
      props.size[0] = Math.max(props.size[0], 1)
      props.size[1] = Math.max(props.size[1], 1)
    }
    return withClampedStyles(props)
  }
}
