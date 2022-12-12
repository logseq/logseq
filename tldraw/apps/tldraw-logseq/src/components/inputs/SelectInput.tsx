import * as React from 'react'
import * as Select from '@radix-ui/react-select'
import { TablerIcon } from '../icons'
import { Tooltip } from '../Tooltip'

export interface SelectOption {
  value: string
  label: React.ReactNode
}

interface SelectInputProps extends React.HTMLAttributes<HTMLElement> {
  options: SelectOption[]
  value: string
  tooltip?: React.ReactNode
  onValueChange: (value: string) => void
}

export function SelectInput({ options, tooltip, value, onValueChange, ...rest }: SelectInputProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  return (
    <div {...rest} className="tl-select-input">
      <Select.Root
        open={isOpen}
        onOpenChange={setIsOpen}
        value={value}
        onValueChange={onValueChange}
      >
        <Tooltip content={tooltip}>
          <Select.Trigger className="tl-select-input-trigger">
            <div className="tl-select-input-trigger-value">
              <Select.Value />
            </div>
            <Select.Icon style={{ lineHeight: 1 }}>
              <TablerIcon name={isOpen ? 'chevron-up' : 'chevron-down'} />
            </Select.Icon>
          </Select.Trigger>
        </Tooltip>

        <Select.Portal className="tl-select-input-portal">
          <Select.Content className="tl-select-input-content">
            <Select.ScrollUpButton />
            <Select.Viewport className="tl-select-input-viewport">
              {options.map(option => {
                return (
                  <Select.Item
                    className="tl-select-input-select-item"
                    key={option.value}
                    value={option.value}
                  >
                    <Select.ItemText>{option.label}</Select.ItemText>
                  </Select.Item>
                )
              })}
            </Select.Viewport>
            <Select.ScrollDownButton />
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  )
}
