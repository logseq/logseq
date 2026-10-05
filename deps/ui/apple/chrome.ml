(* ported from deps/ui/src/shell/chrome.ml — see apple/NOTES.md *)
(* App chrome — mirrors components/container.cljs shell:

   <main#app-container-wrapper.theme-container-inner>
     <button#skip-to-main>
     <div#app-container>
       <div#left-container>
         <header#head .cp__header> ... nav buttons ... </header>
         <div#main-container .cp__sidebar-main-layout>
           <div#main-content-container .scrollbar-spacing>
             <div .cp__sidebar-main-content> [page] </div>
           </div>
         </div>
       </div>
     </div>
   </main>
*)

open Lui_elements


let skip_to_main =
  button ~key:"skip" ~accessibility_identifier:"skip-to-main"
    ~text:(I18n.t "nav/skip-to-main-content") []

(* ---- native topbar (Out parity) ----

   LUI `toolbar` elements with `placement` hoist into the real macOS
   window toolbar, where macOS 26 draws its liquid-glass items — the
   same chrome Out gets from ToolbarItem groups. Leading (.navigation)
   matches Out: sidebar toggle, back/forward, home, then the "›"
   breadcrumb + current page title. Trailing (.primary-action) is
   search first, then page-menu dots and the right-sidebar toggle
   (Out's Aa font menu has no Logseq counterpart). The DOM .cp__header
   is gone; rtc/plugin toolbar items keep hidden DOM mounts below so
   their emitters stay live. *)

(* Hoisted toolbar items read as native circular buttons (macOS 26
   liquid-glass circles, like Notes/Safari) — the LUI surface draws a
   glassEffect capsule for background "glass" with a pill corner
   radius, and the toolbar anchor hides the item's shared background
   for nodes that own a capsule. A square 30pt frame keeps the capsule
   a circle. *)
let tb_circle ~key ?(acc = "") ~icon ~label ?disabled_signal
    ?foreground_signal on_press =
  button ~key ~icon ~label ~variant:`ghost
    ~background:"glass" ~corner_radius:999 ~width:30 ~height:30
    ~accessibility_identifier:(if acc = "" then key else acc)
    ?disabled_signal ?foreground_signal
    ~on_press:(fun _ -> on_press ()) []

(* the DOM header's search button opened via the cmdk DOM-click
   handler; the semantic button calls the palette opener directly
   (Action.Toggle_search is a no-op reducer on native) *)
let search_btn =
  tb_circle ~key:"search-btn" ~acc:"search-button" ~icon:`search
    ~label:"Search" (fun () -> Cmdk_state.open_latest ())

(* cljs anchors the dropdown to the trigger's right edge. The dots sits
   in the hoisted window toolbar, whose items' reported frames are in
   the toolbar's own coordinate space — unreliable — so the anchor is
   the fixed trailing position: menu right edge just left of the last
   button, just under the toolbar. The resolved anchor is recorded in
   Dom_ext.toolbar_dots_pos for the appearance item, which re-anchors
   to the same trigger. *)
let dots_btn =
  button ~key:"dots-btn" ~icon:`ellipsis ~label:"Page Menu"
    ~variant:`ghost ~background:"glass" ~corner_radius:999 ~width:30
    ~height:30 ~accessibility_identifier:"toolbar-dots-btn"
    ~on_press:(fun _ ->
      let pos =
        Some (Dom_ext.window_inner_width () -. 48., 48.)
      in
      Dom_ext.toolbar_dots_pos := pos;
      Runtime.send
        (Action.Page_menu_set
           (Option.map (fun (x, y) -> (x, y, true, None)) pos)))
    []

(* Out puts back/forward in the navigation group; the native hash
   router keeps a real in-memory stack (platform.ml) so these are
   functional — disabled at the stack edges. *)
let back_btn ms =
  button ~key:"nav-back" ~icon:`chevron_left ~label:"Go Back"
    ~variant:`ghost ~background:"glass" ~corner_radius:999 ~width:30
    ~height:30 ~accessibility_identifier:"nav-back"
    ~disabled_signal:
      (Signal.map
         (fun (_ : Model.t) -> not (Platform.can_history_back ()))
         ms)
    ~on_press:(fun _ -> Platform.history_back ()) []

let forward_btn ms =
  button ~key:"nav-fwd" ~icon:`chevron_right ~label:"Go Forward"
    ~variant:`ghost ~background:"glass" ~corner_radius:999 ~width:30
    ~height:30 ~accessibility_identifier:"nav-fwd"
    ~disabled_signal:
      (Signal.map
         (fun (_ : Model.t) -> not (Platform.can_history_forward ()))
         ms)
    ~on_press:(fun _ -> Platform.history_forward ()) []

(* cljs header.cljs hides home on the :home route; a toolbar can't host
   a dyn-wrapped child (it hoists as a zero-size item), so the button
   stays and the press no-ops there *)
let home_btn ms =
  button ~key:"home-btn" ~icon:(`app "home") ~label:"Home"
    ~variant:`ghost ~background:"glass" ~corner_radius:999 ~width:30
    ~height:30 ~accessibility_identifier:"home-btn"
    ~on_press:(fun _ ->
      match (Signal.get ms).Model.route with
      | Model.Home -> ()
      | _ ->
          Platform.set_location_hash "#/";
          Platform.dispatch "ls:navigate" Js.Json.null)
    []

(* Out's breadcrumb: "›" + current page/collection title inside the
   navigation group. A toolbar child must be a concrete element (a dyn
   hoists zero-size), so the text rides a reactive text signal. *)
let crumb_title ms =
  text ~key:"tb-crumb" ~style_class:"ls-tb-crumb"
    ~value:
      (reactive
         (fun (m : Model.t) ->
           let label =
             match m.route_page with
             | Some p when p.Model.page_title <> "" -> p.page_title
             | _ -> (
               match m.route with
               | Model.Home -> ""
               | Model.Journals -> I18n.t "nav/journals"
               | Model.All_pages -> I18n.t "nav.all-pages/title"
               | Model.Settings -> I18n.t "nav/settings"
               | Model.Graph_view -> I18n.t "nav/graph-view"
               | Model.All_graphs -> I18n.t "graph/all-graphs"
               | Model.Library -> I18n.t "library/title"
               | Model.Import -> I18n.t "import/title"
               | Model.Not_found _ -> I18n.t "page/not-found-title"
               | Model.Page _ | Model.Block_zoom _ -> "")
           in
           if label = "" then "" else "›  " ^ label)
         ms)
    []

(* cljs open-right-sidebar! seeds a "contents" item when the sidebar
   is empty (state/sidebar-add-content-when-open!) *)
let right_toggle_btn ms =
  tb_circle ~key:"rs-toggle" ~icon:`panel_right ~label:"Toggle Right Sidebar"
    (fun () ->
      Runtime.send Action.Toggle_right_sidebar;
      Sidebar_state.ensure_contents (Sidebar_state.ensure ms))

(* rtc status as a toolbar item: a ghost cloud button — Apple toolbars
   carry status items as their own spaced items, not fused capsules.
   Dimmed while sync is off, accent while queueing (the .cp__rtc-sync
   CSS states don't map onto native). *)
let rtc_item (ms : Model.t Signal.signal) : t =
  tb_circle ~key:"rtc-tb" ~icon:(`app "cloud")
    ~label:"Sync Status" ~acc:"rtc-sync"
    ~disabled_signal:
      (Signal.map
         (fun (m : Model.t) ->
           match m.Model.rtc with
           | Some r when Platform.online () && r.rtc_lock -> false
           | _ -> true)
         ms)
    ~foreground_signal:
      (Signal.map
         (fun (m : Model.t) ->
           match m.Model.rtc with
           | Some r when
               Platform.online () && r.rtc_lock
               && (r.rtc_pending_local > 0 || r.rtc_pending_asset > 0
                  || r.rtc_pending_server > 0) ->
               "accent"
           | _ -> "secondary")
         ms)
    (fun () -> ())

(* Out's navigation group: system sidebar toggle (NavigationSplitView
   supplies it), ‹ › nav, home, › + title. The trailing controls ride
   one hoisted toolbar separated by flexible spacers — independent
   items spread across the bar (Safari/Notes-style), not a packed
   cluster at the right edge. *)
