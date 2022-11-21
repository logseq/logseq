import * as React from 'react'
import * as Popover from '@radix-ui/react-popover'
import type { Side } from '@radix-ui/react-popper'
import * as Slider from '@radix-ui/react-slider'
import { TablerIcon } from '../icons'
import { Color } from '@tldraw/core'

interface ColorInputProps extends React.InputHTMLAttributes<HTMLButtonElement> {
  color?: string
  opacity?: number
  collisionRef: HTMLElement | null
  popoverSide: Side
  setColor: (value: string) => void
  setOpacity?: (value: number) => void
}

export function ColorInput({
  color,
  opacity,
  collisionRef,
  popoverSide,
  setColor,
  setOpacity,
  ...rest
}: ColorInputProps) {
  const ref = React.useRef<HTMLDivElement>(null)

  function renderColor(color: string) {
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

  return (
    <Popover.Root>
      <Popover.Trigger className="tl-color-drip">{renderColor(color)}</Popover.Trigger>

      <Popover.Content
        className="tl-popover-content p-1"
        side={popoverSide}
        sideOffset={15}
        collisionBoundary={collisionRef}
      >
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

        {setOpacity && (
          <div className="mx-1 my-2">
            <Slider.Root
              defaultValue={[opacity]}
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

        <Popover.Arrow className="tl-popover-arrow" />
      </Popover.Content>
    </Popover.Root>
  )
}
