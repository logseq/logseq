import * as Switch from '@radix-ui/react-switch'
interface SwitchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  onCheckedChange: (checked: boolean) => void
}

export function SwitchInput({ label, onCheckedChange, checked, ...rest }: SwitchInputProps) {
  return (
    <div {...rest} className="input">
      <Switch.Root
        className="switch-input-root"
        checked={checked}
        onCheckedChange={onCheckedChange}
      >
        <Switch.Thumb className="switch-input-thumb" />
      </Switch.Root>
    </div>
  )
}
