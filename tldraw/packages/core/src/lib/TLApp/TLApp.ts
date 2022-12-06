/* eslint-disable @typescript-eslint/no-extra-semi */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TLBounds } from '@tldraw/intersect'
import { Vec } from '@tldraw/vec'
import { action, computed, makeObservable, observable, toJS, transaction } from 'mobx'
import { GRID_SIZE } from '../../constants'
import type {
  TLAsset,
  TLCallback,
  TLEventMap,
  TLEvents,
  TLShortcut,
  TLStateEvents,
  TLSubscription,
  TLSubscriptionEventInfo,
  TLSubscriptionEventName,
} from '../../types'
import { AlignType, DistributeType } from '../../types'
import { BoundsUtils, createNewLineBinding, isNonNullable, KeyUtils, uniqueId } from '../../utils'
import type { TLShape, TLShapeConstructor, TLShapeModel } from '../shapes'
import { TLApi } from '../TLApi'
import { TLCursors } from '../TLCursors'

import { TLHistory } from '../TLHistory'
import { TLInputs } from '../TLInputs'
import { TLPage, type TLPageModel } from '../TLPage'
import { TLSettings } from '../TLSettings'
import { TLRootState } from '../TLState'
import type { TLToolConstructor } from '../TLTool'
import { TLViewport } from '../TLViewport'
import { TLMoveTool, TLSelectTool } from '../tools'

export interface TLDocumentModel<S extends TLShape = TLShape, A extends TLAsset = TLAsset> {
  // currentPageId: string
  selectedIds: string[]
  pages: TLPageModel<S>[]
  assets?: A[]
}

export class TLApp<
  S extends TLShape = TLShape,
  K extends TLEventMap = TLEventMap
