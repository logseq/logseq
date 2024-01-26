import type { Side, Align } from '@radix-ui/react-popper'

// @ts-ignore
const LSUI = window.LSUI

interface PopoverButton extends React.HTMLAttributes<HTMLButtonElement> {
  side: Side // default side
  align?: Align
  alignOffset?: number
  label: React.ReactNode
  children: React.ReactNode
  border?: boolean
}

export function PopoverButton({ side, align, alignOffset, label, children, border, ...rest }: PopoverButton) {
  return (
    <LSUI.Popover>
      <LSUI.PopoverTrigger
        {...rest}
        data-border={border}
        className="tl-button tl-popover-trigger-button"
      >
        {label}
      </LSUI.PopoverTrigger>

      <LSUI.PopoverContent
        className="w-auto p-1"
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={15}
        collisionBoundary={document.querySelector('.logseq-tldraw')}
      >
        {children}
        <LSUI.PopoverArrow className="popper-arrow" />
      </LSUI.PopoverContent>
    </LSUI.Popover>
  )
}
