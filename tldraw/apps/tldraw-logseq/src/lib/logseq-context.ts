import React from 'react'

export interface SearchResult {
  pages?: string[]
  blocks?: { content: string; page: number; uuid: string }[]
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
    search: (
      query: string,
      filters: { 'pages?': boolean; 'blocks?': boolean; 'files?': boolean }
    ) => Promise<SearchResult>
    addNewBlock: (content: string) => string // returns the new block uuid
    queryBlockByUUID: (uuid: string) => any
    isWhiteboardPage: (pageName: string) => boolean
    saveAsset: (file: File) => Promise<string>
    makeAssetUrl: (relativeUrl: string) => string
    sidebarAddBlock: (uuid: string, type: 'block' | 'page') => void
    redirectToPage: (uuidOrPageName: string) => void
  }
}

export const LogseqContext = React.createContext<LogseqContextValue>({} as LogseqContextValue)
