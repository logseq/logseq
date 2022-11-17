import Vec from '@tldraw/vec'
import type { TLAsset, TLBinding, TLEventMap } from '../../types'
import { BoundsUtils, uniqueId } from '../../utils'
import type { TLShape, TLShapeModel } from '../shapes'
import type { TLApp } from '../TLApp'

export class TLApi<S extends TLShape = TLShape, K extends TLEventMap = TLEventMap> {
  private app: TLApp<S, K>

  constructor(app: TLApp<S, K>) {
    this.app = app
  }

  editShape = (shape: string | S | undefined): this => {
    this.app.transition('select').selectedTool.transition('editingShape', { shape })
    return this
  }

  /**
   * Set the hovered shape.
   *
   * @param shape The new hovered shape or shape id.
   */
  hoverShape = (shape: string | S | undefined): this => {
    this.app.setHoveredShape(shape)
    return this
  }

  /**
   * Create one or more shapes on the current page.
   *
   * @param shapes The new shape instances or serialized shapes.
   */
  createShapes = (...shapes: S[] | TLShapeModel[]): this => {
    this.app.createShapes(shapes)
    return this
  }

  /**
   * Update one or more shapes on the current page.
   *
   * @param shapes The serialized shape changes to apply.
   */
  updateShapes = <T extends S>(...shapes: ({ id: string } & Partial<T['props']>)[]): this => {
    this.app.updateShapes(shapes)
    return this
  }

  /**
   * Delete one or more shapes from the current page.
   *
   * @param shapes The shapes or shape ids to delete.
   */
  deleteShapes = (...shapes: S[] | string[]): this => {
    this.app.deleteShapes(shapes.length ? shapes : this.app.selectedShapesArray)
    return this
  }

  /**
   * Select one or more shapes on the current page.
   *
   * @param shapes The shapes or shape ids to select.
   */
  selectShapes = (...shapes: S[] | string[]): this => {
    this.app.setSelectedShapes(shapes)
    return this
  }

  /**
   * Deselect one or more selected shapes on the current page.
   *
   * @param ids The shapes or shape ids to deselect.
   */
  deselectShapes = (...shapes: S[] | string[]): this => {
    const ids =
      typeof shapes[0] === 'string' ? (shapes as string[]) : (shapes as S[]).map(shape => shape.id)
    this.app.setSelectedShapes(
      this.app.selectedShapesArray.filter(shape => !ids.includes(shape.id))
    )
    return this
  }

  flipHorizontal = (...shapes: S[] | string[]): this => {
    this.app.flipHorizontal(shapes)
    return this
  }

  flipVertical = (...shapes: S[] | string[]): this => {
    this.app.flipVertical(shapes)
    return this
  }

  /** Select all shapes on the current page. */
  selectAll = (): this => {
    this.app.setSelectedShapes(this.app.currentPage.shapes)
    return this
  }

  /** Deselect all shapes on the current page. */
  deselectAll = (): this => {
    this.app.setSelectedShapes([])
    return this
  }

  /** Zoom the camera in. */
  zoomIn = (): this => {
    this.app.viewport.zoomIn()
    return this
  }

  /** Zoom the camera out. */
  zoomOut = (): this => {
    this.app.viewport.zoomOut()
    return this
  }

  /** Reset the camera to 100%. */
  resetZoom = (): this => {
    this.app.viewport.resetZoom()
    return this
  }

  /** Zoom to fit all of the current page's shapes in the viewport. */
  zoomToFit = (): this => {
    const { shapes } = this.app.currentPage
    if (shapes.length === 0) return this
    const commonBounds = BoundsUtils.getCommonBounds(shapes.map(shape => shape.bounds))
    this.app.viewport.zoomToBounds(commonBounds)
    return this
  }

  cameraToCenter = (): this => {
    const { shapes } = this.app.currentPage
    if (shapes.length === 0) return this
    // Viewport should be focused to existing shapes
    const commonBounds = BoundsUtils.getCommonBounds(shapes.map(shape => shape.bounds))
    this.app.viewport.update({
      point: Vec.add(Vec.neg(BoundsUtils.getBoundsCenter(commonBounds)), [
        this.app.viewport.currentView.width / 2,
        this.app.viewport.currentView.height / 2,
      ]),
    })
    return this
  }

  /** Zoom to fit the current selection in the viewport. */
  zoomToSelection = (): this => {
    const { selectionBounds } = this.app
    if (!selectionBounds) return this
    this.app.viewport.zoomToBounds(selectionBounds)
    return this
  }

  resetZoomToCursor = (): this => {
    const viewport = this.app.viewport
    viewport.update({
      zoom: 1,
      point: Vec.sub(this.app.inputs.originScreenPoint, this.app.inputs.originPoint),
    })
    return this
  }

  toggleGrid = (): this => {
    const { settings } = this.app
    settings.update({ showGrid: !settings.showGrid })
    return this
  }

