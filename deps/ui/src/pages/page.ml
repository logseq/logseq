(* Page view — mirrors components/page.cljs essentials:

   .page
     div.ls-page-title.title [data-testid='page title'] > .block-title-wrap
     div.ls-page-blocks > .page-blocks-inner > .ls-block*
     .references (linked refs) / .unlinked-references

   Route views: journals list (#journals > .journal-item), not-found,
   library (title rows only). *)

open Lui_elements

module S = Editor_state

let dom = Logseq_dom.dom

(* --- shared pieces ------------------------------------------------ *)

(* block zoom: .breadcrumb lists ancestor block titles (root first),
   each linking to its own zoom route — cljs breadcrumb parity *)
let zoom_breadcrumbs (page : Model.page) : t list =
  (* cljs page-inner omits the breadcrumb node entirely when there's
     nothing to show — an empty placeholder div would still consume a
     grid gap slot *)
  match page.page_parents with
  | [] -> []
  | parents ->
      [ dom ~key:"bc" ~style_class:"breadcrumb"
          (List.map
             (fun (p : Model.block) ->
               dom ~tag:"a" ~style_class:"breadcrumb-item"
                 ~attrs:
                   [ ( "href"
                     , "#/block/" ^ Option.value p.block_uuid ~default:"" )
                   ]
                   ~text:p.block_title [])
             parents)
      ]

let breadcrumbs title : t list =
  (* namespaced pages "a/b/c" -> breadcrumb trail; non-namespaced
     titles render no breadcrumb node at all *)
  match String.split_on_char '/' title with
  | [] | [ _ ] -> []
  | parts ->
      let rec crumbs acc prefix = function
        | [] -> List.rev acc
        | last :: [] ->
            dom ~key:("bc-" ^ prefix)
              ~style_class:"breadcrumb-item"
              ~text:last []
            :: acc |> List.rev
        | part :: rest ->
            let here = if prefix = "" then part else prefix ^ "/" ^ part in
            let item =
              dom ~key:("bc-" ^ here) ~tag:"a"
                ~style_class:"breadcrumb-item"
                ~attrs:[ ("href", "#/page/" ^ here) ]
                ~text:part []
            in
            let sep = dom ~key:("bcsep-" ^ here) ~text:" / " [] in
            crumbs (sep :: item :: acc) here rest
      in
      [ dom ~key:"bc" ~style_class:"breadcrumb" (crumbs [] "" parts) ]

(* click position payload -> Page_menu_set (context menu = page items
   only, so with_app_items = false) *)
let open_menu name payload =
  if name = "contextmenu" then
    Option.iter
      (fun p ->
        Runtime.send
          (Action.Page_menu_set
             (Some
                ( Platform.payload_num p "clientX"
                , Platform.payload_num p "clientY"
                , false )));
        Runtime.flush ())
      payload

let set_page_icon (page : Model.page) (c : Icon_picker.choice) =
  match page.page_uuid with
  | None -> ()
  | Some u ->
      let op =
        match c with
        | Icon_picker.Remove ->
            Outliner_ops.op "remove-block-property"
              [ Wire.Uuid u; Wire.Keyword "logseq.property/icon" ]
        | Icon_picker.Emoji id ->
            Outliner_ops.op "set-block-property"
              [ Wire.Uuid u; Wire.Keyword "logseq.property/icon"
              ; Wire.Map
                  [ Wire.Keyword "type", Wire.Keyword "emoji"
                  ; Wire.Keyword "id", Wire.String id ]
              ]
        | Icon_picker.Tabler (id, color) ->
            Outliner_ops.op "set-block-property"
              [ Wire.Uuid u; Wire.Keyword "logseq.property/icon"
              ; Wire.Map
                  ([ Wire.Keyword "type", Wire.Keyword "tabler-icon"
                   ; Wire.Keyword "id", Wire.String id ]
                  @ (match color with
                     | Some c -> [ Wire.Keyword "color", Wire.String c ]
                     | None -> []))
              ]
      in
      ignore
        (Outliner_ops.apply [ op ]
         |> Js.Promise.then_ (fun _ -> !Runtime.reload_current_view ()))

let page_icon_picker (page : Model.page) (anchor : string) =
  match Properties_dom.doc_query anchor with
  | None -> ()
  | Some anchor ->
      Icon_picker.open_picker ~anchor
        ~del:(page.page_icon <> None)
        ~on_chosen:(fun c -> set_page_icon page c)

let title_editor (page : Model.page) : t =
  let commit value =
    let value = String.trim value in
    (match page.page_uuid with
     | Some u -> ignore (Page_ops.rename u value)
     | None -> ());
    Runtime.send Action.Title_edit_done;
    Runtime.flush ()
  in
  (* cljs: the page-title editor is the regular editor box —
     .editor-wrapper > .editor-inner.block-editor > textarea +
     mock-text mirror (popup caret positioning) *)
  let uuid = Option.value page.page_uuid ~default:"" in
  dom ~key:"pt-edit" ~style_class:"editor-wrapper flex flex-1 w-full"
    ~id:("editor-edit-block-" ^ uuid)
    [ dom ~key:"pt-ei" ~style_class:"editor-inner flex flex-1 block-editor"
        [ dom ~key:"pt-ta" ~tag:"textarea"
            ~id:("edit-block-" ^ uuid)
            ~attrs:[ ("autofocus", "true") ]
            ~text:page.page_title ~events:"keydown blur"
        ~on_dom_event:(fun name payload ->
          match name with
          | "blur" -> commit (Platform.payload_str (Option.value payload ~default:"{}") "value")
          | "keydown" -> (
              match
                Platform.payload_str
                  (Option.value payload ~default:"{}") "key"
              with
              | "Enter" | "Escape" ->
                  commit
                    (Platform.payload_str
                       (Option.value payload ~default:"{}") "value")
              | _ -> ())
          | _ -> ())
        []
        ; (* cljs mock-textarea: hidden caret mirror for popup placement *)
          dom ~key:"pt-mt" ~style_class:"mock-text"
            ~attrs:
              [ ( "style"
                , "width:100%;height:100%;position:absolute;visibility:hidden;top:0;left:0" )
              ]
            []
        ]
    ; Asset_dom.upload_input ("pt-up-" ^ uuid)
    ]

(* cljs arrow svg inside .control-hide/.rotating-arrow *)
let rotating_arrow key : t =
  dom ~key ~tag:"svg"
    ~style_class:"h-4 w-4"
    ~attrs:
      [ ("aria-hidden", "true"); ("version", "1.1")
      ; ("viewBox", "0 0 192 512"); ("fill", "currentColor")
      ; ("display", "inline-block"); ("style", "margin-left: 2px") ]
    [ dom ~key:"p" ~tag:"path"
        ~attrs:
          [ ( "d"
            , "M0 384.662V127.338c0-17.818 21.543-26.741 \
               34.142-14.142l128.662 128.662c7.81 7.81 7.81 20.474 0 \
               28.284L34.142 398.804C21.543 411.404 0 402.48 0 384.662z" )
          ; ("fill-rule", "evenodd") ]
        []
    ]

(* cljs title-tag chip: .block-tag > .flex.items-center > a.hash-symbol +
   a.tag[draggable][data-ref] > span *)
let title_tag_chips (page : Model.page) : t list =
  match page.Model.page_tags with
  | [] -> []
  | tags ->
      [ dom ~key:"pt-right"
          ~style_class:
            "ls-block-right flex flex-row items-center self-start gap-1"
          [ dom ~key:"ptr-ghost" ~style_class:"opacity-70 hover:opacity-100"
              []
          ; dom ~key:"pt-tags" ~style_class:"block-tags gap-1"
              (List.mapi
                 (fun i tag ->
                   dom ~key:("pt-tag-" ^ string_of_int i)
                     ~style_class:"block-tag"
                     [ dom ~key:("pti-" ^ string_of_int i)
                         ~style_class:"flex items-center"
                         [ dom ~key:("ph-" ^ string_of_int i) ~tag:"a"
                             ~style_class:"hash-symbol select-none flex"
                             ~text:"#" []
                         ; dom ~key:("ptt-" ^ string_of_int i) ~tag:"a"
                             ~style_class:"tag relative"
                             ~attrs:
                               [ ("tabindex", "0"); ("draggable", "true")
                               ; ( "data-ref"
                                 , String.lowercase_ascii tag ) ]
                             [ dom ~key:"ts" ~tag:"span" ~text:tag [] ]
                         ]
                     ])
                 tags)
          ]
      ]

(* display-mode title: #block-content-<page-uuid>.block-content >
   .block-content-inner > .block-head-wrap > .w-full.inline >
   span.block-title-wrap — mirrors block.cljs for page-title blocks *)
(* cljs: pointer-down on .block-content starts editing via
   block-content-on-pointer-down (journal titles redirect instead, which is
   a no-op on their own page — so journals get no edit handler) *)
let title_content (page : Model.page) : t =
  let uuid = Option.value page.page_uuid ~default:"" in
  let events, on_event =
    match page.page_journal_day with
    | Some _ -> ([], None)
    | None ->
        ( [ "click" ]
        , Some
            (fun _name payload ->
              let shift =
                match payload with
                | Some p ->
                    Js.Json.decodeBoolean
                      (Platform.json_prop (Platform.json_parse p) "shiftKey")
                    = Some true
                | None -> false
              in
              (* shift+click opens the page in the right sidebar (handled by
                 the document-level listener); starting title edit would
                 replace the clicked node mid-dispatch *)
              if page.page_uuid <> None && not shift then (
                Runtime.send Action.Title_edit_start;
                Runtime.flush ();
                (* autofocus doesn't re-fire on remount — focus explicitly
                   so Enter/Escape reach the textarea *)
                match
                  Dom_ext.doc_query_selector ".ls-page-title textarea"
                with
                | Some el ->
                    Dom_ext.focus el;
                    let n = String.length (Dom_ext.value el) in
                    Dom_ext.set_selection_range el n n
                | None -> ())) )
  in
  dom ~key:"pt-content" ~style_class:"block-content inline !cursor-pointer"
    ~id:("block-content-" ^ uuid) ~events:(String.concat " " events)
    ?on_dom_event:on_event
    ~attrs:
      [ ("blockid", uuid); ("containerid", uuid); ("data-type", "default")
      ; ("style", "width: 100%") ]
    [ dom ~key:"pt-bci"
        ~style_class:"block-content-inner flex flex-row justify-between"
        [ dom ~key:"pt-bh" ~style_class:"block-head-wrap"
            [ dom ~key:"pt-w" ~style_class:"w-full inline"
                [ Render.wrap ~self:uuid page.page_title ]
            ]
        ]
    ]

let page_title_el (m : Model.t) (page : Model.page) : t =
  (* cljs page-icon: custom :logseq.property/icon -> first tag icon ->
     class "hash" -> property "letter-p"; rendered as the icon-picker
     button inside .block-main-content *)
  let icon_el =
    match page.page_icon, page.page_is_tag with
    | Some ("emoji", eid), _ ->
        Some (dom ~key:"pt-e" ~tag:"em-emoji" ~attrs:[ "id", eid ] [])
    | Some (_, iid), _ -> Some (Icons.icon ~size:38. iid)
    | None, true -> Some (Icons.icon ~size:38. "hash")
    | None, false -> None
  in
  let uuid = Option.value page.page_uuid ~default:"" in
  (* cljs db-page-title: tag/class pages render collapsed by default; the
     fold state lives in the same collapsed/expanded sets as blocks *)
  let title_collapsed =
    (not (S.is_expanded uuid)) && (S.is_collapsed uuid || page.page_is_tag)
  in
  let toggle_title_collapse () =
    if S.ready () then
      S.set (fun (st : S.t) ->
          if title_collapsed then
            { st with
              S.collapsed = S.String_set.remove uuid st.S.collapsed
            ; S.expanded = S.String_set.add uuid st.S.expanded
            }
          else
            { st with
              S.collapsed = S.String_set.add uuid st.S.collapsed
            ; S.expanded = S.String_set.remove uuid st.S.expanded
            })
  in
  let body =
    (* cljs db-page-title: the page title is a full block row —
       .ls-block > .is-page-title-row > bullet control + nested
       flex-col wrappers > .ls-page-title-container > .block-row >
       .block-content-wrapper(.ls-page-title-actions + content|editor) +
       .ls-block-right(.block-tags). Tags render while editing too. *)
    [ box ~key:"pt-inner" ~style_class:"w-full relative"
        [ dom ~key:"pt-block" ~style_class:"ls-block swipe-item"
            ~id:("ls-block-" ^ uuid)
            ~attrs:
              [ ("blockid", uuid); ("containerid", uuid)
              ; ("data-block-title", page.page_title)
              ; ("haschild", "false")
              ; ("data-comment-item", "false")
              ; ("data-comments-area", "false"); ("level", "0")
              ; ("data-collapsed", "false")
              ; ("data-db-collapsable", if page.page_is_tag then "true" else "false")
              ; ("data-block-format", "markdown") ]
            [ dom ~key:"pt-row"
                ~style_class:
                  "block-main-container flex flex-row gap-1 is-page-title-row"
                ~attrs:
                  [ ( "style"
                    , "margin-left: "
                      ^ if icon_el = None then "-30px" else "-36px" )
                  ]
                [ dom ~key:"pt-ctrl"
                    ~style_class:
                      ("is-with-icon"
                      ^ (if title_collapsed then " bullet-closed" else "")
                      ^ " bullet-hidden block-control-wrap flex flex-row \
                         items-center h-6")
                    ~attrs:[ ("data-has-children", "false") ]
                    ~events:"mouseover mouseout"
                    ~on_dom_event:(fun name _ ->
                      (* cljs *control-show? atom: caret appears only while
                         hovering, and only for collapsable titles *)
                      if page.page_is_tag then
                        match
                          Browser_ui.qs "#page-title .block-control > span"
                        with
                        | Some el ->
                            if name = "mouseover" then (
                              Browser_ui.rm_class el "control-hide";
                              Browser_ui.add_class el "control-show";
                              Browser_ui.add_class el "cursor-pointer")
                            else (
                              Browser_ui.add_class el "control-hide";
                              Browser_ui.rm_class el "control-show";
                              Browser_ui.rm_class el "cursor-pointer")
                        | None -> ())
                    ([ (let cs =
                          dom ~key:"pt-cs" ~tag:"span"
                            ~style_class:"control-hide"
                            [ dom ~key:"pt-ra" ~tag:"span"
                                ~style_class:
                                  ("rotating-arrow"
                                  ^ if title_collapsed then " collapsed"
                                    else " not-collapsed")
                                [ rotating_arrow "pt-arw" ]
                            ]
                        in
                        if page.page_is_tag then
                          dom ~key:"pt-ca" ~tag:"a"
                            ~style_class:"block-control"
                            ~id:("control-" ^ uuid) ~events:"click"
                            ~on_dom_event:(fun name _ ->
                              if name = "click" then toggle_title_collapse ())
                            [ cs ]
                        else
                          dom ~key:"pt-ca" ~tag:"a"
                            ~style_class:"block-control"
                            ~id:("control-" ^ uuid) [ cs ])
                     ]
                    )
                ; dom ~key:"pt-col1" ~style_class:"flex flex-col w-full"
                    [ dom ~key:"pt-col2" ~style_class:"flex flex-col w-full"
                        [ dom ~key:"pt-bmc"
                            ~style_class:
                              "block-main-content flex flex-row gap-2"
                            ((match icon_el with
                              | None -> []
                              | Some ic ->
                                  [ dom ~key:"pt-icon"
                                      ~style_class:"ls-page-icon flex self-start"
                                      [ dom ~key:"pt-icbtn" ~tag:"button"
                                          ~attrs:
                                            [ ("type", "button")
                                            ; ( "title"
                                              , Ui_strings.t "icon/tab-emojis"
                                              )
                                            ]
                                          ~style_class:
                                            "ui__button inline-flex \
                                             cursor-pointer items-center \
                                             justify-center whitespace-nowrap \
                                             rounded-md text-sm gap-1 \
                                             font-medium ring-offset-background \
                                             transition-colors \
                                             focus-visible:outline-none \
                                             focus-visible:ring-2 \
                                             focus-visible:ring-ring \
                                             focus-visible:ring-offset-2 \
                                             disabled:pointer-events-none \
                                             disabled:opacity-50 select-none \
                                             hover:bg-secondary/70 \
                                             hover:text-secondary-foreground \
                                             active:opacity-80 as-ghost h-7 \
                                             rounded py-1 px-1 leading-none \
                                             text-muted-foreground \
                                             hover:text-foreground"
                                          ~events:"click"
                                          ~on_dom_event:(fun name _ ->
                                            if name = "click" then
                                              page_icon_picker page
                                                "#page-title .ls-page-icon")
                                          [ dom ~key:"pt-cw" ~tag:"span"
                                              ~style_class:
                                                "inline-flex items-center \
                                                 ls-icon-color-wrap"
                                              ~attrs:
                                                [ ("style", "color: inherit") ]
                                              [ ic ]
                                          ]
                                      ]
                                  ])
                            @ [ dom ~key:"pt-col3"
                                ~style_class:"flex flex-col w-full"
                                [ dom ~key:"pt-wrap"
                                    ~style_class:
                                      "ls-page-title-container \
                                       block-content-or-editor-wrap"
                                    [ dom ~key:"pt-inner2"
                                        ~style_class:
                                          "block-content-or-editor-inner"
                                        [ dom ~key:"pt-row2"
                                            ~style_class:
                                              "block-row flex flex-1 \
                                               flex-row gap-1 items-center"
                                            ([ dom ~key:"pt-cw"
                                                 ~style_class:
                                                   "flex flex-1 w-full \
                                                    block-content-wrapper"
                                                 ~attrs:
                                                   [ ( "style"
                                                     , "display: flex" ) ]
                                                 [ (if m.editing_title then
                                                      title_editor page
                                                    else title_content page)
                                                 ]
                                             ]
                                            @ title_tag_chips page)
                                        ]
                                    ]
                                ]
                            ]
                        )
                    ]
                ]
            ]
        ]
      ]
    ]
  in
  (* e2e selects [data-testid='page title'] -> mapped to #page-title *)
  dom ~key:"page-title" ~id:"page-title"
    ~style_class:"ls-page-title flex flex-1 w-full content items-start title"
    ~attrs:[ ("data-testid", "page title") ]
    ~events:"click contextmenu"
    ~on_dom_event:(fun name payload ->
      match name with
      | "click" ->
          (* icon buttons live inside #page-title; skip title-edit when
             they (or their children) are the click target *)
          let target =
            match payload with
            | Some p -> Platform.payload_str p "targetId"
            | None -> ""
          in
          if
            page.page_uuid <> None
            && (target = "" || target = "page-title"
                || target = "page-title-text")
          then (
            Runtime.send Action.Title_edit_start;
            Runtime.flush ();
            (* autofocus doesn't re-fire on remount — focus explicitly so
               Enter/Escape reach the textarea *)
            match Dom_ext.doc_query_selector ".ls-page-title textarea" with
            | Some el ->
                Dom_ext.focus el;
                let n = String.length (Dom_ext.value el) in
                Dom_ext.set_selection_range el n n
            | None -> ())
      | _ -> open_menu name payload)
    body

let blocks_inner ?puuid ?(virtualize = false) (blocks : Model.block list)
    : t =
  let inner_attrs =
    match puuid with
    | Some u -> [ ("data-pu", u) ]
    | None -> []
  in
  let items = Array.of_list blocks in
  let body =
    if Virt_list.enabled ~virtualize (Array.length items) then
      (* cljs parity: .blocks-list-wrap carries data-virtuoso-scroller;
         rows are .ls-virt-row[data-index] > .ls-block *)
      [ dom ~key:"blw-virt" ~style_class:"blocks-list-wrap"
          ~attrs:[ ("data-level", "0"); ("data-virtuoso-scroller", "true") ]
          [ Virt_list.list ~key_of:Tree.block_key
              ~estimate_size:(fun _ -> 32.) ~render:Tree.block_row items ]
      ]
    else List.map Tree.block_row blocks
  in
  dom ~key:"page-blocks" ~style_class:"mt-4 ls-page-blocks"
    ~attrs:[ ("style", "margin-left: -20px") ]
    [ dom ~key:"page-blocks-inner" ~style_class:"page-blocks-inner relative"
        ~attrs:inner_attrs body
    ]

(* cljs components/block.cljs grouped-blocks-container: refs render
   grouped under their source page (references-blocks-item > page-cp),
   so the referencing page's name must appear inside .references *)
let refs_grouped (refs : Model.block list) : (string * Model.block list) list =
  let insert groups (b : Model.block) =
    let name = Option.value b.block_page_name ~default:"" in
    match List.find_opt (fun (n, _) -> n = name) groups with
    | Some _ ->
        List.map
          (fun (n, bs) -> if n = name then (n, bs @ [ b ]) else (n, bs))
          groups
    | None -> groups @ [ (name, [ b ]) ]
  in
  List.fold_left insert [] refs

(* cljs ui__button base classes (shui/button) *)
let ui_btn =
  "ui__button inline-flex cursor-pointer items-center justify-center \
   whitespace-nowrap rounded-md text-sm gap-1 font-medium \
   ring-offset-background transition-colors focus-visible:outline-none \
   focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 \
   disabled:pointer-events-none disabled:opacity-50 select-none \
   hover:bg-secondary/70 hover:text-secondary-foreground active:opacity-80"

let fold_arrow ?on_click key : t =
  let events, handler =
    match on_click with
    | Some f -> ("click", Some (fun name _ -> if name = "click" then f ()))
    | None -> ("", None)
  in
  dom ~key ~tag:"a"
    ~style_class:
      "ls-foldable-title-control block-control opacity-50 hover:opacity-100"
    ~attrs:[ ("style", "width: 14px; height: 16px;") ]
    ~events ?on_dom_event:handler
    [ dom ~key:"ch" ~tag:"span" ~style_class:"control-hide"
        [ dom ~key:"ra" ~tag:"span" ~style_class:"rotating-arrow not-collapsed"
            [ rotating_arrow (key ^ "-svg") ]
        ]
    ]

let view_ghost_btn key ?title icon_name size : t =
  let attrs =
    [ ("type", "button"); ("tabindex", "0") ]
    @ (match title with Some s -> [ ("title", s) ] | None -> [])
  in
  dom ~key ~tag:"button" ~attrs
    ~style_class:(ui_btn ^ " as-ghost h-7 rounded py-1 \
                  text-muted-foreground !px-1")
    [ Icons.icon ~size icon_name ]

(* cljs views/view header for :linked-references — foldable title with the
   "Linked references <count>" view tab and hidden-until-hover actions *)
let refs_view_head key title count : t =
  dom ~key:(key ^ "-head")
    ~style_class:
      "ls-view-head flex flex-1 flex-nowrap items-center justify-between \
       gap-1 overflow-hidden"
    [ dom ~key:"vh-l" ~style_class:"flex flex-row items-center gap-2"
        [ dom ~key:"vh-views" ~style_class:"views"
            [ dom ~key:"vh-tab" ~tag:"button"
                ~attrs:
                  [ ("type", "button"); ("tabindex", "0")
                  ; ("data-view-tab-id", "view-tab-" ^ key) ]
                ~style_class:(ui_btn ^ " as-text rounded text-sm px-0 py-0 h-6")
                [ dom ~key:"vh-tt" ~tag:"span" ~text:title []
                ; dom ~key:"vh-n" ~tag:"span"
                    ~style_class:"text-muted-foreground text-xs"
                    ~text:(string_of_int count) []
                ]
            ; dom ~key:"vh-add" ~tag:"button"
                ~attrs:
                  [ ("type", "button"); ("tabindex", "0")
                  ; ("title", Ui_strings.t "view/add-new-view") ]
                ~style_class:
                  (ui_btn ^ " as-text h-7 rounded py-1 !px-1 -ml-1 \
                   text-muted-foreground hover:text-foreground \
                   transition-opacity ease-in duration-300 opacity-0")
                [ Icons.icon ~size:15. "plus" ]
            ]
        ]
    ; dom ~key:"vh-acts"
        ~style_class:
          "opacity-0 view-actions flex items-center gap-1 \
           transition-opacity ease-in duration-300"
        [ view_ghost_btn "vh-fc" ~title:(Ui_strings.t "reference/page-filter")
            "filter-cog" 18.
        ; view_ghost_btn "vh-srt" "arrows-up-down" 18.
        ; view_ghost_btn "vh-flt" "filter" 18.
        ; dom ~key:"vh-search" ~style_class:"view-action-search"
            [ dom ~key:"vh-si" ~style_class:"flex flex-row items-center"
                [ view_ghost_btn "vh-sb" "search" 15. ] ]
        ; dom ~key:"vh-type"
            ~style_class:"view-action-type text-muted-foreground text-sm"
            [ dom ~key:"vh-tv" ~style_class:"w-full property-value-inner"
                ~attrs:[ ("data-type", "default") ]
                [ dom ~key:"vh-tj" ~id:("trigger-" ^ key)
                    ~attrs:[ ("tabindex", "0") ]
                    ~style_class:"jtrigger flex flex-1 w-full cursor-pointer"
                    [ dom ~key:"vh-ts"
                        ~style_class:"select-item cursor-pointer"
                        [ dom ~key:"vh-tc" ~tag:"span"
                            ~style_class:
                              "inline-flex items-center ls-icon-color-wrap"
                            ~attrs:[ ("style", "color: inherit;") ]
                            [ Icons.icon ~size:18. "list" ]
                        ]
                    ]
                ]
            ]
        ; dom ~key:"vh-menu" ~tag:"button"
            ~attrs:
              [ ("type", "button"); ("tabindex", "0")
              ; ("aria-haspopup", "menu"); ("aria-expanded", "false") ]
            ~style_class:(ui_btn ^ " as-ghost h-7 rounded py-1 \
                          text-muted-foreground !px-1")
            [ Icons.icon ~size:15. "dots" ]
        ]
    ]

(* cljs ls-foldable-title wrapping a view-head or a group page-ref *)
let foldable_title ?on_click key inner : t =
  dom ~key:(key ^ "-ft") ~style_class:"ls-foldable-title content"
    [ dom ~key:"ftr" ~style_class:"flex-1 flex-row foldable-title"
        [ dom ~key:"fth"
            ~style_class:"flex flex-row items-center ls-foldable-header gap-1"
            [ fold_arrow ?on_click (key ^ "-fa"); inner ]
        ]
    ]

let foldable_content key inner : t =
  dom ~key:(key ^ "-fc") ~style_class:"ls-foldable-content"
    ~attrs:[ ("aria-hidden", "false") ]
    [ dom ~key:"fci" ~style_class:"ls-foldable-content-inner" [ inner ] ]

(* one linked-ref group: source page-ref foldable title + its blocks *)
let ref_group idx (name, blocks) : t =
  let key = "rg-" ^ name in
  dom ~key ~attrs:[ ("data-index", string_of_int idx)
                  ; ("data-item-index", string_of_int idx)
                  ; ("style", "overflow-anchor: none;") ]
    [ dom ~key:"gi" ~style_class:"flex flex-col"
        [ foldable_title (key ^ "-t")
            (dom ~key:"grp" ~style_class:""
               [ dom ~key:"grl" ~tag:"a" ~style_class:"page-ref relative"
                   ~attrs:
                     [ ("tabindex", "0"); ("draggable", "true")
                     ; ("data-ref", name); ("href", "#/page/" ^ name) ]
                   [ dom ~key:"grs" ~tag:"span" ~text:name [] ]
               ])
        ; foldable_content (key ^ "-b")
            (dom ~key:"grm" ~style_class:"-ml-2"
               [ dom ~key:"grb" ~style_class:"ml-6 text-sm opacity-70 \
                              hover:opacity-100 mt-1" []
               ; dom ~key:"grc" ~style_class:"content"
                   (List.map
                      (fun (b : Model.block) ->
                        dom
                          ~key:("grw-"
                                ^ Option.value b.block_uuid ~default:"x")
                          ~style_class:"relative w-full"
                          ~attrs:[ ("style", "min-height: 24px;") ]
                          [ Tree.block_row_static b ])
                      blocks)
               ])
        ]
    ]

let ref_groups_virt key (groups : (string * Model.block list) list) : t =
  (* cljs mounts a Virtuoso scroller; we keep its DOM scaffolding but lay
     groups out statically (absolute positioning would collapse without a
     measured scroller height) *)
  dom ~key ~style_class:"group-list-view"
    ~attrs:[ ("data-virtuoso-scroller", "true")
           ; ("style", "position: relative;") ]
    [ dom ~key:"vp" ~attrs:[ ("data-viewport-type", "window") ]
        [ dom ~key:"il"
            ~attrs:
              [ ("data-testid", "virtuoso-item-list")
              ; ( "style"
                , "box-sizing: border-box; margin-top: 0px; \
                   padding-bottom: 0px; padding-top: 0px;" ) ]
            (List.mapi ref_group groups)
        ]
    ]

(* cljs views/view {:add-page-column? true} — each ref row carries the
   source page name. *)
let references_row (b : Model.block) : t =
  match b.Model.block_page_name with
  | Some pname ->
      dom
        ~key:("ref-row-" ^ Option.value b.block_uuid ~default:"")
        ~style_class:"references-item"
        [ dom ~key:"pn" ~tag:"a" ~style_class:"page-ref"
            ~attrs:[ ("data-ref", pname) ] ~text:pname []
        ; Tree.block_row_static b
        ]
  | None -> Tree.block_row_static b

(* cljs reference/references -> views/view :linked-references DOM *)

(* cljs renders a Page column naming the source page; shared by the
   linked-refs (.references) and unlinked-refs bodies *)
let ref_item (b : Model.block) : t =
  dom ~style_class:"references-item"
    [ (match b.Model.block_page_name with
       | None -> box []
       | Some name ->
           dom ~tag:"a" ~style_class:"references-item-page"
             ~attrs:[ ("data-ref", name) ]
             ~text:name [])
    ; Tree.block_row b
    ]

let fetch_unlinked (m : Model.t) =
  match m.route_page with
  | Some p -> Router.fetch_unlinked p
  | None -> ()

let references_view (refs : Model.block list) : t =
  match refs with
  | [] -> box ~key:"refs-empty" []
  | _ ->
      let groups = refs_grouped refs in
      dom ~key:"refs" ~style_class:"references"
        [ dom ~key:"rv1" ~style_class:"flex flex-col gap-2"
            [ dom ~key:"rv2" ~style_class:"flex flex-col gap-2 grid"
                [ dom ~key:"rv3" ~style_class:"flex flex-col"
                    [ foldable_title "refs-t"
                        (refs_view_head "refs"
                           (Ui_strings.t "view/linked-references")
                           (List.length refs))
                    ; foldable_content "refs-c"
                        (dom ~key:"rvb"
                           ~style_class:"ls-view-body flex flex-col gap-2 \
                                         grid mt-1"
                           [ dom ~key:"rvl"
                               ~style_class:"flex flex-col border-t pt-2 \
                                             gap-2"
                               [ ref_groups_virt "rvg" groups ]
                           ])
                    ]
                ]
            ]
        ]

(* journal linked refs render inside a foldable content wrapper, like
   cljs views/view {:foldable-options ...} — journals default expanded. *)
let journal_references_view (p : Model.page) : t =
  let key = Option.value p.Model.page_uuid ~default:p.Model.page_title in
  match p.Model.page_linked_refs with
  | [] -> box ~key:("jrefs-empty-" ^ key) []
  | refs ->
      dom ~key:("jrefs-" ^ key) ~style_class:"references references-wrap"
        [ dom ~key:"jrfc" ~style_class:"ls-foldable-content"
            ~attrs:[ ("aria-hidden", "false") ]
            [ dom ~key:"jrb" ~style_class:"ls-view-body"
                (List.map references_row refs)
            ]
        ]


let unlinked_search_input () : t =
  dom ~key:"urefs-search-box" ~style_class:"view-action-search"
    [ dom ~key:"urefs-input" ~tag:"input"
        ~attrs:[ ("placeholder", Strings.filter_placeholder) ]
        ~events:"input"
        ~on_dom_event:(fun name payload ->
          if name = "input" then (
            let q =
              Platform.payload_str
                (Option.value payload ~default:"{}") "value"
            in
            Runtime.send (Action.Unlinked_set_query q);
            Runtime.flush ()))
        []
    ]

let contains_ci ~needle hay =
  let n = String.lowercase_ascii needle in
  let h = String.lowercase_ascii hay in
  let nl = String.length n and hl = String.length h in
  let rec go i =
    i + nl <= hl && (String.sub h i nl = n || go (i + 1))
  in
  nl > 0 && go 0

let unlinked_row (b : Model.block) : t =
  let key =
    match b.block_uuid, b.block_db_id with
    | Some u, _ -> u
    | None, Some id -> "id-" ^ string_of_int id
    | None, None -> b.block_title
  in
  dom ~key:("ur-" ^ key) ~style_class:"unlinked-row"
    [ (match b.block_page_name with
       | Some name ->
           dom ~key:("urp-" ^ key) ~tag:"a"
             ~style_class:"unlinked-page-name"
             ~attrs:[ ("href", "#/page/" ^ name) ]
             ~text:name []
       | None -> box ~key:("urp-" ^ key) [])
    ; Tree.block_row b
    ]

(* cljs reference/unlinked-references — same views/view chrome as linked
   refs; our search input + fold toggle ride on the same handlers *)
let unlinked_references_view (m : Model.t) : t =
  match m.unlinked_refs with
  | [] -> box ~key:"urefs-empty" []
  | refs ->
  let filtered =
    let q = String.trim m.unlinked_query in
    if q = "" then refs
    else
      List.filter
        (fun (b : Model.block) ->
          contains_ci ~needle:q b.block_title
          ||
          (match b.block_page_name with
           | Some p -> contains_ci ~needle:q p
           | None -> false))
        refs
  in
  dom ~key:"urefs" ~style_class:"unlinked-references"
    [ dom ~key:"uv1" ~style_class:"flex flex-col gap-2"
        [ dom ~key:"uv2" ~style_class:"flex flex-col gap-2 grid"
            [ dom ~key:"uv3" ~style_class:"flex flex-col"
                [ foldable_title "urefs-t"
                    ~on_click:(fun () ->
                      Runtime.send Action.Unlinked_toggle_open;
                      if not m.unlinked_open then fetch_unlinked m;
                      Runtime.flush ())
                    (refs_view_head "urefs"
                       (Ui_strings.t "view/unlinked-references")
                       (List.length refs))
                ; dom ~key:"urefs-content" ~style_class:"ls-foldable-content"
                    ~attrs:
                      [ ( "aria-hidden"
                        , if m.unlinked_open then "false" else "true" ) ]
                    [ dom ~key:"ufci" ~style_class:"ls-foldable-content-inner"
                        [ (if m.unlinked_search then unlinked_search_input ()
                          else box ~key:"urefs-sb" [])
                        ; dom ~key:"urefs-body"
                            ~style_class:"ls-view-body flex flex-col gap-2 \
                                          grid mt-1"
                            [ dom ~key:"uvl"
                                ~style_class:"flex flex-col border-t pt-2 \
                                              gap-2"
                                [ ref_groups_virt "uvg"
                                    (refs_grouped filtered) ]
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ]

(* --- route views -------------------------------------------------- *)

(* cljs page-inner: data-page-tags="[\"a\", \"b\"]" on the wrap *)
let page_wrap_attrs (page : Model.page) : (string * string) list =
  match page.page_tags with
  | [] -> []
  | tags ->
      [ ( "data-page-tags"
        , "[" ^ String.concat ", " (List.map (fun t -> "\"" ^ t ^ "\"") tags)
          ^ "]" ) ]

let is_today_page (m : Model.t) (page : Model.page) : bool =
  match page.page_journal_day with
  | Some d -> d = Dates.today_journal_day () && m.route <> Model.Home
  | None -> false

let journal_item ?(last = false) (m : Model.t) (p : Model.page) : t =
  let key = Option.value p.page_uuid ~default:p.page_title in
  (* cljs journal-item > page-inner: .cp__page-inner-wrap.is-journals
     containing the same editable db-page-title row as a page; the last
     item drops its separator border via .journal-last-item *)
  dom ~key:("ji-" ^ key)
    ~style_class:
      ("journal-item content relative" ^ if last then " journal-last-item" else "")
    [ dom ~key:("jiw-" ^ key)
        ~style_class:
          "flex-1 page relative cp__page-inner-wrap is-journals"
        ~attrs:(page_wrap_attrs p)
        [ dom ~key:("jip-" ^ key)
            ~style_class:"relative grid gap-4 sm:gap-8 page-inner mb-16"
            [ dom ~key:("jit-" ^ key) ~style_class:"flex flex-row space-between"
                [ page_title_el m p ]
            ; blocks_inner ?puuid:p.page_uuid p.page_blocks
            ]
        ; dom ~key:("jrefs-w-" ^ key) ~style_class:"flex flex-col gap-8 ml-1"
            [ dom ~key:"jrefs-f" ~style_class:"fade-in delay"
                [ journal_references_view p ]
            ]
        ]
    ]

let journals_view (m : Model.t) (js : Model.page list) : t =
  let items = Array.of_list js in
  dom ~key:"journals" ~id:"journals" ~style_class:"cp__journals h-full"
    (match js with
     | [] -> [ dom ~key:"jp" ~style_class:"journal-item-placeholder" [] ]
     | _ ->
         if Virt_list.force_virtualized () then
           [ Virt_list.list
               ~list_attrs:[ ("data-virtuoso-scroller", "true") ]
               ~estimate_size:(fun _ -> 640.)
               ~key_of:(fun (p : Model.page) ->
                 Option.value p.page_uuid ~default:p.page_title)
               ~render:(journal_item m) items ]
         else
           List.mapi
             (fun i p -> journal_item ~last:(i = List.length js - 1) m p)
             js)

let not_found_view name : t =
  dom ~key:"not-found" ~style_class:"page"
    [ box ~key:"nf-inner" ~style_class:"flex flex-col items-center"
        [ text ~key:"nf-t" ~value:(Strings.page_not_found ^ name)
            ~style_class:"" []
        ]
    ]

(* cljs library/add-pages: secondary button opens a page-picker popup *)
let library_add_pages_button : t =
  dom ~key:"lib-add" ~style_class:"ls-add-pages px-1 mt-4"
    [ dom ~key:"lib-add-btn" ~tag:"button"
        ~style_class:
          "ui__button button inline-flex items-center h-8 px-3 py-1 gap-1            text-sm rounded-md bg-secondary/70 text-secondary-foreground            text-muted-foreground hover:bg-secondary/100 hover:text-foreground"
        ~events:"click"
        ~on_dom_event:(fun name _ ->
          if name = "click" then Runtime.send Action.Toggle_search)
        [ dom ~key:"lib-add-i" ~tag:"i" ~style_class:"ti ti-plus" []
        ; dom ~key:"lib-add-t" ~tag:"span"
            ~text:(Ui_strings.t "library/add-existing-pages") [] ]
    ]

let page_view (m : Model.t) (page : Model.page) : t =
  let cls =
    "flex-1 page relative cp__page-inner-wrap"
    ^ (if page.page_journal_day <> None then " is-journals" else "")
    ^ (if is_today_page m page then " is-today-page" else "")
    ^ (if page.page_is_tag || page.page_is_property then " is-node-page"
       else "")
  in
  dom ~key:"page" ~style_class:cls
      ~attrs:(page_wrap_attrs page)
    [ dom ~key:"page-inner"
        ~style_class:"relative grid gap-4 sm:gap-8 page-inner mb-16"
        ((match m.route with
          | Model.Block_zoom _ -> zoom_breadcrumbs page
          | _ -> breadcrumbs page.page_title)
        @ [ dom ~key:"page-title-row"
              ~style_class:"flex flex-row space-between"
              [ page_title_el m page ] ]
        @ (if page.page_is_library then [ library_add_pages_button ]
           else [])
        @ [ blocks_inner ?puuid:page.page_uuid ~virtualize:true
              page.page_blocks
          ])
    ; dom ~key:"refs-wrap" ~style_class:"flex flex-col gap-8 ml-1"
        [ dom ~key:"lrefs" ~style_class:"fade-in delay"
            [ references_view m.page_refs ]
        ; dom ~key:"urefs" ~style_class:"fade-in delay"
            [ unlinked_references_view m ]
        ]
    ]

let empty_state () : t =
  box ~key:"empty" ~style_class:"page"
    [ box ~key:"empty-inner" ~style_class:"flex flex-col items-center"
        [ text ~key:"empty-t" ~value:Strings.loading ~style_class:"" [] ]
    ]

(* Library renders the ordinary page chrome plus the add-pages button; its
   page_blocks were already filtered to nested pages at fetch time
   (Decode.view_blocks), and block inserts on it are page-ified by
   editor_actions. *)
let library_view (m : Model.t) (page : Model.page) : t =
  let cls =
    "flex-1 page relative cp__page-inner-wrap"
    ^ (if is_today_page m page then " is-today-page" else "")
    ^ (if page.page_is_tag || page.page_is_property then " is-node-page"
       else "")
  in
  dom ~key:"page" ~style_class:cls
      ~attrs:(page_wrap_attrs page)
    [ dom ~key:"page-inner"
        ~style_class:"relative grid gap-4 sm:gap-8 page-inner mb-16"
        [ dom ~key:"page-title-row" ~style_class:"flex flex-row space-between"
            [ page_title_el m page ]
        ; library_add_pages_button
        ; blocks_inner ?puuid:page.page_uuid ~virtualize:true
            page.page_blocks
        ]
    ; dom ~key:"refs-wrap" ~style_class:"flex flex-col gap-8 ml-1"
        [ dom ~key:"lrefs" ~style_class:"fade-in delay"
            [ references_view m.page_refs ]
        ; dom ~key:"urefs" ~style_class:"fade-in delay"
            [ unlinked_references_view m ]
        ]
    ]

let page_view_of_model (m : Model.t) : t =
  match m.phase, m.route with
  | Model.Ready, Model.Journals -> journals_view m m.journals
  | Model.Ready, Model.Library -> (
      match m.route_page with
      | Some p -> library_view m p
      | None -> empty_state ())
  | Model.Ready, Model.Not_found n -> not_found_view n
  | Model.Ready, (Model.All_graphs | Model.All_pages) ->
      box ~key:"graphs-view" [] (* graphs area renders via its own view *)
  | Model.Ready, Model.Settings -> Settings_page.view m
  | Model.Ready, _ -> (
      match m.route_page with
      | Some page -> page_view m page
      | None -> empty_state ())
  | _ -> empty_state ()
