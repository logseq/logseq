import * as ReactTooltip from '@radix-ui/react-tooltip';
import type { Side } from '@radix-ui/react-popper'
export interface TooltipProps extends ReactTooltip.TooltipContentProps {
  children: React.ReactNode
  side?: Side
}

export function Tooltip({ title, side, ...rest }: TooltipProps) {
  return (
    <ReactTooltip.Provider>
      <ReactTooltip.Root>
        <ReactTooltip.Trigger asChild>
          {rest.children}
        </ReactTooltip.Trigger>
        <ReactTooltip.Portal>
          <ReactTooltip.Content className="tl-tooltip-content" sideOffset={10} side={side} {...rest}>
            {title}
            <ReactTooltip.Arrow className="tl-tooltip-arrow" />
          </ReactTooltip.Content>
        </ReactTooltip.Portal>
      </ReactTooltip.Root>
    </ReactTooltip.Provider>
  )
}
