import * as React from 'react'
import * as Popover from '@radix-ui/react-popover'
import * as Slider from '@radix-ui/react-slider'
import { TablerIcon } from '../icons'
import { Color } from '@tldraw/core'
interface ColorInputProps extends React.InputHTMLAttributes<HTMLButtonElement> {
  color: string
  opacity: number
  collisionRef: HTMLElement | null
  setColor: (value: string) => void
  setOpacity: (value: number) => void
}

export function ColorInput({
  color,
  opacity,
  collisionRef,
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
      <Popover.Trigger>
        <button className="tl-color-drip mx-1">{renderColor(color)}</button>
      </Popover.Trigger>

      <Popover.Content
        className="tl-popover-content"
        side="top"
        sideOffset={15}
        collisionBoundary={collisionRef}
      >
        <div className={'tl-color-palette'}>
          {Object.values(Color).map(value => (
            <button
              className={`tl-color-drip m-1${value === color ? ' active' : ''}`}
              onClick={() => setColor(value)}
            >
              {renderColor(value)}
            </button>
          ))}
        </div>

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

        <Popover.Arrow className="tl-popover-arrow" />
      </Popover.Content>
    </Popover.Root>
  )
}
