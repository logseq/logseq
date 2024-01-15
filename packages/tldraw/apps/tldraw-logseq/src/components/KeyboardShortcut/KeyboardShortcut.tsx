import { LogseqContext } from '../../lib/logseq-context'
import * as React from 'react'

export const KeyboardShortcut = ({
  action,
  ...props
}: { action: string } & React.HTMLAttributes<HTMLElement>) => {
  const { renderers } = React.useContext(LogseqContext)
  const Shortcut = renderers?.KeyboardShortcut

  return (
    <div className="tl-menu-right-slot" {...props}>
      <Shortcut action={action} />
    </div>
  )
}
