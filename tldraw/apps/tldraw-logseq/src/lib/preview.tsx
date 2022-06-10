import { BoundsUtils, TLDocumentModel, TLShapeConstructor, TLViewport } from '@tldraw/core'
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

export class WhiteboardPreview {
  shapes: Shape[] | undefined
  constructor(serializedApp?: TLDocumentModel<Shape>) {
    if (serializedApp) {
      this.deserialize(serializedApp)
    }
  }

  deserialize(snapshot: TLDocumentModel) {
    const page = snapshot.pages.find(p => snapshot.currentPageId === p.id)
    this.shapes = page?.shapes.map(s => {
      const ShapeClass = getShapeClass(s.type)
      return new ShapeClass(s)
    })
  }

  getSvg(viewport?: TLViewport) {
    const allBounds = [...(this.shapes ?? [])?.map(s => s.getRotatedBounds())]
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
        viewBox={[0, 0, commonBounds.width, commonBounds.height].join(' ')}
      >
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
              {s.getShapeSVGJsx()}
            </g>
          )
        })}
        {vBounds && (
          <rect
            fill="transparent"
            stroke="#500"
            strokeWidth={16 / Math.sqrt(viewport.camera.zoom)}
            transform={`translate(${vx}, ${vy})`}
            width={vBounds.width}
            height={vBounds.height}
          />
        )}
      </svg>
    )
    return svgElement
  }

  getExportedSVG() {
    const svgElement = this.getSvg()
    return svgElement ? ReactDOMServer.renderToString(svgElement) : ''
  }

  getPreview(viewport?: TLViewport) {
    return (
      <div
        style={{
          pointerEvents: 'none',
          height: '300px',
          width: '400px',
          top: '16px',
          left: '16px',
          position: 'fixed',
          border: '1px solid black',
        }}
      >
        {this.getSvg(viewport)}
      </div>
    )
  }
}
