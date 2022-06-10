import type { TLDocumentModel, TLShapeConstructor } from '@tldraw/core'
import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { Shape, shapes } from './shapes'

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
    // TODO: translate each shape to where it should be
    return (
      <svg
        style={{
          pointerEvents: 'none',
          height: '100%',
          width: '100%',
          bottom: 0,
          right: 0,
          position: 'fixed',
          border: '1px solid black',
          transformOrigin: 'bottom right',
          transform: 'scale(0.2)',
        }}
      >
        {this.shapes?.map(s => {
          const {
            bounds,
            props: { rotation },
          } = s
          const transformStr = `translate(${bounds.minX}px, ${bounds.minY}px)
                                rotate(${(rotation ?? 0) + (bounds.rotation ?? 0)}rad)`
          return (
            <g style={{ transform: transformStr }} key={s.id}>
              {s.getShapeSVGJsx()}
            </g>
          )
        })}
      </svg>
    )
  }
}
