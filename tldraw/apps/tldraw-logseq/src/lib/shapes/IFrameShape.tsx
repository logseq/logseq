/* eslint-disable @typescript-eslint/no-explicit-any */
import { TLBoxShape, TLBoxShapeProps } from '@tldraw/core'
import { HTMLContainer, TLComponentProps } from '@tldraw/react'
import { action, computed } from 'mobx'
import { observer } from 'mobx-react-lite'

export interface IFrameShapeProps extends TLBoxShapeProps {
  type: 'iframe'
  url: string
}

export class IFrameShape extends TLBoxShape<IFrameShapeProps> {
  static id = 'iframe'

  static defaultProps: IFrameShapeProps = {
    id: 'iframe',
    type: 'iframe',
    parentId: 'page',
    point: [0, 0],
    size: [853, 480],
    url: '',
  }

  @computed get url() {
    return this.props.url
  }

  @action onIFrameSourceChange = (url: string) => {
    this.update({ url })
  }

  ReactComponent = observer(({ events, isErasing, isEditing }: TLComponentProps) => {
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
          {this.url && (
            <div
              style={{
                overflow: 'hidden',
                position: 'relative',
                height: '100%',
              }}
            >
              <iframe
                className="absolute inset-0 w-full h-full m-0"
                width="100%"
                height="100%"
                src={`${this.url}`}
                frameBorder="0"
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
      },
    } = this
    return <rect width={w} height={h} fill="transparent" rx={8} ry={8} />
  })
}
