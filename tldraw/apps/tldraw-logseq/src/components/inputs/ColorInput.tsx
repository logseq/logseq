import * as React from 'react'
import * as Popover from '@radix-ui/react-popover';
import { TablerIcon } from '../icons'
import { HighlightColor } from '@tldraw/core'
interface ColorInputProps extends React.InputHTMLAttributes<HTMLButtonElement> {
  setColor: (value: HighlightColor) => void
}

export function ColorInput({ value, setColor, ...rest }: ColorInputProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [computedValue, setComputedValue] = React.useState(value)

  // TODO: listen to theme change?
  React.useEffect(() => {
    if (value?.toString().startsWith('var') && ref.current) {
      const varName = /var\((.*)\)/.exec(value.toString())?.[1]
      if (varName) {
        const [v, d] = varName.split(',').map(s => s.trim())
        setComputedValue(getComputedStyle(ref.current).getPropertyValue(v).trim() ?? d ?? '#000')
      }
    }
  }, [value])

  return (
    <Popover.Root>
      <Popover.Trigger>
        <div className="input" ref={ref}>
          <button className={`tl-color-drip mx-1`}>
            <div className={`tl-color-bg bg-${value}-500`}></div>
          </button>
        </div>
      </Popover.Trigger>
      <Popover.Anchor />
      <Popover.Portal>
        <Popover.Content
          className="tl-popover-content"
          side="top"
          arrowPadding={10}
        >
          <div className={"tl-color-palette"}>
            {Object.values(HighlightColor).map(color =>
              <button
                className={`tl-color-drip  m-1${color === value ? " active" : ""}`}
                onClick={()=>setColor(color)}
              >
                {(color === "transparent") ?
                  <TablerIcon name="droplet-off" /> :
                  <div className={`tl-color-bg bg-${color}-500`}></div>}
              </button>
            )}
          </div>
          <Popover.Arrow className="tl-popover-arrow" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
