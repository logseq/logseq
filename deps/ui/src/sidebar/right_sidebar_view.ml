(* Right sidebar contents — mirrors components/right_sidebar.cljs DOM
   contract (docs/e2e-contract.md §3.3):

   button.toggle-right-sidebar  (floating; header is chrome.ml's — kept
     inside this region so the class stays clickable while closed)
   .cp__right-sidebar.open      (wrapper in chrome.ml; only renders
     .cp__right-sidebar-inner when open)
     .resizer
     .cp__right-sidebar-inner#right-sidebar-container
       .cp__right-sidebar-scrollable
         .cp__right-sidebar-topbar > .cp__right-sidebar-settings
         .sidebar-item-list > .sidebar-item.item-type-<kind>*)

open Lui_elements
module D = Logseq_dom

let dom = D.dom
let dyn = D.dyn
let t = Sidebar_state.t

(* .toggle-right-sidebar now lives in chrome.ml's header .r, matching
   cljs header.cljs layout. *)

(* ---------- topbar ---------- *)

let topbar_btn key label on_click =
  dom ~key:("tb-" ^ key) ~style_class:"text-sm"
    [ dom ~tag:"button"
        ~style_class:"button cp__right-sidebar-settings-btn"
        ~events:"click" ~on_dom_event:on_click
        ~text:label [] ]

let topbar st =
  dom ~key:"rs-topbar"
    ~style_class:
      "cp__right-sidebar-topbar flex flex-row justify-between items-center"
    [ dom ~key:"rs-settings"
        ~style_class:"cp__right-sidebar-settings hide-scrollbar gap-1"
        [ topbar_btn "contents" (t "page/contents") (fun n _ ->
              if n = "click" then
                Sidebar_state.open_sticky_item st "contents")
        ; topbar_btn "help" (t "nav/help") (fun n _ ->
              if n = "click" then Sidebar_state.open_sticky_item st "help")
        ]
    ]

(* ---------- item menus ---------- *)

let menu_item st label on_click =
  Menu_item.el ~key:("mi-" ^ label)
    ~cls:"ui__dropdown-menu-item"
    ~attrs:[ ("role", "menuitem") ]
    ~label
    ~on_click:(fun () ->
      Sidebar_state.close_menu st;
      on_click ())
    ()

(* cljs right_sidebar.cljs actions-menu-content: Close / [multi] Close
   others / [multi] Close all / sep / Collapse / [multi] Collapse others /
   [multi] Collapse all / sep / Expand / [multi] Expand all /
   [page] sep + Open as page *)
let item_menu st (it : Sidebar_state.item) =
  let multi =
    List.length (Signal.get_state st.Sidebar_state.items) > 1
  in
  let collapsed = it.Sidebar_state.collapsed in
  (* cljs page? = type :page|:contents — block items have a page_ref
     (breadcrumb parent) but are still :block *)
  let page_ =
    it.Sidebar_state.kind = "page" || it.Sidebar_state.kind = "contents"
  in
  let sep key = dom ~key ~tag:"hr" ~style_class:"menu-separator" [] in
  dom ~key:("imenu-" ^ it.key) ~tag:"div"
    ~attrs:
      [ ("role", "menu")
      ; ( "style"
        , Printf.sprintf
            "position:fixed;left:%.0fpx;top:%.0fpx;z-index:1501;min-width:160px"
            (fst !Sidebar_state.im_xy) (snd !Sidebar_state.im_xy) ) ]
    ~style_class:"ui__dropdown-menu-content ui__dropdown-menu"
    (menu_item st (t "ui/close")
       (fun () -> Sidebar_state.remove_item st it.key)
     :: (if multi then
           [ menu_item st (t "sidebar.right/close-others")
               (fun () -> Sidebar_state.remove_rest st it.key)
           ; menu_item st (t "sidebar.right/close-all")
               (fun () -> Sidebar_state.clear_items st) ]
         else [])
     @ (if multi && not collapsed then [ sep "s1" ] else [])
     @ (if not collapsed then
          [ menu_item st (t "sidebar.right/collapse")
              (fun () -> Sidebar_state.set_collapsed st it.key true) ]
        else [])
     @ (if multi then
          [ menu_item st (t "sidebar.right/collapse-others")
              (fun () -> Sidebar_state.collapse_others st it.key true)
          ; menu_item st (t "sidebar.right/collapse-all")
              (fun () -> Sidebar_state.collapse_all st true) ]
        else [])
     @ (if multi && collapsed then [ sep "s2" ] else [])
     @ (if collapsed then
          [ menu_item st (t "sidebar.right/expand")
              (fun () -> Sidebar_state.set_collapsed st it.key false) ]
        else [])
     @ (if multi then
          [ menu_item st (t "sidebar.right/expand-all")
              (fun () -> Sidebar_state.collapse_all st false) ]
        else [])
     @ (if page_ then
          [ sep "s3"
          ; menu_item st (t "sidebar.right/open-as-page")
              (fun () -> Sidebar_state.open_as_page st it) ]
        else []))

