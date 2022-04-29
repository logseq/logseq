import React from 'react'
export const LogseqContext = React.createContext<
  Partial<{
    Page: React.FC<{ pageId: string }>
    search: (query: string) => string[]
  }>
>({})
