import * as ToggleGroup from '@radix-ui/react-toggle-group'
import { TablerIcon } from '../icons'

export interface ToggleGroupInputOption {
  value: string
  icon: string
}

interface ToggleGroupInputProps extends React.HTMLAttributes<HTMLElement> {
  options: ToggleGroupInputOption[]
  value: string
  onValueChange: (value: string) => void
}

interface ToggleGroupMultipleInputProps extends React.HTMLAttributes<HTMLElement> {
  options: ToggleGroupInputOption[]
  value: string[]
  onValueChange: (value: string[]) => void
}

export function ToggleGroupInput({ options, value, onValueChange }: ToggleGroupInputProps) {
  return (
    <ToggleGroup.Root
      className="tl-toggle-group-input"
      type="single"
      value={value}
      onValueChange={onValueChange}
    >
      {options.map(option => {
        return (
          <ToggleGroup.Item
            className="tl-toggle-group-input-button"
            key={option.value}
            value={option.value}
            disabled={option.value === value}
          >
            <TablerIcon name={option.icon} />
          </ToggleGroup.Item>
        )
      })}
    </ToggleGroup.Root>
  )
}

export function ToggleGroupMultipleInput({
  options,
  value,
  onValueChange,
}: ToggleGroupMultipleInputProps) {
  return (
    <ToggleGroup.Root
      className="tl-toggle-group-input"
      type="multiple"
      value={value}
      onValueChange={onValueChange}
    >
      {options.map(option => {
        return (
          <ToggleGroup.Item
            className="tl-toggle-group-input-button"
            key={option.value}
            value={option.value}
          >
            <TablerIcon name={option.icon} />
          </ToggleGroup.Item>
        )
      })}
    </ToggleGroup.Root>
  )
}