let item_menu_host st (it : Sidebar_state.item) =
  dyn ~equal:(fun a b -> a = b)
    (fun menu ->
      if menu = "item-" ^ it.Sidebar_state.key then item_menu st it
      else dom ~key:("imenu-none-" ^ it.key) [])
    (Signal.value st.Sidebar_state.open_menu)

(* ---------- item header / breadcrumb ---------- *)

let breadcrumb crumbs =
  let rec loop acc = function
    | [] -> List.rev acc
    | c :: rest ->
        loop
          (dom ~key:("bc-" ^ c) ~tag:"span"
             ~style_class:"breadcrumb-item" ~text:c []
           :: dom ~key:("bcsep-" ^ c) ~tag:"span"
                ~style_class:"opacity-50 px-1" ~text:"/" []
           :: acc)
          rest
  in
  match crumbs with
  | [] -> dom ~key:"bc-empty" []
  | first :: rest ->
      dom ~key:"bc" ~style_class:"breadcrumb"
        (dom ~key:("bc-" ^ first) ~tag:"span"
           ~style_class:"breadcrumb-item" ~text:first []
         :: List.rev (loop [] rest))

let item_title (it : Sidebar_state.item) =
  match it.breadcrumb, it.kind with
  | [], "page" ->
      let is_class =
        match it.Sidebar_state.page with
        | Some p -> p.Model.page_is_tag || p.Model.page_is_property
        | None -> false
      in
      let icon_els =
        match it.icon with
        | Some ("emoji", eid) ->
            [ dom ~key:"pt-e" ~tag:"em-emoji" ~attrs:[ "id", eid ] [] ]
        | Some (_, iid) ->
            [ dom ~key:"pt-ti" ~style_class:("ui__icon ti ls-icon-" ^ iid)
                [ dom ~key:"pt-tii" ~tag:"i" ~style_class:("ti ti-" ^ iid)
                    []
                ]
            ]
        | None ->
            (* cljs icon/get-node-icon: class pages default to "hash",
               plain pages to "file"; both inside .icon-cp-container *)
            [ dom ~key:"pt-ti"
                ~style_class:"text-md icon-cp-container flex items-center"
                ~attrs:[ "style", "color: inherit" ]
                [ if is_class then Icons.icon ~size:14. ~cls:"text-md" "hash"
                  else Icons.icon ~size:16. "file"
                ]
            ]
      in
      dom ~key:"pt" ~style_class:"flex items-center page-title gap-1"
        (icon_els
        @ [ dom ~tag:"span"
              ~style_class:"overflow-hidden text-ellipsis"
              ~text:it.title []
          ])
  | [], "contents" ->
      (* cljs: (icon "list-details") + "Contents" *)
      dom ~key:"pt-contents" ~style_class:"flex items-center"
        [ Icons.icon ~cls:"text-md mr-2" "list-details"
        ; dom ~tag:"span" ~text:it.title [] ]
  | [], "help" ->
      dom ~key:"pt-help" ~style_class:"flex items-center"
        [ Icons.icon ~cls:"text-md mr-2" "help"
        ; dom ~tag:"span" ~text:it.title [] ]
  | [], _ -> dom ~key:"pt-plain" ~style_class:"flex items-center" ~text:it.title []
  | crumbs, _ -> breadcrumb crumbs