> extends TLRootState<S, K> {
  constructor(
    serializedApp?: TLDocumentModel<S>,
    Shapes?: TLShapeConstructor<S>[],
    Tools?: TLToolConstructor<S, K>[]
  ) {
    super()
    this._states = [TLSelectTool, TLMoveTool]
    this.history.pause()
    if (this.states && this.states.length > 0) {
      this.registerStates(this.states)
      const initialId = this.initial ?? this.states[0].id
      const state = this.children.get(initialId)
      if (state) {
        this.currentState = state
        this.currentState?._events.onEnter({ fromId: 'initial' })
      }
    }
    if (Shapes) this.registerShapes(Shapes)
    if (Tools) this.registerTools(Tools)
    this.history.resume()
    if (serializedApp) this.history.deserialize(serializedApp)
    this.api = new TLApi(this)
    makeObservable(this)
    this.notify('mount', null)
  }

  keybindingRegistered = false
  uuid = uniqueId()

  static id = 'app'
  static initial = 'select'

  readonly api: TLApi<S, K>
  readonly inputs = new TLInputs<K>()
  readonly cursors = new TLCursors()
  readonly viewport = new TLViewport()
  readonly settings = new TLSettings()

  Tools: TLToolConstructor<S, K>[] = []

  dispose() {
    super.dispose()
    this.keybindingRegistered = false
    return this
  }

  initKeyboardShortcuts() {
    if (this.keybindingRegistered) {
      return
    }
    const ownShortcuts: TLShortcut<S, K>[] = [
      {
        keys: 'shift+0',
        fn: () => this.api.resetZoom(),
      },
      {
        keys: 'shift+1',
        fn: () => this.api.zoomToFit(),
      },
      {
        keys: 'mod+shift+1',
        fn: () => this.api.zoomToSelection(),
      },
      {
        keys: 'mod+-',
        fn: () => this.api.zoomOut(),
      },
      {
        keys: 'mod+=',
        fn: () => this.api.zoomIn(),
      },
      {
        keys: 'mod+z',
        fn: () => this.undo(),
      },
      {
        keys: 'mod+x',
        fn: () => this.cut(),
      },
      {
        keys: 'mod+shift+z',
        fn: () => this.redo(),
      },
      {
        keys: '[',
        fn: () => this.sendBackward(),
      },
      {
        keys: 'shift+[',
        fn: () => this.sendToBack(),
      },
      {
        keys: ']',
        fn: () => this.bringForward(),
      },
      {
        keys: 'shift+]',
        fn: () => this.bringToFront(),
      },
      {
        keys: 'mod+a',
        fn: () => {
          const { selectedTool } = this
          if (selectedTool.id !== 'select') {
            this.selectTool('select')
          }
          this.api.selectAll()
        },
      },
      {
        keys: 'mod+shift+s',
        fn: () => {
          this.saveAs()
          this.notify('saveAs', null)
        },
      },
      {
        keys: 'mod+shift+v',
        fn: (_, __, e) => {
          if (!this.editingShape) {
            e.preventDefault()
            this.paste(undefined, true)
          }
        },
      },
      {
        keys: ['del', 'backspace'],
        fn: () => {
          this.api.deleteShapes()
          this.selectedTool.transition('idle')
        },
      },
    ]
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const shortcuts = (this.constructor['shortcuts'] || []) as TLShortcut<S, K>[]
    const childrenShortcuts = Array.from(this.children.values())
      // @ts-expect-error ???
      .filter(c => c.constructor['shortcut'])
      .map(child => {
        return {
          // @ts-expect-error ???
          keys: child.constructor['shortcut'] as string | string[],
          fn: (_: any, __: any, e: KeyboardEvent) => {
            this.transition(child.id)

            // hack: allows logseq related shortcut combinations to work
            if (e.key !== 't') {
              e.stopPropagation()
            }
          },
        }
      })
    this._disposables.push(
      ...[...ownShortcuts, ...shortcuts, ...childrenShortcuts].map(({ keys, fn }) => {
        return KeyUtils.registerShortcut(keys, e => {
          fn(this, this, e)
        })
      })
    )
    this.keybindingRegistered = true
  }

  /* --------------------- History -------------------- */

  history = new TLHistory<S, K>(this)

  persist = this.history.persist

  undo = this.history.undo

  redo = this.history.redo

  saving = false // used to capture direct mutations as part of the history stack

  saveState = () => {
    if (this.history.isPaused) return
    this.saving = true
    requestAnimationFrame(() => {
      if (this.saving) {
        this.persist()
        this.saving = false
      }
    })
  }

  /* -------------------------------------------------- */
  /*                      Document                      */
  /* -------------------------------------------------- */

  loadDocumentModel(model: TLDocumentModel<S>): this {
    this.history.deserialize(model)
    if (model.assets && model.assets.length > 0) this.addAssets(model.assets)

    return this
  }

  load = (): this => {
    // todo
    this.notify('load', null)
    return this
  }

  save = (): this => {
    // todo
    this.notify('save', null)
    return this
  }

  saveAs = (): this => {
    // todo
    this.notify('saveAs', null)
    return this
  }

  @computed get serialized(): TLDocumentModel<S> {
    return {
      // currentPageId: this.currentPageId,
      selectedIds: Array.from(this.selectedIds.values()),
      pages: Array.from(this.pages.values()).map(page => page.serialized),
      assets: this.getCleanUpAssets(),
    }
  }

  /* ---------------------- Pages --------------------- */

  @observable pages: Map<string, TLPage<S, K>> = new Map([
    ['page', new TLPage(this, { id: 'page', name: 'page', shapes: [], bindings: {} })],
  ])

  @computed get currentPageId() {
    return this.pages.keys().next().value
  }

  @computed get currentPage(): TLPage<S, K> {
    return this.getPageById(this.currentPageId)
  }

  getPageById = (pageId: string): TLPage<S, K> => {
    const page = this.pages.get(pageId)
    if (!page) throw Error(`Could not find a page named ${pageId}.`)
    return page
  }

  @action addPages(pages: TLPage<S, K>[]): this {
    pages.forEach(page => this.pages.set(page.id, page))
    this.persist()
    return this
  }

  @action removePages(pages: TLPage<S, K>[]): this {
    pages.forEach(page => this.pages.delete(page.id))
    this.persist()
    return this
  }

  /* --------------------- Shapes --------------------- */

  getShapeById = <T extends S>(id: string, pageId = this.currentPage.id): T | undefined => {
    const shape = this.getPageById(pageId)?.shapes.find(shape => shape.id === id) as T
    return shape
  }

  @action readonly createShapes = (shapes: S[] | TLShapeModel[]): this => {
    const newShapes = this.currentPage.addShapes(...shapes)
    if (newShapes) this.notify('create-shapes', newShapes)
    this.persist()
    return this
  }

  @action updateShapes = <T extends S>(shapes: ({ id: string } & Partial<T['props']>)[]): this => {
    shapes.forEach(shape => this.getShapeById(shape.id)?.update(shape))
    this.persist()
    return this
  }

  @action readonly deleteShapes = (shapes: S[] | string[]): this => {
    if (shapes.length === 0) return this
    let ids: Set<string>
    if (typeof shapes[0] === 'string') {
      ids = new Set(shapes as string[])
    } else {
      ids = new Set((shapes as S[]).map(shape => shape.id))
    }
    this.setSelectedShapes(this.selectedShapesArray.filter(shape => !ids.has(shape.id)))
    const removedShapes = this.currentPage.removeShapes(...shapes)
    if (removedShapes) this.notify('delete-shapes', removedShapes)
    this.persist()
    return this
  }

  bringForward = (shapes: S[] | string[] = this.selectedShapesArray): this => {
    if (shapes.length > 0) this.currentPage.bringForward(shapes)
    return this
  }

  sendBackward = (shapes: S[] | string[] = this.selectedShapesArray): this => {
    if (shapes.length > 0) this.currentPage.sendBackward(shapes)
    return this
  }

  sendToBack = (shapes: S[] | string[] = this.selectedShapesArray): this => {
    if (shapes.length > 0) this.currentPage.sendToBack(shapes)
    return this
  }

  bringToFront = (shapes: S[] | string[] = this.selectedShapesArray): this => {
    if (shapes.length > 0) this.currentPage.bringToFront(shapes)
    return this
  }

  flipHorizontal = (shapes: S[] | string[] = this.selectedShapesArray): this => {
    this.currentPage.flip(shapes, 'horizontal')
    return this
  }

  flipVertical = (shapes: S[] | string[] = this.selectedShapesArray): this => {
    this.currentPage.flip(shapes, 'vertical')
    return this
  }

  align = (type: AlignType, shapes: S[] = this.selectedShapesArray): this => {
    if (shapes.length < 2) return this

    const boundsForShapes = shapes.map(shape => {
      const bounds = shape.getBounds()
      return {
        id: shape.id,
        point: [bounds.minX, bounds.minY],
        bounds: bounds,
      }
    })

    const commonBounds = BoundsUtils.getCommonBounds(boundsForShapes.map(({ bounds }) => bounds))

    const midX = commonBounds.minX + commonBounds.width / 2
    const midY = commonBounds.minY + commonBounds.height / 2

    const deltaMap = Object.fromEntries(
      boundsForShapes.map(({ id, point, bounds }) => {
        return [
          id,
          {
            prev: point,
            next: {
              [AlignType.Top]: [point[0], commonBounds.minY],
              [AlignType.CenterVertical]: [point[0], midY - bounds.height / 2],
              [AlignType.Bottom]: [point[0], commonBounds.maxY - bounds.height],
              [AlignType.Left]: [commonBounds.minX, point[1]],
              [AlignType.CenterHorizontal]: [midX - bounds.width / 2, point[1]],
              [AlignType.Right]: [commonBounds.maxX - bounds.width, point[1]],
            }[type],
          },
        ]
      })
    )

    shapes.forEach(shape => {
      if (deltaMap[shape.id]) shape.update({ point: deltaMap[shape.id].next })
    })

    this.persist()
    return this
  }

  distribute = (type: DistributeType, shapes: S[] = this.selectedShapesArray): this => {
    if (shapes.length < 2) return this

    const deltaMap = Object.fromEntries(
      BoundsUtils.getDistributions(shapes, type).map(d => [d.id, d])
    )

    shapes.forEach(shape => {
      if (deltaMap[shape.id]) shape.update({ point: deltaMap[shape.id].next })
    })

    this.persist()
    return this
  }

  packIntoRectangle = (shapes: S[] = this.selectedShapesArray): this => {
    if (shapes.length < 2) return this

    const deltaMap = Object.fromEntries(
      BoundsUtils.getPackedDistributions(shapes).map(d => [d.id, d])
    )

    shapes.forEach(shape => {
      if (deltaMap[shape.id]) shape.update({ point: deltaMap[shape.id].next })
    })

    this.persist()
    return this
  }

  /* --------------------- Assets --------------------- */

  @observable assets: Record<string, TLAsset> = {}

  @action addAssets<T extends TLAsset>(assets: T[]): this {
    assets.forEach(asset => (this.assets[asset.id] = asset))
    this.persist()
    return this
  }

  @action removeAssets<T extends TLAsset>(assets: T[] | string[]): this {
    if (typeof assets[0] === 'string')
      (assets as string[]).forEach(asset => delete this.assets[asset])
    else (assets as T[]).forEach(asset => delete this.assets[(asset as T).id])
    this.persist()
    return this
  }

  @action removeUnusedAssets = (): this => {
    const usedAssets = this.getCleanUpAssets()
    Object.keys(this.assets).forEach(assetId => {
      if (!usedAssets.some(asset => asset.id === assetId)) {
        delete this.assets[assetId]
      }
    })
    this.persist()
    return this
  }

  getCleanUpAssets<T extends TLAsset>(): T[] {
    const usedAssets = new Set<T>()

    this.pages.forEach(p =>
      p.shapes.forEach(s => {
        if (s.props.assetId && this.assets[s.props.assetId]) {
          // @ts-expect-error ???
          usedAssets.add(this.assets[s.props.assetId])
        }
      })
    )
    return Array.from(usedAssets)
  }

  createAssets<T extends TLAsset>(assets: T[]): this {
    this.addAssets(assets)
    this.notify('create-assets', { assets })
    this.persist()
    return this
  }

  copy = () => {
    if (this.selectedShapesArray.length > 0 && !this.editingShape) {
      const jsonString = JSON.stringify({
        shapes: this.selectedShapesArray.map(shape => shape.serialized),
        // pasting into other whiteboard may require this if any shape uses the assets
        assets: this.getCleanUpAssets().filter(asset => {
          return this.selectedShapesArray.some(shape => shape.props.assetId === asset.id)
        }),
        // convey the bindings to maintain the new links after pasting
        bindings: toJS(this.currentPage.bindings),
      })
      const tldrawString = encodeURIComponent(`<whiteboard-tldr>${jsonString}</whiteboard-tldr>`)
      // FIXME: use `writeClipboard` in frontend.utils
      navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([tldrawString], { type: 'text/html' }),
          'text/plain': new Blob([`((${this.selectedShapesArray[0].props.id}))`], {
            type: 'text/plain',
          }),
        }),
      ])
    }
  }

  paste = (e?: ClipboardEvent, shiftKey?: boolean) => {
    if (!this.editingShape) {
      this.notify('paste', {
        point: this.inputs.currentPoint,
        shiftKey: !!shiftKey,
        dataTransfer: e?.clipboardData ?? undefined,
      })
    }
  }

  cut = () => {
    this.copy()
    this.api.deleteShapes()
  }

  drop = (dataTransfer: DataTransfer, point?: number[]) => {
    this.notify('drop', {
      dataTransfer,
      point: point
        ? this.viewport.getPagePoint(point)
        : BoundsUtils.getBoundsCenter(this.viewport.currentView),
    })
    // This callback may be over-written manually, see useSetup.ts in React.
    return void null
  }

  /* ---------------------- Tools --------------------- */

  @computed get selectedTool() {
    return this.currentState
  }

  selectTool = this.transition

  registerTools(tools: TLToolConstructor<S, K>[]) {
    this.Tools = tools
    return this.registerStates(tools)
  }

  /* ------------------ Editing Shape ----------------- */

  @observable editingId?: string

  @computed get editingShape(): S | undefined {
    const { editingId, currentPage } = this
    return editingId ? currentPage.shapes.find(shape => shape.id === editingId) : undefined
  }

  @action readonly setEditingShape = (shape?: string | S): this => {
    this.editingId = typeof shape === 'string' ? shape : shape?.id
    return this
  }

  readonly clearEditingState = (): this => {
    this.selectedTool.transition('idle')
    return this.setEditingShape()
  }

  /* ------------------ Hovered Shape ----------------- */

  @observable hoveredId?: string

  @computed get hoveredShape(): S | undefined {
    const { hoveredId, currentPage } = this
    return hoveredId ? currentPage.shapes.find(shape => shape.id === hoveredId) : undefined
  }

  @action readonly setHoveredShape = (shape?: string | S): this => {
    this.hoveredId = typeof shape === 'string' ? shape : shape?.id
    return this
  }

  /* ----------------- Selected Shapes ---------------- */

  @observable selectedIds: Set<string> = new Set()

  @observable selectedShapes: Set<S> = new Set()

  @observable selectionRotation = 0

  @computed get selectedShapesArray() {
    const { selectedShapes, selectedTool } = this
    const stateId = selectedTool.id
    if (stateId !== 'select') return []
    return Array.from(selectedShapes.values())
  }

  @action setSelectedShapes = (shapes: S[] | string[]): this => {
    const { selectedIds, selectedShapes } = this
    selectedIds.clear()
    selectedShapes.clear()
    if (shapes[0] && typeof shapes[0] === 'string') {
      ;(shapes as string[]).forEach(s => selectedIds.add(s))
    } else {
      ;(shapes as S[]).forEach(s => selectedIds.add(s.id))
    }
    const newSelectedShapes = this.currentPage.shapes.filter(shape => selectedIds.has(shape.id))
    newSelectedShapes.forEach(s => selectedShapes.add(s))
    if (newSelectedShapes.length === 1) {
      this.selectionRotation = newSelectedShapes[0].props.rotation ?? 0
    } else {
      this.selectionRotation = 0
    }
    if (shapes.length === 0) {
      this.setEditingShape()
    }
    return this
  }

  @action setSelectionRotation(radians: number) {
    this.selectionRotation = radians
  }

  /* ------------------ Erasing Shape ----------------- */

  @observable erasingIds: Set<string> = new Set()

  @observable erasingShapes: Set<S> = new Set()

  @computed get erasingShapesArray() {
    return Array.from(this.erasingShapes.values())
  }

  @action readonly setErasingShapes = (shapes: S[] | string[]): this => {
    const { erasingIds, erasingShapes } = this
    erasingIds.clear()
    erasingShapes.clear()
    if (shapes[0] && typeof shapes[0] === 'string') {
      ;(shapes as string[]).forEach(s => erasingIds.add(s))
    } else {
      ;(shapes as S[]).forEach(s => erasingIds.add(s.id))
    }
    const newErasingShapes = this.currentPage.shapes.filter(shape => erasingIds.has(shape.id))
    newErasingShapes.forEach(s => erasingShapes.add(s))
    return this
  }

  /* ------------------ Binding Shape ----------------- */

  @observable bindingIds?: string[]

  @computed get bindingShapes(): S[] | undefined {
    const activeBindings =
      this.selectedShapesArray.length === 1
        ? this.selectedShapesArray
            .flatMap(s => Object.values(s.props.handles ?? {}))
            .flatMap(h => h.bindingId)
            .filter(isNonNullable)
            .flatMap(binding => [
              this.currentPage.bindings[binding]?.fromId,
              this.currentPage.bindings[binding]?.toId,
            ])
            .filter(isNonNullable)
        : []
    const bindingIds = [...(this.bindingIds ?? []), ...activeBindings]
    return bindingIds
      ? this.currentPage.shapes.filter(shape => bindingIds?.includes(shape.id))
      : undefined
  }

  @action readonly setBindingShapes = (ids?: string[]): this => {
    this.bindingIds = ids
    return this
  }

  readonly clearBindingShape = (): this => {
    return this.setBindingShapes()
  }

  @action createNewLineBinding = (source: S | string, target: S | string) => {
    const src = typeof source === 'string' ? this.getShapeById(source) : source
    const tgt = typeof target === 'string' ? this.getShapeById(target) : target
    if (src?.canBind && tgt?.canBind) {
      const result = createNewLineBinding(src, tgt)
      if (result) {
        const [newLine, newBindings] = result
        this.createShapes([newLine])
        this.currentPage.updateBindings(Object.fromEntries(newBindings.map(b => [b.id, b])))
        this.persist()
        return true
      }
    }
    return false
  }

  /* ---------------------- Brush --------------------- */

  @observable brush?: TLBounds

  @action readonly setBrush = (brush?: TLBounds): this => {
    this.brush = brush
    return this
  }

  /* --------------------- Camera --------------------- */

  @action setCamera = (point?: number[], zoom?: number): this => {
    this.viewport.update({ point, zoom })
    return this
  }

  readonly getPagePoint = (point: number[]): number[] => {
    const { camera } = this.viewport
    return Vec.sub(Vec.div(point, camera.zoom), camera.point)
  }

  readonly getScreenPoint = (point: number[]): number[] => {
    const { camera } = this.viewport
    return Vec.mul(Vec.add(point, camera.point), camera.zoom)
  }

  @computed
  get currentGrid() {
    const { zoom } = this.viewport.camera
    if (zoom < 0.15) {
      return GRID_SIZE * 16
    } else if (zoom < 1) {
      return GRID_SIZE * 4
    } else {
      return GRID_SIZE * 1
    }
  }

  /* --------------------- Display -------------------- */

  @computed get shapes(): S[] {
    const {
      currentPage: { shapes },
    } = this
    return Array.from(shapes.values())
  }

  @computed get shapesInViewport(): S[] {
    const {
      selectedShapes,
      currentPage,
      viewport: { currentView },
    } = this
    return currentPage.shapes.filter(shape => {
      return (
        !shape.canUnmount ||
        selectedShapes.has(shape) ||
        BoundsUtils.boundsContain(currentView, shape.rotatedBounds) ||
        BoundsUtils.boundsCollide(currentView, shape.rotatedBounds)
      )
    })
  }

  @computed get selectionDirectionHint(): number[] | undefined {
    const {
      selectionBounds,
      viewport: { currentView },
    } = this
    if (
      !selectionBounds ||
      BoundsUtils.boundsContain(currentView, selectionBounds) ||
      BoundsUtils.boundsCollide(currentView, selectionBounds)
    ) {
      return
    }
    const center = BoundsUtils.getBoundsCenter(selectionBounds)
    return Vec.clampV(
      [
        (center[0] - currentView.minX - currentView.width / 2) / currentView.width,
        (center[1] - currentView.minY - currentView.height / 2) / currentView.height,
      ],
      -1,
      1
    )
  }

  @computed get selectionBounds(): TLBounds | undefined {
    const { selectedShapesArray } = this
    if (selectedShapesArray.length === 0) return undefined
    if (selectedShapesArray.length === 1) {
      return { ...selectedShapesArray[0].bounds, rotation: selectedShapesArray[0].props.rotation }
    }
    return BoundsUtils.getCommonBounds(this.selectedShapesArray.map(shape => shape.rotatedBounds))
  }

  @computed get showSelection() {
    const { selectedShapesArray } = this
    return (
      this.isIn('select') &&
      !this.isInAny('select.translating', 'select.pinching', 'select.rotating') &&
      ((selectedShapesArray.length === 1 && !selectedShapesArray[0]?.hideSelection) ||
        selectedShapesArray.length > 1)
    )
  }

  @computed get showSelectionDetail() {
    return (
      this.isIn('select') &&
      !this.isInAny('select.translating', 'select.pinching') &&
      this.selectedShapes.size > 0 &&
      !this.selectedShapesArray.every(shape => shape.hideSelectionDetail) &&
      false // FIXME: should we shoult the selection detail?
    )
  }

  @computed get showSelectionRotation() {
    return (
      this.showSelectionDetail && this.isInAny('select.rotating', 'select.pointingRotateHandle')
    )
  }

  @computed get showContextBar() {
    const {
      selectedShapesArray,
      inputs: { ctrlKey },
    } = this
    return (
      this.isInAny('select.idle', 'select.hoveringSelectionHandle') &&
      !this.isIn('select.contextMenu') &&
      selectedShapesArray.length > 0 &&
      !selectedShapesArray.every(shape => shape.hideContextBar)
    )
  }

  @computed get showRotateHandles() {
    const { selectedShapesArray } = this
    return (
      this.isInAny(
        'select.idle',
        'select.hoveringSelectionHandle',
        'select.pointingRotateHandle',
        'select.pointingResizeHandle'
      ) &&
      selectedShapesArray.length > 0 &&
      !selectedShapesArray.some(shape => shape.hideRotateHandle)
    )
  }

  @computed get showResizeHandles() {
    const { selectedShapesArray } = this
    return (
      this.isInAny(
        'select.idle',
        'select.hoveringSelectionHandle',
        'select.pointingShape',
        'select.pointingSelectedShape',
        'select.pointingRotateHandle',
        'select.pointingResizeHandle'
      ) &&
      selectedShapesArray.length === 1 &&
      !selectedShapesArray.every(shape => shape.hideResizeHandles)
    )
  }

  /* ------------------ Shape Classes ----------------- */

  Shapes = new Map<string, TLShapeConstructor<S>>()

  registerShapes = (Shapes: TLShapeConstructor<S>[]) => {
    Shapes.forEach(Shape => this.Shapes.set(Shape.id, Shape))
  }

  deregisterShapes = (Shapes: TLShapeConstructor<S>[]) => {
    Shapes.forEach(Shape => this.Shapes.delete(Shape.id))
  }

  getShapeClass = (type: string): TLShapeConstructor<S> => {
    if (!type) throw Error('No shape type provided.')
    const Shape = this.Shapes.get(type)
    if (!Shape) throw Error(`Could not find shape class for ${type}`)
    return Shape
  }

  wrapUpdate = (fn: () => void) => {
    transaction(() => {
      const shouldSave = !this.history.isPaused
      if (shouldSave) {
        this.history.pause()
      }
      fn()
      if (shouldSave) {
        this.history.resume()
        this.persist()
      }
    })
  }

  /* ------------------ Subscriptions ----------------- */

  private subscriptions = new Set<TLSubscription<S, K, this, any>>([])

  subscribe = <E extends TLSubscriptionEventName>(
    event: E,
    callback: TLCallback<S, K, this, E>
  ) => {
    if (callback === undefined) throw Error('Callback is required.')
    const subscription: TLSubscription<S, K, this, E> = { event, callback }
    this.subscriptions.add(subscription)
    return () => this.unsubscribe(subscription)
  }

  unsubscribe = (subscription: TLSubscription<S, K, this, any>) => {
    this.subscriptions.delete(subscription)
    return this
  }

  notify = <E extends TLSubscriptionEventName>(event: E, info: TLSubscriptionEventInfo<E>) => {
    this.subscriptions.forEach(subscription => {
      if (subscription.event === event) {
        subscription.callback(this, info)
      }
    })
    return this
  }

  /* ----------------- Event Handlers ----------------- */

  temporaryTransitionToMove(event: any) {
    event.stopPropagation()
    event.preventDefault()
    const prevTool = this.selectedTool
    this.transition('move', { prevTool })
    this.selectedTool.transition('idleHold')
  }

  readonly onTransition: TLStateEvents<S, K>['onTransition'] = () => {}

  readonly onPointerDown: TLEvents<S, K>['pointer'] = (info, e) => {
    // Pan canvas when holding middle click
    if (!this.editingShape && e.button === 1 && !this.isIn('move')) {
      this.temporaryTransitionToMove(e)
      return
    }

    // Switch to select on right click to enable contextMenu state
    if (e.button === 2) {
      this.transition('select')
      return
    }

    if ('clientX' in e) {
      this.inputs.onPointerDown(
        [...this.viewport.getPagePoint([e.clientX, e.clientY]), 0.5],
        e as K['pointer']
      )
    }
  }

  readonly onPointerUp: TLEvents<S, K>['pointer'] = (info, e) => {
    if (!this.editingShape && e.button === 1 && this.isIn('move')) {
      this.selectedTool.transition('idle', { exit: true })
      e.stopPropagation()
      e.preventDefault()
      return
    }

    if ('clientX' in e) {
      this.inputs.onPointerUp(
        [...this.viewport.getPagePoint([e.clientX, e.clientY]), 0.5],
        e as K['pointer']
      )
    }
  }

  readonly onPointerMove: TLEvents<S, K>['pointer'] = (info, e) => {
    if ('clientX' in e) {
      this.inputs.onPointerMove([...this.viewport.getPagePoint([e.clientX, e.clientY]), 0.5], e)
    }
  }

  readonly onKeyDown: TLEvents<S, K>['keyboard'] = (info, e) => {
    if (!this.editingShape && e['key'] === ' ' && !this.isIn('move')) {
      this.temporaryTransitionToMove(e)
      return
    }
    this.inputs.onKeyDown(e)
  }

  readonly onKeyUp: TLEvents<S, K>['keyboard'] = (info, e) => {
    if (!this.editingShape && e['key'] === ' ' && this.isIn('move')) {
      this.selectedTool.transition('idle', { exit: true })
      e.stopPropagation()
      e.preventDefault()
      return
    }
    this.inputs.onKeyUp(e)
  }

  readonly onPinchStart: TLEvents<S, K>['pinch'] = (info, e) => {
    this.inputs.onPinchStart([...this.viewport.getPagePoint(info.point), 0.5], e)
  }

  readonly onPinch: TLEvents<S, K>['pinch'] = (info, e) => {
    this.inputs.onPinch([...this.viewport.getPagePoint(info.point), 0.5], e)
  }

  readonly onPinchEnd: TLEvents<S, K>['pinch'] = (info, e) => {
    this.inputs.onPinchEnd([...this.viewport.getPagePoint(info.point), 0.5], e)
  }
}
