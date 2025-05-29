/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  EMPTY_OBJECT,
  isNonNullable,
  TLAsset,
  TLBinding,
  TLBounds,
  TLCursor,
  TLTheme,
} from '@tldraw/core'
import { observer } from 'mobx-react-lite'
import * as React from 'react'
import { NOOP } from '../../constants'
import {
  useApp,
  useCanvasEvents,
  useCursor,
  useGestureEvents,
  usePreventNavigation,
  useRendererContext,
  useResizeObserver,
  useRestoreCamera,
  useStylesheet,
  useZoom,
} from '../../hooks'
import { useKeyboardEvents } from '../../hooks/useKeyboardEvents'
import type { TLReactShape } from '../../lib'
import { Container } from '../Container'
import { ContextBarContainer } from '../ContextBarContainer'
import { HTMLLayer } from '../HTMLLayer'
import { Indicator } from '../Indicator'
import { QuickLinksContainer } from '../QuickLinksContainer'
import { BacklinksCountContainer } from '../BacklinksCountContainer'
import { SelectionDetailContainer } from '../SelectionDetailContainer'
import { Shape } from '../Shape'
import { SVGContainer } from '../SVGContainer'
import { DirectionIndicator } from '../ui'

export interface TLCanvasProps<S extends TLReactShape> {
  id: string
  className: string
  bindings: TLBinding[]
  brush: TLBounds
  shapes: S[]
  assets: Record<string, TLAsset>
  theme: TLTheme
  hoveredShape: S
  hoveredGroup: S
  editingShape: S
  bindingShapes: S[]
  selectionDirectionHint: number[]
  selectionBounds: TLBounds
  selectedShapes: S[]
  erasingShapes: S[]
  gridSize: number
  cursor: TLCursor
  cursorRotation: number
  selectionRotation: number
  onEditingEnd: () => void
  penMode: boolean
  showGrid: boolean
  showSelection: boolean
  showHandles: boolean
  showResizeHandles: boolean
  showRotateHandles: boolean
  showCloneHandles: boolean
  showContextBar: boolean
  showSelectionDetail: boolean
  showSelectionRotation: boolean
  children: React.ReactNode
}

