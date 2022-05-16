import * as React from 'react'
import {
  HTMLContainer,
  TLContextBarComponent,
  useApp,
  getContextBarTranslation,
} from '@tldraw/react'
import { observer } from 'mobx-react-lite'
import type { TextShape, StarShape, PolygonShape, Shape } from '~lib/shapes'
import { NumberInput } from '~components/inputs/NumberInput'
import { ColorInput } from '~components/inputs/ColorInput'

const _ContextBar: TLContextBarComponent<Shape> = ({
  shapes,
  offset,
  scaledBounds,
  // rotation,
}) => {
  const app = useApp()
  const rSize = React.useRef([0, 0])
  const rContextBar = React.useRef<HTMLDivElement>(null)

  const updateStroke = React.useCallback<React.ChangeEventHandler<HTMLInputElement>>(e => {
    shapes.forEach(shape => shape.update({ stroke: e.currentTarget.value }))
  }, [])

  const updateFill = React.useCallback<React.ChangeEventHandler<HTMLInputElement>>(e => {
    shapes.forEach(shape => shape.update({ fill: e.currentTarget.value }))
  }, [])

  const updateStrokeWidth = React.useCallback<React.ChangeEventHandler<HTMLInputElement>>(e => {
    shapes.forEach(shape => shape.update({ strokeWidth: +e.currentTarget.value }))
  }, [])

  const updateOpacity = React.useCallback<React.ChangeEventHandler<HTMLInputElement>>(e => {
    shapes.forEach(shape => shape.update({ opacity: +e.currentTarget.value }))
  }, [])

  const updateSides = React.useCallback<React.ChangeEventHandler<HTMLInputElement>>(e => {
    shapes.forEach(shape => shape.update({ sides: +e.currentTarget.value }))
  }, [])

  const updateRatio = React.useCallback<React.ChangeEventHandler<HTMLInputElement>>(e => {
    shapes.forEach(shape => shape.update({ ratio: +e.currentTarget.value }))
  }, [])

  const updateFontSize = React.useCallback<React.ChangeEventHandler<HTMLInputElement>>(e => {
    textShapes.forEach(shape => shape.update({ fontSize: +e.currentTarget.value }))
  }, [])

  const updateFontWeight = React.useCallback<React.ChangeEventHandler<HTMLInputElement>>(e => {
    textShapes.forEach(shape => shape.update({ fontWeight: +e.currentTarget.value }))
  }, [])

  React.useLayoutEffect(() => {
    const elm = rContextBar.current
    if (!elm) return
    const { offsetWidth, offsetHeight } = elm
    rSize.current = [offsetWidth, offsetHeight]
  }, [])

  React.useLayoutEffect(() => {
    const elm = rContextBar.current
    if (!elm) return
    const size = rSize.current
    const [x, y] = getContextBarTranslation(size, { ...offset, bottom: offset.bottom - 32 })
    elm.style.setProperty('transform', `translateX(${x}px) translateY(${y}px)`)
  }, [scaledBounds, offset])

  if (!app) return null

  const textShapes = shapes.filter(shape => shape.type === 'text') as TextShape[]

  const sidesShapes = shapes.filter(shape => 'sides' in shape.props) as (PolygonShape | StarShape)[]

  const ShapeContent =
    shapes.length === 1 && 'ReactContextBar' in shapes[0] ? shapes[0]['ReactContextBar'] : null

  return (
    <HTMLContainer centered>
      <div ref={rContextBar} className="contextbar">
        {ShapeContent ? (
          <ShapeContent />
        ) : (
          <>
            <ColorInput label="Stroke" value={shapes[0].props.stroke} onChange={updateStroke} />
            <ColorInput label="Fill" value={shapes[0].props.fill} onChange={updateFill} />
            <NumberInput
              label="Width"
              value={Math.max(...shapes.map(shape => shape.props.strokeWidth))}
              onChange={updateStrokeWidth}
              style={{ width: 48 }}
            />
            {sidesShapes.length > 0 && (
              <NumberInput
                label="Sides"
                value={Math.max(...sidesShapes.map(shape => shape.props.sides))}
                onChange={updateSides}
                style={{ width: 40 }}
              />
            )}
            {sidesShapes.length > 0 && (
              <NumberInput
                label="Ratio"
                value={Math.max(...sidesShapes.map(shape => shape.props.ratio))}
                onChange={updateRatio}
                step={0.1}
                min={0}
                max={2}
                style={{ width: 40 }}
              />
            )}
            <NumberInput
              label="Opacity"
              value={Math.max(...shapes.map(shape => shape.props.opacity))}
              onChange={updateOpacity}
              step={0.1}
              style={{ width: 48 }}
            />
            {textShapes.length > 0 ? (
              <>
                <NumberInput
                  label="Size"
                  value={Math.max(...textShapes.map(shape => shape.props.fontSize))}
                  onChange={updateFontSize}
                  style={{ width: 48 }}
                />
                <NumberInput
                  label=" Weight"
                  value={Math.max(...textShapes.map(shape => shape.props.fontWeight))}
                  onChange={updateFontWeight}
                  style={{ width: 48 }}
                />
              </>
            ) : null}
          </>
        )}
      </div>
    </HTMLContainer>
  )
}

export const ContextBar = observer(_ContextBar)
