(* Left sidebar contents — mirrors components/left_sidebar.cljs DOM
   contract (docs/e2e-contract.md §3.2):

   #left-sidebar(.is-open|.is-closing)
     .left-sidebar-inner.as-container > .wrap
       .sidebar-header-container   (navigations group + .as-edit menu)
       .sidebar-contents-container (favorites, recents, toolbar)
     .shade-mask

   The wrapper .cp__sidebar-left-layout + is-open class lives in
   chrome.ml; this file owns everything inside it. *)

open Lui_elements
module D = Logseq_dom

let dom = D.dom
let t = Sidebar_state.t

let icon name = dom ~tag:"i" ~style_class:("ti ti-" ^ name) []

(* ---------- popup menu helpers ---------- *)

let backdrop st =
  dom ~key:"menu-backdrop"
    ~attrs:[ ("style", "position:fixed;inset:0;z-index:998") ]
    ~events:"click"
    ~on_dom_event:(fun name _ ->
      if name = "click" then Sidebar_state.close_menu st)
    []

let menu_box ~style children =
  dom ~key:"menu-box" ~tag:"div"
    ~style_class:"ui__dropdown-menu-content ui__dropdown-menu"
    ~attrs:[ ("role", "menu"); ("style", style) ]
    children

(* [role='menuitem'] > div text — contract uses `div:text('<label>')` *)
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

(* ---------- nav edit (checkbox) menu ---------- *)

let nav_labels =
  [ ("flashcards", "Flashcards")
  ; ("all-pages", "All pages")
  ; ("graph-view", "Graph view")
  ; ("tag/tasks", "Tasks")
  ; ("tag/assets", "Assets")
  ]

let nav_edit_menu st checked =
  (* [role] must sit on the element directly holding the label text —
     e2e queries `[role='menuitemcheckbox']:text-is('<label>')`. *)
  let mk (nav, label) =
    dom ~key:("cb-" ^ nav) ~tag:"div"
      ~style_class:"ui__dropdown-menu-item"
      ~events:"click"
      ~on_dom_event:(fun name _ ->
        if name = "click" then
          Sidebar_state.toggle_nav st nav (not (List.mem nav checked)))
      [ dom ~tag:"div"
          ~attrs_signal_v:
            (D.attrs_signal (Signal.value st.Sidebar_state.nav_checked)
               (fun cur ->
                 [ ("role", "menuitemcheckbox")
                 ; ("aria-checked", string_of_bool (List.mem nav cur))
                 ]))
          ~text:label [] ]
  in
  dom ~key:"nav-edit-menu"
    [ backdrop st
    ; menu_box ~style:"position:fixed;top:96px;left:16px;z-index:999;min-width:180px"
        (List.map mk nav_labels)
    ]

(* ---------- dots (page) menu ---------- *)

let dots_menu st favorited =
  let page_items =
    match !Runtime.current_page with
    | Some _ ->
        [ menu_item st
            (if favorited then t "Unfavorite page" else t "Add to Favorites")
            (fun () -> Sidebar_state.toggle_favorite st)
        ; menu_item st (t "Delete page")
            (fun () -> Sidebar_state.open_dialog "delete-page")
        ]
    | None -> []
  in
  dom ~key:"dots-menu"
    [ backdrop st
    ; menu_box
        ~style:"position:fixed;top:96px;right:16px;z-index:999;min-width:200px"
        (page_items
         @ [ menu_item st (t "Settings")
               (fun () -> Sidebar_state.open_dialog "settings")
           ; menu_item st (t "Export graph")
               (fun () -> Sidebar_state.open_dialog "export-graph")
           ; menu_item st (t "Import")
               (fun () -> Sidebar_state.open_dialog "import")
           ; menu_item st (t "Login")
               (fun () -> Sidebar_state.open_dialog "login")
           ])
    ]

let menu_host st =
  let menu_sig =
    Signal.map2
      (fun menu (checked, favorited) -> (menu, checked, favorited))
      (Signal.value st.Sidebar_state.open_menu)
      (Signal.map2
         (fun a b -> (a, b))
         (Signal.value st.nav_checked)
         (Signal.value st.favorited))
  in
  dyn ~equal:(fun a b -> a = b)
    (fun (menu, checked, favorited) ->
      match menu with
      | "nav-edit" -> nav_edit_menu st checked
      | "dots" -> dots_menu st favorited
      | _ -> dom ~key:"menu-closed" [])
    menu_sig

(* ---------- navigations ---------- *)

let nav_link ~key ~class_ ~title ~icon_name ~on_click =
  dom ~key ~style_class:class_
    [ dom ~tag:"a"
        ~style_class:"item group flex items-center text-sm rounded-md font-medium"
        ~events:"click" ~on_dom_event:on_click
        [ icon icon_name
        ; dom ~tag:"span" ~style_class:"flex-1" ~text:title [] ]
    ]

