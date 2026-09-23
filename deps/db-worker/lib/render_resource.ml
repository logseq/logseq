(* :thread-api/get-render-snapshots — port of
   src/main/frontend/worker/handler/render_resource/{common,basic,property,
   query,view,engine}.cljs.

   Maintainer wiring — Worker_core.init must force-link this module:
     ignore Render_resource.get_render_snapshots;
*)

open Datascript

let kw s = Wire.Keyword s

(* cljs fail!/handler fail — Dispatcher.Exn_info carries (message, data) *)
let fail msg data = raise (Dispatcher.Exn_info (msg, data))

(* runtime context passed to renderers — cljs {:repo repo} *)
type runtime = { repo : string option }

(* ==================== common.cljs ==================== *)

(* cljs ::watch-all sentinel vs a set of watch keys. *)
type watch =
  | Watch_all
  | Watch_keys of Wire.t list

let wkey (parts : Wire.t list) : Wire.t = Wire.Array parts
let wk1 (tag : string) (a : Wire.t) : Wire.t = wkey [ kw tag; a ]
let watch_entity (u : string) : Wire.t = wk1 "entity" (Wire.Uuid u)
let watch_attr (a : string) : Wire.t = wk1 "attr" (kw a)
let watch_union (a : watch) (b : watch) : watch =
  match a, b with
  | Watch_all, _ | _, Watch_all -> Watch_all
  | Watch_keys xs, Watch_keys ys -> Watch_keys (xs @ ys)

let watch_unions (ws : watch list) : watch =
  List.fold_left watch_union (Watch_keys []) ws

let watch_of_ents (uuids : string list) : watch =
  Watch_keys (List.map watch_entity uuids)

(* invalid-resource-key-value — fn? cannot appear on the wire; entities
   arrive as the datascript/Entity tag used elsewhere in this lib. *)
let rec invalid_resource_key_value (v : Wire.t) : Wire.t option =
  match v with
  | Wire.Tagged ("datascript/Entity", _) -> Some (kw "entity")
  | Wire.Map kvs ->
      List.find_map
        (fun (k, x) ->
          match invalid_resource_key_value k with
          | Some _ as r -> r
          | None -> invalid_resource_key_value x)
        kvs
  | Wire.Array xs | Wire.List xs | Wire.Set xs ->
      List.find_map invalid_resource_key_value xs
  | _ -> None

let require_shape ~(shape : string) ~(size : int) (key : Wire.t list) : unit =
  match key with
  | Wire.Keyword tag :: _ when tag = shape && List.length key = size -> ()
  | _ ->
      fail "Invalid renderer resource key"
        [ (kw "resource-key", Wire.Array key)
        ; (kw "expected-tag", kw shape)
        ; (kw "expected-size", Wire.Int size) ]

let require_uuid (label : string) (v : Wire.t) : string =
  match v with
  | Wire.Uuid u -> u
  | _ -> fail "Invalid renderer resource UUID" [ (kw label, v) ]

let entity_by_uuid db (label : string) (uuid : string) : entity =
  match entity db (Lookup_ref ("block/uuid", Uuid uuid)) with
  | Some e -> e
  | None -> fail "Missing renderer resource entity" [ (kw label, Wire.Uuid uuid) ]

let entity_uuid db (eid : entity_id) : string =
  match Render_snapshot.eavt_scalar db eid "block/uuid" with
  | Some (Uuid u) -> u
  | _ -> fail "Renderer resource row has no UUID" [ (kw "db-id", Wire.Int eid) ]

let basis_rev db = Render_snapshot.render_basis_rev db

(* {uuid -> block-wire} -> {[:block uuid] {:value block}} *)
let block_slots (blocks : (Wire.t * Wire.t) list) : (Wire.t * Wire.t) list =
  List.map
    (fun (u, b) -> (wkey [ kw "block"; u ], Wire.Map [ (kw "value", b) ]))
    blocks

let items_wire (rows : Endpoint_block.membership_child list) : Wire.t =
  Wire.Array
    (List.map
       (fun (r : Endpoint_block.membership_child) ->
         Wire.Array [ Wire.Uuid r.mc_uuid; Wire.String r.mc_order ])
       rows)

(* {uuid -> {:parent-tx-id :items}} -> {[:children uuid] {:tx-id :items}} *)
let children_slots
    (children : (string * (int * Endpoint_block.membership_child list)) list)
    : (Wire.t * Wire.t) list =
  List.map
    (fun (u, (tx_id, rows)) ->
      ( wkey [ kw "children"; Wire.Uuid u ]
      , Wire.Map [ (kw "tx-id", Wire.Int tx_id); (kw "items", items_wire rows) ]
      ))
    children

(* ==================== helpers ==================== *)

let uuid_of (e : entity) : string =
  match Ldb.value e "block/uuid" with
  | Some (Uuid u) -> u
  | _ -> invalid_arg "entity missing block/uuid"

(* ==================== basic.cljs ==================== *)

(* select-keys over an entity-plus entity; db/id comes from the entity
   record, and :block/title / :block/raw-title go through the entity-plus
   lookups (id-ref resolution / journal title). *)
let sidebar_page_summary (page : entity) : Wire.t =
  let get a =
    match a with
    | "block/title" ->
        Option.map (fun s -> String s) (Db_content.block_title page)
    | "block/raw-title" -> Ldb.raw_title page.db page
    | _ -> Ldb.value page a
  in
  let pairs =
    List.filter_map
      (fun a ->
        match get a with
        | Some v -> Some (kw a, Ds_wire.transit_of_value v)
        | None -> None)
      [ "block/uuid"; "block/title"; "block/raw-title"; "block/name"
      ; "block/journal-day"; "logseq.property/icon"; "logseq.property.asset/type" ]
  in
  let pairs = (kw "db/id", Wire.Int page.id) :: pairs in
  let tags =
    Ldb.ref_ents page "block/tags"
    |> List.map (fun (tag : entity) ->
           Wire.Map
             (List.filter_map
                (fun a ->
                  match a with
                  | "db/id" -> Some (kw a, Wire.Int tag.id)
                  | _ -> (
                      match Ldb.value tag a with
                      | Some v -> Some (kw a, Ds_wire.transit_of_value v)
                      | None -> None))
                [ "db/id"; "db/ident"; "logseq.property/icon" ]))
  in
  Wire.Map
    (if tags = [] then pairs else pairs @ [ (kw "block/tags", Wire.Array tags) ])

let favorites_page_name = "$$$favorites"

let favorites_page db : entity =
  match Ldb.get_page db (String favorites_page_name) with
  | Some p -> p
  | None -> fail "Missing favorites page" []

let favorite_targets db : entity list =
  let page = favorites_page db in
  Ldb.get_page_blocks db page.id
  (* ldb/sort-by-order on pulled blocks *)
  |> List.sort (fun (a : pulled_entity) (b : pulled_entity) ->
         let ord p =
           match List.assoc_opt (Keyword "block/order") p.pulled_attrs with
           | Some (Pulled_scalar (String s)) -> s
           | _ -> ""
         in
         String.compare (ord a) (ord b))
  |> List.filter_map (fun (p : pulled_entity) ->
         match List.assoc_opt (Keyword "block/link") p.pulled_attrs with
         | Some (Pulled_entity t) -> Ldb.ent_of_id db t.pulled_id
         | Some (Pulled_scalar (Ref id)) | Some (Pulled_scalar (Int id)) ->
             Ldb.ent_of_id db id
         | _ -> None)
  |> List.filter (fun (e : entity) -> not (Ldb.recycled e))

let render_favorites db _key _runtime =
  let page_uuid = uuid_of (favorites_page db) in
  let targets = favorite_targets db in
  ( watch_union
      (Watch_keys [ wk1 "children" (Wire.Uuid page_uuid); watch_attr "block/link" ])
      (watch_of_ents (List.map uuid_of targets))
  , Wire.Array (List.map sidebar_page_summary targets) )

let render_favorite_status db key _runtime =
  let page_uuid = require_uuid "page-uuid" (List.nth key 1) in
  let fav_uuid = uuid_of (favorites_page db) in
  ( Watch_keys [ wk1 "children" (Wire.Uuid fav_uuid); watch_attr "block/link" ]
  , Wire.Bool
      (List.exists (fun (t : entity) -> uuid_of t = page_uuid)
         (favorite_targets db)) )

let render_recent_pages db key _runtime =
  let page_ids =
    match List.nth key 1 with
    | Wire.Array ids
      when List.for_all (function Wire.Int _ -> true | _ -> false) ids ->
        List.map (function Wire.Int i -> i | _ -> 0) ids
    | v -> fail "Invalid recent page IDs" [ (kw "page-ids", v) ]
  in
  let pages =
    page_ids
    |> List.fold_left (fun acc id -> if List.mem id acc then acc else acc @ [ id ]) []
    |> (fun l -> if List.length l > 20 then List.filteri (fun i _ -> i < 20) l else l)
    |> List.filter_map (fun id -> Ldb.ent_of_id db id)
    |> List.filter (fun e -> Ldb.is_page e)
    |> List.filter (fun e -> not (Ldb.hidden e))
    |> List.filter (fun (e : entity) ->
           not
             ((Ldb.is_property e
               && Ldb.value e "logseq.property/hide?" = Some (Bool true))
              || (match Ldb.string_value e "block/title" with
                  | Some t -> Unicode.trim t = ""
                  | None -> true)))
  in
  ( watch_of_ents (List.map uuid_of pages)
  , Wire.Array (List.map sidebar_page_summary pages) )

let render_page_identity db key _runtime =
  let lookup =
    match List.nth key 1 with
    | (Wire.Uuid _) as v -> v
    | Wire.String s when Unicode.trim s <> "" -> Wire.String s
    | v -> fail "Invalid page identity lookup" [ (kw "lookup", v) ]
  in
  let watch_lookup =
    match lookup with
    | Wire.String s -> Wire.String (Ldb.page_name_sanity_lc s)
    | v -> v
  in
  ( Watch_keys [ wk1 "page-lookup" watch_lookup ]
  , match Ldb.get_page db (Ds_wire.value_of_transit lookup) with
    | Some p -> Wire.Uuid (uuid_of p)
    | None -> Wire.Nil )

let render_page_preview_source db key _runtime =
  let page_uuid = require_uuid "page-uuid" (List.nth key 1) in
  let page = entity_by_uuid db "page-uuid" page_uuid in
  let source =
    match Ldb.get_alias_source_page db page.id with
    | Some s -> s
    | None -> page
  in
  ( Watch_keys [ watch_entity page_uuid; watch_attr "block/alias" ]
  , Wire.Uuid (entity_uuid db source.id) )

(* breadcrumb-ref-titles — refs of the block plus each crumb map. *)
let breadcrumb_ref_titles (block : entity)
    (crumbs : (attr * value) list list) : (Wire.t * Wire.t) list =
  let titles = Hashtbl.create 17 in
  let add_ref (uuid_v, title_v) =
    match uuid_v with
    | Some (Uuid u) -> (
        match title_v with
        | Some (String t) -> Hashtbl.replace titles u t
        | _ ->
            fail "Invalid breadcrumb reference title"
              [ (kw "ref-uuid", Wire.Uuid u)
              ; ( kw "title"
                , match title_v with
                  | Some v -> Ds_wire.transit_of_value v
                  | None -> Wire.Nil ) ])
    | _ -> ()
  in
  (* entity block refs *)
  List.iter
    (fun (r : entity) ->
      add_ref (Ldb.value r "block/uuid", Ldb.value r "block/title"))
    (Ldb.ref_ents block "block/refs");
  (* crumb map refs: :block/refs -> Vector of Map values *)
  List.iter
    (fun (crumb : (attr * value) list) ->
      match List.assoc_opt "block/refs" crumb with
      | Some (Vector refs) | Some (List refs) | Some (Set refs) ->
          List.iter
            (fun rv ->
              match rv with
              | Map kvs ->
                  add_ref
                    ( List.assoc_opt (Keyword "block/uuid") kvs
                    , List.assoc_opt (Keyword "block/title") kvs )
              | _ -> ())
            refs
      | _ -> ())
    crumbs;
  Hashtbl.fold (fun u t acc -> (Wire.Uuid u, Wire.String t) :: acc) titles []

let empty_block_breadcrumb block_uuid =
  Wire.Map
    [ (kw "target-uuid", Wire.Uuid block_uuid)
    ; (kw "ancestor-uuids", Wire.Array [])
    ; (kw "ancestors", Wire.Array [])
    ; (kw "ref-titles", Wire.Map []) ]

let render_block_breadcrumb db key _runtime =
  let block_uuid = require_uuid "block-uuid" (List.nth key 1) in
  (match List.nth key 2 with
   | Wire.Int n when n > 0 -> ()
   | v -> fail "Invalid breadcrumb load depth" [ (kw "load-depth", v) ]);
  let load_depth =
    match List.nth key 2 with Wire.Int n -> n | _ -> 0
  in
  match entity db (Lookup_ref ("block/uuid", Uuid block_uuid)) with
  | None ->
      ( Watch_keys [ watch_entity block_uuid ]
      , empty_block_breadcrumb block_uuid )
  | Some block ->
      let crumbs =
        Block_breadcrumb.block_breadcrumb ~depth:load_depth db
          (Entity_view.of_entity block)
      in
      let crumb_uuid (crumb : (attr * value) list) =
        match List.assoc_opt "block/uuid" crumb with
        | Some (Uuid u) -> u
        | _ ->
            fail "Invalid breadcrumb ancestor UUID"
              [ (kw "block-uuid", Wire.Uuid block_uuid) ]
      in
      let ancestor_uuids = List.map crumb_uuid crumbs in
      let ref_titles = breadcrumb_ref_titles block crumbs in
      let watch_uuids =
        block_uuid :: ancestor_uuids
        @ List.map (fun (k, _) -> match k with Wire.Uuid u -> u | _ -> "") ref_titles
        |> List.filter (fun u -> u <> "")
      in
      ( Watch_keys
          (List.map watch_entity (List.sort_uniq String.compare watch_uuids))
      , Wire.Map
          [ (kw "target-uuid", Wire.Uuid block_uuid)
          ; ( kw "ancestor-uuids"
            , Wire.Array (List.map (fun u -> Wire.Uuid u) ancestor_uuids) )
          ; ( kw "ancestors"
            , Wire.Array
                (List.map
                   (fun (crumb : (attr * value) list) ->
                     Wire.Map
                       (List.map
                          (fun (a, v) -> (kw a, Ds_wire.transit_of_value v))
                          crumb))
                   crumbs) )
          ; (kw "ref-titles", Wire.Map ref_titles) ] )

