import * as Tooltip from '@radix-ui/react-tooltip';
import type { Side } from '@radix-ui/react-popper'
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  tooltipSide?: Side
}

export function Button({ className, title, tooltipSide, ...rest }: ButtonProps) {
  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button className={'tl-button ' + (className ?? '')} {...rest} />
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="tl-tooltip-content" sideOffset={5} side={tooltipSide}>
            {title}
            <Tooltip.Arrow className="tl-tooltip-arrow" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}
