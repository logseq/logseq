import * as React from 'react'

interface ColorInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

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
    <div className="input" ref={ref}>
      <div className="color-input-wrapper">
        <input
          className="color-input"
          type="color"
          value={computedValue}
          onChange={e => {
            setComputedValue(e.target.value)
            onChange?.(e)
          }}
          {...rest}
        />
      </div>
    </div>
  )
}
