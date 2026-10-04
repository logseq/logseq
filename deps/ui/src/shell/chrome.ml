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

let dyn = Logseq_dom.dyn

let skip_to_main =
  Logseq_dom.dom ~key:"skip" ~tag:"button" ~id:"skip-to-main"
    ~text:(I18n.t "nav/skip-to-main-content") []

(* cljs shui/button :ghost :size :sm — tooltip-wrapped buttons carry no
   title attr; extra classes sort alphabetically into the class list *)
let ghost_btn_cls ?(mid = "") ?(tail = "") () =
  "active:opacity-80 as-ghost box-content " ^ mid
  ^ "cursor-pointer disabled:opacity-50 disabled:pointer-events-none \
     focus-visible:outline-none focus-visible:ring-2 \
     focus-visible:ring-offset-2 focus-visible:ring-ring font-medium gap-1 \
     h-6 hover:bg-secondary/70 hover:text-secondary-foreground inline-flex \
     items-center justify-center overflow-hidden p-1 ring-offset-background \
     rounded-md select-none text-sm " ^ tail
  ^ "transition-colors ui__button w-6 whitespace-nowrap"

let icon_btn ~key ~id ~cls ~icon ~on_click =
  Logseq_dom.dom ~key ~tag:"button" ~id
    ~style_class:cls
    ~attrs:[ ("type", "button") ]
    ~events:"click"
    ~on_dom_event:(fun name payload -> if name = "click" then on_click payload)
    [ Icons.icon ~size:20. ~cls:"" icon ]

let search_button =
  icon_btn ~key:"search-btn" ~id:"search-button" ~cls:(ghost_btn_cls ())
    ~icon:"search"
    ~on_click:(fun _ -> Runtime.send Action.Toggle_search)

let dots_button =
  Logseq_dom.dom ~key:"dots-btn" ~tag:"button"
    ~style_class:(ghost_btn_cls ~tail:"toolbar-dots-btn " ())
    ~attrs:[ ("type", "button") ]
    ~events:"click"
    ~on_dom_event:(fun name _ ->
      (* cljs anchors the dropdown to the trigger's right edge, not
         the click position *)
      if name = "click" then
        match
          Dom_ext.doc_query_selector ".toolbar-dots-btn"
        with
        | Some el ->
            let r = Dom_ext.bounding_rect el in
            Runtime.send
              (Action.Page_menu_set
                 (Some
                    ( Dom_ext.rect_right r
                    , Dom_ext.rect_bottom r +. 4.
                    , true
                    , None )))
        | None -> ())
    [ Icons.icon ~size:20. ~cls:"" "dots" ]

(* components/rtc/indicator.cljs — cloud status button + hidden rtc-tx
   element the e2e reads EDN from. Visible once the worker broadcasts
   rtc-sync-state (i.e. sync is running on the current graph). *)
let rtc_tx_text (r : Model.rtc) =
  let tx = function Some n -> string_of_int n | None -> "nil" in
  Printf.sprintf "{:local-tx %s, :remote-tx %s}"
    (tx r.rtc_local_tx) (tx r.rtc_remote_tx)

