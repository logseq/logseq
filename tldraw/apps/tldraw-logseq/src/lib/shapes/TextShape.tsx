/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  getTextLabelSize,
  TextUtils,
  TLBounds,
  TLResizeStartInfo,
  TLTextShape,
  TLTextShapeProps,
  getComputedColor,
  isSafari,
} from '@tldraw/core'
import { HTMLContainer, TLComponentProps } from '@tldraw/react'
import { action, computed } from 'mobx'
import { observer } from 'mobx-react-lite'
import * as React from 'react'
import type { SizeLevel } from '.'
import { CustomStyleProps, withClampedStyles } from './style-props'
import { TextAreaUtils } from './text/TextAreaUtils'

export interface TextShapeProps extends TLTextShapeProps, CustomStyleProps {
  borderRadius: number
  fontFamily: string
  fontSize: number
  fontWeight: number
  italic: boolean
  lineHeight: number
  padding: number
  type: 'text'
  scaleLevel?: SizeLevel
}

const levelToScale = {
  xs: 10,
  sm: 16,
  md: 20,
  lg: 32,
  xl: 48,
  xxl: 60,
}

export class TextShape extends TLTextShape<TextShapeProps> {
  static id = 'text'

  static defaultProps: TextShapeProps = {
    id: 'box',
    parentId: 'page',
    type: 'text',
    point: [0, 0],
    size: [0, 0],
    isSizeLocked: true,
    text: '',
    lineHeight: 1.2,
    fontSize: 20,
    fontWeight: 400,
    italic: false,
    padding: 4,
    fontFamily: 'var(--ls-font-family)',
    borderRadius: 0,
    stroke: '',
    fill: '',
    noFill: true,
    strokeType: 'line',
    strokeWidth: 2,
    opacity: 1,
  }

  ReactComponent = observer(({ events, isErasing, isEditing, onEditingEnd }: TLComponentProps) => {
    const {
      props: {
        opacity,
        fontFamily,
        fontSize,
        fontWeight,
        italic,
        lineHeight,
        text,
        stroke,
        padding,
      },
    } = this
    const rInput = React.useRef<HTMLTextAreaElement>(null)

    const rIsMounted = React.useRef(false)

    const rInnerWrapper = React.useRef<HTMLDivElement>(null)

    // When the text changes, update the text—and,
    const handleChange = React.useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const { isSizeLocked } = this.props
      const text = TextUtils.normalizeText(e.currentTarget.value)
      if (isSizeLocked) {
        this.update({ text, size: this.getAutoSizedBoundingBox({ text }) })
        return
      }
      // If not autosizing, update just the text
      this.update({ text })
    }, [])

    const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Escape') return

      if (e.key === 'Tab' && text.length === 0) {
        e.preventDefault()
        return
      }

      if (!(e.key === 'Meta' || e.metaKey)) {
        e.stopPropagation()
      } else if (e.key === 'z' && e.metaKey) {
        if (e.shiftKey) {
          document.execCommand('redo', false)
        } else {
          document.execCommand('undo', false)
        }
        e.stopPropagation()
        e.preventDefault()
        return
      }

