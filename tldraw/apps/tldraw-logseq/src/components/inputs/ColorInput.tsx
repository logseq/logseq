import type { Side } from '@radix-ui/react-popper'
import * as Slider from '@radix-ui/react-slider'
import { Color, isBuiltInColor, debounce } from '@tldraw/core'
import { TablerIcon } from '../icons'
import { PopoverButton } from '../PopoverButton'
import { Tooltip } from '../Tooltip'
import React from 'react'

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
      arrow
      side={popoverSide}
      label={
        <Tooltip content={'Color'} side={popoverSide} sideOffset={14}>
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
                value={isHexColor(color) ? color : "#000000"}
                onChange={handleChangeDebounced}
                style={{ opacity: isBuiltInColor(color) ? 0 : 1 }}
                {...rest}
              />
            </div>
          </div>
          <label htmlFor="tl-custom-color-input" className="cursor-pointer">
            Select custom color
          </label>
        </div>

        {setOpacity && (
          <div className="mx-1 my-2">
            <Slider.Root
              defaultValue={[opacity ?? 0]}
              onValueCommit={value => setOpacity(value[0])}
              max={1}
              step={0.1}
              aria-label="Opacity"
              className="tl-slider-root"
            >
              <Slider.Track className="tl-slider-track">
                <Slider.Range className="tl-slider-range" />
              </Slider.Track>
              <Slider.Thumb className="tl-slider-thumb" />
            </Slider.Root>
          </div>
        )}
      </div>
    </PopoverButton>
  )
}
