import type { TLReactCallbacks } from '@tldraw/react'
import * as React from 'react'
import { LogseqContext } from '../lib/logseq-context'

export function useCopy() {
  const { handlers } = React.useContext(LogseqContext)

  return React.useCallback<TLReactCallbacks['onCopy']>((app, { text, html }) => {
    handlers.copyToClipboard(text, html)
  }, [])
}
