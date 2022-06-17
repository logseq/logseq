/* eslint-disable @typescript-eslint/no-explicit-any */
import { TLBoxShape, TLBoxShapeProps } from '@tldraw/core'
import { HTMLContainer, TLComponentProps, useApp } from '@tldraw/react'
import { MagnifyingGlassIcon } from '@radix-ui/react-icons'
import { makeObservable, transaction } from 'mobx'
import { observer } from 'mobx-react-lite'
import * as React from 'react'
import { useCameraMovingRef } from '~hooks/useCameraMoving'
import type { Shape } from '~lib'
import { LogseqContext } from '~lib/logseq-context'
import { CustomStyleProps, withClampedStyles } from './style-props'

export interface LogseqPortalShapeProps extends TLBoxShapeProps, CustomStyleProps {
  type: 'logseq-portal'
  pageId: string // page name or UUID
}

interface LogseqQuickSearchProps {
  onChange: (id: string) => void
}

const LogseqQuickSearch = observer(({ onChange }: LogseqQuickSearchProps) => {
  const [q, setQ] = React.useState('')
  const rInput = React.useRef<HTMLInputElement>(null)
  const { search } = React.useContext(LogseqContext)

  const secretPrefix = 'œ::'

  const commitChange = React.useCallback((id: string) => {
    setQ(id)
    onChange(id)
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

  React.useEffect(() => {
    setTimeout(() => {
      rInput.current?.focus()
    })
  }, [])

  return (
    <div className="tl-quick-search">
      <div className="tl-quick-search-input-container">
        <MagnifyingGlassIcon className="tl-quick-search-icon" width={24} height={24} />
        <div className="tl-quick-search-input-sizer" data-value={q}>
          <input
            ref={rInput}
            type="text"
            value={q}
            placeholder="Search or create page"
            onChange={handleChange}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                commitChange(q)
              }
            }}
            className="tl-quick-search-input text-input"
          />
        </div>
      </div>

      <div className="tl-quick-search-options">
        {options?.map(name => (
          <div key={name} className="tl-quick-search-option" onClick={() => commitChange(name)}>
            {name}
          </div>
        ))}
      </div>
    </div>
  )
})

export class LogseqPortalShape extends TLBoxShape<LogseqPortalShapeProps> {
  static id = 'logseq-portal'
  static smart = true

  static defaultProps: LogseqPortalShapeProps = {
    id: 'logseq-portal',
    type: 'logseq-portal',
    parentId: 'page',
    point: [0, 0],
    size: [600, 50],
    stroke: 'transparent',
    fill: 'var(--ls-secondary-background-color)',
    strokeWidth: 2,
    opacity: 1,
    pageId: '',
  }

  hideRotateHandle = true
  canChangeAspectRatio = true
  canFlip = true
  canActivate = true
  canEdit = true

  ReactComponent = observer(({ events, isErasing, isActivated }: TLComponentProps) => {
    const {
      props: { opacity, pageId, strokeWidth, stroke, fill },
    } = this

    const app = useApp<Shape>()
    const isMoving = useCameraMovingRef()
    const { Page } = React.useContext(LogseqContext)
    const isSelected = app.selectedIds.has(this.id)
    const tlEventsEnabled = isMoving || isSelected || app.selectedTool.id !== 'select'
    const stop = React.useCallback(
      e => {
        if (!tlEventsEnabled) {
          e.stopPropagation()
        }
      },
      [tlEventsEnabled]
    )

    const commitChange = React.useCallback((id: string) => {
      transaction(() => {
        this.update({
          pageId: id,
          size: [600, 320],
        })
        this.setDraft(false)
        app.setActivatedShapes([])
        app.persist()
      })
    }, [])

    if (!Page) {
      return null // not being correctly configured
    }

    return (
      <HTMLContainer
        style={{
          pointerEvents: 'all',
          opacity: isErasing ? 0.2 : opacity,
        }}
        {...events}
      >
        <div
          onWheelCapture={stop}
          onPointerDown={stop}
          onPointerUp={stop}
          style={{
            width: '100%',
            height: '100%',
            pointerEvents: isActivated ? 'all' : 'none',
          }}
        >
          {this.draft ? (
            <LogseqQuickSearch onChange={commitChange} />
          ) : (
            <div
              style={{
                width: '100%',
                overflow: 'auto',
                borderRadius: '8px',
                overscrollBehavior: 'none',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: fill,
                boxShadow: isActivated
                  ? '0px 0px 0 var(--tl-binding-distance) var(--tl-binding)'
                  : '',
                opacity: isSelected ? 0.8 : 1,
              }}
            >
              <div className="tl-logseq-portal-header">
                <span className="text-xs rounded border mr-2 px-1">P</span>
                {pageId}
              </div>
              <div
                style={{
                  width: '100%',
                  overflow: 'auto',
                  borderRadius: '8px',
                  overscrollBehavior: 'none',
                  // height: '100%',
                  flex: 1,
                }}
              >
                <div
                  style={{
                    padding: '12px',
                    height: '100%',
                    cursor: 'default',
                  }}
                >
                  <Page pageId={pageId} />
                </div>
              </div>
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
