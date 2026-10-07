(* ported from deps/ui/src/shell/chrome.ml — see the src/ original *)
(* App chrome — mirrors components/container.cljs shell:

   <main#app-container-wrapper.theme-container-inner>
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

(* the web twin mounts #skip-to-main (a11y skip link, CSS-hidden until
   :focus) — dropped here: gpui has no tab-focus reveal and the button
   carries no handlers, so it would render as dead chrome *)

(* ---- native topbar (web .cp__header parity) ----

   Single ~48px row matching the web shell: leading group [sidebar
   toggle, search], trailing group [rtc status, home, page-menu dots,
   right-sidebar toggle]. The gpui `toolbar` kind renders in-canvas —
   two stacked placement toolbars produced doubled bars/borders — so
   one plain row is the parity form. rtc/plugin toolbar items keep
   hidden DOM mounts below so their emitters stay live. *)
let icon_btn ~key ?(acc = "") ~icon ~label ?disabled_signal
    ?foreground_signal on_press =
  button ~key ~icon ~label ~variant:`ghost ~size:`icon
    ~accessibility_identifier:(if acc = "" then key else acc)
    ?disabled_signal ?foreground_signal
    ~on_press:(fun _ -> on_press ()) []

(* cljs header.cljs with-shortcut :ui/toggle-left-sidebar *)
let left_menu_btn =
  button ~key:"left-menu-btn" ~icon:`menu ~size:`icon ~variant:`ghost
    ~label:(I18n.t "header/toggle-left-sidebar")
    ~accessibility_identifier:"left-menu"
    ~on_press:(fun _ -> Runtime.send Action.Toggle_left_sidebar) []

(* the DOM header's search button opened via the cmdk DOM-click
   handler; the semantic button calls the palette opener directly
   (Action.Toggle_search is a no-op reducer on native) *)
let search_btn =
  icon_btn ~key:"search-btn" ~acc:"search-button" ~icon:`search
    ~label:(I18n.t "nav/search") (fun () -> Cmdk_state.open_latest ())

(* cljs anchors the dropdown to the trigger's right edge — the fixed
   trailing position: menu right edge just left of the last button,
   just under the header. The resolved anchor is recorded in
   Dom_ext.toolbar_dots_pos for the appearance item, which re-anchors
   to the same trigger. *)
let dots_btn =
  icon_btn ~key:"dots-btn" ~acc:"toolbar-dots-btn" ~icon:`ellipsis
    ~label:(I18n.t "header/more") (fun () ->
      let x = Dom_ext.window_inner_width () -. 48. in
      Dom_ext.toolbar_dots_pos := Some (x, 48.);
      Runtime.send
        (Action.Page_menu_set (Some (x, 48., 48., true, None))))

(* cljs header.cljs hides home on the :home route — press no-ops there *)
let home_btn ms =
  button ~key:"home-btn" ~icon:(`app "home") ~label:(I18n.t "nav/home")
    ~variant:`ghost ~size:`icon ~accessibility_identifier:"home-btn"
    ~on_press:(fun _ ->
      match (Signal.get ms).Model.route with
      | Model.Home -> ()
      | _ ->
          Platform.set_location_hash "#/";
          Platform.dispatch "ls:navigate" Js.Json.null)
    []

(* cljs open-right-sidebar! seeds a "contents" item when the sidebar
   is empty (state/sidebar-add-content-when-open!) *)
let right_toggle_btn ms =
  icon_btn ~key:"rs-toggle" ~icon:`panel_right
    ~label:(I18n.t "command.ui/toggle-right-sidebar")
    (fun () ->
      Runtime.send Action.Toggle_right_sidebar;
      Sidebar_state.ensure_contents (Sidebar_state.ensure ms))

(* rtc status as a toolbar item: a ghost cloud button — native toolbars
   carry status items as their own spaced items, not fused capsules.
   Dimmed while sync is off, accent while queueing (the .cp__rtc-sync
   CSS states don't map onto native). *)
let rtc_item (ms : Model.t Signal.signal) : t =
  icon_btn ~key:"rtc-tb" ~icon:(`app "cloud")
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

