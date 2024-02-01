import { BoundsUtils, TLAsset, TLDocumentModel, TLShapeConstructor, TLViewport } from '@tldraw/core'
import ReactDOMServer from 'react-dom/server'
import { Shape, shapes } from './shapes'

const SVG_EXPORT_PADDING = 16

const ShapesMap = new Map(shapes.map(shape => [shape.id, shape]))

const getShapeClass = (type: string): TLShapeConstructor<Shape> => {
  if (!type) throw Error('No shape type provided.')
  const Shape = ShapesMap.get(type)
  if (!Shape) throw Error(`Could not find shape class for ${type}`)
  return Shape
}

export class PreviewManager {
  shapes: Shape[] | undefined
  pageId: string | undefined
  assets: TLAsset[] | undefined
  constructor(serializedApp?: TLDocumentModel<Shape>) {
    if (serializedApp) {
      this.load(serializedApp)
    }
  }

  load(snapshot: TLDocumentModel) {
    const page = snapshot?.pages?.[0]
    this.pageId = page?.id
    this.assets = snapshot.assets
    this.shapes = page?.shapes
      .map(s => {
        const ShapeClass = getShapeClass(s.type)
        return new ShapeClass(s)
      })
      // do not need to render group shape because it is invisible in preview
      .filter(s => s.type !== 'group')
  }

  generatePreviewJsx(viewport?: TLViewport, ratio?: number) {
    const allBounds = [...(this.shapes ?? []).map(s => s.getRotatedBounds())]
    const vBounds = viewport?.currentView
    if (vBounds) {
      allBounds.push(vBounds)
    }
    let commonBounds = BoundsUtils.getCommonBounds(allBounds)
    if (!commonBounds) {
      return null
    }

    commonBounds = BoundsUtils.expandBounds(commonBounds, SVG_EXPORT_PADDING)

    // make sure commonBounds is of ratio 4/3 (should we have another ratio setting?)
    commonBounds = ratio ? BoundsUtils.ensureRatio(commonBounds, ratio) : commonBounds

    const translatePoint = (p: [number, number]): [string, string] => {
      return [(p[0] - commonBounds.minX).toFixed(2), (p[1] - commonBounds.minY).toFixed(2)]
    }

    const [vx, vy] = vBounds ? translatePoint([vBounds.minX, vBounds.minY]) : [0, 0]

    const svgElement = commonBounds && (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        data-common-bound-x={commonBounds.minX.toFixed(2)}
        data-common-bound-y={commonBounds.minY.toFixed(2)}
        data-common-bound-width={commonBounds.width.toFixed(2)}
        data-common-bound-height={commonBounds.height.toFixed(2)}
        viewBox={[0, 0, commonBounds.width, commonBounds.height].join(' ')}
      >
        <defs>
          {vBounds && (
            <>
              <rect
                id={this.pageId + '-camera-rect'}
                transform={`translate(${vx}, ${vy})`}
                width={vBounds.width}
                height={vBounds.height}
              />
              <mask id={this.pageId + '-camera-mask'}>
                <rect width={commonBounds.width} height={commonBounds.height} fill="white" />
                <use href={`#${this.pageId}-camera-rect`} fill="black" />
              </mask>
            </>
          )}
        </defs>
        <g id={this.pageId + '-preview-shapes'}>
          {this.shapes?.map(s => {
            const {
              bounds,
              props: { rotation },
            } = s
            const [tx, ty] = translatePoint([bounds.minX, bounds.minY])
            const r = +((((rotation ?? 0) + (bounds.rotation ?? 0)) * 180) / Math.PI).toFixed(2)
            const [rdx, rdy] = [(bounds.width / 2).toFixed(2), (bounds.height / 2).toFixed(2)]
            const transformArr = [`translate(${tx}, ${ty})`, `rotate(${r}, ${rdx}, ${rdy})`]
            return (
              <g transform={transformArr.join(' ')} key={s.id}>
                {s.getShapeSVGJsx({
                  assets: this.assets ?? [],
                })}
              </g>
            )
          })}
        </g>
        <rect
          mask={vBounds ? `url(#${this.pageId}-camera-mask)` : ''}
          width={commonBounds.width}
          height={commonBounds.height}
          fill="transparent"
        />
        {vBounds && (
          <use
            id="minimap-camera-rect"
            data-x={vx}
            data-y={vy}
            data-width={vBounds.width}
            data-height={vBounds.height}
            href={`#${this.pageId}-camera-rect`}
            fill="transparent"
            stroke="red"
            strokeWidth={4 / viewport.camera.zoom}
          />
        )}
      </svg>
    )
    return svgElement
  }

  exportAsSVG(ratio: number) {
    const svgElement = this.generatePreviewJsx(undefined, ratio)
    return svgElement ? ReactDOMServer.renderToString(svgElement) : ''
  }
}

/**
 * One off helper to generate tldraw preview
 *
 * @param serializedApp
 */
export function generateSVGFromModel(serializedApp: TLDocumentModel<Shape>, ratio = 4 / 3) {
  const preview = new PreviewManager(serializedApp)
  return preview.exportAsSVG(ratio)
}

export function generateJSXFromModel(serializedApp: TLDocumentModel<Shape>, ratio = 4 / 3) {
  const preview = new PreviewManager(serializedApp)
  return preview.generatePreviewJsx(undefined, ratio)
}
