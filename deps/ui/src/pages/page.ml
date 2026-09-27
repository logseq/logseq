(* Page view — mirrors components/page.cljs essentials:

   .page
     div.ls-page-title.title [id for data-testid] > .block-title-wrap
     div.ls-page-blocks > .page-blocks-inner > .ls-block*
*)

open Lui_elements

let page_title_el (page : Model.page) : t =
  (* e2e selects [data-testid='page title'] -> mapped to #page-title *)
  Logseq_dom.dom ~key:"page-title" ~id:"page-title"
    ~style_class:"ls-page-title flex flex-1 w-full content items-start title"
    ~attrs:[ ("data-testid", "page title") ]
    [ box ~key:"pt-inner" ~style_class:"w-full relative"
        [ Logseq_dom.dom ~key:"pt-title" ~style_class:"block-title-wrap"
            ~attrs:
              [ ("id", "page-title-text")
              ]
            ~text:page.page_title []
        ]
    ]

let page_view (page : Model.page) : t =
  box ~key:"page" ~style_class:"page"
    [ page_title_el page
    ; Logseq_dom.dom ~key:"page-blocks" ~style_class:"ls-page-blocks"
        [ Logseq_dom.dom ~key:"page-blocks-inner"
            ~style_class:"page-blocks-inner relative"
            (List.map Tree.block_row page.page_blocks)
        ]
    ]

let empty_state () : t =
  box ~key:"empty" ~style_class:"page"
    [ box ~key:"empty-inner" ~style_class:"flex flex-col items-center"
        [ text ~key:"empty-t" ~value:"Loading..." ~style_class:"" [] ]
    ]

let page_view_of_model (m : Model.t) : t =
  match (m.phase, m.route_page) with
  | Model.Ready, Some page -> page_view page
  | _ -> empty_state ()
