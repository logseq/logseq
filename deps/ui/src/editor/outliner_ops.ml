(* Wire encoding for thread-api/apply-outliner-ops plus the post-op page
   refresh: re-invoke get-page-blocks-tree, sync the collapsed set from the
   raw wire (Decode drops block/collapsed?), and republish the page via
   Runtime.send (Page_loaded ...). *)

open Promise_ext
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

(* parsed title kvs — the (name, uuid) pairs the parse mints prime the
   render pull caches so a remounted [[uuid]] anchor paints its title
   immediately instead of waiting on a worker pull *)
let title_kvs t =
  let kvs, metas = Block_parse.title_fields t in
  Render_inline.prime_ref_metas metas;
  List.map (fun (k, v) -> (Wire.String k, v)) kvs

(* ~page:true page-ifies the new block (cljs outliner-insert-block!
   library branch): tags #{logseq.class/Page} + block/name; the worker's
   insert tx then dissocs block/page so the block lives only under
   block/parent. ?link carries a [:block/link db-id] embed edge. *)
let block_map ?title ?(page = false) ?link uuid =
  Wire.Map
    ([ str "block/uuid" (Wire.Uuid uuid) ]
    @ (match title with
      | Some t -> title_kvs t
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

(* cljs wrap-parse-block on save: markdown headings normalize into
   logseq.property/heading, and [[page]]/#tag references resolve into
   block/refs + block/tags with the stored title rewritten to
   [[uuid]] id-ref form — async since Title_refs resolves entities.
   Sync text-only parsing must never run here: a #tag ref emitted as a
   bare {name,title,fresh-uuid} map upserts nothing, minting a partial
   duplicate entity that fails tx validation *)
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
  let* p = Title_refs.parse title in
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
       else []))

let save_block_parsed uuid title =
  let* bm = block_map_parsed uuid title in
  Js.Promise.resolve (op "save-block" [ bm; Wire.Map [] ])

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

