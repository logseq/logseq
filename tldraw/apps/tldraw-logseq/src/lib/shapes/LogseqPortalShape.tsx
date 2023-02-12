/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  delay,
  getComputedColor,
  TLBoxShape,
  TLBoxShapeProps,
  TLResetBoundsInfo,
  TLResizeInfo,
  validUUID,
} from '@tldraw/core'
import { HTMLContainer, TLComponentProps, useApp } from '@tldraw/react'
import Vec from '@tldraw/vec'
import { action, computed, makeObservable } from 'mobx'
import { observer } from 'mobx-react-lite'
import * as React from 'react'
import type { Shape, SizeLevel } from '.'
import { CircleButton } from '../../components/Button'
import { LogseqQuickSearch } from '../../components/QuickSearch'
import { useCameraMovingRef } from '../../hooks/useCameraMoving'
import { LogseqContext } from '../logseq-context'
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

const levelToScale = {
  xs: 0.5,
  sm: 0.8,
  md: 1,
  lg: 1.5,
  xl: 2,
  xxl: 3,
}

const LogseqPortalShapeHeader = observer(
  ({
    type,
    fill,
    opacity,
    children,
  }: {
    type: 'P' | 'B'
    fill?: string
    opacity: number
    children: React.ReactNode
  }) => {
    const bgColor =
      fill !== 'var(--ls-secondary-background-color)'
        ? getComputedColor(fill, 'background')
        : 'var(--ls-tertiary-background-color)'

    return (
      <div
        className={`tl-logseq-portal-header tl-logseq-portal-header-${
          type === 'P' ? 'page' : 'block'
        }`}
      >
        <div
          className="absolute inset-0 tl-logseq-portal-header-bg"
          style={{
            opacity,
            background: type === 'P' ? bgColor : `linear-gradient(0deg, transparent, ${bgColor}`,
          }}
        ></div>
        <div className="relative">{children}</div>
      </div>
    )
  }
)

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
    stroke: '',
    fill: '',
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

  @action toggleCollapsed = async () => {
    const collapsed = !this.collapsed
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

  PortalComponent = observer(({}: TLComponentProps) => {
    const {
      props: { pageId, fill, opacity },
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

    const [loaded, setLoaded] = React.useState(false)

    React.useEffect(() => {
      setTimeout(function () {
        setLoaded(true)
      })
    }, [])

    return (
      <>
        <div
          className="absolute inset-0 tl-logseq-cp-container-bg"
          style={{
            textRendering: app.viewport.camera.zoom < 0.5 ? 'optimizeSpeed' : 'auto',
            background:
              fill && fill !== 'var(--ls-secondary-background-color)'
                ? `var(--ls-highlight-color-${fill})`
                : 'var(--ls-secondary-background-color)',
            opacity,
          }}
        ></div>
        <div
          ref={cpRefContainer}
          className="relative tl-logseq-cp-container"
          style={{ overflow: this.props.isAutoResizing ? 'visible' : 'auto' }}
        >
          {(loaded || !this.initialHeightCalculated) &&
            (this.props.blockType === 'B' && this.props.compact ? (
              <Block blockId={pageId} />
            ) : (
              <Page pageName={pageId} />
            ))}
        </div>
      </>
    )
  })

  ReactComponent = observer((componentProps: TLComponentProps) => {
    const { events, isErasing, isEditing, isBinding } = componentProps
    const {
      props: { opacity, pageId, fill, scaleLevel, strokeWidth, size },
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

    React.useEffect(() => {
      if (isCreating) {
        const screenSize = [app.viewport.bounds.width, app.viewport.bounds.height]
        const boundScreenCenter = app.viewport.getScreenPoint([this.bounds.minX, this.bounds.minY])

        if (
          boundScreenCenter[0] > screenSize[0] - 400 ||
          boundScreenCenter[1] > screenSize[1] - 240 ||
          app.viewport.camera.zoom > 1.5 ||
          app.viewport.camera.zoom < 0.5
        ) {
          app.viewport.zoomToBounds({ ...this.bounds, minY: this.bounds.maxY + 25 })
        }
      }
    }, [app.viewport.bounds.height.toFixed(2)])

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

    const { Breadcrumb, PageName } = renderers

    const portalStyle: React.CSSProperties = {
      width: `calc(100% / ${scaleRatio})`,
      height: `calc(100% / ${scaleRatio})`,
      opacity: isErasing ? 0.2 : 1,
    }

    // Reduce the chance of blurry text
    if (scaleRatio !== 1) {
      portalStyle.transform = `scale(${scaleRatio})`
    }

    return (
      <HTMLContainer
        style={{
          pointerEvents: 'all',
        }}
        {...events}
      >
        {isBinding && <BindingIndicator mode="html" strokeWidth={strokeWidth} size={size} />}
        <div
          data-inner-events={!tlEventsEnabled}
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
            <LogseqQuickSearch
              onChange={onPageNameChanged}
              onAddBlock={uuid => {
                // wait until the editor is mounted
                setTimeout(() => {
                  app.api.editShape(this)
                  window.logseq?.api?.edit_block?.(uuid)
                })
              }}
              placeholder="Create or search your graph..."
            />
          ) : (
            <>
              <div
                className="tl-logseq-portal-container"
                data-collapsed={this.collapsed}
                data-page-id={pageId}
                data-portal-selected={portalSelected}
                data-editing={isEditing}
                style={portalStyle}
              >
                {!this.props.compact && !targetNotFound && (
                  <LogseqPortalShapeHeader
                    type={this.props.blockType ?? 'P'}
                    fill={fill}
                    opacity={opacity}
                  >
                    {this.props.blockType === 'P' ? (
                      <PageName pageName={pageId} />
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
                onClick={this.toggleCollapsed}
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
    return <rect width={bounds.width} height={bounds.height} fill="transparent" rx={8} ry={8} />
  })

  validateProps = (props: Partial<LogseqPortalShapeProps>) => {
    if (props.size !== undefined) {
      const scale = levelToScale[this.props.scaleLevel ?? 'md']
      props.size[0] = Math.max(props.size[0], 60 * scale)
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
          fill={
            this.props.fill && this.props.fill !== 'var(--ls-secondary-background-color)'
              ? `var(--ls-highlight-color-${this.props.fill})`
              : 'var(--ls-secondary-background-color)'
          }
          stroke={getComputedColor(this.props.fill, 'background')}
          strokeWidth={this.props.strokeWidth ?? 2}
          fillOpacity={this.props.opacity ?? 0.2}
          width={bounds.width}
          rx={8}
          ry={8}
          height={bounds.height}
        />
        {!this.props.compact && (
          <rect
            fill={
              this.props.fill && this.props.fill !== 'var(--ls-secondary-background-color)'
                ? getComputedColor(this.props.fill, 'background')
                : 'var(--ls-tertiary-background-color)'
            }
            fillOpacity={this.props.opacity ?? 0.2}
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
          fill="var(--ls-secondary-text-color)"
          stroke="var(--ls-secondary-text-color)"
        >
          {this.props.blockType === 'P' ? this.props.pageId : ''}
        </text>
      </>
    )
  }
}
