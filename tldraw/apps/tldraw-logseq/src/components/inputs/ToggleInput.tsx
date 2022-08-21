import * as Toggle from '@radix-ui/react-toggle'

interface ToggleInputProps extends React.HTMLAttributes<HTMLElement> {
  pressed: boolean
  onPressedChange: (value: boolean) => void
}

export function ToggleInput({ pressed, onPressedChange, className, ...rest }: ToggleInputProps) {
  return (
    <Toggle.Root
      {...rest}
      className={'tl-toggle-input' + (className ? ' ' + className : '')}
      pressed={pressed}
      onPressedChange={onPressedChange}
    ></Toggle.Root>
  )
}
