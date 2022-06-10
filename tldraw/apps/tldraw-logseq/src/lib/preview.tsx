import { BoundsUtils, TLDocumentModel, TLShapeConstructor } from '@tldraw/core'
import React from 'react'
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

  getPreview() {
    const commonBounds = BoundsUtils.getCommonBounds(
      this.shapes?.map(s => s.getRotatedBounds()) ?? []
    )

    if (!commonBounds) {
      return null
    }

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        style={{
          pointerEvents: 'none',
          height: '100%',
          width: '100%',
          bottom: 0,
          right: 0,
          position: 'fixed',
          border: '1px solid black',
          transformOrigin: 'bottom right',
          // transform: 'scale(0.5)',
        }}
        viewBox={[
          0,
          0,
          commonBounds.width + SVG_EXPORT_PADDING * 2,
          commonBounds.height + SVG_EXPORT_PADDING * 2,
        ].join(' ')}
      >
        {this.shapes?.map(s => {
          const {
            bounds,
            props: { rotation },
          } = s
          const [tx, ty] = [
            (SVG_EXPORT_PADDING + bounds.minX - commonBounds.minX).toFixed(2),
            (SVG_EXPORT_PADDING + bounds.minY - commonBounds.minY).toFixed(2),
          ]
          const r = +((rotation ?? 0) + (bounds.rotation ?? 0)).toFixed(2)
          const transformArr = [`translate(${tx}px, ${ty}px)`]

          if (r) {
            const [dx, dy] = [(bounds.width / 2).toFixed(2), (bounds.height / 2).toFixed(2)]
            transformArr.push(
              `translate(${dx}px, ${dy}px)`,
              `rotate(${r}rad)`,
              `translate(-${dx}px, -${dy}px)`
            )
          }
          return (
            <g style={{ transform: transformArr.join(' ') }} key={s.id}>
              {s.getShapeSVGJsx()}
            </g>
          )
        })}
      </svg>
    )
  }
}
