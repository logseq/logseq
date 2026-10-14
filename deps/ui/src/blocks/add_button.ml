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
   constant for snapshot-backed lists, derived signals for live ones.

   On an empty page this row is the only bullet. The web fades it to
   50% and relies on :hover { opacity: 1 }, which this host does not
   apply. Compounded with the dot's own 0.8 that resting pixel is
   about #e9e9e9 — the bullet the empty journal actually shows. Keep
   the row hidden once real blocks exist, and paint the empty-page
   dot at full opacity in the same gray as a block bullet. *)
let el ?puuid ~(flags : 'a -> (bool * bool) Signal.signal) : t =
 fun context parent ->
  if Ui_services.env_publishing () then Logseq_el.nothing context parent
  else
    let fs = flags context in
    (* the doc-level click/Enter listener matches closest
       ".block-add-button" and reads data-parentblockid *)
    (Ui_parts.class_signal fs
       (fun (_has, indented) ->
         "ls-block block-add-button flex-1 flex-col rounded-sm cursor-text transition-opacity ease-in duration-100 !py-0 "
         ^ (if indented then " ls-block-content-indent" else ""))
       (column ~key:"bab"
          ~data_attrs:
            (("tabindex", "0")
             :: (match puuid with
                 | Some u -> [ ("data-parentblockid", u) ]
                 | None -> []))
          ~opacity:
            (reactive
               (fun (has, _) -> if has then 0. else 1.) fs)
          [ row ~key:"bab-row"
              [ (* margin-left follows .ls-block-content-indent on the
                   outer column: 22px flat, 6px indented — bound to the
                   same flags signal as the class toggle *)
                Ui_parts.int_prop_signal Lui_protocol.MarginLeft fs
                  (fun (_has, indented) -> if indented then 6 else 22)
                  (row ~key:"bab-inner" ~cross:`center ~height:28 ~grow:1.
                     ~style_class:"bab-inner"
                     [ (* same bullet metrics as the block gutter dot in
                          blocks/tree.ml — style_class alone carries no
                          size on style-less backends *)
                        box ~key:"bab-bc" ~style_class:"bullet-container"
                          ~main:`center ~cross:`center ~width:16 ~height:16
                          ~corner_radius:8
                          [ box ~key:"bab-b" ~style_class:"bullet"
                              ~transition:"transform 0.2s" ~width:6 ~height:6
                              ~corner_radius:999 ~opacity:1.
                              ~background:
                                "var(--lx-gray-09, var(--ls-block-bullet-color))"
                              [] ] ]) ] ]))
      context parent
