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
let dyn = D.dyn
let t = Sidebar_state.t

let icon name = Icons.icon ~size:16. name

(* ---------- popup menu helpers ---------- *)

(* Menus dismiss via the document-level outside-click + Escape handlers in
   Sidebar_state — no fullscreen backdrop element (an invisible inset:0
   overlay would intercept every pointer hit beneath it, matching the cljs
   dropdown which has none). *)
let menu_box ~style children =
  dom ~key:"menu-box" ~tag:"div"
    ~style_class:"ui__dropdown-menu-content ui__dropdown-menu"
    ~attrs:[ ("role", "menu"); ("style", style) ]
    children

(* combo shortcut inside a menu item (ui/dropdown-shortcut):
   span.ml-auto.pl-2 > .shui-shortcut-combo.shui-shortcut-glow > kbd* *)
let menu_sc caps =
  dom ~key:"sc" ~tag:"span" ~style_class:"ml-auto pl-2"
    [ dom ~key:"sc-box" ~tag:"div"
        ~style_class:"shui-shortcut-combo shui-shortcut-glow"
        ~attrs:[ ("style", "white-space: nowrap") ]
        (List.mapi
           (fun i cap ->
             dom ~key:("k" ^ string_of_int i) ~tag:"kbd"
               ~style_class:"shui-shortcut-key" ~text:cap [])
           caps) ]
;;

(* [role='menuitem'] > div text — contract uses `div:text('<label>')` *)
let menu_item st label on_click =
  Menu_item.el ~key:("mi-" ^ label)
    ~cls:"ui__dropdown-menu-item"
    ~attrs:[ ("role", "menuitem") ]
    ~label
    ~on_click:(fun () ->
      Sidebar_state.close_menu st;
      on_click ())
    ()

(* ---------- nav edit (checkbox) menu ---------- *)

let nav_labels =
  [ ("flashcards", "nav/flashcards")
  ; ("all-pages", "sidebar.left/nav-all-pages")
  ; ("tag/tasks", "nav/tasks")
  ; ("tag/assets", "nav/assets")
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
          ~attrs_signal_v:(Logseq_dom.reactive_attrs
               (fun cur ->
                 [ ("role", "menuitemcheckbox")
                 ; ("aria-checked", string_of_bool (List.mem nav cur))
                 ])
               (Signal.value st.Sidebar_state.nav_checked))
          ~text:(t label) [] ]
  in
  dom ~key:"nav-edit-menu"
    [ menu_box ~style:"position:fixed;top:96px;left:16px;z-index:999;min-width:180px"
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
    [ dom ~key:"menu-box" ~tag:"div"
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
        :: [ extra_item "plugins" (t "nav/plugins") "apps"
               (fun () -> Dialogs_state.open_ "plugins")
           ; extra_item "themes" (t "nav/themes") "palette"
               (fun () -> Dialogs_state.open_ "plugins")
           ; extra_item "settings" (t "nav/settings") "adjustments"
               (fun () -> Sidebar_state.open_dialog "settings")
           ])
    ]

(* cljs left_sidebar.cljs x-menu-content: dropdown at the pointer with
   "Unfavorite" (favorites only) + "Open in sidebar", icons and keycap
   shortcuts; content-props class w-60 *)
let lp_menu st =
  let ctx_icon n =
    dom ~tag:"span" ~style_class:"scale-90 pr-1 opacity-80" [ icon n ]
  in
  let item label icon_name caps on_click =
    dom ~key:("lp-" ^ label) ~tag:"div"
      ~attrs:[ ("role", "menuitem"); ("tabindex", "-1") ]
      ~style_class:
        "ui__dropdown-menu-item relative flex cursor-pointer select-none \
         items-center rounded-sm px-2 py-1.5 text-sm outline-none \
         data-[highlighted]:bg-muted data-[disabled]:pointer-events-none \
         data-[disabled]:opacity-50"
      ~events:"click"
      ~on_dom_event:(fun n _ ->
        if n = "click" then (
          Sidebar_state.close_menu st;
          on_click ()))
      ([ ctx_icon icon_name; dom ~tag:"span" ~text:label [] ]
      @ (match caps with [] -> [] | _ -> [ menu_sc caps ]))
  in
  match !Sidebar_state.lp_ctx with
  | None -> dom ~key:"lp-none" []
  | Some (target, recent, x, y) ->
      let items =
        (if recent then []
         else
           [ item (t "sidebar.left/unfavorite") "star-off" [ "⌘"; "⇧"; "F" ]
               (fun () ->
                 if Wire.is_uuid_string target then
                   Sidebar_state.unfavorite st target) ])
        @ [ item (t "sidebar.right/open") "layout-sidebar-right"
              [ "⇧"; "Click" ]
              (fun () -> Sidebar_state.open_ref st target) ]
      in
      dom ~key:"lp-menu" ~tag:"div"
        ~attrs:
          [ ("role", "menu")
          ; ( "style"
            , Printf.sprintf
                "position:fixed;left:%.0fpx;top:%.0fpx;z-index:999" x y ) ]
        ~style_class:
          "ui__dropdown-menu-content ui__dropdown-menu w-60" items