(* cljs container.cljs: single .cp__header row — .l [sidebar-toggle,
   search], .r [rtc, home, dots, right-toggle]. *)
let topbar (ms : Model.t Signal.signal) : t list =
  [ row ~key:"head" ~accessibility_identifier:"head"
      ~style_class:"cp__header" ~cross:`center ~main:`space_between
      ~height:48 ~data_attrs:[ ("data-window-titlebar", "true") ]
      [ row ~key:"head-inner" ~cross:`center ~padding_horizontal:8
          ~style_class:"cp__header-l"
          [ left_menu_btn; search_btn ]
      ; row ~key:"head-acts" ~cross:`center ~grow:1. ~main:`end_
          ~gap:8 ~padding_horizontal:6 ~style_class:"cp__header-r"
          [ rtc_item ms; home_btn ms; dots_btn; right_toggle_btn ms ] ]
  ]

(* components/rtc/indicator.cljs — cloud status button + hidden rtc-tx
   element the e2e reads EDN from. Visible once the worker broadcasts
   rtc-sync-state (i.e. sync is running on the current graph). *)
let rtc_tx_text (r : Model.rtc) =
  let tx = function Some n -> string_of_int n | None -> "nil" in
  Printf.sprintf "{:local-tx %s, :remote-tx %s}"
    (tx r.rtc_local_tx) (tx r.rtc_remote_tx)

(* hidden rtc-tx element (data-testid) is an e2e EDN contract; the
   mount keeps the sync emitters alive — the semantic toolbar twin is
   rtc_item *)
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
          box ~key:"rtc" 
            [ box ~key:"rtc-tx" ~style_class:"hidden"
                ~accessibility_identifier:"rtc-tx"
                ~data_attrs:[ ("data-testid", "rtc-tx") ]
                [ Lui_elements.text ~key:"rtc-tx-v"
                    ~value:(rtc_tx_text r) [] ]
            ; row ~key:"rtc-ind" ~cross:`center ~gap:4
                ~style_class:"cp__rtc-sync-indicator"
                [ Lui_elements.button ~key:"rtc-btn" ~variant:`ghost
                    ~size:`icon ~style_class:cls ~label:"rtc sync"
                    ~icon:(`app "cloud") [] ]
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
  (* #right-sidebar is read imperatively (sidebar_state
     get_element_by_id) — the id rides ~accessibility_identifier,
     .open/.closed the class_signal wrapper *)
  Ui_parts.class_signal ms
    (fun (m : Model.t) ->
      "cp__right-sidebar h-screen "
      ^ if m.right_sidebar_open then "open" else "closed")
    (box ~key:"right-sidebar"
       ~accessibility_identifier:"right-sidebar"
       [ Right_sidebar_view.render ms ])

(* left_sidebar.cljs:570 — on the web #left-sidebar.cp__sidebar-left-layout
   is an overlay layer (display:none until .is-open, absolute shade-mask +
   resizer positioned by CSS). Native has no stylesheet, so the sidebar is a
   plain docked column: always mounted (web only CSS-hides it), fixed 260px
   width while open and collapsed to zero width while closed (the web
   default; resizer drag is a separate affordance), surface background via
   the `secondary` token, and a thin resizer strip at the edge. The shade
   is an overlay-mode affordance and doesn't exist in a docked layout. *)
let left_sidebar (ms : Model.t Signal.signal) =
  reactive
    ~equal:(fun (a : Model.t) (b : Model.t) ->
      a.left_sidebar_open = b.left_sidebar_open)
    (fun (m : Model.t) ->
      (* the subtree stays mounted while closed (web only CSS-hides it):
         contents signal subscriptions and drive checks see the same
         nodes open or closed — collapse to zero width instead of
         unmounting *)
      box ~key:"left-sidebar" ~accessibility_identifier:"left-sidebar"
        ~min_height:0
        ~style_class:
          ("cp__sidebar-left-layout self-stretch"
           ^ if m.left_sidebar_open then " is-open" else "")
        [ row ~key:"ls-dock" ~grow:1. ~min_height:0
            ~style_class:"items-stretch"
            [ column ~key:"ls-inner" ~min_height:0
                ~width:(if m.left_sidebar_open then 260 else 0)
                (* web: --left-sidebar-bg-color = --lx-gray-02 (the
                   near-white mauve-02 tone, one step above the page);
                   gpui `muted` is the matching surface tone. *)
                ~background:"muted"
                ~style_class:
                  "left-sidebar-inner as-container overflow-hidden shrink-0"
                [ column ~key:"ls-wrap" ~grow:1. ~min_height:0
                    [ box ~key:"ls-head"
                        ~style_class:"sidebar-header-container"
                        [ Left_sidebar_view.header ms ]
                    ; Left_sidebar_view.contents ms
                    ]
                ]
            ; (if not m.left_sidebar_open then spacer ~key:"resizer-none" []
               else
                 box ~key:"resizer" ~width:4
                   ~style_class:"left-sidebar-resizer" [])
            ]
        ])
    ms

let main_content (ms : Model.t Signal.signal) =
  Ui_parts.class_signal ms
    (fun (m : Model.t) ->
      "cp__sidebar-main-layout flex-1 min-h-0 flex"
      ^ if m.left_sidebar_open then " is-left-sidebar-open" else "")
    (row ~key:"main-container" ~accessibility_identifier:"main-container"
    [ left_sidebar ms
    ; (* #main-content-container is queried by graphs/recycle.ml —
         the id rides ~accessibility_identifier; the data-is-* attrs
         are imperative contracts (graphs_view, container.cljs hooks)
         carried by data_attrs_signal *)
      box ~key:"main-content"
        ~accessibility_identifier:"main-content-container"
        (* flex-1 min-w-0 (not w-full): a 100%-basis sibling shrinks
           the docked 260px sidebar instead of filling the leftover
           track — on flex engines without the web stylesheet the class
           token is the only rule *)
        ~main:`center ~style_class:"scrollbar-spacing flex-1 min-w-0 flex flex-row self-stretch outline-none relative"
        ~data_attrs_signal:
          (Signal.map (fun (_ : Model.t) ->
               [ ("data-is-margin-less-pages", "false") ]) ms)
        [ Ui_parts.class_signal ms
            (fun (m : Model.t) ->
              (* cljs: .cp__sidebar-main-content centers a max-width
                 column via margin auto; is-full-width (margin-less
                 routes) stretches it — no stylesheet natively, so the
                 full-width variant maps to w-full *)
              "cp__sidebar-main-content"
              ^ (match m.route with
                 | Model.All_pages -> " w-full"
                 | _ -> ""))
            (box ~key:"main-inner"
            ~data_attrs_signal:
              (Signal.map (fun (m : Model.t) ->
                   (* cljs container.cljs: data-is-full-width on margin-less +
                      all-pages/all-files/my-publishing routes *)
                   let marginless =
                     [ ("data-is-margin-less-pages", "false") ]
                   in
                   match m.route with
                   | Model.All_pages ->
                       ("data-is-full-width", "true") :: marginless
                   | _ -> marginless) ms)
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
            ])
        ]
    ])

(* Overlay layer — cmdk palette, popups (autocomplete/slash/context
   menus), dialogs and toasts mount here (single shared container;
   the keyed wrapper keeps these dynamic segments off #app-container's
   child list so nav-time reconciles can't tear down a freshly
   mounted overlay mid-batch). cljs mounts them via portals, which
   are their own container nodes anyway. *)
let overlays (ms : Model.t Signal.signal) =
  (* .cp__overlays is an imperative handle — popups_state el_closest
     walks ancestors to it; the class anchor is unchanged.
     Emitted as a cover popover (no ~at): the web positioner spans the
     viewport and the native backends lift the children into a floating
     window layer, so fixed-position chrome (dialogs, menus, toasts)
     never renders in-flow at the document tail. *)
  popover ~key:"overlays" ~style_class:"cp__overlays"
    [ (* popover takes only standard-kind children — the logseq-*
         extension fragments some views emit mount inside a plain box *)
      box ~key:"overlays-wrap" ~grow:1.
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
    ] ]

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