let item_header st idx (it : Sidebar_state.item) =
  let n = string_of_int idx in
  let collapsed = it.Sidebar_state.collapsed in
  dom ~key:("hd-" ^ it.key)
    ~style_class:
      ("flex flex-row justify-between sidebar-item-header color-level \
        rounded-t-md"
       ^ if collapsed then " rounded-b-md" else "")
    ~attrs:[ ("draggable", "true") ]
    ~events:"pointerup"
    ~on_dom_event:(fun name payload ->
      (* cljs on-pointer-up: middle click removes the sidebar item *)
      if
        name = "pointerup"
        && (Platform.payload_num payload "which" = 2.)
      then Sidebar_state.remove_item st it.key)
    [ dom ~key:("hdr-" ^ it.key) ~tag:"button"
        ~style_class:"flex flex-row px-2 items-center w-full overflow-hidden"
        ~attrs:
          [ ("aria-expanded", string_of_bool (not collapsed))
          ; ("id", "sidebar-panel-header-" ^ n)
          ; ("aria-controls", "sidebar-panel-content-" ^ n)
          ]
        ~events:"click"
        ~on_dom_event:(fun name _ ->
          if name = "click" then Sidebar_state.toggle_collapsed st it.key)
        [ dom ~key:("arrow-" ^ it.key) ~tag:"span"
            ~style_class:"opacity-50 hover:opacity-100 flex items-center pr-1"
            (* cljs: .rotating-arrow.(not-)collapsed > FA caret-right *)
            [ dom ~tag:"span"
                ~style_class:
                  (if collapsed then "rotating-arrow collapsed"
                   else "rotating-arrow not-collapsed")
                [ Ui_parts.rotating_arrow ("arw-" ^ it.key) ] ]
        ; dom ~key:("ht-" ^ it.key)
            ~style_class:
              "ml-1 font-medium text-sm overflow-hidden whitespace-nowrap"
            [ item_title it ] ]
    ; dom ~key:("ia-" ^ it.key)
        ~style_class:"item-actions flex items-center"
        [ dom ~key:("more-" ^ it.key) ~tag:"button"
            ~style_class:"px-2 py-2 h-8 w-8 text-muted-foreground"
            ~attrs:[ ("data-testid", "sidebar-item-more") ]
            ~events:"click"
            ~on_dom_event:(fun name payload ->
              if name = "click" then
                Sidebar_state.open_item_menu st it.key
                  ~x:(Platform.payload_num payload "clientX")
                  ~y:(Platform.payload_num payload "clientY"))
            [ Icons.icon "dots" ]
        ; dom ~key:("close-" ^ it.key) ~tag:"button"
            ~style_class:"px-2 py-2 h-8 w-8 text-muted-foreground"
            ~attrs:[ ("title", t "ui/close") ]
            ~events:"click"
            ~on_dom_event:(fun name _ ->
              if name = "click" then Sidebar_state.remove_item st it.key)
            [ Icons.icon "x" ] ]
    ]

(* cljs sidebar-page-properties: ghost toggle + db-properties-cp +
   hr.my-4. collapsed? = (not class?) — class pages start expanded. The
   area itself is mounted imperatively by
   Properties_area.mount_sidebar_area off the data-sb-* host. *)
