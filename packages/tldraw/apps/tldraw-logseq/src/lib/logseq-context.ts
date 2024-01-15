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
    Tweet: React.FC<{
      tweetId: string
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
    KeyboardShortcut: React.FC<{
      action: string
    }>
  }
  handlers: {
    t: (key: string) => any
    search: (
      query: string,
      filters: { 'pages?': boolean; 'blocks?': boolean; 'files?': boolean }
    ) => Promise<SearchResult>
    addNewWhiteboard: (pageName: string) => void
    exportToImage: (pageName: string, options: object) => void
    addNewBlock: (content: string) => string // returns the new block uuid
    queryBlockByUUID: (uuid: string) => any
    getBlockPageName: (uuid: string) => string
    getRedirectPageName: (uuidOrPageName: string) => string
    insertFirstPageBlock: (pageName: string) => string
    isWhiteboardPage: (pageName: string) => boolean
    isMobile: () => boolean
    saveAsset: (file: File) => Promise<string>
    makeAssetUrl: (relativeUrl: string | null) => string
    inflateAsset: (src: string) => object
    setCurrentPdf: (src: string | null) => void
    sidebarAddBlock: (uuid: string, type: 'block' | 'page') => void
    redirectToPage: (uuidOrPageName: string) => void
    copyToClipboard: (text: string, html: string) => void
  }
}

export const LogseqContext = React.createContext<LogseqContextValue>({} as LogseqContextValue)