(* web css: position fixed, right 0, bottom 52px — a point-anchored
   popover carries the same geometry on native: the popup's bottom-right
   corner sits 52px above the window's bottom-right corner. Function
   (not a value) so ~at reads the live window size at open time *)
let help_menu_popup () : t =
  let close () =
    Runtime.send Action.Help_toggle;
    Runtime.flush ()
  in
  popover ~key:"help-menu"
    ~at:(Dom_ext.window_inner_width (), Dom_ext.window_inner_height () -. 52.)
    ~anchor:`above ~anchor_alignment:`end_
    ~on_dismiss:(fun _ -> close ())
    [ column ~key:"help-menu-inner" ~style_class:"cp__sidebar-help-menu-popup"
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
    ] ]

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
            (* the dismiss catcher box is gone: the popover's own
               on_dismiss fires on outside press (and, on web, outside
               click on the positioner) *)
            box ~key:"help-open" [ help_menu_popup () ]
          else spacer ~key:"help-closed" []) ms
    ]

(* cljs page.cljs not-found: replaces the whole app chrome. Rendered
   as a fixed overlay (remounting the whole app tree inside a dyn
   hits a retained-store crash on the swap). *)
let not_found_page : t =
  (* .cp__not-found (stylesheet / Swift style entry) carries the
     fixed-overlay positioning the inline style used to *)
  column ~key:"nf-full" ~main:`center ~cross:`center
    ~style_class:"cp__not-found"
    [ heading ~key:"nf-h1" ~level:1 ~style_class:"text-6xl font-bold"
        ~value:"404" []
    ; heading ~key:"nf-h2" ~level:2 ~style_class:"text-2xl font-semibold"
        ~value:(I18n.t "page/not-found-title") []
    ; paragraph ~key:"nf-p"
        ~value:(I18n.t "page/not-found-desc") []
    ; button ~key:"nf-btn" ~variant:`outline ~height:40
        ~padding_horizontal:16 ~padding_vertical:8
        ~style_class:"ui__button as-outline" ~icon:(`app "home")
        ~icon_placement:`leading ~text:(I18n.t "page/go-back-home")
        ~on_press:(fun _ -> Platform.set_location_hash "#/") []
    ]

let shell (ms : Model.t Signal.signal) : t =
  Ui_parts.class_signal ms
    (fun (m : Model.t) ->
      (* h-full: the root view stretches children horizontally but sizes
         them to content vertically — without a definite height the
         whole chrome chain shrink-wraps and the docked sidebar renders
         as a floating content-sized panel *)
      "theme-container-inner ls-hl-colored h-full"
      ^ if m.left_sidebar_open then " ls-left-sidebar-open" else ""
      ^ if m.right_sidebar_open then " ls-right-sidebar-open" else "")
    (box ~key:"wrapper" ~accessibility_identifier:"app-container-wrapper"
    [ (* horizontal shell: left-container grows, right-sidebar docks
         at the trailing edge (web: #app-container is display:flex row) *)
      row ~key:"app" ~accessibility_identifier:"app-container"
        ~style_class:"h-full min-h-0"
        [ column ~key:"left-container"
            ~accessibility_identifier:"left-container"
            ~style_class:"flex-1 min-w-0 h-full overflow-hidden"
            (topbar ms @ [ hidden_chrome ms; main_content ms ])
        ; right_sidebar ms
        ; Pdf.container_el ~key:"asc" ~id:"app-single-container"
        ]
    ; overlays ms
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
