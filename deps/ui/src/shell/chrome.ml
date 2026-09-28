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
  Logseq_dom.dom ~key:"skip" ~tag:"button" ~id:"skip-to-main"
    ~style_class:"sr-only" ~text:"Skip to main content" []

let icon_btn ~key ~id ~cls ~icon ~title ~on_click =
  Logseq_dom.dom ~key ~tag:"button" ~id
    ~style_class:("button cp__header-btn " ^ cls)
    ~attrs:[ ("title", title); ("data-button", "icon") ]
    ~events:"click"
    ~on_dom_event:(fun name payload -> if name = "click" then on_click payload)
    [ Icons.icon ~size:20. ~cls:"" icon ]

let search_button =
  icon_btn ~key:"search-btn" ~id:"search-button" ~cls:"" ~icon:"search"

    ~title:"Search"
    ~on_click:(fun _ -> Runtime.send Action.Toggle_search)

let dots_button =
  Logseq_dom.dom ~key:"dots-btn" ~tag:"button"
    ~style_class:"button cp__header-btn toolbar-dots-btn"
    ~events:"click"
    ~on_dom_event:(fun name payload ->
      if name = "click" then (
        let x, y =
          match payload with
          | Some p ->
              ( Platform.payload_num p "clientX"
              , Platform.payload_num p "clientY" )
          | None -> (0., 0.)
        in
        Runtime.send (Action.Page_menu_set (Some (x, y)))))
    [ Icons.icon ~size:20. ~cls:"" "dots" ]

let left_menu_button =
  icon_btn ~key:"left-menu-btn" ~id:"left-menu" ~cls:"cp__header-left-menu"
    ~icon:"menu-2" ~title:"Toggle left sidebar"
    ~on_click:(fun _ -> Runtime.send Action.Toggle_left_sidebar)

(* cljs header.cljs: home button shows when route != :home — the
   all-journals list route still shows it *)
let home_button (ms : Model.t Signal.signal) =
  dyn ~equal:(fun a b -> a = b)
    (fun (m : Model.t) ->
      match m.route with
      | Model.Home -> Logseq_dom.dom ~key:"home-off" []
      | _ ->
          icon_btn ~key:"home-btn" ~id:"" ~cls:"" ~icon:"home" ~title:"Home"
            ~on_click:(fun _ ->
              Platform.set_location_hash "#/";
              Platform.dispatch "ls:navigate" Js.Json.null))
    ms

(* cljs open-right-sidebar! seeds a "contents" item when the sidebar
   is empty (state/sidebar-add-content-when-open!) *)
let right_toggle_button ms =
  icon_btn ~key:"rs-toggle" ~id:"" ~cls:"toggle-right-sidebar"
    ~icon:"layout-sidebar-right" ~title:"Toggle right sidebar"
    ~on_click:(fun _ ->
      Runtime.send Action.Toggle_right_sidebar;
      Sidebar_state.ensure_contents (Sidebar_state.ensure ms))

let header (ms : Model.t Signal.signal) =
  Logseq_dom.dom ~key:"head" ~tag:"header" ~id:"head"
    ~style_class:"cp__header"
    [ Logseq_dom.dom ~key:"head-inner"
        ~style_class:"l flex items-center drag-region"
        [ left_menu_button; search_button ]
    ; Logseq_dom.dom ~key:"head-r"
        ~style_class:
          "r flex drag-region justify-between items-center gap-2 overflow-x-hidden w-full"
        [ Logseq_dom.dom ~key:"head-crumb" ~style_class:"flex flex-1" []
        ; Logseq_dom.dom ~key:"head-acts" ~style_class:"flex items-center"
            [ home_button ms
            ; (* cljs header.cljs hook-ui-items :toolbar renders
                 .ui-items-container always; the plugins-manager trigger
                 only appears once a plugin is actually installed *)
              Logseq_dom.dom ~key:"ui-items"
                ~style_class:"ui-items-container"
                ~attrs:[ ("data-type", "toolbar") ]
                [ Logseq_dom.dom ~key:"ui-items-wrap" ~style_class:"list-wrap"
                    [ Left_sidebar_view.plugins_toolbar ms ] ]
            ; dots_button; right_toggle_button ms ]
        ]
    ]

(* right sidebar — hidden until toggled; e2e checks .cp__right-sidebar *)
let right_sidebar (ms : Model.t Signal.signal) =
  Logseq_dom.dom ~key:"right-sidebar" ~id:"right-sidebar"
    ~style_class_signal:
      (Logseq_dom.class_signal ms (fun (m : Model.t) ->
           "cp__right-sidebar"
           ^ if m.right_sidebar_open then " open" else ""))
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
          (Logseq_dom.attrs_signal ms (fun (m : Model.t) ->
               match m.route with
               | Model.Graph -> [ ("data-is-margin-less-pages", "true") ]
               | _ -> [ ("data-is-margin-less-pages", "false") ]))
        [ Logseq_dom.dom ~key:"main-inner"
            ~style_class:"cp__sidebar-main-content"
            ~attrs_signal_v:
              (Logseq_dom.attrs_signal ms (fun (m : Model.t) ->
                   (* cljs container.cljs: data-is-full-width on margin-less +
                      all-pages/all-files/my-publishing routes *)
                   let marginless =
                     match m.route with
                     | Model.Graph ->
                         [ ("data-is-margin-less-pages", "true")
                         ; ("data-is-full-width", "true") ]
                     | _ -> [ ("data-is-margin-less-pages", "false") ]
                   in
                   match m.route with
                   | Model.All_pages ->
                       ("data-is-full-width", "true") :: marginless
                   | _ -> marginless))
            [ Logseq_dom.dom ~key:"content-wrap"
                ~attrs_signal_v:
                  (Logseq_dom.attrs_signal ms (fun (m : Model.t) ->
                       (* cljs container.cljs: div.mx-auto.pb-24 around
                          main-content; margin-less routes keep an empty
                          class + 0 margin *)
                       match m.route with
                       | Model.Graph -> [ ("style", "margin-bottom: 0") ]
                       | _ ->
                           [ ("class", "mx-auto pb-24")
                           ; ("style", "margin-bottom: 120px") ]))
                [ dyn
                ~equal:(fun (a : Model.t) (b : Model.t) ->
                  a.phase = b.phase
                  && a.route = b.route
                  && a.route_page = b.route_page
                  && a.journals = b.journals
                  && a.page_refs = b.page_refs
                  && a.unlinked_refs = b.unlinked_refs
                  && a.editing_title = b.editing_title
                  && a.page_menu = b.page_menu
                  && a.confirm = b.confirm
                  && a.unlinked_open = b.unlinked_open
                  && a.unlinked_search = b.unlinked_search
                  && a.unlinked_query = b.unlinked_query
                  && a.gv = b.gv)
                (fun m -> Page.page_view_of_model m)
                ms ]
            ]
        ]
    ]

