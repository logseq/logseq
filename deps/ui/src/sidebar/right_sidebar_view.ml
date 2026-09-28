(* Right sidebar contents — mirrors components/right_sidebar.cljs DOM
   contract (docs/e2e-contract.md §3.3):

   button.toggle-right-sidebar  (floating; header is chrome.ml's — kept
     inside this region so the class stays clickable while closed)
   .cp__right-sidebar.open      (wrapper in chrome.ml; only renders
     .cp__right-sidebar-inner when open)
     .resizer
     .cp__right-sidebar-inner#right-sidebar-container
       .cp__right-sidebar-scrollable
         .cp__right-sidebar-topbar > .cp__right-sidebar-settings
         .sidebar-item-list > .sidebar-item.item-type-<kind>*)

open Lui_elements
module D = Logseq_dom

let dom = D.dom
let t = Sidebar_state.t

(* The header is shared chrome.ml; the toggle lives in this region as a
   floating control pinned to the top-right viewport corner. *)
let toggle_button =
  dom ~key:"rs-toggle" ~tag:"button"
    ~style_class:"button cp__header-btn toggle-right-sidebar"
    ~attrs:
      [ ("title", t "Toggle right sidebar")
      (* floats below the header — chrome.ml owns the header buttons *)
      ; ("style", "position:fixed;top:64px;right:6px;z-index:1500") ]
    ~events:"click"
    ~on_dom_event:(fun name _ ->
      if name = "click" then Runtime.send Action.Toggle_right_sidebar)
    [ dom ~tag:"i" ~style_class:"ti ti-layout-sidebar-right" [] ]

(* ---------- topbar ---------- *)

let topbar_btn key label on_click =
  dom ~key:("tb-" ^ key) ~style_class:"text-sm"
    [ dom ~tag:"button"
        ~style_class:"button cp__right-sidebar-settings-btn"
        ~events:"click" ~on_dom_event:on_click
        ~text:label [] ]

let topbar st =
  dom ~key:"rs-topbar"
    ~style_class:
      "cp__right-sidebar-topbar flex flex-row justify-between items-center"
    [ dom ~key:"rs-settings"
        ~style_class:"cp__right-sidebar-settings hide-scrollbar gap-1"
        [ topbar_btn "contents" (t "Contents") (fun n _ ->
              if n = "click" then
                Sidebar_state.open_sticky_item st "contents")
        ; topbar_btn "page-graph" (t "Page graph") (fun n _ ->
              if n = "click" then
                Sidebar_state.open_sticky_item st "page-graph")
        ; topbar_btn "help" (t "Help") (fun n _ ->
              if n = "click" then Sidebar_state.open_sticky_item st "help")
        ]
    ]

(* ---------- item menus ---------- *)

let menu_item st label on_click =
  dom ~key:("mi-" ^ label) ~tag:"div"
    ~attrs:[ ("role", "menuitem") ]
    ~style_class:"ui__dropdown-menu-item"
    ~events:"click"
    ~on_dom_event:(fun name _ ->
      if name = "click" then (
        Sidebar_state.close_menu st;
        on_click ()))
    [ dom ~tag:"div" ~text:label [] ]

let item_menu st (it : Sidebar_state.item) =
  dom ~key:("imenu-" ^ it.key) ~tag:"div"
    ~attrs:
      [ ("role", "menu")
      ; ( "style"
        , "position:fixed;top:96px;right:16px;z-index:1501;min-width:160px"
        ) ]
    ~style_class:"ui__dropdown-menu-content ui__dropdown-menu"
    (menu_item st (t "Close")
       (fun () -> Sidebar_state.remove_item st it.key)
     :: (match it.Sidebar_state.page_ref with
         | Some _ ->
             [ menu_item st (t "Open as page")
                 (fun () -> Sidebar_state.open_as_page st it) ]
         | None -> []))

let item_menu_host st (it : Sidebar_state.item) =
  dyn ~equal:(fun a b -> a = b)
    (fun menu ->
      if menu = "item-" ^ it.Sidebar_state.key then item_menu st it
      else dom ~key:("imenu-none-" ^ it.key) [])
    (Signal.value st.Sidebar_state.open_menu)

(* ---------- item header / breadcrumb ---------- *)

let breadcrumb crumbs =
  let rec loop acc = function
    | [] -> List.rev acc
    | c :: rest ->
        loop
          (dom ~key:("bc-" ^ c) ~tag:"span"
             ~style_class:"breadcrumb-item" ~text:c []
           :: dom ~key:("bcsep-" ^ c) ~tag:"span"
                ~style_class:"opacity-50 px-1" ~text:"/" []
           :: acc)
          rest
  in
  match crumbs with
  | [] -> dom ~key:"bc-empty" []
  | first :: rest ->
      dom ~key:"bc" ~style_class:"breadcrumb"
        (dom ~key:("bc-" ^ first) ~tag:"span"
           ~style_class:"breadcrumb-item" ~text:first []
         :: List.rev (loop [] rest))

