/* eslint-disable @typescript-eslint/no-explicit-any */
import { MagnifyingGlassIcon } from '@radix-ui/react-icons'
import { TLBoxShape, TLBoxShapeProps, validUUID } from '@tldraw/core'
import { HTMLContainer, TLComponentProps, TLReactApp, useApp } from '@tldraw/react'
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
  compact?: boolean
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
    compact: false,
  }

  hideRotateHandle = true
  canChangeAspectRatio = true
  canFlip = true
  canEdit = true

  persist: (() => void) | null = null
  // For quick add shapes, we want to calculate the page height dynamically
  initialHeightCalculated = true
  getInnerHeight: (() => number) | null = null // will be overridden in the hook

  constructor(props = {} as Partial<LogseqPortalShapeProps>) {
    super(props)
    makeObservable(this)
    if (props.collapsed || props.compact) {
      Object.assign(this.canResize, [true, false])
    }
  }

  static isPageOrBlock(id: string): 'P' | 'B' | false {
    const blockRefEg = '((62af02d0-0443-42e8-a284-946c162b0f89))'
    if (id) {
      return /^\(\(.*\)\)$/.test(id) && id.length === blockRefEg.length ? 'B' : 'P'
    }
    return false
  }

  useComponentSize<T extends HTMLElement>(ref: React.RefObject<T> | null, selector = '') {
    const [size, setSize] = React.useState<[number, number]>([0, 0])
    React.useEffect(() => {
      console.log(ref?.current)
      if (ref?.current) {
        const el = selector ? ref.current.querySelector<HTMLElement>(selector) : ref.current
        if (el) {
          const updateSize = () => {
            const { width, height } = el.getBoundingClientRect()
            setSize([width, height])
            return [width, height]
          }
          updateSize()
          this.getInnerHeight = () => updateSize()[1]
          const resizeObserver = new ResizeObserver(() => {
            updateSize()
          })
          resizeObserver.observe(el)
          return () => {
            resizeObserver.disconnect()
          }
        }
      }
      return () => {}
    }, [ref, selector])
    return size
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
        {this.props.blockType !== 'B' && (
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
        )}

        {this.props.blockType === 'B' && (
          <SwitchInput
            label="Compact"
            checked={this.props.compact}
            onCheckedChange={compact => {
              this.update({ compact })
              this.canResize[1] = !compact
              this.autoResizeHeight()
            }}
          />
        )}
      </>
    )
  })

  autoResizeHeight(ttl = 5) {
    setTimeout(() => {
      if (this.getInnerHeight) {
        this.update({
          size: [
            this.props.size[0],
            this.getInnerHeight() + (this.props.compact ? 0 : HEADER_HEIGHT),
          ],
        })
        this.persist?.()
        this.initialHeightCalculated = true
      } else if (ttl > 0) {
        this.autoResizeHeight(ttl - 1)
      }
    }, 10)
  }

  PortalComponent = observer(({ isBinding }: TLComponentProps) => {
    const {
      props: { pageId, stroke, fill },
    } = this
    const { renderers } = React.useContext(LogseqContext)
    if (!renderers?.Page) {
      return null // not being correctly configured
    }
    const { Page, Block, Breadcrumb, PageNameLink } = renderers

    const cpRefContainer = React.useRef<HTMLDivElement>(null)

    const [, innerHeight] = this.useComponentSize(
      cpRefContainer,
      this.props.compact
        ? '.tl-logseq-cp-container > .single-block'
        : '.tl-logseq-cp-container > .page'
    )

    return (
      <div
        className="tl-logseq-portal-container"
        style={{
          background: this.props.compact ? 'transparent' : fill,
          boxShadow: isBinding ? '0px 0px 0 var(--tl-binding-distance) var(--tl-binding)' : 'none',
          color: stroke,
          // @ts-expect-error ???
          '--ls-primary-background-color': !fill?.startsWith('var') ? fill : undefined,
          '--ls-primary-text-color': !stroke?.startsWith('var') ? stroke : undefined,
          '--ls-title-text-color': !stroke?.startsWith('var') ? stroke : undefined,
        }}
      >
        {!this.props.compact && (
          <LogseqPortalShapeHeader type={this.props.blockType ?? 'P'}>
            {this.props.blockType === 'P' ? (
              <PageNameLink pageName={pageId} />
            ) : (
              <Breadcrumb blockId={pageId} />
            )}
          </LogseqPortalShapeHeader>
        )}
        <div
          ref={cpRefContainer}
          className="tl-logseq-cp-container"
          style={{
            overflow: this.props.compact ? 'visible' : 'auto',
          }}
        >
          {this.props.blockType === 'B' && this.props.compact ? (
            <Block blockId={pageId} />
          ) : (
            <Page pageName={pageId} />
          )}
        </div>
      </div>
    )
  })

  ReactComponent = observer((componentProps: TLComponentProps) => {
    const { events, isErasing, isEditing } = componentProps
    const {
      props: { opacity, pageId },
    } = this

    const app = useApp<Shape>()
    this.persist = () => app.persist()
    const isMoving = useCameraMovingRef()
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
      this.initialHeightCalculated = false
      this.update({
        pageId: id,
        size: [600, 320],
        blockType: validUUID(id) ? 'B' : 'P',
      })
      app.selectTool('select')
      app.history.resume()
      app.history.persist()
    }, [])

    const showingPortal = !this.props.collapsed || isEditing

    const PortalComponent = this.PortalComponent

    React.useLayoutEffect(() => {
      if (this.props.compact && this.props.blockType === 'B') {
        const newHeight = innerHeight + (this.props.compact ? 0 : HEADER_HEIGHT)
        this.update({
          size: [this.props.size[0], newHeight],
        })
        app.persist()
      }
    }, [innerHeight, this.props.compact])

    React.useEffect(() => {
      if (!this.initialHeightCalculated) {
        this.autoResizeHeight()
      }
    }, [this.initialHeightCalculated])

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
          ) : showingPortal ? (
            <PortalComponent {...componentProps} />
          ) : null}
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

  getShapeSVGJsx({ preview }: any) {
    // Do not need to consider the original point here
    const bounds = this.getBounds()
    return (
      <>
        <rect
          stroke={this.props.stroke}
          strokeWidth={this.props.strokeWidth ?? 2}
          fill="#aaa"
          width={bounds.width}
          height={HEADER_HEIGHT}
        />
        <rect
          y={HEADER_HEIGHT}
          fill={this.props.fill}
          stroke={this.props.stroke}
          strokeWidth={this.props.strokeWidth ?? 2}
          fillOpacity={this.props.opacity ?? 0.2}
          width={bounds.width}
          height={bounds.height - HEADER_HEIGHT}
        />
        <text
          style={{
            transformOrigin: 'top left',
          }}
          transform={`translate(${bounds.width / 2}, ${10 + bounds.height / 2})`}
          textAnchor="middle"
          fontFamily="var(--ls-font-family)"
          fontSize="32"
          fill={this.props.stroke}
          stroke={this.props.stroke}
        >
          {this.props.pageId}
        </text>
      </>
    )
  }
}
