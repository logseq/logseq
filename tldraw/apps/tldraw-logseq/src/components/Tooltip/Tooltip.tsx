import * as ReactTooltip from '@radix-ui/react-tooltip';
import type { Side } from '@radix-ui/react-popper'
export interface TooltipProps extends ReactTooltip.TooltipContentProps {
  children: React.ReactNode
  side?: Side
  sideOffset?: number
}

export function Tooltip({ title, side, sideOffset = 10, ...rest }: TooltipProps) {
  return (
    <ReactTooltip.Provider delayDuration={300}>
      <ReactTooltip.Root>
        <ReactTooltip.Trigger asChild>
          {rest.children}
        </ReactTooltip.Trigger>
        <ReactTooltip.Portal>
          <ReactTooltip.Content className="tl-tooltip-content" sideOffset={sideOffset} side={side} {...rest}>
            {title}
            <ReactTooltip.Arrow className="tl-tooltip-arrow" />
          </ReactTooltip.Content>
        </ReactTooltip.Portal>
      </ReactTooltip.Root>
    </ReactTooltip.Provider>
  )
}
