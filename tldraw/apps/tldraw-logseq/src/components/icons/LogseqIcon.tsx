import * as React from 'react'

// @ts-expect-error don't bother fix it ...
import iconBase64 from './logseq-icon.png'

export function LogseqIcon() {
  return (
    <img
      style={{ borderRadius: '50%', width: '20px', height: '20px' }}
      src={'data:image/png;base64,' + iconBase64}
      alt="logseq"
    />
  )
}