let topbar (ms : Model.t Signal.signal) : t list =
  [ toolbar ~key:"tb-leading" ~placement:"navigation"
      ~label:"Window Toolbar"
      [ back_btn ms; forward_btn ms; home_btn ms; crumb_title ms ]
  ; toolbar ~key:"tb-trailing" ~placement:"primary-action"
      ~label:"Toolbar Actions"
      [ spacer ~key:"tb-s0" []
      ; rtc_item ms
      ; spacer ~key:"tb-s1" []
      ; search_btn
      ; spacer ~key:"tb-s2" []
      ; dots_btn
      ; spacer ~key:"tb-s3" []
      ; right_toggle_btn ms ]
  ]

(* components/rtc/indicator.cljs — cloud status button + hidden rtc-tx
   element the e2e reads EDN from. Visible once the worker broadcasts
   rtc-sync-state (i.e. sync is running on the current graph). *)
let rtc_tx_text (r : Model.rtc) =
  let tx = function Some n -> string_of_int n | None -> "nil" in
  Printf.sprintf "{:local-tx %s, :remote-tx %s}"
    (tx r.rtc_local_tx) (tx r.rtc_remote_tx)

(* TODO(component): the rtc indicator stays dom — its hidden rtc-tx
   element (data-testid) is an e2e EDN contract and the mount keeps the
   sync emitters alive; the semantic toolbar twin is rtc_item *)
