import * as React from 'react'

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, ...rest }, ref) => {
    return (
      <div className="tl-input">
        <label htmlFor={`text-${label}`}>{label}</label>
        <input ref={ref} className="tl-text-input" name={`text-${label}`} type="text" {...rest} />
      </div>
    )
  }
)
