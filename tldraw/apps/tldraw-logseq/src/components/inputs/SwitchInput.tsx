import * as React from 'react'
import * as Switch from '@radix-ui/react-switch'
interface SwitchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  onCheckedChange: (checked: boolean) => void
}

export function SwitchInput({ label, ...rest }: SwitchInputProps) {
  return (
    <div className="input">
      <label htmlFor={`switch-${label}`}>{label}</label>
      <Switch.Root
        className="switch-input-root"
        checked={rest.checked}
        onCheckedChange={rest.onCheckedChange}
      >
        <Switch.Thumb className="switch-input-thumb" />
      </Switch.Root>
    </div>
  )
}
