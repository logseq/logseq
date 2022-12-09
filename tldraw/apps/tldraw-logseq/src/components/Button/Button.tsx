import { Tooltip } from '../Tooltip'
import type { Side } from '@radix-ui/react-popper'
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  tooltipSide?: Side
}

export function Button({ className, title, tooltipSide, ...rest }: ButtonProps) {
  return (
    <Tooltip title={title} side={tooltipSide}>
      <button className={'tl-button ' + (className ?? '')} {...rest} />
    </Tooltip>
  )
}
