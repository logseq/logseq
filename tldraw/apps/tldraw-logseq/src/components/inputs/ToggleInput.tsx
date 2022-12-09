import { Tooltip } from '../Tooltip'
import * as Toggle from '@radix-ui/react-toggle'

interface ToggleInputProps extends React.HTMLAttributes<HTMLElement> {
  toggle?: boolean
  pressed: boolean
  onPressedChange: (value: boolean) => void
}

export function ToggleInput({
  toggle = true,
  pressed,
  onPressedChange,
  className,
  title,
  ...rest
}: ToggleInputProps) {
  return (
    <Tooltip title={title}>
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