let item_title (it : Sidebar_state.item) =
  match it.breadcrumb, it.kind with
  | [], "page" ->
      dom ~key:"pt" ~style_class:"flex items-center page-title gap-1"
        [ dom ~tag:"span"
            ~style_class:"overflow-hidden text-ellipsis"
            ~text:it.title [] ]
  | [], _ -> dom ~key:"pt-plain" ~style_class:"flex items-center" ~text:it.title []
  | crumbs, _ -> breadcrumb crumbs

let item_header st idx (it : Sidebar_state.item) =
  let n = string_of_int idx in
  dom ~key:("hd-" ^ it.key)
    ~style_class:
      "flex flex-row justify-between sidebar-item-header color-level rounded-t-md"
    [ dom ~key:("hdr-" ^ it.key) ~tag:"button"
        ~style_class:"flex flex-row px-2 items-center w-full overflow-hidden"
        ~attrs:
          [ ("aria-expanded", "true")
          ; ("id", "sidebar-panel-header-" ^ n)
          ; ("aria-controls", "sidebar-panel-content-" ^ n)
          ]
        [ dom ~key:("arrow-" ^ it.key) ~tag:"span"
            ~style_class:"opacity-50 hover:opacity-100 flex items-center pr-1"
            [ dom ~tag:"i" ~style_class:"ti ti-chevron-down" [] ]
        ; dom ~key:("ht-" ^ it.key)
            ~style_class:
              "ml-1 font-medium text-sm overflow-hidden whitespace-nowrap"
            [ item_title it ] ]
    ; dom ~key:("ia-" ^ it.key)
        ~style_class:"item-actions flex items-center"
        [ dom ~key:("more-" ^ it.key) ~tag:"button"
            ~style_class:"px-2 py-2 h-8 w-8 text-muted-foreground"
            ~attrs:[ ("data-testid", "sidebar-item-more") ]
            ~events:"click"
            ~on_dom_event:(fun name _ ->
              if name = "click" then Sidebar_state.open_item_menu st it.key)
            [ dom ~tag:"i" ~style_class:"ti ti-dots" [] ]
        ; dom ~key:("close-" ^ it.key) ~tag:"button"
            ~style_class:"px-2 py-2 h-8 w-8 text-muted-foreground"
            ~attrs:[ ("title", t "Close") ]
            ~events:"click"
            ~on_dom_event:(fun name _ ->
              if name = "click" then Sidebar_state.remove_item st it.key)
            [ dom ~tag:"i" ~style_class:"ti ti-x" [] ] ]
    ]

let item_body idx (it : Sidebar_state.item) =
  let n = string_of_int idx in
  dom ~key:("body-" ^ it.key)
    ~attrs:
      [ ("role", "region")
      ; ("id", "sidebar-panel-content-" ^ n)
      ; ("aria-labelledby", "sidebar-panel-header-" ^ n)
      ]
    ~style_class:"sidebar-panel-content px-2 initial"
    [ dom ~key:("page-" ^ it.key) ~style_class:"page"
        [ dom ~key:("pbi-" ^ it.key) ~style_class:"ls-page-blocks"
            [ dom ~key:("pbin-" ^ it.key)
                ~style_class:"page-blocks-inner relative"
                (List.map Tree.block_row it.blocks) ] ] ]

let sidebar_item st idx (it : Sidebar_state.item) =
  dom ~key:("item-" ^ it.key)
    ~style_class:
      ("flex sidebar-item content color-level rounded-md shadow-lg item-type-"
       ^ it.kind)
    [ dom ~key:("wrap-" ^ it.key)
        ~style_class:"flex flex-col w-full relative"
        [ item_header st idx it
        ; item_body idx it
        ; item_menu_host st it ]
    ]

(* ---------- inner ---------- *)

let inner st =
  dom ~key:"rs-inner" ~id:"right-sidebar-container"
    ~style_class:"cp__right-sidebar-inner flex flex-col h-full"
    [ dom ~key:"rs-scroll" ~style_class:"cp__right-sidebar-scrollable"
        [ topbar st
        ; dyn ~equal:(fun a b -> a = b)
            (fun items ->
              dom ~key:"rs-items"
                ~style_class:"sidebar-item-list flex-1 scrollbar-spacing px-2"
                (List.mapi (sidebar_item st) items))
            (Signal.value st.Sidebar_state.items)
        ]
    ]

let render (ms : Model.t Signal.signal) : t =
  let st = Sidebar_state.ensure ms in
  dom ~key:"rs-root"
    [ toggle_button
    ; dom ~key:"rs-resizer" ~style_class:"resizer" []
    ; if_
        ~test:
          (Signal.map
             (fun (m : Model.t) -> m.Model.right_sidebar_open)
             ms)
        (inner st)
    ]
