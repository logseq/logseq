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
module P = Lui_protocol

let t = Sidebar_state.t

(* Container activation must opt into Press as well as pointer details;
   otherwise a passive text or icon leaf can own the native click. *)
let arm_press ~on_press_detail (elem : Lui_elements.t) : Lui_elements.t =
 fun ctx parent ->
  let node = elem ctx parent in
  enable ctx node P.PressEnabled;
  enable ctx node P.PointerEnabled;
  ignore (on_event ctx node
    (function P.PressDetail _ -> true | _ -> false) on_press_detail);
  node


(* Sidebar glyphs use the shared canonical registry and semantic wrapper. *)
let icon_ ?key ?(cls = "") ?(size = 16) ?(attrs = []) ?transition name =
  icon ?key
    ~name:(Icons.name_ref name)
    ~point_size:size
    ~data_attrs:attrs
    ?transition
    ~style_class:("ui__icon" ^ if cls = "" then "" else " " ^ cls)
    []

(* ---------- popup menu helpers ---------- *)

(* Popovers own outside dismissal, Escape and focus return through their
   shared layer lifecycle. Sidebar state only handles the dismiss action. *)
let menu_box ~key ~at ?min_width ~extra_cls ~dismiss children =
  Ui_components.menu_surface (popover ~key ~at ~role:`menu ?min_width ~on_dismiss:dismiss
    ~transition:Ui_components.popover_transition
    ~style_class:("ui__dropdown-menu-content" ^ extra_cls)
    children)

(* combo shortcut inside a menu item (ui/dropdown-shortcut):
   .shui-shortcut-combo.shui-shortcut-glow > kbd*, pushed to the row end
   (cljs ml-auto pl-2) *)
let menu_sc caps =
  row ~key:"sc" ~grow:1. ~main:`end_ ~cross:`center ~padding_horizontal:8
    [ Ui_components.shortcut_combo ~key:"sc-box" ~glow:true
        (List.concat
           (List.mapi
              (fun i cap ->
                (if i > 0 then
                   [ Ui_components.keycap_separator
                       ~key:("sep" ^ string_of_int i) ]
                 else [])
                @ [ Ui_components.keycap ~key:("k" ^ string_of_int i)
                      ~boxed:false ~glow:true ~min_slot:20
                      ~value:(cap) ])
              caps)) ]
;;

(* ---------- nav edit (checkbox) menu ---------- *)

let nav_labels =
  [ ("flashcards", "nav/flashcards")
  ; ("all-pages", "nav.all-pages/label")
  ; ("tag/tasks", "nav/tasks")
  ; ("tag/assets", "nav/assets")
  ]

let nav_edit_menu st =
  (* menu_item carries the checkbox state via ~checked_signal; role /
     aria-checked ride data_attrs so the e2e
     `[role='menuitemcheckbox'][aria-checked]` hook sees them *)
  let mk (nav, label) =
    Menu_item.chrome (menu_item ~key:("cb-" ^ nav) ~style_class:"ui__dropdown-menu-item"
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
      [])
  in
  box ~key:"nav-edit-menu"
    [ menu_box ~key:"menu-box" ~extra_cls:"" ~at:(16., 96.)
        ~min_width:180 ~dismiss:(fun _ -> Sidebar_state.close_menu st)
        (List.map mk nav_labels) ]

(* ---------- plugins dropdown (toolbar-plugins-manager) ---------- *)

let plugins_menu st =
  let owner =
    (Signal.signal_owner (Signal.value st.Sidebar_state.open_menu))
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
                 []
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
        ~at:(Ui_services.dom_viewport_width () -. 216., 64.)
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
         ([ icon_ ~attrs:[ ("style", "padding-right:4px") ] icon_name
          ; text ~value:label [] ]
         @ (match caps with [] -> [] | _ -> [ menu_sc caps ])))
  in
  match !Sidebar_state.lp_ctx with
  | None -> spacer ~key:"lp-none" []
  | Some (target, recent, ax, atop, abot) ->
      let items =
        (if recent then []
         else
           [ item (t "page/unfavorite") "star-off" [ {js|⌘|js}; {js|⇧|js}; "F" ]
               (fun () ->
                 if Wire.is_uuid_string target then
                   Sidebar_state.unfavorite st target) ])
        @ [ item (t "sidebar.right/open") "layout-sidebar-right"
              [ {js|⇧|js}; "Click" ]
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
             (Ui_services.dom_viewport_width () -. (w /. 2.) -. 5.))
      in
      popover ~key:"lp-menu" ~at:(x, if flip then atop else abot)
        ~role:`menu
        ~transition:Ui_components.popover_transition
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
let repos_menu_content st (m : Model.t) : t =
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
      let local_names = List.map Graphs_view.short_name m.Model.repos in
      List.filter
        (fun (n, _, _, _) -> not (List.mem n local_names))
        !Graphs_ops.remote_graphs
    else []
  in
  let switch_repos =
    List.sort by_seen
      (List.filter (fun r -> r <> cur) m.Model.repos)
  in
  let n_repos = List.length m.Model.repos + List.length remote in
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
    Ui_components.with_props
      [ Ui_components.Prop.opacity 0.7
      ; Ui_components.Prop.hover_opacity 0.9 ]
      (Ui_components.button ~key ~variant:`ghost ~size:`sm
      ~label ~height:32 ~corner_radius:4 ~main:`start ~gap:6
      ~on_press:(fun _ ->
        close ();
        act ())
        [ icon_ ~size:18 icn; text ~key:"t" ~value:label [] ])
  in
  column ~key:"wrap"
        [ (if n_repos <= 1 then Logseq_el.nothing
           else
             Ui_components.with_props
               [ Ui_components.Prop.font_size "0.875rem"
               ; Ui_components.Prop.font_weight 500 ]
               (row ~key:"hd" ~main:`space_between ~cross:`center
                  ~padding:8 ~opacity:0.5
                  [ Ui_components.with_props [Ui_components.Prop.padding_bottom 4]
                      (text ~key:"h4" ~value:(I18n.t "graph.switch/prompt") []) ]))
        ; (if n_repos <= 1 then Logseq_el.nothing
           else
             scroll ~key:"lst" ~orientation:`vertical ~max_height:320
               ~margin_horizontal:(-8)
               [Ui_components.with_props [Ui_components.Prop.padding_bottom 8]
                 (column ~padding_horizontal:8
                   (List.map repo_item switch_repos @ List.map remote_item remote))])
        ; (if n_repos <= 1 then Logseq_el.nothing else
             box ~key:"qa-separator" ~height:1 ~margin_horizontal:(-8)
               ~background:"hsl(var(--border))" [])
        ; Ui_components.with_props
            [ Ui_components.Prop.padding_top 12
            ; Ui_components.Prop.padding_right 8
            ; Ui_components.Prop.padding_bottom 6
            ; Ui_components.Prop.padding_left 4 ]
          (column ~key:"qa" ~margin_horizontal:(-8)
            ~margin_top:(if n_repos<=1 then -6 else 0)
            [ action "qa-new" (I18n.t "graph/create-db") "database-plus"
                (fun () -> Dialogs_state.open_ "new-graph")
            ; action "qa-imp" (I18n.t "import/notes") "database-import"
                (fun () -> Ui_services.nav_set_hash "#/import")
            ; action "qa-all" (I18n.t "graph/all-graphs") "layout-2" (fun () ->
                  Ui_services.nav_set_hash
                    (Runtime.nav_hash "#/graphs")) ]) ]

