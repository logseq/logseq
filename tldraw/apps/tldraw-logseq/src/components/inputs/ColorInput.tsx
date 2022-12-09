import type { Side } from '@radix-ui/react-popper'
import * as Slider from '@radix-ui/react-slider'
import { Color } from '@tldraw/core'
import { TablerIcon } from '../icons'
import { PopoverButton } from '../PopoverButton'
import { Tooltip } from '../Tooltip'

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
  title = "Color",
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

  return (
    <PopoverButton {...rest} border arrow side={popoverSide} label={<Tooltip title={title} side={popoverSide} sideOffset={14}>{renderColor(color)}</Tooltip>}>
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