let rtc_indicator (ms : Model.t Signal.signal) : t =
  reactive (fun (r : Model.rtc option) ->
      match r with
      | None -> spacer ~key:"rtc-off" ~style_class:"hidden" []
      | Some r ->
          let open_ = Platform.online () && r.rtc_lock in
          let syncing = open_ && r.rtc_pending_server > 0 in
          let idle =
            open_ && r.rtc_pending_local = 0
            && r.rtc_pending_asset = 0 && r.rtc_pending_server = 0
          in
          let queuing =
            r.rtc_pending_local > 0 || r.rtc_pending_asset > 0
          in
          let cls =
            "cloud ui__button"
            ^ (if open_ then " on" else "")
            ^ (if syncing then " syncing" else "")
            ^ (if idle then " idle" else "")
            ^ (if queuing then " queuing" else "")
          in
          Logseq_dom.dom ~key:"rtc" ~style_class:"cp__rtc-sync"
            [ Logseq_dom.dom ~key:"rtc-tx" ~style_class:"hidden"
                ~attrs:[ ("data-testid", "rtc-tx") ]
                ~text:(rtc_tx_text r) []
            ; Logseq_dom.dom ~key:"rtc-ind"
                ~style_class:
                  "cp__rtc-sync-indicator flex flex-row items-center \
                   gap-1"
                [ Logseq_dom.dom ~key:"rtc-btn" ~tag:"button"
                    ~style_class:cls
                    ~attrs:
                      [ ("type", "button"); ("aria-label", "rtc sync") ]
                    [ Logseq_dom.dom ~key:"rtc-i" ~tag:"i"
                        ~style_class:"ti ti-cloud" [] ]
                ]
            ])
    (Signal.map (fun (m : Model.t) -> m.rtc) ms)

(* rtc/plugin toolbar items have no semantic topbar slots yet — keep
   their DOM mounts hidden so emitters and the rtc-tx e2e element stay
   alive. *)
let hidden_chrome (ms : Model.t Signal.signal) : t =
  box ~key:"chrome-hidden" ~style_class:"hidden"
    [ rtc_indicator ms; Left_sidebar_view.plugins_toolbar ms ]

(* cljs right_sidebar.cljs: #right-sidebar.cp__right-sidebar.h-screen
   carries .open/.closed; only renders contents while open *)
let right_sidebar (ms : Model.t Signal.signal) =
  (* TODO(component): #right-sidebar is read imperatively
     (sidebar_state get_element_by_id); kinds are invisible to the
     imperative overlay *)
  Logseq_dom.dom ~key:"right-sidebar" ~id:"right-sidebar"
    ~style_class_signal:
      (Logseq_dom.class_signal ms (fun (m : Model.t) ->
           "cp__right-sidebar h-screen "
           ^ if m.right_sidebar_open then "open" else "closed"))
    [ Right_sidebar_view.render ms ]

(* left_sidebar.cljs:570 — div#left-sidebar.cp__sidebar-left-layout
   holds .left-sidebar-inner (contents) + .shade-mask + .left-sidebar-
   resizer. #left-sidebar{display:none} on desktop keeps the overlay
   out of the click path when closed. *)
