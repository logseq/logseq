/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react'
import { HTMLContainer, TLComponentProps, useApp } from '@tldraw/react'
import { TLAsset, TLBoxShape, TLBoxShapeProps, TLImageShape, TLImageShapeProps } from '@tldraw/core'
import { observer } from 'mobx-react-lite'
import type { CustomStyleProps } from './style-props'
import { useCameraMovingRef } from '~hooks/useCameraMoving'
import type { Shape } from '~lib'
import { LogseqContext } from '~lib/logseq-context'

export interface VideoShapeProps extends TLBoxShapeProps, CustomStyleProps {
  type: 'video'
  assetId: string
  opacity: number
}

export class VideoShape extends TLBoxShape<VideoShapeProps> {
  static id = 'video'

  static defaultProps: VideoShapeProps = {
    id: 'video1',
    parentId: 'page',
    type: 'video',
    point: [0, 0],
    size: [100, 100],
    stroke: '#000000',
    fill: '#ffffff',
    strokeWidth: 2,
    opacity: 1,
    assetId: '',
    clipping: 0,
    isAspectRatioLocked: true,
  }

  canFlip = false
  canEdit = true
  canChangeAspectRatio = false

  ReactComponent = observer(({ events, isErasing, asset, isEditing }: TLComponentProps) => {
    const {
      props: {
        opacity,
        size: [w, h],
      },
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

    const { handlers } = React.useContext(LogseqContext)

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
          className="tl-video-container"
          style={{
            pointerEvents: !isMoving && (isEditing || isSelected) ? 'all' : 'none',
            overflow: isEditing ? 'auto' : 'hidden',
          }}
        >
          {asset && (
            <video controls src={handlers ? handlers.makeAssetUrl(asset.src) : asset.src} />
          )}
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
}
