/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react'
import { TLBoxShape, TLBoxShapeProps } from '@tldraw/core'
import { HTMLContainer, TLComponentProps, useApp } from '@tldraw/react'
import { observer } from 'mobx-react-lite'
import { CustomStyleProps, withClampedStyles } from './style-props'
import { useCameraMovingRef } from '~hooks/useCameraMoving'
import type { Shape } from '~lib'

export interface HTMLShapeProps extends TLBoxShapeProps, CustomStyleProps {
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
    size: [600, 320],
    stroke: '#000000',
    fill: '#ffffff',
    strokeWidth: 2,
    opacity: 1,
    html: '',
  }

  canChangeAspectRatio = true
  canFlip = false
  canEdit = true

  ReactComponent = observer(({ events, isErasing, isEditing }: TLComponentProps) => {
    const {
      props: { opacity, html },
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

    return (
      <HTMLContainer
        style={{
          overflow: 'hidden',
          pointerEvents: 'all',
          opacity: isErasing ? 0.2 : opacity,
        }}
        {...events}
      >
        <div
          onWheelCapture={stop}
          onPointerDown={stop}
          onPointerUp={stop}
          className="tl-html-container"
          style={{
            width: '100%',
            height: '100%',
            pointerEvents: isEditing ? 'all' : 'none',
            userSelect: 'none',
            position: 'relative',
            margin: 0,
            overflow: isEditing ? 'auto' : 'hidden',
          }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
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
      props.size[0] = Math.max(props.size[0], 120)
      props.size[1] = Math.max(props.size[1], 80)
    }
    return withClampedStyles(props)
  }
}
