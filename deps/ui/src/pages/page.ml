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
  let tag_els =
    match page.Model.page_tags with
    | [] -> []
    | tags ->
        [ dom ~key:"pt-tags" ~style_class:"block-tags gap-1"
            (List.mapi
               (fun i tag ->
                 dom ~key:("pt-tag-" ^ string_of_int i)
                   ~style_class:"block-tag"
                   [ dom ~key:("pt-ta-" ^ string_of_int i) ~tag:"a"
                       ~style_class:"tag" ~text:tag []
                   ])
               tags)
        ]
  in
  let body =
    (* cljs wraps the title in block-container -> .ls-block; tags render
       while editing too (sibling of the content wrapper) *)
    [ box ~key:"pt-inner" ~style_class:"w-full relative"
        [ dom ~key:"pt-block" ~style_class:"ls-block"
            ((if m.editing_title then [ title_editor page ]
              else
                [ dom ~key:"pt-title" ~style_class:"block-title-wrap"
                    ~attrs:[ ("id", "page-title-text") ]
                    ~text:page.page_title []
                ])
            @ tag_els)
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
    (icon @ body)

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

(* --- references --------------------------------------------------- *)

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
        ; blocks_inner ?puuid:p.page_uuid p.page_blocks
        ]
    ]

let journals_view (js : Model.page list) : t =
  let items = Array.of_list js in
  dom ~key:"journals" ~id:"journals" ~style_class:"cp__journals"
    (match js with
     | [] -> [ dom ~key:"jp" ~style_class:"journal-item-placeholder" [] ]
     | _ ->
         if Virt_list.force_virtualized () then
           [ Virt_list.list
               ~list_attrs:[ ("data-virtuoso-scroller", "true") ]
               ~estimate_size:(fun _ -> 640.)
               ~key_of:(fun (p : Model.page) ->
                 Option.value p.page_uuid ~default:p.page_title)
               ~render:journal_item items ]
         else List.map journal_item js)

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

let page_view_of_model (m : Model.t) : t =
  match m.phase, m.route with
  | Model.Ready, Model.Journals -> journals_view m.journals
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