let rtc_indicator (ms : Model.t Signal.signal) : t =
  dyn ~equal:( = ) (fun (r : Model.rtc option) ->
      match r with
      | None -> Logseq_dom.dom ~key:"rtc-off" ~style_class:"hidden" []
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

let left_menu_button =
  icon_btn ~key:"left-menu-btn" ~id:"left-menu"
    ~cls:(ghost_btn_cls ~mid:"cp__header-left-menu " ())
    ~icon:"menu-2"
    ~on_click:(fun _ -> Runtime.send Action.Toggle_left_sidebar)

(* cljs header.cljs: home button hidden on the :home route and on a
   custom home page *)
let home_button ms =
  dyn
    ~equal:(fun (a : Model.t) (b : Model.t) -> a.route = b.route)
    (fun (m : Model.t) ->
      match m.route with
      | Model.Home -> Logseq_dom.nothing
      | _ ->
          icon_btn ~key:"home-btn" ~id:"" ~cls:(ghost_btn_cls ())
            ~icon:"home" ~on_click:(fun _ ->
              Platform.set_location_hash "#/";
              Platform.dispatch "ls:navigate" Js.Json.null))
    ms

(* cljs open-right-sidebar! seeds a "contents" item when the sidebar
   is empty (state/sidebar-add-content-when-open!) *)
let right_toggle_button ms =
  icon_btn ~key:"rs-toggle" ~id:""
    ~cls:(ghost_btn_cls ~tail:"toggle-right-sidebar " ())
    ~icon:"layout-sidebar-right"
    ~on_click:(fun _ ->
      Runtime.send Action.Toggle_right_sidebar;
      Sidebar_state.ensure_contents (Sidebar_state.ensure ms))

let header (ms : Model.t Signal.signal) =
  (* cljs header.cljs sets inline fontSize:50 on .cp__header *)
  Logseq_dom.dom ~key:"head" ~tag:"div" ~id:"head"
    ~style_class:"cp__header drag-region"
    ~attrs:[ ("style", "font-size: 50px") ]
    [ Logseq_dom.dom ~key:"head-inner"
        ~style_class:"l flex items-center drag-region"
        [ left_menu_button; search_button ]
    ; Logseq_dom.dom ~key:"head-r"
        ~style_class:
          "r flex drag-region justify-between items-center gap-2 overflow-x-hidden w-full"
        [ Logseq_dom.dom ~key:"head-crumb" ~style_class:"flex flex-1"
            [ dyn
                ~equal:(fun (a : Model.t) (b : Model.t) ->
                  (* only the zoomed-block trail renders here *)
                  Option.map
                    (fun (p : Model.page) ->
                      List.map
                        (fun (pb : Model.block) -> pb.Model.block_uuid)
                        p.Model.page_parents)
                    a.Model.route_page
                  = Option.map
                      (fun (p : Model.page) ->
                        List.map
                          (fun (pb : Model.block) -> pb.Model.block_uuid)
                          p.Model.page_parents)
                      b.Model.route_page)
                (fun (m : Model.t) ->
                  (* cljs header.cljs block-breadcrumb: ancestor trail in
                     the header only while zoomed into a block (the page
                     itself carries its own breadcrumb) *)
                  match m.Model.route_page with
                  | Some p when p.Model.page_parents <> [] ->
                      let item key ~href ~text =
                        Logseq_dom.dom ~key ~tag:"a"
                          ~style_class:"breadcrumb-item"
                          ~attrs:[ ("href", href) ]
                          ~text:text []
                      in
                      Logseq_dom.dom ~key:"head-bc"
                        ~style_class:"breadcrumb"
                        (List.mapi
                           (fun i (pb : Model.block) ->
                             item
                               ("hbc-" ^ string_of_int i)
                               ~href:
                                 ("#/block/"
                                 ^ Option.value pb.Model.block_uuid
                                     ~default:"")
                               ~text:pb.Model.block_title)
                           p.Model.page_parents
                        @ [ item "hbc-cur"
                              ~href:
                                ("#/block/"
                                ^ Option.value p.Model.page_uuid
                                    ~default:"")
                              ~text:p.Model.page_title ])
                  | _ -> Logseq_dom.dom ~key:"head-bc-empty" [])
                ms ]
        ; Logseq_dom.dom ~key:"head-acts" ~style_class:"flex items-center"
            [ rtc_indicator ms
            ; home_button ms
            ; (* cljs header.cljs hook-ui-items :toolbar renders
                 .ui-items-container only when a plugin actually
                 contributes a toolbar item *)
              Left_sidebar_view.plugins_toolbar ms
            ; dots_button; right_toggle_button ms ]
        ]
    ]

(* cljs right_sidebar.cljs: #right-sidebar.cp__right-sidebar.h-screen
   carries .open/.closed; only renders contents while open *)
let right_sidebar (ms : Model.t Signal.signal) =
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
  Logseq_dom.dom ~key:"left-sidebar" ~id:"left-sidebar"
    ~style_class_signal:
      (Logseq_dom.class_signal ms (fun (m : Model.t) ->
           "cp__sidebar-left-layout"
           ^ if m.left_sidebar_open then " is-open" else ""))
    [ Logseq_dom.dom ~key:"ls-inner"
        ~style_class:
          "left-sidebar-inner as-container flex-1 flex flex-col min-h-0"
        [ Logseq_dom.dom ~key:"ls-wrap" ~style_class:"wrap"
            [ Logseq_dom.dom ~key:"ls-head"
                ~style_class:"sidebar-header-container"
                [ Left_sidebar_view.header ms ]
            ; Left_sidebar_view.contents ms
            ]
        ]
    ; Logseq_dom.dom ~key:"shade" ~tag:"span" ~style_class:"shade-mask"
        ~events:"click"
        ~on_dom_event:(fun name _ ->
          if name = "click" then Runtime.send Action.Toggle_left_sidebar)
        []
    ; Logseq_dom.dom ~key:"resizer" ~tag:"span"
        ~style_class:"left-sidebar-resizer" []
    ]

let main_content (ms : Model.t Signal.signal) =
  Logseq_dom.dom ~key:"main-container" ~id:"main-container"
    ~style_class_signal:
      (Logseq_dom.class_signal ms (fun (m : Model.t) ->
           "cp__sidebar-main-layout flex-1 flex"
           ^ if m.left_sidebar_open then " is-left-sidebar-open" else ""))
    [ left_sidebar ms
    ; Logseq_dom.dom ~key:"main-content" ~id:"main-content-container"
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
    ]

(* Overlay layer — cmdk palette, popups (autocomplete/slash/context
   menus), dialogs and toasts mount here (single shared container;
   the keyed wrapper keeps these dynamic segments off #app-container's
   child list so nav-time reconciles can't tear down a freshly
   mounted overlay mid-batch). cljs mounts them via portals, which
   are their own container nodes anyway. *)
let overlays (ms : Model.t Signal.signal) =
  Logseq_dom.dom ~key:"overlays" ~style_class:"cp__overlays"
    [ Cmdk_view.render ms
    ; Popups_view.render ms
    ; Left_sidebar_view.menus ms
    ; Dialogs_view.render ms
    ; Cards_view.render ms
    ; Toasts_view.render ms
    ; dyn
        ~equal:(fun (a : Model.t) (b : Model.t) ->
          (* the menu reads only page scalars — comparing them skips the
             per-publish deep [=] on the whole route page record *)
          a.page_menu = b.page_menu && a.confirm = b.confirm
          && a.data_gen = b.data_gen
          && List.map
               (fun (p : Model.page) -> (p.page_uuid, p.page_journal_day))
               a.journals
             = List.map
                 (fun (p : Model.page) ->
                   (p.page_uuid, p.page_journal_day))
                 b.journals
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
                 b.route_page)
        (fun m -> Page_menu.dialog_view m)
        ms
    ; dyn
        ~equal:(fun (a : Model.t) (b : Model.t) ->
          a.appearance = b.appearance)
        (fun m ->
          match m.Model.appearance with
          | Some pos -> Settings_page.appearance_body pos
          | None -> Logseq_dom.dom ~key:"app-none" [])
        ms
    ]

(* cljs container.cljs emits hidden <a> anchors used by export flows *)
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
(* cljs container.cljs help-button: inline tabler help-small svg *)
let help_svg : t =
  Logseq_dom.dom ~key:"help-svg" ~tag:"svg"
    ~attrs:
      [ ("stroke", "currentColor")
      ; ("fill", "none")
      ; ("stroke-linejoin", "round")
      ; ("width", "24")
      ; ("viewBox", "0 0 24 24")
      ; ("xmlns", "http://www.w3.org/2000/svg")
      ; ("stroke-linecap", "round")
      ; ("stroke-width", "2")
      ; ("height", "24")
      ]
    ~style_class:"icon icon-tabler icon-tabler-help-small scale-125"
    [ Logseq_dom.dom ~key:"hsv-p0" ~tag:"path"
        ~attrs:[ ("stroke", "none"); ("d", "M0 0h24v24H0z"); ("fill", "none") ]
        []
    ; Logseq_dom.dom ~key:"hsv-p1" ~tag:"path" ~attrs:[ ("d", "M12 16v.01") ] []
    ; Logseq_dom.dom ~key:"hsv-p2" ~tag:"path"
        ~attrs:
          [ ( "d"
            , "M12 13a2 2 0 0 0 .914 -3.782a1.98 1.98 0 0 0 -2.414 .483" )
          ]
        []
    ]

external open_url : string -> unit = "open" [@@mel.scope "window"]

(* cljs container.cljs help-menu-items -> .cp__sidebar-help-menu-popup *)
let help_item key title icon_name act =
  Logseq_dom.dom ~key ~tag:"a"
    ~style_class:"it"
    ~events:"click"
    ~on_dom_event:(fun n _ -> if n = "click" then act ())
    [ Logseq_dom.dom ~key:(key ^ "-i") ~tag:"span"
        ~style_class:"ls-hm-icon"
        [ Icons.icon ~size:20. icon_name ]
    ; Logseq_dom.dom ~key:(key ^ "-t") ~tag:"strong"
        ~style_class:"ls-hm-title" ~text:title []
    ]

let help_menu_popup : t =
  let close () =
    Runtime.send Action.Help_toggle;
    Runtime.flush ()
  in
  Logseq_dom.dom ~key:"help-menu" ~style_class:"cp__sidebar-help-menu-popup"
    [ Logseq_dom.dom ~key:"hm-wrap" ~style_class:"list-wrap"
        [ help_item "hm-handbook" (I18n.help_handbook) "book-2" close
        ; help_item "hm-shortcuts" (I18n.help_shortcuts) "command" close
        ; help_item "hm-docs" (I18n.help_docs) "help" (fun () ->
            open_url "https://docs.logseq.com/"; close ())
        ; Logseq_dom.dom ~key:"hm-hr1" ~tag:"hr" ~style_class:"ls-hm-hr" []
        ; help_item "hm-bug" (I18n.help_bug) "bug" close
        ; help_item "hm-feature" (I18n.help_feature) "git-pull-request"
            (fun () ->
              open_url
                "https://discuss.logseq.com/c/feedback/feature-requests/";
              close ())
        ; help_item "hm-feedback" (I18n.help_feedback) "messages"
            (fun () ->
              open_url "https://discuss.logseq.com/c/feedback/13"; close ())
        ; Logseq_dom.dom ~key:"hm-hr2" ~tag:"hr" ~style_class:"ls-hm-hr" []
        ; help_item "hm-discord" (I18n.help_discord) "brand-discord"
            (fun () -> open_url "https://discord.com/invite/KpN4eHY"; close ())
        ; help_item "hm-forum" (I18n.help_forum) "message" (fun () ->
            open_url "https://discuss.logseq.com/"; close ())
        ; Logseq_dom.dom ~key:"hm-hr3" ~tag:"hr" ~style_class:"ls-hm-hr" []
        ; help_item "hm-notes" (I18n.help_release_notes) "asterisk"
            (fun () ->
              open_url "https://docs.logseq.com/#/page/changelog"; close ())
        ]
    ; Logseq_dom.dom ~key:"hm-ft"
        ~style_class:"ft"
        ([ Logseq_dom.dom ~key:"hm-ver" ~tag:"span"
             ~style_class:"ls-hm-meta"
             ~text:(Printf.sprintf "Logseq %s" Version.app) [] ]
        @ (match Version.revision () with
           | "" -> []
           | rev ->
               [ Logseq_dom.dom ~key:"hm-rev" ~tag:"span"
                   ~style_class:"ls-hm-meta"
                   ~text:(I18n.tf "help/revision" [ rev ]) [] ]))
    ]

let help_area (ms : Model.t Signal.signal) : t =
  Logseq_dom.fragment
    [ Logseq_dom.dom ~key:"help" ~style_class:"cp__sidebar-help-btn"
        [ Logseq_dom.dom ~key:"help-inner" ~style_class:"inner"
            ~events:"click"
            ~on_dom_event:(fun n _ ->
              if n = "click" then (
                Runtime.send Action.Help_toggle; Runtime.flush ()))
            [ help_svg ] ]
    ; dyn
        ~equal:(fun (a : Model.t) (b : Model.t) -> a.help_open = b.help_open)
        (fun (m : Model.t) ->
          if m.help_open then help_menu_popup
          else Logseq_dom.nothing)
        ms
    ]

(* cljs page.cljs not-found: replaces the whole app chrome. Rendered
   as a fixed overlay (remounting the whole app tree inside a dyn
   hits a retained-store crash on the swap). *)
let not_found_page : t =
  Logseq_dom.dom ~key:"nf-full"
    ~style_class:
      "flex flex-col items-center justify-center min-h-screen bg-background"
    ~attrs:
      [ ( "style"
        , "position:fixed;inset:0;z-index:99999;background:var(--ls-primary-background-color)" )
      ]
    [ Logseq_dom.dom ~key:"nf-h1" ~tag:"h1"
        ~style_class:"text-6xl font-bold text-gray-12 mb-4" ~text:"404" []
    ; Logseq_dom.dom ~key:"nf-h2" ~tag:"h2"
        ~style_class:"text-2xl font-semibold text-gray-10 mb-6"
        ~text:(I18n.t "page/not-found-title") []
    ; Logseq_dom.dom ~key:"nf-p" ~tag:"p"
        ~style_class:"text-gray-500 mb-8"
        ~text:(I18n.t "page/not-found-desc") []
    ; Logseq_dom.dom ~key:"nf-btn" ~tag:"button"
        ~style_class:
          "ui__button inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-md text-sm gap-1 font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none border bg-background hover:bg-accent hover:text-accent-foreground active:opacity-80 as-outline h-10 px-4 py-2"
        ~events:"click"
        ~on_dom_event:(fun n _ ->
          if n = "click" then Platform.set_location_hash "#/")
        [ Logseq_dom.dom ~key:"nf-ico" ~tag:"span"
            ~style_class:"ls-icon-home  ui__icon ti"
            [ Icons.icon ~size:18. ~cls:"" "home" ]
        ; Logseq_dom.dom ~key:"nf-txt" ~tag:"span"
            ~text:(I18n.t "page/go-back-home") []
        ]
    ]

let shell (ms : Model.t Signal.signal) : t =
  Logseq_dom.dom ~key:"wrapper" ~tag:"main" ~id:"app-container-wrapper"
    ~style_class_signal:
      (Logseq_dom.class_signal ms (fun (m : Model.t) ->
           "theme-container-inner ls-hl-colored"
           ^ if m.left_sidebar_open then " ls-left-sidebar-open" else ""
           ^ if m.right_sidebar_open then " ls-right-sidebar-open" else ""))
    [ skip_to_main
    ; Logseq_dom.dom ~key:"app" ~id:"app-container"
        [ Logseq_dom.dom ~key:"left-container" ~id:"left-container"
            ~style_class_signal:
              (Logseq_dom.class_signal ms (fun (m : Model.t) ->
                   (* cljs container.cljs: overflow-hidden while RIGHT
                      sidebar is open *)
                   if m.right_sidebar_open then "overflow-hidden"
                   else "w-full"))
            [ header ms; main_content ms ]
        ; right_sidebar ms
        ; Logseq_dom.dom ~key:"asc" ~id:"app-single-container" []
        ]
    ; overlays ms
    ; export_anchors
    ; help_area ms
    ; dyn
            ~equal:(fun (a : Model.t) (b : Model.t) ->
              match a.route, b.route with
              | Model.Not_found _, Model.Not_found _ -> true
              | Model.Not_found _, _ | _, Model.Not_found _ -> false
              | _ -> true)
            (fun (m : Model.t) ->
              match m.route with
              | Model.Not_found _ -> not_found_page
              | _ -> Logseq_dom.nothing)
            ms
    ]
