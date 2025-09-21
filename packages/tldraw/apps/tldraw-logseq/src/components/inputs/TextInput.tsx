import * as React from 'react'

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  autoResize?: boolean
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ autoResize = true, value, className, ...rest }, ref) => {
    return (
      <div className={'tl-input' + (className ? ' ' + className : '')}>
        <div className="tl-input-sizer">
          <div className="tl-input-hidden">{value}</div>
          <input ref={ref} value={value} className="tl-text-input" type="text" {...rest} />
        </div>
      </div>
    )
  }
)
