import { TablerIcon } from '../icons'
import { Tooltip } from '../Tooltip'

// @ts-ignore
const LSUI = window.LSUI

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
    <LSUI.ToggleGroup
      type="single"
      value={value}
      onValueChange={onValueChange}
    >
      {options.map(option => {
        return (
          <Tooltip content={option.tooltip} key={option.value}>
            <div className="inline-block h-full">
              <LSUI.ToggleGroupItem
                className="h-full"
                value={option.value}
                disabled={option.value === value}
              >
                <TablerIcon name={option.icon} />
              </LSUI.ToggleGroupItem>
            </div>
          </Tooltip>
        )
      })}
    </LSUI.ToggleGroup>
  )
}

export function ToggleGroupMultipleInput({
  options,
  value,
  onValueChange,
}: ToggleGroupMultipleInputProps) {
  return (
    <LSUI.ToggleGroup
      className="contents"
      type="multiple"
      value={value}
      onValueChange={onValueChange}
    >
      {options.map(option => {
        return (
          <LSUI.ToggleGroupItem
            className="h-full"
            key={option.value}
            value={option.value}
          >
            <TablerIcon name={option.icon} />
          </LSUI.ToggleGroupItem>
        )
      })}
    </LSUI.ToggleGroup>
  )
}
