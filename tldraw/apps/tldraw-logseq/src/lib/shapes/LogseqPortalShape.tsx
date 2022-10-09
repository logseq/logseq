/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  delay,
  TLBoxShape,
  TLBoxShapeProps,
  TLResetBoundsInfo,
  TLResizeInfo,
  validUUID,
} from '@tldraw/core'
import { HTMLContainer, TLComponentProps, useApp } from '@tldraw/react'
import { useDebouncedValue } from '@tldraw/react'
import Vec from '@tldraw/vec'
import { action, computed, makeObservable } from 'mobx'
import { observer } from 'mobx-react-lite'
import * as React from 'react'
import type { SizeLevel, Shape } from '.'
import { TablerIcon } from '../../components/icons'
import { TextInput } from '../../components/inputs/TextInput'
import { useCameraMovingRef } from '../../hooks/useCameraMoving'
import { LogseqContext, type SearchResult } from '../logseq-context'
import { BindingIndicator } from './BindingIndicator'
import { CustomStyleProps, withClampedStyles } from './style-props'

const HEADER_HEIGHT = 40
const AUTO_RESIZE_THRESHOLD = 1

export interface LogseqPortalShapeProps extends TLBoxShapeProps, CustomStyleProps {
  type: 'logseq-portal'
  pageId: string // page name or UUID
  blockType?: 'P' | 'B'
  collapsed?: boolean
  compact?: boolean
  borderRadius?: number
  collapsedHeight?: number
  scaleLevel?: SizeLevel
}

interface LogseqQuickSearchProps {
  onChange: (id: string) => void
}

const levelToScale = {
  xs: 0.5,
  sm: 0.8,
  md: 1,
  lg: 1.5,
  xl: 2,
  xxl: 3,
}