let sidebar_props_row st (it : Sidebar_state.item) =
  let empty = dom ~key:("props-none-" ^ it.key) [] in
  match it.Sidebar_state.kind with
  | "contents" | "page" -> (
      match it.Sidebar_state.page with
      | None -> empty
      | Some p ->
          let collapsed = it.Sidebar_state.props_collapsed in
          let uuid = Option.value p.Model.page_uuid ~default:"" in
          let body =
            if collapsed then []
            else
              [ dom ~key:("parea-" ^ it.key)
                  ~style_class:
                    "ls-page-properties ls-properties-area"
                  ~attrs:
                    [ ("id", "sbprops-" ^ uuid)
                    ; ("tabindex", "0")
                    ; ("data-sb-uuid", uuid)
                    ; ( "data-sb-db-id"
                      , match p.Model.page_db_id with
                        | Some i -> string_of_int i
                        | None -> "" )
                    ; ("data-sb-title", p.Model.page_title)
                    ; ( "data-sb-tag"
                      , if p.Model.page_is_tag then "1" else "0" )
                    ]
                  []
              ; dom ~key:("phr-" ^ it.key) ~tag:"hr"
                  ~style_class:"my-4" []
              ]
          in
          dom ~key:("props-" ^ it.key) ~style_class:"-mb-8"
            [ dom
                ~style_class:
                  "ls-sidebar-page-properties flex flex-col gap-2 mt-2"
                (dom
                   [ dom ~tag:"button"
                       ~style_class:
                         "ui__button inline-flex items-center px-1 \
                          text-muted-foreground h-7 text-sm"
                       ~events:"click"
                       ~on_dom_event:(fun name _ ->
                         if name = "click" then
                           Sidebar_state.toggle_props st it.key)
                       [ dom ~tag:"span" ~style_class:"text-xs"
                           ~text:
                             (t
                                (if collapsed then "page/open-properties"
                                 else "page/hide-properties"))
                           [] ]
                   ]
                 :: body)
            ])
  | _ -> empty

(* cljs page-inner (show-tabs?): class/property pages render
   .page-tabs > .w-full > tabpanel > .ml-1 hosting the objects view.
   Views_mount.ensure_object_view mounts it off data-sb-views-*. *)
let object_tabs_host (it : Sidebar_state.item) =
  match it.Sidebar_state.page with
  | Some p
    when p.Model.page_is_tag || p.Model.page_is_property -> (
      match p.Model.page_uuid with
      | None -> dom ~key:("tabs-none-" ^ it.key) []
      | Some uuid ->
          let kind =
            if p.Model.page_is_tag then "tag" else "property"
          in
          dom ~key:("tabs-" ^ it.key) ~style_class:"page-tabs"
            ~attrs:[ ("data-views-owner", uuid); ("data-sb-kind", kind) ]
            [ dom ~style_class:"w-full"
                ~attrs:
                  [ ("data-orientation", "horizontal")
                  ; ("data-activation-direction", "none") ]
                [ dom
                    ~style_class:
                      "ui__tabs-content mt-2 ring-offset-background \
                       focus-visible:outline-none \
                       focus-visible:ring-2 focus-visible:ring-ring \
                       focus-visible:ring-offset-2"
                    ~attrs:
                      [ ("data-orientation", "horizontal")
                      ; ("role", "tabpanel"); ("tabindex", "0")
                      ; ("data-index", "0") ]
                    [ dom ~key:("tabs-c-" ^ it.key) ~style_class:"ml-1"
                        ~attrs:
                          [ ("data-sb-views-owner", uuid)
                          ; ("data-sb-kind", kind) ]
                        [] ]
                ]
            ])
  | _ -> dom ~key:("tabs-none-" ^ it.key) []

