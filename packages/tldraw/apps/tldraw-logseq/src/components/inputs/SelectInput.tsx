import * as React from 'react'
import { Tooltip } from '../Tooltip'
import type { Side } from '@radix-ui/react-popper'

// @ts-ignore
const LSUI = window.LSUI

export interface SelectOption {
  value: string
  label: React.ReactNode
}

interface SelectInputProps extends React.HTMLAttributes<HTMLElement> {
  options: SelectOption[]
  value: string
  tooltip?: React.ReactNode
  popoverSide?: Side
  chevron?: boolean
  onValueChange: (value: string) => void
}

export function SelectInput({
  options,
  tooltip,
  popoverSide,
  chevron = true,
  value,
  onValueChange,
  ...rest
}: SelectInputProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  return (
    <div {...rest}>
      <LSUI.Select
        open={isOpen}
        onOpenChange={setIsOpen}
        value={value}
        onValueChange={onValueChange}
      >
        <Tooltip content={tooltip} side={popoverSide}>
          <LSUI.SelectTrigger className="h-8 bg-transparent">
            <LSUI.SelectValue />
          </LSUI.SelectTrigger>
        </Tooltip>

        <LSUI.SelectContent
        className="min-w-min"
          side={popoverSide}
          position="popper"
          sideOffset={14}
          align="center"
          onKeyDown={e => e.stopPropagation()}
        >
          {options.map(option => {
            return (
              <LSUI.SelectItem
                key={option.value}
                value={option.value}
              >
                {option.label}
              </LSUI.SelectItem>
            )
          })}
        </LSUI.SelectContent>
      </LSUI.Select>
    </div>
  )
}
