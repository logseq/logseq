import { SelectInput, type SelectOption } from '../inputs/SelectInput'
import type { Side } from '@radix-ui/react-popper'
import type { SizeLevel } from '../../lib'
import { useApp } from '@tldraw/react'

interface ScaleInputProps extends React.HTMLAttributes<HTMLButtonElement> {
  scaleLevel?: SizeLevel
  compact?: boolean
  popoverSide?: Side
}

export function ScaleInput({ scaleLevel, compact, popoverSide, ...rest }: ScaleInputProps) {
  const app = useApp<Shape>()

  const sizeOptions: SelectOption[] = [
    {
      label: compact ? 'XS' : 'Extra Small',
      value: 'xs',
    },
    {
      label: compact ? 'SM' : 'Small',
      value: 'sm',
    },
    {
      label: compact ? 'MD' : 'Medium',
      value: 'md',
    },
    {
      label: compact ? 'LG' : 'Large',
      value: 'lg',
    },
    {
      label: compact ? 'XL' : 'Extra Large',
      value: 'xl',
    },
    {
      label: compact ? 'XXL' : 'Huge',
      value: 'xxl',
    },
  ]

  return (
    <SelectInput
      tooltip="Scale level"
      options={sizeOptions}
      value={scaleLevel}
      popoverSide={popoverSide}
      chevron={!compact}
      onValueChange={v => {
        app.api.setScaleLevel(v)
      }}
    />
  )
}
