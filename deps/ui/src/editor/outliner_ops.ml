(* Wire encoding for thread-api/apply-outliner-ops plus the post-op page
   refresh: re-invoke get-page-blocks-tree, sync the collapsed set from the
   raw wire (Decode drops block/collapsed?), and republish the page via
   Runtime.send (Page_loaded ...). *)

module S = Editor_state

let kw k v = (Wire.Keyword k, v)
let str k v = (Wire.String k, v)

(* cljs page-name-sanity-lc, cheap half: boundary slashes off + lowercase.
   The worker recomputes the full sanity on save (outliner_core page_
   branch), so this only needs to be close enough to key the insert. *)
let page_name_sanity_lc (s : string) : string =
  let s = String.trim s in
  let n = String.length s in
  let i = ref 0 in
  while !i < n && String.unsafe_get s !i = '/' do
    incr i
  done;
  let j = ref (n - 1) in
  while !j >= !i && String.unsafe_get s !j = '/' do
    decr j
  done;
  (if !j >= !i then String.sub s !i (!j - !i + 1) else "")
  |> String.lowercase_ascii

(* ~page:true page-ifies the new block (cljs outliner-insert-block!
   library branch): tags #{logseq.class/Page} + block/name; the worker's
   insert tx then dissocs block/page so the block lives only under
   block/parent. ?link carries a [:block/link db-id] embed edge. *)
let block_map ?title ?(page = false) ?link uuid =
  Wire.Map
    ([ str "block/uuid" (Wire.Uuid uuid) ]
    @ (match title with
      | Some t ->
          List.map
            (fun (k, v) -> (Wire.String k, v))
            (Block_parse.title_fields t)
      | None -> [])
    @
    (if page then
      [ ( Wire.String "block/tags"
        , Wire.Set [ Wire.Keyword "logseq.class/Page" ] )
      ; ( Wire.String "block/name"
        , Wire.String (page_name_sanity_lc (Option.value title ~default:""))
        )
      ]
    else [])
    @ match link with
      | Some db_id -> [ str "block/link" (Wire.Int db_id) ]
      | None -> [])


