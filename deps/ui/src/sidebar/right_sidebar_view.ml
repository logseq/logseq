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
module D = Logseq_el

let t = Sidebar_state.t

(* component icon: tabler names go through the `app:` registry (only `x`
   matches a builtin here). `ui__icon` carries over from the cljs span
   wrapper; `ti` font classes are dropped — the kind renders its own svg *)
let icon_ ?key ?(cls = "") ?(size = 16) name =
  icon ?key
    ~name:(match name with "x" -> `x | n -> `app n)
    ~point_size:size
    ~style_class:("ui__icon" ^ if cls = "" then "" else " " ^ cls)
    []

(* .toggle-right-sidebar now lives in chrome.ml's header .r, matching
   cljs header.cljs layout. *)

(* ---------- topbar ---------- *)

let topbar_btn key label on_click =
  button ~key:("tb-" ^ key) ~text:label
    ~style_class:"button cp__right-sidebar-settings-btn"
    ~on_press:(fun _ -> on_click ()) []

let topbar st =
  (* cljs right_sidebar.cljs topbar: Contents / Page graph / Help, then
     dev-sidebar-items (rtc, undo-redo, profiler) in developer-mode *)
  let dev_items =
    if Settings_state.developer_mode () then
      [ topbar_btn "rtc" "(Dev) RTC" (fun () ->
            Sidebar_state.open_sticky_item st "rtc")
      ; topbar_btn "undo-redo" "(Dev) Undo/Redo" (fun () ->
            Sidebar_state.open_sticky_item st "undo-redo")
      ; topbar_btn "profiler" "(Dev) Profiler" (fun () ->
            Sidebar_state.open_sticky_item st "profiler")
      ]
    else []
  in
  row ~key:"rs-topbar" ~main:`space_between ~cross:`center
    ~style_class:"cp__right-sidebar-topbar"
    [ row ~key:"rs-settings" ~gap:4
        ~style_class:"cp__right-sidebar-settings hide-scrollbar"
        ([ topbar_btn "contents" (t "page/contents") (fun () ->
               Sidebar_state.open_sticky_item st "contents")
         ; topbar_btn "page-graph" (t "graph.page/title") (fun () ->
               Sidebar_state.open_sticky_item st "page-graph")
         ; topbar_btn "help" (t "nav/help") (fun () ->
               Sidebar_state.open_sticky_item st "help")
         ]
        @ dev_items)
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
    List.length (Runtime.signal_get st.Sidebar_state.items) > 1
  in
  let collapsed = it.Sidebar_state.collapsed in
  (* cljs page? = type :page|:contents — block items have a page_ref
     (breadcrumb parent) but are still :block *)
  let page_ =
    it.Sidebar_state.kind = "page" || it.Sidebar_state.kind = "contents"
  in
  let sep key = divider ~key ~style_class:"menu-separator" [] in
  (* cljs popup-show!: element-anchored dropdown — centered on the
     target (ls-anchor-cx), flipping above when the space below runs
     out (ls-anchor-top lifts it by its own height) *)
  let ax, atop, abot = !Sidebar_state.im_xy in
  let flip = Popups_state.anchor_above atop abot in
  let w = 160. in
  let x =
    Float.max ((w /. 2.) +. 5.)
      (Float.min ax (Web_dom.win_inner_width -. (w /. 2.) -. 5.))
  in
  popover ~key:("imenu-" ^ it.key)
    ~at:(x, if flip then atop else abot)
    ~role:`menu ~min_width:160
    ~on_dismiss:(fun _ -> Sidebar_state.close_menu st)
    ~style_class:
      ("ui__dropdown-menu-content ls-anchor-cx"
      ^ if flip then " ls-anchor-top" else "")
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
  reactive
    (fun menu ->
      if menu = "item-" ^ it.Sidebar_state.key then item_menu st it
      else spacer ~key:("imenu-none-" ^ it.key) [])
    (Signal.value st.Sidebar_state.open_menu)

(* ---------- item header / breadcrumb ---------- *)

let breadcrumb crumbs =
  let rec loop acc = function
    | [] -> List.rev acc
    | c :: rest ->
        loop
          (text ~key:("bc-" ^ c)
             ~style_class:"breadcrumb-item" ~value:c []
           :: text ~key:("bcsep-" ^ c) ~value:"/" ~padding_horizontal:4 []
           :: acc)
          rest
  in
  match crumbs with
  | [] -> spacer ~key:"bc-empty" []
  | first :: rest ->
      row ~key:"bc" ~style_class:"breadcrumb" ~cross:`center
        (text ~key:("bc-" ^ first)
           ~style_class:"breadcrumb-item" ~value:first []
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
            [ Logseq_emoji.el ~key:"pt-e" ~name:eid () ]
        | Some (_, iid) ->
            [ icon_ ~key:"pt-ti" ~cls:("ls-icon-" ^ iid) iid ]
        | None ->
            (* cljs icon/get-node-icon: class pages default to "hash",
               plain pages to "file"; both inside .icon-cp-container *)
            [ box ~key:"pt-ti" ~style_class:"icon-cp-container"
                ~foreground:"inherit"
                [ (* cljs get-node-icon-cp merges {:size 14} for all
                     icons *)
                  icon_ ~size:14
                    (if is_class then "hash" else "file") ]
            ]
      in
      row ~key:"pt" ~style_class:"page-title" ~cross:`center ~gap:4
        (icon_els
        @ [ text
              ~style_class:"overflow-hidden text-ellipsis"
              ~value:it.title []
          ])
  | [], "contents" ->
      (* cljs: (icon "list-details") + "Contents" *)
      row ~key:"pt-contents" ~cross:`center ~gap:8
        [ icon_ "list-details"; text ~value:it.title [] ]
  | [], "help" ->
      row ~key:"pt-help" ~cross:`center ~gap:8
        [ icon_ "help"; text ~value:it.title [] ]
  | [], "page-graph" ->
      (* cljs: (icon "hierarchy") + (t :graph.page/title) *)
      row ~key:"pt-page-graph" ~cross:`center ~gap:8
        [ icon_ "hierarchy"; text ~value:it.title [] ]
  | [], kind
    when kind = "rtc" || kind = "undo-redo" || kind = "profiler" ->
      (* cljs build-sidebar-item: icon + title in .flex.items-center *)
      let ic = match kind with "undo-redo" -> "rotate-clockwise" | _ -> "cloud" in
      row ~key:("pt-" ^ kind) ~cross:`center ~gap:8
        [ icon_ ic; text ~value:it.title [] ]
  | [], "shortcut-settings" ->
      (* cljs: (icon "command") + (t :help.shortcuts/label) *)
      row ~key:"pt-shortcuts" ~cross:`center ~gap:8
        [ icon_ "command"; text ~value:it.title [] ]
  | [], "search" ->
      (* cljs :search item header: ti-search icon + the query *)
      row ~key:"pt-search" ~cross:`center ~gap:8
        [ icon_ "search"; text ~value:it.title [] ]
  | [], _ -> text ~key:"pt-plain" ~value:it.title []
  | crumbs, _ -> breadcrumb crumbs

(* DOM-only bits deleted from the cljs header: draggable="true" (drag
   reorder is a platform concern) and the pointerup which=2 middle-click
   removal — LUI press events carry no button index *)
let item_header st idx (it : Sidebar_state.item) =
  let n = string_of_int idx in
  let collapsed = it.Sidebar_state.collapsed in
  row ~key:("hd-" ^ it.key) ~main:`space_between
    ~style_class:"sidebar-item-header color-level"
    [ button ~key:("hdr-" ^ it.key) ~grow:1. ~padding_horizontal:8
        (* page/block sidebar items can carry an empty title — a button
           with neither text nor accessibility label is rejected and
           kills the whole mount batch *)
        ~label:(if it.title = "" then t "ui/untitled" else it.title)
        ~accessibility_identifier:("sidebar-panel-header-" ^ n)
        ~on_press:(fun _ -> Sidebar_state.toggle_collapsed st it.key)
        [ row ~key:("arrow-" ^ it.key) ~cross:`center
            (* cljs: .rotating-arrow.(not-)collapsed > FA caret-right *)
            ~style_class:
              (if collapsed then "rotating-arrow collapsed"
               else "rotating-arrow not-collapsed")
            [ Ui_parts.rotating_arrow ("arw-" ^ it.key) ]
        ; box ~key:("ht-" ^ it.key) ~grow:1.
            [ item_title it ] ]
    ; row ~key:("ia-" ^ it.key) ~cross:`center
        ~style_class:"item-actions"
        [ button ~key:("more-" ^ it.key) ~variant:`ghost ~size:`icon
            ~icon:(`app "dots") ~label:(t "sidebar.right/more")
            ~accessibility_identifier:("sbi-more-" ^ it.key)
            ~style_class:"sidebar-item-more"
            ~width:32 ~height:32
            (* press events carry no pointer coordinates — anchor the
               menu at the button's rect instead of click clientX/Y *)
            ~on_press:(fun _ ->
              let ax, atop, abot =
                match
                  Web_dom.get_element_by_id ("sbi-more-" ^ it.key)
                with
                | Some el -> Popups_state.anchor_of_el el
                | None -> Popups_state.anchor_at_point ~x:0. ~y:0.
              in
              Sidebar_state.open_item_menu st it.key ~ax ~atop ~abot)
            []
        ; button ~key:("close-" ^ it.key) ~variant:`ghost ~size:`icon
            ~icon:`x ~label:(t "ui/close") ~width:32 ~height:32
            ~on_press:(fun _ -> Sidebar_state.remove_item st it.key)
            [] ]
    ]

(* cljs onboarding.cljs help pane: .help.cp__sidebar-help-docs is a
   flat sequence of p.mt-4.mb-1 > b section titles and ul lists of
   li > a rows (circle markers). Links point at external docs; the
   first li is an action opening the shortcut-settings pane. *)
let help_pane st =
  let ext_item ~key label url =
    box ~key ~style_class:"ls-hp-item"
      [ link ~url ~target:`blank ~style_class:"ls-hp-link" ~text:label [] ]
  in
  let icon_item ~key label ic =
    box ~key ~style_class:"ls-hp-item"
      [ text ~style_class:"ls-hp-link ls-hp-iconrow"
          ~on_press:(fun _ ->
            Sidebar_state.open_sticky_item st "shortcut-settings")
          [ row ~cross:`center ~gap:4
              [ text ~value:label []
              ; icon_ ~size:18 ic ] ]
      ]
  in
  let icon_ext_item ~key label ic url =
    box ~key ~style_class:"ls-hp-item"
      [ link ~url ~target:`blank ~style_class:"ls-hp-link"
          [ row ~cross:`center ~gap:4
              [ text ~value:label []
              ; icon_ ~size:18 ic ] ] ]
  in
  let section key title items =
    [ text ~key:("hpt-" ^ key) ~style_class:"ls-hp-title" ~value:title []
    ; box ~key:("hpu-" ^ key) ~style_class:"ls-hp-list" items ]
  in
  box ~key:"help-docs" ~style_class:"help cp__sidebar-help-docs"
    (section "usage" (t "help/usage-title")
       [ icon_item ~key:"li-shortcuts" (t "help.shortcuts/label")
           "command"
       ; ext_item ~key:"li-docs" (t "help/docs")
           "https://docs.logseq.com/"
       ; ext_item ~key:"li-start" (t "help/start")
           "https://docs.logseq.com/#/page/tutorial"
       ; ext_item ~key:"li-faq" "FAQ"
           "https://docs.logseq.com/#/page/faq" ]
    @ section "community" (t "help/community-title")
        [ ext_item ~key:"li-awesome" (t "help/awesome-logseq")
            "https://github.com/logseq/awesome-logseq"
        ; ext_item ~key:"li-blog" (t "help/blog") "https://blog.logseq.com"
        ; icon_ext_item ~key:"li-forum" (t "help/forum-community")
            "message-circle" "https://discuss.logseq.com" ]
    @ section "development" (t "help/development-title")
        [ ext_item ~key:"li-roadmap" (t "help/roadmap")
            "https://discuss.logseq.com/t/logseq-product-roadmap/34267"
        ; ext_item ~key:"li-bug" (t "help/bug")
            "https://github.com/logseq/db-test/issues/new?labels=from:in-app&template=bug_report.yaml"
        ; ext_item ~key:"li-feature" (t "help/feature")
            "https://discuss.logseq.com/c/feedback/feature-requests/"
        ; ext_item ~key:"li-changelog" (t "help/changelog")
            "https://docs.logseq.com/#/page/changelog" ]
    @ section "about" (t "help/about-title")
        [ ext_item ~key:"li-about" (t "help/about")
            "https://blog.logseq.com/about/" ]
    @ section "terms" (t "help/terms-title")
        [ ext_item ~key:"li-privacy" (t "help/privacy")
            "https://blog.logseq.com/privacy-policy/"
        ; ext_item ~key:"li-terms" (t "help/terms")
            "https://blog.logseq.com/terms/" ])

(* cljs sidebar-page-properties: ghost toggle + db-properties-cp +
   hr.my-4. collapsed? = (not class?) — class pages start expanded.
   The area mounts declaratively inside the host div. *)
let sidebar_props_row st (it : Sidebar_state.item) =
  let empty = spacer ~key:("props-none-" ^ it.key) [] in
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
              [ (* the data-sb-* attrs of the cljs host had no readers —
                   Properties_area.sidebar_area re-emits the sbprops-<id>
                   host itself *)
                box ~key:("parea-" ^ it.key)
                  ~style_class:"ls-page-properties ls-properties-area"
                  ~accessibility_identifier:("sbprops-" ^ uuid)
                  [ Properties_area.sidebar_area ~uuid
                      ~db_id:p.Model.page_db_id
                      ~title:p.Model.page_title
                      ~is_tag:p.Model.page_is_tag ]
              ; divider ~key:("phr-" ^ it.key) ~padding_vertical:16 [] ]
          in
          box ~key:("props-" ^ it.key)
            [ column ~gap:8
                (button ~variant:`ghost ~size:`sm
                   ~style_class:"ui__button text-muted-foreground"
                   ~text:
                     (t
                        (if collapsed then "page/open-properties"
                         else "page/hide-properties"))
                   ~on_press:(fun _ ->
                     Sidebar_state.toggle_props st it.key)
                   []
                 :: body)
            ])
  | _ -> empty

(* cljs page-inner (show-tabs?): class/property pages render
   .page-tabs > .w-full > tabpanel > .ml-1 hosting the objects view —
   mounted declaratively, one inst per sidebar item. The radix
   data-orientation/activation-direction attrs are inert markup here *)
let object_tabs_host (it : Sidebar_state.item) =
  match it.Sidebar_state.page with
  | Some p
    when p.Model.page_is_tag || p.Model.page_is_property -> (
      match p.Model.page_uuid with
      | None -> spacer ~key:("tabs-none-" ^ it.key) []
      | Some uuid ->
          let kind =
            if p.Model.page_is_tag then Views_state.KTagPage uuid
            else Views_state.KPropertyPage uuid
          in
          box ~key:("tabs-" ^ it.key) ~style_class:"page-tabs"
            [ box ~grow:1.
                [ box
                    ~style_class:"ui__tabs-content"
                    [ box ~key:("tabs-c-" ^ it.key)
                        [ Views_view.view ~kind ~owner:(Wire.Uuid uuid) ] ]
                ]
            ])
  | _ -> spacer ~key:("tabs-none-" ^ it.key) []

let item_body st idx (it : Sidebar_state.item) =
  let n = string_of_int idx in
  (* add-button indent/children flags — same rule the imperative
     doc-scan read off the DOM: the owner row is the item's own block
     (a block-kind item, blocks = [owner]) -> indented + children
     counted inside .block-children; otherwise the top-level rows
     count *)
  let indented =
    match it.Sidebar_state.uuid, it.Sidebar_state.blocks with
    | Some u, [ b ] -> b.Model.block_uuid = Some u
    | _ -> false
  in
  let has_children =
    if indented then
      match it.Sidebar_state.blocks with
      | [ b ] -> b.Model.block_children <> []
      | _ -> false
    else it.Sidebar_state.blocks <> []
  in
  (* cljs right_sidebar page items render the full page-inner body:
     .cp__page-inner-wrap > .page-inner > (props + tabs + blocks + refs).
     The cljs data-page-tags / data-sb-inner marker attrs have no readers
     and are dropped; the -20px page margin-left was a DOM-only inline
     style with no typed prop — dropped *)
  match it.Sidebar_state.kind with
  | "search" ->
      (* cljs build-sidebar-item :search mounts a cmdk-block, not the
         page-inner block tree *)
      box ~key:("body-" ^ it.key)
        ~accessibility_identifier:("sidebar-panel-content-" ^ n)
        ~style_class:
          ("sidebar-panel-content"
           ^ (if it.Sidebar_state.collapsed then " hidden" else " initial"))
        [ box ~key:("cmdkb-" ^ it.key)
            ~style_class:"cp__cmdk__block rounded-md"
            [ Cmdk_view.sidebar ~services:(Cmdk_host.services ()) ~query:it.title ]
        ]
  | "help" ->
      (* cljs :help items mount onboarding/help directly in
         .sidebar-panel-content — no page-inner/blocks wrap *)
      box ~key:("body-" ^ it.key)
        ~accessibility_identifier:("sidebar-panel-content-" ^ n)
        ~style_class:
          ("sidebar-panel-content"
           ^ (if it.Sidebar_state.collapsed then " hidden" else " initial"))
        ~padding_horizontal:8
        [ help_pane st ]
  | _ ->
  box ~key:("body-" ^ it.key)
    ~accessibility_identifier:("sidebar-panel-content-" ^ n)
    ~style_class:
      ("sidebar-panel-content"
       ^ (if it.Sidebar_state.collapsed then " hidden" else " initial"))
    ?padding_horizontal:
      (match it.Sidebar_state.kind with
       | "search" | "shortcut-settings" -> None
       | _ -> Some 8)
    [ column ~key:("wrap-" ^ it.key) ~grow:1.
        ~style_class:"page relative cp__page-inner-wrap"
        [ column ~key:("inner-" ^ it.key) ~gap:16
            ~style_class:"relative page-inner"
            ((match it.Sidebar_state.kind with
              | "page-graph" ->
                  [ (* the link-graph canvas isn't ported — same
                       explicit empty state the #/graph route shows *)
                    column ~key:"pg-empty" ~cross:`center ~main:`center
                      ~padding_vertical:64
                      [ box ~key:"pg-i" ~style_class:"mb-4"
                          [ icon_ ~size:48 "hierarchy" ]
                      ; text ~key:"pg-t"
                          ~value:(t "graph.page/title") []
                      ; text ~key:"pg-d"
                          ~value:"Graph view isn't available in this app yet."
                          []
                      ]
                  ]
              | _ -> [])
            @ [ sidebar_props_row st it
              ; object_tabs_host it
             ; box ~key:("pbi-" ^ it.key)
                 ~style_class:"ls-page-blocks"
                 [ (* data-cid is read by editor_actions' [data-cid]
                      closest queries *)
                   box ~key:("pbin-" ^ it.key)
                     ~style_class:"page-blocks-inner relative"
                     ~data_attrs:[ ("data-cid", "sidebar") ]
                     (List.map
                        (Tree.block_row ~scope:"sidebar")
                        it.blocks
                      @ [ Add_button.el ?puuid:it.Sidebar_state.uuid
                            ~flags:(fun ctx ->
                              Signal.constant ctx.Lui_ui.ui_scheduler
                                (has_children, indented))
                        ])
                 ]
             ]
            (* linked references sit inside .page-inner in cljs *)
            @ (match it.kind, it.uuid with
               | "page", Some uuid ->
                   [ Page.references_view ~page_uuid:uuid
                       ~has_refs:(it.linked_refs <> []) () ]
               | _ -> []))
        ]
    ]


let sidebar_item st idx (it : Sidebar_state.item) =
  column ~key:("item-" ^ it.key)
    ~style_class:
      ("sidebar-item content color-level item-type-"
       ^ it.kind
       ^ if it.Sidebar_state.collapsed then " collapsed" else "")
    ~accessibility_identifier:("sbi-" ^ it.Sidebar_state.key)
    [ column ~key:("wrap-" ^ it.key) ~grow:1. ~style_class:"relative"
        [ item_header st idx it
        ; item_body st idx it
        ; item_menu_host st it ]
    ]

(* ---------- inner ---------- *)

let inner st =
  column ~key:"rs-inner" ~accessibility_identifier:"right-sidebar-container"
    ~grow:1.
    ~style_class:"cp__right-sidebar-inner"
    [ scroll ~key:"rs-scroll" ~orientation:`vertical ~grow:1.
        ~style_class:"cp__right-sidebar-scrollable"
        [ column ~key:"rs-col" ~grow:1.
            [ topbar st
            ; reactive
                (fun items ->
                  column ~key:"rs-items" ~grow:1. ~padding_horizontal:8
                    ~style_class:"sidebar-item-list scrollbar-spacing"
                    (box ~key:"rs-drop" ~style_class:"sidebar-drop-indicator"
                       []
                     :: List.mapi (sidebar_item st) items))
                (Signal.value st.Sidebar_state.items) ] ]
    ]

let render (ms : Model.t Signal.signal) : t =
 fun ctx parent ->
  let st = Sidebar_state.ensure ms in
  (Logseq_el.fragment
     [ (* aria-value*/orientation attrs on the resizer were inert DOM
          markup — the separator kind carries the role *)
       separator ~key:"rs-resizer" ~orientation:`vertical
         ~style_class:"resizer" []
     ; if_
         ~test:
           (Logseq_el.own ctx
              (Signal.map
                 (fun (m : Model.t) -> m.Model.right_sidebar_open)
                 ms))
         (inner st)
     ])
    ctx parent
