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
    (match page.page_uuid with
     | Some u -> ignore (Page_ops.rename u value)
     | None -> ());
    Runtime.send Action.Title_edit_done;
    Runtime.flush ()
  in
  (* e2e: exactly one .editor-wrapper textarea while renaming *)
  dom ~key:"pt-edit" ~style_class:"editor-wrapper"
    [ dom ~key:"pt-ta" ~tag:"textarea"
        ~style_class:"block-title-wrap"
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
    ]

let page_title_el (m : Model.t) (page : Model.page) : t =
  let icon =
    if page.page_is_tag then
      [ dom ~key:"pt-icon" ~style_class:"ls-page-icon flex self-start"
          [ dom ~key:"pt-ic" ~tag:"i" ~style_class:"ti ti-hash" [] ]
      ]
    else []
  in
  let body =
    if m.editing_title then [ title_editor page ]
    else
      [ box ~key:"pt-inner" ~style_class:"w-full relative"
          [ dom ~key:"pt-title" ~style_class:"block-title-wrap"
              ~attrs:[ ("id", "page-title-text") ]
              ~text:page.page_title []
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
          if page.page_uuid <> None then (
            Runtime.send Action.Title_edit_start;
            Runtime.flush ())
      | _ -> open_menu name payload)
    (icon @ body)

let blocks_inner (blocks : Model.block list) : t =
  dom ~key:"page-blocks" ~style_class:"ls-page-blocks"
    [ dom ~key:"page-blocks-inner" ~style_class:"page-blocks-inner relative"
        (List.map Tree.block_row blocks)
    ]

(* --- references --------------------------------------------------- *)

let references_view (refs : Model.block list) : t =
  match refs with
  | [] -> box ~key:"refs-empty" []
  | _ ->
      dom ~key:"refs" ~style_class:"references references-wrap"
        [ dom ~key:"refs-body" ~style_class:"ls-view-body"
            (List.map Tree.block_row refs)
        ]

let unlinked_references_view () : t =
  (* section header always rendered; body populated by the views area *)
  dom ~key:"urefs" ~style_class:"unlinked-references mt-6"
    [ dom ~key:"urefs-fold" ~style_class:"ls-foldable-title-control"
        [ dom ~key:"urefs-t" ~style_class:"foldable-title" ~text:"Unlinked References" []
        ; dom ~key:"urefs-search" ~tag:"button"
            ~style_class:"view-action-search"
            [ dom ~key:"urefs-icon" ~tag:"i" ~style_class:"ls-icon-search" [] ]
        ]
    ]

(* --- route views -------------------------------------------------- *)

let journal_item (p : Model.page) : t =
  let key = Option.value p.page_uuid ~default:p.page_title in
  dom ~key:("ji-" ^ key) ~style_class:"journal-item"
    [ dom ~key:("jiw-" ^ key) ~style_class:"cp__page-inner-wrap"
        [ dom ~key:("jit-" ^ key) ~style_class:"ls-page-title title"
            [ dom ~key:("jitt-" ^ key) ~tag:"a"
                ~style_class:"block-title-wrap"
                ~attrs:[ ("href", "#/page/" ^ key) ]
                ~text:p.page_title []
            ]
        ; blocks_inner p.page_blocks
        ]
    ]

let journals_view (js : Model.page list) : t =
  dom ~key:"journals" ~id:"journals" ~style_class:"cp__journals"
    (match js with
     | [] -> [ dom ~key:"jp" ~style_class:"journal-item-placeholder" [] ]
     | _ -> List.map journal_item js)

let library_view (m : Model.t) (page : Model.page) : t =
  (* child pages render title rows only, no block bodies *)
  dom ~key:"library" ~style_class:"page"
    [ page_title_el m page
    ; dom ~key:"lib-blocks" ~style_class:"ls-page-blocks"
        [ dom ~key:"lib-inner" ~style_class:"page-blocks-inner relative"
            (List.map
               (fun (b : Model.block) ->
                 dom ~key:("lib-" ^ Option.value b.block_uuid ~default:"")
                   ~style_class:"block-title-wrap"
                   ~text:b.block_title [])
               page.page_blocks)
        ]
    ]

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

let page_view (m : Model.t) (page : Model.page) : t =
  let cls =
    "flex-1 page relative cp__page-inner-wrap"
    ^ (if page.page_journal_day <> None then " is-journals" else "")
    ^ (if is_today_page m page then " is-today-page" else "")
  in
  dom ~key:"page" ~style_class:cls
    [ dom ~key:"page-inner"
        ~style_class:"relative grid gap-4 sm:gap-8 page-inner mb-16"
        [ breadcrumbs page.page_title
        ; page_title_el m page
        ; blocks_inner page.page_blocks
        ; references_view m.page_refs
        ; unlinked_references_view ()
        ]
    ; Page_menu.dialog_view m
    ]

let empty_state () : t =
  box ~key:"empty" ~style_class:"page"
    [ box ~key:"empty-inner" ~style_class:"flex flex-col items-center"
        [ text ~key:"empty-t" ~value:Strings.loading ~style_class:"" [] ]
    ]

let page_view_of_model (m : Model.t) : t =
  match m.phase, m.route with
  | Model.Ready, Model.Journals -> journals_view m.journals
  | Model.Ready, Model.Library -> (
      match m.route_page with
      | Some p -> library_view m p
      | None -> empty_state ())
  | Model.Ready, Model.Not_found n -> not_found_view n
  | Model.Ready, (Model.All_graphs | Model.All_pages) ->
      box ~key:"graphs-view" [] (* graphs area renders via its own view *)
  | Model.Ready, _ -> (
      match m.route_page with
      | Some page -> page_view m page
      | None -> empty_state ())
  | _ -> empty_state ()
