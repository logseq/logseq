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
module P = Lui_protocol

let t = Sidebar_state.t


(* Sidebar glyphs use the shared canonical registry and semantic wrapper. *)
let icon_ ?key ?(cls = "") ?(size = 16) name =
  icon ?key
    ~name:(Icons.name_ref name)
    ~point_size:size
    ~style_class:("ui__icon" ^ if cls = "" then "" else " " ^ cls)
    []

(* .toggle-right-sidebar now lives in chrome.ml's header .r, matching
   cljs header.cljs layout. *)

(* ---------- topbar ---------- *)

let topbar_btn key label on_click =
  Ui_components.button ~variant:`ghost ~key:("tb-" ^ key) ~text:label
    ~height:32 ~padding_horizontal:10 ~padding_vertical:4 ~corner_radius:6
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
  fun ctx parent ->
    Ui_components.with_props
    [ Ui_components.Prop.inset_top 0.
    ; Ui_components.Prop.inset_left 0.
    ; Ui_components.Prop.inset_right 0.
    ; Ui_components.Prop.z_index 999
    ; Ui_components.Prop.user_select `none ]
    (row ~key:"rs-topbar" ~main:`space_between ~cross:`center
       ~data_attrs_signal:
         (Signal.constant ctx.Lui_ui.ui_scheduler
            [ ( "style"
              , "position:sticky;top:0;-webkit-app-region:drag" ) ])
       ~height:48 ~padding_horizontal:4
       ~background:
         "var(--ls-right-sidebar-topbar-color, var(--lx-gray-02, \
          var(--ls-secondary-background-color, #d8e1e8)))"
       ~style_class:"cp__right-sidebar-topbar"
       [ row ~key:"rs-settings" ~gap:4
           ~style_class:"cp__right-sidebar-settings hide-scrollbar"
           ~data_attrs:[ ("style", "margin:0;overflow:auto") ]
           ([ topbar_btn "contents" (t "page/contents") (fun () ->
                  Sidebar_state.open_sticky_item st "contents")
            ; topbar_btn "help" (t "nav/help") (fun () ->
                  Sidebar_state.open_sticky_item st "help")
            ]
           @ dev_items)
       ])
    ctx parent

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
  let sep key =
    box ~key ~opacity:0.5
      [ divider ~key:"d" ~style_class:"menu-separator" ~margin_vertical:4
          ~data_attrs:
            [ ("style", "border-top:1px solid hsl(var(--border))") ]
          [] ]
  in
  (* cljs popup-show!: element-anchored dropdown — centered on the
     target (ls-anchor-cx), flipping above when the space below runs
     out (ls-anchor-top lifts it by its own height) *)
  let ax, atop, abot = !Sidebar_state.im_xy in
  let flip = Popups_state.anchor_above atop abot in
  let w = 160. in
  let x =
    Float.max ((w /. 2.) +. 5.)
      (Float.min ax (Ui_services.dom_viewport_width () -. (w /. 2.) -. 5.))
  in
  popover ~key:("imenu-" ^ it.key)
    ~at:(x, if flip then atop else abot)
    ~role:`menu ~min_width:160
    ~transition:Ui_components.popover_transition
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
          (Ui_components.with_props
             [ Ui_components.Prop.opacity 0.7
             ; Ui_components.Prop.hover_opacity 1. ]
             (text ~key:("bc-" ^ c)
                ~style_class:"breadcrumb-item" ~value:c [])
           :: text ~key:("bcsep-" ^ c) ~value:"/" ~padding_horizontal:4 []
           :: acc)
          rest
  in
  match crumbs with
  | [] -> spacer ~key:"bc-empty" []
  | first :: rest ->
      row ~key:"bc" ~style_class:"breadcrumb" ~cross:`center
        ~data_attrs:[ ("style", "margin:0;text-align:left") ]
        (Ui_components.with_props
           [ Ui_components.Prop.opacity 0.7
           ; Ui_components.Prop.hover_opacity 1. ]
           (text ~key:("bc-" ^ first)
              ~style_class:"breadcrumb-item" ~value:first [])
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
            [ row ~key:"pt-ti" ~style_class:"icon-cp-container"
                ~cross:`center ~foreground:"inherit"
                [ (* cljs get-node-icon-cp merges {:size 14} for all
                     icons *)
                  icon_ ~size:14
                    (if is_class then "hash" else "file") ]
            ]
      in
      row ~key:"pt" ~style_class:"page-title" ~cross:`center ~gap:4
        (icon_els
        @ [ text ~text_overflow:"ellipsis" ~value:it.title []
          ])
  | [], "contents" ->
      (* cljs: (icon "list-details") + "Contents" *)
      row ~key:"pt-contents" ~cross:`center ~gap:8
        [ icon_ "list-details"; text ~value:it.title [] ]
  | [], "help" ->
      row ~key:"pt-help" ~cross:`center ~gap:8
        [ icon_ "help"; text ~value:it.title [] ]
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
  row ~key:("hd-" ^ it.key) ~main:`space_between ~cross:`center
    ~height:32 ~min_height:32
    ~background:"var(--color-level-2)"
    ~style_class:"sidebar-item-header color-level"
    ~data_attrs:[ ("style", "box-sizing:border-box") ]
    [ Ui_components.button ~key:("hdr-" ^ it.key) ~variant:`ghost ~grow:1. ~padding_horizontal:8
        ~height:32
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
        [ Ui_components.button ~key:("more-" ^ it.key) ~variant:`ghost ~size:`icon
            ~main:`center ~cross:`center
            ~label:(t "sidebar.right/more")
            ~accessibility_identifier:("sbi-more-" ^ it.key)
            ~style_class:"sidebar-item-more"
            ~width:32 ~height:32
            ~data_attrs:[ ("style", "padding:0;margin-left:8px") ]
            (* press events carry no pointer coordinates — anchor the
               menu at the button's rect instead of click clientX/Y *)
            ~on_press:(fun _ ->
              let ax, atop, abot =
                match
                  Ui_services.dom_by_id ("sbi-more-" ^ it.key)
                with
                | Some el -> Popups_state.anchor_of_el el
                | None -> Popups_state.anchor_at_point ~x:0. ~y:0.
              in
              Sidebar_state.toggle_item_menu st it.key ~ax ~atop ~abot)
            [ Icons.icon ~size:16. "dots" ]
        ; Ui_components.button ~key:("close-" ^ it.key) ~variant:`ghost ~size:`icon
            ~main:`center ~cross:`center
            ~label:(t "ui/close") ~width:32 ~height:32
            ~data_attrs:[ ("style", "padding:0;margin-left:8px") ]
            ~on_press:(fun _ -> Sidebar_state.remove_item st it.key)
            [ Icons.icon ~size:16. "x" ] ]
    ]

(* cljs onboarding.cljs help pane: .help.cp__sidebar-help-docs is a
   flat sequence of p.mt-4.mb-1 > b section titles and ul lists of
   li > a rows (circle markers). Links point at external docs; the
   first li is an action opening the shortcut-settings pane. *)
let help_pane st =
  let item_style =
    "display:list-item;list-style:circle;font-size:16px;\
     line-height:24px;margin-top:4px"
  in
  let ext_item ~key label url =
    box ~key ~style_class:"ls-hp-item"
      ~data_attrs:[ ("style", item_style) ]
      [ link ~url ~target:`blank ~text:label [] ]
  in
  let icon_item ~key label ic =
    box ~key ~style_class:"ls-hp-item"
      ~data_attrs:[ ("style", item_style) ]
      [ text ~style_class:"ls-hp-iconrow"
          ~foreground:"var(--lx-accent-11, var(--ls-link-text-color))"
          ~data_attrs:[ ("style", "cursor:pointer") ]
          ~on_press:(fun _ ->
            Sidebar_state.open_sticky_item st "shortcut-settings")
          [ row ~cross:`center ~gap:4
              [ text ~value:label []
              ; icon_ ~size:18 ic ] ]
      ]
  in
  let icon_ext_item ~key label ic url =
    box ~key ~style_class:"ls-hp-item"
      ~data_attrs:[ ("style", item_style) ]
      [ link ~url ~target:`blank
          [ row ~cross:`center ~gap:4
              [ text ~value:label []
              ; icon_ ~size:18 ic ] ] ]
  in
  let section key title items =
    [ text ~key:("hpt-" ^ key) ~style_class:"ls-hp-title"
        ~font_size:"16px" ~line_height:"24px" ~font_weight:700
        ~foreground:"var(--ls-primary-text-color)"
        ~data_attrs:[ ("style", "display:block;margin:16px 0 4px") ]
        ~value:title []
    ; box ~key:("hpu-" ^ key) ~style_class:"ls-hp-list"
        ~data_attrs:[ ("style", "display:block;margin-left:19.2px") ]
        items ]
  in
  box ~key:"help-docs" ~style_class:"help cp__sidebar-help-docs"
    ~data_attrs:[ ("style", "display:block;margin:4px 0 0 8px") ]
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

(* Both shells use one retained trigger and the same menu geometry. *)
let help_trigger () =
  let background="var(--lx-gray-02, var(--ls-secondary-background-color))" in
  Ui_components.with_props
    [Ui_components.Prop.opacity 0.7;Ui_components.Prop.hover_opacity 1.;
     Ui_components.Prop.font_weight 700;
     Ui_components.Prop.hover_background background;
     Ui_components.Prop.hover_foreground "var(--ls-primary-text-color)"]
    (Ui_components.button ~key:"help" ~variant:`ghost ~label:(t "help/toggle-menu")
      ~accessibility_identifier:"help-menu-trigger" ~style_class:"cp__sidebar-help-btn"
      ~width:32 ~height:32 ~min_width:32 ~min_height:32 ~padding:0 ~gap:0
      ~main:`center ~cross:`center ~corner_radius:16 ~background
      ~foreground:"var(--ls-primary-text-color)"
      ~on_press:(fun _ -> Runtime.send Action.Help_toggle;Runtime.flush ())
      [icon_ ~size:30 "help-small"])

let help_menu ~close ~open_handbook ~open_bug_report () =
  let item key title icon_name action =
    Ui_components.with_props
      [Ui_components.Prop.font_size "16px";Ui_components.Prop.line_height "24px";
       Ui_components.Prop.font_weight 400;Ui_components.Prop.foreground "var(--ls-primary-text-color)";
       Ui_components.Prop.hover_background "var(--ls-tertiary-background-color, var(--rx-gray-05))"]
      (Ui_components.button ~key ~variant:`ghost ~label:title
        ~height:32 ~min_height:32 ~corner_radius:0 ~min_width:0
        ~padding_horizontal:16 ~padding_vertical:4 ~main:`start ~cross:`center ~gap:8
        ~on_press:(fun _ -> action ();close ())
        [row ~opacity:0.4 [Icons.icon ~size:20. icon_name];text ~value:title []]) in
  let external_item key label icon_name url =
    item key (t label) icon_name (fun () -> Ui_services.env_open_url url) in
  let separator key=divider ~key ~height:1 ~margin_vertical:8
    ~background:"hsl(var(--border))" [] in
  Ui_components.with_props
    [Ui_components.Prop.shadow "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"]
    (popover ~key:"help-menu" ~style_class:"cp__sidebar-help-menu-popup"
      ~transition:Ui_components.popover_transition ~role:`dialog
      ~anchor_target:"help-menu-trigger" ~anchor:`above ~anchor_alignment:`end_ ~anchor_offset:8.
      ~width:260 ~padding:0 ~border_width:1 ~border_color:"hsl(var(--border))"
      ~corner_radius:8 ~background:"var(--ls-secondary-background-color, var(--rx-gray-03))"
      ~on_dismiss:(fun _ -> close ())
      [Ui_components.with_props [Ui_components.Prop.padding_top 12]
        (column ~key:"hm-wrap"
          [item "hm-handbook" (t "help/handbook") "book-2" open_handbook;
           item "hm-shortcuts" (t "help.shortcuts/label") "command" Sidebar_state.open_shortcuts;
           external_item "hm-docs" "help/docs" "help" "https://docs.logseq.com/";
           separator "hm-hr1";
           item "hm-bug" (t "help/bug") "bug" open_bug_report;
           external_item "hm-feature" "help/feature" "git-pull-request"
             "https://discuss.logseq.com/c/feedback/feature-requests/";
           external_item "hm-feedback" "help/submit-feedback" "messages" "https://discuss.logseq.com/c/feedback/13";
           separator "hm-hr2";
           external_item "hm-discord" "help/ask-community" "brand-discord" "https://discord.com/invite/KpN4eHY";
           external_item "hm-forum" "help/support-forum" "message" "https://discuss.logseq.com/";
           separator "hm-hr3";
           external_item "hm-notes" "help/release-notes" "asterisk" "https://docs.logseq.com/#/page/changelog"]);
       Ui_components.with_props
         [Ui_components.Prop.padding_left 44;Ui_components.Prop.padding_bottom 12;
          Ui_components.Prop.font_size "12px";Ui_components.Prop.line_height "16px"]
         (column ~key:"hm-ft" ~gap:4 ~opacity:0.3
           ([text ~value:("Logseq " ^ Version.app) []] @
            match Version.revision () with
            | "" -> [] | revision -> [text ~value:(I18n.tf "help/revision" [revision]) []]))])

(* Shortcut reference shares rich rendering and the interactive Keymap with
   Settings; the enclosing sidebar is its only scrolling surface. *)
let shortcut_help () =
  let body_color="var(--lx-gray-12, var(--ls-primary-text-color))" in
  let table_view ~key title trailing rows =
    let cell ~header ~right children =
      table_cell ~padding:6 ~min_width:0 ~grow:1.
        ~font_size:"16px" ~line_height:"24px" ~font_weight:(if header then 700 else 400)
        ~border_width:1 ~border_color:"var(--ls-border-color)"
        ?background:(if header then Some "var(--lx-gray-03, var(--ls-tertiary-background-color))" else None)
        ~text_alignment:(if right then `end_ else `start) children in
    table ~key ~margin_vertical:8 ~corner_radius:4
      ~style_class:"cp__shortcut-reference-table"
      (table_row [cell ~header:true ~right:false [text ~value:title []];
                  cell ~header:true ~right:true [trailing]] ::
       List.mapi (fun i (left,right) ->
         table_row ~key:(string_of_int i)
           ?background:(if i mod 2=0 then Some "var(--lx-gray-02, var(--ls-secondary-background-color))" else None)
           [cell ~header:false ~right:false [left];cell ~header:false ~right:true [right]]) rows) in
  let code=Render_inline.code_span in
  let triggers =
    [t "help/slash-autocomplete",code "/";
     t "help/search",Settings_page.keymap_binding ~key:"search-shortcut"
       {Keymap_data.kind="combo";data="mod+k";keys=Keymap_record.keycaps "mod+k"};
     t "help/reference-autocomplete",code "[[]]";
     t "help/block-reference",code "(())";
     t "help/open-link-in-sidebar",code (t "help/open-link-in-sidebar-action");
     t "help/context-menu",code (t "help/context-menu-action")] in
  let syntax =
    ["**" ^ t "format/bold" ^ "**";
     "_" ^ t "format/italics" ^ "_";
     "~~" ^ t "format/strikethrough" ^ "~~";
     "^^" ^ t "format/highlight" ^ "^^";
     t "help/inline-math-example-prefix" ^ " $E = mc^2$"] in
  let example_row raw=code raw,text (Render_inline.parse raw) in
  let syntax=List.map example_row syntax @
    [code "$$E = mc^2$$",text [Render_inline.katex_el ~block:false ~display:false "E = mc^2"]] @
    List.map example_row ["`" ^ t "format/code" ^ "`";"[Link](https://www.example.com)"] in
  let example="(println \"Hello world!\")" in
  let mono="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" in
  let pre ?style_class ?white_space children =
    text ~as_:`Pre ?style_class ?white_space ~padding:0 ~margin:0
      ~background:"transparent" ~font_family:mono ~font_size:"0.9em" ~line_height:"1.45em" children in
  let raw_block=pre [text ~value:("```clojure\n  " ^ example ^ "\n```") []] in
  let preview_block=pre ~style_class:"code" ~white_space:"pre-wrap"
    [text ~as_:`Code ~font_family:mono ~font_size:"0.85em" ~padding:6
      ~data_attrs:["data-lang","clojure"] ~value:example []] in
  let image_url="https://asset.logseq.com/static/img/logo.png" in
  let syntax=syntax @ [raw_block,preview_block;
    code ("![image](" ^ image_url ^ ")"),
    row ~main:`end_ [image ~url:image_url ~alt:(t "ui/image") ~width:32 ~height:32 []]] in
  Ui_components.with_props
    [Ui_components.Prop.font_size "16px";Ui_components.Prop.line_height "24px"]
    (column ~key:"shortcut-help" ~min_width:0 ~margin_left:12 ~margin_top:(-8) ~padding_horizontal:8
      ~foreground:body_color ~style_class:"cp__shortcut-page"
      [table_view ~key:"shortcut-triggers" (t "help.shortcuts/triggers")
        (text ~value:(t "help.shortcuts/shortcut-column") [])
        (List.map (fun (label,value) -> text ~value:label [],value) triggers);
       table_view ~key:"shortcut-syntax" (t "help/markdown-syntax")
         (Ui_components.with_props [Ui_components.Prop.white_space `nowrap]
           (link ~url:"https://www.markdownguide.org/basic-syntax"
             ~text:(t "help/learn-more" ^ {js| →|js}) [])) syntax;
       Settings_page.keymap_pane ~embedded:true ()])

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
                (Ui_components.button ~variant:`ghost ~size:`sm
                   ~style_class:"ui__button"
                   ~foreground:
                     "var(--ls-secondary-text-color, \
                      hsl(var(--muted-foreground)))"
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
        ~data_attrs:[ ("style", "padding-top:8px") ]
        [ box ~key:("cmdkb-" ^ it.key)
            ~style_class:"cp__cmdk__block rounded-md"
            [ Cmdk_view.sidebar ~services:(Cmdk_host.services ()) ~query:it.title ]
        ]
  | "shortcut-settings" ->
      column ~key:("body-" ^ it.key)
        ~accessibility_identifier:("sidebar-panel-content-" ^ n)
        ~style_class:("sidebar-panel-content" ^ (if it.collapsed then " hidden" else " initial"))
        [shortcut_help ()]
  | "help" ->
      (* cljs :help items mount onboarding/help directly in
         .sidebar-panel-content — no page-inner/blocks wrap *)
      box ~key:("body-" ^ it.key)
        ~accessibility_identifier:("sidebar-panel-content-" ^ n)
        ~style_class:
          ("sidebar-panel-content"
           ^ (if it.Sidebar_state.collapsed then " hidden" else " initial"))
        ~padding_horizontal:8
        ~data_attrs:[ ("style", "padding-top:8px") ]
        [ help_pane st ]
  | _ ->
  box ~key:("body-" ^ it.key)
    ~accessibility_identifier:("sidebar-panel-content-" ^ n)
    ~style_class:
      ("sidebar-panel-content"
       ^ (if it.Sidebar_state.collapsed then " hidden" else " initial"))
    ~data_attrs:[ ("style", "padding-top:8px") ]
    ?padding_horizontal:
      (match it.Sidebar_state.kind with
       | "search" | "shortcut-settings" -> None
       | _ -> Some 8)
    [ column ~key:("wrap-" ^ it.key) ~grow:1.
        ~style_class:"page cp__page-inner-wrap"
        ~data_attrs:
          [ ("style", "position:relative;margin:0 12px 20px") ]
        [ Ui_components.with_props
            [ Ui_components.Prop.position `relative ]
            (column ~key:("inner-" ^ it.key) ~gap:16
               ~style_class:"page-inner"
            ~data_attrs:[ ("style", "margin-bottom:0;padding-bottom:64px") ]
            ([ sidebar_props_row st it
              ; object_tabs_host it
             ; box ~key:("pbi-" ^ it.key)
                 ~style_class:"ls-page-blocks"
                 ~margin_left:(-20) ~min_height:60
                 ~data_attrs:[ ("style", "overflow:hidden") ]
                 [ (* data-cid is read by editor_actions' [data-cid]
                      closest queries *)
                   Ui_components.with_props
                     [ Ui_components.Prop.position `relative ]
                     (box ~key:("pbin-" ^ it.key)
                        ~style_class:"page-blocks-inner"
                     ~data_attrs:[ ("data-cid", "sidebar") ]
                     (List.map
                        (Tree.block_row ~scope:"sidebar")
                        it.blocks
                      @ [ Add_button.el ?puuid:it.Sidebar_state.uuid
                            ~flags:(fun ctx ->
                              Signal.constant ctx.Lui_ui.ui_scheduler
                                (has_children, indented))
                        ]))
                 ]
             ]
            (* linked references sit inside .page-inner in cljs *)
            @ (match it.kind, it.uuid with
               | "page", Some uuid ->
                   [ Page.references_view ~page_uuid:uuid
                       ~has_refs:(it.linked_refs <> []) () ]
               | _ -> [])))
        ]
    ]


