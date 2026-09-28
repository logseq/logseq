(* Wire encoding for thread-api/apply-outliner-ops plus the post-op page
   refresh: re-invoke get-page-blocks-tree, sync the collapsed set from the
   raw wire (Decode drops block/collapsed?), and republish the page via
   Runtime.send (Page_loaded ...). *)

module S = Editor_state

let kw k v = (Wire.Keyword k, v)
let str k v = (Wire.String k, v)

let block_map ?title uuid =
  Wire.Map
    ([ str "block/uuid" (Wire.Uuid uuid) ]
    @ (match title with
      | Some t -> [ str "block/title" (Wire.String t) ]
      | None -> []))

(* op entries are [:name [args]] — the args live in a nested seq; the
   worker's op_of_entry only accepts that shape (outliner_op.ml) *)
let op name args = Wire.Array [ Wire.Keyword name; Wire.Array args ]

let uuids_list uuids = Wire.List (List.map (fun u -> Wire.Uuid u) uuids)

(* tx-meta :outliner-op — required for multi-op batches or the worker
   skips undo recording (gen_undo_ops requires local-tx? + outliner-op;
   single-op batches get it auto-derived from the op name) *)
let op_opts name = Wire.Map [ kw "outliner-op" (Wire.Keyword name) ]

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

let is_uuid_text s =
  let n = String.length s in
  n = 36 && s.[8] = '-' && s.[13] = '-' && s.[18] = '-' && s.[23] = '-'
  && (let hex i =
        let c = s.[i] in
        (c >= '0' && c <= '9') || (c >= 'a' && c <= 'f')
        || (c >= 'A' && c <= 'F')
      in
      let rec all i =
        i >= n || (i = 8 || i = 13 || i = 18 || i = 23 || hex i)
                   && all (i + 1)
      in
      all 0)

(* cljs wrap-parse-block (subset): [[name]] and [[uuid]] in a title are
   persisted as :block/refs entries, and [[name]] is rewritten to
   [[uuid]] in block/title. The worker's resolve-page-refs looks up or
   creates the page and the pipeline rebuilds :block/refs from the
   [[uuid]] patterns. #[[...]] stays literal (tag conversion is a
   separate cljs path). Returns (title', refs wire values). *)
let extract_title_refs title =
  let n = String.length title in
  let buf = Buffer.create n in
  let refs = ref [] in
  let memo : (string, string) Hashtbl.t = Hashtbl.create 4 in
  let uuid_of_name name =
    let key = String.lowercase_ascii name in
    match Hashtbl.find_opt memo key with
    | Some u -> u
    | None ->
        let u = Platform.random_uuid () in
        Hashtbl.add memo key u; u
  in
  let emit_ref inner u =
    refs :=
      (if is_uuid_text inner then
         Wire.Array [ Wire.Keyword "block/uuid"; Wire.Uuid u ]
       else
         Wire.Map
           [ str "block/uuid" (Wire.Uuid u)
           ; str "block/title" (Wire.String inner)
           ; str "block/name" (Wire.String (String.lowercase_ascii inner))
           ; str "block/type" (Wire.String "page") ])
      :: !refs
  in
  let rec scan i =
    if i < n then begin
      if i + 1 < n && title.[i] = '[' && title.[i + 1] = '['
         && (i = 0 || title.[i - 1] <> '#')
      then begin
        match
          try Some (String.index_from title (i + 2) ']')
          with Not_found -> None
        with
        | Some k when k + 1 < n && title.[k + 1] = ']' && k > i + 2 ->
            let inner = String.sub title (i + 2) (k - i - 2) in
            let u = if is_uuid_text inner then inner else uuid_of_name inner in
            Buffer.add_string buf "[["; Buffer.add_string buf u;
            Buffer.add_string buf "]]";
            emit_ref inner u;
            scan (k + 2)
        | _ -> Buffer.add_char buf title.[i]; scan (i + 1)
      end else begin
        Buffer.add_char buf title.[i]; scan (i + 1)
      end
    end
  in
  scan 0;
  (Buffer.contents buf, List.rev !refs)

(* The block map sent in a save-block op — shared by editor saves and
   sdk updateBlock. *)
let saved_block_map uuid title =
  let dt =
    match S.find uuid with
    | Some b -> b.Model.block_display_type
    | None -> None
  in
  let refs_pairs title =
    match dt with
    | Some _ -> [ str "block/title" (Wire.String title) ]
    | None ->
        let title', refs = extract_title_refs title in
        [ str "block/title" (Wire.String title')
        ; str "block/refs" (Wire.List refs) ]
  in
  match markdown_heading_level title with
  | Some lvl when dt <> Some "code" && dt <> Some "math" ->
      Wire.Map
        ([ str "block/uuid" (Wire.Uuid uuid) ]
        @ refs_pairs (strip_markdown_heading title lvl)
        @ [ str "logseq.property/heading" (Wire.Int lvl) ])
  | _ ->
      Wire.Map
        ([ str "block/uuid" (Wire.Uuid uuid) ]
        @ refs_pairs (String.trim title))

(* cljs save-block-aux! trims the value before persisting *)
let save_block uuid title =
  op "save-block" [ saved_block_map uuid title; Wire.Map [] ]

let insert_blocks blocks target_uuid ~sibling =
  op "insert-blocks"
    [ Wire.List blocks
    ; Wire.Uuid target_uuid
    ; Wire.Map
        [ kw "sibling?" (Wire.Bool sibling)
        ; kw "keep-uuid?" (Wire.Bool true)
        ; kw "outliner-op" (Wire.Keyword "insert-blocks")
        ]
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
            ([ str "block/uuid" (Wire.Uuid u)
             ; str "block/title" (Wire.String (String.trim b.Model.block_title))
             ; str "block/level" (Wire.Int level) ]
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

let indent_outdent uuids indent =
  op "indent-outdent-blocks"
    [ uuids_list uuids; Wire.Bool indent; Wire.Map [] ]

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
  let set =
    match
      (Wire.map_get_uuid w "block/uuid", Wire.get w "block/collapsed?")
    with
    | Some u, Some (Wire.Bool true) -> S.String_set.add u set
    | _ -> set
  in
  match Wire.get w "block/children" with
  | Some (Wire.List xs) | Some (Wire.Array xs) ->
      List.fold_left collect_collapsed set xs
  | _ -> (
      (* a top-level list of blocks (zoom refresh) — walk each item *)
      match w with
      | Wire.List xs | Wire.Array xs ->
          List.fold_left collect_collapsed set xs
      | _ -> set)

let set_collapsed set =
  let apply st = { st with S.collapsed = set } in
  (* on an empty page the first op's refresh runs before any block_row has
     mounted the editor state — defer the sync until ensure *)
  if S.ready () then S.set_silent apply
  else S.defer_init apply

(* block/tags arrives as {:db/id} stubs — cljs resolves tag entities live
   off datascript; we batch-resolve titles via get-blocks and rewrite the
   model before rendering. *)
let rec collect_tag_ids acc (b : Model.block) =
  List.fold_left collect_tag_ids (List.rev_append b.Model.block_tag_ids acc)
    b.block_children

(* cljs block.cljs hides class tags on a node: entities whose
   :logseq.property.class/hide-from-node is true (Quote-block, Code-block,
   Math-block, ...) and the ldb/internal-tags idents when
   show-tag-and-property-classes? is off (the only mode we support). *)
let internal_tag_idents =
  [ "logseq.class/Page"; "logseq.class/Property"; "logseq.class/Tag"
  ; "logseq.class/Root"; "logseq.class/Asset" ]

let tag_hidden blk =
  (match Wire.get blk "logseq.property.class/hide-from-node" with
   | Some (Wire.Bool hidden) -> hidden
   | _ -> false)
  ||
  match Wire.get blk "db/ident" with
  | Some (Wire.Keyword ident) | Some (Wire.String ident) ->
      List.mem ident internal_tag_idents
  | _ -> false

(* (db-id, title, ident, hidden) per tag entity *)
let tag_titles repo ids : (int * string * string * bool) list Js.Promise.t =
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
                      ( id, t
                      , (match Wire.get blk "db/ident" with
                         | Some (Wire.Keyword s) | Some (Wire.String s) -> s
                         | _ -> "")
                      , tag_hidden blk )
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
                   { b with
                     Model.block_tags =
                       List.filter_map
                         (fun i ->
                           List.find_map
                             (fun (i', t, _, hidden) ->
                               if i' = i && not hidden then Some t else None)
                             titles)
                         b.block_tag_ids
                   ; block_tag_idents =
                       List.filter_map
                         (fun i ->
                           List.find_map
                             (fun (i', _, ident, _) ->
                               if i' = i && ident <> "" then Some ident
                               else None)
                             titles)
                         b.block_tag_ids
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
                            (fun (i, t, ident, _) ->
                              if List.mem i ids
                                 && ident <> "logseq.class/Page"
                              then Some t
                              else None)
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
             , Wire.Map [ (Wire.Keyword "children?", Wire.Bool true) ] )
           ]
       ])
  |> Js.Promise.then_ (fun w ->
         match Sdk_util.wire_elems w with
         | [ pair ] -> (
             let blk =
               match Wire.get pair "block" with
               | Some b -> b
               | None -> (
                   match Sdk_util.wire_elems pair with
                   | [ _; b ] -> b
                   | _ -> Wire.Nil)
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
  match (!Runtime.current_repo, !Runtime.current_page) with
  | Some repo, Some page -> (
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
             set_collapsed (collect_collapsed S.String_set.empty blocks_w);
             let blocks = Decode.blocks_of_wire blocks_w in
             resolve_block_tags blocks
             |> Js.Promise.then_ (fun blocks ->
                    let page = { page with Model.page_blocks = blocks } in
                    (match !Runtime.current_route with
                     | Some (Model.Block_zoom _) ->
                         Js.Promise.resolve page
                     | _ -> resolve_page_tags repo page)
                    |> Js.Promise.then_ (fun page ->
                           Runtime.send (Action.Page_loaded page);
                           Js.Promise.resolve ()))))
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

let apply ?(opts = Wire.Map []) ops : unit Js.Promise.t =
  (* any structural op already carries the correct titles — a queued
     keystroke save firing afterwards would clobber them *)
  cancel_pending_save ();
  match !Runtime.current_repo with
  | None -> Js.Promise.resolve ()
  | Some repo ->
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
                        | Wire.Array (Wire.Array (Wire.Keyword name :: _) :: _)
                        | Wire.List (Wire.Array (Wire.Keyword name :: _) :: _)
                        | Wire.Array (Wire.Keyword name :: _) ->
                            name
                        | _ -> "?")
                      ops)
               , e );
             Js.Promise.resolve ())

let apply_and_refresh ?opts ops =
  apply ?opts ops
  |> Js.Promise.then_ (fun () -> refresh_page ())

(* cljs wrap-parse-block on save: [[page]]/#tag references resolve into
   block/refs + block/tags and the stored title is rewritten to
   [[uuid]] id-ref form — async since Title_refs resolves entities *)
let block_map_parsed uuid title =
  Title_refs.parse (String.trim title)
  |> Js.Promise.then_ (fun p ->
         Js.Promise.resolve
           (Wire.Map
              ([ str "block/uuid" (Wire.Uuid uuid)
               ; str "block/title" (Wire.String p.Title_refs.title) ]
              @ Title_refs.kvs_of_parsed p)))

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


(* undo/redo writes datoms straight into the db — resync the open
   editor's buffer so a stale textarea does not mask the restored title *)
let resync_open_editor () =
  match S.editing () with
  | None -> ()
  | Some e -> (
      match S.find e.uuid with
      | Some b ->
          let title = String.trim b.Model.block_title in
          if e.S.buffer <> title then begin
            S.set_silent (fun st ->
                match st.S.editing with
                | Some e' when e'.uuid = e.uuid ->
                    { st with S.editing = Some { e' with S.buffer = title } }
                | _ -> st);
            match Editor_dom.textarea_of e.uuid with
            | Some el -> Editor_dom.el_set_value el title
            | None -> ()
          end
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
