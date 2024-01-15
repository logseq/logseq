import { SelectInput, type SelectOption } from '../inputs/SelectInput'
import type { Side } from '@radix-ui/react-popper'
import type { SizeLevel } from '../../lib'
import { useApp } from '@tldraw/react'
import React from 'react'
import { LogseqContext } from '../../lib/logseq-context'

interface ScaleInputProps extends React.HTMLAttributes<HTMLButtonElement> {
  scaleLevel?: SizeLevel
  compact?: boolean
  popoverSide?: Side
}

export function ScaleInput({ scaleLevel, compact, popoverSide, ...rest }: ScaleInputProps) {
  const app = useApp<Shape>()
  const {
    handlers: { t },
  } = React.useContext(LogseqContext)

  const sizeOptions: SelectOption[] = [
    {
      label: compact ? 'XS' : t('whiteboard/extra-small'),
      value: 'xs',
    },
    {
      label: compact ? 'SM' : t('whiteboard/small'),
      value: 'sm',
    },
    {
      label: compact ? 'MD' : t('whiteboard/medium'),
      value: 'md',
    },
    {
      label: compact ? 'LG' : t('whiteboard/large'),
      value: 'lg',
    },
    {
      label: compact ? 'XL' : t('whiteboard/extra-large'),
      value: 'xl',
    },
    {
      label: compact ? 'XXL' : t('whiteboard/huge'),
      value: 'xxl',
    },
  ]

  return (
    <SelectInput
      tooltip={t('whiteboard/scale-level')}
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
