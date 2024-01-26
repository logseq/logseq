import type { Side } from '@radix-ui/react-popper'

// @ts-ignore
const LSUI = window.LSUI

export interface TooltipProps {
  children: React.ReactNode
  side?: Side
  sideOffset?: number
  content?: React.ReactNode
}

export function Tooltip({ side, content, sideOffset = 10, ...rest }: TooltipProps) {
  return content ? (
    <LSUI.TooltipProvider delayDuration={300}>
      <LSUI.Tooltip>
        <LSUI.TooltipTrigger asChild>{rest.children}</LSUI.TooltipTrigger>
          <LSUI.TooltipContent
            sideOffset={sideOffset}
            side={side}
            {...rest}
          >
            {content}
            <LSUI.TooltipArrow className="popper-arrow" />
          </LSUI.TooltipContent>
      </LSUI.Tooltip>
    </LSUI.TooltipProvider>
  ) : (
    <>{rest.children}</>
  )
}
