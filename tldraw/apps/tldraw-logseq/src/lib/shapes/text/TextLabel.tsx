import { TextUtils } from '@tldraw/core'
import * as React from 'react'
import { getTextLabelSize } from '@tldraw/core'
import { TextAreaUtils } from './TextAreaUtils'

const stopPropagation = (e: KeyboardEvent | React.SyntheticEvent<any, Event>) => e.stopPropagation()

export interface TextLabelProps {
  font: string
  text: string
  color: string
  onBlur?: () => void
  onChange: (text: string) => void
  offsetY?: number
  offsetX?: number
  scale?: number
  isEditing?: boolean
}

export const TextLabel = React.memo(function TextLabel({
  font,
  text,
  color,
  offsetX = 0,
  offsetY = 0,
  scale = 1,
  isEditing = false,
  onBlur,
  onChange,
}: TextLabelProps) {
  const rInput = React.useRef<HTMLTextAreaElement>(null)
  const rIsMounted = React.useRef(false)

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(TextUtils.normalizeText(e.currentTarget.value))
    },
    [onChange]
  )
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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

        onChange?.(TextUtils.normalizeText(e.currentTarget.value))
      }
    },
    [onChange]
  )

  const handleBlur = React.useCallback(
    (e: React.FocusEvent<HTMLTextAreaElement>) => {
      if (!isEditing) return
      e.currentTarget.setSelectionRange(0, 0)
      onBlur?.()
    },
    [onBlur]
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
      if (isEditing) {
        e.stopPropagation()
      }
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
    }
  }, [isEditing, onBlur])

  const rInnerWrapper = React.useRef<HTMLDivElement>(null)

  React.useLayoutEffect(() => {
    const elm = rInnerWrapper.current
    if (!elm) return
    const size = getTextLabelSize(text, font, 4)
    elm.style.transform = `scale(${scale}, ${scale}) translate(${offsetX}px, ${offsetY}px)`
    elm.style.width = size[0] + 1 + 'px'
    elm.style.height = size[1] + 1 + 'px'
  }, [text, font, offsetY, offsetX, scale])

  return (
    <div className="tl-text-label-wrapper">
      <div
        className="tl-text-label-inner-wrapper"
        ref={rInnerWrapper}
        style={{
          font,
          color,
          pointerEvents: text ? 'all' : 'none',
          userSelect: isEditing ? 'text' : 'none',
        }}
      >
        {isEditing ? (
          <textarea
            ref={rInput}
            style={{
              font,
              color,
            }}
            className="tl-text-label-textarea"
            name="text"
            tabIndex={-1}
            autoComplete="false"
            autoCapitalize="false"
            autoCorrect="false"
            autoSave="false"
            autoFocus
            placeholder=""
            spellCheck="true"
            wrap="off"
            dir="auto"
            datatype="wysiwyg"
            defaultValue={text}
            color={color}
            onFocus={handleFocus}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onPointerDown={handlePointerDown}
            onContextMenu={stopPropagation}
            onCopy={stopPropagation}
            onPaste={stopPropagation}
            onCut={stopPropagation}
          />
        ) : (
          text
        )}
        &#8203;
      </div>
    </div>
  )
})
