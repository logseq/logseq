import React from 'react'

export interface SearchResult {
  pages: string[]
  blocks: { content: string; page: number; uuid: string }[]
  'has-more?': boolean
  files?: string[]
}

export interface LogseqContextValue {
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
  handlers: {
    search: (query: string) => Promise<SearchResult>
    addNewBlock: (content: string) => string // returns the new block uuid
  }
}

export const LogseqContext = React.createContext<Partial<LogseqContextValue>>({})
