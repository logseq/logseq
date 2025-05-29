import { Tooltip } from '../Tooltip'

// @ts-ignore
const LSUI = window.LSUI

interface ToggleInputProps extends React.HTMLAttributes<HTMLElement> {
  toggle?: boolean
  pressed: boolean
  tooltip?: React.ReactNode
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
    <Tooltip content={tooltip}>
      <div className="inline-flex">
        <LSUI.Toggle
          {...rest}
          data-toggle={toggle}
          className={'tl-button' + (className ? ' ' + className : '')}
          pressed={pressed}
          onPressedChange={onPressedChange}
        />
      </div>
    </Tooltip>
  )
}