let item_body st idx (it : Sidebar_state.item) =
  let n = string_of_int idx in
  let is_node, wrap_attrs, margin_left =
    match it.Sidebar_state.page with
    | Some p ->
        ( p.Model.page_is_tag || p.Model.page_is_property
        , (match p.Model.page_tags with
           | [] -> []
           | tags ->
               (* cljs data-page-tags: JSON array of tag titles *)
               [ ( "data-page-tags"
                 , "["
                   ^ String.concat ","
                       (List.map
                          (fun t -> "\"" ^ String.escaped t ^ "\"")
                          tags)
                   ^ "]" )
               ])
        , "margin-left: -20px;" )
    | None -> (false, [], "")
  in
  (* cljs right_sidebar page items render the full page-inner body:
     .cp__page-inner-wrap > .page-inner > (props + tabs + blocks + refs) *)
  dom ~key:("body-" ^ it.key)
    ~attrs:
      [ ("role", "region")
      ; ("id", "sidebar-panel-content-" ^ n)
      ; ("aria-labelledby", "sidebar-panel-header-" ^ n)
      ]
    ~style_class:
      ("sidebar-panel-content"
       ^ (if it.Sidebar_state.collapsed then " hidden" else " initial")
       ^
       match it.Sidebar_state.kind with
       | "search" | "shortcut-settings" -> ""
       | _ -> " px-2")
    [ dom ~key:("wrap-" ^ it.key)
        ~style_class:
          ("flex-1 page relative cp__page-inner-wrap"
          ^ if is_node then " is-node-page" else "")
        ~attrs:wrap_attrs
        [ dom ~key:("inner-" ^ it.key)
            ~style_class:"relative grid gap-4 sm:gap-8 page-inner mb-16"
            ~attrs:[ "data-sb-inner", it.key ]
            ([ sidebar_props_row st it
             ; object_tabs_host it
             ; dom ~key:("pbi-" ^ it.key)
                 ~style_class:"ls-page-blocks"
                 ~attrs:
                   (if margin_left = "" then []
                    else [ "style", margin_left ])
                 [ dom ~key:("pbin-" ^ it.key)
                     ~style_class:"page-blocks-inner relative"
                     ~attrs:[ ("data-cid", "sidebar") ]
                     (List.map
                        (Tree.block_row ~scope:"sidebar")
                        it.blocks)
                 ]
             ]
            (* linked references sit inside .page-inner in cljs *)
            @ (if it.kind = "page" then
                 [ Page.references_view it.linked_refs ]
               else []))
        ]
    ]


let sidebar_item st idx (it : Sidebar_state.item) =
  dom ~key:("item-" ^ it.key)
    ~style_class:
      ("flex sidebar-item content color-level rounded-md shadow-lg item-type-"
       ^ it.kind
       ^ if it.Sidebar_state.collapsed then " collapsed" else "")
    ~attrs:[ ("data-item-key", it.Sidebar_state.key) ]
    [ dom ~key:("wrap-" ^ it.key)
        ~style_class:"flex flex-col w-full relative"
        [ item_header st idx it
        ; item_body st idx it
        ; item_menu_host st it ]
    ]

(* ---------- inner ---------- *)

let inner st =
  dom ~key:"rs-inner" ~id:"right-sidebar-container"
    ~style_class:"cp__right-sidebar-inner flex flex-col h-full"
    [ dom ~key:"rs-scroll" ~style_class:"cp__right-sidebar-scrollable"
        [ topbar st
        ; dyn ~equal:(fun a b -> a = b)
            (fun items ->
              dom ~key:"rs-items"
                ~style_class:"sidebar-item-list flex-1 scrollbar-spacing px-2"
                (dom ~key:"rs-drop" ~style_class:"sidebar-drop-indicator" []
                 :: List.mapi (sidebar_item st) items))
            (Signal.value st.Sidebar_state.items)
        ]
    ]

let render (ms : Model.t Signal.signal) : t =
  let st = Sidebar_state.ensure ms in
  Logseq_dom.fragment
    [ dom ~key:"rs-resizer" ~style_class:"resizer"
        ~attrs:
          [ ("role", "separator")
          ; ("data-expanded", "true")
          ; ("tabindex", "0")
          ; ("aria-valuemax", "70")
          ; ("aria-orientation", "vertical")
          ; ("aria-label", t "sidebar.right/resize-handle")
          ; ("aria-valuemin", "10")
          ; ("aria-valuenow", "50")
          ]
        []
    ; if_
        ~test:
          (Signal.map
             (fun (m : Model.t) -> m.Model.right_sidebar_open)
             ms)
        (inner st)
    ]
