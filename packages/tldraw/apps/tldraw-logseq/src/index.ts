export * from './app'
export * from './lib/preview-manager'

declare global {
  interface Window {
    logseq?: {
      api?: {
        make_asset_url?: (url: string) => string
        get_page_blocks_tree?: (pageName: string) => any[]
        edit_block?: (uuid: string) => void
        set_blocks_id?: (uuids: string[]) => void
        open_external_link?: (url: string) => void
        get_selected_blocks?: () => { uuid: string }[]
        get_state_from_store?: (path: string) => any
      }
    }
  }
}
