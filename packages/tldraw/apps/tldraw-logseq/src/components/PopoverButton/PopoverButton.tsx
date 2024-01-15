import * as Popover from '@radix-ui/react-popover'
import type { Side, Align } from '@radix-ui/react-popper'
import { BoundsUtils } from '@tldraw/core'
import { useApp } from '@tldraw/react'
import { observer } from 'mobx-react-lite'
import * as React from 'react'

interface PopoverButton extends React.HTMLAttributes<HTMLButtonElement> {
  side: Side // default side
  align?: Align
  alignOffset?: number
  label: React.ReactNode
  children: React.ReactNode
  border?: boolean
  arrow?: boolean
}

export const PopoverButton = observer(
  ({ side, align, alignOffset, label, arrow, children, border, ...rest }: PopoverButton) => {
    const contentRef = React.useRef<HTMLDivElement>(null)

    const [isOpen, setIsOpen] = React.useState(false)

    const {
      viewport: {
        bounds,
        camera: { point, zoom },
      },
    } = useApp()

    const [tick, setTick] = React.useState<number>(0)

    // Change side if popover is out of bounds
    React.useEffect(() => {
      if (!contentRef.current || !isOpen) return

      const boundingRect = contentRef.current.getBoundingClientRect()
      const outOfView = !BoundsUtils.boundsContain(bounds, {
        minX: boundingRect.x,
        minY: boundingRect.y,
        maxX: boundingRect.right,
        maxY: boundingRect.bottom,
        width: boundingRect.width,
        height: boundingRect.height,
      })

      if (outOfView) {
        setTick(tick => tick + 1)
      }
    }, [point[0], point[1], zoom, isOpen])

    return (
      <Popover.Root onOpenChange={o => setIsOpen(o)}>
        <Popover.Trigger
          {...rest}
          data-border={border}
          className="tl-button tl-popover-trigger-button"
        >
          {label}
        </Popover.Trigger>

        <Popover.Content
          // it seems like the Popover.Content component doesn't update collision when camera changes
          key={'popover-content-' + tick}
          ref={contentRef}
          className="tl-popover-content"
          align={align}
          alignOffset={alignOffset}
          side={side}
          sideOffset={15}
          collisionBoundary={document.querySelector('.logseq-tldraw')}
        >
          {children}
          {arrow && <Popover.Arrow className="tl-popover-arrow" />}
        </Popover.Content>
      </Popover.Root>
    )
  }
)
