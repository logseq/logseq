import * as React from 'react'
import * as Popover from '@radix-ui/react-popover';
import { TablerIcon } from '../icons'
import { Color } from '@tldraw/core'
interface ColorInputProps extends React.InputHTMLAttributes<HTMLButtonElement> {
  value: string
  setColor: (value: string) => void
}

export function ColorInput({ value, setColor, ...rest }: ColorInputProps) {
  const ref = React.useRef<HTMLDivElement>(null)

  function renderColor(color: string) {
    return color ?
      <div className="tl-color-bg" style={{backgroundColor: color}}>
        <div className={`w-full h-full bg-${color}-500`}></div>
      </div> :
      <div className={"tl-color-bg"}><TablerIcon name="color-swatch" /></div>
  }

  return (
    <Popover.Root>
      <Popover.Trigger>
        <button className={`tl-color-drip mx-1`}>
          {renderColor(value)}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="tl-popover-content"
          side="top"
          sideOffset={15}
        >
          <div className={"tl-color-palette"}>
            {Object.values(Color).map(color =>
              <button
                className={`tl-color-drip m-1${color === value ? " active" : ""}`}
                onClick={()=>setColor(color)}
              >
                {renderColor(color)}
              </button>
            )}
          </div>
          <Popover.Arrow className="tl-popover-arrow" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
