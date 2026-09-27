(* Block tree rendering — mirrors components/block.cljs outline structure:

   .ls-block [id=ls-block-<uuid> blockid data-block-title haschild level]
     .block-main-container
       .block-content-or-editor-wrap
         .block-content-or-editor-inner
           .block-row
             .block-content-wrapper
               .block-content
                 span.block-title-wrap
     .block-children-container
       .block-children-left-border
       .block-children
         .ls-block*
*)

open Lui_elements

let dom = Logseq_dom.dom

let block_key (b : Model.block) =
  match b.block_uuid with
  | Some u -> u
  | None -> "block-" ^ string_of_int (Option.value b.block_db_id ~default:0)

let block_content (b : Model.block) : t =
  box ~key:("content-" ^ block_key b) ~style_class:"block-content inline"
    ~grow:1.0
    [ dom ~key:("wrap-" ^ block_key b) ~style_class:"block-title-wrap"
        ~text:b.block_title []
    ]

let rec block_children (b : Model.block) : t =
  dom ~key:("children-" ^ block_key b)
    ~style_class:"block-children-container flex"
    [ dom ~key:("border-" ^ block_key b)
        ~style_class:"block-children-left-border" []
    ; dom ~key:("clist-" ^ block_key b)
        ~style_class:"block-children w-full"
        (List.map block_row b.block_children)
    ]

and block_row (b : Model.block) : t =
  let uuid = Option.value b.block_uuid ~default:"" in
  let key = block_key b in
  let has_children = b.block_children <> [] in
  let attrs =
    [ ("id", "ls-block-" ^ uuid)
    ; ("blockid", uuid)
    ; ("data-block-title", b.block_title)
    ; ("data-block-format", "markdown")
    ; ("haschild", string_of_bool has_children)
    ; ("data-collapsed", "false")
    ]
    @ (match b.block_level with
       | n when n > 0 -> [ ("level", string_of_int n) ]
       | _ -> [])
  in
  let cls =
    "ls-block swipe-item"
    ^ if String.trim b.block_title = "" then " is-blank" else ""
  in
  dom ~key:("ls-" ^ key) ~style_class:cls ~attrs
    [ dom ~key:("main-" ^ key) ~style_class:"block-main-container flex flex-row gap-1"
        [ dom ~key:("cew-" ^ key)
            ~style_class:"block-content-or-editor-wrap flex flex-1"
            [ dom ~key:("cei-" ^ key)
                ~style_class:"block-content-or-editor-inner"
                [ dom ~key:("row-" ^ key) ~style_class:"block-row flex flex-1 flex-row gap-1 items-center"
                    [ dom ~key:("cw-" ^ key)
                        ~style_class:"block-content-wrapper flex flex-1 w-full"
                        [ block_content b ]
                    ]
                ]
            ]
        ]
    ; (if has_children then block_children b else box ~key:("nc-" ^ key) [])
    ]
