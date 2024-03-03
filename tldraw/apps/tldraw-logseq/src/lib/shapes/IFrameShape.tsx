/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react'
import { TLBoxShape, TLBoxShapeProps } from '@tldraw/core'
import { HTMLContainer, TLComponentProps, useApp } from '@tldraw/react'
import { action } from 'mobx'
import { observer } from 'mobx-react-lite'

export interface IFrameShapeProps extends TLBoxShapeProps {
  type: 'iframe'
  url: string
}

export class IFrameShape extends TLBoxShape<IFrameShapeProps> {
  static id = 'iframe'
  frameRef = React.createRef<HTMLIFrameElement>()

  static defaultProps: IFrameShapeProps = {
    id: 'iframe',
    type: 'iframe',
    parentId: 'page',
    point: [0, 0],
    size: [853, 480],
    url: '',
  }

  canEdit = true

  @action onIFrameSourceChange = (url: string) => {
    this.update({ url })
  }

  @action reload = () => {
    if (this.frameRef.current) {
      this.frameRef.current.src = this.frameRef?.current?.src
    }
  }

  ReactComponent = observer(({ events, isErasing, isEditing }: TLComponentProps) => {
    const ref = React.useRef<HTMLIFrameElement>(null)
    const app = useApp<Shape>()

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
          className="tl-iframe-container"
          style={{
            pointerEvents: isEditing || app.readOnly ? 'all' : 'none',
            userSelect: 'none',
          }}
        >
          {this.props.url && (
            <div
              style={{
                overflow: 'hidden',
                position: 'relative',
                height: '100%',
              }}
            >
              <iframe
                ref={this.frameRef}
                className="absolute inset-0 w-full h-full m-0"
                width="100%"
                height="100%"
                src={`${this.props.url}`}
                frameBorder="0"
                sandbox="allow-scripts allow-same-origin allow-presentation"
              />
            </div>
          )}
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