let render_journals db _key _runtime =
  ( Watch_keys [ wkey [ kw "journals" ] ]
  , Wire.Array
      (List.map (fun (j : entity) -> Wire.Uuid (uuid_of j))
         (List.of_seq (Ldb.get_latest_journals db))) )

let render_recycle_roots db _key _runtime =
  let roots =
    q_string db "[:find [?e ...] :where [?e :logseq.property/deleted-at]]"
    |> List.filter_map (function
           | [ Result_entity id ] -> Ldb.ent_of_id db id
           | _ -> None)
    |> List.sort (fun (a : entity) (b : entity) ->
           let da =
             match Ldb.value a "logseq.property/deleted-at" with
             | Some (Int n) -> n
             | _ -> 0
           and db_ =
             match Ldb.value b "logseq.property/deleted-at" with
             | Some (Int n) -> n
             | _ -> 0
           in
           compare db_ da)
  in
  let root_uuids = List.map uuid_of roots in
  let canonical =
    Render_snapshot.canonical_blocks db (List.map (fun u -> Wire.Uuid u) root_uuids)
  in
  let blocks =
    match canonical with
    | Wire.Map kvs -> (
        match Plain_value.map_get "blocks" kvs with
        | Some (Wire.Map bm) -> bm
        | _ -> [])
    | _ -> []
  in
  ( Watch_keys [ wkey [ kw "recycle-roots" ] ]
  , Wire.Array
      (List.map
         (fun u ->
           match
             List.find_opt
               (fun (k, _) -> k = Wire.Uuid u)
               blocks
           with
           | Some (_, b) -> b
           | None -> Wire.Nil)
         root_uuids) )

let render_property_choices db key _runtime =
  let property_uuid = require_uuid "property-uuid" (List.nth key 1) in
  let property = entity_by_uuid db "property-uuid" property_uuid in
  let dmap = Endpoint_property.display_property_map db property in
  let choices =
    match dmap with
    | Wire.Map kvs -> (
        match Plain_value.map_get "property/closed-values" kvs with
        | Some (Wire.Array xs) | Some (Wire.List xs) -> xs
        | _ -> [])
    | _ -> []
  in
  let choice_uuid c =
    match c with
    | Wire.Map kvs -> (
        match Plain_value.map_get "block/uuid" kvs with
        | Some (Wire.Uuid u) -> u
        | _ -> require_uuid "choice-uuid" c)
    | _ -> require_uuid "choice-uuid" c
  in
  ( Watch_keys
      ([ watch_entity property_uuid
       ; wk1 "property-membership" (kw "block/closed-value-property") ]
       @ List.map (fun c -> watch_entity (choice_uuid c)) choices)
  , Wire.Array choices )

(* reaction/summarize over wire reaction maps. *)
let summarize_reactions (reactions : Wire.t list) (current_user_uuid : string option)
    : Wire.t =
  let groups : (string, (int * bool * string list)) Hashtbl.t = Hashtbl.create 17 in
  let order : string list ref = ref [] in
  let get_in_path m path =
    match m with
    | Wire.Map kvs -> (
        match path with
        | [ a; b ] -> (
            match Plain_value.map_get a kvs with
            | Some (Wire.Map inner) -> Plain_value.map_get b inner
            | _ -> None)
        | [ a ] -> Plain_value.map_get a kvs
        | _ -> None)
    | _ -> None
  in
  List.iter
    (fun (reaction : Wire.t) ->
      let emoji_id =
        match get_in_path reaction [ "logseq.property.reaction/emoji-id" ] with
        | Some (Wire.String s) -> Some s
        | _ -> None
      in
      match emoji_id with
      | Some emoji -> (
          let user_ref = get_in_path reaction [ "logseq.property/created-by-ref" ] in
          let by_me =
            match user_ref, current_user_uuid with
            | Some (Wire.Map inner), Some cu -> (
                match Plain_value.map_get "block/uuid" inner with
                | Some (Wire.Uuid u) -> u = cu
                | _ -> false)
            | _ -> false
          in
          let username =
            match user_ref with
            | Some (Wire.Map inner) -> (
                match Plain_value.map_get "block/title" inner with
                | Some (Wire.String t) -> Some t
                | _ -> None)
            | _ -> None
          in
          let count, reacted, usernames =
            Option.value (Hashtbl.find_opt groups emoji) ~default:(0, false, [])
          in
          if not (List.mem emoji !order) then order := !order @ [ emoji ];
          Hashtbl.replace groups emoji
            ( count + 1
            , reacted || by_me
            , match username with
              | Some u when not (List.mem u usernames) -> usernames @ [ u ]
              | _ -> usernames ) )
      | None -> ())
    reactions;
  let rows =
    List.map
      (fun emoji ->
        let count, reacted, usernames = Hashtbl.find groups emoji in
        (emoji, count, reacted, List.sort String.compare usernames))
      !order
    |> List.sort
         (fun (e1, c1, _, _) (e2, c2, _, _) ->
           match compare c2 c1 with 0 -> String.compare e1 e2 | x -> x)
  in
  Wire.Array
    (List.map
       (fun (emoji, count, reacted, usernames) ->
         Wire.Map
           [ (kw "emoji-id", Wire.String emoji)
           ; (kw "count", Wire.Int count)
           ; (kw "reacted-by-me?", Wire.Bool reacted)
           ; ( kw "usernames"
             , if usernames = [] then Wire.Nil
               else Wire.Array (List.map (fun u -> Wire.String u) usernames) )
           ])
       rows)

let render_block_reactions db key _runtime =
  let target_uuid = require_uuid "target-uuid" (List.nth key 1) in
  let current_user_uuid =
    match List.nth key 2 with
    | Wire.Uuid u -> Some u
    | Wire.Nil -> None
    | v -> fail "Invalid reaction user UUID" [ (kw "current-user-uuid", v) ]
  in
  let target = entity_by_uuid db "target-uuid" target_uuid in
  let reactions = Endpoint_block.block_reactions db target.id in
  let reaction_list =
    match reactions with
    | Wire.Array xs | Wire.List xs -> xs
    | _ -> []
  in
  let creator_watch =
    List.filter_map
      (fun (r : Wire.t) ->
        match r with
        | Wire.Map kvs -> (
            match Plain_value.map_get "logseq.property/created-by-ref" kvs with
            | Some (Wire.Map inner) -> (
                match Plain_value.map_get "block/uuid" inner with
                | Some (Wire.Uuid u) -> Some (watch_entity u)
                | _ -> None)
            | _ -> None)
        | _ -> None)
      reaction_list
  in
  ( Watch_keys (wk1 "reactions" (Wire.Uuid target_uuid) :: creator_watch)
  , summarize_reactions reaction_list current_user_uuid )

let render_block_ref_count db key _runtime =
  let block_uuid = require_uuid "block-uuid" (List.nth key 1) in
  let block = entity_by_uuid db "block-uuid" block_uuid in
  ( Watch_keys [ wk1 "refs" (Wire.Uuid block_uuid) ]
  , Wire.Int
      (if Ldb.is_property block || Ldb.is_class block then 0
       else Db_view.get_block_refs_count db block.id) )

(* unlinked-reference-exists? — needs full-text search (Render_deps hook). *)
let unlinked_reference_exists db repo (id : entity_id) : bool =
  match Ldb.ent_of_id db id with
  | None -> false
  | Some block ->
      let title =
        Unicode.lowercase
          (Option.value (Ldb.string_value block "block/title") ~default:"")
      in
      let result = Render_deps.search_blocks ~repo ~db title 100 in
      List.exists
        (fun (cand : entity) ->
          let cand =
            match Ldb.ent_of_id db cand.id with
            | Some c -> c
            | None -> cand
          in
          cand.id <> id
          && not (List.mem id (Ldb.ref_ids cand "block/refs"))
          && (match Ldb.string_value cand "block/title" with
              | Some t ->
                  let t' = Unicode.lowercase t in
                  if String.length title = 0 then String.length t' = 0
                  else
                    (* string/includes? *)
                    (match
                       let lt = String.length t' and ls = String.length title in
                       if ls > lt then None
                       else
                         let rec find i =
                           if i + ls > lt then None
                           else if String.sub t' i ls = title then Some i
                           else find (i + 1)
                         in
                         find 0
                     with
                     | Some _ -> true
                     | None -> false)
              | None -> false))
        result

let render_block_unlinked_ref_exists db key runtime =
  let block_uuid = require_uuid "block-uuid" (List.nth key 1) in
  let block = entity_by_uuid db "block-uuid" block_uuid in
  ( Watch_keys []
  , Wire.Bool
      (unlinked_reference_exists db
         (Option.value runtime.repo ~default:"")
         block.id) )

