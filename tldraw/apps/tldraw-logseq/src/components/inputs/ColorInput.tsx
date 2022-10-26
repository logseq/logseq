import * as React from 'react'
import * as Popover from '@radix-ui/react-popover';
import { TablerIcon } from '../icons'

interface ColorInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

enum HighlightColor {
  Gray = 'gray',
  Red = 'red',
  Yellow = 'yellow',
  Green = 'green',
  Blue = 'blue',
  Purple = 'purple',
  Pink = 'pink',
}

export function ColorInput({ value, onChange, ...rest }: ColorInputProps) {
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
      <Popover.Trigger asChild>
        <div className="input" ref={ref}>
          <div className="color-input-wrapper">
            <button
              className={`bg-${computedValue}-500)`}
            />
          </div>
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
            {Object.values(HighlightColor).map(value =>
              <button
                className={`tl-color-drip bg-${value}-500`}
                onClick={()=>{
                  setComputedValue(value)
                }}
              />
            )}
            <button
                className="tl-color-drip"
            >
              <TablerIcon name="text" />
            </button>
          </div>
          <Popover.Arrow className="tl-popover-arrow" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