let nav_route ~class_ ~title ~icon_name hash =
  nav_link ~key:("nl-" ^ class_) ~class_ ~title ~icon_name
    ~on_click:(fun name _ ->
      if name = "click" then (
        Platform.set_location_hash hash;
        Platform.dispatch "ls:navigate" Js.Json.null))

let tag_nav class_ label titles =
  match List.assoc_opt class_ titles with
  | Some title ->
      Some
        (nav_link ~key:("tag-" ^ class_) ~class_:("tag-view-nav " ^ class_)
           ~title:(t label) ~icon_name:"hash"
           ~on_click:(fun name _ ->
             if name = "click" then Sidebar_state.navigate_to_page title))
  | None -> None

let nav_items (checked, tag_titles) =
  List.filter_map
    (fun nav ->
      match nav with
      | "flashcards" ->
          Some
            (nav_link ~key:"nl-flashcards" ~class_:"flashcards-nav"
               ~title:(t "Flashcards") ~icon_name:"cards"
               ~on_click:(fun name _ ->
                 if name = "click" then Sidebar_state.open_dialog "cards"))
      | "all-pages" ->
          Some
            (nav_route ~class_:"all-pages-nav" ~title:(t "Pages")
               ~icon_name:"files" "#/all-pages")
      | "graph-view" ->
          Some
            (nav_route ~class_:"graph-view-nav" ~title:(t "Graph view")
               ~icon_name:"hierarchy" "#/graph")
      | "tag/tasks" -> tag_nav "tasks" "Tasks" tag_titles
      | "tag/assets" -> tag_nav "assets" "Assets" tag_titles
      | _ -> None)
    checked

let nav_group st =
  let navs_sig =
    Signal.map2
      (fun a b -> (a, b))
      (Signal.value st.Sidebar_state.nav_checked)
      (Signal.value st.nav_tag_titles)
  in
  dom ~key:"nav-group"
    ~style_class:"sidebar-content-group navigations is-expand has-children"
    [ dom ~key:"nav-inner" ~style_class:"sidebar-content-group-inner"
        [ dom ~key:"nav-hd"
            ~style_class:"hd items-center non-collapsable enter-show-more"
            [ dom ~key:"nav-name" ~tag:"span" ~style_class:"a"
                [ dom ~tag:"a" ~style_class:"wrap-th"
                    [ dom ~tag:"strong" ~style_class:"flex-1"
                        ~text:(t "Navigations") [] ] ]
            ; dom ~key:"nav-more" ~tag:"span" ~style_class:"b"
                [ dom ~tag:"a"
                    ~style_class:
                      "as-edit !opacity-60 hover:!opacity-80 relative -top-0.5 -right-0.5"
                    ~attrs:[ ("title", t "Edit navigations") ]
                    ~events:"click"
                    ~on_dom_event:(fun name _ ->
                      if name = "click" then Sidebar_state.open_nav_menu st)
                    [ icon "filter-edit" ] ] ]
        ; dom ~key:"nav-bd" ~style_class:"bd"
            [ dom ~key:"navs"
                ~style_class:"sidebar-navigations flex flex-col mt-1"
                (nav_route ~class_:"journals-nav" ~title:(t "Journals")
                   ~icon_name:"calendar" "#/"
                :: [ dyn ~equal:(fun a b -> a = b)
                       (fun pair ->
                         dom ~key:"nav-dyn" ~style_class:"contents"
                           (nav_items pair))
                       navs_sig ])
            ]
        ]
    ]

(* ---------- favorites / recents ---------- *)

let page_item_el st (p : Model.page) ~li_class ~key =
  dom ~key ~tag:"li" ~style_class:li_class
    [ dom ~tag:"a" ~style_class:"link-item group"
        ~events:"click"
        ~on_dom_event:(fun name payload ->
          if name = "click" then (
            let shift =
              match payload with
              | Some pl -> (
                  try Sidebar_state.jbool "shiftKey" (Js.Json.parseExn pl)
                  with _ -> false)
              | None -> false
            in
            (* navigate by title: #/page/<uuid> hashes hit the
               Router.page_ref lookup-ref bug (see sidebar_state). *)
            if shift then
              match p.Model.page_uuid with
              | Some u -> Sidebar_state.open_uuid st u
              | None -> ()
            else
              Sidebar_state.navigate_to_page
                (match p.Model.page_title with
                 | "" -> Option.value p.Model.page_uuid ~default:""
                 | title -> title)))
        [ dom ~tag:"span" ~style_class:"page-icon" [ icon "file" ]
        ; dom ~tag:"span" ~style_class:"page-title" ~text:p.Model.page_title
            [] ]
    ]

