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

let icon name = Icons.icon ~size:16. name

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

(* ---------- plugins dropdown (toolbar-plugins-manager) ---------- *)

let plugins_menu st =
  let owner =
    st.Sidebar_state.open_menu.Signal.state_signal.Signal.owner
  in
  let extra_item key label icn f =
    dom ~key:("pm-x-" ^ key) ~style_class:"ui__dropdown-menu-item extra-item"
      ~events:"click"
      ~on_dom_event:(fun n _ ->
        if n = "click" then (
          Sidebar_state.close_menu st;
          f ()))
      [ dom ~tag:"span" ~style_class:"flex items-center gap-1"
          [ icon icn; dom ~tag:"div" ~text:label [] ] ]
  in
  let pinned = Plugin_host.pinned () in
  let item_row (it : Plugin_host.ui_item) =
    let key = Plugin_host.jstr it.it_opts "key" in
    let pkey = it.it_pid ^ ":" ^ key in
    dom ~key:("pm-i-" ^ pkey) ~style_class:"ui__dropdown-menu-item"
      ~events:"click"
      ~on_dom_event:(fun n _ ->
        if n = "click" then Plugin_host.toggle_pinned pkey)
      [ dom ~style_class:"flex items-center item-wrap"
          [ dom ~key:("slot-" ^ pkey) ~id:(Plugin_host.slot_id it)
              ~style_class:"pl-injected-ui-item-toolbar"
              ~attrs:[ ("title", key) ] []
          ; dom ~key:("lbl-" ^ pkey) ~tag:"span"
              ~attrs:[ ("style", "padding-left:2px") ]
              ~text:key []
          ; dom ~key:("pin-" ^ pkey) ~tag:"span"
              ~style_class:
                ("pin flex items-center opacity-60"
                 ^ if List.mem pkey pinned then " pinned" else "")
              [ icon (if List.mem pkey pinned then "pinned" else "pin") ]
          ]
      ]
  in
  dom ~key:"plugins-menu"
    [ backdrop st
    ; dom ~key:"menu-box" ~tag:"div"
        ~style_class:
          "ui__dropdown-menu-content ui__dropdown-menu \
           toolbar-plugins-manager-content"
        ~attrs:
          [ ("role", "menu")
          ; ( "style"
            , "position:fixed;top:64px;right:16px;z-index:999;min-width:200px" )
          ]
        (dyn ~equal:Stdlib.( = )
           (fun _dirty ->
             dom ~key:"pm-body" ~tag:"div"
               (List.map item_row (Plugin_host.toolbar_items ())))
           (Plugin_host.dirty_value owner)
        :: [ extra_item "plugins" (t "Plugins") "apps"
               (fun () -> Dialogs_state.open_ "plugins")
           ; extra_item "themes" (t "Themes") "palette"
               (fun () -> Dialogs_state.open_ "plugins")
           ; extra_item "settings" (t "Settings") "adjustments"
               (fun () -> Sidebar_state.open_dialog "settings")
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
    (fun (menu, checked, _favorited) ->
      match menu with
      | "nav-edit" -> nav_edit_menu st checked
      | "plugins" -> plugins_menu st
      | _ -> dom ~key:"menu-closed" [])
    menu_sig

(* ---------- navigations ---------- *)

(* cljs shui/shortcut separate-keys: space-separated bindings render one
   kbd per key inside .shui-shortcut-separate *)
let shortcut_hint binding =
  let keys = String.split_on_char ' ' binding in
  dom ~key:("sc-" ^ binding) ~tag:"span"
    ~style_class:"ml-1 mr-2 flex items-center"
    [ dom ~key:"wrap" ~tag:"span" ~style_class:"keyboard-shortcut"
        [ dom ~key:"inlf" ~tag:"span"
            ~attrs:
              [ ( "style"
                , "display: inline-flex; align-items: center; \
                   white-space: nowrap;" ) ]
            [ dom ~key:"sep"
                ~style_class:"shui-shortcut-separate shui-shortcut-glow"
            ~attrs:
              [ ("data-shortcut-binding", binding)
              ; ("aria-hidden", "true")
              ; ("style", "white-space: nowrap; gap: 4px") ]
            (List.map
               (fun k ->
                 dom ~tag:"kbd" ~style_class:"shui-shortcut-key"
                   ~attrs:[ ("aria-hidden", "false") ]
                   ~text:(String.uppercase_ascii k) [])
               keys) ] ] ]

(* cljs sidebar-item: wrapper div gets the nav class (+ `active`), the
   inner `a.item` also gets `active` when the route matches *)
let nav_link ~key ~class_ ~active ~title ~icon_name ?shortcut ~on_click () =
  let act = if active then " active" else "" in
  let tail = match shortcut with Some s -> [ shortcut_hint s ] | None -> [] in
  dom ~key ~style_class:(class_ ^ act)
    [ dom ~tag:"a"
        ~style_class:
          ("item group flex items-center text-sm rounded-md font-medium" ^ act)
        ~events:"click" ~on_dom_event:on_click
        ([ icon icon_name
         ; dom ~tag:"span" ~style_class:"flex-1" ~text:title [] ]
        @ tail)
    ]

let nav_route ~class_ ~active ~title ~icon_name ?shortcut hash =
  nav_link ~key:("nl-" ^ class_) ~class_ ~active ~title ~icon_name ?shortcut
    ~on_click:(fun name _ ->
      if name = "click" then (
        Platform.set_location_hash (Runtime.nav_hash hash);
        Platform.dispatch "ls:navigate" Js.Json.null))
    ()

let tag_nav ~active_route class_ label titles =
  match List.assoc_opt class_ titles with
  | Some title ->
      Some
        (nav_link ~key:("tag-" ^ class_) ~class_:("tag-view-nav " ^ class_)
           ~active:(active_route = Model.Page title)
           ~title:(t label) ~icon_name:"hash"
           ~on_click:(fun name _ ->
             if name = "click" then Sidebar_state.navigate_to_page title)
           ())
  | None -> None

(* active nav per route — cljs sidebar-navigations-loaded *)
let nav_items ~active_route (checked, tag_titles) =
  List.filter_map
    (fun nav ->
      match nav with
      | "flashcards" ->
          Some
            (nav_link ~key:"nl-flashcards" ~class_:"flashcards-nav"
               ~active:false ~title:(t "Flashcards") ~icon_name:"cards"
               ~shortcut:"g f"
               ~on_click:(fun name _ ->
                 if name = "click" then Sidebar_state.open_dialog "cards")
               ())
      | "all-pages" ->
          Some
            (nav_route ~class_:"all-pages-nav"
               ~active:(active_route = Model.All_pages) ~title:(t "Pages")
               ~icon_name:"files" "#/all-pages")
      | "graph-view" ->
          Some
            (nav_route ~class_:"graph-view-nav"
               ~active:(active_route = Model.Graph) ~title:(t "Graph view")
               ~icon_name:"hierarchy" ~shortcut:"g g" "#/graph")
      | "tag/tasks" -> tag_nav ~active_route "tasks" "Tasks" tag_titles
      | "tag/assets" -> tag_nav ~active_route "assets" "Assets" tag_titles
      | _ -> None)
    checked

let nav_group ms st =
  let navs_sig =
    Signal.map2
      (fun route rest -> (route, rest))
      (Signal.map (fun (m : Model.t) -> m.Model.route) ms)
      (Signal.map2
         (fun a b -> (a, b))
         (Signal.value st.Sidebar_state.nav_checked)
         (Signal.value st.nav_tag_titles))
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
            [ dyn ~equal:(fun a b -> a = b)
                (fun (route, (checked, tag_titles)) ->
                  dom ~key:"navs"
                    ~style_class:"sidebar-navigations flex flex-col mt-1"
                    (nav_route ~class_:"journals-nav"
                       ~active:(route = Model.Journals || route = Model.Home)
                       ~title:(t "Journals") ~icon_name:"calendar"
                       ~shortcut:"g j" "#/"
                    :: nav_items ~active_route:route (checked, tag_titles)))
                navs_sig
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
                [ Icons.icon ~cls:"more" ~size:15. "chevron-right" ] ]
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

(* cljs plugins.cljs hook-ui-items :toolbar — the puzzle trigger lives
   in the header .ui-items-container and renders ONLY when at least one
   plugin contributes a toolbar ui-item; click opens the plugins dropdown *)
let plugins_toolbar (ms : Model.t Signal.signal) : t =
  let st = Sidebar_state.ensure ms in
  let owner =
    st.Sidebar_state.open_menu.Signal.state_signal.Signal.owner
  in
  dyn ~equal:Stdlib.( = )
    (fun _dirty ->
      match Plugin_host.toolbar_items () with
      | [] -> dom ~key:"pm-none" []
      | _ ->
          dom ~key:"pm" ~tag:"div"
            ~style_class:"toolbar-plugins-manager flex items-center"
            ~events:"click"
            ~on_dom_event:(fun n _ ->
              if n = "click" then (
                Runtime.signal_set st.Sidebar_state.open_menu "plugins";
                Plugin_host.inject_toolbar_ui ()))
            [ dom ~key:"pm-trigger" ~tag:"a"
                ~style_class:"flex relative toolbar-plugins-manager-trigger"
                ~attrs:[ ("title", t "Plugins") ]
                [ icon "puzzle" ] ])
    (Plugin_host.dirty_value owner)

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
    [ graphs_selector ms; nav_group ms st ]

let contents (ms : Model.t Signal.signal) : t =
  let st = Sidebar_state.ensure ms in
  dom ~key:"ls-contents" ~style_class:"sidebar-contents-container"
    [ dom ~key:"ls-left" ~style_class:"cp__sidebar-left"
        [ favorites_group st; recents_group st ] ]

let menus (ms : Model.t Signal.signal) : t =
  let st = Sidebar_state.ensure ms in
  menu_host st

