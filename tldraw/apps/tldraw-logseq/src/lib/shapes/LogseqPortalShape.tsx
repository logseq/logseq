/* eslint-disable @typescript-eslint/no-explicit-any */
import { TLBoxShape, TLBoxShapeProps, TLResizeInfo, validUUID } from '@tldraw/core'
import { HTMLContainer, TLComponentProps, useApp } from '@tldraw/react'
import Vec from '@tldraw/vec'
import { makeObservable, runInAction } from 'mobx'
import { observer } from 'mobx-react-lite'
import * as React from 'react'
import { TablerIcon } from '~components/icons'
import { SelectInput, SelectOption } from '~components/inputs/SelectInput'
import { SwitchInput } from '~components/inputs/SwitchInput'
import { useCameraMovingRef } from '~hooks/useCameraMoving'
import type { Shape } from '~lib'
import { LogseqContext, SearchResult } from '~lib/logseq-context'
import { CustomStyleProps, withClampedStyles } from './style-props'

const HEADER_HEIGHT = 40
const AUTO_RESIZE_THRESHOLD = 1

export interface LogseqPortalShapeProps extends TLBoxShapeProps, CustomStyleProps {
  type: 'logseq-portal'
  pageId: string // page name or UUID
  blockType?: 'P' | 'B'
  collapsed?: boolean
  compact?: boolean
  collapsedHeight?: number
  scaleLevel?: SizeLevel
}

interface LogseqQuickSearchProps {
  onChange: (id: string) => void
}

const sizeOptions: SelectOption[] = [
  {
    label: 'Extra Small',
    value: 'xs',
  },
  {
    label: 'Small',
    value: 'sm',
  },
  {
    label: 'Medium',
    value: 'md',
  },
  {
    label: 'Large',
    value: 'lg',
  },
  {
    label: 'Extra Large',
    value: 'xl',
  },
  {
    label: '2 Extra Large',
    value: 'xxl',
  },
]

const levelToScale = {
  xs: 0.5,
  sm: 0.8,
  md: 1,
  lg: 1.5,
  xl: 2,
  xxl: 3,
}

type SizeLevel = keyof typeof levelToScale

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

const useSearch = (q: string) => {
  const { handlers } = React.useContext(LogseqContext)
  const [results, setResults] = React.useState<SearchResult | null>(null)

  React.useEffect(() => {
    let canceled = false
    const searchHandler = handlers?.search
    if (q.length > 0 && searchHandler) {
      handlers.search(q).then(_results => {
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
  }, [q, handlers?.search])

  return results
}

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
    scaleLevel: 'md',
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
        <SelectInput
          options={sizeOptions}
          value={this.props.scaleLevel ?? 'md'}
          onValueChange={v => {
            const newSize = Vec.mul(
              this.props.size,
              levelToScale[(v as SizeLevel) ?? 'md'] / levelToScale[this.props.scaleLevel ?? 'md']
            )
            this.update({
              scaleLevel: v,
            })
            setTimeout(() => {
              this.update({
                size: newSize,
              })
              app.persist()
            })
          }}
        />
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
      if (height !== null && Math.abs(height - this.props.size[1]) > AUTO_RESIZE_THRESHOLD) {
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
    const { handlers, renderers } = React.useContext(LogseqContext)
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
          app.setEditingShape(this)
          window.logseq?.api?.edit_block?.(uuid)
        })
      }
      return uuid
    }, [])

    const optionsWrapperRef = React.useRef<HTMLDivElement>(null)

    const [focusedOptionIdx, setFocusedOptionIdx] = React.useState<number>(0)

    const searchResult = useSearch(q)

    const [prefixIcon, setPrefixIcon] = React.useState<string>('circle-plus')
    const [searchFilter, setSearchFilter] = React.useState<'B' | 'P' | null>(null)

    React.useEffect(() => {
      // autofocus seems not to be working
      setTimeout(() => {
        rInput.current?.focus()
      })
    }, [searchFilter])

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

      // New page option
      if (searchResult?.pages?.length === 0 && q) {
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
        <div className="tl-quick-search-indicator">
          <TablerIcon name={prefixIcon} className="tl-quick-search-icon" />
        </div>
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
          <div className="tl-quick-search-input-sizer" data-value={q}>
            <div className="tl-quick-search-input-hidden">{q}</div>
            <input
              ref={rInput}
              type="text"
              value={q}
              placeholder="Create or search your graph..."
              onChange={q => setQ(q.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  finishCreating(q)
                }
              }}
              className="tl-quick-search-input"
            />
          </div>
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
                // we have to use mousedown && stop propagation, otherwise some
                // default behavior of clicking the rendered elements will happen
                onMouseDown={e => {
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
      if (this.shouldAutoResizeHeight()) {
        const newHeight = innerHeight + this.getHeaderHeight()
        if (innerHeight && Math.abs(newHeight - this.props.size[1]) > AUTO_RESIZE_THRESHOLD) {
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
      props: { opacity, pageId, stroke, fill, scaleLevel },
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
            <div
              className="tl-logseq-portal-container"
              data-collapsed={this.props.collapsed}
              data-page-id={pageId}
              data-portal-selected={portalSelected}
              style={{
                background: this.props.compact ? 'transparent' : fill,
                boxShadow: isBinding
                  ? '0px 0px 0 var(--tl-binding-distance) var(--tl-binding)'
                  : 'none',
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
      const scale = levelToScale[this.props.scaleLevel ?? 'md']
      props.size[0] = Math.max(props.size[0], 240 * scale)
      props.size[1] = Math.max(props.size[1], HEADER_HEIGHT * scale)
    }
    return withClampedStyles(props)
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
