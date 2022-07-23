/* eslint-disable @typescript-eslint/no-explicit-any */
import { MagnifyingGlassIcon } from '@radix-ui/react-icons'
import { TLBoxShape, TLBoxShapeProps, validUUID } from '@tldraw/core'
import { HTMLContainer, TLComponentProps, TLContextBarProps, useApp } from '@tldraw/react'
import { makeObservable } from 'mobx'
import { observer } from 'mobx-react-lite'
import * as React from 'react'
import { ColorInput } from '~components/inputs/ColorInput'
import { SwitchInput } from '~components/inputs/SwitchInput'
import { useCameraMovingRef } from '~hooks/useCameraMoving'
import type { Shape } from '~lib'
import { LogseqContext } from '~lib/logseq-context'
import { CustomStyleProps, withClampedStyles } from './style-props'

const HEADER_HEIGHT = 40

export interface LogseqPortalShapeProps extends TLBoxShapeProps, CustomStyleProps {
  type: 'logseq-portal'
  pageId: string // page name or UUID
  blockType?: 'P' | 'B'
  collapsed?: boolean
  collapsedHeight?: number
}

interface LogseqQuickSearchProps {
  onChange: (id: string) => void
}

const LogseqQuickSearch = observer(({ onChange }: LogseqQuickSearchProps) => {
  const [q, setQ] = React.useState('')
  const rInput = React.useRef<HTMLInputElement>(null)
  const { search } = React.useContext(LogseqContext)

  const commitChange = React.useCallback((id: string) => {
    setQ(id)
    onChange(id)
    rInput.current?.blur()
  }, [])

  const options = React.useMemo(() => {
    return search?.(q)
  }, [search, q])

  React.useEffect(() => {
    // autofocus seems not to be working
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
            onChange={q => setQ(q.target.value)}
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

const LogseqPortalShapeHeader = observer(
  ({ type, children }: { type: 'P' | 'B'; children: React.ReactNode }) => {
    return (
      <div className="tl-logseq-portal-header">
        <span className="type-tag">{type}</span>
        {children}
      </div>
    )
  }
)

export class LogseqPortalShape extends TLBoxShape<LogseqPortalShapeProps> {
  static id = 'logseq-portal'

  static defaultProps: LogseqPortalShapeProps = {
    id: 'logseq-portal',
    type: 'logseq-portal',
    parentId: 'page',
    point: [0, 0],
    size: [600, 50],
    // collapsedHeight is the height before collapsing
    collapsedHeight: 0,
    stroke: 'var(--ls-primary-text-color)',
    fill: 'var(--ls-secondary-background-color)',
    strokeWidth: 2,
    opacity: 1,
    pageId: '',
    collapsed: false,
  }

  hideRotateHandle = true
  canChangeAspectRatio = true
  canFlip = true
  canEdit = true

  constructor(props = {} as Partial<LogseqPortalShapeProps>) {
    super(props)
    makeObservable(this)
    if (props.collapsed) {
      this.canResize = [true, false]
    }
  }

  static isPageOrBlock(id: string): 'P' | 'B' | false {
    const blockRefEg = '((62af02d0-0443-42e8-a284-946c162b0f89))'
    if (id) {
      return /^\(\(.*\)\)$/.test(id) && id.length === blockRefEg.length ? 'B' : 'P'
    }
    return false
  }

  ReactContextBar = observer(() => {
    const app = useApp<Shape>()
    return (
      <>
        <ColorInput
          label="Background"
          value={this.props.fill}
          onChange={e => {
            this.update({
              fill: e.target.value,
            })
            app.persist(true)
          }}
        />
        <ColorInput
          label="Text"
          value={this.props.stroke}
          onChange={e => {
            this.update({
              stroke: e.target.value,
            })
            app.persist(true)
          }}
        />
        <SwitchInput
          label="Collapsed"
          checked={this.props.collapsed}
          onCheckedChange={collapsing => {
            const originalHeight = this.props.size[1]
            this.canResize[1] = !collapsing
            this.update({
              collapsed: collapsing,
              size: [this.props.size[0], collapsing ? HEADER_HEIGHT : this.props.collapsedHeight],
              collapsedHeight: collapsing ? originalHeight : this.props.collapsedHeight,
            })
            app.persist()
          }}
        />
      </>
    )
  })

  ReactComponent = observer(({ events, isErasing, isEditing, isBinding }: TLComponentProps) => {
    const {
      props: { opacity, pageId, stroke, fill },
    } = this

    const app = useApp<Shape>()
    const isMoving = useCameraMovingRef()
    const { renderers } = React.useContext(LogseqContext)
    const isSelected = app.selectedIds.has(this.id)
    const isCreating = app.isIn('logseq-portal.creating') && !pageId
    const tlEventsEnabled =
      (isMoving || (isSelected && !isEditing) || app.selectedTool.id !== 'select') && !isCreating
    const stop = React.useCallback(
      e => {
        if (!tlEventsEnabled) {
          // TODO: pinching inside Logseq Shape issue
          e.stopPropagation()
        }
      },
      [tlEventsEnabled]
    )

    // It is a bit weird to update shapes here. Is there a better place?
    React.useEffect(() => {
      if (this.props.collapsed && isEditing) {
        // Should temporarily disable collapsing
        this.update({
          size: [this.props.size[0], this.props.collapsedHeight],
        })
        return () => {
          this.update({
            size: [this.props.size[0], HEADER_HEIGHT],
          })
        }
      }
      return () => {
        // no-ops
      }
    }, [isEditing, this.props.collapsed])

    const onPageNameChanged = React.useCallback((id: string) => {
      this.update({
        pageId: id,
        size: [600, 320],
        blockType: validUUID(id) ? 'B' : 'P',
      })
      app.selectTool('select')
      app.history.resume()
      app.history.persist()
    }, [])

    if (!renderers?.Page || !renderers?.Breadcrumb) {
      return null // not being correctly configured
    }

    const { Page, Breadcrumb } = renderers

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
            pointerEvents: isEditing ? 'all' : 'none',
          }}
        >
          {isCreating ? (
            <LogseqQuickSearch onChange={onPageNameChanged} />
          ) : (
            <div
              className="tl-logseq-portal-container"
              style={{
                background: fill,
                boxShadow: isBinding
                  ? '0px 0px 0 var(--tl-binding-distance) var(--tl-binding)'
                  : 'var(--shadow-medium)',
                color: stroke,
                // @ts-expect-error ???
                '--ls-primary-background-color': fill,
                '--ls-primary-text-color': stroke,
                '--ls-title-text-color': stroke,
              }}
            >
              <LogseqPortalShapeHeader type={this.props.blockType ?? 'P'}>
                {this.props.blockType === 'P' ? pageId : <Breadcrumb blockId={pageId} />}
              </LogseqPortalShapeHeader>
              {(!this.props.collapsed || isEditing) && (
                <div
                  style={{
                    width: '100%',
                    overflow: 'auto',
                    borderRadius: '8px',
                    overscrollBehavior: 'none',
                    height: '100%',
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
                    <Page pageName={pageId} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </HTMLContainer>
    )
  })

  ReactIndicator = observer(() => {
    const bounds = this.getBounds()
    return <rect width={bounds.width} height={bounds.height} fill="transparent" />
  })

  validateProps = (props: Partial<LogseqPortalShapeProps>) => {
    if (props.size !== undefined) {
      props.size[0] = Math.max(props.size[0], 240)
      props.size[1] = Math.max(props.size[1], HEADER_HEIGHT)
    }
    return withClampedStyles(props)
  }
}
