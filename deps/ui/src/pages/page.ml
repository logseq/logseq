(* Page view — mirrors components/page.cljs essentials:

   .page
     div.ls-page-title.title [data-testid='page title'] > .block-title-wrap
     div.ls-page-blocks > .page-blocks-inner > .ls-block*
     .references (linked refs) / .unlinked-references

   Route views: journals list (#journals > .journal-item), not-found,
   library (title rows only). *)

open Lui_elements

let dom = Logseq_dom.dom

(* --- shared pieces ------------------------------------------------ *)

let breadcrumbs title : t =
  (* namespaced pages "a/b/c" -> breadcrumb trail *)
  match String.split_on_char '/' title with
  | [] | [ _ ] -> box ~key:"bc-none" []
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
      dom ~key:"bc" ~style_class:"breadcrumb" (crumbs [] "" parts)

(* click position payload -> Page_menu_set *)
let open_menu name payload =
  if name = "contextmenu" then
    Option.iter
      (fun p ->
        Runtime.send
          (Action.Page_menu_set
             (Some
                ( Platform.payload_num p "clientX"
                , Platform.payload_num p "clientY" )));
        Runtime.flush ())
      payload

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
                [ dom ~key:"pt-title" ~tag:"span"
                    ~style_class:"block-title-wrap" ~text:page.page_title []
                ]
            ]
        ]
    ]