const LogseqTypeTag = ({
  type,
  active,
}: {
  type: 'B' | 'P' | 'WP' | 'BS' | 'PS'
  active?: boolean
}) => {
  const nameMapping = {
    B: 'block',
    P: 'page',
    WP: 'whiteboard',
    BS: 'block-search',
    PS: 'page-search',
  }
  return (
    <span className="tl-type-tag" data-active={active}>
      <i className={`tie tie-${nameMapping[type]}`} />
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

function escapeRegExp(text: string) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
}

const highlightedJSX = (input: string, keyword: string) => {
  return (
    <span>
      {input
        .split(new RegExp(`(${escapeRegExp(keyword)})`, 'gi'))
        .map((part, index) => {
          if (index % 2 === 1) {
            return <mark className="tl-highlighted">{part}</mark>
          }
          return part
        })
        .map((frag, idx) => (
          <React.Fragment key={idx}>{frag}</React.Fragment>
        ))}
    </span>
  )
}

const useSearch = (q: string, searchFilter: 'B' | 'P' | null) => {
  const { handlers } = React.useContext(LogseqContext)
  const [results, setResults] = React.useState<SearchResult | null>(null)
  const dq = useDebouncedValue(q, 200)

  React.useEffect(() => {
    let canceled = false
    if (dq.length > 0) {
      const filter = { 'pages?': true, 'blocks?': true, 'files?': false }
      if (searchFilter === 'B') {
        filter['pages?'] = false
      } else if (searchFilter === 'P') {
        filter['blocks?'] = false
      }
      handlers.search(dq, filter).then(_results => {
        if (!canceled) {
          setResults(_results)
        }
      })
    } else {
      setResults(null)
    }
    return () => {
      canceled = true
    }
  }, [dq, handlers?.search])

  return results
}

const CircleButton = ({
  active,
  style,
  icon,
  otherIcon,
  onClick,
}: {
  active?: boolean
  style?: React.CSSProperties
  icon: string
  otherIcon?: string
  onClick: () => void
}) => {
  const [recentlyChanged, setRecentlyChanged] = React.useState(false)

  React.useEffect(() => {
    setRecentlyChanged(true)
    const timer = setTimeout(() => {
      setRecentlyChanged(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [active])

  return (
    <div
      data-active={active}
      data-recently-changed={recentlyChanged}
      style={style}
      className="tl-circle-button"
      onMouseDown={onClick}
    >
      <div className="tl-circle-button-icons-wrapper" data-icons-count={otherIcon ? 2 : 1}>
        {otherIcon && <TablerIcon name={otherIcon} />}
        <TablerIcon name={icon} />
      </div>
    </div>
  )
}

export class LogseqPortalShape extends TLBoxShape<LogseqPortalShapeProps> {
  static id = 'logseq-portal'
  static defaultSearchQuery = ''
  static defaultSearchFilter: 'B' | 'P' | null = null

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
    noFill: false,
    borderRadius: 8,
    strokeWidth: 2,
    strokeType: 'line',
    opacity: 1,
    pageId: '',
    collapsed: false,
    compact: false,
    scaleLevel: 'md',
    isAutoResizing: true,
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
    if (props.collapsed) {
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

  @computed get collapsed() {
    return this.props.blockType === 'B' ? this.props.compact : this.props.collapsed
  }

  @action setCollapsed = async (collapsed: boolean) => {
    if (this.props.blockType === 'B') {
      this.update({ compact: collapsed })
      this.canResize[1] = !collapsed
      if (!collapsed) {
        // this will also persist the state, so we can skip persist call
        await delay()
        this.onResetBounds()
      }
      this.persist?.()
    } else {
      const originalHeight = this.props.size[1]
      this.canResize[1] = !collapsed
      console.log(
        collapsed,
        collapsed ? this.getHeaderHeight() : this.props.collapsedHeight,
        this.getHeaderHeight(),
        this.props.collapsedHeight
      )
      this.update({
        isAutoResizing: !collapsed,
        collapsed: collapsed,
        size: [this.props.size[0], collapsed ? this.getHeaderHeight() : this.props.collapsedHeight],
        collapsedHeight: collapsed ? originalHeight : this.props.collapsedHeight,
      })
    }
  }

  @computed get scaleLevel() {
    return this.props.scaleLevel ?? 'md'
  }

  @action setScaleLevel = async (v?: SizeLevel) => {
    const newSize = Vec.mul(
      this.props.size,
      levelToScale[(v as SizeLevel) ?? 'md'] / levelToScale[this.props.scaleLevel ?? 'md']
    )
    this.update({
      scaleLevel: v,
    })
    await delay()
    this.update({
      size: newSize,
    })
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

  getHeaderHeight() {
    const scale = levelToScale[this.props.scaleLevel ?? 'md']
    return this.props.compact ? 0 : HEADER_HEIGHT * scale
  }

  getAutoResizeHeight() {
    if (this.getInnerHeight) {
      return this.getHeaderHeight() + this.getInnerHeight()
    }
    return null
  }

  onResetBounds = (info?: TLResetBoundsInfo) => {
    const height = this.getAutoResizeHeight()
    if (height !== null && Math.abs(height - this.props.size[1]) > AUTO_RESIZE_THRESHOLD) {
      this.update({
        size: [this.props.size[0], height],
      })
      this.initialHeightCalculated = true
    }
    return this
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

    if (this.props.isAutoResizing) {
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
    const [q, setQ] = React.useState(LogseqPortalShape.defaultSearchQuery)
    const [searchFilter, setSearchFilter] = React.useState<'B' | 'P' | null>(
      LogseqPortalShape.defaultSearchFilter
    )
    const rInput = React.useRef<HTMLInputElement>(null)
    const { handlers, renderers } = React.useContext(LogseqContext)
    const app = useApp<Shape>()

    const finishCreating = React.useCallback((id: string) => {
      onChange(id)
      rInput.current?.blur()
      if (id) {
        LogseqPortalShape.defaultSearchQuery = ''
        LogseqPortalShape.defaultSearchFilter = null
      }
    }, [])

    const onAddBlock = React.useCallback((content: string) => {
      const uuid = handlers?.addNewBlock(content)
      if (uuid) {
        finishCreating(uuid)
        // wait until the editor is mounted
        setTimeout(() => {
          app.api.editShape(this)
          window.logseq?.api?.edit_block?.(uuid)
        })
      }
      return uuid
    }, [])

    const optionsWrapperRef = React.useRef<HTMLDivElement>(null)

    const [focusedOptionIdx, setFocusedOptionIdx] = React.useState<number>(0)

    const searchResult = useSearch(q, searchFilter)

    const [prefixIcon, setPrefixIcon] = React.useState<string>('circle-plus')

    React.useEffect(() => {
      // autofocus seems not to be working
      setTimeout(() => {
        rInput.current?.focus()
      })
    }, [searchFilter])

    React.useEffect(() => {
      LogseqPortalShape.defaultSearchQuery = q
      LogseqPortalShape.defaultSearchFilter = searchFilter
    }, [q, searchFilter])

    type Option = {
      actionIcon: 'search' | 'circle-plus'
      onChosen: () => boolean // return true if the action was handled
      element: React.ReactNode
    }

    const options: Option[] = React.useMemo(() => {
      const options: Option[] = []

      const Breadcrumb = renderers?.Breadcrumb

      if (!Breadcrumb || !handlers) {
        return []
      }

      // New block option
      options.push({
        actionIcon: 'circle-plus',
        onChosen: () => {
          return !!onAddBlock(q)
        },
        element: (
          <div className="tl-quick-search-option-row">
            <LogseqTypeTag active type="B" />
            {q.length > 0 ? (
              <>
                <strong>New whiteboard block:</strong>
                {q}
              </>
            ) : (
              <strong>New whiteboard block</strong>
            )}
          </div>
        ),
      })

      // New page option when no exact match
      if (!searchResult?.pages?.some(p => p.toLowerCase() === q.toLowerCase()) && q) {
        options.push({
          actionIcon: 'circle-plus',
          onChosen: () => {
            finishCreating(q)
            return true
          },
          element: (
            <div className="tl-quick-search-option-row">
              <LogseqTypeTag active type="P" />
              <strong>New page:</strong>
              {q}
            </div>
          ),
        })
      }

      // search filters
      if (q.length === 0 && searchFilter === null) {
        options.push(
          {
            actionIcon: 'search',
            onChosen: () => {
              setSearchFilter('B')
              return true
            },
            element: (
              <div className="tl-quick-search-option-row">
                <LogseqTypeTag type="BS" />
                Search only blocks
              </div>
            ),
          },
          {
            actionIcon: 'search',
            onChosen: () => {
              setSearchFilter('P')
              return true
            },
            element: (
              <div className="tl-quick-search-option-row">
                <LogseqTypeTag type="PS" />
                Search only pages
              </div>
            ),
          }
        )
      }

      // Page results
      if ((!searchFilter || searchFilter === 'P') && searchResult && searchResult.pages) {
        options.push(
          ...searchResult.pages.map(page => {
            return {
              actionIcon: 'search' as 'search',
              onChosen: () => {
                finishCreating(page)
                return true
              },
              element: (
                <div className="tl-quick-search-option-row">
                  <LogseqTypeTag type={handlers.isWhiteboardPage(page) ? 'WP' : 'P'} />
                  {highlightedJSX(page, q)}
                </div>
              ),
            }
          })
        )
      }

      // Block results
      if ((!searchFilter || searchFilter === 'B') && searchResult && searchResult.blocks) {
        options.push(
          ...searchResult.blocks
            .filter(block => block.content && block.uuid)
            .map(({ content, uuid }) => {
              const block = handlers.queryBlockByUUID(uuid)
              return {
                actionIcon: 'search' as 'search',
                onChosen: () => {
                  if (block) {
                    finishCreating(uuid)
                    window.logseq?.api?.set_blocks_id?.([uuid])
                    return true
                  }
                  return false
                },
                element: block ? (
                  <>
                    <div className="tl-quick-search-option-row">
                      <LogseqTypeTag type="B" />
                      <div className="tl-quick-search-option-breadcrumb">
                        <Breadcrumb blockId={uuid} />
                      </div>
                    </div>
                    <div className="tl-quick-search-option-row">
                      <div className="tl-quick-search-option-placeholder" />
                      {highlightedJSX(content, q)}
                    </div>
                  </>
                ) : (
                  <div className="tl-quick-search-option-row">
                    Cache is outdated. Please click the 'Re-index' button in the graph's dropdown
                    menu.
                  </div>
                ),
              }
            })
        )
      }
      return options
    }, [q, searchFilter, searchResult, renderers?.Breadcrumb, handlers])

    React.useEffect(() => {
      const keydownListener = (e: KeyboardEvent) => {
        let newIndex = focusedOptionIdx
        if (e.key === 'ArrowDown') {
          newIndex = Math.min(options.length - 1, focusedOptionIdx + 1)
        } else if (e.key === 'ArrowUp') {
          newIndex = Math.max(0, focusedOptionIdx - 1)
        } else if (e.key === 'Enter') {
          options[focusedOptionIdx]?.onChosen()
          e.stopPropagation()
          e.preventDefault()
        } else if (e.key === 'Backspace' && q.length === 0) {
          setSearchFilter(null)
        } else if (e.key === 'Escape') {
          finishCreating('')
        }

        if (newIndex !== focusedOptionIdx) {
          const option = options[newIndex]
          setFocusedOptionIdx(newIndex)
          setPrefixIcon(option.actionIcon)
          e.stopPropagation()
          e.preventDefault()
          const optionElement = optionsWrapperRef.current?.querySelector(
            '.tl-quick-search-option:nth-child(' + (newIndex + 1) + ')'
          )
          if (optionElement) {
            // @ts-expect-error we are using scrollIntoViewIfNeeded, which is not in standards
            optionElement?.scrollIntoViewIfNeeded(false)
          }
        }
      }
      document.addEventListener('keydown', keydownListener, true)
      return () => {
        document.removeEventListener('keydown', keydownListener, true)
      }
    }, [options, focusedOptionIdx, q])

    return (
      <div className="tl-quick-search">
        <CircleButton
          icon={prefixIcon}
          onClick={() => {
            options[focusedOptionIdx]?.onChosen()
          }}
        />
        <div className="tl-quick-search-input-container">
          {searchFilter && (
            <div className="tl-quick-search-input-filter">
              <LogseqTypeTag type={searchFilter} />
              {searchFilter === 'B' ? 'Search blocks' : 'Search pages'}
              <div
                className="tl-quick-search-input-filter-remove"
                onClick={() => setSearchFilter(null)}
              >
                <TablerIcon name="x" />
              </div>
            </div>
          )}
          <TextInput
            ref={rInput}
            type="text"
            value={q}
            className="tl-quick-search-input"
            placeholder="Create or search your graph..."
            onChange={q => setQ(q.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                finishCreating(q)
              }
            }}
          />
        </div>
        <div className="tl-quick-search-options" ref={optionsWrapperRef}>
          {options.map(({ actionIcon, onChosen, element }, index) => {
            return (
              <div
                key={index}
                data-focused={index === focusedOptionIdx}
                className="tl-quick-search-option"
                tabIndex={0}
                onMouseEnter={() => {
                  setPrefixIcon(actionIcon)
                  setFocusedOptionIdx(index)
                }}
                // we have to use mousedown && stop propagation EARLY, otherwise some
                // default behavior of clicking the rendered elements will happen
                onMouseDownCapture={e => {
                  if (onChosen()) {
                    e.stopPropagation()
                    e.preventDefault()
                  }
                }}
              >
                {element}
              </div>
            )
          })}
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
      if (this.props.isAutoResizing) {
        const latestInnerHeight = this.getInnerHeight?.() ?? innerHeight
        const newHeight = latestInnerHeight + this.getHeaderHeight()
        if (innerHeight && Math.abs(newHeight - this.props.size[1]) > AUTO_RESIZE_THRESHOLD) {
          this.update({
            size: [this.props.size[0], newHeight],
          })
          app.persist(true)
        }
      }
    }, [innerHeight, this.props.isAutoResizing])

    React.useEffect(() => {
      if (!this.initialHeightCalculated) {
        setTimeout(() => {
          this.onResetBounds()
          app.persist(true)
        })
      }
    }, [this.initialHeightCalculated])

    return (
      <div
        ref={cpRefContainer}
        className="tl-logseq-cp-container"
        style={{
          overflow: this.props.isAutoResizing ? 'visible' : 'auto',
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
      props: { opacity, pageId, stroke, fill, scaleLevel, strokeWidth, size },
    } = this

    const app = useApp<Shape>()
    const { renderers, handlers } = React.useContext(LogseqContext)

    this.persist = () => app.persist()
    const isMoving = useCameraMovingRef()
    const isSelected = app.selectedIds.has(this.id) && app.selectedIds.size === 1

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

    // There are some other portal sharing the same page id are selected
    const portalSelected =
      app.selectedShapesArray.length === 1 &&
      app.selectedShapesArray.some(
        shape =>
          shape.type === 'logseq-portal' &&
          shape.props.id !== this.props.id &&
          pageId &&
          (shape as LogseqPortalShape).props['pageId'] === pageId
      )

    const scaleRatio = levelToScale[scaleLevel ?? 'md']

    // It is a bit weird to update shapes here. Is there a better place?
    React.useEffect(() => {
      if (this.props.collapsed && isEditing) {
        // Should temporarily disable collapsing
        this.update({
          size: [this.props.size[0], this.props.collapsedHeight],
        })
        return () => {
          this.update({
            size: [this.props.size[0], this.getHeaderHeight()],
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

    const PortalComponent = this.PortalComponent
    const LogseqQuickSearch = this.LogseqQuickSearch

    const blockContent = React.useMemo(() => {
      if (pageId && this.props.blockType === 'B') {
        return handlers?.queryBlockByUUID(pageId)?.content
      }
    }, [handlers?.queryBlockByUUID, pageId])

    const targetNotFound = this.props.blockType === 'B' && typeof blockContent !== 'string'
    const showingPortal = (!this.props.collapsed || isEditing) && !targetNotFound

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
        {isBinding && <BindingIndicator mode="html" strokeWidth={strokeWidth} size={size} />}
        <div
          onWheelCapture={stop}
          onPointerDown={stop}
          onPointerUp={stop}
          style={{
            width: '100%',
            height: '100%',
            pointerEvents: !isMoving && (isEditing || isSelected) ? 'all' : 'none',
          }}
        >
          {isCreating ? (
            <LogseqQuickSearch onChange={onPageNameChanged} />
          ) : (
            <>
              <div
                className="tl-logseq-portal-container"
                data-collapsed={this.collapsed}
                data-page-id={pageId}
                data-portal-selected={portalSelected}
                data-editing={isEditing}
                style={{
                  background: this.props.compact ? 'transparent' : fill,
                  color: stroke,
                  width: `calc(100% / ${scaleRatio})`,
                  height: `calc(100% / ${scaleRatio})`,
                  transform: `scale(${scaleRatio})`,
                  // @ts-expect-error ???
                  '--ls-primary-background-color': !fill?.startsWith('var') ? fill : undefined,
                  '--ls-primary-text-color': !stroke?.startsWith('var') ? stroke : undefined,
                  '--ls-title-text-color': !stroke?.startsWith('var') ? stroke : undefined,
                }}
              >
                {!this.props.compact && !targetNotFound && (
                  <LogseqPortalShapeHeader type={this.props.blockType ?? 'P'}>
                    {this.props.blockType === 'P' ? (
                      <PageNameLink pageName={pageId} />
                    ) : (
                      <Breadcrumb blockId={pageId} />
                    )}
                  </LogseqPortalShapeHeader>
                )}
                {targetNotFound && <div className="tl-target-not-found">Target not found</div>}
                {showingPortal && <PortalComponent {...componentProps} />}
              </div>
              <CircleButton
                active={!!this.collapsed}
                style={{ opacity: isSelected ? 1 : 0 }}
                icon={this.props.blockType === 'B' ? 'block' : 'page'}
                onClick={() => this.setCollapsed(!this.collapsed)}
                otherIcon={'whiteboard-element'}
              />
            </>
          )}
        </div>
      </HTMLContainer>
    )
  })

  ReactIndicator = observer(() => {
    const bounds = this.getBounds()
    const app = useApp<Shape>()
    if (app.selectedShapesArray.length === 1) {
      return null
    }
    return <rect width={bounds.width} height={bounds.height} fill="transparent" rx={8} ry={8} />
  })

  validateProps = (props: Partial<LogseqPortalShapeProps>) => {
    if (props.size !== undefined) {
      const scale = levelToScale[this.props.scaleLevel ?? 'md']
      props.size[0] = Math.max(props.size[0], 240 * scale)
      props.size[1] = Math.max(props.size[1], HEADER_HEIGHT * scale)
    }
    return withClampedStyles(this, props)
  }

  getShapeSVGJsx({ preview }: any) {
    // Do not need to consider the original point here
    const bounds = this.getBounds()
    return (
      <>
        <rect
          fill={this.props.fill}
          stroke={this.props.stroke}
          strokeWidth={this.props.strokeWidth ?? 2}
          fillOpacity={this.props.opacity ?? 0.2}
          width={bounds.width}
          rx={8}
          ry={8}
          height={bounds.height}
        />
        {!this.props.compact && (
          <rect
            fill="#aaa"
            x={1}
            y={1}
            width={bounds.width - 2}
            height={HEADER_HEIGHT - 2}
            rx={8}
            ry={8}
          />
        )}
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