let content_group st ~key ~class_ ~label ~items_sig ~li_class =
  dom ~key
    ~style_class_signal:
      (D.class_signal items_sig (fun ps ->
           "sidebar-content-group " ^ class_ ^ " is-expand"
           ^ if ps = [] then "" else " has-children"))
    [ dom ~key:(key ^ "-inner") ~style_class:"sidebar-content-group-inner"
        [ dom ~key:(key ^ "-hd") ~style_class:"hd items-center"
            [ dom ~key:(key ^ "-a") ~tag:"span" ~style_class:"a"
                [ dom ~tag:"a" ~style_class:"wrap-th"
                    [ dom ~tag:"strong" ~style_class:"flex-1" ~text:label
                        [] ] ]
            ; dom ~key:(key ^ "-b") ~tag:"span" ~style_class:"b"
                [ dom ~tag:"i" ~style_class:"ti ti-chevron-right more" [] ] ]
        ; dom ~key:(key ^ "-bd") ~style_class:"bd"
            [ dyn ~equal:(fun a b -> a = b)
                (fun ps ->
                  dom ~key:(key ^ "-ul") ~tag:"ul" ~style_class:"text-sm"
                    (List.map
                       (fun p ->
                         page_item_el st p ~li_class
                           ~key:
                             (key ^ "-"
                              ^ Option.value p.Model.page_uuid
                                  ~default:p.Model.page_title))
                       ps))
                items_sig ]
        ]
    ]

let favorites_group st =
  content_group st ~key:"fav" ~class_:"favorites" ~label:(t "Favorites")
    ~items_sig:(Signal.value st.Sidebar_state.favorites)
    ~li_class:"favorite-item font-medium"

let recents_group st =
  content_group st ~key:"recent" ~class_:"recent"
    ~label:(t "Recent")
    ~items_sig:(Signal.value st.Sidebar_state.recents)
    ~li_class:"recent-item select-none font-medium"

(* ---------- plugins / dots toolbar ---------- *)

let toolbar_row st =
  dom ~key:"sb-toolbar"
    ~style_class:"toolbar-plugins-manager flex items-center gap-1 px-2"
    [ dom ~key:"pm-trigger" ~tag:"a"
        ~style_class:"flex relative toolbar-plugins-manager-trigger"
        ~attrs:[ ("title", t "Plugins") ]
        ~events:"click"
        ~on_dom_event:(fun name _ ->
          if name = "click" then Sidebar_state.open_dialog "plugins")
        [ icon "apps" ]
    ; dom ~key:"dots-btn" ~tag:"button"
        ~style_class:"button sidebar-dots-btn"
        ~attrs:[ ("title", t "More") ]
        ~events:"click"
        ~on_dom_event:(fun name _ ->
          if name = "click" then Sidebar_state.open_dots_menu st)
        [ icon "dots" ]
    ]

(* ---------- root ---------- *)
(* chrome.ml owns the #left-sidebar.cp__sidebar-left-layout shell +
   shade-mask + resizer; these pieces fill its .wrap skeleton *)

(* cljs repo/graphs-selector: icon + graph display name + selector chevron *)
let graphs_selector (ms : Model.t Signal.signal) : t =
  dyn ~equal:(fun a b -> a = b)
    (fun (m : Model.t) ->
      let name =
        match m.repo with
        | Some r ->
            if String.length r > 10
               && String.sub r 0 10 = "logseq_db_"
            then String.sub r 10 (String.length r - 10)
            else r
        | None -> "Select a Graph"
      in
      dom ~key:"gsel" ~style_class:"sidebar-graphs"
        [ dom ~key:"gsel-box"
            ~style_class:"cp__graphs-selector flex items-center justify-between"
            [ dom ~key:"gsel-a" ~tag:"a"
                ~style_class:"item flex items-center gap-1 select-none"
                ~events:"click"
                ~on_dom_event:(fun n _ ->
                  if n = "click" then Sidebar_state.open_dialog "graphs")
                [ dom ~key:"gsel-th" ~tag:"span" ~style_class:"thumb"
                    [ icon "topology-star" ]
                ; dom ~key:"gsel-n" ~tag:"strong" ~text:name []
                ; icon "selector" ] ] ])
    ms

let header (ms : Model.t Signal.signal) : t =
  let st = Sidebar_state.ensure ms in
  dom ~key:"ls-header" ~style_class:"flex flex-col"
    [ graphs_selector ms; nav_group st ]

let contents (ms : Model.t Signal.signal) : t =
  let st = Sidebar_state.ensure ms in
  dom ~key:"ls-contents" ~style_class:"sidebar-contents-container"
    [ dom ~key:"ls-left" ~style_class:"cp__sidebar-left"
        [ favorites_group st; recents_group st; toolbar_row st ] ]

let menus (ms : Model.t Signal.signal) : t =
  let st = Sidebar_state.ensure ms in
  menu_host st
