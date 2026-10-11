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
   :focus) — dropped here: the native host has no tab-focus reveal
   and the button
   carries no handlers, so it would render as dead chrome *)

(* ---- native topbar (web .cp__header parity) ----

   Single ~48px row matching the web shell: leading group [sidebar
   toggle, search], trailing group [rtc status, home, page-menu dots,
   right-sidebar toggle]. The native `toolbar` kind renders in-canvas —
   two stacked placement toolbars produced doubled bars/borders — so
   one plain row is the parity form. rtc/plugin toolbar items keep
   hidden DOM mounts below so their emitters stay live. *)
let menu_dismiss_installed = ref false

let icon_btn ~key ?(acc = "") ~icon_name ~label ?disabled_signal
    ?foreground_signal ?style_class on_press =
  button ~key ~label ~variant:`ghost ~size:`icon ~width:32 ~height:32
    ~main:`center ~cross:`center
    ~accessibility_identifier:(if acc = "" then key else acc)
    ?disabled_signal ?foreground_signal ?style_class
    ~on_press:(fun _ -> on_press ())
    [ Icons.icon ~size:20. icon_name ]

(* cljs header.cljs with-shortcut :ui/toggle-left-sidebar *)
let left_menu_btn =
  button ~key:"left-menu-btn" ~size:`icon ~width:32 ~height:32
    ~main:`center ~cross:`center ~variant:`ghost
    ~label:(I18n.t "header/toggle-left-sidebar")
    ~accessibility_identifier:"left-menu"
    ~on_press:(fun _ -> Runtime.send Action.Toggle_left_sidebar)
    [ Icons.icon ~size:20. "menu-2" ]

(* the DOM header's search button opened via the cmdk DOM-click
   handler; the semantic button calls the palette opener directly
   (Action.Toggle_search is a no-op reducer on native) *)
let search_btn =
  icon_btn ~key:"search-btn" ~acc:"search-button" ~icon_name:"search"
    ~label:(I18n.t "nav/search") (fun () -> Cmdk_state.open_latest ())

(* cljs anchors the dropdown to the trigger's right edge — the fixed
   trailing position: menu right edge just left of the last button,
   just under the header. The resolved anchor is recorded in
   Dom_ext.toolbar_dots_pos for the appearance item, which re-anchors
   to the same trigger. *)
let dots_btn =
  icon_btn ~key:"dots-btn" ~acc:"toolbar-dots-btn" ~icon_name:"dots"
    ~style_class:"toolbar-dots-btn"
    ~label:(I18n.t "header/more") (fun () ->
      (* re-pressing the trigger toggles the menu closed (the document
         click-catcher installed in [shell] dismisses on outside press
         only — the button itself is outside the menu surface) *)
      if (Runtime.model ()).Model.page_menu <> None then (
        Runtime.send (Action.Page_menu_set None);
        Runtime.flush ())
      else (
          let x = Host.inner_width () -. 48. in
          Dom_ext.toolbar_dots_pos := Some (x, 48.);
          Runtime.send
            (Action.Page_menu_set (Some (x, 48., 48., true, None)))))

let home_btn ms =
  button ~key:"home-btn" ~label:(I18n.t "nav/home")
    ~variant:`ghost ~size:`icon ~width:32 ~height:32 ~main:`center
    ~cross:`center ~accessibility_identifier:"home-btn"
    ~on_press:(fun _ ->
      match (Signal.get ms).Model.route with
      | Model.Home -> ()
      | _ ->
          Platform.set_location_hash "#/";
          Platform.dispatch "ls:navigate" Js.Json.null)
    [ Icons.icon ~size:20. "home" ]

(* cljs header.cljs mounts the home button only off the :home route *)
let home_item (ms : Model.t Signal.signal) : t =
  reactive
    ~equal:(fun (a : Model.t) (b : Model.t) ->
      (a.route = Model.Home) = (b.route = Model.Home))
    (fun (m : Model.t) ->
      match m.Model.route with
      | Model.Home -> box ~key:"home-off" []
      | _ -> home_btn ms)
    ms


(* cljs open-right-sidebar! seeds a "contents" item when the sidebar
   is empty (state/sidebar-add-content-when-open!) *)