let left_sidebar (ms : Model.t Signal.signal) =
  Ui_parts.class_signal ms
    (fun (m : Model.t) ->
      "cp__sidebar-left-layout"
      ^ if m.left_sidebar_open then " is-open" else "")
    (column ~key:"left-sidebar" ~accessibility_identifier:"left-sidebar"
       [ column ~key:"ls-inner"
           ~style_class:"left-sidebar-inner as-container"
           [ box ~key:"ls-wrap" ~style_class:"wrap"
               [ box ~key:"ls-head"
                   ~style_class:"sidebar-header-container"
                   [ Left_sidebar_view.header ms ]
               ; Left_sidebar_view.contents ms
               ]
           ]
       ; Ui_parts.pressable
           ~on_press:(fun _ -> Runtime.send Action.Toggle_left_sidebar)
           (box ~key:"shade" ~style_class:"shade-mask" [])
       ; box ~key:"resizer" ~style_class:"left-sidebar-resizer" []
       ])

let main_content (ms : Model.t Signal.signal) =
  Ui_parts.class_signal ms
    (fun (m : Model.t) ->
      "cp__sidebar-main-layout flex-1 flex"
      ^ if m.left_sidebar_open then " is-left-sidebar-open" else "")
    (row ~key:"main-container" ~accessibility_identifier:"main-container"
    [ left_sidebar ms
    ; (* TODO(component): #main-content-container is queried by
         graphs/recycle.ml; the data-is-* attrs and
         .cp__sidebar-main-content/.mx-auto classes are imperative
         contracts (graphs_view, container.cljs hooks) — keep dom *)
      Logseq_dom.dom ~key:"main-content" ~id:"main-content-container"
        ~style_class:
          "scrollbar-spacing w-full flex justify-center flex-row outline-none relative"
        ~attrs_signal_v:
          (Logseq_dom.attrs_signal ms (fun (_ : Model.t) ->
               [ ("data-is-margin-less-pages", "false") ]))
        [ Logseq_dom.dom ~key:"main-inner"
            ~style_class:"cp__sidebar-main-content"
            ~attrs_signal_v:
              (Logseq_dom.attrs_signal ms (fun (m : Model.t) ->
                   (* cljs container.cljs: data-is-full-width on margin-less +
                      all-pages/all-files/my-publishing routes *)
                   let marginless =
                     [ ("data-is-margin-less-pages", "false") ]
                   in
                   match m.route with
                   | Model.All_pages ->
                       ("data-is-full-width", "true") :: marginless
                   | _ -> marginless))
            [ Logseq_dom.dom ~key:"content-wrap"
                ~attrs_signal_v:
                  (Logseq_dom.attrs_signal ms (fun (m : Model.t) ->
                       (* cljs container.cljs: div.mx-auto.pb-24 around
                          main-content; home/margin-less routes keep an
                          empty class + 0 margin *)
                       match m.route with
                       | Model.Journals | Model.Home ->
                           [ ("style", "margin-bottom: 0") ]
                       | _ ->
                           [ ("class", "mx-auto pb-24")
                           ; ("style", "margin-bottom: 120px") ]))
                [ Page.region ms ]
            ]
        ]
    ])

(* Overlay layer — cmdk palette, popups (autocomplete/slash/context
   menus), dialogs and toasts mount here (single shared container;
   the keyed wrapper keeps these dynamic segments off #app-container's
   child list so nav-time reconciles can't tear down a freshly
   mounted overlay mid-batch). cljs mounts them via portals, which
   are their own container nodes anyway. *)
let overlays (ms : Model.t Signal.signal) =
  (* TODO(component): .cp__overlays is an imperative handle —
     popups_state el_closest walks ancestors to it *)
  Logseq_dom.dom ~key:"overlays" ~style_class:"cp__overlays"
    [ Cmdk_view.render ms
    ; Popups_view.render ms
    ; Left_sidebar_view.menus ms
    ; Dialogs_view.render ms
    ; Cards_view.render ms
    ; Toasts_view.render ms
    ; Properties_view.overlays
    ; reactive ~equal:(fun (a : Model.t) (b : Model.t) ->
          (* the menu reads only page scalars — comparing them skips the
             per-publish deep [=] on the whole route page record *)
          a.page_menu = b.page_menu && a.confirm = b.confirm
          && a.data_gen = b.data_gen
          && Option.map
               (fun (p : Model.page) ->
                 ( p.page_uuid
                 , p.page_db_id
                 , p.page_is_tag
                 , p.page_internal
                 , p.page_built_in ))
               a.route_page
             = Option.map
                 (fun (p : Model.page) ->
                   ( p.page_uuid
                   , p.page_db_id
                   , p.page_is_tag
                   , p.page_internal
                   , p.page_built_in ))
                 b.route_page) (fun m -> Page_menu.dialog_view m) ms
    ; reactive ~equal:(fun (a : Model.t) (b : Model.t) ->
          a.appearance = b.appearance) (fun m ->
          match m.Model.appearance with
          | Some pos -> Settings_page.appearance_body pos
          | None -> spacer ~key:"app-none" []) ms
    ]