export const Canvas = observer(function Renderer<S extends TLReactShape>({
  id,
  className,
  brush,
  shapes,
  assets,
  bindingShapes,
  editingShape,
  hoveredShape,
  hoveredGroup,
  selectionBounds,
  selectedShapes,
  erasingShapes,
  selectionDirectionHint,
  cursor = TLCursor.Default,
  cursorRotation = 0,
  selectionRotation = 0,
  showSelection = true,
  showHandles = true,
  showSelectionRotation = false,
  showResizeHandles = true,
  showRotateHandles = true,
  showCloneHandles = true,
  showSelectionDetail = true,
  showContextBar = true,
  showGrid = true,
  gridSize = 8,
  onEditingEnd = NOOP,
  theme = EMPTY_OBJECT,
  children,
}: Partial<TLCanvasProps<S>>) {
  const rContainer = React.useRef<HTMLDivElement>(null)
  const { viewport, components, meta } = useRendererContext()
  const app = useApp()
  const onBoundsChange = React.useCallback((bounds: TLBounds) => {
    app.inputs.updateContainerOffset([bounds.minX, bounds.minY])
  }, [])
  useStylesheet(theme, id)
  usePreventNavigation(rContainer)
  useResizeObserver(rContainer, viewport, onBoundsChange)
  useGestureEvents(rContainer)
  useRestoreCamera()
  useCursor(rContainer, cursor, cursorRotation)
  useZoom(rContainer)
  useKeyboardEvents(rContainer)
  const events = useCanvasEvents()
  const onlySelectedShape = selectedShapes?.length === 1 && selectedShapes[0]
  const onlySelectedShapeWithHandles =
    onlySelectedShape && 'handles' in onlySelectedShape.props ? selectedShapes?.[0] : undefined
  const selectedShapesSet = React.useMemo(() => new Set(selectedShapes || []), [selectedShapes])
  const erasingShapesSet = React.useMemo(() => new Set(erasingShapes || []), [erasingShapes])
  const singleSelectedShape = selectedShapes?.length === 1 ? selectedShapes[0] : undefined

  const hoveredShapes: S[] = [...new Set([hoveredGroup, hoveredShape])].filter(isNonNullable)

  return (
    <div ref={rContainer} className={`tl-container ${className ?? ''}`}>
      <div tabIndex={-1} className="tl-absolute tl-canvas" {...events}>
        {showGrid && components.Grid && <components.Grid size={gridSize} />}
        <HTMLLayer>
          {components.SelectionBackground && selectedShapes && selectionBounds && showSelection && (
            <Container
              data-type="SelectionBackground"
              bounds={selectionBounds}
              zIndex={2}
              data-html2canvas-ignore="true"
            >
              <components.SelectionBackground
                shapes={selectedShapes}
                bounds={selectionBounds}
                showResizeHandles={showResizeHandles}
                showRotateHandles={showRotateHandles}
              />
            </Container>
          )}
          {shapes &&
            shapes.map((shape, i) => (
              <Shape
                key={'shape_' + shape.id}
                shape={shape}
                asset={assets && shape.props.assetId ? assets[shape.props.assetId] : undefined}
                isEditing={shape === editingShape}
                isHovered={shape === hoveredShape}
                isBinding={bindingShapes?.includes(shape)}
                isSelected={selectedShapesSet.has(shape)}
                isErasing={erasingShapesSet.has(shape)}
                meta={meta}
                zIndex={1000 + i}
                onEditingEnd={onEditingEnd}
              />
            ))}
          {!app.isIn('select.pinching') &&
            selectedShapes?.map(shape => (
              <Indicator
                key={'selected_indicator_' + shape.id}
                shape={shape}
                isEditing={shape === editingShape}
                isHovered={false}
                isBinding={false}
                isSelected={true}
                isLocked={shape.props.isLocked}
              />
            ))}
          {hoveredShapes.map(
            s => s !== editingShape && <Indicator key={'hovered_indicator_' + s.id} shape={s} />
          )}
          {singleSelectedShape && components.BacklinksCount && (
            <BacklinksCountContainer
              hidden={false}
              bounds={singleSelectedShape.bounds}
              shape={singleSelectedShape}
            />
          )}
          {hoveredShape && hoveredShape !== singleSelectedShape && components.QuickLinks && (
            <QuickLinksContainer hidden={false} bounds={hoveredShape.bounds} shape={hoveredShape} />
          )}
          {brush && components.Brush && <components.Brush bounds={brush} />}
          {selectedShapes && selectionBounds && (
            <>
              {showSelection && components.SelectionForeground && (
                <Container
                  data-type="SelectionForeground"
                  data-html2canvas-ignore="true"
                  bounds={selectionBounds}
                  zIndex={editingShape && selectedShapes.includes(editingShape) ? 1002 : 10002}
                >
                  <components.SelectionForeground
                    shapes={selectedShapes.filter(shape => !shape.props.isLocked)}
                    bounds={selectionBounds}
                    showResizeHandles={showResizeHandles}
                    showRotateHandles={showRotateHandles}
                    showCloneHandles={showCloneHandles}
                  />
                </Container>
              )}
              {showHandles && onlySelectedShapeWithHandles && components.Handle && (
                <Container
                  data-type="onlySelectedShapeWithHandles"
                  data-html2canvas-ignore="true"
                  bounds={selectionBounds}
                  zIndex={10003}
                >
                  <SVGContainer>
                    {Object.entries(onlySelectedShapeWithHandles.props.handles ?? {}).map(
                      ([id, handle]) =>
                        React.createElement(components.Handle!, {
                          key: `${handle.id}_handle_${handle.id}`,
                          shape: onlySelectedShapeWithHandles,
                          handle,
                          id,
                        })
                    )}
                  </SVGContainer>
                </Container>
              )}
              {selectedShapes && components.SelectionDetail && (
                <SelectionDetailContainer
                  key={'detail' + selectedShapes.map(shape => shape.id).join('')}
                  data-html2canvas-ignore="true"
                  shapes={selectedShapes}
                  bounds={selectionBounds}
                  detail={showSelectionRotation ? 'rotation' : 'size'}
                  hidden={!showSelectionDetail}
                  rotation={selectionRotation}
                />
              )}
            </>
          )}
        </HTMLLayer>
        {selectionDirectionHint && selectionBounds && selectedShapes && (
          <DirectionIndicator
            direction={selectionDirectionHint}
            bounds={selectionBounds}
            shapes={selectedShapes}
          />
        )}

        <div id="tl-dev-tools-canvas-anchor" data-html2canvas-ignore="true" />
      </div>
      <HTMLLayer>
        {selectedShapes && selectionBounds && (
          <>
            {selectedShapes && components.ContextBar && (
              <ContextBarContainer
                key={'context' + selectedShapes.map(shape => shape.id).join('')}
                shapes={selectedShapes.filter(s => !s.props.isLocked)}
                hidden={!showContextBar}
                bounds={singleSelectedShape ? singleSelectedShape.bounds : selectionBounds}
                rotation={singleSelectedShape ? singleSelectedShape.props.rotation : 0}
              />
            )}
          </>
        )}
      </HTMLLayer>

      {children}
    </div>
  )
})
