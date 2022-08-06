/* eslint-disable @typescript-eslint/no-explicit-any */
import { MagnifyingGlassIcon } from '@radix-ui/react-icons'
import { TLBoxShape, TLBoxShapeProps, TLResizeInfo, validUUID } from '@tldraw/core'
import { HTMLContainer, TLComponentProps, useApp } from '@tldraw/react'
import Vec from '@tldraw/vec'
import { makeObservable, runInAction } from 'mobx'
import { observer } from 'mobx-react-lite'
import * as React from 'react'
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

const LogseqTypeTag = ({ type }: { type: 'B' | 'P' }) => {
  return (
    <span className="tl-type-tag">
      <i className={`tie tie-${type === 'B' ? 'block' : 'page'}`} />
    </span>
  )
}

const LogseqPortalShapeHeader = observer(
  ({ type, children }: { type: 'P' | 'B'; children: React.ReactNode }) => {
    return (
      <div className="tl-logseq-portal-header">
        <LogseqTypeTag type={type} />
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
    size: [400, 50],
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

  persist: ((replace?: boolean) => void) | null = null
  // For quick add shapes, we want to calculate the page height dynamically
  initialHeightCalculated = true
  getInnerHeight: (() => number) | null = null // will be overridden in the hook

  constructor(props = {} as Partial<LogseqPortalShapeProps>) {
    super(props)
    makeObservable(this)
    if (props.collapsed || props.compact) {
      Object.assign(this.canResize, [true, false])
    }
    if (props.size?.[1] === 0) {
      this.initialHeightCalculated = false
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
    const app = useApp<Shape>()
    React.useEffect(() => {
      if (ref?.current) {
        const el = selector ? ref.current.querySelector<HTMLElement>(selector) : ref.current
        if (el) {
          const updateSize = () => {
            const { width, height } = el.getBoundingClientRect()
            const bound = Vec.div([width, height], app.viewport.camera.zoom) as [number, number]
            setSize(bound)
            return bound
          }
          updateSize()
          // Hacky, I know 🤨
          this.getInnerHeight = () => updateSize()[1] + 2 // 2 is a hack to compensate for the border
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
        {this.props.blockType !== 'B' && (
          <SwitchInput
            label="Collapsed"
            checked={this.props.collapsed}
            onCheckedChange={collapsing => {
              runInAction(() => {
                const originalHeight = this.props.size[1]
                this.canResize[1] = !collapsing
                this.update({
                  collapsed: collapsing,
                  size: [
                    this.props.size[0],
                    collapsing ? HEADER_HEIGHT : this.props.collapsedHeight,
                  ],
                  collapsedHeight: collapsing ? originalHeight : this.props.collapsedHeight,
                })
                app.persist()
              })
            }}
          />
        )}

        {this.props.blockType === 'B' && (
          <SwitchInput
            label="Compact"
            checked={this.props.compact}
            onCheckedChange={compact => {
              runInAction(() => {
                this.update({ compact })
                this.canResize[1] = !compact
                if (!compact) {
                  // this will also persist the state, so we can skip persist call
                  this.autoResizeHeight()
                } else {
                  app.persist()
                }
              })
            }}
          />
        )}
      </>
    )
  })

  shouldAutoResizeHeight() {
    return this.props.blockType === 'B' && this.props.compact
  }

  getHeaderHeight() {
    return this.props.compact ? 0 : HEADER_HEIGHT
  }

  getAutoResizeHeight() {
    if (this.getInnerHeight) {
      return this.getHeaderHeight() + this.getInnerHeight()
    }
    return null
  }

  autoResizeHeight(replace: boolean = false) {
    setTimeout(() => {
      const height = this.getAutoResizeHeight()
      if (height !== null) {
        this.update({
          size: [this.props.size[0], height],
        })
        this.persist?.(replace)
        this.initialHeightCalculated = true
      }
    })
  }

  onResize = (initialProps: any, info: TLResizeInfo): this => {
    const {
      bounds,
      rotation,
      scale: [scaleX, scaleY],
    } = info
    const nextScale = [...this.scale]
    if (scaleX < 0) nextScale[0] *= -1
    if (scaleY < 0) nextScale[1] *= -1

    let height = bounds.height

    if (this.shouldAutoResizeHeight()) {
      height = this.getAutoResizeHeight() ?? height
    }
    return this.update({
      point: [bounds.minX, bounds.minY],
      size: [Math.max(1, bounds.width), Math.max(1, height)],
      scale: nextScale,
      rotation,
    })
  }

  LogseqQuickSearch = observer(({ onChange }: LogseqQuickSearchProps) => {
    const [q, setQ] = React.useState('')
    const rInput = React.useRef<HTMLInputElement>(null)
    const { handlers } = React.useContext(LogseqContext)
    const app = useApp<Shape>()

    const finishCreating = React.useCallback((id: string) => {
      onChange(id)
      rInput.current?.blur()
    }, [])

    const onAddBlock = React.useCallback((content: string) => {
      const uuid = handlers?.addNewBlock(content)
      if (uuid) {
        finishCreating(uuid)
        // wait until the editor is mounted
        setTimeout(() => {
          // @ts-expect-error ???
          const logseqApi = window.logseq?.api as any
          if (logseqApi) {
            app.setEditingShape(this)
            logseqApi.edit_block(uuid)
          }
        })
      }
    }, [])

    const options = React.useMemo(() => {
      return handlers?.search?.(q)
    }, [handlers?.search, q])

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
                  finishCreating(q)
                }
              }}
              className="tl-quick-search-input text-input"
            />
          </div>
        </div>
        <div className="tl-quick-search-options">
          <div className="tl-quick-search-option" onClick={() => onAddBlock(q)}>
            <LogseqTypeTag type="B" />
            New block{q.length > 0 ? `: ${q}` : ''}
          </div>
          {options?.length === 0 && q && (
            <div className="tl-quick-search-option" onClick={() => finishCreating(q)}>
              <LogseqTypeTag type="P" />
              New page: {q}
            </div>
          )}
          {options?.map(name => (
            <div key={name} className="tl-quick-search-option" onClick={() => finishCreating(name)}>
              {name}
            </div>
          ))}
        </div>
      </div>
    )
  })

  PortalComponent = observer(({}: TLComponentProps) => {
    const {
      props: { pageId },
    } = this
    const { renderers } = React.useContext(LogseqContext)
    const app = useApp<Shape>()

    const cpRefContainer = React.useRef<HTMLDivElement>(null)

    const [, innerHeight] = this.useComponentSize(
      cpRefContainer,
      this.props.compact
        ? '.tl-logseq-cp-container > .single-block'
        : '.tl-logseq-cp-container > .page'
    )

    if (!renderers?.Page) {
      return null // not being correctly configured
    }
    const { Page, Block } = renderers

    React.useEffect(() => {
      if (this.shouldAutoResizeHeight()) {
        const newHeight = innerHeight + this.getHeaderHeight() + 2
        if (innerHeight && newHeight !== this.props.size[1]) {
          this.update({
            size: [this.props.size[0], newHeight],
          })
          app.persist(true)
        }
      }
    }, [innerHeight, this.props.compact])

    React.useEffect(() => {
      if (!this.initialHeightCalculated) {
        this.autoResizeHeight(true)
      }
    }, [this.initialHeightCalculated])

    return (
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
    )
  })

  ReactComponent = observer((componentProps: TLComponentProps) => {
    const { events, isErasing, isEditing, isBinding } = componentProps
    const {
      props: { opacity, pageId, stroke, fill },
    } = this

    const app = useApp<Shape>()
    const { renderers } = React.useContext(LogseqContext)

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
      const blockType = validUUID(id) ? 'B' : 'P'
      this.update({
        pageId: id,
        size: [400, 320],
        blockType: blockType,
        compact: blockType === 'B',
      })
      app.selectTool('select')
      app.history.resume()
      app.history.persist()
    }, [])

    const showingPortal = !this.props.collapsed || isEditing

    const PortalComponent = this.PortalComponent
    const LogseqQuickSearch = this.LogseqQuickSearch

    if (!renderers?.Page) {
      return null // not being correctly configured
    }
    const { Breadcrumb, PageNameLink } = renderers

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
                background: this.props.compact ? 'transparent' : fill,
                boxShadow: isBinding
                  ? '0px 0px 0 var(--tl-binding-distance) var(--tl-binding)'
                  : 'none',
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
              {showingPortal && <PortalComponent {...componentProps} />}
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
          {this.props.blockType === 'P' ? this.props.pageId : ''}
        </text>
      </>
    )
  }
}