(* cljs container.cljs emits hidden <a> anchors used by export flows.
   TODO(component): imperative handles — keep dom *)
let export_anchors : t =
  Logseq_dom.fragment
    (List.map
       (fun id ->
         Logseq_dom.dom ~key:("a-" ^ id) ~tag:"a" ~id
           ~style_class:"hidden" [])
       [ "download"; "download-as-edn-v2"; "download-as-json-v2"
       ; "download-as-transit-debug"; "download-as-sqlite-db"
       ; "download-as-db-edn"; "download-as-roam-json"
       ; "download-as-html"; "download-as-zip"; "export-as-markdown"
       ; "export-as-opml"
       ; "convert-markdown-to-unordered-list-or-heading" ])

(* cljs container.cljs help-button: fixed bottom-right "?" — click toggles
   the help menu popup; popup itself not ported yet *)
(* cljs container.cljs help-button: the tabler help glyph — the native
   path renders bundled tabler icons; a hand-rolled svg renders empty *)
let help_svg : t = Icons.icon ~size:20. "help-small"

let open_url (u : string) = Host.open_url u

(* cljs container.cljs help-menu-items -> .cp__sidebar-help-menu-popup *)
let help_item key title icon_name act =
  Ui_parts.pressable ~on_press:(fun _ -> act ())
    (row ~key ~style_class:"it" ~cross:`center
       [ box ~key:(key ^ "-i") ~style_class:"ls-hm-icon"
           [ Icons.icon ~size:20. icon_name ]
       ; text ~key:(key ^ "-t") ~style_class:"ls-hm-title" ~value:title []
       ])

let help_menu_popup : t =
  let close () =
    Runtime.send Action.Help_toggle;
    Runtime.flush ()
  in
  column ~key:"help-menu" ~style_class:"cp__sidebar-help-menu-popup"
    [ column ~key:"hm-wrap" ~style_class:"list-wrap"
        [ help_item "hm-handbook" (I18n.help_handbook) "book-2" close
        ; help_item "hm-shortcuts" (I18n.help_shortcuts) "command" close
        ; help_item "hm-docs" (I18n.help_docs) "help" (fun () ->
            open_url "https://docs.logseq.com/"; close ())
        ; divider ~key:"hm-hr1" ~style_class:"ls-hm-hr" []
        ; help_item "hm-bug" (I18n.help_bug) "bug" close
        ; help_item "hm-feature" (I18n.help_feature) "git-pull-request"
            (fun () ->
              open_url
                "https://discuss.logseq.com/c/feedback/feature-requests/";
              close ())
        ; help_item "hm-feedback" (I18n.help_feedback) "messages"
            (fun () ->
              open_url "https://discuss.logseq.com/c/feedback/13"; close ())
        ; divider ~key:"hm-hr2" ~style_class:"ls-hm-hr" []
        ; help_item "hm-discord" (I18n.help_discord) "brand-discord"
            (fun () -> open_url "https://discord.com/invite/KpN4eHY"; close ())
        ; help_item "hm-forum" (I18n.help_forum) "message" (fun () ->
            open_url "https://discuss.logseq.com/"; close ())
        ; divider ~key:"hm-hr3" ~style_class:"ls-hm-hr" []
        ; help_item "hm-notes" (I18n.help_release_notes) "asterisk"
            (fun () ->
              open_url "https://docs.logseq.com/#/page/changelog"; close ())
        ]
    ; row ~key:"hm-ft"
        ~style_class:"ft"
        ([ text ~key:"hm-ver"
             ~style_class:"ls-hm-meta"
             ~value:(Printf.sprintf "Logseq %s" Version.app) [] ]
        @ (match Version.revision () with
           | "" -> []
           | rev ->
               [ text ~key:"hm-rev"
                   ~style_class:"ls-hm-meta"
                   ~value:(I18n.tf "help/revision" [ rev ]) [] ]))
    ]

let help_area (ms : Model.t Signal.signal) : t =
  Logseq_dom.fragment
    (* click handler on the OUTER element: the native hit test resolves the
       smallest frame at the point and may land on the wrapper or the svg —
       the document listener walks ancestors, so the handler must sit on
       the outermost element of the hit box. *)
    [ Ui_parts.pressable
        ~on_press:(fun _ ->
          Runtime.send Action.Help_toggle; Runtime.flush ())
        (box ~key:"help" ~style_class:"cp__sidebar-help-btn"
           [ box ~key:"help-inner" ~style_class:"inner"
               [ help_svg ] ])
    ; reactive ~equal:(fun (a : Model.t) (b : Model.t) -> a.help_open = b.help_open) (fun (m : Model.t) ->
          if m.help_open then
            (* The dismiss catcher mounts while the mouse button that opened
               the menu is still down — its click lands on the catcher and
               would instantly re-close the popup. Ignore clicks for a short
               grace window after construction. *)
            let opened_at = Platform.date_now_ms () in
            (* a dyn child must be a real element — Logseq_dom.fragment is
               only valid in static child lists; inside a dyn it mounts into
               the wrong parent and the children never materialize *)
            box ~key:"help-open"
              [ Ui_parts.pressable
                  ~on_press:(fun _ ->
                    if Platform.date_now_ms () -. opened_at > 400.
                    then ( Runtime.send Action.Help_toggle; Runtime.flush ()))
                  (box ~key:"help-dismiss"
                     ~style_class:"cp__cmdk-dismiss" [])
              ; help_menu_popup ]
          else spacer ~key:"help-closed" []) ms
    ]

(* cljs page.cljs not-found: replaces the whole app chrome. Rendered
   as a fixed overlay (remounting the whole app tree inside a dyn
   hits a retained-store crash on the swap). *)
let not_found_page : t =
  (* TODO(component): position:fixed inset overlay — no
     positioned-container kind *)
  Logseq_dom.dom ~key:"nf-full"
    ~style_class:
      "flex flex-col items-center justify-center min-h-screen bg-background"
    ~attrs:
      [ ( "style"
        , "position:fixed;inset:0;z-index:99999;background:var(--ls-primary-background-color)" )
      ]
    [ heading ~key:"nf-h1" ~value:"404" []
    ; heading ~key:"nf-h2" ~value:(I18n.t "page/not-found-title") []
    ; text ~key:"nf-p" ~value:(I18n.t "page/not-found-desc") []
    ; button ~key:"nf-btn"
        ~style_class:"ui__button"
        ~on_press:(fun _ -> Platform.set_location_hash "#/")
        [ Icons.icon ~size:18. "home"
        ; text ~key:"nf-txt" ~value:(I18n.t "page/go-back-home") []
        ]
    ]

let shell (ms : Model.t Signal.signal) : t =
  Ui_parts.class_signal ms
    (fun (m : Model.t) ->
      "theme-container-inner ls-hl-colored"
      ^ if m.left_sidebar_open then " ls-left-sidebar-open" else ""
      ^ if m.right_sidebar_open then " ls-right-sidebar-open" else "")
    (box ~key:"wrapper" ~accessibility_identifier:"app-container-wrapper"
    [ skip_to_main
    ; box ~key:"app" ~accessibility_identifier:"app-container"
        [ Ui_parts.class_signal ms
            (fun (m : Model.t) ->
              if m.left_sidebar_open then "overflow-hidden" else "w-full")
            (column ~key:"left-container"
               ~accessibility_identifier:"left-container"
               (topbar ms @ [ hidden_chrome ms; main_content ms ]))
        ; right_sidebar ms
        ; Pdf.container_el ~key:"asc" ~id:"app-single-container"
        ]
    ; overlays ms
    ; export_anchors
    ; help_area ms
    ; reactive ~equal:(fun (a : Model.t) (b : Model.t) ->
              match a.route, b.route with
              | Model.Not_found _, Model.Not_found _ -> true
              | Model.Not_found _, _ | _, Model.Not_found _ -> false
              | _ -> true) (fun (m : Model.t) ->
              match m.route with
              | Model.Not_found _ -> not_found_page
              | _ -> spacer ~key:"nf-none" []) ms
    ])
