/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react'
import type { TLBoxShapeProps } from '@tldraw/core'
import { HTMLContainer, TLComponentProps, TLReactBoxShape } from '@tldraw/react'
import { observer } from 'mobx-react-lite'
import { CustomStyleProps, withClampedStyles } from './style-props'
import { TextInput } from '~components/inputs/TextInput'

export interface CodeSandboxShapeProps extends TLBoxShapeProps, CustomStyleProps {
  type: 'code'
  embedId: string
}

export class CodeSandboxShape extends TLReactBoxShape<CodeSandboxShapeProps> {
  static id = 'code'

  static defaultProps: CodeSandboxShapeProps = {
    id: 'code',
    type: 'code',
    parentId: 'page',
    point: [0, 0],
    size: [600, 320],
    stroke: '#000000',
    fill: '#ffffff',
    strokeWidth: 2,
    opacity: 1,
    embedId: '',
  }

  canEdit = true

  canFlip = false

  ReactContextBar = observer(() => {
    const { embedId } = this.props
    const rInput = React.useRef<HTMLInputElement>(null)
    const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const url = e.currentTarget.value
      const match = url.match(/\/s\/([^?]+)/)
      const embedId = match?.[1] ?? url ?? ''
      this.update({ embedId })
    }, [])
    return (
      <>
        <TextInput
          ref={rInput}
          label="CodeSandbox Embed ID"
          type="text"
          value={embedId}
          onChange={handleChange}
        />
      </>
    )
  })

  ReactComponent = observer(({ events, isEditing, isErasing }: TLComponentProps) => {
    const { opacity, embedId } = this.props
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
          style={{
            width: '100%',
            height: '100%',
            pointerEvents: isEditing ? 'all' : 'none',
            userSelect: 'none',
          }}
        >
          {embedId ? (
            <iframe
              src={`https://codesandbox.io/embed/${embedId}?&fontsize=14&hidenavigation=1&theme=dark`}
              style={{ width: '100%', height: '100%', overflow: 'hidden' }}
              title={'CodeSandbox'}
              allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
              sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden',
                justifyContent: 'center',
                backgroundColor: '#FFFFFF',
                border: '1px solid rgb(52, 52, 52)',
                padding: 16,
              }}
            >
              <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="128">
                <title />
                <path d="M2 6l10.455-6L22.91 6 23 17.95 12.455 24 2 18V6zm2.088 2.481v4.757l3.345 1.86v3.516l3.972 2.296v-8.272L4.088 8.481zm16.739 0l-7.317 4.157v8.272l3.972-2.296V15.1l3.345-1.861V8.48zM5.134 6.601l7.303 4.144 7.32-4.18-3.871-2.197-3.41 1.945-3.43-1.968L5.133 6.6z" />
              </svg>
            </div>
          )}
        </div>
      </HTMLContainer>
    )
  })

  ReactIndicator = observer(() => {
    const {
      size: [w, h],
    } = this.props
    return <rect width={w} height={h} fill="transparent" />
  })

  validateProps = (props: Partial<CodeSandboxShapeProps>) => {
    if (props.size !== undefined) {
      props.size[0] = Math.max(props.size[0], 1)
      props.size[1] = Math.max(props.size[1], 1)
    }
    return withClampedStyles(props)
  }
}