let insert_blocks ?(bottom = false) ?(replace_empty_target = false)
    blocks target_uuid ~sibling =
  op "insert-blocks"
    [ Wire.List blocks
    ; Wire.Uuid target_uuid
    ; Wire.Map
        ([ kw "sibling?" (Wire.Bool sibling)
         ; kw "keep-uuid?" (Wire.Bool true)
         ; kw "bottom?" (Wire.Bool bottom)
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
             :: title_kvs (String.trim b.Model.block_title)
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

let merge_collapsed add rem =
  let apply st =
    { st with
      S.collapsed =
        S.String_set.union add (S.String_set.diff st.S.collapsed rem)
    }
  in
  if S.ready () then S.set_silent apply
  else S.defer_init apply

(* Fetch the linked entity's blocks for every :block/link (embed) block in
   a decoded tree and attach them as block_embed_children. Recurses into
   fetched trees; [ancestors] is the chain of linked db ids guarding
   self-embed loops, [collapsed] accumulates :block/collapsed? flags from
   the embed wires (Decode drops the flag). *)
let rec fill_embed_children repo ancestors collapsed
    (blocks : Model.block list) : Model.block list Js.Promise.t =
  (* siblings fetch their children/embed trees in parallel —
     Promise.all preserves list order; the ancestors set still guards
     self-embed loops *)
  let item_p (b : Model.block) =
    let children_p =
      fill_embed_children repo ancestors collapsed
        b.Model.block_children
    in
    let embed_p =
      match b.Model.block_link with
      | Some link_id when not (List.mem link_id ancestors) ->
          (let* w =
            Runtime.invoke3 "thread-api/get-page-blocks-tree"
              (Wire.String repo) (Wire.Int link_id) Wire.Nil
          in
          collapsed := collect_collapsed !collapsed w;
          fill_embed_children repo (link_id :: ancestors)
            collapsed (Decode.blocks_of_wire w))
          |> Js.Promise.catch (fun _ -> Js.Promise.resolve [])
      | _ -> Js.Promise.resolve []
    in
    let* a = Js.Promise.all [| children_p; embed_p |] in
    Js.Promise.resolve
      { b with
        Model.block_children = a.(0)
      ; block_embed_children = a.(1)
      }
  in
  let* arr = Js.Promise.all (Array.of_list (List.map item_p blocks)) in
  Js.Promise.resolve (Array.to_list arr)

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
  let* w =
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
  in
  Js.Promise.resolve
    (List.filter_map
       (fun pair ->
         let blk =
           match Wire.block_of_pair pair with
           | Some b -> b
           | None -> Wire.Nil
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
       (Wire.elems w))

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
          let* titles = tag_titles repo ids in
          let rec fill (b : Model.block) =
            let resolved =
              List.filter_map
                (fun i ->
                  Option.map (fun r -> (i, r))
                    (List.assoc_opt i titles))
                b.Model.block_tag_ids
            in
            let idents =
              List.map (fun (_, (_, i, _, _)) -> i) resolved
            in
            let visible =
              List.filter
                (fun (_, (_, ident, hidden, _uuid)) ->
                  not hidden && not (internal_tag_ident ident))
                resolved
            in
            { b with
              Model.block_tags =
                List.map (fun (_, (t, _, _, _)) -> t) visible
            ; block_tag_uuids =
                List.map (fun (_, (_, _, _, u)) -> u) visible
            ; (* block_tag_idents stays unfiltered: internal
                 classes (Page, Comments, Query, …) drive the
                 node icon and structural checks even though
                 they never render as chips *)
              block_tag_idents = idents
            ; block_tag_db_ids =
                List.map (fun (i, _) -> i) visible
            ; block_is_comments_area =
                List.mem "logseq.class/Comments" idents
            ; block_is_comment =
                List.mem "logseq.class/Comment" idents
            ; block_children = List.map fill b.block_children
            }
          in
          Js.Promise.resolve (List.map fill blocks))

(* the page entity's own block/tags -> resolved titles (page-title chips) *)
let resolve_page_tags repo (page : Model.page) : Model.page Js.Promise.t =
  let* w =
    Runtime.invoke2 "thread-api/get-case-page" (Wire.String repo)
      (Wire.String page.Model.page_title)
  in
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
      let* titles = tag_titles repo ids in
      (* the built-in Page class is implicit on every page —
                cljs never renders it as a chip *)
      let keep (i, (_, ident, _, _)) =
        List.mem i ids && ident <> "logseq.class/Page"
      in
      let kept = List.filter keep titles in
      Js.Promise.resolve
        { page with
          Model.page_tags =
            List.map (fun (_, (t, _, _, _)) -> t) kept
        ; page_tag_idents =
            List.map (fun (_, (_, ident, _, _)) -> ident) kept
        ; page_tag_uuids =
            List.map (fun (_, (_, _, _, u)) -> u) kept
        ; page_tag_db_ids =
            List.map (fun (i, _) -> i) kept
        ; page_internal =
            List.exists
              (fun (i, (_, ident, _hidden, _uuid)) ->
                List.mem i ids
                && ident = "logseq.class/Page")
              titles
        }

(* block zoom: the route root is a block, not a page — refetch it via
   get-blocks (get-page-blocks-tree would return its children or nothing).
   Returns the raw wire list like get-page-blocks-tree. *)
let fetch_zoom_blocks repo uuid : Wire.t Js.Promise.t =
  let* w =
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
  in
  match Wire.elems w with
  | [ pair ] -> (
      let blk =
        (* the pair's flat `children` carry the full maps; splice
           them into block/children before decoding *)
        match Decode.nest_get_blocks pair with
        | Some w -> Some w
        | None -> Wire.block_of_pair pair
      in
      (match blk with
       | Some (Wire.Map _ as blk) ->
           Js.Promise.resolve (Wire.List [ blk ])
       | _ -> Js.Promise.resolve (Wire.List [])))
  | _ -> Js.Promise.resolve (Wire.List [])

(* [[...]] tokens inside a display title — name refs and uuid refs
   alike *)
let title_ref_tokens (title : string) : string list =
  let n = String.length title in
  let toks = ref [] in
  let rec scan i =
    if i + 3 >= n then ()
    else if title.[i] = '[' && title.[i + 1] = '[' then (
      let rec close j =
        if j + 1 >= n then -1
        else if title.[j] = ']' && title.[j + 1] = ']' then j
        else close (j + 1)
      in
      let c = close (i + 2) in
      if c > i + 2 then (
        toks := String.sub title (i + 2) (c - i - 2) :: !toks;
        scan (c + 2))
      else scan (i + 1))
    else scan (i + 1)
  in
  scan 0;
  List.rev !toks

(* one get-blocks batch resolving every [[ref]] target on the page —
   primes the pull caches so anchors mount on hits instead of paying a
   thread-api/pull each (the N+1 pull storm the nav profile shows) *)
let prefetch_anchor_refs repo (blocks : Model.block list) :
    unit Js.Promise.t =
  let rec collect acc (b : Model.block) =
    List.fold_left collect
      (List.rev_append (title_ref_tokens b.Model.block_title) acc)
      b.Model.block_children
  in
  let toks = List.fold_left collect [] blocks in
  let names, uuids =
    List.fold_left
      (fun (ns, us) tok ->
        if Block_parse.uuid_shaped tok then (ns, tok :: us)
        else if String.trim tok <> "" then
          (String.lowercase_ascii tok :: ns, us)
        else (ns, us))
      ([], []) toks
  in
  let props =
    Wire.Map
      [ ( Wire.Keyword "properties"
        , Wire.Array
            [ Wire.Keyword "block/uuid"; Wire.Keyword "block/title"
            ; Wire.Keyword "block/name" ]) ]
  in
  let reqs =
    List.map
      (fun u ->
        (* get-blocks resolves String/Uuid ids only — lookup-refs are
           unsupported on this endpoint *)
        Wire.Map
          [ (Wire.String "id", Wire.Uuid u); (Wire.String "opts", props) ])
      (List.sort_uniq String.compare uuids)
    @ List.map
        (fun nm ->
          Wire.Map
            [ (Wire.String "id", Wire.String nm)
            ; (Wire.String "opts", props) ])
        (List.sort_uniq String.compare names)
  in
  match reqs with
  | [] -> Js.Promise.resolve ()
  | _ ->
      (let* w =
         Runtime.invoke2 "thread-api/get-blocks" (Wire.String repo)
           (Wire.Array reqs)
       in
       Js.Promise.resolve (Render_inline.prime_pull_caches repo w))
      |> Js.Promise.catch (fun _ -> Js.Promise.resolve ())

(* shared page-blocks pipeline: collapse-state collection → embed-children
   fill → collapse application → library view filter → tag-title resolution.
   ~plain skips the collapse/embed/view shaping — sidebar items only need
   decoded + tag-resolved blocks and must not touch editor collapse state. *)
let blocks_of_tree_wire ?(plain = false) repo (p : Model.page) blocks_w =
  if plain then resolve_block_tags (Decode.blocks_of_wire blocks_w)
  else
    let collapsed = ref S.String_set.empty in
    collapsed := collect_collapsed !collapsed blocks_w;
    let decoded = Decode.blocks_of_wire blocks_w in
    let* () = prefetch_anchor_refs repo decoded in
    let* blocks =
      fill_embed_children repo (ancestors_of p) collapsed decoded
    in
    set_collapsed !collapsed;
    resolve_block_tags
      (Decode.view_blocks ~library:p.Model.page_is_library blocks)

let fetch_page_blocks ?(plain = false) repo (p : Model.page) =
  let* v =
    Runtime.invoke3 "thread-api/get-page-blocks-tree" (Wire.String repo)
      (Wire.page_ref
         (Option.value p.Model.page_uuid ~default:p.Model.page_title))
      Wire.Nil
  in
  (blocks_of_tree_wire ~plain repo p) v

(* block-zoom breadcrumb chain: ancestor titles must be refetched on
   refresh too — a renamed parent shows stale text otherwise *)
let fetch_zoom_parents repo uuid : Model.block list Js.Promise.t =
  let* parents_w =
    Runtime.invoke2 "thread-api/get-block-parents" (Wire.String repo)
      (Wire.List [ Wire.Keyword "block/uuid"; Wire.Uuid uuid ])
  in
  Js.Promise.resolve
    (Wire.elems parents_w
     |> List.filter_map (fun w ->
            match w with
            | Wire.Map _ -> Some (Decode.block_of_wire w)
            | _ -> None))

(* refetch unlinked refs for the current page — a block-title edit can
   create or remove a text mention; the send is guarded so an in-flight
   fetch can't overwrite a page the user navigated to *)
let fetch_unlinked_refs ~stale:(is_stale : unit -> bool) (p : Model.page) =
  (* gated on the unlinked section being open — get-unlinked-references
     scans every block/title datom, so a collapsed section must not pay
     it on every refresh. The fold toggle's send flips
     Runtime.unlinked_open before its fetch, so opening still fetches *)
  if not !Runtime.unlinked_open then ()
  else
  match !Runtime.current_repo, p.Model.page_db_id with
  | Some repo, Some id ->
      ignore
        ((let* w =
           Runtime.invoke2 "thread-api/get-unlinked-refs" (Wire.String repo)
             (Wire.Int id)
         in
         Js.Promise.resolve
           (if not (is_stale ()) then
              Runtime.send
                (Action.Unlinked_loaded (Decode.blocks_of_wire w))))
         |> Js.Promise.catch (fun e ->
                Platform.console_error ("get-unlinked-refs failed", e);
                Js.Promise.resolve ()))
  | _ -> ()

(* cljs :block-unlinked-ref-exists resource — a cheap search-based check
   that gates whether the collapsed .unlinked-references section renders
   at all. Unlike get-unlinked-refs it must run regardless of the fold
   state (the fold control can't be clicked when the section is absent). *)
let fetch_unlinked_exists ~stale:(is_stale : unit -> bool)
    (p : Model.page) =
  match !Runtime.current_repo, p.Model.page_uuid with
  | Some repo, Some uuid ->
      let rk =
        Wire.Array
          [ Wire.Keyword "block-unlinked-ref-exists"; Wire.Uuid uuid ]
      in
      ignore
        ((let* w =
           Runtime.invoke2 "thread-api/get-render-snapshots"
             (Wire.String repo)
             (Wire.Map
                [ (Wire.Keyword "blocks", Wire.Array [])
                ; (Wire.Keyword "children", Wire.Array [])
                ; (Wire.Keyword "resources", Wire.Array [ rk ]) ])
         in
         Js.Promise.resolve
           (match Views_wire.snapshot_slot_value w rk with
            | Some (Wire.Bool b) when not (is_stale ()) ->
                Runtime.send (Action.Unlinked_exists b)
            | _ -> ()))
         |> Js.Promise.catch (fun e ->
                Platform.console_error
                  ("block-unlinked-ref-exists failed", e);
                Js.Promise.resolve ()))
  | _ -> ()

(* Refresh calls pile up during rapid editing (each op's
   apply_and_refresh plus remote sync-db-changes). Every refresh that
   lands runs a full reconcile, and a reparented row is dropped+recreated
   — the e2e bounding-xy on the editor textarea races exactly that node
   replacement. A stale refresh carries strictly older data than the
   in-flight one, so only the newest applies. *)
let refresh_gen = ref 0

let refresh_page () : unit Js.Promise.t =
  let route_at_start = !Runtime.current_route in
  incr refresh_gen;
  let gen = !refresh_gen in
  match (!Runtime.current_repo, !Runtime.current_page) with
  | Some repo, Some page -> (
      incr Runtime.load_gen;
      fetch_unlinked_refs
        ~stale:(fun () -> !Runtime.current_route <> route_at_start)
        page;
      fetch_unlinked_exists
        ~stale:(fun () -> !Runtime.current_route <> route_at_start)
        page;
      let blocks_p =
        match !Runtime.current_route, page.Model.page_uuid with
        | Some (Model.Block_zoom _), Some u ->
            let* v = fetch_zoom_blocks repo u in
            (blocks_of_tree_wire repo page) v
        | _ -> fetch_page_blocks repo page
      in
      (let* blocks = blocks_p in
      (* a newer refresh superseded this fetch — a stale apply
                would tear the open editor (recreated textarea reads) *)
      if !refresh_gen <> gen then Js.Promise.resolve ()
      else
        let page = { page with Model.page_blocks = blocks } in
        let* page =
          (match !Runtime.current_route with
           | Some (Model.Block_zoom uuid) ->
               let* page_parents = fetch_zoom_parents repo uuid in
               Js.Promise.resolve
                 { page with Model.page_parents }
           | _ -> resolve_page_tags repo page)
        in
        (* the worker's tree is authoritative
                  again — drop committed-buffer title
                  overrides *)
        S.clear_overrides ();
        (* the user may have navigated while the
           refetch was in-flight — never
           overwrite the new route's page *)
        if !Runtime.current_route = route_at_start then
          Runtime.send (Action.Page_loaded page);
        Js.Promise.resolve ())
      |> Js.Promise.catch (fun e ->
             Platform.console_error ("refresh_page failed", e);
             Js.Promise.resolve ()))
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
      let* sop = save_block_parsed uuid title in
      let* () = apply [ sop ] in
      apply ~opts ops
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
          (let* r =
            Runtime.invoke3 "thread-api/apply-outliner-ops" (Wire.String repo)
              (Wire.Array ops) opts
          in
          (* callers that ignore the response (autosave, the pending_save
             flush) never refresh — queue the delta so the next refresh
             or broadcast merges the change it carries *)
          (match Wire.get r "delta" with
           | Some d -> Page_delta.stash_deferred d
           | None -> ());
          Js.Promise.resolve ())
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
                 Toast.error (I18n.t "ui/save-changes-error");
                 Js.Promise.resolve ()))

(* While an editor is open a per-op fetch+rebuild starves keystroke
   dispatch under RTC traffic (~200-300ms of whole-page reconcile per
   call). Every apply already produces a sync-db-changes broadcast that
   arms the debounced route reload, so cosmetic callers (property writes)
   defer to that instead of paying the refresh inline. Structural callers
   keep [refresh_page]: follow-up steps (e.g. enter_edit on an inserted
   block) must see the new model. *)
let refresh_page_deferred () : unit Js.Promise.t =
  if S.ready () && S.editing () <> None then Js.Promise.resolve ()
  else refresh_page ()

(* the stale-commit guard for a spliced page — the resolve/fill_embeds
   roundtrips may outlive the page they were started on *)
let page_still_current (route : Model.route option) (page : Model.page) =
  !Runtime.current_route = route
  &&
  match !Runtime.current_page with
  | Some c -> c == page
  | None -> false

(* parse (uuid, title) pairs into save ops, prepend to rest, apply *)
let apply_parsed ?opts ~rest pairs =
  let* a =
    Js.Promise.all
      (Array.of_list (List.map (fun (u, t) -> save_block_parsed u t) pairs))
  in
  apply ?opts (Array.to_list a @ rest)

(* same ops as [apply] but the promise carries the worker response
   — callers that act on inserted uuids need {:blocks [...]} (cljs
   insert-blocks! result) *)
let rec apply_result ?(opts = Wire.Map []) ops : Wire.t option Js.Promise.t
    =
  match !pending_save with
  | Some (uuid, title) ->
      pending_save := None;
      let* sop = save_block_parsed uuid title in
      let* () = apply [ sop ] in
      apply_result ~opts ops
  | None -> (
      Editor_dom.clear_timeout !save_timer;
      match !Runtime.current_repo with
      | None -> Js.Promise.resolve None
      | Some repo ->
          let opts =
            match opts with
            | Wire.Map kvs ->
                Wire.Map (kvs @ [ kw "ui/perf-id" (perf_id ()) ])
            | _ -> opts
          in
          (let* r =
            Runtime.invoke3 "thread-api/apply-outliner-ops" (Wire.String repo)
              (Wire.Array ops) opts
          in
          Js.Promise.resolve (Some r))
          |> Js.Promise.catch (fun e ->
                 Platform.console_error ("apply-outliner-ops failed", e);
                 Js.Promise.resolve None))

(* page-delta splice path: op responses carry the worker's render delta
   ({blocks, deleted, children, rev}) — patch only the touched rows
   instead of refetching+remounting the whole page (cljs apply-delta!).
   refresh_page is the fallback when the delta can't splice *)
let delta_helpers (page : Model.page) : Page_delta.helpers =
  { Page_delta.resolve =
      (fun bs ->
        match !Runtime.current_repo with
        | None -> resolve_block_tags bs
        | Some repo ->
            let* () = prefetch_anchor_refs repo bs in
            resolve_block_tags bs)
  ; fill_embeds =
      (fun bs ->
        match !Runtime.current_repo with
        | None -> Js.Promise.resolve bs
        | Some repo ->
            let collapsed = ref S.String_set.empty in
            let* bs' =
              fill_embed_children repo (ancestors_of page) collapsed bs
            in
            merge_collapsed !collapsed S.String_set.empty;
            Js.Promise.resolve bs')
  ; merge_collapsed
  ; refresh_page_fields =
      (fun p ->
        match !Runtime.current_repo with
        | Some repo -> resolve_page_tags repo p
        | None -> Js.Promise.resolve p)
  }

(* fold the queued deferred deltas then [delta] onto [page],
   ~strict:false — op-side patches are absolute set-ops.
   Returns the merged page plus every uuid the folded deltas touched, so
   the caller can drop only the title overrides the tx caught up to *)
let apply_queued _page delta =
  let deltas = Page_delta.drain_deferred () @ [ delta ] in
  let touched = List.concat_map Page_delta.delta_uuids deltas in
  (* fold and publish inside the apply queue so a racing arm can't
     interleave between our splice and our publish — canon rows replace
     block fields wholesale, so a stale arm publishing last would blank
     rows the newer model already advanced *)
  Page_delta.with_apply_queue (fun () ->
      match !Runtime.current_page with
      | Some base -> (
          let h = delta_helpers base in
          let rec go page = function
            | [] -> Js.Promise.resolve (Some page)
            | d :: rest -> (
                let* applied =
                  Page_delta.apply_to_page ~strict:false h page d
                in
                match applied with
                | Some page' -> go page' rest
                | None -> Js.Promise.resolve None)
          in
          let* a = go base deltas in
          (match a with
           | Some p'
             when p' != base
                  &&
                  (match !Runtime.current_page with
                   | Some c -> c == base
                   | None -> false) ->
               Runtime.push_page_items p';
               Runtime.send (Action.Page_loaded p')
           | _ -> ());
          Js.Promise.resolve (a, touched))
      | None -> Js.Promise.resolve (None, touched))

let refresh_via_delta (resp : Wire.t option) : unit Js.Promise.t =
  match
    (Option.bind resp (fun r -> Wire.get r "delta"), !Runtime.current_page)
  with
  | Some delta, Some page -> (
      let route_at_start = !Runtime.current_route in
      let* applied, touched = apply_queued page delta in
      match applied with
      | Some page' when page_still_current route_at_start page' ->
          (* the spliced rows are authoritative for the uuids the tx
             touched — drop their committed-buffer title overrides like
             refresh_page does, but keep in-flight commits the tx
             didn't cover *)
          S.prune_overrides touched;
          (* push the spliced tree straight into the mounted virtual
             list before Page_loaded — the items signal repaints only
             the touched rows, and matching container fields then let
             update.ml skip the data_gen bump (no page remount) *)
          Runtime.push_page_items page';
          Runtime.send (Action.Page_loaded page');
          (* the whole-tree fetch is skipped, but linked/unlinked refs
             still need their cheap refresh *)
          !Runtime.refresh_page_side page';
          (* property areas hold worker data outside the spliced model;
             the broadcast echo of this tx is deduped, so refresh them
             here or their chips stay stale. Fire-and-forget: awaiting
             the get-display-properties roundtrip would add ~60ms to
             every editing op before focus can land *)
          ignore (!Runtime.refresh_property_areas ());
          Js.Promise.resolve ()
      | Some _ ->
          (* page moved on mid-splice — this page is gone *)
          Js.Promise.resolve ()
      | None -> refresh_page ())
  | _ -> refresh_page ()

let apply_and_refresh ?opts ops =
  let* resp = apply_result ?opts ops in
  let* () = refresh_via_delta resp in
  (* the quick-add dialog's block list lives outside
            .page-blocks-inner; a page refresh alone won't repaint it *)
  if Dialogs_state.ready () && Dialogs_state.is_open "quick-add" then
    Quick_add_state.reload ();
  Js.Promise.resolve ()

let apply_and_refresh_deferred ?opts ops =
  let* resp = apply_result ?opts ops in
  if S.ready () && S.editing () <> None then (
    (* the deferred refresh would drop the op's delta — queue it so the
       next refresh/broadcast merges the saves it carries *)
    (match Option.bind resp (fun r -> Wire.get r "delta") with
     | Some d -> Page_delta.stash_deferred d
     | None -> ());
    Js.Promise.resolve ())
  else refresh_via_delta resp

(* cljs insert-blocks! result {:blocks [...inserted maps]} — last block's
   real uuid (keep-uuid? regenerates on collision, so callers cannot
   reuse the ids they sent) *)
let last_inserted_uuid (resp : Wire.t option) : string option =
  match Option.bind resp (fun r -> Wire.map_get r "result") with
  | Some r -> (
      match Wire.map_get r "blocks" with
      | Some (Wire.Array bs) | Some (Wire.List bs) -> (
          match List.rev bs with
          | last :: _ -> Wire.map_get_uuid last "block/uuid"
          | [] -> None)
      | _ -> None)
  | None -> None


let schedule_save uuid title =
  cancel_pending_save ();
  pending_save := Some (uuid, title);
  save_timer :=
    Editor_dom.set_timeout_id
      (fun () ->
        pending_save := None;
        ignore
          (let* _ = apply_parsed ~rest:[] [ (uuid, title) ] in
          (* committed — advance base so the undo resync gate sees
                    the buffer as clean and can restore reverted titles *)
          S.set_silent (fun st ->
              match st.S.editing with
              | Some e when e.S.uuid = uuid && e.S.buffer = title ->
                  { st with
                    S.editing = Some { e with S.base = title } }
              | _ -> st);
          Js.Promise.resolve ()))
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
          let* names =
            Js.Promise.all
              (Array.of_list
                 (List.map
                    (fun u ->
                   let* w =
                     Runtime.invoke3 "thread-api/pull" (Wire.String repo)
                       (Wire.String "[:block/title]")
                       (Wire.Array [ Wire.Keyword "block/uuid"; Wire.Uuid u ])
                   in
                   Js.Promise.resolve
                     (match Wire.map_get_string w "block/title" with
                      | Some t when String.trim t <> "" -> Some t
                      | _ -> None))
                    uuids))
          in
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
          Js.Promise.resolve (Buffer.contents b))

(* parse (uuid, title) pairs into save ops, prepend to rest, apply +
   splice the response delta *)
let apply_parsed_and_refresh ?opts ~rest pairs =
  let* a =
    Js.Promise.all
      (Array.of_list (List.map (fun (u, t) -> save_block_parsed u t) pairs))
  in
  let* resp = apply_result ?opts (Array.to_list a @ rest) in
  refresh_via_delta resp

let apply_and_refresh_result ?opts ops =
  let* r = apply_result ?opts ops in
  let* () = refresh_via_delta r in
  Js.Promise.resolve r



(* undo/redo writes datoms straight into the db — resync the open
   editor's buffer so a stale textarea does not mask the restored title.
   Returns the promise so callers that move editing afterwards (paste)
   sequence after the textarea write *)
let resync_open_editor ?(force = false) () : unit Js.Promise.t =
  match S.editing () with
  | None -> Js.Promise.resolve ()
  | Some e -> (
      match S.find e.uuid with
      | Some b ->
          let title = String.trim b.Model.block_title in
          let* title = title_for_edit title in
          (* remote refresh must not clobber typed text: only
                    overwrite when the buffer is still the value the editor
                    opened with and the stored title moved since. undo/redo
                    force it — the user asked for the revert even when an
                    unsaved edit is in flight *)
          if (force || (e.S.buffer = e.S.base)) && e.S.buffer <> title
          then begin
            S.set_silent (fun st ->
                match st.S.editing with
                | Some e' when e'.uuid = e.uuid ->
                    { st with
                   S.editing =
                     Some
                       { e' with S.buffer = title; base = title }
                    }
                | _ -> st);
            match Editor_dom.textarea_of e.uuid with
            | Some el -> Editor_dom.el_set_value el title
            | None -> ()
          end;
          Js.Promise.resolve ()
      | None ->
          S.set (fun st -> { st with S.editing = None });
          Js.Promise.resolve ())

let undo () =
  cancel_pending_save ();
  match !Runtime.current_repo with
  | Some repo ->
      (let* _ = Runtime.invoke1 "thread-api/undo-redo-undo" (Wire.String repo) in
      let* () = refresh_page () in
      resync_open_editor ~force:true ())
      |> Js.Promise.catch (fun e ->
             Platform.console_error ("undo failed", e);
             Toast.error (I18n.t "editor/undo-error");
             Js.Promise.resolve ())
  | None -> Js.Promise.resolve ()

let redo () =
  cancel_pending_save ();
  match !Runtime.current_repo with
  | Some repo ->
      (let* _ = Runtime.invoke1 "thread-api/undo-redo-redo" (Wire.String repo) in
      let* () = refresh_page () in
      resync_open_editor ~force:true ())
      |> Js.Promise.catch (fun e ->
             Platform.console_error ("redo failed", e);
             Toast.error (I18n.t "editor/redo-error");
             Js.Promise.resolve ())
  | None -> Js.Promise.resolve ()

(* sdk bridge (and other non-editor mutation paths) refresh the view
   through this Runtime hook *)
let () = Runtime.refresh_after_ops := (fun () -> refresh_page ())
