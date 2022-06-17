import { BoundsUtils, TLDocumentModel, TLShapeConstructor, TLViewport } from '@tldraw/core'
import ReactDOMServer from 'react-dom/server'
import { Shape, shapes } from './shapes'

const SVG_EXPORT_PADDING = 0

const ShapesMap = new Map(shapes.map(shape => [shape.id, shape]))

const getShapeClass = (type: string): TLShapeConstructor<Shape> => {
  if (!type) throw Error('No shape type provided.')
  const Shape = ShapesMap.get(type)
  if (!Shape) throw Error(`Could not find shape class for ${type}`)
  return Shape
}

export class PreviewManager {
  shapes: Shape[] | undefined
  constructor(serializedApp?: TLDocumentModel<Shape>) {
    if (serializedApp) {
      this.load(serializedApp)
    }
  }

  load(snapshot: TLDocumentModel) {
    const page = snapshot.pages.find(p => snapshot.currentPageId === p.id)
    this.shapes = page?.shapes.map(s => {
      const ShapeClass = getShapeClass(s.type)
      return new ShapeClass(s)
    })
  }

  generatePreviewJsx(viewport?: TLViewport) {
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
    commonBounds = BoundsUtils.ensureRatio(commonBounds, 4 / 3)

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
                id="camera-rect"
                transform={`translate(${vx}, ${vy})`}
                width={vBounds.width}
                height={vBounds.height}
              />
              <mask id="camera-mask">
                <rect width={commonBounds.width} height={commonBounds.height} fill="white" />
                <use href="#camera-rect" fill="black" />
              </mask>
            </>
          )}
          <g id="preview-shapes">
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
                  {s.getShapeSVGJsx(true)}
                </g>
              )
            })}
          </g>
        </defs>
        <use href="#preview-shapes" />
        <rect
          mask={vBounds ? 'url(#camera-mask)' : ''}
          width={commonBounds.width}
          height={commonBounds.height}
          fill="rgba(0, 0, 0, 0.2)"
        />
        {vBounds && (
          <use
            id="minimap-camera-rect"
            data-x={vx}
            data-y={vy}
            data-width={vBounds.width}
            data-height={vBounds.height}
            href="#camera-rect"
            fill="transparent"
            stroke="red"
            strokeWidth={4 / viewport.camera.zoom}
          />
        )}
      </svg>
    )
    return svgElement
  }

  exportAsSVG() {
    const svgElement = this.generatePreviewJsx()
    return svgElement ? ReactDOMServer.renderToString(svgElement) : ''
  }
}