      if (e.key === 'Tab') {
        e.preventDefault()
        if (e.shiftKey) {
          TextAreaUtils.unindent(e.currentTarget)
        } else {
          TextAreaUtils.indent(e.currentTarget)
        }

        this.update({ text: TextUtils.normalizeText(e.currentTarget.value) })
      }
    }, [])

    const handleBlur = React.useCallback(
      (e: React.FocusEvent<HTMLTextAreaElement>) => {
        if (!isEditing) return
        e.currentTarget.setSelectionRange(0, 0)
        onEditingEnd?.()
      },
      [onEditingEnd]
    )

    const handleFocus = React.useCallback(
      (e: React.FocusEvent<HTMLTextAreaElement>) => {
        if (!isEditing) return
        if (!rIsMounted.current) return
        if (document.activeElement === e.currentTarget) {
          e.currentTarget.select()
        }
      },
      [isEditing]
    )

    const handlePointerDown = React.useCallback(
      e => {
        if (isEditing) e.stopPropagation()
      },
      [isEditing]
    )

    React.useEffect(() => {
      if (isEditing) {
        requestAnimationFrame(() => {
          rIsMounted.current = true
          const elm = rInput.current
          if (elm) {
            elm.focus()
            elm.select()
          }
        })
      } else {
        onEditingEnd?.()
      }
    }, [isEditing, onEditingEnd])

    React.useLayoutEffect(() => {
      if (this.props.size[0] === 0 || this.props.size[1] === 0) {
        this.onResetBounds()
      }
    }, [])

    return (
      <HTMLContainer {...events} opacity={isErasing ? 0.2 : opacity}>
        <div
          ref={rInnerWrapper}
          className="tl-text-shape-wrapper"
          data-hastext={!!text}
          data-isediting={isEditing}
          style={{
            fontFamily,
            fontStyle: italic ? 'italic' : 'normal',
            fontSize,
            fontWeight,
            padding,
            lineHeight,
            color: getComputedColor(stroke, 'text'),
          }}
        >
          {isEditing ? (
            <textarea
              ref={rInput}
              className="tl-text-shape-input"
              name="text"
              tabIndex={-1}
              autoComplete="false"
              autoCapitalize="false"
              autoCorrect="false"
              autoSave="false"
              // autoFocus
              placeholder=""
              spellCheck="true"
              wrap="off"
              dir="auto"
              datatype="wysiwyg"
              defaultValue={text}
              onFocus={handleFocus}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              onPointerDown={handlePointerDown}
              // onContextMenu={stopPropagation}
            />
          ) : (
            <>{text}&#8203;</>
          )}
        </div>
      </HTMLContainer>
    )
  })

  @computed get scaleLevel() {
    return this.props.scaleLevel ?? 'md'
  }

  @action setScaleLevel = async (v?: SizeLevel) => {
    this.update({
      scaleLevel: v,
      fontSize: levelToScale[v ?? 'md'],
    })
    this.onResetBounds()
  }

  ReactIndicator = observer(({ isEditing }: TLComponentProps) => {
    const {
      props: { borderRadius, isLocked },
      bounds,
    } = this
    return isEditing ? null : (
      <rect
        width={bounds.width}
        height={bounds.height}
        rx={borderRadius}
        ry={borderRadius}
        fill="transparent"
        strokeDasharray={isLocked ? '8 2' : 'undefined'}
      />
    )
  })

  validateProps = (props: Partial<TextShapeProps>) => {
    if (props.isSizeLocked || this.props.isSizeLocked) {
      // props.size = this.getAutoSizedBoundingBox(props)
    }
    return withClampedStyles(this, props)
  }

  getAutoSizedBoundingBox(props = {} as Partial<TextShapeProps>) {
    const {
      text = this.props.text,
      fontFamily = this.props.fontFamily,
      fontSize = this.props.fontSize,
      fontWeight = this.props.fontWeight,
      lineHeight = this.props.lineHeight,
      padding = this.props.padding,
    } = props
    const [width, height] = getTextLabelSize(
      text,
      { fontFamily, fontSize, lineHeight, fontWeight },
      padding
    )
    return [width, height]
  }

  getBounds = (): TLBounds => {
    const [x, y] = this.props.point
    const [width, height] = this.props.size
    return {
      minX: x,
      minY: y,
      maxX: x + width,
      maxY: y + height,
      width,
      height,
    }
  }

  onResizeStart = ({ isSingle }: TLResizeStartInfo) => {
    if (!isSingle) return this
    this.scale = [...(this.props.scale ?? [1, 1])]
    return this.update({
      isSizeLocked: false,
    })
  }

  onResetBounds = () => {
    this.update({
      size: this.getAutoSizedBoundingBox(),
      isSizeLocked: true,
    })
    return this
  }

  getShapeSVGJsx() {
    if (isSafari()) {
      // Safari doesn't support foreignObject well
      return super.getShapeSVGJsx(null)
    }
    const {
      props: { text, stroke, fontSize, fontFamily },
    } = this
    // Stretch to the bound size
    const bounds = this.getBounds()

    return (
      <foreignObject width={bounds.width} height={bounds.height}>
        <div
          style={{
            color: getComputedColor(stroke, 'text'),
            fontSize,
            fontFamily,
            display: 'contents',
          }}
        >
          {text}
        </div>
      </foreignObject>
    )
  }
}
