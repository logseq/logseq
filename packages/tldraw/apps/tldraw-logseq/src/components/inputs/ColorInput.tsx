import type { Side } from '@radix-ui/react-popper'
import { Color, isBuiltInColor, debounce } from '@tldraw/core'
import { TablerIcon } from '../icons'
import { PopoverButton } from '../PopoverButton'
import { Tooltip } from '../Tooltip'
import React from 'react'
import { LogseqContext } from '../../lib/logseq-context'
// @ts-ignore
const LSUI = window.LSUI

interface ColorInputProps extends React.HTMLAttributes<HTMLButtonElement> {
  color?: string
  opacity?: number
  popoverSide: Side
  setColor: (value: string) => void
  setOpacity?: (value: number) => void
}

export function ColorInput({
  color,
  opacity,
  popoverSide,
  setColor,
  setOpacity,
  ...rest
}: ColorInputProps) {
  const {
    handlers: { t },
  } = React.useContext(LogseqContext)

  function renderColor(color?: string) {
    return color ? (
      <div className="tl-color-bg" style={{ backgroundColor: color }}>
        <div className={`w-full h-full bg-${color}-500`}></div>
      </div>
    ) : (
      <div className={'tl-color-bg'}>
        <TablerIcon name="color-swatch" />
      </div>
    )
  }

  function isHexColor(color: string) {
    return /^#(?:[0-9a-f]{3}){1,2}$/i.test(color)
  }

  const handleChangeDebounced = React.useMemo(() => {
    let latestValue = ''

    const handler: React.ChangeEventHandler<HTMLInputElement> = e => {
      setColor(latestValue)
    }

    return debounce(handler, 100, e => {
      latestValue = e.target.value
    })
  }, [])

  return (
    <PopoverButton
      {...rest}
      border
      side={popoverSide}
      label={
        <Tooltip content={t('whiteboard/color')} side={popoverSide} sideOffset={14}>
          {renderColor(color)}
        </Tooltip>
      }
    >
      <div className="p-1">
        <div className={'tl-color-palette'}>
          {Object.values(Color).map(value => (
            <button
              key={value}
              className={`tl-color-drip m-1${value === color ? ' active' : ''}`}
              onClick={() => setColor(value)}
            >
              {renderColor(value)}
            </button>
          ))}
        </div>

        <div className="flex items-center tl-custom-color">
          <div className={`tl-color-drip m-1 mr-3 ${!isBuiltInColor(color) ? 'active' : ''}`}>
            <div className="color-input-wrapper tl-color-bg">
              <input
                className="color-input cursor-pointer"
                id="tl-custom-color-input"
                type="color"
                value={isHexColor(color) ? color : '#000000'}
                onChange={handleChangeDebounced}
                style={{ opacity: isBuiltInColor(color) ? 0 : 1 }}
                {...rest}
              />
            </div>
          </div>
          <label htmlFor="tl-custom-color-input" className="text-xs cursor-pointer">
            {t('whiteboard/select-custom-color')}
          </label>
        </div>

        {setOpacity && (
          <div className="mx-1 my-2">
            <LSUI.Slider
              defaultValue={[opacity ?? 0]}
              onValueCommit={value => setOpacity(value[0])}
              max={1}
              step={0.1}
              aria-label={t('whiteboard/opacity')}
              className="tl-slider-root"
            >
              <LSUI.SliderTrack className="tl-slider-track">
                <LSUI.SliderRange className="tl-slider-range" />
              </LSUI.SliderTrack>
              <LSUI.SliderThumb className="tl-slider-thumb" />
            </LSUI.Slider>
          </div>
        )}
      </div>
    </PopoverButton>
  )
}
