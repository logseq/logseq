(* Page view — mirrors components/page.cljs essentials:

   .page
     div.ls-page-title.title [data-testid='page title'] > .block-title-wrap
     div.ls-page-blocks > .page-blocks-inner > .ls-block*
     .references (linked refs) / .unlinked-references

   Route views: journals list (#journals > .journal-item), not-found,
   library (title rows only). *)

open Promise_ext
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
  (* title-tag chips get their own context menu (.block-tag, cljs
     block-tag popup) — only the bare title opens the page menu. Refs
     and other anchors inside the title still open the page menu *)
  let on_tag_chip =
    I18n.contains (Platform.payload_str payload "targetClass") "block-tag"
  in
  if name = "contextmenu" && not on_tag_chip then (
    Runtime.send
      (Action.Page_menu_set
         (Some
            ( Platform.payload_num payload "clientX"
            , Platform.payload_num payload "clientY"
            , false )));
    Runtime.flush ())

(* generic: works for any entity uuid (page or block) *)
let set_icon (u : string) (c : Icon_picker.choice) =
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
    (let* _ = Outliner_ops.apply [ op ] in
    !Runtime.reload_current_view ())

let set_page_icon (page : Model.page) (c : Icon_picker.choice) =
  match page.page_uuid with
  | None -> ()
  | Some u -> set_icon u c

let page_icon_picker (page : Model.page) (anchor : string) =
  match Properties_dom.doc_query anchor with
  | None -> ()
  | Some anchor ->
      Icon_picker.open_picker ~anchor
        ~del:(page.page_icon <> None)
        ~on_chosen:(fun c -> set_page_icon page c)

let title_editor (page : Model.page) : t =
  let commit ?(select = false) value =
    let value = String.trim value in
    (match page.page_uuid with
     | Some u ->
         ignore
           (Page_ops.rename u value
            |> Js.Promise.then_ (fun () ->
              Runtime.send Action.Title_edit_done;
              if select then Editor_actions.select_single u;
              Runtime.flush ();
              Js.Promise.resolve ())
            |> Js.Promise.catch (fun _ ->
              (* rejected rename (e.g. "#" in the name): the worker
                 notification toast already explains it; the editor
                 stays open on the typed text like cljs *)
              Js.Promise.resolve ()))
     | None ->
         Runtime.send Action.Title_edit_done;
         Runtime.flush ())
  in
  (* cljs: the page-title editor is the regular editor box —
     .editor-wrapper > .editor-inner.block-editor > textarea +
     mock-text mirror (popup caret positioning) *)
  let uuid = Option.value page.page_uuid ~default:"" in
  Ui_parts.editor_wrapper ~key:"pt-edit" ~id:("editor-edit-block-" ^ uuid)
    [ Ui_parts.editor_inner ~key:"pt-ei"
        [ dom ~key:"pt-ta" ~tag:"textarea"
            ~id:("edit-block-" ^ uuid)
            ~attrs:[ ("autofocus", "true") ]
            ~text:page.page_title ~events:"keydown blur"
        ~on_dom_event:(fun name payload ->
          match name with
          | "blur" -> commit (Platform.payload_str payload "value")
          | "keydown" -> (
              match Platform.payload_str payload "key" with
              | "Enter" | "Escape" ->
                  (* cljs: exiting the title editor selects the title
                     block, same as leaving any block edit — only once
                     the rename actually commits *)
                  commit ~select:true
                    (Platform.payload_str payload "value")
              | _ -> ())
          | _ -> ())
        []
        ; Ui_parts.mock_text ~key:"pt-mt"
        ]
    ; Asset_dom.upload_input ("pt-up-" ^ uuid)
    ]


(* cljs title-tag chip: .block-tag > .flex.items-center > a.hash-symbol +
   a.tag[draggable][data-ref] > span. The .ls-block-right/.hover wrappers
   render even when the page has no tags (empty container). *)
let title_tag_chips (page : Model.page) : t list =
  [ dom ~key:"pt-right"
      ~style_class:
        "ls-block-right flex flex-row items-center self-start gap-1"
      [ dom ~key:"ptr-ghost" ~style_class:"opacity-70 hover:opacity-100"
          (match page.Model.page_tags with
           | [] -> []
           | tags ->
               [ dom ~key:"pt-tags" ~style_class:"block-tags gap-1"
                   (List.mapi
                     (fun i tag ->
                       let ident =
                         match List.nth_opt page.Model.page_tag_idents i with
                         | Some s -> s
                         | None -> ""
                       in
                       let priv = Tree.private_tag_ident ident in
                       dom ~key:("pt-tag-" ^ string_of_int i)
                         ~style_class:
                           ("block-tag"
                           ^ if priv then " private-tag" else "")
                         ~attrs:
                           [ ( "data-tag-uuid"
                             , Option.value
                                 (List.nth_opt
                                    page.Model.page_tag_uuids i)
                                 ~default:"" )
                           ; ( "data-tag-id"
                             , Option.value
                                 (Option.map string_of_int
                                    (List.nth_opt
                                       page.Model.page_tag_db_ids i))
                                 ~default:"0" )
                           ; ("data-tag-title", tag)
                           ; ( "data-tag-priv"
                             , if priv then "true" else "false" ) ]
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
           )
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
              let shift, interactive =
                ( Platform.payload_bool payload "shiftKey"
                , Platform.payload_bool payload "interactive" )
              in
              (* shift+click opens the page in the right sidebar (handled by
                 the document-level listener); starting title edit would
                 replace the clicked node mid-dispatch *)
              if page.page_uuid <> None && not shift && not interactive then (
                (* cljs edit entry clears any block selection *)
                if S.ready () then Editor_actions.clear_selection ();
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
                [ Render.wrap ~cls:"block-title-wrap ls-title-text"
                    ~self:uuid page.page_title ]
            ]
        ]
    ]

let page_title_el (m : Model.t) (page : Model.page) : t =
 fun ctx parent ->
  (* title rows also render in the journals list before any block row
     mounts the editor state — the .ls-block class signal needs it *)
  S.ensure ctx;
  (
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
  (* cljs collapsable? on a page-title row = db-collapsable? on the page
     entity (any non-internal property keys, e.g. a page property) — the
     fold arrow shows on hover when this or an already-collapsed title
     holds. Live-read the attr too: the mounted properties area keeps
     data-db-collapsable in sync with the page's live property rows *)
  let collapsable_title () =
    page.Model.page_db_collapsable || page.Model.page_is_tag
    || title_collapsed
    ||
    (match Browser_ui.qs ".ls-page-title .ls-block" with
     | Some tb ->
         Browser_ui.get_attr tb "data-db-collapsable" = Some "true"
     | None -> false)
  in
  let body =
    (* cljs db-page-title: the page title is a full block row —
       .ls-block > .is-page-title-row > bullet control + nested
       flex-col wrappers > .ls-page-title-container > .block-row >
       .block-content-wrapper(.ls-page-title-actions + content|editor) +
       .ls-block-right(.block-tags). Tags render while editing too. *)
    [ dom ~key:"pt-inner" ~style_class:"w-full relative"
        [ dom ~key:"pt-block"
            ~style_class_signal:
              (Logseq_dom.class_signal (S.signal ()) (fun (st : S.t) ->
                   if S.String_set.mem uuid st.S.selected then
                     "selected ls-block"
                   else "ls-block"))
            ~id:("ls-block-" ^ uuid)
            ~attrs:
              [ ("blockid", uuid); ("containerid", uuid)
              ; ("data-block-title", page.page_title)
              ; ("haschild", "false")
              ; ("data-comment-item", "false")
              ; ("data-comments-area", "false"); ("level", "0")
              ; ("data-collapsed", "false")
              ; ( "data-db-collapsable"
                , if page.Model.page_db_collapsable then "true" else "false" )
              ; ("data-block-format", "markdown") ]
            [ dom ~key:"pt-row"
                ~style_class:
                  "block-main-container flex flex-row gap-1 is-page-title-row"
                ~attrs:
                  [ ( "style"
                    , "margin-left: "
                      ^ if icon_el = None then "-55px" else "-61px" )
                  ]
                ~events:"mouseenter mouseleave"
                ~on_dom_event:(fun name _ ->
                  (* cljs *control-show? atom: caret appears only while
                     hovering the title row, and only for collapsable
                     titles *)
                  if collapsable_title () then
                    match
                      Browser_ui.qs ".ls-page-title .block-control > span"
                    with
                    | Some el ->
                        if name = "mouseenter" then (
                          Browser_ui.rm_class el "control-hide";
                          Browser_ui.add_class el "control-show";
                          Browser_ui.add_class el "cursor-pointer")
                        else (
                          Browser_ui.add_class el "control-hide";
                          Browser_ui.rm_class el "control-show";
                          Browser_ui.rm_class el "cursor-pointer")
                    | None -> ())
                [ dom ~key:"pt-ctrl"
                    ~style_class:
                      ("is-with-icon w-6"
                      ^ (if title_collapsed then " bullet-closed" else "")
                      ^ " bullet-hidden block-control-wrap flex flex-row \
                         items-center h-6")
                    ~attrs:[ ("data-has-children", "false") ]
                    ([ (let cs =
                          dom ~key:"pt-cs" ~tag:"span"
                            ~style_class:"control-hide"
                            [ dom ~key:"pt-ra" ~tag:"span"
                                ~style_class:
                                  ("rotating-arrow"
                                  ^ if title_collapsed then " collapsed"
                                    else " not-collapsed")
                                [ Ui_parts.rotating_arrow "pt-arw" ]
                            ]
                        in
                        dom ~key:"pt-ca" ~tag:"a"
                          ~style_class:"block-control"
                          ~id:("control-" ^ uuid) ~events:"click"
                          ~on_dom_event:(fun name _ ->
                            if name = "click" && collapsable_title () then
                              toggle_title_collapse ())
                          [ cs ])
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
                                            [ ("type", "button") ]
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
                                                ".ls-page-title .ls-page-icon")
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
                                                   "flex flex-col flex-1 \
                                                    w-full gap-2 \
                                                    block-content-wrapper"
                                                 ~attrs:
                                                   [ ( "style"
                                                     , "display: flex" ) ]
                                                 ((if m.editing_title then
                                                    []
                                                  else
                                                    [ Properties_area.title_actions
                                                        page ])
                                                @ [ (if m.editing_title then
                                                       title_editor page
                                                     else
                                                       title_content page)
                                                  ])
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
        ; (* cljs db-properties-cp: the page properties area sits
             inside the title's .ls-block, after .block-main-container *)
          Properties_area.page_area page
        ]
      ]
    ; (* cljs plugin slot extension point after the title block *)
      dom ~key:"pt-slot" ~style_class:"flex flex-row"
        [ dom ~key:"pt-slot-i" ~style_class:"lsp-hook-ui-slot"
            ~attrs:
              [ ( "id"
                , "slot__"
                  ^ (match page.page_uuid with
                     | Some u when String.length u >= 8 -> String.sub u 0 8
                     | _ -> "lui0000") ) ]
            []
        ]
    ]
  in
  (* e2e selects [data-testid='page title'] — same locator as cljs *)
  dom ~key:"page-title"
    ~style_class:"ls-page-title flex flex-1 w-full content items-start title \
                  title"
    ~attrs:[ ("data-testid", "page title") ]
    ~events:"click contextmenu"
    ~on_dom_event:(fun name payload ->
      match name with
      | "click" ->
          (* icon buttons live inside #page-title; skip title-edit when
             they (or their children) are the click target *)
          let target, interactive =
            ( Platform.payload_str payload "targetId"
            , Platform.payload_bool payload "interactive" )
          in
          let shift =
            Platform.payload_bool payload "shiftKey"
          in
          if
            page.page_uuid <> None && not shift
            && (target = "" || target = "page-title"
                || target = "page-title-text")
            && not interactive
          then (
            (* cljs edit entry clears any block selection *)
            if S.ready () then Editor_actions.clear_selection ();
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
    ) ctx parent

(* .block-add-button — the imperative Add_button.ensure_all doc-scan can't
   inject elements natively (no real DOM), so the element is emitted
   declaratively here with the same shape build_el produces. Clicks reach
   Editor_actions.append_block via the document-level click listener
   matching closest ".block-add-button". has_children drives the same
   opacity class build_el computes. *)
let add_button_el ?puuid ~(has_children : 'a -> bool Signal.signal) : t =
 fun context parent ->
  let hc = has_children context in
  (dom ~key:"bab"
     ~style_class_signal:
       (Logseq_dom.class_signal hc (fun has ->
            "ls-block block-add-button flex-1 flex-col rounded-sm \
             cursor-text transition-opacity ease-in duration-100 !py-0 "
            ^ (if has then "opacity-0" else "opacity-50")))
     ~attrs:
       (("tabindex", "0")
        :: (match puuid with
            | Some u -> [ ("parentblockid", u) ]
            | None -> []))
     ~events:"click"
     [ dom ~key:"bab-row" ~style_class:"flex flex-row"
         [ dom ~key:"bab-inner" ~style_class:"flex items-center"
             ~attrs:[ ("style", "height:28px;margin-left:22px;") ]
             [ dom ~key:"bab-bc" ~tag:"span"
                 ~style_class:"bullet-container"
                 [ dom ~key:"bab-b" ~tag:"span" ~style_class:"bullet" [] ]
             ] ] ])
    context parent

let blocks_inner ?puuid ?(virtualize = false) ?(library = false)
    ?(scope = "main") ?(container = true) (blocks : Model.block list) : t =
  let inner_attrs =
    match puuid with
    | Some u -> [ ("data-pu", u) ]
    | None -> []
  in
  let items = Array.of_list blocks in
  (* cljs plain-block-list: (when (seq block-uuids)
     [:div.blocks-list-wrap ...]) — empty pages emit no wrap *)
  let list_wrap =
    if blocks = [] then []
    else if Virt_list.enabled ~virtualize (Array.length items) then
      (* cljs parity: .blocks-list-wrap carries
         data-virtuoso-scroller; rows are .ls-virt-row[data-index] >
         .ls-block *)
      [ dom ~key:"blw-virt" ~style_class:"blocks-list-wrap"
          ~attrs:
            [ ("data-level", "0"); ("data-virtuoso-scroller", "true") ]
          [ Virt_list.list ~key_of:Tree.block_key
              ~estimate_size:(fun _ -> 32.)
              ~data_sig:(fun ctx ->
                Some
                  (Signal.value
                     (Runtime.page_items_sig ctx.Lui_ui.ui_scheduler
                        ~scope ~puuid items)))
              ~pin_key:(fun () ->
                match S.editing () with
                | Some e when e.S.scope = scope ->
                    Some (S.top_level_uuid e.S.uuid)
                | _ -> None)
              ~pin_sig:(fun () ->
                if S.ready () then Some (S.signal ()) else None)
              ~render:(Tree.block_row ~library ~scope) items ] ]
    else
      [ dom ~key:"blw" ~style_class:"blocks-list-wrap"
          ~attrs:[ ("data-level", "0") ]
          (List.map (Tree.block_row ~library ~scope) blocks) ]
  in
  (* cljs page-root-virtual-list: .blocks-container.flex-1[containerid]
     wraps the .blocks-list-wrap block list; journal-page's
     plain-block-list sits directly under .page-blocks-inner *)
  let body =
    if not container then list_wrap
    else
      [ dom ~key:"blc" ~style_class:"blocks-container flex-1"
          ~attrs:
            (match puuid with
             | Some u -> [ ("containerid", u) ]
             | None -> [])
          list_wrap ]
  in
  dom ~key:"page-blocks" ~style_class:"mt-4 ls-page-blocks"
    ~attrs:[ ("style", "margin-left: -20px") ]
    [ dom ~key:"page-blocks-inner" ~style_class:"page-blocks-inner relative"
        ~attrs:(("data-cid", scope) :: inner_attrs)
        (body
         @ [ add_button_el ?puuid
               ~has_children:(fun ctx ->
                 Signal.constant ctx.Lui_ui.ui_scheduler (blocks <> []))
           ])
    ]

(* cljs components/block.cljs grouped-blocks-container: refs render
   grouped under their source page (references-blocks-item > page-cp),
   so the referencing page's name must appear inside .references *)
let refs_grouped (refs : Model.block list) : (string * Model.block list) list =
  (* linear grouping: Hashtbl keyed by source page name, order of first
     appearance preserved; a per-ref List.find_opt + append rebuild is
     O(refs x groups) on ref-heavy pages *)
  let tbl : (string, Model.block list ref) Hashtbl.t = Hashtbl.create 16 in
  let order = ref [] in
  List.iter
    (fun (b : Model.block) ->
      let name = Option.value b.block_page_name ~default:"" in
      match Hashtbl.find_opt tbl name with
      | Some bs -> bs := b :: !bs
      | None ->
          Hashtbl.replace tbl name (ref [ b ]);
          order := name :: !order)
    refs;
  List.rev_map
    (fun name ->
      (name, List.rev !(Hashtbl.find tbl name)))
    (List.rev !order)

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
            [ Ui_parts.rotating_arrow (key ^ "-svg") ]
        ]
    ]

let view_ghost_btn key ?title ?on_click icon_name size : t =
  let attrs =
    [ ("type", "button"); ("tabindex", "0") ]
    @ (match title with Some s -> [ ("title", s) ] | None -> [])
  in
  let events, handler =
    match on_click with
    | Some f -> ("click", Some (fun name _ -> if name = "click" then f ()))
    | None -> ("", None)
  in
  dom ~key ~tag:"button" ~attrs ~events ?on_dom_event:handler
    ~style_class:(ui_btn ^ " as-ghost h-7 rounded py-1 \
                  text-muted-foreground !px-1")
    [ Icons.icon ~size icon_name ]

(* cljs views/view header for :linked-references — foldable title with the
   "Linked references <count>" view tab and hidden-until-hover actions *)
let refs_view_head key ?on_search title count : t =
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
                ~text:title
                [ dom ~key:"vh-n" ~tag:"span"
                    ~style_class:"text-muted-foreground text-xs"
                    ~text:(string_of_int count) []
                ]
            ; dom ~key:"vh-add" ~tag:"button"
                ~attrs:
                  [ ("type", "button"); ("tabindex", "0")
                  ; ("title", I18n.t "view/add-new-view") ]
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
        [ view_ghost_btn "vh-fc" ~title:(I18n.t "reference/page-filter")
            "filter-cog" 18.
        ; view_ghost_btn "vh-srt" "arrows-up-down" 18.
        ; view_ghost_btn "vh-flt" "filter" 18.
        ; dom ~key:"vh-search" ~style_class:"view-action-search"
            [ dom ~key:"vh-si" ~style_class:"flex flex-row items-center"
                [ view_ghost_btn "vh-sb" ?on_click:on_search "search" 15. ] ]
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

(* cljs ui/foldable-title: .ls-foldable-title > .foldable-title >
   .ls-foldable-header > [a.ls-foldable-title-control] + header —
   the control renders at every level (section and group titles). *)
let foldable_title ?on_click ?(control = true) key inner : t =
  dom ~key:(key ^ "-ft") ~style_class:"ls-foldable-title content"
    [ dom ~key:"ftr" ~style_class:"flex-1 flex-row foldable-title"
        [ dom ~key:"fth"
            ~style_class:"flex flex-row items-center ls-foldable-header gap-1"
            ((if control then [ fold_arrow ?on_click (key ^ "-fa") ]
              else [])
             @ [ inner ])
        ]
    ]

let foldable_content key inner : t =
  dom ~key:(key ^ "-fc") ~style_class:"ls-foldable-content"
    ~attrs:[ ("aria-hidden", "false") ]
    [ dom ~key:"fci" ~style_class:"ls-foldable-content-inner" [ inner ] ]

(* one linked-ref group: source page-ref foldable title + its blocks.
   The static layout keeps the virtuoso index attrs; virtualized rows get
   data-index from the .ls-virt-row wrapper instead (a second data-index
   inside would double-measure) *)
let ref_group ?(extra_attrs = []) (name, blocks) : t =
  let key = "rg-" ^ name in
  dom ~key ~attrs:extra_attrs
    [ dom ~key:"gi" ~style_class:"flex flex-col"
        (* ref-group titles carry no fold arrow: e2e resolves
           ".unlinked-references .ls-foldable-title-control" strictly
           (one control per section) *)
        [ foldable_title ~control:false (key ^ "-t")
            (dom ~key:"grp" ~style_class:""
               [ dom ~key:"grl" ~tag:"a" ~style_class:"page-ref relative"
                   ~attrs:
                     [ ("tabindex", "0"); ("draggable", "true")
                     ; ("data-ref", String.lowercase_ascii name) ]
                   [ dom ~key:"grs" ~tag:"span" ~text:name [] ]
               ])
        ; foldable_content (key ^ "-b")
            (* cljs: .-ml-2 > div#<viewid> > div(partition) >
               [.ml-6 breadcrumb + .content list] *)
            (dom ~key:"grm" ~style_class:"-ml-2"
               [ dom ~key:"grv" ~id:(Platform.random_uuid ())
                   [ dom ~key:"grp2"
                       [ dom ~key:"grb" ~style_class:"ml-6 text-sm \
                          opacity-70 hover:opacity-100 mt-1" []
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
                       ]
                   ]
               ])
        ]
    ]

let ref_groups_virt key (groups : (string * Model.block list) list) : t =
  let items = Array.of_list groups in
  (* virtualize at group granularity — a tag page can carry hundreds of
     source-page groups; group rows measure dynamically like journals *)
  if Virt_list.enabled ~virtualize:true (Array.length items) then
    dom ~key ~style_class:"group-list-view"
      ~attrs:[ ("data-virtuoso-scroller", "true")
             ; ("style", "position: relative;") ]
      [ Virt_list.list
          ~list_attrs:[ ("data-viewport-type", "window") ]
          ~key_of:(fun (name, _) -> name)
          ~estimate_size:(fun _ -> 120.) ~render:ref_group items ]
  else
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
              (List.mapi
                 (fun i g ->
                   ref_group
                     ~extra_attrs:
                       [ ("data-index", string_of_int i)
                       ; ("data-item-index", string_of_int i)
                       ; ("style", "overflow-anchor: none;") ]
                     g)
                 groups)
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
  | Some p ->
      Outliner_ops.fetch_unlinked_refs
        ~stale:(fun () -> !Runtime.current_route <> Some m.route)
        p
  | None -> ()

let references_view (refs : Model.block list) : t =
  match refs with
  | [] -> Logseq_dom.nothing
  | _ ->
      let groups = refs_grouped refs in
      dom ~key:"refs" ~style_class:"references"
        [ dom ~key:"rv1" ~style_class:"flex flex-col gap-2"
            [ dom ~key:"rv2" ~style_class:"flex flex-col gap-2 grid"
                [ dom ~key:"rv3" ~style_class:"flex flex-col"
                    [ foldable_title "refs-t"
                        (refs_view_head "refs"
                           (I18n.t "view/linked-references")
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
  | [] -> Logseq_dom.nothing
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
        ~attrs:[ ("placeholder", I18n.filter_placeholder) ]
        ~events:"input"
        ~on_dom_event:(fun name payload ->
          if name = "input" then (
            let q =
              Platform.payload_str
                payload "value"
            in
            Runtime.send (Action.Unlinked_set_query q);
            Runtime.flush ()))
        []
    ]

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
       | None -> Logseq_dom.nothing)
    ; Tree.block_row ~scope:"unlinked" b
    ]

(* cljs reference/unlinked-references — same views/view chrome as linked
   refs; our search input + fold toggle ride on the same handlers *)
let unlinked_references_view (m : Model.t) : t =
  (* cljs renders the section (foldable header included) whenever the
     :block-unlinked-ref-exists resource is true — independent of the
     fold state, since opening is what triggers the refs fetch *)
  match m.unlinked_exists with
  | false -> Logseq_dom.nothing
  | true ->
  let refs = m.unlinked_refs in
  let filtered =
    let q = String.trim m.unlinked_query in
    if q = "" then refs
    else
      List.filter
        (fun (b : Model.block) ->
          I18n.contains_ci b.block_title q
          ||
          (match b.block_page_name with
           | Some p -> I18n.contains_ci p q
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
                       ~on_search:(fun () ->
                         Runtime.send Action.Unlinked_toggle_search;
                         Runtime.flush ())
                       (I18n.t "view/unlinked-references")
                       (List.length refs))
                ; dom ~key:"urefs-content" ~style_class:"ls-foldable-content"
                    ~attrs:
                      [ ( "aria-hidden"
                        , if m.unlinked_open then "false" else "true" ) ]
                    [ dom ~key:"ufci" ~style_class:"ls-foldable-content-inner"
                        [ (if m.unlinked_search then unlinked_search_input ()
                          else Logseq_dom.nothing)
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

let is_today_journal (page : Model.page) : bool =
  match page.page_journal_day with
  | Some d -> d = Dates.today_journal_day ()
  | None -> false

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
            ; Properties_area.bidi_area p
            ; blocks_inner ?puuid:p.page_uuid ~container:false
                p.page_blocks
            ]
        ; dom ~key:("jrefs-w-" ^ key) ~style_class:"flex flex-col gap-8 ml-1"
            (* cljs journal-page: #today-queries div on the today item,
               then one .fade-in.delay refs section (unlinked refs are
               suppressed on the home route) *)
            ((if is_today_journal p then
                [ dom ~key:"tq" ~id:"today-queries" [] ]
              else [])
            @ [ dom ~key:"jrefs-f" ~style_class:"fade-in delay"
                  [ journal_references_view p ]
              ])
        ]
    ]

(* cljs all-journals mounts a Virtuoso scroller with custom-scroll-parent:
   #journals > div > div > div[data-testid=virtuoso-item-list] > div >
   journal-item. We keep the same scaffolding. *)
let journals_virt_item (m : Model.t) (js : Model.page list) : t list =
  List.mapi
    (fun i p ->
      dom ~key:("jvi-" ^ string_of_int i)
        [ journal_item ~last:(i = List.length js - 1) m p ])
    js

let journals_view (m : Model.t) (js : Model.page list) : t =
  let items = Array.of_list js in
  dom ~key:"journals" ~id:"journals" ~style_class:"h-full"
    (match js with
     | [] ->
         [ dom ~key:"jp"
             ~style_class:"journal-item-placeholder animate-pulse p-6" [] ]
     | _ ->
         (* cljs mounts the Virtuoso scroller unconditionally; only
            rtc-test mode (without the flag) falls back to eager rows *)
         if Virt_list.enabled_min ~virtualize:true ~min:1
              (Array.length items)
         then
           [ dom ~key:"js"
               [ dom ~key:"jvp"
                   [ Virt_list.list
                       ~list_attrs:[ ("data-virtuoso-scroller", "true") ]
                       ~estimate_size:(fun _ -> 640.)
                       ~key_of:(fun (p : Model.page) ->
                         Option.value p.page_uuid ~default:p.page_title)
                       ~render:(journal_item m) items ]
               ]
           ]
         else
           [ dom ~key:"js"
               [ dom ~key:"jvp"
                   [ dom ~key:"jil"
                       ~attrs:[ ("data-testid", "virtuoso-item-list") ]
                       (journals_virt_item m js) ]
               ]
           ])

let not_found_view name : t =
  dom ~key:"not-found" ~style_class:"page"
    [ box ~key:"nf-inner" ~style_class:"flex flex-col items-center"
        [ text ~key:"nf-t" ~value:(I18n.page_not_found ^ name)
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
            ~text:(I18n.t "library/add-existing-pages") [] ]
    ]

let empty_state () : t =
  box ~key:"empty" ~style_class:"page"
    [ box ~key:"empty-inner" ~style_class:"flex flex-col items-center"
        [ text ~key:"empty-t" ~value:I18n.loading ~style_class:"" [] ]
    ]

(* --- stable page region --------------------------------------------

   A route page mounts once per navigation. Later publishes — op deltas
   spliced into the model, ref loads, flag changes — repaint through the
   segments below instead of rebuilding the view: the block list is a
   keyed collection so a one-block splice patches one row rather than
   re-rendering the whole tree (~200ms flush on a 200-block page). *)

(* region repaint key: page identity only — splices keep the same page *)
let page_key (p : Model.page option) =
  match p with
  | Some p -> (p.page_uuid, p.page_db_id)
  | None -> (None, None)

let page_route (r : Model.route) =
  match r with
  | Model.Page _ | Model.Block_zoom _ | Model.Library -> true
  | _ -> false

let scope_of_route (r : Model.route) =
  match r with Model.Block_zoom u -> "zoom-" ^ u | _ -> "main"

let page_cls (m : Model.t) =
  let base = "flex-1 page relative cp__page-inner-wrap" in
  match m.route_page with
  | Some page ->
      base
      ^ (if page.page_journal_day <> None then " is-journals" else "")
      ^ (if is_today_page m page then " is-today-page" else "")
      ^ (if page.page_is_tag || page.page_is_property then " is-node-page"
         else "")
  | None -> base

let wrap_attrs_of (m : Model.t) =
  match m.route_page with Some p -> page_wrap_attrs p | None -> []

let blocks_sig_of (ms : Model.t Signal.signal) =
  Signal.map
    (fun (m : Model.t) ->
      match m.route_page with
      | Some p -> p.Model.page_blocks
      | None -> [])
    ms

(* top-level block rows as a keyed collection: keyed republishes only
   items whose record actually changed, so a delta splice remounts the
   touched row instead of re-diffing every mounted block *)
let blocks_area ~scope ~library ?puuid (ms : Model.t Signal.signal) : t =
  let blocks_sig = blocks_sig_of ms in
  let nonempty = Signal.map (fun bs -> bs <> []) blocks_sig in
  let keyed_list =
    dom ~key:"blw" ~style_class:"blocks-list-wrap"
      ~attrs:[ ("data-level", "0") ]
      [ Logseq_dom.keyed ~source:blocks_sig ~key:Tree.block_key
          ~cmp:String.compare
          ~mount:(Tree.block_row_sig ~library ~scope) ]
  in
  (* a virtualized list captures its data array at mount, so it can't
     ride the keyed path — rebuild it on a new blocks spine; windowed
     rendering stays active for big pages outside rtc-test *)
  let virt_list =
    dom ~key:"blw-virt" ~style_class:"blocks-list-wrap"
      ~attrs:
        [ ("data-level", "0"); ("data-virtuoso-scroller", "true") ]
      [ Logseq_dom.dyn ~equal:(fun a b -> a == b)
          (fun (bs : Model.block list) ->
            Virt_list.list ~key_of:Tree.block_key
              ~estimate_size:(fun _ -> 32.)
              ~render:(Tree.block_row ~library ~scope)
              (Array.of_list bs))
          blocks_sig ]
  in
  (* if_/dyn branches must mount a node — the keyed/virt choice can't be
     a dynamic child, so pick once per region mount; either renderer is
     correct at any size, the threshold is only an optimization *)
  let list_el =
    if Virt_list.enabled ~virtualize:true
         (List.length (Signal.get blocks_sig))
    then virt_list
    else keyed_list
  in
  (* cljs plain-block-list emits no .blocks-list-wrap on empty pages *)
  dom ~key:"page-blocks" ~style_class:"mt-4 ls-page-blocks"
    ~attrs:[ ("style", "margin-left: -20px") ]
    [ dom ~key:"page-blocks-inner"
        ~style_class:"page-blocks-inner relative"
        ~attrs:
          (("data-cid", scope)
           :: (match puuid with
               | Some u -> [ ("data-pu", u) ]
               | None -> []))
        [ dom ~key:"blc" ~style_class:"blocks-container flex-1"
            ~attrs:
              (match puuid with
               | Some u -> [ ("containerid", u) ]
               | None -> [])
            [ Logseq_dom.if_ ~test:nonempty list_el ]
        ; add_button_el ?puuid ~has_children:(fun _ -> nonempty)
        ]
    ]

let title_row (m : Model.t) (page : Model.page) : t =
  dom ~key:"page-title-row" ~style_class:"flex flex-row space-between"
    [ page_title_el m page ]

(* dyn bodies mount a single node — display:contents keeps the segment
   transparent to .page-inner's grid so its children lay out like the
   direct rows the static build emitted *)
let top_view (m : Model.t) : t =
  match m.route_page with
  | None -> Logseq_dom.nothing
  | Some page ->
      (match m.route with
       | Model.Block_zoom _ ->
           dom ~key:"ptz" ~attrs:[ ("style", "display:contents") ]
             (zoom_breadcrumbs page)
       | Model.Library ->
           dom ~key:"ptl" ~attrs:[ ("style", "display:contents") ]
             [ title_row m page; library_add_pages_button ]
       | _ ->
           dom ~key:"ptm" ~attrs:[ ("style", "display:contents") ]
             (breadcrumbs page.page_title
              @ [ title_row m page
                ; (* cljs bidirectional-properties-area: sibling of the
                     blocks list inside .page-inner *)
                  Properties_area.bidi_area page ]
              @
              if page.page_is_library then [ library_add_pages_button ]
              else []))

let top_key (p : Model.page option) =
  match p with
  | Some p ->
      Some
        ( p.page_uuid, p.page_title, p.page_icon, p.page_is_tag
        , p.page_is_library, p.page_db_collapsable, p.page_parents
        , p.page_journal_day )
  | None -> None

let top_eq (a : Model.t) (b : Model.t) =
  a.route = b.route
  && a.editing_title = b.editing_title
  && top_key a.route_page = top_key b.route_page

let ref_flags (p : Model.page option) =
  match p with
  | Some p ->
      Some
        ( p.page_journal_day, p.page_is_tag, p.page_is_property
        , p.page_uuid )
  | None -> None

(* field identity, not structural [=]: page_refs/unlinked_refs carry
   block trees — an O(tree) compare on every model publish would defeat
   the point of the stable region *)
let refs_eq (a : Model.t) (b : Model.t) =
  a.page_refs == b.page_refs
  && a.unlinked_refs == b.unlinked_refs
  && a.unlinked_exists = b.unlinked_exists
  && a.unlinked_open = b.unlinked_open
  && a.unlinked_search = b.unlinked_search
  && a.unlinked_query = b.unlinked_query
  && a.route = b.route
  && ref_flags a.route_page = ref_flags b.route_page

let refs_wrap (m : Model.t) : t =
  match m.route_page with
  | None -> Logseq_dom.nothing
  | Some page ->
      dom ~key:"refs-wrap" ~style_class:"flex flex-col gap-8 ml-1"
        (* cljs page-inner: #today-queries div first on today's journal,
           then linked and unlinked refs .fade-in.delay sections *)
        ((if is_today_page m page then
            [ dom ~key:"tq" ~id:"today-queries" [] ]
          else [])
        @ [ dom ~key:"lrefs" ~style_class:"fade-in delay"
              [ references_view m.page_refs ]
          ; (* cljs when-not class-page?/property-page? — the unlinked
               section is omitted entirely on node pages *)
            (if page.page_is_tag || page.page_is_property
             then Logseq_dom.nothing
             else
               dom ~key:"urefs" ~style_class:"fade-in delay"
                 [ unlinked_references_view m ])
          ])

let page_view_ms (ms : Model.t Signal.signal) : t =
 fun ctx parent ->
  let m0 = Signal.get ms in
  let scope = scope_of_route m0.route in
  let library =
    m0.route = Model.Library
    ||
    (match m0.route_page with
     | Some p -> p.page_is_library
     | None -> false)
  in
  let puuid =
    match m0.route_page with
    | Some p -> p.page_uuid
    | None -> None
  in
  (dom ~key:"page" ~style_class_signal:(Logseq_dom.class_signal ms page_cls)
      ~attrs_signal_v:(Logseq_dom.attrs_signal ms wrap_attrs_of)
    [ dom ~key:"page-inner"
        ~style_class:"relative grid gap-4 sm:gap-8 page-inner mb-16"
        [ Logseq_dom.dyn ~equal:top_eq top_view ms
        ; blocks_area ~scope ~library ?puuid ms
        ]
    ; Logseq_dom.dyn ~equal:refs_eq refs_wrap ms
    ; Selection_bar.view ()
    ])
    ctx parent

(* the route-root dynamic segment — page routes keep the region mounted
   across data publishes (the keyed/dyn segments inside repaint
   themselves); all other routes keep repaint-on-data semantics *)
let region (ms : Model.t Signal.signal) : t =
  Logseq_dom.dyn
    ~equal:(fun (a : Model.t) (b : Model.t) ->
      let shell =
        a.phase = b.phase
        && a.route = b.route
        && a.page_missing = b.page_missing
        && page_key a.route_page = page_key b.route_page
      in
      if page_route a.route && page_route b.route then shell
      else
        shell
        && a.data_gen = b.data_gen
        && a.editing_title = b.editing_title
        && a.page_menu = b.page_menu
        && a.confirm = b.confirm
        && a.unlinked_open = b.unlinked_open
        && a.unlinked_search = b.unlinked_search
        && a.unlinked_query = b.unlinked_query)
    (fun (m : Model.t) ->
      match m.phase, m.route with
      | Model.Ready, (Model.Journals | Model.Home) ->
          (* cljs container.cljs: journals render inside a plain
             route-root div *)
          dom ~key:"journals-root"
            [ journals_view m m.journals; Selection_bar.view () ]
      | Model.Ready, Model.Not_found n -> not_found_view n
      | Model.Ready, Model.Graph_view ->
          (* the link-graph canvas isn't ported to the native renderer
             yet — an explicit empty state instead of the 404 chrome *)
          dom ~key:"gv" ~style_class:"page"
            [ box ~key:"gv-inner"
                ~style_class:"flex flex-col items-center justify-center py-32"
                [ box ~key:"gv-i" ~style_class:"text-gray-9 mb-4"
                    [ Icons.icon ~size:48. "hierarchy" ]
                ; text ~key:"gv-t" ~value:(I18n.t "nav/graph-view")
                    ~style_class:"text-2xl font-semibold text-gray-12 mb-2" []
                ; text ~key:"gv-d"
                    ~value:"Graph view isn't available in this app yet."
                    ~style_class:"text-gray-10" []
                ]
            ]
      | Model.Ready, (Model.All_graphs | Model.All_pages) ->
          box ~key:"graphs-view" [] (* renders via its own view *)
      | Model.Ready, Model.Settings -> Settings_page.view m
      | Model.Ready, Model.Import -> Importer.view ()
      | Model.Ready, _ -> (
          match m.route_page, m.page_missing with
          | Some _, _ -> page_view_ms ms
          | None, true ->
              (* cljs page-aux: missing page/block renders inline
                 (t :page/not-found) inside the content wrap *)
              dom ~key:"pg-missing" ~style_class:"opacity-75"
                [ text ~key:"pgm-t" ~value:(I18n.t "page/not-found")
                    ~style_class:"" [] ]
          | None, false -> empty_state ())
      | _ -> empty_state ())
    ms