(* block-comment-threads — get-comment-threads-for-block inlined:
   find live Comments-class children of the block's comments area(s). *)
let get_comment_threads_for_block db (block_uuid : string) : Wire.t list =
  let rows =
    q_string db
      ~inputs:[ Arg_scalar (Result_value (Uuid block_uuid)) ]
      "[:find [?comments-area ...] \
        :in $ ?block-uuid \
        :where \
        [?block :block/uuid ?block-uuid] \
        [?comments-area :logseq.property.comments/blocks ?block] \
        [?comments-area :block/tags :logseq.class/Comments] \
        [(missing? $ ?comments-area :logseq.property/deleted-at)]]"
  in
  List.filter_map
    (function
      | [ Result_entity id ] -> (
          match Ldb.ent_of_id db id with
          | Some e -> Endpoint_comment.block_map_with_children db e
          | None -> None)
      | _ -> None)
    rows

let pulled_order (m : Wire.t) : string =
  match m with
  | Wire.Map kvs -> (
      match Plain_value.map_get "block/order" kvs with
      | Some (Wire.String s) -> s
      | _ -> "")
  | _ -> ""

let render_block_comment_threads db key _runtime =
  let block_uuid = require_uuid "block-uuid" (List.nth key 1) in
  ignore (entity_by_uuid db "block-uuid" block_uuid);
  let threads =
    get_comment_threads_for_block db block_uuid
    |> List.sort (fun a b -> String.compare (pulled_order a) (pulled_order b))
    |> List.map (fun m ->
           match m with
           | Wire.Map kvs -> (
               match Plain_value.map_get "block/uuid" kvs with
               | Some (Wire.Uuid u) -> Wire.Uuid u
               | _ -> fail "Invalid renderer resource UUID"
                        [ (kw "comment-thread-uuid", Wire.Nil) ])
           | _ -> fail "Invalid renderer resource UUID"
                    [ (kw "comment-thread-uuid", m) ])
  in
  ( Watch_keys [ wk1 "comments" (Wire.Uuid block_uuid) ]
  , Wire.Array threads )

(* direct-child-entities — children uuids of direct-children-membership *)
let direct_child_entities db (uuid : string) : entity list =
  match Endpoint_block.direct_children_membership db uuid with
  | Wire.Map kvs -> (
      match Plain_value.map_get "items" kvs with
      | Some (Wire.Array items) | Some (Wire.List items) ->
          List.map
            (fun item ->
              match item with
              | Wire.Array (Wire.Uuid u :: _) -> entity_by_uuid db "child-uuid" u
              | _ -> fail "Invalid renderer resource UUID" [ (kw "child-uuid", item) ])
            items
      | _ -> [])
  | _ -> []

let comment_thread (e : entity) : bool =
  List.exists
    (fun (t : entity) -> Ldb.ident_of t = Some "logseq.class/Comments")
    (Ldb.ref_ents e "block/tags")

let comment_author_title (comment_block : entity) : Wire.t =
  match Ldb.ref_ent comment_block "logseq.property/created-by-ref" with
  | Some author -> (
      match Ldb.string_value author "block/title" with
      | Some t when Unicode.trim t <> "" -> Wire.String (Unicode.trim t)
      | _ -> Wire.Nil)
  | None -> Wire.Nil

let comment_author_uuid db (comment_block : entity) : string option =
  match Ldb.ref_ent comment_block "logseq.property/created-by-ref" with
  | Some author -> Some (entity_uuid db author.id)
  | None -> None

let render_block_comment_summary db key _runtime =
  let thread_uuid = require_uuid "thread-uuid" (List.nth key 1) in
  let thread = entity_by_uuid db "thread-uuid" thread_uuid in
  if not (comment_thread thread) then
    fail "Renderer resource entity is not a comment thread"
      [ (kw "thread-uuid", Wire.Uuid thread_uuid) ];
  let comments = direct_child_entities db thread_uuid in
  (* created-at is an int64-range instant; on JS it reads back as
     Instant because int only holds 32 bits. *)
  let created_at_ms (e : entity) : int64 option =
    match Ldb.value e "block/created-at" with
    | Some (Int n) -> Some (Int64.of_int n)
    | Some (Instant ms) -> Some ms
    | None -> None
    | Some v ->
        fail "Invalid comment creation time"
          [ ( kw "comment-uuid"
            , Option.value
                (Option.map (fun u -> Wire.Uuid u)
                   (match Ldb.value e "block/uuid" with
                    | Some (Uuid u) -> Some u
                    | _ -> None))
                ~default:Wire.Nil )
          ; (kw "created-at", Ds_wire.transit_of_value v) ]
  in
  List.iter (fun c -> ignore (created_at_ms c)) comments;
  let sorted =
    List.sort
      (fun (a : entity) (b : entity) ->
        Int64.compare
          (Option.value (created_at_ms a) ~default:Int64.zero)
          (Option.value (created_at_ms b) ~default:Int64.zero))
      comments
  in
  let latest = match List.rev sorted with l :: _ -> Some l | [] -> None in
  let watch_uuids =
    thread_uuid
    :: List.map (fun (c : entity) -> entity_uuid db c.id) comments
    @ List.filter_map (comment_author_uuid db) comments
  in
  ( Watch_keys
      (wk1 "children" (Wire.Uuid thread_uuid)
       :: List.map watch_entity (List.sort_uniq String.compare watch_uuids))
  , Wire.Map
      [ (kw "count", Wire.Int (List.length comments))
      ; ( kw "latest-author"
        , match latest with
          | Some l -> comment_author_title l
          | None -> Wire.Nil )
      ; ( kw "latest-created-at"
        , match latest with
          | Some l -> (
              match Ldb.value l "block/created-at" with
              | Some v -> Ds_wire.transit_of_value v
              | None -> Wire.Nil)
          | None -> Wire.Nil ) ] )

let render_block_task_time db key _runtime =
  let block_uuid = require_uuid "block-uuid" (List.nth key 1) in
  let block = entity_by_uuid db "block-uuid" block_uuid in
  let now_ms = Clock.now_ms () in
  let history_items, seconds =
    match Endpoint_query.task_spent_time_impl db block.id now_ms with
    | Wire.Array [ Wire.Array items; Wire.Int s ] -> (items, s)
    | _ -> ([], 0)
  in
  ( Watch_keys [ wk1 "task-time" (Wire.Uuid block_uuid) ]
  , Wire.Map
      [ ( kw "history"
        , Wire.Array
            (List.map
               (fun item ->
                 match item with
                 | Wire.Map kvs ->
                     Wire.Map
                       [ ( kw "created-at"
                         , Option.value
                             (Plain_value.map_get "block/created-at" kvs)
                             ~default:Wire.Nil )
                       ; ( kw "status-uuid"
                         , Wire.Uuid
                             (require_uuid "status-uuid"
                                (Option.value
                                   (Plain_value.map_get
                                      "logseq.property.history/ref-value-uuid"
                                      kvs)
                                   ~default:Wire.Nil)) ) ]
                 | _ -> item)
               history_items) )
      ; (kw "seconds", Wire.Int seconds) ] )

let render_route_block db key _runtime =
  let page_lookup =
    match List.nth key 1 with
    | Wire.String s when Unicode.trim s <> "" -> s
    | v -> fail "Invalid route page lookup" [ (kw "page-lookup", v) ]
  in
  let route_name =
    match List.nth key 2 with
    | Wire.String s when Unicode.trim s <> "" -> s
    | v -> fail "Invalid block route name" [ (kw "route-name", v) ]
  in
  let normalized = Ldb.page_name_sanity_lc page_lookup in
  let resolution = Db_content.block_route_resolution db (String page_lookup) route_name in
  let page_uuid, block_uuid, referenced =
    match resolution with
    | Some { Db_content.page; candidates; block } ->
        let block_uuid =
          match block with
          | Some b -> Some (entity_uuid db b.id)
          | None -> None
        in
        let referenced =
          List.concat_map
            (fun (c : entity) ->
              Ldb.ref_ents c "block/tags" @ Ldb.ref_ents c "block/refs")
            candidates
          |> List.map (fun (r : entity) -> entity_uuid db r.id)
        in
        (Some (uuid_of page), block_uuid, referenced)
    | None -> (None, None, [])
  in
  ( (match page_uuid with
     | Some pu ->
         Watch_keys
           (wk1 "page-lookup" (Wire.String normalized)
            :: watch_entity pu
            :: wk1 "route-page" (Wire.Uuid pu)
            :: List.map watch_entity
                 (List.sort_uniq String.compare referenced))
     | None -> Watch_keys [ wk1 "page-lookup" (Wire.String normalized) ])
  , match block_uuid with Some u -> Wire.Uuid u | None -> Wire.Nil )

let tagged_with_page (child : entity) (page_id : entity_id) : bool =
  List.exists (fun (t : entity) -> t.id = page_id) (Ldb.ref_ents child "block/tags")

let render_page_membership db key _runtime =
  let page_uuid = require_uuid "page-uuid" (List.nth key 1) in
  let page = entity_by_uuid db "page-uuid" page_uuid in
  let membership_kind = List.nth key 2 in
  let children = direct_child_entities db page_uuid in
  match membership_kind with
  | Wire.Keyword "class" ->
      require_shape ~shape:"page-membership" ~size:3 key;
      ( Watch_keys
          [ watch_entity page_uuid
          ; wk1 "children" (Wire.Uuid page_uuid)
          ; wk1 "class-membership" (Wire.Uuid page_uuid) ]
      , Wire.Array
          (List.filter_map
             (fun (c : entity) ->
               if Ldb.is_class page && tagged_with_page c page.id then None
               else Some (Wire.Uuid (uuid_of c)))
             children) )
  | Wire.Keyword "property" ->
      require_shape ~shape:"page-membership" ~size:3 key;
      if not (Ldb.is_property page) then
        fail "Page membership target is not a property"
          [ (kw "page-uuid", Wire.Uuid page_uuid) ];
      let property_ident =
        match Ldb.ident_of page with
        | Some i -> i
        | None -> fail "Invalid view" [ (kw "page-uuid", Wire.Uuid page_uuid) ]
      in
      ( Watch_keys
          [ watch_entity page_uuid
          ; wk1 "children" (Wire.Uuid page_uuid)
          ; wk1 "property-membership" (kw property_ident) ]
      , Wire.Array
          (List.filter_map
             (fun (c : entity) ->
               match Endpoint_property.entity_direct_value db c.id property_ident with
               | Some _ -> None
               | None -> Some (Wire.Uuid (uuid_of c)))
             children) )
  | Wire.Keyword "quick-add" ->
      require_shape ~shape:"page-membership" ~size:4 key;
      (match Ldb.string_value page "block/title" with
       | Some t when t = Ldb.quick_add_page_name -> ()
       | _ ->
           fail "Page membership target is not quick add"
             [ (kw "page-uuid", Wire.Uuid page_uuid) ]);
      let current_user_uuid = require_uuid "current-user-uuid" (List.nth key 3) in
      let current_user = entity_by_uuid db "current-user-uuid" current_user_uuid in
      ( Watch_keys
          [ watch_entity page_uuid
          ; wk1 "children" (Wire.Uuid page_uuid)
          ; watch_attr "logseq.property/created-by-ref" ]
      , Wire.Array
          (List.filter_map
             (fun (c : entity) ->
               match
                 Endpoint_property.entity_direct_value db c.id
                   "logseq.property/created-by-ref"
               with
               | None -> Some (Wire.Uuid (uuid_of c))
               | Some (Ref id) | Some (Int id) ->
                   if id = current_user.id then Some (Wire.Uuid (uuid_of c))
                   else None
               | Some _ -> None)
             children) )
  | k ->
      fail "Unsupported page membership kind"
        [ (kw "membership-kind", k); (kw "resource-key", Wire.Array key) ]

(* ==================== property.cljs ==================== *)

let display_context_keys =
  [ "gallery-view?"; "page-title?"; "sidebar-properties?"; "tag-dialog?"
  ; "publishing?"; "state-hide-empty-properties?"; "show-empty-and-hidden-properties?" ]

let require_display_context (context : Wire.t) : (string * bool) list =
  match context with
  | Wire.Map kvs
    when List.length kvs = 7
         && List.for_all
              (fun (k, v) ->
                match k, v with
                | Wire.Keyword k', Wire.Bool _ when List.mem k' display_context_keys ->
                    true
                | _ -> false)
              kvs ->
      List.map
        (fun (k, v) ->
          match k, v with
          | Wire.Keyword k', Wire.Bool b -> (k', b)
          | _ -> assert false)
        kvs
  | _ ->
      fail "Invalid block display properties context" [ (kw "context", context) ]

(* normalize-entity-value — returns (normalized wire, uuid list) *)
let rec normalize_entity_value (v : Wire.t) : Wire.t * string list =
  match v with
  | Wire.Map kvs -> (
      match Plain_value.map_get "block/uuid" kvs with
      | Some (Wire.Uuid u) -> (Wire.Uuid u, [ u ])
      | _ ->
          fail "Renderer property value has no UUID" [ (kw "value", v) ])
  | Wire.Set xs ->
      let items, uuids = normalize_coll xs in
      (Wire.Set items, uuids)
  | Wire.Array xs | Wire.List xs ->
      let items, uuids = normalize_coll xs in
      (Wire.Array items, uuids)
  | _ -> (v, [])

