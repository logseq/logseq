import { Tooltip } from '../Tooltip'
import type { Side } from '@radix-ui/react-popper'
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  tooltip?: React.ReactNode
  tooltipSide?: Side
}

export function Button({ className, tooltip, tooltipSide, ...rest }: ButtonProps) {
  return (
    <Tooltip content={tooltip} side={tooltipSide}>
      <button className={'tl-button ' + (className ?? '')} {...rest} />
    </Tooltip>
  )
}