let page_title_el (m : Model.t) (page : Model.page) : t =
  let uuid = Option.value page.page_uuid ~default:"" in
  let icon =
    if page.page_is_tag then
      [ dom ~key:"pt-icon" ~style_class:"ls-page-icon flex self-start"
          [ dom ~key:"pt-ic" ~tag:"i" ~style_class:"ti ti-hash" [] ]
      ]
    else []
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
              ; ("haschild", "false"); ("data-comment-item", "false")
              ; ("data-comments-area", "false"); ("level", "0")
              ; ("data-collapsed", "false")
              ; ("data-db-collapsable", "false")
              ; ("data-block-format", "markdown") ]
            [ dom ~key:"pt-row"
                ~style_class:
                  "block-main-container flex flex-row gap-1 is-page-title-row"
                ~attrs:[ ("style", "margin-left: -30px") ]
                [ dom ~key:"pt-ctrl"
                    ~style_class:
                      "is-with-icon bullet-hidden block-control-wrap flex \
                       flex-row items-center h-6"
                    ~attrs:[ ("data-has-children", "false") ]
                    [ dom ~key:"pt-ca" ~tag:"a"
                        ~style_class:"block-control"
                        ~id:("control-" ^ uuid)
                        [ dom ~key:"pt-cs" ~tag:"span"
                            ~style_class:"control-hide"
                            [ dom ~key:"pt-ra" ~tag:"span"
                                ~style_class:"rotating-arrow not-collapsed"
                                [ rotating_arrow "pt-arw" ]
                            ]
                        ]
                    ]
                ; dom ~key:"pt-col1" ~style_class:"flex flex-col w-full"
                    [ dom ~key:"pt-col2" ~style_class:"flex flex-col w-full"
                        [ dom ~key:"pt-bmc"
                            ~style_class:
                              "block-main-content flex flex-row gap-2"
                            [ dom ~key:"pt-col3"
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
    ~events:"contextmenu" ~on_dom_event:open_menu (icon @ body)

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
  dom ~key:"page-blocks" ~style_class:"ls-page-blocks"
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

let ref_group (name, blocks) : t =
  dom ~key:("rg-" ^ name) ~style_class:"my-2 references-blocks-item"
    [ dom ~key:("rgp-" ^ name) ~style_class:"with-foldable-page"
        [ dom ~key:("rgl-" ^ name) ~tag:"a" ~style_class:"page-ref"
            ~attrs:[ ("href", "#/page/" ^ name) ] ~text:name [] ]
    ; dom ~key:("rgb-" ^ name) ~style_class:"blocks-container"
        (List.map Tree.block_row blocks)
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

let references_view (refs : Model.block list) : t =
  match refs with
  | [] -> box ~key:"refs-empty" []
  | _ ->
      dom ~key:"refs" ~style_class:"references references-wrap"
        [ dom ~key:"refs-body" ~style_class:"ls-view-body"
            [ dom ~key:"refs-groups"
                ~style_class:"flex flex-col references-blocks-wrap"
                (List.map ref_group (refs_grouped refs))
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
          if name = "input" then
            Runtime.send
              (Action.Unlinked_set_query
                 (Platform.payload_str
                    (Option.value payload ~default:"{}") "value")))
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

let unlinked_references_view (m : Model.t) : t =
  match m.unlinked_refs with
  | [] -> box ~key:"urefs-empty" []
  | refs ->
  let rows =
    let q = String.trim m.unlinked_query in
    let filtered =
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
    List.map unlinked_row filtered
  in
  let body =
    dom ~key:"urefs-content" ~style_class:"ls-foldable-content"
      ~attrs:
        [ ( "aria-hidden"
          , if m.unlinked_open then "false" else "true" )
        ]
      [ dom ~key:"urefs-body" ~style_class:"ls-view-body" rows ]
  in
  dom ~key:"urefs" ~style_class:"unlinked-references mt-6"
    [ dom ~key:"urefs-fold" ~style_class:"ls-foldable-title-control"
        [ dom ~key:"urefs-t" ~style_class:"foldable-title"
            ~text:Strings.unlinked_references
            ~events:"click"
            ~on_dom_event:(fun name _ ->
              if name = "click" then (
                Runtime.send Action.Unlinked_toggle_open;
                Runtime.flush ()))
            []
        ; dom ~key:"urefs-search" ~tag:"button"
            ~style_class:"view-action-search"
            ~events:"click"
            ~on_dom_event:(fun name _ ->
              if name = "click" then (
                Runtime.send Action.Unlinked_toggle_search;
                Runtime.flush ()))
            [ dom ~key:"urefs-icon" ~tag:"i"
                ~style_class:"ls-icon-search ti ti-search" [] ]
        ]
    ; if m.unlinked_search then unlinked_search_input () else box ~key:"urefs-sb" []
    ; body
    ]

(* --- route views -------------------------------------------------- *)

let journal_item ?(last = false) (m : Model.t) (p : Model.page) : t =
  let key = Option.value p.page_uuid ~default:p.page_title in
  (* cljs journal-item > page-inner: .cp__page-inner-wrap.is-journals
     containing the same editable db-page-title row as a page; the last
     item drops its separator border via .journal-last-item *)
  dom ~key:("ji-" ^ key)
    ~style_class:
      ("journal-item content relative" ^ if last then " journal-last-item" else "")
    [ dom ~key:("jiw-" ^ key)
        ~style_class:"flex-1 page relative cp__page-inner-wrap is-journals"
        [ dom ~key:("jip-" ^ key)
            ~style_class:"relative grid gap-4 sm:gap-8 page-inner mb-16"
            [ dom ~key:("jit-" ^ key) ~style_class:"flex flex-row space-between"
                [ page_title_el m p ]
            ; blocks_inner ?puuid:p.page_uuid p.page_blocks
            ; journal_references_view p
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

let is_today_page (m : Model.t) (page : Model.page) : bool =
  match page.page_journal_day with
  | Some d -> d = Dates.today_journal_day () && m.route <> Model.Home
  | None -> false

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

(* cljs page-inner: data-page-tags="[\"a\", \"b\"]" on the wrap *)
let page_wrap_attrs (page : Model.page) : (string * string) list =
  match page.page_tags with
  | [] -> []
  | tags ->
      [ ( "data-page-tags"
        , "[" ^ String.concat ", " (List.map (fun t -> "\"" ^ t ^ "\"") tags)
          ^ "]" ) ]

let page_view (m : Model.t) (page : Model.page) : t =
  let cls =
    "flex-1 page relative cp__page-inner-wrap"
    ^ (if page.page_journal_day <> None then " is-journals" else "")
    ^ (if is_today_page m page then " is-today-page" else "")
    ^ (if page.page_is_tag then " is-node-page" else "")
  in
  dom ~key:"page" ~style_class:cls
      ~attrs:(page_wrap_attrs page)
    [ dom ~key:"page-inner"
        ~style_class:"relative grid gap-4 sm:gap-8 page-inner mb-16"
        [ dom ~key:"page-title-row" ~style_class:"flex flex-row space-between"
            [ page_title_el m page ]
        ; (if page.page_is_library then library_add_pages_button
           else dom ~key:"lib-add-off" [])
        ; blocks_inner ?puuid:page.page_uuid ~virtualize:true
            page.page_blocks
        ; references_view m.page_refs
        ; unlinked_references_view m
        ]
    ; Page_menu.dialog_view m
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
    ^ (if page.page_is_tag then " is-node-page" else "")
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
        ; references_view m.page_refs
        ; unlinked_references_view m
        ]
    ; Page_menu.dialog_view m
    ]

let page_view_of_model (m : Model.t) : t =
  match m.phase, m.route with
  | Model.Ready, Model.Journals -> journals_view m m.journals
  | Model.Ready, Model.Library -> (
      match m.route_page with
      | Some p -> library_view m p
      | None -> empty_state ())
  | Model.Ready, Model.Not_found n -> not_found_view n
  | Model.Ready, Model.Graph -> Graph_view.view m
  | Model.Ready, (Model.All_graphs | Model.All_pages) ->
      box ~key:"graphs-view" [] (* graphs area renders via its own view *)
  | Model.Ready, _ -> (
      match m.route_page with
      | Some page -> page_view m page
      | None -> empty_state ())
  | _ -> empty_state ()
