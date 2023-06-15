/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react'
import { TLBoxShape, TLBoxShapeProps } from '@tldraw/core'
import { HTMLContainer, TLComponentProps, useApp } from '@tldraw/react'
import { observer } from 'mobx-react-lite'
import { LogseqContext } from '../logseq-context'
import { useCameraMovingRef } from '../../hooks/useCameraMoving'

export interface PdfShapeProps extends TLBoxShapeProps {
  type: 'pdf'
  assetId: string
}

export class PdfShape extends TLBoxShape<PdfShapeProps> {
  static id = 'pdf'
  frameRef = React.createRef<HTMLElement>()

  static defaultProps: PdfShapeProps = {
    id: 'pdf',
    type: 'pdf',
    parentId: 'page',
    point: [0, 0],
    size: [853, 480],
    assetId: '',
  }

  canChangeAspectRatio = true
  canFlip = true
  canEdit = true

  ReactComponent = observer(({ events, asset, isErasing, isEditing, isSelected }: TLComponentProps) => {
    const ref = React.useRef<HTMLElement>(null)
    const {
      renderers: { Pdf },
      handlers,
    } = React.useContext(LogseqContext)
    const app = useApp<Shape>()

    const isMoving = useCameraMovingRef()

    React.useEffect(() => {
      if (asset && isEditing) {
        // handlers.setCurrentPdf(handlers.makeAssetUrl(asset.src))
      }
    }, [isEditing])

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
        className="relative tl-pdf-container"
          onWheelCapture={stop}
          onPointerDown={stop}
          onPointerUp={stop}
          style={{
            width: '100%',
            height: '100%',
            pointerEvents: !isMoving && (isEditing || isSelected) ? 'all' : 'none',
          }}
        >
          {asset ? (
            <Pdf src={handlers ? handlers.makeAssetUrl(asset.src) : asset.src} />
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
}
