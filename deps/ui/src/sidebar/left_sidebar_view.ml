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

(* component icon: tabler names go through the `app:` registry (the only
   cljs name matching a builtin is chevron-right). The `ui__icon` class
   carries over from the cljs span wrapper; `ti`/`ls-icon-*` font classes
   are dropped — the kind renders its own svg, font glyphs would
   double-render *)
let icon_ ?key ?(cls = "") ?(size = 16) name =
  icon ?key
    ~name:(match name with "chevron-right" -> `chevron_right | n -> `app n)
    ~point_size:size
    ~style_class:("ui__icon" ^ if cls = "" then "" else " " ^ cls)
    []

(* ---------- popup menu helpers ---------- *)

(* Menus dismiss via the document-level outside-click + Escape handlers in
   Sidebar_state — no fullscreen backdrop element (an invisible inset:0
   overlay would intercept every pointer hit beneath it, matching the cljs
   dropdown which has none). *)

(* dropdown menus are popover nodes at computed viewport coords; outside
   press / Escape also closes via ~on_dismiss (close_menu is idempotent
   with Sidebar_state's document handler) *)
let menu_box ~key ~at ?min_width ~extra_cls ~dismiss children =
  popover ~key ~at ~role:`menu ?min_width ~on_dismiss:dismiss
    ~style_class:("ui__dropdown-menu-content" ^ extra_cls)
    children

(* combo shortcut inside a menu item (ui/dropdown-shortcut):
   .shui-shortcut-combo.shui-shortcut-glow > kbd*, pushed to the row end
   (cljs ml-auto pl-2) *)
let menu_sc caps =
  row ~key:"sc" ~grow:1. ~main:`end_ ~cross:`center ~padding_horizontal:8
    [ row ~key:"sc-box" ~gap:4 ~cross:`center
        ~style_class:"shui-shortcut-combo shui-shortcut-glow"
        (List.mapi
           (fun i cap ->
             kbd ~key:("k" ^ string_of_int i)
               ~style_class:"shui-shortcut-key" ~value:(Platform.utf8 cap)
               [])
           caps) ]
;;

(* ---------- nav edit (checkbox) menu ---------- *)

let nav_labels =
  [ ("flashcards", "nav/flashcards")
  ; ("all-pages", "sidebar.left/nav-all-pages")
  ; ("tag/tasks", "nav/tasks")
  ; ("tag/assets", "nav/assets")
  ]

let nav_edit_menu st =
  (* menu_item carries the checkbox state via ~checked_signal. On web the
     kind emits button[role=option] rather than div[role=menuitemcheckbox]
     — the e2e `[role='menuitemcheckbox']:text-is(...)` hook is a known
     parity gap while the custom dom menu shell stays *)
  let mk (nav, label) =
    menu_item ~key:("cb-" ^ nav) ~style_class:"ui__dropdown-menu-item"
      ~text:(t label)
      ~checked_signal:
        (Signal.map
           (fun cur -> List.mem nav cur)
           (Signal.value st.Sidebar_state.nav_checked))
      ~on_press:(fun _ ->
        Sidebar_state.toggle_nav st nav
          (not
             (List.mem nav
                (Signal.get_state st.Sidebar_state.nav_checked))))
      []
  in
  box ~key:"nav-edit-menu"
    [ menu_box ~key:"menu-box" ~extra_cls:"" ~at:(16., 96.)
        ~min_width:180 ~dismiss:(fun _ -> Sidebar_state.close_menu st)
        (List.map mk nav_labels) ]

(* ---------- plugins dropdown (toolbar-plugins-manager) ---------- *)

let plugins_menu st =
  let owner =
    st.Sidebar_state.open_menu.Signal.state_signal.Signal.owner
  in
  let extra_item key label icn f =
    Ui_parts.pressable
      ~on_press:(fun _ ->
        Sidebar_state.close_menu st;
        f ())
      (row ~key:("pm-x-" ^ key) ~cross:`center ~gap:4
         ~style_class:"ui__dropdown-menu-item"
         [ icon_ icn; text ~value:label [] ])
  in
  let pinned = Plugin_host.pinned () in
  let item_row (it : Plugin_host.ui_item) =
    let key = Plugin_host.jstr it.it_opts "key" in
    let pkey = it.it_pid ^ ":" ^ key in
    let pinned_ = List.mem pkey pinned in
    Ui_parts.pressable
      ~on_press:(fun _ -> Plugin_host.toggle_pinned pkey)
      (row ~key:("pm-i-" ^ pkey) ~cross:`center
         ~style_class:"ui__dropdown-menu-item"
         [ row ~key:("wrap-" ^ pkey) ~cross:`center
             [ (* plugin UI injects into this slot by element id
                  (Plugin_host.inject_toolbar_ui → get_element_by_id) *)
               box ~key:("slot-" ^ pkey)
                 ~accessibility_identifier:(Plugin_host.slot_id it)
                 ~style_class:"pl-injected-ui-item-toolbar" []
             ; text ~key:("lbl-" ^ pkey) ~value:key
                 ~padding_horizontal:2 []
             ; row ~key:("pin-" ^ pkey) ~cross:`center
                 [ icon_ (if pinned_ then "pinned" else "pin") ]
             ]
         ])
  in
  box ~key:"plugins-menu"
    [ menu_box ~key:"menu-box" ~extra_cls:"toolbar-plugins-manager-content"
        ~min_width:200 ~dismiss:(fun _ -> Sidebar_state.close_menu st)
        (* cljs anchors right:16px; ~at is left-edge so place it at
           viewport-right - 16 - min-width (the positioner clamps wider
           content against the right edge the same way right:16 did) *)
        ~at:(Web_dom.win_inner_width -. 216., 64.)
        (reactive
           (fun _dirty ->
             column ~key:"pm-body"
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
  let item label icon_name caps on_click =
    Ui_parts.pressable
      ~on_press:(fun _ ->
        Sidebar_state.close_menu st;
        on_click ())
      (row ~key:("lp-" ^ label) ~cross:`center ~corner_radius:2
         ~padding_horizontal:8 ~padding_vertical:6
         ~style_class:"ui__dropdown-menu-item"
         ([ icon_ ~cls:"pr-1" icon_name; text ~value:label [] ]
         @ (match caps with [] -> [] | _ -> [ menu_sc caps ])))
  in
  match !Sidebar_state.lp_ctx with
  | None -> spacer ~key:"lp-none" []
  | Some (target, recent, x, y) ->
      let items =
        (if recent then []
         else
           [ item (t "page/unfavorite") "star-off" [ "⌘"; "⇧"; "F" ]
               (fun () ->
                 if Wire.is_uuid_string target then
                   Sidebar_state.unfavorite st target) ])
        @ [ item (t "sidebar.right/open") "layout-sidebar-right"
              [ "⇧"; "Click" ]
              (fun () -> Sidebar_state.open_ref st target) ]
      in
      (* pointer-anchored overlay — same popover ~at placement as
         menu_box *)
      popover ~key:"lp-menu" ~at:(x, y) ~role:`menu
        ~on_dismiss:(fun _ -> Sidebar_state.close_menu st)
        ~style_class:"ui__dropdown-menu-content w-60" items
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
  reactive
    (fun (menu, _checked, _favorited) ->
      match menu with
      | "nav-edit" -> nav_edit_menu st
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
  row ~key:("sc-" ^ binding) ~cross:`center
    [ row ~key:"wrap" ~style_class:"keyboard-shortcut" ~cross:`center
        [ row ~key:"sep" ~gap:4 ~cross:`center
            ~style_class:"shui-shortcut-separate shui-shortcut-glow"
            (List.map
               (fun k ->
                 kbd ~style_class:"shui-shortcut-key"
                   ~value:(Platform.utf8 (String.uppercase_ascii k)) [])
               keys) ] ]

(* cljs sidebar-item: wrapper div gets the nav class (+ `active`), the
   inner `a.item` also gets `active` when the route matches *)
let nav_link ~key ~class_ ~active ~title ~icon_name ?shortcut ~on_click () =
  let act = if active then " active" else "" in
  let tail = match shortcut with Some s -> [ shortcut_hint s ] | None -> [] in
  box ~key ~style_class:(class_ ^ act)
    [ Ui_parts.pressable ~on_press:(fun _ -> on_click ())
        (row ~cross:`center ~corner_radius:6
           ~style_class:("item group" ^ act)
           ([ icon_ icon_name
            ; text  ~grow:1. ~value:title [] ]
           @ tail)) ]

let nav_route ~class_ ~active ~title ~icon_name ?shortcut hash =
  nav_link ~key:("nl-" ^ class_) ~class_ ~active ~title ~icon_name ?shortcut
    ~on_click:(fun () ->
      Platform.set_location_hash (Runtime.nav_hash hash);
      Web_dom.dispatch_custom "ls:navigate" Js.Json.null)
    ()

let tag_nav ~active_route class_ label titles =
  match List.assoc_opt class_ titles with
  | Some title ->
      Some
        (nav_link ~key:("tag-" ^ class_) ~class_:("tag-view-nav " ^ class_)
           ~active:(active_route = Model.Page title)
           ~title:(t label) ~icon_name:"hash"
           ~on_click:(fun () -> Sidebar_state.navigate_to_page title)
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
               ~on_click:(fun () -> Sidebar_state.open_cards ())
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
  box ~key:"nav-group"
    ~style_class:"sidebar-content-group is-expand"
    [ column ~key:"nav-inner" ~style_class:"sidebar-content-group-inner"
        [ row ~key:"nav-hd" ~cross:`center
            ~style_class:"hd non-collapsable enter-show-more"
            [ box ~key:"nav-name" ~style_class:"a"
                [ box ~style_class:"wrap-th" ~grow:1.
                    [ text ~value:(t "sidebar.left/navigations") [] ] ]
            ; box ~key:"nav-more" ~style_class:"b"
                [ Ui_parts.pressable
                    ~on_press:(fun _ -> Sidebar_state.open_nav_menu st)
                    (row ~style_class:"as-edit"
                       [ icon_ "filter-edit" ]) ] ]
        ; box ~key:"nav-bd" ~style_class:"bd"
            [ reactive
                (fun (route, (checked, tag_titles)) ->
                  column ~key:"navs" ~style_class:"sidebar-navigations"
                    (* cljs journals item navigates on click; its anchor
                       carries no href *)
                    ((nav_link ~key:"nl-journals" ~class_:"journals-nav"
                       ~active:(route = Model.Journals || route = Model.Home)
                       ~title:(t "nav/journals") ~icon_name:"calendar"
                       ~shortcut:"g j"
                       ~on_click:(fun () ->
                         Platform.set_location_hash
                           (Runtime.nav_hash "#/");
                         Web_dom.dispatch_custom "ls:navigate" Js.Json.null)
                       ())
                    :: nav_items ~active_route:route (checked, tag_titles)
                  ))
                navs_sig
            ]
        ]
    ]

(* ---------- favorites / recents ---------- *)


let page_item_el st (p : Model.page) ~li_class ~recent ~key =
  let lp_ref =
    match p.Model.page_uuid with
    | Some u -> u
    | None -> p.Model.page_title
  in
  (* li wrapper: list_item would emit a <button> on web around the
     interactive .link-item anchor + dots button (nested interactives) —
     a column keeps the class hook, and its press-detail handler reads
     the deepest hit's class (dots button -> lp menu, anything else ->
     navigate; shift opens in the right sidebar). The data-lp-* attrs
     still feed the document-level contextmenu handler in
     sidebar_state. *)
  column ~key ~style_class:li_class
    ~on_press_detail:(fun ev ->
      match ev with
      | Lui_protocol.PressDetail (_, d) ->
          let cls = d.Lui_protocol.target_class in
          if
            Str_util.contains cls "sidebar-page-actions"
            || Str_util.contains cls "ls-icon-dots"
          then
            Sidebar_state.open_lp_menu st ~target:lp_ref ~recent ~x:d.x
              ~y:d.y
          else
            let shift = d.Lui_protocol.modifiers land 2 <> 0 in
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
                 | title -> title)
      | _ -> ())
    [ link ~style_class:"link-item group"
        ~data_attrs:
          [ ("data-lp-ref", lp_ref)
          ; ("data-lp-recent", if recent then "1" else "0") ]
        [ box ~style_class:"page-icon" [ icon_ "file" ]
        ; text ~style_class:"page-title" ~value:p.Model.page_title []
        (* cljs .sidebar-page-actions dots button inside .link-item —
           its class hooks (sidebar-page-actions, ls-icon-dots) still
           reach the row's target_class check *)
        ; button ~variant:`ghost ~size:`icon
            ~height:28 ~padding_vertical:4 ~corner_radius:4 ~padding_horizontal:6 ~style_class:"active:opacity-80 as-ghost cursor-pointer disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 gap-1 hover:bg-secondary/70 hover:text-secondary-foreground select-none sidebar-page-actions absolute !bg-transparent top-0 scale-75 opacity-40 hover:opacity-80 active:opacity-100 text-sm ui__button"
            (* cljs [:i.relative {:style {:top "4px"}}] — the top offset
               rides a stylesheet rule now *)
            [ Icons.icon ~size:18. ~cls:"relative" "dots" ]
        ]
    ]

(* cljs sidebar-content-group: .bd renders only when the group supplies a
   child — favorites passes a child only when non-empty, recent always
   passes a ul (so an empty Recent still shows .bd > ul.text-sm).
   has-children rides on the items signal via class_signal; the inner
   reactive stays because the bd subtree's shape changes with the list *)
let content_group st ~key ~class_ ~label ~items_sig ~li_class ~ul_class
    ~always_bd ~recent =
  Ui_parts.class_signal items_sig
    (fun ps ->
      "sidebar-content-group " ^ class_ ^ " is-expand"
      ^ if ps = [] then "" else " has-children")
    (box ~key
       [ column ~key:(key ^ "-inner")
           ~style_class:"sidebar-content-group-inner"
           [ row ~key:(key ^ "-hd") ~cross:`center ~style_class:"hd"
               [ box ~key:(key ^ "-a") ~style_class:"a"
                   [ box ~style_class:"wrap-th" ~grow:1.
                       [ text ~value:label [] ] ]
               ; box ~key:(key ^ "-b") ~style_class:"b"
                   [ icon_ ~cls:"more" ~size:15 "chevron-right" ] ]
           ; reactive
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
                   box ~key:(key ^ "-bd") ~style_class:"bd"
                     [ list ~key:(key ^ "-ul") ~style_class:ul_class
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
       ])

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
  reactive
    (fun _dirty ->
      match
        ( Plugin_host.toolbar_items () <> []
        , Plugin_host.has_installed_plugins () )
      with
      | false, false -> spacer ~key:"pm-none" []
      | _ ->
          box ~key:"ui-items" ~style_class:"ui-items-container"
            [ box ~key:"ui-items-wrap" ~style_class:"list-wrap"
                [ Ui_parts.pressable
                    ~on_press:(fun _ ->
                      Runtime.signal_set st.Sidebar_state.open_menu
                        "plugins";
                      Plugin_host.inject_toolbar_ui ())
                    (row ~key:"pm" ~cross:`center
                       ~style_class:"toolbar-plugins-manager"
                       [ box ~key:"pm-trigger"
                           ~style_class:"toolbar-plugins-manager-trigger"
                           [ icon_ "puzzle" ] ]) ] ])
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
  box ~key:"gsel" 
    [ row ~key:"gsel-box" ~cross:`center ~main:`space_between
        ~style_class:"cp__graphs-selector"
        [ Ui_parts.pressable
            ~on_press:(fun _ ->
              (* cljs opens a repos dropdown menu here; until that menu
                 exists, land on the All graphs page (graph switching,
                 create, and row actions live there) *)
              Platform.set_location_hash (Runtime.nav_hash "#/graphs"))
            (row ~key:"gsel-a" ~cross:`center ~gap:4 ~style_class:"item"
               [ box ~key:"gsel-th" ~style_class:"thumb"
                   [ icon_ "topology-star" ]
               ; text ~key:"gsel-n"
                   ~value_signal:(Signal.map name_of ms) []
               ; icon_ "selector" ]) ] ]
;;

let header (ms : Model.t Signal.signal) : t =
  let st = Sidebar_state.ensure ms in
  Logseq_dom.fragment [ graphs_selector ms; nav_group ms st ]

let contents (ms : Model.t Signal.signal) : t =
  let st = Sidebar_state.ensure ms in
  column ~key:"ls-contents" ~style_class:"sidebar-contents-container"
    [ favorites_group st; recents_group st ]

let menus (ms : Model.t Signal.signal) : t =
  let st = Sidebar_state.ensure ms in
  menu_host st