let right_toggle_btn ms =
  icon_btn ~key:"rs-toggle" ~icon_name:"layout-sidebar-right"
    ~label:(I18n.t "command.ui/toggle-right-sidebar")
    (fun () ->
      Runtime.send Action.Toggle_right_sidebar;
      Sidebar_state.ensure_contents (Sidebar_state.ensure ms))

(* rtc status as a toolbar item: a ghost cloud button — native toolbars
   carry status items as their own spaced items, not fused capsules.
   Dimmed while sync is off, accent while queueing (the .cp__rtc-sync
   CSS states don't map onto native). *)
let rtc_item_btn (ms : Model.t Signal.signal) : t =
  icon_btn ~key:"rtc-tb" ~icon_name:"cloud"
    ~label:"Sync Status" ~acc:"rtc-sync"
    ~foreground_signal:
      (Signal.map
         (fun (m : Model.t) ->
           match m.Model.rtc with
           | Some r
             when Platform.online () && r.rtc_lock
                  && (r.rtc_pending_local > 0 || r.rtc_pending_asset > 0
                     || r.rtc_pending_server > 0) ->
               "accent"
           | Some r when Platform.online () && r.rtc_lock ->
               "secondary"
           | _ ->
               (* sync off — muted but still legible in dark mode;
                  disabled_opacity stacked on "secondary" crushed it to
                  near-invisible, so this stays a foreground signal on
                  an enabled ghost button (the press is a no-op anyway) *)
               "muted-foreground")
         ms)
    (fun () -> ())

(* cljs rtc-indicator-visible?: the cloud mounts only while a synced
   (rtc-enabled) graph exists — here the worker's rtc-sync-state
   broadcast, so [m.rtc = None] stays hidden like the web's demo *)
let rtc_item (ms : Model.t Signal.signal) : t =
  reactive
    ~equal:(fun (a : Model.t) (b : Model.t) ->
      (a.rtc = None) = (b.rtc = None))
    (fun (m : Model.t) ->
      match m.Model.rtc with
      | None -> box ~key:"rtc-off" []
      | Some _ -> rtc_item_btn ms)
    ms

(* cljs container.cljs: single .cp__header row — .l [sidebar-toggle,
   search], .r [rtc, home, dots, right-toggle]. *)
let topbar (ms : Model.t Signal.signal) : t list =
  [ row ~key:"head" ~accessibility_identifier:"head"
      ~style_class:"cp__header" ~cross:`center ~main:`space_between
      ~height:48 ~data_attrs:[ ("data-window-titlebar", "true") ]
      [ Ui_parts.int_prop_signal Lui_protocol.MarginLeft ms
          (* NavigationSplitView detail toolbar: the row lives inside
             the split's second pane, so while the sidebar is open its
             leading buttons already start at the sidebar's right edge.
             When the dock collapses the pane spans the window and the
             buttons must clear the traffic-light controls (~76px) —
             the host blends the title bar via fullSizeContentView. *)
          (fun (m : Model.t) -> if m.Model.left_sidebar_open then 0 else 70)
          (row ~key:"head-inner" ~cross:`center ~padding_horizontal:8
             ~style_class:"cp__header-l"
          [ left_menu_btn; search_btn ])
      ; row ~key:"head-acts" ~cross:`center ~grow:1. ~main:`end_
          ~padding_horizontal:6 ~style_class:"cp__header-r"
          [ rtc_item ms; home_item ms; dots_btn; right_toggle_btn ms ] ]
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
      | None -> box ~key:"rtc-off" ~display:`none []
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
            [ box ~key:"rtc-tx" ~display:`none
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
  box ~key:"chrome-hidden" ~display:`none
    [ rtc_indicator ms; Left_sidebar_view.plugins_toolbar ms ]

(* cljs right_sidebar.cljs: #right-sidebar.cp__right-sidebar.h-screen
   carries .open/.closed; only renders contents while open. The pane
   stays mounted — the docked split's track owns its width (0 while
   closed). *)
let right_sidebar (ms : Model.t Signal.signal) =
  Ui_parts.class_signal ms
    (fun (m : Model.t) ->
      "cp__right-sidebar "
      ^ if m.right_sidebar_open then "open" else "closed")
    (Ui_components.with_props
       [ Lui_protocol.HeightViewport, Ui_components.fv 1. ]
       (box ~key:"right-sidebar" ~accessibility_identifier:"right-sidebar"
       ~min_height:0
       ~style_class:"cp__right-sidebar closed"
          [ Ui_components.with_props
              [ Lui_protocol.Overflow, Ui_components.sv "hidden" ]
              (row ~key:"rs-dock" ~min_height:0 ~grow:1. ~cross:`stretch
                 ~background:"muted"
                 [ Right_sidebar_view.render ms ]) ]))

(* left_sidebar.cljs:570 — on the web #left-sidebar.cp__sidebar-left-layout
   is an overlay layer; on the native host it is the docked split's
   first pane —
   the subtree stays mounted while closed (the split track owns the
   width), surface background via the `muted` token. The shade-mask is
   an overlay-mode affordance and doesn't exist in a docked layout. *)
let left_sidebar (ms : Model.t Signal.signal) =
  Ui_parts.class_signal ms
    (fun (m : Model.t) ->
      "cp__sidebar-left-layout"
      ^ if m.left_sidebar_open then " is-open" else "")
    (Ui_components.with_props
       [ Lui_protocol.HeightViewport, Ui_components.fv 1. ]
       (box ~key:"left-sidebar" ~accessibility_identifier:"left-sidebar"
          ~min_height:0 ~style_class:"cp__sidebar-left-layout"
          [ row ~key:"ls-dock" ~grow:1. ~min_height:0 ~cross:`stretch
             [ (column ~key:"ls-inner" ~grow:1. ~min_height:0
                    (* web: --left-sidebar-bg-color = --lx-gray-02 (the
                       near-white mauve-02 tone, one step above the page);
                       the native `muted` slot is the matching
                       surface tone. *)
                    ~background:"muted"
                    ~style_class:"left-sidebar-inner as-container"
               [ (* NavigationSplitView sidebar semantics: the column
                    spans the full window height, so its top strip sits
                    in the title-bar zone where the host overlays the
                    traffic-light controls. It stays empty drag space
                    (the window is movable-by-background); the graph
                    switcher starts below it. *)
                 box ~key:"ls-top" ~height:52
                   ~style_class:"left-sidebar-top"
                   ~data_attrs:[ ("data-window-titlebar", "true") ] []
               ; column ~key:"ls-wrap" ~grow:1. ~min_height:0
                   [ box ~key:"ls-head"
                       ~style_class:"sidebar-header-container"
                       [ Left_sidebar_view.header ms ]
                   ; Left_sidebar_view.contents ms
                   ]
               ]
           )
           ]
       ]))

(* docked splits — the native renderer draws Split natively and fires
   ValueChanged on drag; the persisted fraction drives ProgressValue
   back. ~resize_duration/~resize_easing are ignored on this backend
   (the native kit has no split animation today). *)
let left_split (ms : Model.t Signal.signal) (st : Sidebar_state.t)
    (content : t) : t =
  split ~key:"left-split" ~grow:1. ~gap:6
    ~value:
      (reactive
         (fun (m : Model.t) f ->
           if m.Model.left_sidebar_open then f
           else Sidebar_state.closed_fraction)
         ms (Signal.value st.Sidebar_state.left_fraction))
    ~resize_duration:300 ~resize_easing:`standard
    ~on_resize:(Sidebar_state.on_left_split_resize st)
    (left_sidebar ms) content

let right_split (ms : Model.t Signal.signal) (st : Sidebar_state.t)
    (first : t) (second : t) : t =
  split ~key:"right-split" ~grow:1. ~gap:6
    ~value:
      (reactive
         (fun (m : Model.t) f ->
           if m.Model.right_sidebar_open then 1. -. f else 1.)
         ms (Signal.value st.Sidebar_state.right_fraction))
    ~resize_duration:300 ~resize_easing:`standard
    ~on_resize:(Sidebar_state.on_right_split_resize st)
    first second

(* #main-content-container scroll — the detail column's page area.
   The split's second pane wraps this in the titlebar column below. *)
let main_scroll (ms : Model.t Signal.signal) : t =
  (* #main-content-container is queried by graphs/recycle.ml —
            the id rides ~accessibility_identifier; the data-is-* attrs
            are imperative contracts (graphs_view, container.cljs hooks)
            carried by data_attrs_signal. On web this element is the page's
            vertical scroller (.scrollbar-spacing = overflow-y:auto) —
            emit the real scroll kind so pages taller than the window
            actually scroll. *)
  Ui_parts.int_prop_signal Lui_protocol.PaddingVertical ms
    (fun (m : Model.t) ->
      (* cljs container.cljs: margin-less routes (journals/home/
         all-pages) strip the container's py-8; named pages keep
         the 32px top pad under the title *)
      match m.route with
      | Model.Journals | Model.Home | Model.All_pages -> 0
      | _ -> 32)
        (scroll ~key:"main-content" ~orientation:`vertical ~grow:1.
        ~accessibility_identifier:"main-content-container"
        ~style_class:"scrollbar-spacing"
        ~data_attrs_signal:
          (Signal.map (fun (_ : Model.t) ->
               [ ("data-is-margin-less-pages", "false") ]) ms)
        [ (* the row keeps the pre-scroll layout: flex-row +
             justify-center centered .cp__sidebar-main-content
             horizontally (scroll children stretch to viewport width) *)
          row ~key:"main-content-row" ~main:`center ~grow:1.
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
            (Ui_parts.int_prop_signal Lui_protocol.MaxWidth ms
               (fun (m : Model.t) ->
                 (* cljs: .cp__sidebar-main-content = flex:1 +
                    max-width var(--ls-main-content-max-width)=960px +
                    margin-inline auto (the row centers it);
                    is-full-width routes cap at 100vw *)
                 match m.route with
                 | Model.All_pages -> 100000
                 | _ -> 960)
            (box ~key:"main-inner" ~grow:1.
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
            [ Ui_parts.class_signal ms
                (fun (m : Model.t) ->
                  (* cljs container.cljs: div.mx-auto.pb-24 around
                     main-content; home/margin-less routes keep an
                     empty class + 0 margin *)
                  match m.route with
                  | Model.Journals | Model.Home -> ""
                  | _ -> "mx-auto pb-24")
                (column ~key:"content-wrap"
                   ~data_attrs_signal:
                     (Signal.map
                        (fun (m : Model.t) ->
                          match m.route with
                          | Model.Journals | Model.Home ->
                              [ ("style", "margin-bottom: 0") ]
                          | _ -> [ ("style", "margin-bottom: 120px") ])
                        ms)
                   [ Page.region ms ]) ]
            ))
        ]
        ])

(* NavigationSplitView detail column — the left dock split's second
   pane: titlebar row over the page scroll, sized by the persisted
   sidebar fraction. *)
let detail_column (ms : Model.t Signal.signal) : t =
  Ui_parts.class_signal ms
    (fun (m : Model.t) ->
      "flex-1 flex"
      ^ if m.left_sidebar_open then " is-left-sidebar-open" else "")
    (column ~key:"left-container"
       ~accessibility_identifier:"left-container" ~grow:1.
       ~min_height:0
       ([ (* invisible logseq-dom carrier: hosts forward
             document events through this extension node *)
          Logseq_el.carrier ]
        @ topbar ms
        @ [ hidden_chrome ms; main_scroll ms ]))

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
     never renders in-flow at the document tail. viewport_cover pins
     that span natively — without it the popover shrink-wraps its
     children and mounted popups place against a zero-width strip.
     data-overlay-layer marks it a permanent layer host, not a
     presented popup: the native host's overlay rules then never
     dispatch Dismiss to it (it stays mounted between overlays, so an
     outside press or Escape would otherwise vanish into it). *)
  Ui_parts.viewport_cover
    (Ui_parts.hit_transparent
       (popover ~transition:Ui_components.popover_transition ~key:"overlays" ~style_class:"cp__overlays"
    ~background:"#00000000"
    ~data_attrs:[ ("data-overlay-layer", "true") ]
    [ (* popover takes only standard-kind children — the logseq-*
         extension fragments some views emit mount inside a plain box *)
      box ~key:"overlays-wrap" ~grow:1.
        [ Cmdk_view.render ~services:(Cmdk_host.services ()) ms
    ; Popups_view.render ms
    ; Left_sidebar_view.menus ms
    ; Dialogs_view.render ms
    ; Cards_view.render ms
    ; Toasts_view.render ms
    ; Properties_view.overlays
    ; Views_popup.layer
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
    ] ]))

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
  popover ~transition:Ui_components.popover_transition ~key:"help-menu"
    ~at:(Host.inner_width (), Host.inner_height () -. 52.)
    ~anchor:`above ~anchor_alignment:`end_
    ~on_dismiss:(fun _ -> close ())
    [ column ~key:"help-menu-inner" ~style_class:"cp__sidebar-help-menu-popup"
    [ column ~key:"hm-wrap"
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
  Logseq_el.fragment
    (* click handler on the OUTER element: the native hit test resolves the
       smallest frame at the point and may land on the wrapper or the svg —
       the document listener walks ancestors, so the handler must sit on
       the outermost element of the hit box. *)
    [ (* stack overlay child: pin to the bottom-trailing corner —
         edge-stretch would cover the whole window and swallow every
         press *)
      overlay ~key:"help-anchor" ~alignment:`bottom_trailing
        [ Ui_parts.pressable
        ~on_press:(fun _ ->
          Runtime.send Action.Help_toggle; Runtime.flush ())
        (box ~key:"help" ~style_class:"cp__sidebar-help-btn"
           [ box ~key:"help-inner" ~style_class:"inner"
               [ help_svg ] ]) ]
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
    [ heading ~key:"nf-h1" ~level:1 ~font_size:"3.75rem" ~font_weight:700
        ~value:"404" []
    ; heading ~key:"nf-h2" ~level:2 ~font_size:"1.5rem" ~font_weight:600
        ~value:(I18n.t "page/not-found-title") []
    ; paragraph ~key:"nf-p"
        ~value:(I18n.t "page/not-found-desc") []
    ; button ~key:"nf-btn" ~variant:`outline ~height:40
        ~padding_horizontal:16 ~padding_vertical:8
        ~style_class:"ui__button as-outline" ~icon:(`app "home")
        ~icon_placement:`leading ~text:(I18n.t "page/go-back-home")
        ~on_press:(fun _ -> Platform.set_location_hash "#/") []
    ]

(* page menu dismiss contract (cljs document handlers): Escape or a
   press outside .ui__dropdown-menu-content closes it. Installed once
   per session — the handler reads the live model via [Runtime.model]. *)
let install_menu_dismiss () =
  if not !menu_dismiss_installed then (
    menu_dismiss_installed := true;
    Ui_services.dom_on_document_event "keydown" (fun ev ->
        match ev.Ui_services.key with
        | Some "Escape"
          when (Runtime.model ()).Model.page_menu <> None ->
            Runtime.send (Action.Page_menu_set None);
            Runtime.flush ()
        | _ -> ());
    Ui_services.dom_on_document_event "click" (fun ev ->
        match ev.Ui_services.target with
        | Some el
          when (Runtime.model ()).Model.page_menu <> None
               && el.Ui_services.closest ".ui__dropdown-menu-content"
                  = None
               && el.Ui_services.closest ".toolbar-dots-btn" = None ->
            Runtime.send (Action.Page_menu_set None);
            Runtime.flush ()
        | _ -> ()))

let shell (ms : Model.t Signal.signal) : t =
  let st = Sidebar_state.ensure ms in
  install_menu_dismiss ();
  Ui_parts.class_signal ms
    (fun (m : Model.t) ->
      (* h-full: the root view stretches children horizontally but sizes
         them to content vertically — without a definite height the
         whole chrome chain shrink-wraps and the docked sidebar renders
         as a floating content-sized panel *)
      "theme-container-inner ls-hl-colored h-full"
      ^ if m.left_sidebar_open then " ls-left-sidebar-open" else ""
     )
    (* stack: the app row fills the frame as the in-flow first child;
       overlays/help/not-found become shared-cell overlays (native:
       absolute, edge-stretched) instead of in-flow document-tail
       siblings a plain box would size to content *)
    (stack ~key:"wrapper" ~accessibility_identifier:"app-container-wrapper"
    [ (* horizontal shell: the docked splits own both side docks'
         tracks — the left split's second pane is the detail column
         (titlebar + page scroll), so the sidebar column spans the
         full window height like NavigationSplitView *)
      row ~key:"app" ~accessibility_identifier:"app-container" ~grow:1.
        [ right_split ms st
            (left_split ms st (detail_column ms))
            (right_sidebar ms)
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
