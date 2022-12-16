import { Tooltip } from '../Tooltip'
import * as Toggle from '@radix-ui/react-toggle'

interface ToggleInputProps extends React.HTMLAttributes<HTMLElement> {
  toggle?: boolean
  pressed: boolean
  tooltip?: string
  onPressedChange: (value: boolean) => void
}

export function ToggleInput({
  toggle = true,
  pressed,
  onPressedChange,
  className,
  tooltip,
  ...rest
}: ToggleInputProps) {
  return (
    <Tooltip content={tooltip} asChild={false}>
      <Toggle.Root
        {...rest}
        data-toggle={toggle}
        className={'tl-toggle-input' + (className ? ' ' + className : '')}
        pressed={pressed}
        onPressedChange={onPressedChange}
      ></Toggle.Root>
    </Tooltip>
  )
}
