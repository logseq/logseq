import * as React from 'react'

interface ColorInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export function ColorInput({ label, value, onChange, ...rest }: ColorInputProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [computedValue, setComputedValue] = React.useState(value)

  // TODO: listen to theme change?
  React.useEffect(() => {
    if (value?.toString().startsWith('var') && ref.current) {
      const varName = /var\((.*)\)/.exec(value.toString())?.[1]
      if (varName) {
        setComputedValue(getComputedStyle(ref.current).getPropertyValue(varName).trim())
      }
    }
  }, [value])

  return (
    <div className="input" ref={ref}>
      <label htmlFor={`color-${label}`}>{label}</label>
      <div className="color-input-wrapper">
        <input
          className="color-input"
          name={`color-${label}`}
          type="color"
          value={computedValue}
          onChange={(e) => {
            setComputedValue(e.target.value)
            onChange?.(e)
          }}
          {...rest}
        />
      </div>
    </div>
  )
}