  setColor = (color: string): this => {
    const { settings } = this.app

    settings.update({ color: color })

    this.app.selectedShapesArray.forEach(s => {
      s.update({ fill: color, stroke: color })
    })
    this.app.persist()

    return this
  }

  save = () => {
    this.app.save()
    return this
  }

  saveAs = () => {
    this.app.save()
    return this
  }

  undo = () => {
    this.app.undo()
    return this
  }

  redo = () => {
    this.app.redo()
    return this
  }

  createNewLineBinding = (source: S | string, target: S | string) => {
    return this.app.createNewLineBinding(source, target)
  }

  /** Clone shapes with given context */
  cloneShapes = ({
    shapes,
    assets,
    bindings,
    point = [0, 0],
  }: {
    shapes: TLShapeModel[]
    point: number[]
    // assets & bindings are the context for creating shapes
    assets: TLAsset[]
    bindings: Record<string, TLBinding>
  }) => {
    const commonBounds = BoundsUtils.getCommonBounds(
      shapes.map(shape => ({
        minX: shape.point?.[0] ?? point[0],
        minY: shape.point?.[1] ?? point[1],
        width: shape.size?.[0] ?? 4,
        height: shape.size?.[1] ?? 4,
        maxX: (shape.point?.[0] ?? point[0]) + (shape.size?.[0] ?? 4),
        maxY: (shape.point?.[1] ?? point[1]) + (shape.size?.[1] ?? 4),
      }))
    )

    const clonedShapes = shapes.map(shape => {
      return {
        ...shape,
        id: uniqueId(),
        point: [
          point[0] + shape.point![0] - commonBounds.minX,
          point[1] + shape.point![1] - commonBounds.minY,
        ],
      }
    })

    const clonedBindings: TLBinding[] = []

    // Try to rebinding the shapes with the given bindings
    clonedShapes
      .flatMap(s => Object.values(s.handles ?? {}))
      .forEach(handle => {
        if (!handle.bindingId) {
          return
        }
        // try to bind the new shape
        const binding = bindings[handle.bindingId]
        if (binding) {
          // if the copied binding from/to is in the source
          const oldFromIdx = shapes.findIndex(s => s.id === binding.fromId)
          const oldToIdx = shapes.findIndex(s => s.id === binding.toId)
          if (binding && oldFromIdx !== -1 && oldToIdx !== -1) {
            const newBinding: TLBinding = {
              ...binding,
              id: uniqueId(),
              fromId: clonedShapes[oldFromIdx].id,
              toId: clonedShapes[oldToIdx].id,
            }
            clonedBindings.push(newBinding)
            handle.bindingId = newBinding.id
          } else {
            handle.bindingId = undefined
          }
        } else {
          console.warn('binding not found', handle.bindingId)
        }
      })

    const clonedAssets = assets.filter(asset => {
      // do we need to create new asset id?
      return clonedShapes.some(shape => shape.assetId === asset.id)
    })
    return {
      shapes: clonedShapes,
      assets: clonedAssets,
      bindings: clonedBindings,
    }
  }

  getClonedShapesFromTldrString = (text: string, point: number[]) => {
    const safeParseJson = (json: string) => {
      try {
        return JSON.parse(json)
      } catch {
        return null
      }
    }

    const getWhiteboardsTldrFromText = (text: string) => {
      const innerText = text.match(/<whiteboard-tldr>(.*)<\/whiteboard-tldr>/)?.[1]
      if (innerText) {
        return safeParseJson(innerText)
      }
    }

    try {
      const data = getWhiteboardsTldrFromText(text)
      if (!data) return null
      const { shapes, bindings, assets } = data

      return this.cloneShapes({
        shapes,
        bindings,
        assets,
        point,
      })
    } catch (err) {
      console.log(err)
    }
    return null
  }

  cloneShapesIntoCurrentPage = (opts: {
    shapes: TLShapeModel[]
    point: number[]
    // assets & bindings are the context for creating shapes
    assets: TLAsset[]
    bindings: Record<string, TLBinding>
  }) => {
    const data = this.cloneShapes(opts)
    if (data) {
      this.addClonedShapes(data)
    }
    return this
  }

  addClonedShapes = (opts: ReturnType<TLApi['cloneShapes']>) => {
    const { shapes, assets, bindings } = opts
    if (assets.length > 0) {
      this.app.createAssets(assets)
    }
    if (shapes.length > 0) {
      this.app.createShapes(shapes)
    }
    this.app.currentPage.updateBindings(Object.fromEntries(bindings.map(b => [b.id, b])))
    this.app.selectedTool.transition('idle') // clears possible editing states
    return this
  }

  addClonedShapesFromTldrString = (text: string, point: number[]) => {
    const data = this.getClonedShapesFromTldrString(text, point)
    if (data) {
      this.addClonedShapes(data)
    }
    return this
  }
}
