import React from 'react'
export const LogseqContext = React.createContext<
  Partial<{
    renderers: {
      Page: React.FC<{
        pageName: string
      }>
      Breadcrumb: React.FC<{
        blockId: string
      }>
    }
    search: (query: string) => string[]
  }>
>({})
