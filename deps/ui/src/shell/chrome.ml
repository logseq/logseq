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

let search_button =
  Logseq_dom.dom ~key:"search-btn" ~tag:"button" ~id:"search-button"
    ~style_class:"button cp__header-btn" ~text:"Search"
    ~events:"click"
    ~on_dom_event:(fun name _payload ->
      if name = "click" then Runtime.send Action.Toggle_search)
    []

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
    [ Logseq_dom.dom ~key:"dots-i" ~tag:"i" ~style_class:"ti ti-dots" [] ]

let left_menu_button =
  Logseq_dom.dom ~key:"left-menu-btn" ~tag:"button" ~id:"left-menu"
    ~style_class:"button cp__header-btn" ~text:"Menu"
    ~events:"click"
    ~on_dom_event:(fun name _payload ->
      if name = "click" then Runtime.send Action.Toggle_left_sidebar)
    []

let header =
  Logseq_dom.dom ~key:"head" ~tag:"header" ~id:"head"
    ~style_class:"cp__header"
    [ Logseq_dom.dom ~key:"head-inner" ~style_class:"l"
        [ left_menu_button ]
    ; Logseq_dom.dom ~key:"head-r" ~style_class:"r"
        [ search_button; dots_button ]
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
    ; Left_sidebar_view.menus ms
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
        [ Logseq_dom.dom ~key:"main-inner"
            ~style_class:"cp__sidebar-main-content"
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

(* Overlay layer — cmdk palette, popups (autocomplete/slash/context
   menus), dialogs and toasts mount here (single shared container;
   e2e selects by class so the wrapper is transparent). *)
let overlays (ms : Model.t Signal.signal) =
  Logseq_dom.dom ~key:"overlays" ~style_class:"cp__overlays"
    [ Cmdk_view.render ms
    ; Popups_view.render ms
    ; Dialogs_view.render ms
    ; Cards_view.render ms
    ; Toasts_view.render ms
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
            [ header; main_content ms ]
        ; right_sidebar ms
        ; overlays ms
        ]
    ]
