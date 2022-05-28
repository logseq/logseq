// TODO: provide "frontend.components.page/page" component?

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react'
import { TLBoxShape, TLBoxShapeProps } from '@tldraw/core'
import { HTMLContainer, SVGContainer, TLComponentProps, useApp } from '@tldraw/react'
import { observer } from 'mobx-react-lite'
import { CustomStyleProps, withClampedStyles } from './style-props'
import { TextInput } from '~components/inputs/TextInput'
import { LogseqContext } from '~lib/logseq-context'
import type { Shape } from '~lib'
import { useCameraMovingRef } from '~hooks/useCameraMoving'
import { BindingIndicator } from './BindingIndicator'

export interface LogseqPortalShapeProps extends TLBoxShapeProps, CustomStyleProps {
  type: 'logseq-portal'
  pageId: string // page name or UUID
}

export class LogseqPortalShape extends TLBoxShape<LogseqPortalShapeProps> {
  static id = 'logseq-portal'

  static defaultProps: LogseqPortalShapeProps = {
    id: 'logseq-portal',
    type: 'logseq-portal',
    parentId: 'page',
    point: [0, 0],
    size: [600, 320],
    stroke: '#000000',
    fill: '#ffffff',
    strokeWidth: 2,
    opacity: 1,
    pageId: '',
  }

  canChangeAspectRatio = true
  canFlip = false
  canEdit = false

  ReactContextBar = observer(() => {
    const { pageId } = this.props
    const [q, setQ] = React.useState(pageId)
    const rInput = React.useRef<HTMLInputElement>(null)
    const { search } = React.useContext(LogseqContext)
    const app = useApp()

    const secretPrefix = 'œ::'

    const commitChange = React.useCallback((id: string) => {
      setQ(id)
      this.update({ pageId: id, size: LogseqPortalShape.defaultProps.size })
      app.persist()
      rInput.current?.blur()
    }, [])

    const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const _q = e.currentTarget.value
      if (_q.startsWith(secretPrefix)) {
        const id = _q.substring(secretPrefix.length)
        commitChange(id)
      } else {
        setQ(_q)
      }
    }, [])

    const options = React.useMemo(() => {
      if (search && q) {
        return search(q)
      }
      return null
    }, [search, q])

    return (
      <>
        <TextInput
          ref={rInput}
          label="Page name or block UUID"
          type="text"
          value={q}
          onChange={handleChange}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              commitChange(q)
            }
          }}
          list="logseq-portal-search-results"
        />
        <datalist id="logseq-portal-search-results">
          {options?.map(option => (
            <option key={option} value={secretPrefix + option}>
              {option}
            </option>
          ))}
        </datalist>
      </>
    )
  })

  ReactComponent = observer(({ events, isEditing, isErasing, isBinding }: TLComponentProps) => {
    const {
      props: { opacity, pageId, size, strokeWidth },
    } = this

    const app = useApp<Shape>()
    const isMoving = useCameraMovingRef()
    const { Page } = React.useContext(LogseqContext)
    const isSelected = app.selectedIds.has(this.id)
    const enableTlEvents = () => {
      return isMoving || isEditing || isSelected || app.selectedTool.id !== 'select'
    }

    const stop = React.useCallback(
      e => {
        if (!enableTlEvents()) {
          e.stopPropagation()
        }
      },
      [enableTlEvents]
    )

    if (!Page) {
      return null
    }

    let linkButton = null
    const logseqLink = this.props.logseqLink
    if (logseqLink) {
      const f = () => app.pubEvent('whiteboard-go-to-link', logseqLink)
      linkButton = (
        <a className="ml-2" onMouseDown={f}>
          🔗 {logseqLink}
        </a>
      )
    }

    return (
      <HTMLContainer
        style={{
          overflow: 'hidden',
          pointerEvents: 'all',
          opacity: isErasing ? 0.2 : opacity,
          border: '1px solid rgb(52, 52, 52)',
          backgroundColor: '#ffffff',
          boxShadow: isBinding ? '0px 0px 0 16px var(--tl-binding)' : '',
        }}
        {...events}
      >
        {pageId && (
          <div
            className="ls-whiteboard-card-header"
            style={{
              height: '32px',
              width: '100%',
              background: '#bbb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {pageId}
            {linkButton}
          </div>
        )}
        <div
          style={{
            width: '100%',
            overflow: 'auto',
            overscrollBehavior: 'none',
            height: pageId ? 'calc(100% - 33px)' : '100%',
            pointerEvents: isSelected ? 'none' : 'all',
            userSelect: 'none',
            opacity: isSelected ? 0.5 : 1,
          }}
        >
          {pageId ? (
            <div
              onWheelCapture={stop}
              onPointerDown={stop}
              onPointerUp={stop}
              style={{ padding: '0 24px' }}
            >
              <Page pageId={pageId} />
            </div>
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden',
                justifyContent: 'center',
                padding: 16,
              }}
            >
              LOGSEQ PORTAL PLACEHOLDER
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
    return <rect width={w} height={h} fill="transparent" />
  })

  validateProps = (props: Partial<LogseqPortalShapeProps>) => {
    if (props.size !== undefined) {
      props.size[0] = Math.max(props.size[0], 50)
      props.size[1] = Math.max(props.size[1], 50)
    }
    return withClampedStyles(props)
  }
}