;;

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
      | m when String.length m > 3 && String.sub m 0 3 = "lp-" ->
          lp_menu st
      | _ -> Logseq_dom.nothing)
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
let nav_link ~key ~class_ ~active ~title ~icon_name ?shortcut ?href
    ~on_click () =
  let act = if active then " active" else "" in
  let tail = match shortcut with Some s -> [ shortcut_hint s ] | None -> [] in
  dom ~key ~style_class:(class_ ^ act)
    [ dom ~tag:"a"
        ~style_class:
          ("item group flex items-center text-sm rounded-md font-medium" ^ act)
        ~attrs:(match href with Some h -> [ ("href", h) ] | None -> [])
        ~events:"click" ~on_dom_event:on_click
        ([ icon icon_name
         ; dom ~tag:"span" ~style_class:"flex-1" ~text:title [] ]
        @ tail)
    ]

let nav_route ~class_ ~active ~title ~icon_name ?shortcut hash =
  nav_link ~key:("nl-" ^ class_) ~class_ ~active ~title ~icon_name ?shortcut
    ~href:hash
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
               ~active:false ~title:(t "nav/flashcards") ~icon_name:"cards"
               ~shortcut:"g f"
               ~on_click:(fun name _ ->
                 if name = "click" then Sidebar_state.open_cards ())
               ())
      | "all-pages" ->
          Some
            (nav_route ~class_:"all-pages-nav"
               ~active:(active_route = Model.All_pages) ~title:(t "nav.all-pages/label")
               ~icon_name:"files" "#/all-pages")
      | "tag/tasks" -> tag_nav ~active_route "tasks" "nav/tasks" tag_titles
      | "tag/assets" -> tag_nav ~active_route "assets" "nav/assets" tag_titles
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
    ~style_class:"sidebar-content-group is-expand"
    [ dom ~key:"nav-inner" ~style_class:"sidebar-content-group-inner"
        [ dom ~key:"nav-hd"
            ~style_class:"hd items-center non-collapsable enter-show-more"
            [ dom ~key:"nav-name" ~tag:"span" ~style_class:"a"
                [ dom ~tag:"a" ~style_class:"wrap-th"
                    [ dom ~tag:"strong" ~style_class:"flex-1"
                        ~text:(t "sidebar.left/navigations") [] ] ]
            ; dom ~key:"nav-more" ~tag:"span" ~style_class:"b"
                [ dom ~tag:"a"
                    ~style_class:
                      "as-edit !opacity-60 hover:!opacity-80 relative -top-0.5 -right-0.5"
                    ~events:"click"
                    ~on_dom_event:(fun name _ ->
                      if name = "click" then Sidebar_state.open_nav_menu st)
                    [ icon "filter-edit" ] ] ]
        ; dom ~key:"nav-bd" ~style_class:"bd"
            [ dyn ~equal:(fun a b -> a = b)
                (fun (route, (checked, tag_titles)) ->
                  dom ~key:"navs"
                    ~style_class:"sidebar-navigations flex flex-col mt-1"
                    (* cljs journals item navigates on click; its anchor
                       carries no href *)
                    ((nav_link ~key:"nl-journals" ~class_:"journals-nav"
                       ~active:(route = Model.Journals || route = Model.Home)
                       ~title:(t "nav/journals") ~icon_name:"calendar"
                       ~shortcut:"g j"
                       ~on_click:(fun name _ ->
                         if name = "click" then (
                           Platform.set_location_hash
                             (Runtime.nav_hash "#/");
                           Platform.dispatch "ls:navigate" Js.Json.null))
                       ())
                    :: nav_items ~active_route:route (checked, tag_titles)
                  ))
                navs_sig
            ]
        ]
    ]

