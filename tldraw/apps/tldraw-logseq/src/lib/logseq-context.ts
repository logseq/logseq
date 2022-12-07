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
      levelLimit?: number
      endSeparator?: boolean
    }>
    PageName: React.FC<{
      pageName: string
    }>
    BlockReference: React.FC<{
      blockId: string
    }>
    BacklinksCount: React.FC<{
      id: string
      className?: string
      options?: {
        'portal?'?: boolean
        'hover?'?: boolean
        renderFn?: (open?: boolean, count?: number) => React.ReactNode
      }
    }>
  }
  handlers: {
    search: (
      query: string,
      filters: { 'pages?': boolean; 'blocks?': boolean; 'files?': boolean }
    ) => Promise<SearchResult>
    addNewWhiteboard: (pageName: string) => void
    addNewBlock: (content: string) => string // returns the new block uuid
    queryBlockByUUID: (uuid: string) => any
    getBlockPageName: (uuid: string) => string
    isWhiteboardPage: (pageName: string) => boolean
    saveAsset: (file: File) => Promise<string>
    makeAssetUrl: (relativeUrl: string) => string
    sidebarAddBlock: (uuid: string, type: 'block' | 'page') => void
    redirectToPage: (uuidOrPageName: string) => void
  }
}

export const LogseqContext = React.createContext<LogseqContextValue>({} as LogseqContextValue)
