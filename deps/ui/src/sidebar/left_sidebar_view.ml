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
module D = Logseq_el

let t = Sidebar_state.t

(* component icon: tabler names go through the `app:` registry (the only
   cljs name matching a builtin is chevron-right). The `ui__icon` class
   carries over from the cljs span wrapper; `ti`/`ls-icon-*` font classes
   are dropped — the kind renders its own svg, font glyphs would
   double-render *)
let icon_ ?key ?(cls = "") ?(size = 16) name =
  icon ?key
    ~name:
      (match name with
      | "chevron-right" -> `chevron_right
      | "chevron-down" -> `chevron_down
      | n -> `app n)
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
               ~style_class:"shui-shortcut-key" ~value:(Ui_services.literal_text cap)
               [])
           caps) ]
;;

(* ---------- nav edit (checkbox) menu ---------- *)

let nav_labels =
  [ ("flashcards", "nav/flashcards")
  ; ("all-pages", "sidebar.left/nav-all-pages")
  ; ("graph-view", "nav/graph-view")
  ; ("tag/tasks", "nav/tasks")
  ; ("tag/assets", "nav/assets")
  ]

let nav_edit_menu st =
  (* menu_item carries the checkbox state via ~checked_signal; role /
     aria-checked ride data_attrs so the e2e
     `[role='menuitemcheckbox'][aria-checked]` hook sees them *)
  let mk (nav, label) =
    menu_item ~key:("cb-" ^ nav) ~style_class:"ui__dropdown-menu-item"
      ~text:(t label)
      ~data_attrs:
        (reactive
           (fun cur ->
             [ ("role", "menuitemcheckbox")
             ; ("aria-checked", if List.mem nav cur then "true" else "false")
             ])
           (Signal.value st.Sidebar_state.nav_checked))
      ~checked_signal:
        (Signal.map
           (fun cur -> List.mem nav cur)
           (Signal.value st.Sidebar_state.nav_checked))
      ~on_press:(fun _ ->
        Sidebar_state.toggle_nav st nav
          (not
             (List.mem nav
                (Runtime.signal_get st.Sidebar_state.nav_checked))))
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
         ~data_attrs:[ ("role", "menuitem") ]
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
         ~data_attrs:[ ("role", "menuitem") ]
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
         ~data_attrs:[ ("role", "menuitem") ]
         ([ icon_ ~cls:"pr-1" icon_name; text ~value:label [] ]
         @ (match caps with [] -> [] | _ -> [ menu_sc caps ])))
  in
  match !Sidebar_state.lp_ctx with
  | None -> spacer ~key:"lp-none" []
  | Some (target, recent, ax, atop, abot) ->
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
      (* cljs popup-show! anchors the dropdown to the event target:
         centered on it below (ls-anchor-cx translates the positioner
         back half its width), flipping above when the space below runs
         out (ls-anchor-top lifts it by its own height) *)
      let w = 240. in
      let flip = Popups_state.anchor_above atop abot in
      let x =
        Float.max ((w /. 2.) +. 5.)
          (Float.min ax
             (Web_dom.win_inner_width -. (w /. 2.) -. 5.))
      in
      popover ~key:"lp-menu" ~at:(x, if flip then atop else abot)
        ~role:`menu
        ~on_dismiss:(fun _ -> Sidebar_state.close_menu st)
        ~style_class:
          ("ui__dropdown-menu-content w-60 ls-anchor-cx"
          ^ if flip then " ls-anchor-top" else "")
        items
;;

(* ---------- repos dropdown (cljs graphs-selector popup) ---------- *)

(* cljs repo.cljs repos-dropdown-content: "Switch to:" header (only
   when >1 repo), the switch list minus the current graph, then the
   quick-actions footer. Remote rows render only for a logged-in user. *)
let repos_menu st =
  let x, y = !Sidebar_state.repos_xy in
  let m = Runtime.model () in
  let cur = Option.value m.Model.repo ~default:"" in
  let by_seen a b =
    compare
      (Option.value (Graphs_meta.last_seen b) ~default:0.)
      (Option.value (Graphs_meta.last_seen a) ~default:0.)
  in
  (* cljs combine-local-&-remote-graphs merges by :url — a remote graph
     that exists locally renders once, as the local row *)
  let remote =
    if Rtc_flows.logged_in () then
      let local_names = List.map Graphs_view.short_name !Graphs_ops.repos in
      List.filter
        (fun (n, _, _, _) -> not (List.mem n local_names))
        !Graphs_ops.remote_graphs
    else []
  in
  let switch_repos =
    List.sort by_seen
      (List.filter (fun r -> r <> cur) !Graphs_ops.repos)
  in
  let n_repos = List.length switch_repos + List.length remote + 1 in
  let close () = Sidebar_state.close_menu st in
  let repo_item repo =
    Menu_item.el ~key:("rp-" ^ repo) ~cls:Menu_item.graphs_cls
      ~label:(Graphs_view.short_name repo)
      ~on_click:(fun () ->
        close ();
        ignore (Graphs_ops.navigate_journal repo))
      ()
  in
  let remote_item (n, uuid, e2ee, _role) =
    Menu_item.el ~key:("rr-" ^ uuid) ~cls:Menu_item.graphs_cls ~label:n
      ~after:[ icon_ ~size:18 (if e2ee then "lock" else "cloud") ]
      ~on_click:(fun () ->
        close ();
        ignore (Graphs_ops.download_remote ~name:n ~uuid ~e2ee))
      ()
  in
  let action key label icn act =
    (* cljs repos-footer: ghost button rows — icon + label, w-full *)
    Ui_parts.pressable
      ~on_press:(fun _ ->
        close ();
        act ())
      (row ~key ~cross:`center ~gap:6 ~padding_horizontal:12
         ~padding_vertical:4 ~style_class:"ui__button repos-qa-btn"
         ~data_attrs:[ ("role", "menuitem") ]
         [ icon_ ~size:18 icn; text ~key:"t" ~value:label [] ])
  in
  popover ~key:"repos-menu" ~at:(x, y) ~role:`menu ~min_width:300
    ~on_dismiss:(fun _ -> Sidebar_state.close_menu st)
    ~style_class:"ui__dropdown-menu-content repos-list"
    [ column ~key:"wrap"
        ~style_class:(if n_repos <= 1 then "no-repos" else "")
        [ (if n_repos <= 1 then Logseq_el.nothing
           else
             row ~key:"hd" ~main:`space_between ~cross:`center
               ~style_class:"repos-hd"
               [ text ~key:"h4" ~style_class:"repos-h4"
                   ~value:I18n.switch_to [] ])
        ; column ~key:"lst" ~style_class:"cp__repos-list-wrap"
            (List.map repo_item switch_repos
            @ List.map remote_item remote)
        ; column ~key:"qa" ~style_class:"cp__repos-quick-actions"
            [ action "qa-new" I18n.create_db_graph "database-plus"
                (fun () -> Dialogs_state.open_ "new-graph")
            ; action "qa-imp" I18n.import_existing_notes "database-import"
                (fun () -> Ui_services.nav_set_hash "#/import")
            ; action "qa-all" I18n.all_graphs "layout-2" (fun () ->
                  Ui_services.nav_set_hash
                    (Runtime.nav_hash "#/graphs")) ] ] ]

let menu_host st =
 fun ctx parent ->
  (* nested maps each own their upstream subscription on the shared
     state cells — own both levels *)
  let menu_sig =
    Logseq_el.own ctx
      (Signal.map2
         (fun menu (checked, favorited) -> (menu, checked, favorited))
         (Signal.value st.Sidebar_state.open_menu)
         (Logseq_el.own ctx
            (Signal.map2
               (fun a b -> (a, b))
               (Signal.value st.nav_checked)
               (Signal.value st.favorited))))
  in
  (reactive
    (fun (menu, _checked, _favorited) ->
      match menu with
      | "nav-edit" -> nav_edit_menu st
      | "plugins" -> plugins_menu st
      | "repos" -> repos_menu st
      | m when String.length m > 3 && String.sub m 0 3 = "lp-" ->
          lp_menu st
      | _ -> Logseq_el.nothing)
    menu_sig)
    ctx parent

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
                 kbd ~style_class:"shui-shortcut-key shui-key-boxed"
                   ~value:(Ui_services.literal_text (String.uppercase_ascii k)) [])
               keys) ] ]

