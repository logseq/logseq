export type EntityID = number
export type BlockUUID = string
export type BlockUUIDTuple = ['uuid', BlockUUID]
export type IEntityID = { id: EntityID; [key: string]: any }

/** Block - Logseq's fundamental data structure. */
export interface BlockEntity {
  id: EntityID
  uuid: BlockUUID
  order: string
  format: 'markdown' | 'org'
  parent: IEntityID
  title: string
  fullTitle: string
  /** @deprecated Use title instead. */
  content?: string
  page: IEntityID
  createdAt: number
  updatedAt: number
  ident?: string
  properties?: Record<string, any>
  'collapsed?': boolean
  anchor?: string
  body?: any
  children?: Array<BlockEntity | BlockUUIDTuple>
  container?: string
  file?: IEntityID
  level?: number
  meta?: { timestamps: any; properties: any; startPos: number; endPos: number }
  marker?: string
  [key: string]: unknown
}

/** Page is a block with page-specific properties. */
export interface PageEntity {
  id: EntityID
  uuid: BlockUUID
  name: string
  format: 'markdown' | 'org'
  type: 'page' | 'journal' | 'whiteboard' | 'class' | 'property' | 'hidden'
  updatedAt: number
  createdAt: number
  'journal?': boolean
  title?: string
  file?: IEntityID
  originalName?: string
  namespace?: IEntityID
  children?: Array<PageEntity>
  properties?: Record<string, any>
  journalDay?: number
  ident?: string
  [key: string]: unknown
}