let repos_menu st (ms : Model.t Signal.signal) : t =
  Ui_components.menu_surface (popover ~key:"repos-menu" ~anchor:`below ~anchor_alignment:`start
    ~anchor_offset:0. ~role:`menu ~min_width:300 ~max_width:400
    ~padding_horizontal:8
    ~transition:Ui_components.popover_transition
    ~on_dismiss:(fun _ -> Sidebar_state.close_menu st)
    ~style_class:"ui__dropdown-menu-content repos-list"
    [ reactive
        ~equal:(fun (a : Model.t) b -> a.repo=b.repo && a.repos=b.repos)
        (repos_menu_content st) ms ])

let menu_host st =
 fun ctx parent ->
  (reactive
    (fun menu ->
      match menu with
      | "nav-edit" -> nav_edit_menu st
      | "plugins" -> plugins_menu st
      | m when String.length m > 3 && String.sub m 0 3 = "lp-" ->
          lp_menu st
      | _ -> Logseq_el.nothing)
    (Signal.value st.Sidebar_state.open_menu))
    ctx parent

(* ---------- navigations ---------- *)

(* cljs shui/shortcut separate-keys: space-separated bindings render one
   kbd per key inside .shui-shortcut-separate *)
let shortcut_hint hov binding =
  let keys = String.split_on_char ' ' binding in
  row ~key:("sc-" ^ binding) ~cross:`center
    [ row ~key:"wrap" ~style_class:"keyboard-shortcut" ~cross:`center
        ~display:`inline_flex ~gap:2 ~margin_left:4 ~margin_right:8
        ~opacity_signal:
          (Signal.map (fun h -> if h then 1. else 0.) (Signal.value hov))
        [ Ui_components.shortcut_separate ~key:"sep" ~glow:false
            (List.mapi
               (fun i k ->
                 Ui_components.keycap ~key:("k" ^ string_of_int i)
                   ~boxed:true ~glow:true ~min_slot:20
                   ~value:((String.uppercase_ascii k)))
               keys) ] ]

(* cljs sidebar-item: wrapper div gets the nav class (+ `active`), the
   inner `a.item` also gets `active` when the route matches *)
let nav_link ~sched ~key ~class_ ~active ~title ~icon_name ?shortcut ~on_click
    ?(more = Logseq_el.nothing) () =
  let act = if active then " active" else "" in
  let hov = Signal.state sched false in
  let tail =
    match shortcut with Some s -> [ shortcut_hint hov s ] | None -> []
  in
  box ~key ~style_class:(class_ ^ act)
    [ Ui_parts.pressable ~on_press:(fun _ -> on_click ())
        (Ui_components.with_props
           [ Ui_components.Prop.cursor `pointer
           ; Ui_components.Prop.font_size "0.875rem"
           ; Ui_components.Prop.font_weight 500
           ; Ui_components.Prop.line_height "1rem"
           ; Ui_components.Prop.opacity 0.8
           ; Ui_components.Prop.hover_opacity 1.
           ; Ui_components.Prop.hover_background
               "var(--lx-gray-04, \
                var(--ls-quaternary-background-color))" ]
           (row ~cross:`center ~corner_radius:6 ~height:32
              ~style_class:("item group" ^ act)
              ~padding_horizontal:2
              ~on_pointer_enter:(fun _ ->
                Signal.set hov true;
                Runtime.flush ())
              ~on_pointer_leave:(fun _ ->
                Signal.set hov false;
                Runtime.flush ())
              ?background:
                (if active then
                   Some "var(--lx-gray-04, var(--ls-quaternary-background-color))"
                 else None)
              ~data_attrs:
                [ ( "style"
                  , "padding-left:6px;padding-right:2px" ) ]
              ([ Ui_components.with_props
                   [ Ui_components.Prop.margin_left 4
                   ; Ui_components.Prop.margin_right 8 ]
                   (icon_ icon_name)
               ; text ~grow:1. ~white_space:"nowrap" ~text_overflow:"ellipsis" ~value:title [] ]
              @ tail @ [ more ]))) ]

let nav_route ~sched ~class_ ~active ~title ~icon_name ?shortcut hash =
  nav_link ~sched ~key:("nl-" ^ class_) ~class_ ~active ~title ~icon_name
    ?shortcut
    ~on_click:(fun () ->
      Ui_services.nav_set_hash (Runtime.nav_hash hash);
      Ui_services.dom_dispatch "ls:navigate")
    ()

let tag_nav ~sched ~active_route class_ label titles =
  match List.assoc_opt class_ titles with
  | Some title ->
      Some
        (nav_link ~sched ~key:("tag-" ^ class_) ~class_:("tag-view-nav " ^ class_)
           ~active:(active_route = Model.Page title)
           ~title:(t label) ~icon_name:"hash"
           ~on_click:(fun () -> Sidebar_state.navigate_to_page title)
           ())
  | None -> None

let due_count_badge () =
  reactive
    (fun (n : int) ->
      if n > 0 then
        text ~value:(string_of_int n) ~margin_left:4 ~padding_horizontal:12
          ~padding_vertical:2 ~font_size:"0.75rem" ~font_weight:500 ~corner_radius:9999
          []
      else Logseq_el.nothing)
    (Cards_state.Due_count.signal ())

(* active nav per route — cljs sidebar-navigations-loaded *)
let nav_items ~sched ~active_route (checked, tag_titles) =
  List.filter_map
    (fun nav ->
      match nav with
      | "flashcards" -> (
          (* cljs: hidden unless :feature/enable-flashcards?, and a
             due-count pill rides the item *)
          let on = Settings_state.config_bool "feature/enable-flashcards?" ~default:true in
          if not on then None
          else
            Some
              (nav_link ~sched ~key:"nl-flashcards" ~class_:"flashcards-nav"
                 ~active:false ~title:(t "nav/flashcards") ~icon_name:"cards"
                 ~shortcut:"g f"
                 ~on_click:(fun () ->
                   Cards_state.update_due_count ();
                   Sidebar_state.open_cards ())
                 ~more:(due_count_badge ())
                 ()))
      | "all-pages" ->
          Some
            (nav_route ~sched ~class_:"all-pages-nav"
               ~active:(active_route = Model.All_pages) ~title:(t "nav.all-pages/label")
               ~icon_name:"files" "#/all-pages")
      | "tag/tasks" -> tag_nav ~sched ~active_route "tasks" "nav/tasks" tag_titles
      | "tag/assets" ->
          tag_nav ~sched ~active_route "assets" "nav/assets" tag_titles
      | _ -> None)
    checked

let nav_group ms st =
 fun ctx parent ->
  (* sidebar badge cell — idle until the nav mounts it *)
  Cards_state.Due_count.mount ctx 0;
  if not (Cards_state.Due_count.ready ()) then ()
  else Cards_state.update_due_count ();
  let nav_hov = Signal.state ctx.Lui_ui.ui_scheduler false in
  box ~key:"nav-group" ~padding_horizontal:12
    ~style_class:"sidebar-content-group is-expand"
    [ column ~key:"nav-inner" ~style_class:"sidebar-content-group-inner"
        [ Ui_components.with_props
            [ Ui_components.Prop.inset_top (-4.)
            ; Ui_components.Prop.z_index 2
            ; Ui_components.Prop.user_select `none
            ; Ui_components.Prop.cursor `default ]
            (row ~key:"nav-hd" ~cross:`center ~main:`space_between
               ~data_attrs_signal:
                 (Signal.constant ctx.Lui_ui.ui_scheduler
                    [ ("style", "position:sticky;top:-4px") ])
               ~height:32 ~corner_radius:6 ~padding_horizontal:4
               ~on_pointer_enter:(fun _ ->
                 Signal.set nav_hov true;
                 Runtime.flush ())
               ~on_pointer_leave:(fun _ ->
                 Signal.set nav_hov false;
                 Runtime.flush ())
               ~style_class:"hd non-collapsable enter-show-more"
               ~data_attrs:
                 [ ("style", "padding-left:8px;padding-right:4px") ]
               [ box ~key:"nav-name" ~style_class:"a" ~margin_left:4
                   [ Ui_components.with_props
                       [ Ui_components.Prop.font_size "0.875rem"
                       ; Ui_components.Prop.line_height "1.25rem"
                       ; Ui_components.Prop.font_weight 500 ]
                       (row ~cross:`center ~grow:1. ~opacity:0.5
                          ~style_class:"wrap-th"
                          [ (* web .wrap-th > .lui-text: sm:text-xs
                               (12px/16px) — the smaller label reads
                               as a section header, not a button *)
                            text ~font_size:"0.75rem"
                              ~line_height:"1rem"
                              ~value:(t "sidebar.left/navigations") [] ]) ]
               ; box ~key:"nav-more" ~style_class:"b"
                   ~width:28 ~height:32 ~main:`center
                   ~opacity_signal:
                     (Signal.map
                        (fun h -> if h then 0.8 else 0.)
                        (Signal.value nav_hov))
                   ~transition:"opacity 0.15s"
                   [ Ui_parts.pressable
                       ~on_press:(fun _ ->
                         Sidebar_state.toggle_menu st "nav-edit")
                       (Ui_components.with_props
                          [ Ui_components.Prop.position `relative
                          ; Ui_components.Prop.inset_top (-2.)
                          ; Ui_components.Prop.opacity 0.8 ]
                          (row ~style_class:"as-edit"
                             [ Ui_components.with_props
                                 [ Ui_components.Prop.margin_left 7 ]
                                 (icon_ ~size:14 "filter-edit") ])) ] ])
        ; box ~key:"nav-bd" ~style_class:"bd"
            [ reactive
                ~equal:(fun ((a : Model.t),checked_a,tags_a) ((b : Model.t),checked_b,tags_b) ->
                  a.route=b.route && a.graph_config=b.graph_config
                  && checked_a=checked_b && tags_a=tags_b)
                (fun (model : Model.t) checked tag_titles ->
                  let route=model.route in
                  column ~key:"navs" ~gap:2 ~margin_top:4
                    ~style_class:"sidebar-navigations"
                    ~data_attrs:[ ("style", "margin-top:4px") ]
                    (* cljs journals item navigates on click; its anchor
                       carries no href. go-to-journals! targets
                       #/all-journals when a default-home page owns #/ *)
                    ((nav_link ~sched:ctx.Lui_ui.ui_scheduler ~key:"nl-journals"
                       ~class_:"journals-nav"
                       ~active:(route = Model.Journals || route = Model.Home)
                       ~title:(t "nav/journals") ~icon_name:"calendar"
                       ~shortcut:"g j"
                       ~on_click:(fun () ->
                         ignore
                           (Js.Promise.then_
                              (fun (h, _) ->
                                Ui_services.nav_set_hash
                                  (Runtime.nav_hash h);
                                Ui_services.dom_dispatch "ls:navigate";
                                Router.scroll_to_top ();
                                Js.Promise.resolve ())
                              (Router.go_to_journals_target ())))
                       ())
                    :: nav_items ~sched:ctx.Lui_ui.ui_scheduler ~active_route:route
                         (checked, tag_titles)
                  ))
                ms (Signal.value st.Sidebar_state.nav_checked) (Signal.value st.nav_tag_titles)
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
  (* Keep navigation and the menu as sibling interaction targets. Click
     details bubble on both hosts, so the row wrapper must stay passive.
     The data-lp-* attributes also feed the document context-menu handler. *)
  let open_lp d =
    (* cljs anchors the dots dropdown to the button element,
       not the press point *)
    let ax, atop, abot =
      match
        Option.bind (Ui_services.dom_element_at d.Lui_protocol.x d.y)
          (fun hit ->
            match hit.Ui_services.closest ".sidebar-page-actions" with
            | Some btn -> Some btn
            | None -> Some hit)
      with
      | Some btn -> Popups_state.anchor_of_el btn
      | None ->
        Popups_state.anchor_at_point ~x:d.Lui_protocol.x ~y:d.y
    in
    Sidebar_state.toggle_lp_menu st ~target:lp_ref ~recent ~ax ~atop
      ~abot
  in
  let go_page shift =
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
  in
  Ui_components.with_props
    ([ Ui_components.Prop.font_weight 500
     ; Ui_components.Prop.cursor `pointer ]
     @ if recent then [ Ui_components.Prop.user_select `none ] else [])
    (column ~key ~style_class:li_class
    [ Ui_components.with_props
        [ Ui_components.Prop.position `relative
        ; Ui_components.Prop.opacity 0.8
        ; Ui_components.Prop.hover_opacity 1.
        ; Ui_components.Prop.hover_background
            "var(--lx-gray-04, var(--ls-quaternary-background-color))" ]
        (arm_press ~on_press_detail:(fun ev ->
             match ev with
             | Lui_protocol.PressDetail (_, d) ->
                 go_page (d.Lui_protocol.modifiers land 2 <> 0)
             | _ -> ())
          (row ~cross:`center ~main:`space_between
           ~style_class:"link-item group"
           ~height:32 ~padding_horizontal:8 ~corner_radius:6
           ~data_attrs:
             [ ("data-lp-ref", lp_ref)
             ; ("data-lp-recent", if recent then "1" else "0")
             ; ( "style"
               , "display:flex;align-items:center;justify-content:\
                  space-between;height:32px;padding:0 8px;\
                  border-radius:6px" ) ]
           [ row ~cross:`center ~style_class:"page-icon" ~margin_right:4
               [ Icon_picker.page_icon_el ~size:16. p ]
           ; text ~style_class:"page-title" ~value:p.Model.page_title
               ~white_space:"nowrap" ~text_overflow:"ellipsis" ~grow:1.
               ~line_height:"1.25rem"
               ~data_attrs:[ ("style", "overflow:hidden;padding-right:32px") ]
               [] ]))
        (* The menu button is outside the navigation target. *)
        ; Ui_components.with_props
            [ Ui_components.Prop.position `absolute
            ; Ui_components.Prop.inset_top 0.
            ; Ui_components.Prop.inset_right 4.
            ; Ui_components.Prop.cursor `pointer
            ; Ui_components.Prop.user_select `none
            ; Ui_components.Prop.opacity 0.4
            ; Ui_components.Prop.hover_opacity 0.8
            ; Ui_components.Prop.pressed_opacity 1.
            ; Ui_components.Prop.disabled_opacity 0.5
            ; ( Ui_components.Prop.hover_background "hsl(var(--secondary) / 0.7)" )
            ; ( Ui_components.Prop.hover_foreground "hsl(var(--secondary-foreground))" )
            ; ( Ui_components.Prop.focus_shadow "0 0 0 2px hsl(var(--ring))" ) ]
            (Ui_components.button ~variant:`ghost ~size:`icon
               ~label:(t "ui/show-more")
               ~width:28 ~height:28 ~padding_vertical:4 ~corner_radius:4
               ~padding_horizontal:6
               ~style_class:"sidebar-page-actions ui__button"
               (* The detail handler anchors the menu. *)
               ~on_press:(fun _ -> ())
               ~on_press_detail:(fun ev ->
                 match ev with
                 | Lui_protocol.PressDetail (_, d) -> open_lp d
                 | _ -> ())
               ~data_attrs:
                 [ ("style", "transform:scale(0.75);font-size:0.875rem") ]
               [ Icons.icon ~size:18. "dots" ])
        ])

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
               (Ui_components.with_props
                  [ Ui_components.Prop.inset_top (-4.)
                  ; Ui_components.Prop.z_index 2
                  ; Ui_components.Prop.user_select `none
                  ; Ui_components.Prop.cursor `pointer ]
                  (row ~key:(key ^ "-hd") ~cross:`center
                        ~main:`space_between ~height:32 ~corner_radius:6
                        ~padding_horizontal:4
                        ~style_class:"hd"
                     ~data_attrs:
                       [ ( "style"
                         , "position:sticky;top:-4px;padding-left:8px;\
                            padding-right:4px" )
                       ]
                     [ box ~key:(key ^ "-a") ~style_class:"a" ~margin_left:4
                         [ Ui_components.with_props
                             [ Ui_components.Prop.font_size "0.875rem"
                             ; Ui_components.Prop.line_height "1.25rem"
                             ; Ui_components.Prop.font_weight 500 ]
                             (row ~cross:`center ~grow:1. ~opacity:0.5
                                ~style_class:"wrap-th"
                                [ (* web .wrap-th > .lui-text:
                                     sm:text-xs (12px/16px) *)
                                  text ~font_size:"0.75rem"
                                    ~line_height:"1rem"
                                    ~value:label [] ]) ]
                     ; box ~key:(key ^ "-b") ~style_class:"b"
                         ~width:28 ~height:32 ~main:`center
                         ~opacity:0.4 ~transition:"opacity 0.15s"
                         [ (* web rotates .more 90deg on .is-expand —
                              backends without transforms swap the icon *)
                            reactive
                              (fun collapsed ->
                                icon_ ~cls:"more" ~size:15
                                  ~transition:"transform 0.2s"
                                  ~attrs:
                                    [ ( "style"
                                      , "margin-left:2.5px;margin-right:10.5px"
                                      )
                                    ]
                                  (if
                                     Ui_services.env_css_transform_icons ()
                                     || collapsed
                                   then "chevron-right"
                                   else "chevron-down"))
                              (Sidebar_state.group_collapsed_sig st class_)
                         ] ]))
           ; if_ ~test:(reactive (fun groups -> not (List.mem class_ groups))
                         (Signal.value st.Sidebar_state.groups_collapsed))
             (reactive
               (fun ps ->
                 if ps = [] && not always_bd then Logseq_el.nothing
                 else
                   box ~key:(key ^ "-bd") ~style_class:"bd"
                     ~data_attrs:[ ("style", "overflow-y:auto") ]
                     [ (list ~key:(key ^ "-ul") ~style_class:ul_class
                         ~data_attrs:
                           [ ( "style"
                             , "list-style:none;padding:0;margin:0;\
                                font-size:0.875rem" ) ]
                         (List.map
                            (fun p ->
                              page_item_el st p ~li_class ~recent
                                ~key:
                                  (key ^ "-"
                                   ^ Option.value p.Model.page_uuid
                                       ~default:p.Model.page_title))
                            ps)) ])
               items_sig)
           ]
       ])

let favorites_group st =
  content_group st ~key:"fav" ~class_:"favorites" ~label:(t "sidebar.left/favorites")
    ~items_sig:(Signal.value st.Sidebar_state.favorites)
    ~ul_class:"favorites" ~always_bd:false
    ~li_class:"favorite-item" ~recent:false

let recents_group st =
  content_group st ~key:"recent" ~class_:"recent"
    ~label:(t "sidebar.left/recent-pages")
    ~items_sig:(Signal.value st.Sidebar_state.recents)
    ~ul_class:"" ~always_bd:true
    ~li_class:"recent-item" ~recent:true

(* cljs plugins.cljs hook-ui-items :toolbar — the puzzle trigger lives
   in the header .ui-items-container. cljs gates it on (seq toolbar
   items); the e2e lifecycle test also clicks it right after disabling
   the last toolbar plugin, so we additionally keep it while at least
   one plugin is installed (cljs keeps :plugin/installed-plugins entries
   for disabled plugins). Click opens the plugins dropdown. *)
let plugins_toolbar (ms : Model.t Signal.signal) : t =
  let st = Sidebar_state.ensure ms in
  let owner =
    (Signal.signal_owner (Signal.value st.Sidebar_state.open_menu))
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
            [ box ~key:"ui-items-wrap"
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
  box ~key:"gsel" ~padding_horizontal:12
    [ row ~key:"gsel-box" ~cross:`center ~main:`space_between
        ~style_class:"cp__graphs-selector"
        (* data-tooltip="" suppresses the hover tooltip: the service
           otherwise falls back to this button's required aria-label,
           and master shows no tooltip on the selector *)
        [ Ui_components.with_props
            [ Ui_components.Prop.position `relative
            ; Ui_components.Prop.overflow `hidden
            ; Ui_components.Prop.padding_right 16
            ; Ui_components.Prop.opacity 0.9
            ; Ui_components.Prop.hover_opacity 0.9
            ; Ui_components.Prop.hover_background "var(--lx-gray-04)"
            ; Ui_components.Prop.hover_foreground "hsl(var(--foreground))"
            ; Ui_components.Prop.pressed_opacity 0.7 ]
            (Ui_components.button ~key:"gsel-a" ~variant:`ghost ~grow:1. ~height:32
               ~label:(t "graph.switch/select-prompt")
               ~foreground:"hsl(var(--foreground))"
               ~main:`start ~cross:`center
               ~padding_horizontal:4 ~padding_vertical:4 ~corner_radius:4
               ~style_class:"item"
               ~data_attrs:(reactive (fun menu _model ->
                   [ ("data-tooltip", ""); ("aria-haspopup", "menu")
                   ; ("aria-expanded", string_of_bool (menu = "repos")) ])
                   (Signal.value st.Sidebar_state.open_menu) ms)
               ~on_press:(fun _ ->
                 (* the trigger is inside the popover layer's owned set,
                    so its presses never hit outside-dismiss — a plain
                    toggle is the whole open/close contract *)
                 Runtime.signal_set st.Sidebar_state.open_menu
                   (if Runtime.signal_get st.open_menu = "repos" then ""
                    else "repos"))
                  [ Ui_components.with_props
                        [ Ui_components.Prop.overflow `hidden ]
                      (row ~key:"gsel-th" ~cross:`center ~main:`center
                          ~width:24 ~min_width:24 ~height:24 ~opacity:0.8
                          ~background:"var(--lx-gray-04)" ~corner_radius:2
                          ~style_class:"thumb" ~margin_left:(-2)
                          [ Ui_components.with_props
                              [ Ui_components.Prop.margin_right 0
                              ; Ui_components.Prop.opacity 0.7 ]
                              (icon_ "topology-star") ])
                  ; Ui_components.with_props
                      [ Ui_components.Prop.overflow `hidden
                      ; Ui_components.Prop.padding_left 4
                      ; Ui_components.Prop.padding_right 16
                      ; Ui_components.Prop.min_width 0 ]
                      (text ~key:"gsel-n"
                          ~white_space:"nowrap" ~text_overflow:"ellipsis"
                          ~font_weight:500 ~font_size:"var(--text-sm)"
                          ~line_height:"1.25rem"
                          ~value:(reactive name_of ms) ~grow:1. [])
                  ; Ui_components.with_props
                          [ Ui_components.Prop.position `absolute
                          ; Ui_components.Prop.inset_right 4.
                          ; Ui_components.Prop.inset_top 8.
                          ; Ui_components.Prop.width 16
                          ; Ui_components.Prop.height 16
                          ; Ui_components.Prop.margin_right 0
                          ; Ui_components.Prop.opacity 0.4 ]
                          (icon_ ~size:18 "selector") ])
        ; if_ ~test:(reactive (fun menu -> menu = "repos") (Signal.value st.Sidebar_state.open_menu))
            (repos_menu st ms)
        ] ]
;;

let contents (ms : Model.t Signal.signal) : t =
  let st = Sidebar_state.ensure ms in
  Ui_components.with_props [ Ui_components.Prop.position `relative ]
    (column ~key:"ls-contents" ~gap:4 ~padding_horizontal:12
       ~padding_vertical:4
       ~style_class:"sidebar-contents-container"
       ~data_attrs:
         [ ( "style"
           , "padding-top:4px;height:100%;overflow-x:hidden;overflow-y:auto"
           )
         ]
       [ favorites_group st; recents_group st ])

let menus (ms : Model.t Signal.signal) : t =
  let st = Sidebar_state.ensure ms in
  menu_host st
