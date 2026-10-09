(* Page-level .block-add-button — the trailing "click to add block" row
   (cljs components/page.cljs add-button-inner), emitted declaratively as
   the last child of every .page-blocks-inner region (page routes, block
   routes, journal items, sidebar items, previews, quick-add). Clicks
   reach Editor_actions.append_block via Editor_keys' document-level
   listeners matching closest ".block-add-button" and reading
   data-parentblockid. *)

open Lui_elements

(* cljs page.cljs opacity-class: on desktop opacity-0 only when the
   owner entity has children (visible-uuids / the route block's
   children), opacity-50 otherwise; the row carries
   .ls-block-content-indent when the owner is a block (block routes and
   sidebar block items). Callers supply both flags per region —
   constant for snapshot-backed lists, derived signals for live ones. *)
let el ?puuid ~(flags : 'a -> (bool * bool) Signal.signal) : t =
 fun context parent ->
  if Ui_services.env_publishing () then Logseq_el.nothing context parent
  else
    let fs = flags context in
    (* the doc-level click/Enter listener matches closest
       ".block-add-button" and reads data-parentblockid *)
    (Ui_parts.class_signal fs
       (fun (has, indented) ->
         "ls-block block-add-button flex-1 flex-col rounded-sm cursor-text transition-opacity ease-in duration-100 !py-0 "
         ^ (if has then "opacity-0" else "opacity-50")
         ^ (if indented then " ls-block-content-indent" else ""))
       (column ~key:"bab"
          ~data_attrs:
            (("tabindex", "0")
             :: (match puuid with
                 | Some u -> [ ("data-parentblockid", u) ]
                 | None -> []))
          [ row ~key:"bab-row"
              [ (* margin-left lives in lui-core.css (.bab-inner): 22px
                   on page routes, 6px under .ls-block-content-indent *)
                row ~key:"bab-inner" ~cross:`center ~height:28
                  ~style_class:"bab-inner"
                  [ box ~key:"bab-bc" ~style_class:"bullet-container"
                      [ box ~key:"bab-b" ~style_class:"bullet" [] ]
                  ] ] ]))
      context parent