(* Overlay layer — cmdk palette, popups (autocomplete/slash/context
   menus), dialogs and toasts mount here (single shared container;
   e2e selects by class so the wrapper is transparent). *)
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
          a.page_menu = b.page_menu && a.confirm = b.confirm
          && a.route_page = b.route_page)
        (fun m -> Page_menu.dialog_view m)
        ms
    ]

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
      ; ("class", "icon icon-tabler icon-tabler-help-small")
      ; ("height", "24")
      ]
    ~style_class:"scale-125"
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
    ~style_class:"it flex items-center px-4 py-1 select-none"
    ~events:"click"
    ~on_dom_event:(fun n _ -> if n = "click" then act ())
    [ Logseq_dom.dom ~key:(key ^ "-i") ~tag:"span"
        ~style_class:"flex items-center pr-2 opacity-40"
        [ Icons.icon ~size:20. icon_name ]
    ; Logseq_dom.dom ~key:(key ^ "-t") ~tag:"strong"
        ~style_class:"font-normal" ~text:title []
    ]

let help_menu_popup : t =
  let close () =
    Runtime.send Action.Help_toggle;
    Runtime.flush ()
  in
  Logseq_dom.dom ~key:"help-menu" ~style_class:"cp__sidebar-help-menu-popup"
    [ Logseq_dom.dom ~key:"hm-wrap" ~style_class:"list-wrap"
        [ help_item "hm-handbook" (Strings.help_handbook) "book-2" close
        ; help_item "hm-shortcuts" (Strings.help_shortcuts) "command" close
        ; help_item "hm-docs" (Strings.help_docs) "help" (fun () ->
            open_url "https://docs.logseq.com/"; close ())
        ; Logseq_dom.dom ~key:"hm-hr1" ~tag:"hr" ~style_class:"!my-2" []
        ; help_item "hm-bug" (Strings.help_bug) "bug" close
        ; help_item "hm-feature" (Strings.help_feature) "git-pull-request"
            (fun () ->
              open_url
                "https://discuss.logseq.com/c/feedback/feature-requests/";
              close ())
        ; help_item "hm-feedback" (Strings.help_feedback) "messages"
            (fun () ->
              open_url "https://discuss.logseq.com/c/feedback/13"; close ())
        ; Logseq_dom.dom ~key:"hm-hr2" ~tag:"hr" ~style_class:"!my-2" []
        ; help_item "hm-discord" (Strings.help_discord) "brand-discord"
            (fun () -> open_url "https://discord.com/invite/KpN4eHY"; close ())
        ; help_item "hm-forum" (Strings.help_forum) "message" (fun () ->
            open_url "https://discuss.logseq.com/"; close ())
        ; Logseq_dom.dom ~key:"hm-hr3" ~tag:"hr" ~style_class:"!my-2" []
        ; help_item "hm-notes" (Strings.help_release_notes) "asterisk"
            (fun () ->
              open_url "https://docs.logseq.com/#/page/changelog"; close ())
        ]
    ; Logseq_dom.dom ~key:"hm-ft"
        ~style_class:"ft pl-11 pb-3 flex flex-col gap-1"
        [ Logseq_dom.dom ~key:"hm-ver" ~tag:"span"
            ~style_class:"opacity text-xs opacity-30" ~text:"Logseq " []
        ]
    ]

let help_area (ms : Model.t Signal.signal) : t =
  Logseq_dom.dom ~key:"help-area"
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
          else Logseq_dom.dom ~key:"hm-none" [])
        ms
    ]

let shell (ms : Model.t Signal.signal) : t =
  Logseq_dom.dom ~key:"wrapper" ~tag:"main" ~id:"app-container-wrapper"
    ~style_class_signal:
      (Logseq_dom.class_signal ms (fun (m : Model.t) ->
           "theme-container-inner"
           ^ if m.left_sidebar_open then " ls-left-sidebar-open" else ""
           ^ if m.right_sidebar_open then " ls-right-sidebar-open" else ""))
    [ skip_to_main
    ; Logseq_dom.dom ~key:"app" ~id:"app-container"
        ~style_class:"cp__sidebar-main-layout"
        [ Logseq_dom.dom ~key:"left-container" ~id:"left-container"
            [ header ms; main_content ms ]
        ; right_sidebar ms
        ; overlays ms
        ; help_area ms
        ]
    ]
