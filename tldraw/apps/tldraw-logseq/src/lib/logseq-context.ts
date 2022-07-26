import React from 'react'
export const LogseqContext = React.createContext<
  Partial<{
    renderers: {
      Page: React.FC<{
        pageName: string
      }>
      Block: React.FC<{
        blockId: string
      }>
      Breadcrumb: React.FC<{
        blockId: string
      }>
      PageNameLink: React.FC<{
        pageName: string
      }>
    }
    search: (query: string) => string[]
  }>
>({})