(* op entries are [:name [args]] — the args live in a nested seq; the
   worker's op_of_entry only accepts that shape (outliner_op.ml) *)
let op name args = Wire.Array [ Wire.Keyword name; Wire.Array args ]

let uuids_list uuids = Wire.List (List.map (fun u -> Wire.Uuid u) uuids)

(* tx-meta :outliner-op — required for multi-op batches or the worker
   skips undo recording (gen_undo_ops requires local-tx? + outliner-op;
   single-op batches get it auto-derived from the op name) *)
let op_opts name = Wire.Map [ kw "outliner-op" (Wire.Keyword name) ]

(* cljs apply-outliner-ops generates a fresh :ui/perf-id per call; the
   worker requires it before emitting the :db-worker/outliner-op-perf
   console line that e2e counts per op *)
let perf_id () = Wire.Uuid (Platform.random_uuid ())

(* cljs wrap-parse-block: a leading "#"+ whitespace normalizes into
   logseq.property/heading and is stripped from block/title (skipped for
   code/math display types) *)
let markdown_heading_level s =
  let t = String.trim s in
  let n = String.length t in
  let rec hashes i = if i < n && t.[i] = '#' then hashes (i + 1) else i in
  let i = hashes 0 in
  if i >= 1 && i <= 6 && i < n
     && (t.[i] = ' ' || t.[i] = '\t' || t.[i] = '\n')
  then Some i
  else None

let strip_markdown_heading s lvl =
  String.trim (String.sub (String.trim s) lvl (String.length (String.trim s) - lvl))

(* The block map sent in a save-block op — shared by editor saves and
   sdk updateBlock. *)
let saved_block_map uuid title =
  let dt =
    match S.find uuid with
    | Some b -> b.Model.block_display_type
    | None -> None
  in
  let fields t =
    match dt with
    | Some _ -> [ str "block/title" (Wire.String t) ]
    | None ->
        List.map
          (fun (k, v) -> (Wire.String k, v))
          (Block_parse.title_fields t)
  in
  match markdown_heading_level title with
  | Some lvl when dt <> Some "code" && dt <> Some "math" ->
      Wire.Map
        ([ str "block/uuid" (Wire.Uuid uuid) ]
        @ fields (strip_markdown_heading title lvl)
        @ [ str "logseq.property/heading" (Wire.Int lvl) ])
  | _ ->
      Wire.Map
        ([ str "block/uuid" (Wire.Uuid uuid) ] @ fields (String.trim title))

(* the block/title form saved_block_map persists — commit-title overrides
   paint this so the post-edit DOM already shows the normalized text
   (markdown heading stripped) instead of the raw buffer *)
let normalized_title uuid title =
  let dt =
    match S.find uuid with
    | Some b -> b.Model.block_display_type
    | None -> None
  in
  match markdown_heading_level title with
  | Some lvl when dt <> Some "code" && dt <> Some "math" ->
      strip_markdown_heading title lvl
  | _ -> String.trim title

(* cljs save-block-aux! trims the value before persisting *)
let save_block uuid title =
  (* cljs save-block-aux! runs wrap-parse-block: title -> parsed
     refs/tags + id-ref rewrite *)
  op "save-block" [ saved_block_map uuid title; Wire.Map [] ]

let insert_blocks ?(replace_empty_target = false) blocks target_uuid
    ~sibling =
  op "insert-blocks"
    [ Wire.List blocks
    ; Wire.Uuid target_uuid
    ; Wire.Map
        ([ kw "sibling?" (Wire.Bool sibling)
         ; kw "keep-uuid?" (Wire.Bool true)
         ; kw "outliner-op" (Wire.Keyword "insert-blocks")
         ]
        @ if replace_empty_target then
            [ kw "replace-empty-target?" (Wire.Bool true) ]
          else [])
    ]

let delete_blocks uuids =
  op "delete-blocks" [ uuids_list uuids; Wire.Map [] ]

(* flatten block trees for paste: flat preorder map list where each child
   carries block/parent as a [:block/uuid u] lookup-ref — same shape as
   sdk_write.flatten_batch; blocks_with_level re-derives levels *)
let paste_block_maps (trees : Model.block list) =
  let rec go acc ~level ~parent (b : Model.block) =
    match b.Model.block_uuid with
    | None -> acc
    | Some u ->
        let parent_kv =
          match parent with
          | Some pu ->
              [ str "block/parent"
                  (Wire.Array [ Wire.Keyword "block/uuid"; Wire.Uuid pu ]) ]
          | None -> []
        in
        let m =
          Wire.Map
            (str "block/uuid" (Wire.Uuid u)
             :: List.map
                  (fun (k, v) -> (Wire.String k, v))
                  (Block_parse.title_fields (String.trim b.Model.block_title))
            @ [ str "block/level" (Wire.Int level) ]
            @ parent_kv)
        in
        let acc = m :: acc in
        List.fold_left
          (fun a c -> go a ~level:(level + 1) ~parent:(Some u) c)
          acc b.Model.block_children
  in
  List.rev (List.fold_left (fun a b -> go a ~level:1 ~parent:None b) [] trees)

let paste_trees trees target_uuid ~replace_empty =
  op "insert-blocks"
    [ Wire.Array (paste_block_maps trees)
    ; Wire.Uuid target_uuid
    ; Wire.Map
        [ kw "sibling?" (Wire.Bool true)
        ; kw "keep-uuid?" (Wire.Bool true)
        ; kw "replace-empty-target?" (Wire.Bool replace_empty)
        ; kw "outliner-op" (Wire.Keyword "paste")
        ]
    ]

let move_blocks uuids target_uuid ~sibling =
  op "move-blocks"
    [ uuids_list uuids
    ; Wire.Uuid target_uuid
    ; Wire.Map [ kw "sibling?" (Wire.Bool sibling) ]
    ]

(* cljs :bottom? — append as last children of target *)
let move_blocks_bottom uuids target_uuid =
  op "move-blocks"
    [ uuids_list uuids
    ; Wire.Uuid target_uuid
    ; Wire.Map
        [ kw "sibling?" (Wire.Bool false); kw "bottom?" (Wire.Bool true) ]
    ]

(* move to the top of target's children — cljs :top? *)
let move_blocks_top uuids target_uuid =
  op "move-blocks"
    [ uuids_list uuids
    ; Wire.Uuid target_uuid
    ; Wire.Map
        [ kw "sibling?" (Wire.Bool false); kw "top?" (Wire.Bool true) ]
    ]

let move_up_down uuids up =
  op "move-blocks-up-down" [ uuids_list uuids; Wire.Bool up ]

let indent_outdent ?parent_original uuids indent =
  (* cljs indent-outdent-blocks! passes :parent-original = the embed block
     when the moved block is rendered inside a page embed — outdent then
     targets the linking block, not the embedded child's data parent *)
  let opts =
    match parent_original with
    | Some u ->
        Wire.Map
          [ kw "parent-original"
              (Wire.Map [ kw "block/uuid" (Wire.Uuid u) ]) ]
    | None -> Wire.Map []
  in
  op "indent-outdent-blocks" [ uuids_list uuids; Wire.Bool indent; opts ]

let collapse_expand pairs =
  op "collapse-expand-blocks"
    [ Wire.List
        (List.map
           (fun (u, collapsed) ->
             match block_map u with
             | Wire.Map kvs ->
                 Wire.Map (kvs @ [ str "block/collapsed?" (Wire.Bool collapsed) ])
             | _ -> Wire.Map [])
           pairs)
    ; Wire.Map []
    ]

let create_page title =
  op "create-page" [ Wire.String title; Wire.Map [] ]

let create_class title =
  op "create-page"
    [ Wire.String title; Wire.Map [ kw "class?" (Wire.Bool true) ] ]

let set_block_property uuid prop v =
  op "set-block-property" [ Wire.Uuid uuid; Wire.Keyword prop; v ]

(* cljs batch-set-property! — {:entity-id? true} means v is already a
   resolved db/id and skips ref-value conversion *)
let batch_set_property uuids prop v ~entity_id =
  op "batch-set-property"
    [ uuids_list uuids
    ; Wire.Keyword prop
    ; v
    ; Wire.Map [ kw "entity-id?" (Wire.Bool entity_id) ]
    ]

let remove_block_property uuid prop =
  op "remove-block-property" [ Wire.Uuid uuid; Wire.Keyword prop ]

(* cljs insert-template! passes replace-empty-target? so a blank target
   block is reused instead of left empty *)
let apply_template template_uuid target_uuid =
  op "apply-template"
    [ Wire.Uuid template_uuid
    ; Wire.Uuid target_uuid
    ; Wire.Map [ kw "replace-empty-target?" (Wire.Bool true) ]
    ]

(* mirror :block/collapsed? from the raw wire into editor state — the
   decoded Model.block drops it *)
let rec collect_collapsed set (w : Wire.t) =
  match w with
  | Wire.Array xs | Wire.List xs ->
      List.fold_left collect_collapsed set xs
  | _ -> (
      let set =
        match
          (Wire.map_get_uuid w "block/uuid", Wire.get w "block/collapsed?")
        with
        | Some u, Some (Wire.Bool true) -> S.String_set.add u set
        | _ -> set
      in
      match Wire.get w "block/children" with
      | Some children -> collect_collapsed set children
      | None -> set)

let set_collapsed set =
  let apply st = { st with S.collapsed = set } in
  (* on an empty page the first op's refresh runs before any block_row has
     mounted the editor state — defer the sync until ensure *)
  if S.ready () then S.set_silent apply
  else S.defer_init apply

(* Fetch the linked entity's blocks for every :block/link (embed) block in
   a decoded tree and attach them as block_embed_children. Recurses into
   fetched trees; [ancestors] is the chain of linked db ids guarding
   self-embed loops, [collapsed] accumulates :block/collapsed? flags from
   the embed wires (Decode drops the flag). *)
let rec fill_embed_children repo ancestors collapsed
    (blocks : Model.block list) : Model.block list Js.Promise.t =
  let rec go acc = function
    | [] -> Js.Promise.resolve (List.rev acc)
    | (b : Model.block) :: rest -> (
        let children_p =
          fill_embed_children repo ancestors collapsed
            b.Model.block_children
        in
        let embed_p =
          match b.Model.block_link with
          | Some link_id when not (List.mem link_id ancestors) ->
              Runtime.invoke3 "thread-api/get-page-blocks-tree"
                (Wire.String repo) (Wire.Int link_id) Wire.Nil
              |> Js.Promise.then_ (fun w ->
                     collapsed := collect_collapsed !collapsed w;
                     fill_embed_children repo (link_id :: ancestors)
                       collapsed (Decode.blocks_of_wire w))
              |> Js.Promise.catch (fun _ -> Js.Promise.resolve [])
          | _ -> Js.Promise.resolve []
        in
        children_p
        |> Js.Promise.then_ (fun children ->
               embed_p
               |> Js.Promise.then_ (fun embed_children ->
                      go
                        ({ b with
                           Model.block_children = children
                         ; block_embed_children = embed_children
                         }
                        :: acc)
                        rest)))
  in
  go [] blocks

let ancestors_of (page : Model.page) =
  match page.Model.page_db_id with Some id -> [ id ] | None -> []

(* block/tags arrives as {:db/id} stubs — cljs resolves tag entities live
   off datascript; we batch-resolve title/ident/hidden via get-blocks and
   rewrite the model before rendering. Internal classes (Page, Property,
   …) and hidden tags never render as .block-tag chips, matching
   db-class/internal-tags + block.cljs tags-cp. *)
let internal_tag_ident (ident : string) : bool =
  List.mem ident
    [ "logseq.class/Page"; "logseq.class/Property"; "logseq.class/Tag";
      "logseq.class/Root"; "logseq.class/Asset" ]

let rec collect_tag_ids acc (b : Model.block) =
  List.fold_left collect_tag_ids (List.rev_append b.Model.block_tag_ids acc)
    b.block_children

(* cljs block.cljs also hides a tag on a node when its entity carries
   :logseq.property.class/hide-from-node (Quote-block, Code-block,
   Math-block, ...). The worker's own hidden? flag is the primary signal —
   the property is the fallback. *)
let tag_hidden blk =
  Option.bind (Wire.get blk "block/hidden?") Wire.as_bool = Some true
  || Option.bind (Wire.get blk "hidden?") Wire.as_bool = Some true
  ||
  match Wire.get blk "logseq.property.class/hide-from-node" with
  | Some (Wire.Bool hidden) -> hidden
  | _ -> false

(* (db-id, (title, ident, hidden, uuid)) per tag entity *)
let tag_titles repo ids : (int * (string * string * bool * string)) list Js.Promise.t =
  Runtime.invoke2 "thread-api/get-blocks" (Wire.String repo)
    (Wire.Array
       (List.map
          (fun i ->
            Wire.Map
              [ (Wire.String "id", Wire.Int i)
              ; ( Wire.String "opts"
                , Wire.Map
                    [ ( Wire.String "properties"
                      , Wire.Array
                          [ Wire.Keyword "db/ident"
                          ; Wire.Keyword
                              "logseq.property.class/hide-from-node" ])
                    ]) ])
          ids))
  |> Js.Promise.then_ (fun w ->
         Js.Promise.resolve
           (List.filter_map
              (fun pair ->
                let blk =
                  match Wire.get pair "block" with
                  | Some b -> b
                  | None -> (
                      match Sdk_util.wire_elems pair with
                      | [ _; b ] -> b
                      | _ -> Wire.Nil)
                in
                match
                  ( Wire.map_get_int blk "db/id"
                  , Wire.map_get_string blk "block/title" )
                with
                | Some id, Some t ->
                    Some
                      ( id
                      , ( t
                        , (match Wire.get blk "db/ident" with
                           | Some (Wire.Keyword s) | Some (Wire.String s) ->
                               s
                           | _ -> "")
                        , tag_hidden blk
                        , Option.value (Wire.map_get_uuid blk "block/uuid")
                            ~default:"" ) )
                | _ -> None)
              (Sdk_util.wire_elems w)))

let resolve_block_tags (blocks : Model.block list) : Model.block list Js.Promise.t =
  let ids =
    List.sort_uniq compare (List.fold_left collect_tag_ids [] blocks)
  in
  match ids with
  | [] -> Js.Promise.resolve blocks
  | _ -> (
      match !Runtime.current_repo with
      | None -> Js.Promise.resolve blocks
      | Some repo ->
          tag_titles repo ids
          |> Js.Promise.then_ (fun titles ->

                 let rec fill (b : Model.block) =
                   let resolved =
                     List.filter_map
                       (fun i -> List.assoc_opt i titles)
                       b.Model.block_tag_ids
                   in
                   let idents = List.map (fun (_, i, _, _) -> i) resolved in
                   let visible =
                     List.filter
                       (fun (_, ident, hidden, _uuid) ->
                         not hidden && not (internal_tag_ident ident))
                       resolved
                   in
                   { b with
                     Model.block_tags =
                       List.map (fun (t, _, _, _) -> t) visible
                   ; block_tag_uuids =
                       List.map (fun (_, _, _, u) -> u) visible
                   ; (* block_tag_idents stays unfiltered: internal
                        classes (Page, Comments, Query, …) drive the
                        node icon and structural checks even though
                        they never render as chips *)
                     block_tag_idents = idents
                   ; block_is_comments_area =
                       List.mem "logseq.class/Comments" idents
                   ; block_is_comment =
                       List.mem "logseq.class/Comment" idents
                   ; block_children = List.map fill b.block_children
                   }
                 in
                 Js.Promise.resolve (List.map fill blocks)))

(* the page entity's own block/tags -> resolved titles (page-title chips) *)
let resolve_page_tags repo (page : Model.page) : Model.page Js.Promise.t =
  Runtime.invoke2 "thread-api/get-case-page" (Wire.String repo)
    (Wire.String page.Model.page_title)
  |> Js.Promise.then_ (fun w ->
         (* get-case-page encodes multi-ref values as a plain set of
            entity ids (unlike the {:db/id} stubs in entity maps) *)
         let ids =
           match Wire.get w "block/tags" with
           | Some (Wire.List xs) | Some (Wire.Array xs) | Some (Wire.Set xs) ->
               List.filter_map
                 (fun t ->
                   match t with
                   | Wire.Int _ | Wire.Int64 _ -> Wire.as_int t
                   | Wire.Tagged (_, inner) -> Wire.map_get_int inner "db/id"
                   | w -> Wire.map_get_int w "db/id")
                 xs
           | _ -> []
         in
         match ids with
         | [] -> Js.Promise.resolve page
         | _ ->
             tag_titles repo ids
             |> Js.Promise.then_ (fun titles ->
                    (* the built-in Page class is implicit on every page —
                       cljs never renders it as a chip *)
                    Js.Promise.resolve
                      { page with
                        Model.page_tags =
                          List.filter_map
                            (fun (i, (t, ident, _hidden, _uuid)) ->
                              if List.mem i ids
                                 && ident <> "logseq.class/Page"
                              then Some t
                              else None)
                            titles
                      ; page_tag_idents =
                          List.filter_map
                            (fun (i, (_t, ident, _hidden, _uuid)) ->
                              if List.mem i ids
                                 && ident <> "logseq.class/Page"
                              then Some ident
                              else None)
                            titles
                      ; page_internal =
                          List.exists
                            (fun (i, (_, ident, _hidden, _uuid)) ->
                              List.mem i ids
                              && ident = "logseq.class/Page")
                            titles
                      }))

(* block zoom: the route root is a block, not a page — refetch it via
   get-blocks (get-page-blocks-tree would return its children or nothing).
   Returns the raw wire list like get-page-blocks-tree. *)
let fetch_zoom_blocks repo uuid : Wire.t Js.Promise.t =
  Runtime.invoke2 "thread-api/get-blocks" (Wire.String repo)
    (Wire.Array
       [ Wire.Map
           [ (Wire.String "id", Wire.Uuid uuid)
           ; ( Wire.String "opts"
             , Wire.Map
                 [ (Wire.Keyword "children?", Wire.Bool true)
                 ; (* a container's root always renders its children,
                      even when collapsed in the page — fetch them *)
                   ( Wire.Keyword "include-collapsed-children?"
                   , Wire.Bool true )
                 ] )
           ]
       ])
  |> Js.Promise.then_ (fun w ->
         match Sdk_util.wire_elems w with
         | [ pair ] -> (
             let blk =
               (* the pair's flat `children` carry the full maps; splice
                  them into block/children before decoding *)
               match Decode.nest_get_blocks pair with
               | Some w -> w
               | None -> (
                   match Wire.get pair "block" with
                   | Some b -> b
                   | None -> (
                       match Sdk_util.wire_elems pair with
                       | [ _; b ] -> b
                       | _ -> Wire.Nil))
             in
             (match blk with
              | Wire.Map _ -> Js.Promise.resolve (Wire.List [ blk ])
              | _ -> Js.Promise.resolve (Wire.List [])))
         | _ -> Js.Promise.resolve (Wire.List []))

(* refetch unlinked refs for the current page — a block-title edit can
   create or remove a text mention *)
let fetch_unlinked_refs (p : Model.page) =
  match !Runtime.current_repo, p.Model.page_db_id with
  | Some repo, Some id ->
      ignore
        (Runtime.invoke2 "thread-api/get-unlinked-refs" (Wire.String repo)
           (Wire.Int id)
         |> Js.Promise.then_ (fun w ->
                Js.Promise.resolve
                  (Runtime.send
                     (Action.Unlinked_loaded (Decode.blocks_of_wire w)))))
  | _ -> ()

let refresh_page () : unit Js.Promise.t =
  let route_at_start = !Runtime.current_route in
  match (!Runtime.current_repo, !Runtime.current_page) with
  | Some repo, Some page -> (
      incr Runtime.load_gen;
      fetch_unlinked_refs page;
      let blocks_p =
        match !Runtime.current_route, page.Model.page_uuid with
        | Some (Model.Block_zoom _), Some u -> fetch_zoom_blocks repo u
        | _ -> (
            let ref_v =
              (* Ldb.get_page accepts Uuid/String/Int64 only — a
                 [:block/uuid u] lookup-ref vector decodes to Vector and
                 returns no page *)
              match page.Model.page_uuid with
              | Some u -> Wire.Uuid u
              | None -> Wire.String page.Model.page_title
            in
            Runtime.invoke3 "thread-api/get-page-blocks-tree"
              (Wire.String repo) ref_v Wire.Nil)
      in
      blocks_p
      |> Js.Promise.then_ (fun blocks_w ->
             let collapsed = ref S.String_set.empty in
             collapsed := collect_collapsed !collapsed blocks_w;
             fill_embed_children repo (ancestors_of page) collapsed
               (Decode.blocks_of_wire blocks_w)
             |> Js.Promise.then_ (fun blocks ->
                    let blocks =
                      Decode.view_blocks ~library:page.Model.page_is_library
                        blocks
                    in
                    Js.Promise.resolve blocks)
             |> Js.Promise.then_ (fun blocks ->
                    set_collapsed !collapsed;
                    resolve_block_tags blocks
                    |> Js.Promise.then_ (fun blocks ->
                           let page =
                             { page with Model.page_blocks = blocks }
                           in
                           (match !Runtime.current_route with
                            | Some (Model.Block_zoom _) ->
                                Js.Promise.resolve page
                            | _ -> resolve_page_tags repo page)
                           |> Js.Promise.then_ (fun page ->
                                  (* the worker's tree is authoritative
                                     again — drop committed-buffer title
                                     overrides *)
                                  S.clear_overrides ();
                                  (* the user may have navigated while the
                                     refetch was in-flight — never
                                     overwrite the new route's page *)
                                  if !Runtime.current_route = route_at_start
                                  then
                                    Runtime.send
                                      (Action.Page_loaded page);
                                  Js.Promise.resolve ())))))
  | Some _, None ->
      (* journals / other non-page views reload through the router hook *)
      !Runtime.reload_current_view ()
  | _ -> Js.Promise.resolve ()

(* debounced save-block for in-flight typing: cljs persists the editing
   buffer to the db on a debounce so reads (API calls, undo) see it even
   while the editor stays open *)
let save_timer = ref 0
let pending_save : (string * string) option ref = ref None

let cancel_pending_save () =
  Editor_dom.clear_timeout !save_timer;
  pending_save := None

let rec apply ?(opts = Wire.Map []) ops : unit Js.Promise.t =
  (* cljs saves the editing buffer on keydown before structure ops —
     flush the queued keystroke save instead of dropping it, so ops like
     indent/move don't lose text typed within the debounce window *)
  match !pending_save with
  | Some (uuid, title) ->
      pending_save := None;
      apply [ save_block uuid title ]
      |> Js.Promise.then_ (fun () -> apply ~opts ops)
  | None -> (
      Editor_dom.clear_timeout !save_timer;
      match !Runtime.current_repo with
      | None -> Js.Promise.resolve ()
      | Some repo ->
          let opts =
            match opts with
            | Wire.Map kvs ->
                Wire.Map (kvs @ [ kw "ui/perf-id" (perf_id ()) ])
            | _ -> opts
          in
          Runtime.invoke3 "thread-api/apply-outliner-ops" (Wire.String repo)
            (Wire.Array ops) opts
          |> Js.Promise.then_ (fun _ -> Js.Promise.resolve ())
          |> Js.Promise.catch (fun e ->
                 Platform.console_error
                   ( "apply-outliner-ops failed"
                   , String.concat ","
                       (List.map
                          (fun o ->
                            match o with
                            | Wire.Array
                                (Wire.Array (Wire.Keyword name :: _) :: _)
                            | Wire.List
                                (Wire.Array (Wire.Keyword name :: _) :: _)
                            | Wire.Array (Wire.Keyword name :: _) -> name
                            | _ -> "?")
                          ops)
                   , e );
                 Js.Promise.resolve ()))

let apply_and_refresh ?opts ops =
  apply ?opts ops
  |> Js.Promise.then_ (fun () -> refresh_page ())
  |> Js.Promise.then_ (fun () ->
         (* the quick-add dialog's block list lives outside
            .page-blocks-inner; a page refresh alone won't repaint it *)
         if Dialogs_state.ready () && Dialogs_state.is_open "quick-add" then
           Quick_add_state.reload ();
         Js.Promise.resolve ())

(* cljs wrap-parse-block on save: markdown headings normalize into
   logseq.property/heading, and [[page]]/#tag references resolve into
   block/refs + block/tags with the stored title rewritten to
   [[uuid]] id-ref form — async since Title_refs resolves entities *)
let block_map_parsed ?(page = false) uuid title =
  let dt =
    match S.find uuid with
    | Some b -> b.Model.block_display_type
    | None -> None
  in
  let title, heading =
    match markdown_heading_level title with
    | Some lvl when dt <> Some "code" && dt <> Some "math" ->
        (strip_markdown_heading title lvl, Some lvl)
    | _ -> (String.trim title, None)
  in
  Title_refs.parse title
  |> Js.Promise.then_ (fun p ->
         Js.Promise.resolve
           (Wire.Map
              ([ str "block/uuid" (Wire.Uuid uuid)
               ; str "block/title" (Wire.String p.Title_refs.title) ]
              @ (match heading with
                 | Some lvl -> [ str "logseq.property/heading" (Wire.Int lvl) ]
                 | None -> [])
              @ Title_refs.kvs_of_parsed p
              @
              if page then
                [ ( Wire.String "block/tags"
                  , Wire.Set [ Wire.Keyword "logseq.class/Page" ] )
                ; ( Wire.String "block/name"
                  , Wire.String (page_name_sanity_lc p.Title_refs.title) )
                ]
              else [])))

let save_block_parsed uuid title =
  block_map_parsed uuid title
  |> Js.Promise.then_ (fun bm ->
         Js.Promise.resolve (op "save-block" [ bm; Wire.Map [] ]))

(* parse (uuid, title) pairs into save ops, prepend to rest, apply *)
let apply_parsed ?opts ~rest pairs =
  Js.Promise.all
    (Array.of_list (List.map (fun (u, t) -> save_block_parsed u t) pairs))
  |> Js.Promise.then_ (fun a -> apply ?opts (Array.to_list a @ rest))

let apply_parsed_and_refresh ?opts ~rest pairs =
  apply_parsed ?opts ~rest pairs
  |> Js.Promise.then_ (fun () -> refresh_page ())


let schedule_save uuid title =
  cancel_pending_save ();
  pending_save := Some (uuid, title);
  save_timer :=
    Editor_dom.set_timeout_id
      (fun () ->
        pending_save := None;
        ignore (apply_parsed ~rest:[] [ (uuid, title) ]))
      400


(* [[uuid]] / #[[uuid]] -> [[title]] / #title — the cljs
   id-ref->title-ref pass the edit buffer gets when a block opens.
   Resolves each uuid via thread-api/pull; unresolvable uuids stay
   verbatim. *)
let title_for_edit (title : string) : string Js.Promise.t =
  let n = String.length title in
  (* collect (start, end_excl, has_hash, uuid) tokens *)
  let toks = ref [] in
  let rec scan i =
    if i + 3 >= n then ()
    else if
      title.[i] = '[' && title.[i + 1] = '['
      && i + 40 <= n
      && Block_parse.uuid_shaped (String.sub title (i + 2) 36)
      && title.[i + 38] = ']' && title.[i + 39] = ']'
    then begin
      let has_hash = i > 0 && title.[i - 1] = '#' in
      toks := (i, i + 40, has_hash, String.sub title (i + 2) 36) :: !toks;
      scan (i + 40)
    end
    else scan (i + 1)
  in
  scan 0;
  let toks = List.rev !toks in
  match toks with
  | [] -> Js.Promise.resolve title
  | _ -> (
      match !Runtime.current_repo with
      | None -> Js.Promise.resolve title
      | Some repo ->
          let uuids = List.map (fun (_, _, _, u) -> u) toks in
          Js.Promise.all
            (Array.of_list
               (List.map
                  (fun u ->
                 Runtime.invoke3 "thread-api/pull" (Wire.String repo)
                   (Wire.String "[:block/title]")
                   (Wire.Array [ Wire.Keyword "block/uuid"; Wire.Uuid u ])
                 |> Js.Promise.then_ (fun w ->
                        Js.Promise.resolve
                          (match Wire.map_get_string w "block/title" with
                           | Some t when String.trim t <> "" -> Some t
                           | _ -> None)))
                  uuids))
          |> Js.Promise.then_ (fun names ->
                 let tbl = Hashtbl.create 8 in
                 List.iter2
                   (fun u n ->
                     match n with Some t -> Hashtbl.replace tbl u t | None -> ())
                   uuids
                   (Array.to_list names);
                 let b = Buffer.create n in
                 let cursor = ref 0 in
                 List.iter
                   (fun (i, e, has_hash, u) ->
                     match Hashtbl.find_opt tbl u with
                     | None -> ()
                     | Some t ->
                         Buffer.add_substring b title !cursor
                           ((if has_hash then i - 1 else i) - !cursor);
                         Buffer.add_string b
                           (if has_hash then "#" ^ t else "[[" ^ t ^ "]]");
                         cursor := e)
                   toks;
                 Buffer.add_substring b title !cursor (n - !cursor);
                 Js.Promise.resolve (Buffer.contents b)))


(* undo/redo writes datoms straight into the db — resync the open
   editor's buffer so a stale textarea does not mask the restored title *)
let resync_open_editor () =
  match S.editing () with
  | None -> ()
  | Some e -> (
      match S.find e.uuid with
      | Some b ->
          let title = String.trim b.Model.block_title in
          ignore
            (title_for_edit title
             |> Js.Promise.then_ (fun title ->
                    if e.S.buffer <> title then begin
                      S.set_silent (fun st ->
                          match st.S.editing with
                          | Some e' when e'.uuid = e.uuid ->
                              { st with
                                S.editing =
                                  Some { e' with S.buffer = title }
                              }
                          | _ -> st);
                      match Editor_dom.textarea_of e.uuid with
                      | Some el -> Editor_dom.el_set_value el title
                      | None -> ()
                    end;
                    Js.Promise.resolve ()))
      | None -> S.set_silent (fun st -> { st with S.editing = None }))

let undo () =
  cancel_pending_save ();
  match !Runtime.current_repo with
  | Some repo ->
      Runtime.invoke1 "thread-api/undo-redo-undo" (Wire.String repo)
      |> Js.Promise.then_ (fun _ -> refresh_page ())
      |> Js.Promise.then_ (fun () ->
             resync_open_editor ();
             Js.Promise.resolve ())
  | None -> Js.Promise.resolve ()

let redo () =
  cancel_pending_save ();
  match !Runtime.current_repo with
  | Some repo ->
      Runtime.invoke1 "thread-api/undo-redo-redo" (Wire.String repo)
      |> Js.Promise.then_ (fun _ -> refresh_page ())
      |> Js.Promise.then_ (fun () ->
             resync_open_editor ();
             Js.Promise.resolve ())
  | None -> Js.Promise.resolve ()

(* sdk bridge (and other non-editor mutation paths) refresh the view
   through this Runtime hook *)
let () = Runtime.refresh_after_ops := (fun () -> refresh_page ())
