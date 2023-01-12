import * as ToggleGroup from '@radix-ui/react-toggle-group'
import { TablerIcon } from '../icons'
import { Tooltip } from '../Tooltip'

export interface ToggleGroupInputOption {
  value: string
  icon: string
  tooltip?: string
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
          <Tooltip content={option.tooltip} key={option.value}>
            <div className="inline-block">
              <ToggleGroup.Item
                className="tl-toggle-group-input-button"
                value={option.value}
                disabled={option.value === value}
              >
                <TablerIcon name={option.icon} />
              </ToggleGroup.Item>
            </div>
          </Tooltip>
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