(* cljs sidebar-item: wrapper div gets the nav class (+ `active`), the
   inner `a.item` also gets `active` when the route matches *)
let nav_link ~key ~class_ ~active ~title ~icon_name ?shortcut ~on_click
    ?(more = Logseq_el.nothing) () =
  let act = if active then " active" else "" in
  let tail = match shortcut with Some s -> [ shortcut_hint s ] | None -> [] in
  box ~key ~style_class:(class_ ^ act)
    [ Ui_parts.pressable ~on_press:(fun _ -> on_click ())
        (row ~cross:`center ~corner_radius:6
           ~style_class:("item group" ^ act)
           ([ icon_ icon_name
            ; text  ~grow:1. ~value:title [] ]
           @ tail @ [ more ])) ]

let nav_route ~class_ ~active ~title ~icon_name ?shortcut hash =
  nav_link ~key:("nl-" ^ class_) ~class_ ~active ~title ~icon_name ?shortcut
    ~on_click:(fun () ->
      Ui_services.nav_set_hash (Runtime.nav_hash hash);
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
      | "flashcards" -> (
          (* cljs: hidden unless :feature/enable-flashcards?, and a
             due-count pill rides the item *)
          let on =
            if Settings_state.ready () then
              Settings_state.config_bool "feature/enable-flashcards?"
                ~default:true
            else true
          in
          if not on then None
          else
            Some
              (nav_link ~key:"nl-flashcards" ~class_:"flashcards-nav"
                 ~active:false ~title:(t "nav/flashcards") ~icon_name:"cards"
                 ~shortcut:"g f"
                 ~on_click:(fun () ->
                   Cards_state.update_due_count ();
                   Sidebar_state.open_cards ())
                 ~more:(Lui_elements.dyn
                          (fun (n : int) ->
                            if n > 0 then
                              text ~style_class:"ml-1 inline-block py-0.5 px-3 text-xs font-medium rounded-full"
                                ~value:(string_of_int n) []
                            else Logseq_el.nothing)
                          (Cards_state.Due_count.signal ()))
                 ()))
      | "all-pages" ->
          Some
            (nav_route ~class_:"all-pages-nav"
               ~active:(active_route = Model.All_pages) ~title:(t "nav.all-pages/label")
               ~icon_name:"files" "#/all-pages")
      | "graph-view" ->
          Some
            (nav_route ~class_:"graph-view-nav"
               ~active:(active_route = Model.Graph_view)
               ~title:(t "nav/graph-view") ~icon_name:"hierarchy"
               ~shortcut:"g g" "#/graph")
      | "tag/tasks" -> tag_nav ~active_route "tasks" "nav/tasks" tag_titles
      | "tag/assets" -> tag_nav ~active_route "assets" "nav/assets" tag_titles
      | _ -> None)
    checked

let nav_group ms st =
 fun ctx parent ->
  (* sidebar badge cell — idle until the nav mounts it *)
  Cards_state.Due_count.mount ctx 0;
  if not (Cards_state.Due_count.ready ()) then ()
  else Cards_state.update_due_count ();
  let navs_sig =
    Logseq_el.own ctx
      (Signal.map2
         (fun route rest -> (route, rest))
         (Logseq_el.own ctx (Signal.map (fun (m : Model.t) -> m.Model.route) ms))
         (Logseq_el.own ctx
            (Signal.map2
               (fun a b -> (a, b))
               (Signal.value st.Sidebar_state.nav_checked)
               (Signal.value st.nav_tag_titles))))
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
                       [ icon_ ~size:14 "filter-edit" ]) ] ]
        ; box ~key:"nav-bd" ~style_class:"bd"
            [ reactive
                (fun (route, (checked, tag_titles)) ->
                  column ~key:"navs" ~style_class:"sidebar-navigations"
                    (* cljs journals item navigates on click; its anchor
                       carries no href. go-to-journals! targets
                       #/all-journals when a default-home page owns #/ *)
                    ((nav_link ~key:"nl-journals" ~class_:"journals-nav"
                       ~active:(route = Model.Journals || route = Model.Home)
                       ~title:(t "nav/journals") ~icon_name:"calendar"
                       ~shortcut:"g j"
                       ~on_click:(fun () ->
                         ignore
                           (Js.Promise.then_
                              (fun (h, _) ->
                                Ui_services.nav_set_hash
                                  (Runtime.nav_hash h);
                                Web_dom.dispatch_custom "ls:navigate"
                                  Js.Json.null;
                                Router.scroll_to_top ();
                                Js.Promise.resolve ())
                              (Router.go_to_journals_target ())))
                       ())
                    :: nav_items ~active_route:route (checked, tag_titles)
                  ))
                navs_sig
            ]
        ]
    ]
    ctx parent

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
          then (
            (* cljs anchors the dots dropdown to the button element,
               not the press point *)
            let ax, atop, abot =
              match
                Option.bind (Web_dom.element_at d.x d.y) (fun hit ->
                    match
                      Web_dom.el_closest hit ".sidebar-page-actions"
                    with
                    | Some btn -> Some btn
                    | None -> Some hit)
              with
              | Some btn -> Popups_state.anchor_of_el btn
              | None -> Popups_state.anchor_at_point ~x:d.x ~y:d.y
            in
            Sidebar_state.open_lp_menu st ~target:lp_ref ~recent ~ax
              ~atop ~abot)
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
    [ link ~url:"#" ~target:`self_ ~style_class:"link-item group"
        ~data_attrs:
          [ ("data-lp-ref", lp_ref)
          ; ("data-lp-recent", if recent then "1" else "0") ]
        [ box ~style_class:"page-icon" [ icon_ "file" ]
        ; text ~style_class:"page-title" ~value:p.Model.page_title []
        (* cljs .sidebar-page-actions dots button inside .link-item —
           its class hooks (sidebar-page-actions, ls-icon-dots) still
           reach the row's target_class check *)
        ; button ~variant:`ghost ~size:`icon
            ~label:(t "ui/show-more")
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
  let cls_sig =
    Signal.map2
      (fun ps collapsed ->
        "sidebar-content-group " ^ class_
        ^ (if ps = [] then "" else " has-children")
        ^ if collapsed then "" else " is-expand")
      items_sig
      (Sidebar_state.group_collapsed_sig st class_)
  in
  Ui_parts.class_signal cls_sig (fun cls -> cls)
    (box ~key
       [ column ~key:(key ^ "-inner")
           ~style_class:"sidebar-content-group-inner"
           [ Ui_parts.pressable
               ~on_press:(fun _ ->
                 Sidebar_state.toggle_group_collapsed st class_)
               (row ~key:(key ^ "-hd") ~cross:`center ~style_class:"hd"
                  [ box ~key:(key ^ "-a") ~style_class:"a"
                      [ box ~style_class:"wrap-th" ~grow:1.
                          [ text ~value:label [] ] ]
                  ; box ~key:(key ^ "-b") ~style_class:"b"
                      [ (* web rotates .more 90deg on .is-expand —
                           backends without transforms swap the icon *)
                         reactive
                           (fun collapsed ->
                             icon_ ~cls:"more" ~size:15
                               (if collapsed
                                   && not (Ui_services.env_css_transform_icons ())
                                then "chevron-down"
                                else "chevron-right"))
                           (Sidebar_state.group_collapsed_sig st class_)
                      ] ])
           ; reactive
               ~equal:(fun a b ->
                 List.map
                   (fun (p : Model.page) -> (p.page_uuid, p.page_title))
                   a
                 = List.map
                     (fun (p : Model.page) -> (p.page_uuid, p.page_title))
                     b)
               (fun ps ->
                 if ps = [] && not always_bd then Logseq_el.nothing
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
let graphs_selector st (ms : Model.t Signal.signal) : t =
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
              (* cljs repo.cljs graphs-selector: repos dropdown flush
                 under the trigger, 4px left of its left edge (measured
                 on the cljs popover) *)
              (* native bounding_rect fires a measure-node dom-op whose
                 node-rect reply lands a tick later — retry while the
                 rect is still empty instead of opening at (0,0);
                 falls back to the raw rect if it never resolves *)
              let rec open_at_rect tries =
                match
                  Web_dom.query_selector ".cp__graphs-selector .item"
                with
                | Some el ->
                    let r = Web_dom.el_bounding_rect el in
                    if Web_dom.rect_width r > 0. || tries <= 0 then
                      Sidebar_state.open_repos_menu st
                        ~x:(Web_dom.rect_left r -. 4.)
                        ~y:(Web_dom.rect_bottom r)
                    else
                      Web_dom.set_timeout
                        (fun () -> open_at_rect (tries - 1))
                        32
                | None -> ()
              in
              open_at_rect 4)
            (row ~key:"gsel-a" ~cross:`center ~grow:1. ~style_class:"item"
               [ row ~key:"gsel-l" ~cross:`center ~gap:4 ~grow:1.
                   [ box ~key:"gsel-th" ~style_class:"thumb"
                       [ icon_ "topology-star" ]
                   ; text ~key:"gsel-n"
                       ~value_signal:(Signal.map name_of ms) [] ]
               ; icon_ ~size:18 "selector" ]) ] ]
;;

let header (ms : Model.t Signal.signal) : t =
  let st = Sidebar_state.ensure ms in
  Logseq_el.fragment [ graphs_selector st ms; nav_group ms st ]

let contents (ms : Model.t Signal.signal) : t =
  let st = Sidebar_state.ensure ms in
  column ~key:"ls-contents" ~style_class:"sidebar-contents-container"
    [ favorites_group st; recents_group st ]

let menus (ms : Model.t Signal.signal) : t =
  let st = Sidebar_state.ensure ms in
  menu_host st