let sidebar_item st idx (it : Sidebar_state.item) =
  column ~key:("item-" ^ it.key)
    ~min_height:(if it.collapsed then 32 else 100)
    ~background:"var(--lx-gray-02, var(--color-level-1))"
    ~style_class:
      ("sidebar-item content color-level item-type-"
       ^ it.kind
       ^ if it.Sidebar_state.collapsed then " collapsed" else "")
    ~accessibility_identifier:("sbi-" ^ it.Sidebar_state.key)
    ~data_attrs:[ ("style", "position:relative") ]
    [ Ui_components.with_props
        [ Ui_components.Prop.position `relative ]
        (column ~key:("wrap-" ^ it.key) ~grow:1.
        [ item_header st idx it
        ; Ui_components.with_props
            (if it.collapsed then [Ui_components.Prop.display `none] else [])
            (item_body st idx it)
        ; item_menu_host st it ])
    ]

(* ---------- inner ---------- *)

(* reactive MinWidth = the dock's expanded width in px — while the
   docked track animates to/from ~0 the inner column keeps its
   expanded layout and is clipped by the pane's overflow:hidden
   (slide-out) instead of reflowing/shrinking its text *)
let inner st =
  Ui_parts.int_prop Lui_protocol.MinWidth
    ~value:(reactive (fun rf vw -> int_of_float (Float.round (rf *. vw)))
       (Signal.value st.Sidebar_state.right_fraction)
       (Signal.value st.Sidebar_state.viewport_w))
    (column ~key:"rs-inner" ~accessibility_identifier:"right-sidebar-container"
       ~grow:1.
       ~background:"var(--lx-gray-02, var(--ls-secondary-background-color))"
       ~style_class:"cp__right-sidebar-inner"
       ~data_attrs:[ ("style", "width:100%;height:100%;padding-top:0") ]
    [ scroll ~key:"rs-scroll" ~orientation:`vertical ~grow:1.
        ~style_class:"cp__right-sidebar-scrollable"
        [ column ~key:"rs-col" ~grow:1.
            [ topbar st
            ; reactive
                (fun items ->
                  column ~key:"rs-items" ~grow:1. ~padding_horizontal:8
                    ~margin_left:4 ~margin_top:(-8)
                    ~style_class:"sidebar-item-list scrollbar-spacing"
                    ~data_attrs:
                      [ ( "style"
                        , "margin-left:4px;margin-top:-8px;\
                           padding-bottom:150px;height:calc(100vh - 48px)"
                        )
                      ]
                    (box ~key:"rs-drop" ~style_class:"sidebar-drop-indicator"
                       ~height:8
                       (* cljs container.css .sidebar-drop-indicator: the
                          8px lead-in offsets the list's mt-[-8px] so the
                          first item header lands below the sticky topbar
                          instead of clipping under it *)
                       []
                     :: List.mapi (sidebar_item st) items))
                (Signal.value st.Sidebar_state.items) ] ]
    ])

let render (ms : Model.t Signal.signal) : t =
 fun ctx parent ->
  let st = Sidebar_state.ensure ms in
  (Logseq_el.fragment
     [ (* the hand-rolled .resizer separator is gone — the docked
          split's divider owns the drag affordance *)
       if_
         ~test:
           (Logseq_el.own ctx
              (Signal.map
                 (fun (m : Model.t) -> m.Model.right_sidebar_open)
                 ms))
         (inner st)
     ])
    ctx parent