and normalize_coll (xs : Wire.t list) : Wire.t list * string list =
  List.fold_left
    (fun (items, uuids) x ->
      let x', u' = normalize_entity_value x in
      (items @ [ x' ], uuids @ u'))
    ([], []) xs

let normalize_display_property_row (row : Wire.t) : Wire.t * Wire.t list =
  match row with
  | Wire.Map kvs ->
      let property =
        Option.value (Plain_value.map_get "property" kvs) ~default:Wire.Nil
      in
      let value = Option.value (Plain_value.map_get "value" kvs) ~default:Wire.Nil in
      let property_uuid =
        match property with
        | Wire.Map pkvs ->
            require_uuid "property-uuid"
              (Option.value (Plain_value.map_get "block/uuid" pkvs)
                 ~default:Wire.Nil)
        | _ -> require_uuid "property-uuid" property
      in
      let property_ident =
        match property with
        | Wire.Map pkvs -> (
            match Plain_value.map_get "db/ident" pkvs with
            | Some (Wire.Keyword _ as i) -> i
            | _ ->
                fail "Renderer property has no ident"
                  [ (kw "property-uuid", Wire.Uuid property_uuid) ])
        | _ ->
            fail "Renderer property has no ident"
              [ (kw "property-uuid", Wire.Uuid property_uuid) ]
      in
      let closed_value_uuids =
        match property with
        | Wire.Map pkvs -> (
            match Plain_value.map_get "property/closed-values" pkvs with
            | Some (Wire.Array cvs) | Some (Wire.List cvs) ->
                List.map
                  (fun cv ->
                    match cv with
                    | Wire.Map ckvs ->
                        Wire.Uuid
                          (require_uuid "closed-value-uuid"
                             (Option.value
                                (Plain_value.map_get "block/uuid" ckvs)
                                ~default:Wire.Nil))
                    | _ ->
                        Wire.Uuid
                          (require_uuid "closed-value-uuid" cv))
                  cvs
            | _ -> [])
        | _ -> []
      in
      let normalized_value, value_uuids = normalize_entity_value value in
      let row' =
        Wire.Map
          ([ (kw "property-uuid", Wire.Uuid property_uuid)
           ; (kw "property-ident", property_ident)
           ; (kw "value", normalized_value) ]
           @ if closed_value_uuids = [] then []
             else [ (kw "closed-value-uuids", Wire.Array closed_value_uuids) ])
      in
      let watch =
        watch_entity property_uuid
        :: List.map watch_entity
             (value_uuids
              @ List.map (function Wire.Uuid u -> u | _ -> "") closed_value_uuids)
      in
      (row', watch)
  | _ -> fail "Invalid display property row" [ (kw "row", row) ]

let normalize_display_property_rows (rows : Wire.t list) : Wire.t list * Wire.t list =
  List.fold_left
    (fun (rows', ws) row ->
      let r, w = normalize_display_property_row row in
      (rows' @ [ r ], ws @ w))
    ([], []) rows

let optional_entity_uuid label (v : Wire.t) : Wire.t =
  match v with
  | Wire.Nil -> Wire.Nil
  | Wire.Map kvs ->
      Wire.Uuid
        (require_uuid label
           (Option.value (Plain_value.map_get "block/uuid" kvs) ~default:Wire.Nil))
  | _ -> Wire.Uuid (require_uuid label v)

let render_block_display_properties db key _runtime =
  let block_uuid = require_uuid "block-uuid" (List.nth key 1) in
  let block = entity_by_uuid db "block-uuid" block_uuid in
  let ctx = require_display_context (List.nth key 2) in
  let cget k = List.assoc k ctx in
  let show_empty_and_hidden = cget "show-empty-and-hidden-properties?" in
  let result =
    Display_properties.display_properties db block
      ~gallery_view:(cget "gallery-view?")
      ~page_title:(cget "page-title?")
      ~sidebar_properties:(cget "sidebar-properties?")
      ~tag_dialog:(cget "tag-dialog?")
      ~publishing:(cget "publishing?")
      ~state_hide_empty_properties:(cget "state-hide-empty-properties?")
      ~show_empty_and_hidden_properties:show_empty_and_hidden
  in
  let rows_of k =
    match result with
    | Wire.Map kvs -> (
        match Plain_value.map_get k kvs with
        | Some (Wire.Array xs) | Some (Wire.List xs) -> xs
        | _ -> [])
    | _ -> []
  in
  let full_properties, full_watch = normalize_display_property_rows (rows_of "full-properties") in
  let hidden_properties, hidden_watch =
    normalize_display_property_rows (rows_of "hidden-properties")
  in
  let result_get k =
    match result with
    | Wire.Map kvs -> Option.value (Plain_value.map_get k kvs) ~default:Wire.Nil
    | _ -> Wire.Nil
  in
  ( Watch_keys
      (wk1 "display-properties" (Wire.Uuid block_uuid)
       :: wkey [ kw "class-tree" ]
       :: wkey [ kw "property-config" ]
       :: wk1 "property-membership" (kw "block/closed-value-property")
       :: (full_watch @ hidden_watch))
  , Wire.Map
      [ (kw "full-properties", Wire.Array full_properties)
      ; (kw "hidden-properties", Wire.Array hidden_properties)
      ; ( kw "description-property-uuid"
        , optional_entity_uuid "description-property-uuid"
            (result_get "description-property") )
      ; ( kw "class-properties-property-uuid"
        , optional_entity_uuid "class-properties-property-uuid"
            (result_get "class-properties-property") ) ] )

let render_block_bidirectional_properties db key _runtime =
  let block_uuid = require_uuid "block-uuid" (List.nth key 1) in
  let block = entity_by_uuid db "block-uuid" block_uuid in
  let groups = Ldb.get_bidirectional_properties db block.id in
  ( Watch_keys [ wk1 "bidirectional" (Wire.Uuid block_uuid) ]
  , Wire.Array
      (List.map
         (fun (g : Ldb.bidirectional_group) ->
           Wire.Map
             [ (kw "class-uuid", Wire.Uuid (entity_uuid db g.class_.id))
             ; ( kw "entity-uuids"
               , Wire.Array
                   (List.map (fun (e : entity) -> Wire.Uuid (entity_uuid db e.id))
                      g.entities) ) ])
         groups) )

(* ==================== query.cljs ==================== *)

(* copied transit<->query-form helpers (endpoint_query.ml privates) *)
let rec form_of_wire (t : Wire.t) : query_form =
  match t with
  | Wire.Nil -> QueryFormNil
  | Wire.Bool b -> QueryFormBool b
  | Wire.Int n -> QueryFormInt n
  | Wire.Int64 n -> QueryFormTagged ("inst", QueryFormString (Ds_wire.iso_of_ms n))
  | Wire.Float f -> QueryFormFloat f
  | Wire.String s -> QueryFormString s
  | Wire.Binary s -> QueryFormString s
  | Wire.Keyword s -> QueryFormKeyword s
  | Wire.Symbol s -> QueryFormSymbol s
  | Wire.Big_int s ->
      (try QueryFormInt (int_of_string s)
       with _ -> QueryFormFloat (float_of_string s))
  | Wire.Big_decimal s -> QueryFormFloat (float_of_string s)
  | Wire.Date_ms ms ->
      QueryFormTagged ("inst", QueryFormString (Ds_wire.iso_of_ms ms))
  | Wire.Uuid s -> QueryFormTagged ("uuid", QueryFormString s)
  | Wire.Uri s -> QueryFormString s
  | Wire.Array xs -> QueryFormVector (List.map form_of_wire xs)
  | Wire.List xs -> QueryFormList (List.map form_of_wire xs)
  | Wire.Set xs -> QueryFormSet (List.map form_of_wire xs)
  | Wire.Map kvs ->
      QueryFormMap (List.map (fun (k, v) -> (form_of_wire k, form_of_wire v)) kvs)
  | Wire.Tagged (tag, rep) -> QueryFormTagged (tag, form_of_wire rep)

let rec value_of_form (f : query_form) : value =
  match f with
  | QueryFormNil -> Nil
  | QueryFormBool b -> Bool b
  | QueryFormInt n -> Int n
  | QueryFormFloat x -> Float x
  | QueryFormString s -> String s
  | QueryFormKeyword k -> Keyword k
  | QueryFormSymbol s -> Symbol s
  | QueryFormVector xs -> Vector (List.map value_of_form xs)
  | QueryFormList xs -> List (List.map value_of_form xs)
  | QueryFormSet xs -> Set (List.map value_of_form xs)
  | QueryFormMap kvs -> Map (List.map (fun (k, v) -> (value_of_form k, value_of_form v)) kvs)
  | QueryFormTagged ("uuid", QueryFormString s) -> Uuid s
  | QueryFormTagged ("regex", QueryFormString s) -> Regex s
  | QueryFormTagged ("inst", QueryFormString s) ->
      (match Date_time_util.epoch_ms_of_iso s with
       | Some ms -> Instant ms
       | None -> String s)
  | QueryFormTagged (_, f) -> value_of_form f

(* cljs resolve-input passes values through unchanged — a keyword input is a
   keyword value, an eid a number. The engine equates Int with Ref when
   matching datom values, and resolves QValue keywords to attrs in attribute
   position. Result_attr/Result_entity inputs must not be used here: the
   engine drops them when the bound var is substituted into value position. *)
let result_arg (v : value) : query_arg = Arg_scalar (Result_value v)

let query_input_value (t : Wire.t) : value =
  match t with
  | Wire.String s when not (Page_ref.is_page_ref s) ->
      (match (try Some (Parser.read_edn s) with _ -> None) with
       | Some (QueryFormSymbol _) -> String s
       | Some _ when String.length s > 0 && s.[0] = '\\' -> String s
       | Some f -> value_of_form f
       | None -> String s)
  | t -> Ds_wire.value_of_transit t

let resolve_page_ref_equality (form : query_form) : query_form =
  let is_page_ref_str = function
    | QueryFormString s -> Page_ref.is_page_ref s
    | _ -> false
  in
  Db_query_dsl.postwalk
    (fun f ->
      match f with
      | QueryFormList [ QueryFormSymbol "="; left; right ]
          when is_page_ref_str left || is_page_ref_str right ->
          let page_reference, sym_f =
            if is_page_ref_str left then (left, right) else (right, left)
          in
          let name =
            match page_reference with
            | QueryFormString s ->
                let lowered = Unicode.lowercase s in
                (match Page_ref.get_page_name lowered with
                 | Some n -> n
                 | None -> lowered)
            | _ -> assert false
          in
          QueryFormList
            [ QueryFormSymbol "contains?"; sym_f; QueryFormString name ]
      | f -> f)
    form

let query_current_page_title (db : db) (ctx : (Wire.t * Wire.t) list) : string option =
  let get k = List.assoc_opt (Wire.Keyword k) ctx in
  match get "current-page-title" with
  | Some (Wire.String t) when Unicode.trim t <> "" -> Some t
  | _ ->
      let block_title =
        match get "current-block-uuid" with
        | Some v -> (
            match Ds_wire.value_of_transit v with
            | Uuid u -> (
                match entity db (Lookup_ref ("block/uuid", Uuid u)) with
                | Some block -> (
                    match Entity_refs.ref_ent block "block/page" with
                    | Some page -> Ldb.string_value page "block/title"
                    | None -> None)
                | None -> None)
            | _ -> None)
        | None -> None
      in
      (match block_title with
       | Some t -> Some t
       | None ->
           (match get "current-page" with
            | Some v -> (
                match Ldb.get_page db (Ds_wire.value_of_transit v) with
                | Some page -> Ldb.string_value page "block/title"
                | None -> None)
            | None -> None))

let resolve_custom_query_input (db : db) (input : Wire.t)
    (ctx : (Wire.t * Wire.t) list) : value =
  let get k = List.assoc_opt (Wire.Keyword k) ctx in
  let current_block_uuid =
    match get "current-block-uuid" with
    | Some (Wire.Uuid u) -> Some u
    | Some (Wire.String s) -> Some s
    | _ -> None
  in
  let today_day =
    match get "today-day" with Some (Wire.Int n) -> Some n | _ -> None
  in
  let require_today_day =
    match get "require-today-day?" with
    | Some (Wire.Bool b) -> b
    | _ -> false
  in
  let resolved_input = query_input_value input in
  let current_page_title = query_current_page_title db ctx in
  (match resolved_input with
   | Keyword "today" ->
       if require_today_day && Option.is_none today_day then
         raise (Dispatcher.Exn_info ("Query today input requires :today-day", []))
   | Keyword "current-page" ->
       if Option.is_none current_page_title then
         raise
           (Dispatcher.Exn_info
              ("Query current-page input requires a current page", []))
   | Keyword ("query-page" | "current-block" | "parent-block") ->
       if Option.is_none current_block_uuid then
         raise
           (Dispatcher.Exn_info
              ( "Query block input requires :current-block-uuid"
              , [ (kw "input", Ds_wire.transit_of_value resolved_input) ] ))
   | _ -> ());
  match resolved_input, today_day with
  | Keyword "today", Some day -> Int day
  | _ ->
      Db_inputs.resolve_input db resolved_input
        { Db_inputs.current_block_uuid = current_block_uuid
        ; current_page_fn = (fun () -> current_page_title) }

let add_query_rules (query : query_form list) (user_rules : query_form list)
    : query_form list * query_form list * bool =
  let sections = Db_query_dsl.query_map_sections query in
  let section k =
    Option.value
      (Option.map snd (List.find_opt (fun (k', _) -> k' = Some k) sections))
      ~default:[]
  in
  let where = section "where" and in_ = section "in" in
  let rules_found =
    Db_query_dsl.find_rules_in_where where
      (List.map fst Db_query_dsl.db_query_dsl_rules)
  in
  let built_in = Db_query_dsl.extract_rules rules_found in
  let rules_input =
    Db_query_dsl.distinct_preserve_order (user_rules @ built_in)
  in
  let has_pct =
    List.exists (function QueryFormSymbol "%" -> true | _ -> false) in_
  in
  let rules_required = rules_input <> [] || has_pct in
  let query_with_rules =
    if rules_required && not has_pct then
      if List.exists (fun (k, _) -> k = Some "in") sections then
        Db_query_dsl.add_to_end_of_query_section query "in" [ QueryFormSymbol "%" ]
      else
        query @ [ QueryFormKeyword "in"; QueryFormSymbol "$"; QueryFormSymbol "%" ]
    else query
  in
  (query_with_rules, rules_input, rules_required)

(* execute-custom-query returning typed rows (the wire-level endpoint
   version flattens Result_entity to Int, losing the entity/int
   distinction normalize-query-cell relies on). *)
let execute_custom_query_typed (db : db) (query_forms : query_form list)
    (inputs : Wire.t list) (user_rules : query_form list)
    (ctx : (Wire.t * Wire.t) list) : query_result list list =
  let query_with_rules, rules_input, rules_required =
    add_query_rules query_forms user_rules
  in
  let resolved_query = List.map resolve_page_ref_equality query_with_rules in
  let resolved_inputs =
    List.map (fun i -> result_arg (resolve_custom_query_input db i ctx)) inputs
  in
  let query_args =
    resolved_inputs
    @ (if rules_required then [ Db_query_dsl.parse_rules_input rules_input ] else [])
  in
  let query_edn = Ds_wire.edn_of_query_form (QueryFormVector resolved_query) in
  Datascript.q_string db query_edn ~inputs:query_args

(* query-form tree-seq over [query; rules] — all nested coll forms *)
let rec tree_seq_forms (f : query_form) : query_form list =
  let children =
    match f with
    | QueryFormVector xs | QueryFormList xs | QueryFormSet xs -> xs
    | QueryFormMap kvs -> List.concat_map (fun (k, v) -> [ k; v ]) kvs
    | QueryFormTagged (_, inner) -> [ inner ]
    | _ -> []
  in
  f :: List.concat_map tree_seq_forms children

let qualified_keyword_form = function
  | QueryFormKeyword s when String.contains s '/' -> Some s
  | _ -> None

(* custom-query-watch-dependencies — query-m has :query vector + :rules *)
let custom_query_watch_dependencies (query_forms : query_form list)
    (rules_forms : query_form list) =
  let where =
    let sections = Db_query_dsl.query_map_sections query_forms in
    Option.value
      (Option.map snd (List.find_opt (fun (k, _) -> k = Some "where") sections))
      ~default:[]
  in
  let built_in_names = List.map fst Db_query_dsl.db_query_dsl_rules in
  let rules_found = Db_query_dsl.find_rules_in_where where built_in_names in
  let opaque_rules = List.filter (fun r -> r <> "task") rules_found in
  let forms = List.concat_map tree_seq_forms [ QueryFormVector query_forms; QueryFormVector rules_forms ] in
  let task_vars =
    List.filter_map
      (fun f ->
        match f with
        | QueryFormList (QueryFormSymbol "task" :: QueryFormSymbol v :: _) -> Some v
        | _ -> None)
      forms
  in
  let datom_clauses =
    List.filter
      (fun f ->
        match f with
        | QueryFormVector xs when List.length xs >= 2 -> (
            match List.nth xs 1 with
            | QueryFormKeyword s when String.contains s '/' -> true
            | _ -> false)
        | _ -> false)
      forms
  in
  let clause_second = function
    | QueryFormVector xs -> (
        match List.nth xs 1 with
        | QueryFormKeyword s -> s
        | _ -> "")
    | _ -> ""
  in
  let clause_first_sym = function
    | QueryFormVector (QueryFormSymbol s :: _) -> Some s
    | _ -> None
  in
  let task_attrs =
    List.filter_map
      (fun c ->
        match clause_first_sym c with
        | Some s when List.mem s task_vars -> Some (clause_second c)
        | _ -> None)
      datom_clauses
    |> List.sort_uniq String.compare
  in
  let clause_attrs =
    List.map clause_second datom_clauses |> List.sort_uniq String.compare
  in
  let regular_clause_attrs =
    List.filter_map
      (fun c ->
        match clause_first_sym c with
        | Some s when List.mem s task_vars -> None
        | _ -> Some (clause_second c))
      datom_clauses
    |> List.sort_uniq String.compare
  in
  let all_attrs =
    List.filter_map qualified_keyword_form forms |> List.sort_uniq String.compare
  in
  let attrs =
    List.sort_uniq String.compare
      (regular_clause_attrs
       @ List.filter (fun a -> not (List.mem a clause_attrs)) all_attrs)
  in
  (attrs, task_attrs, List.mem "task" rules_found, opaque_rules <> [])

(* query-dsl/query-watch-dependencies *)
let query_result_watch_attrs =
  [ "block/uuid"; "block/title"; "block/name"; "block/parent" ]

let attr_watch_safe_rules = [ "between"; "block-content"; "page" ]

let dsl_query_watch_dependencies db (query_string : string)
    (current_page_title : string option) (today_day : int option) =
  if
    Unicode.trim query_string = ""
    || Db_query_dsl.wrapped_by_quotes query_string
  then ([], [], false, true)
  else
    match
      Db_query_dsl.parse_query db query_string (current_page_title, today_day)
    with
    | Some { Db_query_dsl.pquery; prules; prule_names; _ } ->
        let safe =
          List.for_all (fun r -> List.mem r attr_watch_safe_rules) prule_names
        in
        let forms =
          List.concat_map tree_seq_forms
            [ QueryFormVector (Option.value pquery ~default:[]); QueryFormVector prules ]
        in
        let attrs =
          List.sort_uniq String.compare
            (query_result_watch_attrs
             @ List.filter_map
                 (fun f ->
                   match f with
                   | QueryFormVector xs when List.length xs >= 2 -> (
                       match List.nth xs 1 with
                       | QueryFormKeyword s when String.contains s '/' -> Some s
                       | _ -> None)
                   | _ -> None)
                 forms)
        in
        ( attrs
        , []
        , false
        , (not safe) || (match pquery with Some [] | None -> true | _ -> false) )
    | None -> ([], [], false, true)

type dep_watch =
  { dw_attrs : string list
  ; dw_task_attrs : string list
  ; dw_tasks : bool
  ; dw_opaque : bool
  }

let dependency_watch (d : dep_watch) : watch =
  let keys =
    List.map watch_attr d.dw_attrs
    @ List.map (fun a -> wk1 "task-attr" (kw a)) d.dw_task_attrs
    @ (if d.dw_tasks then [ wkey [ kw "tasks" ] ] else [])
  in
  if d.dw_opaque || keys = [] then Watch_all else Watch_keys keys

let query_watch_keys db (spec_kvs : (Wire.t * Wire.t) list) (kind : string)
    (query_forms : query_form list) (rules_forms : query_form list)
    (query_string : string option) : watch =
  let deps =
    if kind = "datalog" then
      let attrs, task_attrs, tasks, opaque =
        custom_query_watch_dependencies query_forms rules_forms
      in
      { dw_attrs = attrs; dw_task_attrs = task_attrs; dw_tasks = tasks; dw_opaque = opaque }
    else
      let title =
        match List.assoc_opt (kw "current-page-title") spec_kvs with
        | Some (Wire.String s) -> Some s
        | _ -> None
      and day =
        match List.assoc_opt (kw "today-day") spec_kvs with
        | Some (Wire.Int n) -> Some n
        | _ -> None
      in
      let attrs, task_attrs, tasks, opaque =
        dsl_query_watch_dependencies db
          (Option.value query_string ~default:"")
          title day
      in
      { dw_attrs = attrs; dw_task_attrs = task_attrs; dw_tasks = tasks; dw_opaque = opaque }
  in
  match dependency_watch deps with
  | Watch_all -> Watch_all
  | Watch_keys ks ->
      Watch_keys
        (ks
         @ [ watch_attr "logseq.property/hide?"
           ; watch_attr "logseq.property/deleted-at"
           ; watch_attr "block/parent" ])

(* require-query-spec! *)
let query_common_keys =
  [ "kind"; "query"; "current-page-title"; "current-block-uuid"; "today-day"
  ; "remove-block-children?"; "result-transform-edn" ]

let query_dsl_keys = query_common_keys @ [ "cards?" ]
let query_datalog_keys = query_common_keys @ [ "inputs"; "rules" ]

let require_query_spec (spec : Wire.t) : string * (Wire.t * Wire.t) list =
  match spec with
  | Wire.Map kvs -> (
      let kind =
        match List.assoc_opt (kw "kind") kvs with
        | Some (Wire.Keyword k) -> k
        | _ -> ""
      in
      let allowed = match kind with
        | "dsl" -> Some query_dsl_keys
        | "datalog" -> Some query_datalog_keys
        | _ -> None
      in
      let keys_ok =
        match allowed with
        | Some keys ->
            List.for_all
              (fun (k, _) ->
                match k with
                | Wire.Keyword k' -> List.mem k' keys
                | _ -> false)
              kvs
        | None -> false
      in
      let get k = List.assoc_opt (kw k) kvs in
      let present k = List.mem_assoc (kw k) kvs in
      let opt_ok k check = (not (present k)) || check (get k) in
      let ok =
        Option.is_some allowed && keys_ok
        && opt_ok "current-page-title" (function
             | Some (Wire.String s) -> Unicode.trim s <> ""
             | _ -> false)
        && opt_ok "current-block-uuid" (function
             | Some (Wire.Uuid _) -> true
             | _ -> false)
        && opt_ok "today-day" (function
             | Some (Wire.Int n) -> n >= 10000101 && n <= 99991231
             | Some (Wire.Int64 n) -> n >= 10000101L && n <= 99991231L
             | _ -> false)
        && opt_ok "remove-block-children?" (function
             | Some (Wire.Bool _) -> true
             | _ -> false)
        && opt_ok "result-transform-edn" (function
             | Some (Wire.String s) -> Unicode.trim s <> ""
             | _ -> false)
        &&
        match kind with
        | "dsl" ->
            (match get "query" with Some (Wire.String _) -> true | _ -> false)
            && opt_ok "cards?" (function Some (Wire.Bool _) -> true | _ -> false)
        | "datalog" ->
            (match get "query" with
             | Some (Wire.Array (Wire.Keyword "find" :: _)) -> true
             | _ -> false)
            && opt_ok "inputs" (function Some (Wire.Array _) -> true | _ -> false)
            && opt_ok "rules" (function Some (Wire.Array _) -> true | _ -> false)
        | _ -> false
      in
      if not ok then
        fail "Invalid renderer query resource" [ (kw "query-spec", spec) ]
      else (kind, kvs))
  | _ -> fail "Invalid renderer query resource" [ (kw "query-spec", spec) ]

(* quoted-query-text — "\"...\"" -> inner string *)
let quoted_query_text (s : string) : string option =
  let n = String.length s in
  if n >= 2 && s.[0] = '"' && s.[n - 1] = '"' then
    match (try Some (Parser.read_edn s) with _ -> None) with
    | Some (QueryFormString v) when Unicode.trim v <> "" ->
        Some (Unicode.trim v)
    | _ -> None
  else None

(* with-block-pull-identity — single (pull ?v [pattern]) find clause gets
   :block/uuid appended when absent. *)
let with_block_pull_identity (query_forms : query_form list) : query_form list =
  let sections = Db_query_dsl.query_map_sections query_forms in
  let find_exprs =
    Option.value
      (Option.map snd (List.find_opt (fun (k, _) -> k = Some "find") sections))
      ~default:[]
  in
  match find_exprs with
  | [ QueryFormList exprs ] -> (
      match List.rev exprs with
      | QueryFormVector pat :: _
        when (match exprs with
              | QueryFormSymbol "pull" :: _ -> true
              | _ -> false)
             && not
                  (List.exists
                     (function
                       | QueryFormSymbol "*" | QueryFormKeyword "block/uuid" ->
                           true
                       | _ -> false)
                     pat) -> (
          (* (apply list (concat (butlast expression) [(conj pattern ...)])) *)
          let butlast =
            match List.rev (List.tl (List.rev exprs)) with
            | xs -> xs
          in
          let new_expr =
            QueryFormList (butlast @ [ QueryFormVector (pat @ [ QueryFormKeyword "block/uuid" ]) ])
          in
          (* assoc-in [:query 1] — replace the element right after :find *)
          match query_forms with
          | QueryFormKeyword "find" :: _ :: rest ->
              QueryFormKeyword "find" :: new_expr :: rest
          | _ -> query_forms)
      | _ -> query_forms)
  | _ -> query_forms

(* normalize-query-cell on wire: entities are Tagged. *)
let rec normalize_query_cell (w : Wire.t) db : Wire.t =
  match w with
  | Wire.Tagged ("datascript/Entity", Wire.Int eid) -> (
      match Ldb.ent_of_id db eid with
      | Some e -> (
          match Ldb.value e "block/uuid" with
          | Some (Uuid u) -> Wire.Uuid u
          | _ ->
              Wire.Map
                ([ (kw "db/id", Wire.Int eid) ]
                 @ (match Ldb.ident_of e with
                    | Some i -> [ (kw "db/ident", kw i) ]
                    | None -> [])))
      | None -> Wire.Map [ (kw "db/id", Wire.Int eid) ])
  | Wire.Map kvs -> (
      match Plain_value.map_get "block/uuid" kvs with
      | Some (Wire.Uuid u) -> Wire.Uuid u
      | _ ->
          Wire.Map
            (List.map (fun (k, v) -> (k, normalize_query_cell v db)) kvs))
  | Wire.Set xs -> Wire.Set (List.map (fun c -> normalize_query_cell c db) xs)
  | Wire.Array xs -> Wire.Array (List.map (fun c -> normalize_query_cell c db) xs)
  | Wire.List xs -> Wire.Array (List.map (fun c -> normalize_query_cell c db) xs)
  | _ -> w

(* cell wire encoding for the result-transform hook: Result_entity keeps
   its identity via the datascript/Entity tag. *)
let wire_cell_of_query_result (r : query_result) : Wire.t =
  match r with
  | Result_entity n -> Wire.Tagged ("datascript/Entity", Wire.Int n)
  | Result_pull p -> Ds_wire.transit_of_pulled p
  | Result_attr a -> Wire.Keyword a
  | Result_value v -> Ds_wire.transit_of_value v
  | Result_db _ -> Wire.Nil

let query_result_cell_uuid (r : query_result) : string option =
  match r with
  | Result_pull p -> (
      match List.assoc_opt (Keyword "block/uuid") p.pulled_attrs with
      | Some (Pulled_scalar (Uuid u)) -> Some u
      | _ -> None)
  | Result_value (Map kvs) -> (
      match List.assoc_opt (Keyword "block/uuid") kvs with
      | Some (Uuid u) -> Some u
      | _ -> None)
  | _ -> None

(* cljs (:block/uuid cell) — Result_entity resolves through the db the way
   entity attr access would. *)
let query_result_cell_entity_uuid db (r : query_result) : string option =
  match r with
  | Result_entity n -> (
      match Ldb.ent_of_id db n with
      | Some e -> (
          match Ldb.value e "block/uuid" with
          | Some (Uuid u) -> Some u
          | _ -> None)
      | None -> None)
  | _ -> query_result_cell_uuid r

let query_result_cell_id (r : query_result) : int option =
  match r with
  | Result_entity n -> Some n
  | Result_pull p -> Some p.pulled_id
  | Result_value (Map kvs) -> (
      match List.assoc_opt (Keyword "db/id") kvs with
      | Some (Int n) -> Some n
      | _ -> None)
  | Result_value (Int n) -> Some n
  | _ -> None

(* block-query-result? — every tuple is a single entity/map with uuid *)
let block_query_result db (rows : query_result list list) : bool =
  rows <> []
  && List.for_all
       (fun row ->
         match row with
         | [ cell ] -> (
             match cell with
             | Result_entity n -> (
                 match Ldb.ent_of_id db n with
                 | Some e -> (
                     match Ldb.value e "block/uuid" with
                     | Some (Uuid _) -> true
                     | _ -> false)
                 | None -> false)
             | Result_pull _ | Result_value (Map _) ->
                 Option.is_some (query_result_cell_uuid cell)
             | _ -> false)
         | _ -> false)
       rows

(* filter-block-query-result — remove hidden + current block + nested
   children when remove-block-children?. *)
let filter_block_query_result db (cells : query_result list)
    (current_block_uuid : string option) (remove_block_children : bool option) :
    query_result list =
  let cells =
    List.filter
      (fun cell ->
        match query_result_cell_entity_uuid db cell with
        | Some u -> (
            match entity db (Lookup_ref ("block/uuid", Uuid u)) with
            | Some e -> not (Ldb.hidden e)
            | None -> true)
        | None -> true)
      cells
  in
  let cells =
    match current_block_uuid with
    | Some cu ->
        List.filter
          (fun cell -> query_result_cell_entity_uuid db cell <> Some cu)
          cells
    | None -> cells
  in
  if remove_block_children = Some false
     || not (List.for_all (fun c -> Option.is_some (query_result_cell_id c)) cells)
  then cells
  else
    let ids = List.filter_map query_result_cell_id cells in
    List.filter
      (fun cell ->
        match query_result_cell_id cell with
        | Some cid -> (
            match Ldb.ent_of_id db cid with
            | Some e -> (
                match Ldb.ref_ent e "block/parent" with
                | Some p -> not (List.mem p.id ids)
                | None -> true)
            | None -> true)
        | None -> true)
      cells

let normalize_query_row db (cells : Wire.t list) : Wire.t =
  let tuple = List.map (fun c -> normalize_query_cell c db) cells in
  match tuple with
  | [ x ] -> x
  | _ -> Wire.Array tuple

let query_error_value (msg : string) : Wire.t =
  Wire.Map
    [ (kw "rows", Wire.Array [])
    ; (kw "error", Wire.Map [ (kw "message", Wire.String msg) ]) ]

(* execute-query-spec — returns typed rows *)
let execute_query_spec db (spec_kvs : (Wire.t * Wire.t) list) (kind : string)
    (query_forms : query_form list) (rules_forms : query_form list)
    (query_string : string option) (runtime : runtime) : query_result list list =
  let get k = List.assoc_opt (kw k) spec_kvs in
  match kind with
  | "dsl" -> (
      let qs = Option.value query_string ~default:"" in
      if Unicode.trim qs = "" then []
      else
        match quoted_query_text qs with
        | Some query_text ->
            (match runtime.repo with
             | None -> fail "Full-text query resource requires repository" []
             | Some repo ->
                 Render_deps.search_blocks ~repo ~db query_text 30
                 |> List.map (fun (e : entity) -> [ Result_entity e.id ]))
        | None ->
            let opts =
              { Db_query_dsl.opt_cards =
                  (match get "cards?" with
                   | Some (Wire.Bool b) -> b
                   | _ -> false)
              ; opt_block_attrs =
                  Some "[:db/id :block/uuid {:block/parent [:db/id]}]"
              ; opt_current_page_title =
                  (match get "current-page-title" with
                   | Some (Wire.String s) -> Some s
                   | _ -> None)
              ; opt_today_day =
                  (match get "today-day" with
                   | Some (Wire.Int n) -> Some n
                   | _ -> None)
              }
            in
            (match Db_query_dsl.execute_query db qs opts with
             | Some rows -> rows
             | None -> []))
  | "datalog" ->
      let inputs =
        match get "inputs" with
        | Some (Wire.Array xs) -> xs
        | _ -> []
      in
      let ctx = spec_kvs @ [ (kw "require-today-day?", Wire.Bool true) ] in
      execute_custom_query_typed db query_forms inputs rules_forms ctx
  | _ -> []

let query_result_rows db (rows : query_result list list)
    (spec_kvs : (Wire.t * Wire.t) list) : Wire.t list =
  let get k = List.assoc_opt (kw k) spec_kvs in
  let rows' =
    if block_query_result db rows then
      filter_block_query_result db (List.map (fun r -> List.hd r) rows)
        (match get "current-block-uuid" with
         | Some (Wire.Uuid u) -> Some u
         | _ -> None)
        (match get "remove-block-children?" with
         | Some (Wire.Bool b) -> Some b
         | _ -> None)
      |> List.map (fun c -> [ c ])
    else rows
  in
  (* apply-result-transform — wire hook; rows encoded as arrays of cells
     with entities tagged datascript/Entity. cljs hands the transform the
     flat cell list for block results, tuples otherwise. *)
  let entity_attr eid attr =
    match Ldb.ent_of_id db eid with
    | Some e -> (match Ldb.value e attr with Some v -> v | None -> Nil)
    | None -> Nil
  in
  let is_block_result = block_query_result db rows' in
  let rows_wire =
    match get "result-transform-edn" with
    | Some (Wire.String edn) when Unicode.trim edn <> "" ->
        let encoded =
          if is_block_result then
            List.map
              (fun row -> wire_cell_of_query_result (List.hd row))
              rows'
          else
            List.map (fun row -> Wire.Array (List.map wire_cell_of_query_result row)) rows'
        in
        let out = Render_deps.apply_result_transform ~entity_attr edn encoded in
        (match out with
         | Wire.Array rs | Wire.List rs | Wire.Set rs -> rs
         | _ -> fail "Query result transform must return rows" [ (kw "result", out) ])
    | _ -> List.map (fun row -> Wire.Array (List.map wire_cell_of_query_result row)) rows'
  in
  List.map
    (fun row ->
      match row with
      | Wire.Array cells | Wire.List cells -> normalize_query_row db cells
      | single -> normalize_query_row db [ single ])
    rows_wire

let render_query db key runtime =
  let spec_wire = List.nth key 1 in
  let kind_str, spec_kvs = require_query_spec spec_wire in
  let query_forms =
    match List.assoc_opt (kw "query") spec_kvs with
    | Some (Wire.Array xs) -> List.map form_of_wire xs
    | _ -> []
  in
  let query_forms =
    if kind_str = "datalog" then with_block_pull_identity query_forms
    else query_forms
  in
  let rules_forms =
    match List.assoc_opt (kw "rules") spec_kvs with
    | Some (Wire.Array xs) -> List.map form_of_wire xs
    | _ -> []
  in
  let query_string =
    match List.assoc_opt (kw "query") spec_kvs with
    | Some (Wire.String s) -> Some s
    | _ -> None
  in
  let watch =
    query_watch_keys db spec_kvs kind_str query_forms rules_forms query_string
  in
  try
    let rows =
      execute_query_spec db spec_kvs kind_str query_forms rules_forms
        query_string runtime
    in
    (watch, Wire.Map [ (kw "rows", Wire.Array (query_result_rows db rows spec_kvs)) ])
  with
  | Invalid_argument msg | Failure msg -> (watch, query_error_value msg)

(* ==================== view.cljs ==================== *)

let view_feature_types =
  [ "all-pages"; "class-objects"; "property-objects"; "linked-references"
  ; "unlinked-references"; "query-result" ]

let view_context_keys =
  [ "feature-type"; "sorting"; "filters"; "input"; "group-by-property-ident"
  ; "initial-row-count"; "row-offset"; "query-row-uuids" ]

let view_owner db (owner_lookup : Wire.t) : entity =
  match owner_lookup with
  | Wire.Uuid u -> entity_by_uuid db "owner-uuid" u
  | Wire.String s when Unicode.trim s <> "" -> (
      match Ldb.get_page db (String s) with
      | Some p -> p
      | None -> fail "Missing view owner page" [ (kw "owner-lookup", owner_lookup) ])
  | _ -> fail "Invalid view owner" [ (kw "owner-lookup", owner_lookup) ]

let render_views db key _runtime =
  let owner_lookup = List.nth key 1 in
  let owner = view_owner db owner_lookup in
  let owner_uuid = entity_uuid db owner.id in
  let feature_type =
    match List.nth key 2 with
    | Wire.Keyword f -> f
    | v -> fail "Invalid view feature type" [ (kw "feature-type", v) ]
  in
  let views_eids =
    q_string db
      ~inputs:
        [ Arg_scalar (Result_value (Int owner.id))
        ; Arg_scalar (Result_value (Keyword feature_type)) ]
      "[:find [?view ...] \
        :in $ ?owner ?feature-type \
        :where \
        [?view :logseq.property/view-for ?owner] \
        [?view :logseq.property.view/feature-type ?feature-type]]"
    |> List.filter_map (function
           | [ Result_entity id ] -> Ldb.ent_of_id db id
           | _ -> None)
    |> Ldb.sort_by_order
  in
  ( Watch_keys [ wkey [ kw "views"; Wire.Uuid owner_uuid; kw feature_type ] ]
  , Wire.Array (List.map (fun (v : entity) -> Wire.Uuid (entity_uuid db v.id)) views_eids) )

let valid_sorting (v : Wire.t) : bool =
  match v with
  | Wire.Array items ->
      List.for_all
        (fun item ->
          match item with
          | Wire.Map kvs ->
              List.length kvs = 2
              && (match List.assoc_opt (kw "id") kvs with
                  | Some (Wire.Keyword _) -> true
                  | _ -> false)
              && (match List.assoc_opt (kw "asc?") kvs with
                  | Some (Wire.Bool _) -> true
                  | _ -> false)
          | _ -> false)
        items
  | _ -> false

let valid_filters (v : Wire.t) : bool =
  match v with
  | Wire.Map kvs ->
      List.for_all
        (fun (k, _) -> k = kw "or?" || k = kw "filters")
        kvs
      && (match List.assoc_opt (kw "or?") kvs with
          | Some (Wire.Bool _) | None -> true
          | _ -> false)
      && (match List.assoc_opt (kw "filters") kvs with
          | Some (Wire.Array clauses) ->
              List.for_all
                (fun c ->
                  match c with
                  | Wire.Array (Wire.Keyword _ :: _ :: _ :: []) -> true
                  | _ -> false)
                clauses
          | Some _ -> false
          | None -> false)
  | _ -> false

let require_view_context (context : Wire.t) : (Wire.t * Wire.t) list =
  match context with
  | Wire.Map kvs ->
      let keys =
        List.filter_map (fun (k, _) -> match k with Wire.Keyword s -> Some s | _ -> None) kvs
      in
      let valid =
        List.for_all (fun k -> List.mem k view_context_keys) keys
        && List.mem "feature-type" keys
        && (match List.assoc_opt (kw "feature-type") kvs with
            | Some (Wire.Keyword f) -> List.mem f view_feature_types
            | _ -> false)
        && (match List.assoc_opt (kw "sorting") kvs with
            | Some v -> valid_sorting v
            | None -> true)
        && (match List.assoc_opt (kw "filters") kvs with
            | Some v -> valid_filters v
            | None -> true)
        && (match List.assoc_opt (kw "input") kvs with
            | Some (Wire.String _) | None -> true
            | _ -> false)
        && (match List.assoc_opt (kw "group-by-property-ident") kvs with
            | Some (Wire.Keyword _) | None -> true
            | _ -> false)
        && (match List.assoc_opt (kw "initial-row-count") kvs with
            | Some (Wire.Int n) ->
                let ft =
                  match List.assoc_opt (kw "feature-type") kvs with
                  | Some (Wire.Keyword f) -> f
                  | _ -> ""
                in
                List.mem ft [ "all-pages"; "class-objects" ] && n > 0 && n <= 1000
            | None -> true
            | _ -> false)
        && (match List.assoc_opt (kw "row-offset") kvs with
            | Some (Wire.Int n) ->
                List.mem_assoc (kw "initial-row-count") kvs && n >= 0
            | None -> true
            | _ -> false)
        && (match List.assoc_opt (kw "query-row-uuids") kvs with
            | Some (Wire.Array us) ->
                List.for_all (function Wire.Uuid _ -> true | _ -> false) us
            | None -> true
            | _ -> false)
      in
      if not valid then
        fail "Invalid view resource context" [ (kw "context", context) ]
      else kvs
  | _ -> fail "Invalid view resource context" [ (kw "context", context) ]

let require_view_owner feature_type (owner : entity option) (view_uuid : string) : entity option =
  if List.mem feature_type
       [ "class-objects"; "property-objects"; "linked-references"; "unlinked-references" ]
     && Option.is_none owner
  then
    fail "View resource has no owner"
      [ (kw "view-uuid", Wire.Uuid view_uuid)
      ; (kw "feature-type", kw feature_type) ]
  else owner

let scope_uuids db (eids : entity_id list) : string list =
  List.sort_uniq String.compare
    (List.map (entity_uuid db) (List.sort_uniq compare eids))

(* effective-view-config — sorting/filters/group-by resolved from the
   view entity with context fallback. *)
type view_config =
  { vc_sorting : Wire.t option
  ; vc_filters : Wire.t option
  ; vc_input : Wire.t option
  ; vc_group_by : string option
  ; vc_group_sort : string option
  }

let ident_of_value db (v : value option) : string option =
  match v with
  | Some (Keyword k) -> Some k
  | Some (Ref id) | Some (Int id) ->
      Option.bind (Ldb.ent_of_id db id) Ldb.ident_of
  | _ -> None

let effective_view_config db (view : entity) (ctx : (Wire.t * Wire.t) list) : view_config =
  let get k = List.assoc_opt (kw k) ctx in
  let persisted_sorting = Ldb.value view "logseq.property.table/sorting" in
  let empty_sorting =
    match persisted_sorting with
    | Some (Keyword "logseq.property/empty-placeholder") -> true
    | Some v ->
        ident_of_value db (Some v) = Some "logseq.property/empty-placeholder"
        || (match v with Set [] | Vector [] | List [] -> true | _ -> false)
    | None -> true
  in
  let sorting =
    if empty_sorting then
      match get "sorting" with
      | Some s -> Some s
      | None ->
          Some
            (Wire.Array
               [ Wire.Map [ (kw "id", kw "block/updated-at"); (kw "asc?", Wire.Bool false) ] ])
    else Option.map Ds_wire.transit_of_value persisted_sorting
  in
  let filters =
    match Ldb.value view "logseq.property.table/filters" with
    | Some v -> Some (Ds_wire.transit_of_value v)
    | None -> get "filters"
  in
  let group_by =
    match ident_of_value db (Ldb.value view "logseq.property.view/group-by-property") with
    | Some i -> Some i
    | None -> (
        match get "group-by-property-ident" with
        | Some (Wire.Keyword g) -> Some g
        | _ -> None)
  in
  let group_sort =
    match group_by with
    | Some _ -> (
        match ident_of_value db (Ldb.value view "logseq.property.view/sort-groups-by-property") with
        | Some i -> Some i
        | None -> Some "block/journal-day")
    | None -> None
  in
  { vc_sorting = sorting
  ; vc_filters = filters
  ; vc_input = get "input"
  ; vc_group_by = group_by
  ; vc_group_sort = group_sort }

let filter_property_idents (filters : Wire.t) : string list =
  match filters with
  | Wire.Map kvs -> (
      match Plain_value.map_get "filters" kvs with
      | Some (Wire.Array clauses) | Some (Wire.List clauses) ->
          List.filter_map
            (fun c ->
              match c with
              | Wire.Array (Wire.Keyword ident :: _) -> Some ident
              | Wire.List (Wire.Keyword ident :: _) -> Some ident
              | _ -> None)
            clauses
      | _ -> [])
  | _ -> []

let view_value_watch_keys (config : view_config) (view_partition : string)
    : Wire.t list =
  let keys =
    match config.vc_sorting with
    | Some (Wire.Array items) | Some (Wire.List items) ->
        List.filter_map
          (fun item ->
            match item with
            | Wire.Map kvs -> (
                match Plain_value.map_get "id" kvs with
                | Some (Wire.Keyword id) -> Some (watch_attr id)
                | _ -> None)
            | _ -> None)
          items
    | _ -> []
  in
  let keys =
    match config.vc_filters with
    | Some f -> keys @ List.map watch_attr (filter_property_idents f)
    | None -> keys
  in
  let keys =
    match config.vc_input with
    | Some (Wire.String s) when Unicode.trim s <> "" -> keys @ [ watch_attr "block/title" ]
    | _ -> keys
  in
  let keys =
    match config.vc_group_by, config.vc_group_sort with
    | Some g, Some gs ->
        keys @ [ watch_attr g; watch_attr gs; watch_attr "block/title" ]
    | Some g, None -> keys @ [ watch_attr g; watch_attr "block/title" ]
    | _ -> keys
  in
  if view_partition = "grouped-list" then
    keys @ [ watch_attr "block/parent"; watch_attr "block/order" ]
  else keys

let view_watch_keys db (view_uuid : string) (owner : entity option)
    (feature_type : string) (config : view_config) (view_partition : string) : watch =
  if feature_type = "unlinked-references" then Watch_keys []
  else
    let owner_uuid = Option.map uuid_of owner in
    let value_keys =
      if feature_type = "linked-references" then []
      else view_value_watch_keys config view_partition
    in
    let base =
      value_keys @ [ watch_entity view_uuid ]
      @ (match owner_uuid with Some u -> [ watch_entity u ] | None -> [])
    in
    match feature_type with
    | "all-pages" -> Watch_keys (base @ [ wkey [ kw "page-membership" ] ])
    | "class-objects" -> (
        match owner with
        | Some o ->
            let classes =
              scope_uuids db
                (o.id :: Db_class.get_structured_children db o.id)
            in
            Watch_keys
              (base @ [ wkey [ kw "class-tree" ] ]
               @ List.map (fun cu -> wk1 "class-membership" (Wire.Uuid cu)) classes)
        | None -> Watch_keys base)
    | "property-objects" -> (
        match Option.bind owner Ldb.ident_of with
        | Some ident ->
            Watch_keys (base @ [ wk1 "property-membership" (kw ident) ])
        | None ->
            fail "View property owner has no ident"
              [ ( kw "owner-uuid"
                , match owner_uuid with Some u -> Wire.Uuid u | None -> Wire.Nil ) ])
    | "linked-references" -> (
        match owner with
        | Some o ->
            let class_children =
              if Ldb.is_class o then Db_class.get_structured_children db o.id else []
            in
            let refs_scope =
              scope_uuids db (o.id :: Db_view.get_block_alias db o.id @ class_children)
            in
            Watch_keys
              (base @ [ wkey [ kw "ref-scope" ] ]
               @ List.map (fun tu -> wk1 "refs" (Wire.Uuid tu)) refs_scope)
        | None -> Watch_keys base)
    | _ -> Watch_keys base

let normalize_view_row db (row : Wire.t) : Wire.t =
  match row with
  | Wire.Int id -> Wire.Uuid (entity_uuid db id)
  | Wire.Map kvs -> (
      match Plain_value.map_get "block/uuid" kvs with
      | Some (Wire.Uuid u) -> Wire.Uuid u
      | _ -> (
          match Plain_value.map_get "db/id" kvs with
          | Some (Wire.Int id) -> Wire.Uuid (entity_uuid db id)
          | _ -> fail "Unsupported view resource row" [ (kw "row", row) ]))
  | Wire.Tagged ("datascript/Entity", Wire.Int id) -> Wire.Uuid (entity_uuid db id)
  | _ -> fail "Unsupported view resource row" [ (kw "row", row) ]

let normalize_view_rows db (rows : Wire.t list) : Wire.t =
  Wire.Array (List.map (normalize_view_row db) rows)

let normalize_group_value (v : Wire.t) : Wire.t =
  match v with
  | Wire.Nil -> Wire.Map [ (kw "kind", kw "empty") ]
  | Wire.Map kvs -> (
      match Plain_value.map_get "block/uuid" kvs with
      | Some (Wire.Uuid u) ->
          Wire.Map [ (kw "kind", kw "entity"); (kw "uuid", Wire.Uuid u) ]
      | _ -> Wire.Map [ (kw "kind", kw "scalar"); (kw "value", v) ])
  | Wire.Array _ | Wire.List _ | Wire.Set _ ->
      fail "Unsupported view group value" [ (kw "value", v) ]
  | _ -> Wire.Map [ (kw "kind", kw "scalar"); (kw "value", v) ]

let wire_rows (v : Wire.t) : Wire.t list =
  match v with
  | Wire.Array xs | Wire.List xs | Wire.Set xs -> xs
  | _ -> []

let grouped_list_partition (v : Wire.t) : bool =
  match v with
  | Wire.Array [ Wire.Uuid _; (Wire.Array _ | Wire.List _) ] -> true
  | Wire.List [ Wire.Uuid _; (Wire.Array _ | Wire.List _) ] -> true
  | _ -> false

let grouped_list_data (data : Wire.t) : bool =
  match data with
  | Wire.Array groups | Wire.List groups ->
      groups <> []
      && List.for_all
           (fun g ->
             match g with
             | Wire.Array [ _; (Wire.Array ps | Wire.List ps) ]
             | Wire.List [ _; (Wire.Array ps | Wire.List ps) ] ->
                 List.for_all grouped_list_partition ps
             | _ -> false)
           groups
  | _ -> false

let normalize_grouped_view_data db (count : Wire.t) (data : Wire.t) : (Wire.t * Wire.t) list =
  let groups =
    List.map
      (fun g ->
        match g with
        | Wire.Array [ v; rows ] | Wire.List [ v; rows ] ->
            Wire.Map
              [ (kw "value", normalize_group_value v)
              ; (kw "rows", normalize_view_rows db (wire_rows rows)) ]
        | _ -> g)
      (wire_rows data)
  in
  [ (kw "partition", kw "grouped"); (kw "count", count); (kw "groups", Wire.Array groups) ]

let normalize_grouped_list_view_data db (count : Wire.t) (data : Wire.t)
    : (Wire.t * Wire.t) list =
  let groups =
    List.map
      (fun g ->
        match g with
        | Wire.Array [ v; partitions ] | Wire.List [ v; partitions ] ->
            Wire.Map
              [ (kw "value", normalize_group_value v)
              ; ( kw "partitions"
                , Wire.Array
                    (List.map
                       (fun p ->
                         match p with
                         | Wire.Array [ Wire.Uuid u; rows ]
                         | Wire.List [ Wire.Uuid u; rows ] ->
                             Wire.Map
                               [ (kw "breadcrumb-uuid", Wire.Uuid u)
                               ; (kw "rows", normalize_view_rows db (wire_rows rows)) ]
                         | _ -> p)
                       (wire_rows partitions)) ) ]
        | _ -> g)
      (wire_rows data)
  in
  [ (kw "partition", kw "grouped-list"); (kw "count", count); (kw "groups", Wire.Array groups) ]

let query_property_maps db (idents : Wire.t) : Wire.t =
  let items =
    match idents with
    | Wire.Array xs | Wire.List xs | Wire.Set xs -> xs
    | _ -> []
  in
  Wire.Array
    (List.filter_map
       (fun i ->
         match i with
         | Wire.Keyword ident -> (
             match entity db (Ident ident) with
             | Some p -> Some (Endpoint_property.property_plain_map db p)
             | None -> None)
         | _ -> None)
       items)

let normalize_view_data db (result : Wire.t) (grouped : bool) : Wire.t =
  match result with
  | Wire.Map kvs ->
      let data = Option.value (Plain_value.map_get "data" kvs) ~default:(Wire.Array []) in
      let count = Option.value (Plain_value.map_get "count" kvs) ~default:(Wire.Int 0) in
      let base =
        if grouped_list_data data then
          normalize_grouped_list_view_data db count data
        else if grouped then
          normalize_grouped_view_data db count data
        else
          [ (kw "partition", kw "flat"); (kw "count", count)
          ; (kw "rows", normalize_view_rows db (wire_rows data)) ]
      in
      let base =
        match Plain_value.map_get "ref-pages-count" kvs with
        | Some v -> base @ [ (kw "ref-pages-count", v) ]
        | None -> base
      in
      let base =
        if List.mem_assoc (kw "ref-matched-children-ids") kvs then
          base
          @ [ ( kw "matched-child-uuids"
              , match Plain_value.map_get "ref-matched-children-ids" kvs with
                | Some (Wire.Set ids) | Some (Wire.Array ids) | Some (Wire.List ids) ->
                    Wire.Set
                      (List.map
                         (fun i ->
                           match i with
                           | Wire.Int id -> Wire.Uuid (entity_uuid db id)
                           | other -> other)
                         ids)
                | _ -> Wire.Nil ) ]
        else base
      in
      let base =
        if List.mem_assoc (kw "properties") kvs then
          base
          @ [ ( kw "properties"
              , query_property_maps db
                  (Option.value (Plain_value.map_get "properties" kvs)
                     ~default:(Wire.Array [])) ) ]
        else base
      in
      Wire.Map base
  | _ -> fail "Invalid view resource result" [ (kw "result", result) ]

let first_window_row_preview db (block_uuid : string) : (Wire.t * Wire.t) option =
  match entity db (Lookup_ref ("block/uuid", Uuid block_uuid)) with
  | Some e ->
      Some
        ( Wire.Uuid block_uuid
        , Wire.Map
            [ (kw "block/uuid", Wire.Uuid block_uuid)
            ; (kw "db/id", Wire.Int e.id)
            ; ( kw "block/title"
              , match Render_snapshot.renderer_display_title db e.id with
                | Some t -> Wire.String t
                | None -> Wire.Nil )
            ; (kw "block.temp/first-window-preview?", Wire.Bool true) ] )
  | None -> None

let first_window_row_previews db (rows : Wire.t) : Wire.t =
  Wire.Map
    (List.filter_map
       (fun r ->
         match r with
         | Wire.Uuid u -> first_window_row_preview db u
         | _ -> None)
       (wire_rows rows))

let missing_view_data view_uuid : watch * Wire.t =
  ( Watch_keys [ watch_entity view_uuid ]
  , Wire.Map
      [ (kw "partition", kw "flat"); (kw "count", Wire.Int 0); (kw "rows", Wire.Array []) ] )

let render_view_data db key _runtime =
  let view_uuid = require_uuid "view-uuid" (List.nth key 1) in
  let ctx = require_view_context (List.nth key 2) in
  let get k = List.assoc_opt (kw k) ctx in
  let feature_type =
    match get "feature-type" with
    | Some (Wire.Keyword f) -> f
    | _ -> ""
  in
  match entity db (Lookup_ref ("block/uuid", Uuid view_uuid)) with
  | None -> missing_view_data view_uuid
  | Some view ->
      let stored_feature_type =
        ident_of_value db (Ldb.value view "logseq.property.view/feature-type")
      in
      let owner =
        require_view_owner feature_type
          (Ldb.ref_ent view "logseq.property/view-for")
          view_uuid
      in
      (match stored_feature_type with
       | Some s when s <> feature_type ->
           fail "View resource feature does not match its definition"
             [ (kw "view-uuid", Wire.Uuid view_uuid)
             ; (kw "feature-type", kw feature_type)
             ; (kw "stored-feature-type", kw s) ]
       | _ -> ());
      let query_row_uuids = get "query-row-uuids" in
      (if (feature_type = "query-result") <> Option.is_some query_row_uuids then
         fail "Invalid query-result view rows"
           [ (kw "feature-type", kw feature_type)
           ; ( kw "query-row-uuids"
             , Option.value query_row_uuids ~default:Wire.Nil ) ]);
      let config = effective_view_config db view ctx in
      let query_block =
        if feature_type = "query-result" then
          Ldb.ref_ent view "logseq.property/query"
        else None
      in
      let query_wire =
        match query_block with
        | Some qb
          when ident_of_value db (Ldb.value qb "logseq.property.node/display-type")
               = Some "code" -> (
            match Ldb.string_value qb "block/title" with
            | Some title -> (
                match (try Some (Parser.read_edn title) with _ -> None) with
                | Some (QueryFormMap mkvs) -> (
                    match
                      List.assoc_opt (QueryFormKeyword "query") mkvs
                    with
                    | Some qf -> Some (Ds_wire.transit_of_value (value_of_form qf))
                    | None -> None)
                | _ -> None)
            | None -> None)
        | _ -> None
      in
      let query_entity_ids =
        match query_row_uuids with
        | Some (Wire.Array us) ->
            List.map
              (fun u ->
                match u with
                | Wire.Uuid uuid -> (entity_by_uuid db "query-row-uuid" uuid).id
                | _ ->
                    (entity_by_uuid db "query-row-uuid"
                       (require_uuid "query-row-uuid" u))
                      .id)
              us
        | _ -> []
      in
      (* option = ctx minus feature-type/query-row-uuids/initial-row-count/
         row-offset plus the view-derived keys *)
      let opt_pairs =
        List.filter
          (fun (k, _) ->
            match k with
            | Wire.Keyword ("feature-type" | "query-row-uuids" | "initial-row-count"
                          | "row-offset") -> false
            | _ -> true)
          ctx
        @ [ (kw "view-feature-type", kw feature_type) ]
        @ (match owner with Some o -> [ (kw "view-for-id", Wire.Int o.id) ] | None -> [])
        @ (if feature_type = "query-result" then
             [ ( kw "query-entity-ids"
               , Wire.Array (List.map (fun i -> Wire.Int i) query_entity_ids) ) ]
             @ (match query_wire with Some q -> [ (kw "query", q) ] | None -> [])
           else [])
        @ (match get "initial-row-count" with
           | Some n -> [ (kw "row-limit", n) ]
           | None -> [])
        @ (match get "row-offset" with
           | Some o -> [ (kw "row-offset", o) ]
           | None -> [])
      in
      let result = Db_view.get_view_data db (Some view.id) (Wire.Map opt_pairs) in
      let value =
        normalize_view_data db result (Option.is_some config.vc_group_by)
      in
      let include_row_previews =
        Option.is_some (get "initial-row-count")
        && (match value with
            | Wire.Map kvs ->
                Plain_value.map_get "partition" kvs = Some (kw "flat")
            | _ -> false)
      in
      let value =
        match value, include_row_previews with
        | Wire.Map kvs, true -> (
            match Plain_value.map_get "rows" kvs with
            | Some rows ->
                Wire.Map
                  (kvs @ [ (kw "row-previews", first_window_row_previews db rows) ])
            | None -> value)
        | _ -> value
      in
      let value_partition =
        match value with
        | Wire.Map kvs -> (
            match Plain_value.map_get "partition" kvs with
            | Some (Wire.Keyword p) -> p
            | _ -> "")
        | _ -> ""
      in
      let watch =
        match view_watch_keys db view_uuid owner feature_type config value_partition with
        | Watch_all -> Watch_all
        | Watch_keys ks ->
            Watch_keys
              (ks
               @ (match query_block with
                  | Some qb -> [ watch_entity (uuid_of qb) ]
                  | None -> [])
               @ (if include_row_previews then [ watch_attr "block/title" ] else []))
      in
      (watch, value)

(* ==================== engine.cljs ==================== *)

type render_result =
  { watch : watch
  ; value : Wire.t
  ; slots : (Wire.t * Wire.t) list
  }

type renderer =
  { shape : int option (* total resource-key vector size; None = unchecked *)
  ; render : db -> Wire.t list -> runtime -> render_result
  }

let rr shape f = { shape; render = f }

let no_slots watch value = { watch; value; slots = [] }

let resource_renderers : (string * renderer) list =
  [ ("favorites", rr (Some 1) (fun db k r -> let w, v = render_favorites db k r in no_slots w v))
  ; ( "favorite-status", rr (Some 2) (fun db k r -> let w, v = render_favorite_status db k r in no_slots w v) )
  ; ( "recent-pages", rr (Some 2) (fun db k r -> let w, v = render_recent_pages db k r in no_slots w v) )
  ; ( "page-identity", rr (Some 2) (fun db k r -> let w, v = render_page_identity db k r in no_slots w v) )
  ; ( "page-preview-source", rr (Some 2) (fun db k r -> let w, v = render_page_preview_source db k r in no_slots w v) )
  ; ( "block-breadcrumb", rr (Some 3) (fun db k r -> let w, v = render_block_breadcrumb db k r in no_slots w v) )
  ; ( "journals", rr (Some 1) (fun db k r -> let w, v = render_journals db k r in no_slots w v) )
  ; ( "recycle-roots", rr (Some 1) (fun db k r -> let w, v = render_recycle_roots db k r in no_slots w v) )
  ; ( "property-choices", rr (Some 2) (fun db k r -> let w, v = render_property_choices db k r in no_slots w v) )
  ; ( "block-reactions", rr (Some 3) (fun db k r -> let w, v = render_block_reactions db k r in no_slots w v) )
  ; ( "block-ref-count", rr (Some 2) (fun db k r -> let w, v = render_block_ref_count db k r in no_slots w v) )
  ; ( "block-unlinked-ref-exists", rr (Some 2) (fun db k r -> let w, v = render_block_unlinked_ref_exists db k r in no_slots w v) )
  ; ( "block-comment-threads", rr (Some 2) (fun db k r -> let w, v = render_block_comment_threads db k r in no_slots w v) )
  ; ( "block-comment-summary", rr (Some 2) (fun db k r -> let w, v = render_block_comment_summary db k r in no_slots w v) )
  ; ( "block-task-time", rr (Some 2) (fun db k r -> let w, v = render_block_task_time db k r in no_slots w v) )
  ; ( "route-block", rr (Some 3) (fun db k r -> let w, v = render_route_block db k r in no_slots w v) )
  ; ( "page-membership", rr None (fun db k r -> let w, v = render_page_membership db k r in no_slots w v) )
  ; ( "block-display-properties", rr (Some 3) (fun db k r -> let w, v = render_block_display_properties db k r in no_slots w v) )
  ; ( "block-bidirectional-properties", rr (Some 2) (fun db k r -> let w, v = render_block_bidirectional_properties db k r in no_slots w v) )
  ; ( "views", rr (Some 3) (fun db k r -> let w, v = render_views db k r in no_slots w v) )
  ; ( "view-data", rr (Some 3) (fun db k r -> let w, v = render_view_data db k r in no_slots w v) )
  ; ( "query", rr (Some 2) (fun db k r -> let w, v = render_query db k r in no_slots w v) )
  ; ( "block-sync-conflicts"
    , rr None
        (fun _db key _runtime ->
          fail "Renderer resource belongs to a non-DB provider"
            [ (kw "provider", kw "sync-state")
            ; (kw "resource-key", Wire.Array key) ]) )
  ]

let resource_value db (resource_key : Wire.t list) (runtime : runtime) : render_result =
  (match resource_key with
   | _ :: _ -> ()
   | _ ->
       fail "Invalid renderer resource key"
         [ (kw "resource-key", Wire.Array resource_key) ]);
  match invalid_resource_key_value (Wire.Array resource_key) with
  | Some (Wire.Keyword "entity") ->
      fail "Renderer resource keys cannot contain graph entities"
        [ (kw "resource-key", Wire.Array resource_key) ]
  | Some _ ->
      fail "Renderer resource keys cannot contain functions"
        [ (kw "resource-key", Wire.Array resource_key) ]
  | None -> (
      match resource_key with
      | Wire.Keyword kind :: _ -> (
          match List.assoc_opt kind resource_renderers with
          | Some renderer ->
              (match renderer.shape with
               | Some size -> require_shape ~shape:kind ~size resource_key
               | None -> ());
              renderer.render db resource_key runtime
          | None ->
              fail "Unknown renderer resource key"
                [ (kw "resource-key", Wire.Array resource_key) ])
      | _ ->
          fail "Unknown renderer resource key"
            [ (kw "resource-key", Wire.Array resource_key) ])

type resource_entry =
  { watch_keys : Wire.t list
  ; watch_all : bool
  ; value : Wire.t
  ; slots : (Wire.t * Wire.t) list
  }

let resource_entry db (resource_key : Wire.t list) (runtime : runtime) : resource_entry =
  let res = resource_value db resource_key runtime in
  match res.watch with
  | Watch_all ->
      { watch_keys = []; watch_all = true; value = res.value; slots = res.slots }
  | Watch_keys ks ->
      { watch_keys = ks; watch_all = false; value = res.value; slots = res.slots }

let snapshot_request_limits = [ ("blocks", 1000); ("children", 25); ("resources", 25) ]

let wire_dedup (xs : Wire.t list) : Wire.t list =
  let rec go acc = function
    | [] -> List.rev acc
    | x :: rest -> if List.exists (fun y -> y = x) acc then go acc rest else go (x :: acc) rest
  in
  go [] xs

let require_snapshot_request (request : Wire.t) : (Wire.t list * Wire.t list * Wire.t list) =
  match request with
  | Wire.Map kvs -> (
      let get k = List.assoc_opt (kw k) kvs in
      let ok_keys =
        List.length kvs = 3
        && List.for_all
             (fun (k, _) -> List.mem k [ kw "blocks"; kw "children"; kw "resources" ])
             kvs
      in
      let non_empty (v : Wire.t option) =
        match v with
        | Some (Wire.Array xs) | Some (Wire.List xs) -> xs <> []
        | _ -> false
      in
      let check k =
        match get k with
        | Some (Wire.Array xs) ->
            let limit = List.assoc k snapshot_request_limits in
            List.length xs <= limit && wire_dedup xs = xs
        | _ -> false
      in
      if
        ok_keys
        && (non_empty (get "blocks") || non_empty (get "children")
            || non_empty (get "resources"))
        && check "blocks" && check "children" && check "resources"
      then
        match get "blocks", get "children", get "resources" with
        | Some (Wire.Array b), Some (Wire.Array c), Some (Wire.Array r) -> (b, c, r)
        | _ -> fail "Invalid renderer snapshot request" [ (kw "request", request) ]
      else
        fail "Invalid renderer snapshot request"
          [ (kw "request", request)
          ; ( kw "limits"
            , Wire.Map
                (List.map (fun (k, n) -> (kw k, Wire.Int n)) snapshot_request_limits) ) ])
  | _ -> fail "Invalid renderer snapshot request" [ (kw "request", request) ]

(* merge-slots — conflict on same key with different value *)
let merge_slots (left : (Wire.t * Wire.t) list) (right : (Wire.t * Wire.t) list)
    : (Wire.t * Wire.t) list =
  List.fold_left
    (fun slots (k, v) ->
      match List.find_opt (fun (ek, _) -> ek = k) slots with
      | Some (_, existing) when existing <> v ->
          fail "Conflicting renderer snapshot slots" [ (kw "slot-key", k) ]
      | Some _ -> slots
      | None -> slots @ [ (k, v) ])
    left right

let block_snapshot_slots db (block_uuids : Wire.t list)
    : (Wire.t * Wire.t) list * ((Wire.t * Wire.t) list) =
  let canonical = Render_snapshot.canonical_blocks db block_uuids in
  let blocks, groups =
    match canonical with
    | Wire.Map kvs ->
        ( (match Plain_value.map_get "blocks" kvs with
           | Some (Wire.Map bm) -> bm
           | _ -> [])
        , match Plain_value.map_get "groups" kvs with
          | Some (Wire.Map gm) -> gm
          | _ -> [] )
    | _ -> ([], [])
  in
  let slots =
    List.fold_left
      (fun slots buuid ->
        if List.exists (fun (k, _) -> k = buuid) blocks then slots
        else
          slots @ [ (wkey [ kw "block"; buuid ], Wire.Map [ (kw "missing?", Wire.Bool true) ]) ])
      (block_slots blocks) block_uuids
  in
  let groups' =
    List.map
      (fun buuid ->
        let deps =
          match
            List.find_opt (fun (k, _) -> k = buuid) groups
          with
          | Some (_, Wire.Array dep_uuids) | Some (_, Wire.List dep_uuids)
          | Some (_, Wire.Set dep_uuids) ->
              List.map (fun d -> wkey [ kw "block"; d ]) dep_uuids
          | _ -> [ wkey [ kw "block"; buuid ] ]
        in
        (wkey [ kw "block"; buuid ], Wire.Set deps))
      block_uuids
  in
  (slots, groups')

let children_eager_block_limit = 200
let children_subtree_node_limit = 500

let children_snapshot_groups db (parent_uuids : Wire.t list)
    : (Wire.t * (Wire.t * Wire.t) list) list =
  List.map
    (fun parent ->
      match parent with
      | Wire.Uuid pu ->
          let children =
            Endpoint_block.open_children_tree db pu
              ~node_limit:children_subtree_node_limit ()
          in
          let eager_uuids =
            Endpoint_block.document_order_uuids children pu
              children_eager_block_limit
          in
          let canonical =
            Render_snapshot.canonical_blocks db
              (List.map (fun u -> Wire.Uuid u) eager_uuids)
          in
          let blocks =
            match canonical with
            | Wire.Map kvs -> (
                match Plain_value.map_get "blocks" kvs with
                | Some (Wire.Map bm) -> bm
                | _ -> [])
            | _ -> []
          in
          ( wkey [ kw "children"; Wire.Uuid pu ]
          , children_slots children @ block_slots blocks )
      | _ -> (parent, []))
    parent_uuids

let render_snapshots db (request : Wire.t) (runtime : runtime) : Wire.t =
  let blocks_req, children_req, resources_req = require_snapshot_request request in
  let resource_entries =
    List.map
      (fun rk ->
        match rk with
        | Wire.Array key -> (rk, resource_entry db key runtime)
        | _ -> (rk, resource_entry db [ rk ] runtime))
      resources_req
  in
  let block_slots', block_groups = block_snapshot_slots db blocks_req in
  let children_groups = children_snapshot_groups db children_req in
  let base_slots =
    List.fold_left merge_slots block_slots' (List.map snd children_groups)
  in
  let slots =
    List.fold_left
      (fun slots (rk, entry) ->
        let slots = merge_slots slots entry.slots in
        merge_slots slots
          [ ( wkey [ kw "resource"; rk ]
            , Wire.Map
                [ ( kw "watch"
                  , Wire.Map
                      [ ( kw "keys"
                        , Wire.Set (List.sort_uniq compare entry.watch_keys) )
                      ; (kw "all?", Wire.Bool entry.watch_all) ] )
                ; (kw "value", entry.value) ] ) ])
      base_slots resource_entries
  in
  let groups =
    block_groups
    @ List.map
        (fun parent ->
          let key = wkey [ kw "children"; parent ] in
          match List.find_opt (fun (k, _) -> k = key) children_groups with
          | Some (_, slot_map) ->
              ( key, Wire.Set (List.map fst slot_map |> List.sort_uniq compare) )
          | None -> (key, Wire.Set []))
        children_req
    @ List.map
        (fun (rk, entry) ->
          ( wkey [ kw "resource"; rk ]
          , Wire.Set
              (List.sort_uniq compare
                 (List.map fst entry.slots @ [ wkey [ kw "resource"; rk ] ])) ))
        resource_entries
  in
  Wire.Map
    [ (kw "basis-rev", Wire.Int (basis_rev db))
    ; (kw "slots", Wire.Map slots)
    ; (kw "groups", Wire.Map groups) ]

(* :thread-api/get-render-snapshots [repo request] *)
let get_render_snapshots args =
  let repo =
    match List.nth_opt args 0 with
    | Some (Wire.String r) -> r
    | Some Wire.Nil | None -> ""
    | _ -> invalid_arg "first arg must be repo name"
  in
  let request = Option.value (List.nth_opt args 1) ~default:Wire.Nil in
  match Worker_state.datascript_conn repo with
  | Some conn ->
      Db_worker_effect.pure
        (render_snapshots (Datascript.db conn) request { repo = Some repo })
  | None ->
      Db_worker_effect.error
        (Dispatcher.Exn_info
           ("Missing renderer snapshot database", [ (kw "repo", Wire.String repo) ]))

let () = Dispatcher.register "thread-api/get-render-snapshots" get_render_snapshots