(* ---------- favorites / recents ---------- *)

let str_contains hay needle =
  let lh = String.length hay and ln = String.length needle in
  let rec go i =
    i + ln <= lh
    && (String.sub hay i ln = needle || go (i + 1))
  in
  go 0
;;

let page_item_el st (p : Model.page) ~li_class ~recent ~key =
  let lp_ref =
    match p.Model.page_uuid with
    | Some u -> u
    | None -> p.Model.page_title
  in
  let open_lp payload =
    let x = Platform.payload_num payload "clientX" in
    let y = Platform.payload_num payload "clientY" in
    Sidebar_state.open_lp_menu st ~target:lp_ref ~recent ~x ~y
  in
  dom ~key ~tag:"li" ~style_class:li_class
    [ dom ~tag:"a" ~style_class:"link-item group"
        ~attrs:
          [ ("data-lp-ref", lp_ref)
          ; ("data-lp-recent", if recent then "1" else "0") ]
        ~events:"click"
        ~on_dom_event:(fun name payload ->
          if name = "click" then (
            let cls =
              match payload with
              | Some pl -> (
                  try Platform.event_str (Js.Json.parseExn pl) "targetClass"
                  with _ -> "")
              | None -> ""
            in
            if
              str_contains cls "sidebar-page-actions"
              || str_contains cls "ls-icon-dots" then
              open_lp payload
            else
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
            []
        (* cljs .sidebar-page-actions dots button inside .link-item *)
        ; dom ~tag:"button"
            ~style_class:
              "sidebar-page-actions absolute !bg-transparent right-0 top-0 \
               px-1.5 scale-75 opacity-40 hover:opacity-80 \
               active:opacity-100"
            [ dom ~tag:"i" ~style_class:"relative"
                ~attrs:[ ("style", "top: 4px") ]
                [ icon "dots" ] ] ]
    ]

(* cljs sidebar-content-group: .bd renders only when the group supplies a
   child — favorites passes a child only when non-empty, recent always
   passes a ul (so an empty Recent still shows .bd > ul.text-sm) *)
let content_group st ~key ~class_ ~label ~items_sig ~li_class ~ul_class
    ~always_bd ~recent =
  dom ~key
    ~style_class_signal:(Logseq_dom.reactive_class
         (fun ps ->
           "sidebar-content-group " ^ class_ ^ " is-expand"
           ^ if ps = [] then "" else " has-children")
         items_sig)
    [ dom ~key:(key ^ "-inner") ~style_class:"sidebar-content-group-inner"
        [ dom ~key:(key ^ "-hd") ~style_class:"hd items-center"
            [ dom ~key:(key ^ "-a") ~tag:"span" ~style_class:"a"
                [ dom ~tag:"a" ~style_class:"wrap-th"
                    [ dom ~tag:"strong" ~style_class:"flex-1" ~text:label
                        [] ] ]
            ; dom ~key:(key ^ "-b") ~tag:"span" ~style_class:"b"
                [ Icons.icon ~cls:"more" ~size:15. "chevron-right" ] ]
        ; dyn
            ~equal:(fun a b ->
              List.map
                (fun (p : Model.page) -> (p.page_uuid, p.page_title))
                a
              = List.map
                  (fun (p : Model.page) -> (p.page_uuid, p.page_title))
                  b)
            (fun ps ->
              if ps = [] && not always_bd then Logseq_dom.nothing
              else
                dom ~key:(key ^ "-bd") ~style_class:"bd"
                  [ dom ~key:(key ^ "-ul") ~tag:"ul" ~style_class:ul_class
                      (List.map
                         (fun p ->
                           page_item_el st p ~li_class ~recent
                             ~key:
                               (key ^ "-"
                                ^ Option.value p.Model.page_uuid
                                    ~default:p.Model.page_title))
                         ps) ])
            items_sig
        ]
    ]

let favorites_group st =
  content_group st ~key:"fav" ~class_:"favorites" ~label:(t "sidebar.left/favorites")
    ~items_sig:(Signal.value st.Sidebar_state.favorites)
    ~ul_class:"favorites text-sm" ~always_bd:false
    ~li_class:"favorite-item font-medium" ~recent:false

let recents_group st =
  content_group st ~key:"recent" ~class_:"recent"
    ~label:(t "sidebar.left/recent-pages")
    ~items_sig:(Signal.value st.Sidebar_state.recents)
    ~ul_class:"text-sm" ~always_bd:true
    ~li_class:"recent-item select-none font-medium" ~recent:true

(* cljs plugins.cljs hook-ui-items :toolbar — the puzzle trigger lives
   in the header .ui-items-container. cljs gates it on (seq toolbar
   items); the e2e lifecycle test also clicks it right after disabling
   the last toolbar plugin, so we additionally keep it while at least
   one plugin is installed (cljs keeps :plugin/installed-plugins entries
   for disabled plugins). Click opens the plugins dropdown. *)
let plugins_toolbar (ms : Model.t Signal.signal) : t =
  let st = Sidebar_state.ensure ms in
  let owner =
    st.Sidebar_state.open_menu.Signal.state_signal.Signal.owner
  in
  dyn ~equal:Stdlib.( = )
    (fun _dirty ->
      match
        ( Plugin_host.toolbar_items () <> []
        , Plugin_host.has_installed_plugins () )
      with
      | false, false -> dom ~key:"pm-none" []
      | _ ->
          dom ~key:"ui-items" ~style_class:"ui-items-container"
            ~attrs:[ ("data-type", "toolbar") ]
            [ dom ~key:"ui-items-wrap" ~style_class:"list-wrap"
                [ dom ~key:"pm" ~tag:"div"
                    ~style_class:"toolbar-plugins-manager flex items-center"
                    ~events:"click"
                    ~on_dom_event:(fun n _ ->
                      if n = "click" then (
                        Runtime.signal_set st.Sidebar_state.open_menu
                          "plugins";
                        Plugin_host.inject_toolbar_ui ()))
                    [ dom ~key:"pm-trigger" ~tag:"a"
                        ~style_class:"flex relative toolbar-plugins-manager-trigger"
                        ~attrs:[ ("title", t "nav/plugins") ]
                        [ icon "puzzle" ] ] ] ])
    (Plugin_host.dirty_value owner)

(* ---------- root ---------- *)
(* chrome.ml owns the #left-sidebar.cp__sidebar-left-layout shell +
   shade-mask + resizer; these pieces fill its .wrap skeleton *)

(* cljs repo/graphs-selector: icon + graph display name + selector chevron *)
let graphs_selector (ms : Model.t Signal.signal) : t =
  let name_of (m : Model.t) =
    match m.repo with
    | Some r ->
        if String.length r > 10 && String.sub r 0 10 = "logseq_db_"
        then String.sub r 10 (String.length r - 10)
        else r
    | None -> t "graph.switch/select-prompt"
  in
  dom ~key:"gsel" ~style_class:"sidebar-graphs"
    [ dom ~key:"gsel-box"
        ~style_class:"cp__graphs-selector flex items-center justify-between"
        [ dom ~key:"gsel-a" ~tag:"a"
            ~style_class:"item flex items-center gap-1 select-none"
            ~events:"click"
            ~on_dom_event:(fun n _ ->
              if n = "click" then
                (* cljs opens a repos dropdown menu here; until that menu
                   exists, land on the All graphs page (graph switching,
                   create, and row actions live there) *)
                Platform.set_location_hash (Runtime.nav_hash "#/graphs"))
            [ dom ~key:"gsel-th" ~tag:"span" ~style_class:"thumb"
                [ icon "topology-star" ]
            ; dom ~key:"gsel-n" ~tag:"strong"
                ~text_signal:(Logseq_dom.reactive_text name_of ms) []
            ; icon "selector" ] ] ]

let header (ms : Model.t Signal.signal) : t =
  let st = Sidebar_state.ensure ms in
  Logseq_dom.fragment [ graphs_selector ms; nav_group ms st ]

let contents (ms : Model.t Signal.signal) : t =
  let st = Sidebar_state.ensure ms in
  dom ~key:"ls-contents" ~style_class:"sidebar-contents-container"
    [ favorites_group st; recents_group st ]

let menus (ms : Model.t Signal.signal) : t =
  let st = Sidebar_state.ensure ms in
  menu_host st

