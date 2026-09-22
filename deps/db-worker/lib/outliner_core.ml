(* logseq.outliner.core — outliner write operations: save-block,
   insert-blocks, delete-blocks, move-blocks, indent/outdent.
   Faithful port of deps/outliner/src/logseq/outliner/core.cljs.

   cljs threads a mutable *txs-state atom through the write fns; here it is
   a plain [tx_op list ref]. cljs block inputs may be entities or plain
   maps; they are normalized to [Block_map.t] (entities via
   [Block_map.of_entity]) or resolved to entities as needed. *)

open Datascript

(* ---------- small value helpers ---------- *)

let kw (s : string) : value = Keyword s

let str_contains (s : string) (sub : string) : bool = Ns_util.str_contains s sub

let str_blank (s : string option) : bool =
  match s with None -> false | Some s -> String.trim s = ""

(* map value field accessors on Block_map.t *)
let mget (m : Block_map.t) (a : attr) : value option = Block_map.attr_value m a
let mget_str m a = Block_map.string_attr m a
let mget_uuid m a = Block_map.uuid_attr m a
let mget_int m a = Block_map.int_attr m a

(* cljs (:db/id x) on entity / map / vector lookup *)
let id_of_value (v : value) : entity_id option =
  match v with
  | Ref id -> Some id
  | Int id -> Some id
  | Ref_to (Entity_id id) -> Some id
  | Map kvs ->
      List.find_map
        (fun (k, x) ->
          match k with
          | Keyword "db/id" | String "db/id" -> (
              match x with Ref id | Int id -> Some id | _ -> None)
          | _ -> None)
        kvs
  | _ -> None

(* uuid of a value: uuid scalar, [:block/uuid u] lookup, {:block/uuid u} map *)
let uuid_of_value (v : value) : string option =
  match v with
  | Uuid u -> Some u
  | Vector [ Keyword "block/uuid"; Uuid u ] -> Some u
  | List [ Keyword "block/uuid"; Uuid u ] -> Some u
  | Map kvs ->
      List.find_map
        (fun (k, x) ->
          match k with
          | Keyword "block/uuid" | String "block/uuid" -> (
              match x with Uuid u -> Some u | _ -> None)
          | _ -> None)
        kvs
  | _ -> None

let string_of_value (v : value) : string option =
  match v with String s -> Some s | _ -> None

(* map-keys of a Map value as attr strings *)
let map_key_of (v : value) (a : attr) : value option =
  match v with
  | Map kvs ->
      List.find_map
        (fun (k, x) -> if k = Keyword a || k = String a then Some x else None)
        kvs
  | _ -> None

(* ---------- txs-state (cljs *txs-state atom) ---------- *)

type txs_state = { mutable txs : tx_op list }

let new_txs_state () : txs_state = { txs = [] }
let txs_push (s : txs_state) (ops : tx_op list) : unit = s.txs <- s.txs @ ops

(* ---------- direct-op-entry ---------- *)

let direct_op_entry (outliner_op : string) (args : value list) : value option =
  let block_id_of (v : value) : value =
    match uuid_of_value v with
    | Some u -> Uuid u
    | None -> v
  in
  match outliner_op with
  | "save-block" -> (
      match args with
      | [ _conn; block; opts ] ->
          Some
            (Vector [ Keyword "save-block"; Vector [ block; opts ] ])
      | _ -> None)
  | "insert-blocks" -> (
      match args with
      | [ _conn; blocks; target_block; opts ] ->
          Some
            (Vector
               [ Keyword "insert-blocks"
               ; Vector [ blocks; block_id_of target_block; opts ] ])
      | _ -> None)
  | "delete-blocks" -> (
      match args with
      | [ _conn; blocks; opts ] -> (
          let ids =
            match blocks with
            | Vector vs | List vs -> List.map block_id_of vs
            | _ -> [ blocks ]
          in
          Some
            (Vector
               [ Keyword "delete-blocks"; Vector [ Vector ids; opts ] ]))
      | _ -> None)
  | "move-blocks" -> (
      match args with
      | [ _conn; blocks; target_block; opts ] -> (
          let ids =
            match blocks with
            | Vector vs | List vs -> List.map block_id_of vs
            | _ -> [ blocks ]
          in
          Some
            (Vector
               [ Keyword "move-blocks"
               ; Vector [ Vector ids; block_id_of target_block; opts ] ]))
      | _ -> None)
  | "move-blocks-up-down" -> (
      match args with
      | [ _conn; blocks; up ] -> (
          let ids =
            match blocks with
            | Vector vs | List vs -> List.map block_id_of vs
            | _ -> [ blocks ]
          in
          Some
            (Vector
               [ Keyword "move-blocks-up-down"; Vector [ Vector ids; up ] ]))
      | _ -> None)
  | "indent-outdent-blocks" -> (
      match args with
      | [ _conn; blocks; indent; opts ] -> (
          let ids =
            match blocks with
            | Vector vs | List vs -> List.map block_id_of vs
            | _ -> [ blocks ]
          in
          Some
            (Vector
               [ Keyword "indent-outdent-blocks"
               ; Vector [ Vector ids; indent; opts ] ]))
      | _ -> None)
  | _ -> None

(* ---------- block-with-timestamps / block-with-updated-at ---------- *)

(* common-util/block-with-timestamps *)
let block_with_timestamps (block : Block_map.t) : Block_map.t =
  let updated_at = Int (Int64.to_int (Date_time_util.time_ms ())) in
  let block = Block_map.put block "block/updated-at" updated_at in
  if not (Block_map.mem block "block/created-at") then
    Block_map.put block "block/created-at" updated_at
  else block

let block_with_updated_at (block : Block_map.t) : Block_map.t =
  Block_map.put block "block/updated-at"
    (Int (Int64.to_int (Date_time_util.time_ms ())))

(* ---------- filter-top-level-blocks ---------- *)

let filter_top_level_blocks (db : db) (blocks : Block_map.t list) : entity list =
  let block_ids =
    List.filter_map (fun m -> mget_int m "db/id") blocks
  in
  let parent_ids =
    List.filter_map
      (fun m ->
        match mget m "block/parent" with
        | Some v -> id_of_value v
        | None -> None)
      blocks
  in
  let top_parent_ids = List.filter (fun id -> List.mem id block_ids) parent_ids in
  blocks
  |> List.filter (fun m ->
      match mget m "block/parent" with
      | Some v ->
          (match id_of_value v with
           | Some pid -> not (List.mem pid top_parent_ids)
           | None -> true)
      | None -> true)
  |> List.filter_map (fun m ->
      match mget m "db/id" with
      | Some (Int id) | Some (Ref id) -> Ldb.ent_of_id db id
      | _ -> None)

(* ---------- remove-orphaned-page-refs! ---------- *)

let remove_orphaned_page_refs (db : db) (db_id : entity_id) (txs_state : txs_state)
    (old_refs : entity list) (new_refs : value list) : unit =
  let new_names =
    List.filter_map
      (fun r ->
        match map_key_of r "block/name" with
        | Some (String s) -> Some s
        | _ -> (
            match id_of_value r with
            | Some id -> (
                match Ldb.ent_of_id db id with
                | Some e -> Ldb.string_value e "block/name"
                | None -> None)
            | None -> None))
      new_refs
  in
  let old_names =
    List.filter_map
      (fun (e : entity) -> Ldb.string_value e "block/name")
      old_refs
    |> List.filter (fun n -> not (List.mem n new_names))
  in
  if old_names <> [] then begin
    let orphaned =
      Ldb.get_orphaned_pages db old_names
        ~empty_ref_f:(fun (page : entity) ->
          let refs = Ldb.ref_ids page "block/_refs" in
          (refs = [] || refs = [ db_id ])
          && not (Ldb.is_class page)
          && not (Ldb.is_property page))
        ~built_in_pages_names:Ldb.built_in_pages_names
    in
    txs_push txs_state
      (List.map (fun (p : entity) -> RetractEntity (Entity_id p.id)) orphaned)
  end

(* ---------- update-page-when-save-block ---------- *)

let update_page_when_save_block (txs_state : txs_state) (block_entity : entity) : unit =
  match Ldb.ref_ent block_entity "block/page" with
  | Some e ->
      let now = Int (Int64.to_int (Date_time_util.time_ms ())) in
      let m =
        [ ("db/id", Ref e.id); ("block/updated-at", now) ]
      in
      let m =
        if not (Option.is_some (Ldb.value e "block/created-at")) then
          m @ [ ("block/created-at", now) ]
        else m
      in
      txs_push txs_state [ Entity { db_id = Some (Entity_id e.id); attrs = [] } ];
      (* cljs appends raw maps; encode as Entity ops via Block_map *)
      let te =
        { db_id = Some (Entity_id e.id)
        ; attrs =
            List.filter_map
              (fun (a, v) ->
                match v with
                | Ref id -> Some (a, One_entity { db_id = Some (Entity_id id); attrs = [] })
                | Int n -> Some (a, One_value (Int n))
                | _ -> None)
              m
        }
      in
      txs_push txs_state [ Entity te ]
  | None -> ()

(* ---------- remove-orphaned-refs-when-save ---------- *)

let remove_orphaned_refs_when_save (db : db) (txs_state : txs_state)
    (block_entity : entity) (m : Block_map.t) : unit =
  let self_page_id =
    match Ldb.ref_ent block_entity "block/page" with
    | Some p -> Some p.id
    | None -> None
  in
  let content_refs =
    Outliner_pipeline.block_content_refs db block_entity
  in
  let old_refs =
    Ldb.ref_ents block_entity "block/refs"
    |> List.filter (fun r -> List.mem r.id content_refs)
  in
  let new_refs =
    match Block_map.attr_value m "block/refs" with
    | Some (Vector vs) | Some (List vs) | Some (Set vs) ->
        List.filter
          (fun v ->
            match id_of_value v with
            | Some id -> Some id <> self_page_id
            | None -> true)
          vs
    | _ -> []
  in
  remove_orphaned_page_refs db block_entity.id txs_state old_refs new_refs

(* ---------- get-last-child-or-self ---------- *)

let get_last_child_or_self (db : db) (block : entity) : entity * bool =
  match
    Ldb.get_block_last_direct_child_id db ~not_collapsed:true block.id
  with
  | Some id -> (
      match Ldb.ent_of_id db id with
      | Some e -> (e, true)
      | None -> (block, false))
  | None -> (block, false)

(* ---------- rebuild-block-refs ---------- *)

let rebuild_block_refs (db : db) (block : entity) : entity_id list =
  Outliner_pipeline.db_rebuild_block_refs db block ()

(* ---------- fix-tag-ids ---------- *)

(* tx wire value -> tx_op — used only for :db/other-tx entries which
   arrive as plain vector/map tx forms. *)
let tx_op_of_value (db : db) (v : value) : tx_op option =
  match v with
  | Map pairs ->
      let m =
        List.filter_map
          (fun (k, v') ->
            match k with
            | Keyword a -> Some (a, v')
            | String a -> Some (a, v')
            | _ -> None)
          pairs
      in
      Some (Block_map.to_tx_op db m)
  | Vector [ Keyword ":db/add"; e; String a; v' ]
  | List [ Keyword ":db/add"; e; String a; v' ]
  | Vector [ Keyword "db/add"; e; String a; v' ]
  | List [ Keyword "db/add"; e; String a; v' ] ->
      Option.map
        (fun r -> Add (r, a, v'))
        (Block_map.entity_ref_of_value e)
  | Vector [ Keyword ":db/retract"; e; String a ]
  | List [ Keyword ":db/retract"; e; String a ]
  | Vector [ Keyword "db/retract"; e; String a ]
  | List [ Keyword "db/retract"; e; String a ] ->
      Option.map (fun r -> RetractAttr (r, a)) (Block_map.entity_ref_of_value e)
  | Vector [ Keyword ":db/retract"; e; String a; v' ]
  | List [ Keyword ":db/retract"; e; String a; v' ]
  | Vector [ Keyword "db/retract"; e; String a; v' ]
  | List [ Keyword "db/retract"; e; String a; v' ] ->
      Option.map
        (fun r -> Retract (r, a, Some v'))
        (Block_map.entity_ref_of_value e)
  | Vector [ Keyword ":db/retractEntity"; e ]
  | List [ Keyword ":db/retractEntity"; e ]
  | Vector [ Keyword "db/retractEntity"; e ]
  | List [ Keyword "db/retractEntity"; e ] ->
      Option.map (fun r -> RetractEntity r) (Block_map.entity_ref_of_value e)
  | _ -> None

(* tag/ref accessors — tags and refs are Map values (or bare Keyword) *)
let tag_db_id (v : value) : entity_id option = id_of_value v

let tag_name db (v : value) : string option =
  match map_key_of v "block/name" with
  | Some (String s) -> Some s
  | _ -> (
      match map_key_of v "block/title" with
      | Some (String s) -> Some s
      | _ -> (
          match id_of_value v with
          | Some id -> (
              match Ldb.ent_of_id db id with
              | Some e ->
                  (match Ldb.string_value e "block/name" with
                   | Some s -> Some s
                   | None -> Ldb.string_value e "block/title")
              | None -> None)
          | None -> None))

let tag_title db (v : value) : string option =
  match map_key_of v "block/title" with
  | Some (String s) -> Some s
  | _ -> (
      match id_of_value v with
      | Some id -> (
          match Ldb.ent_of_id db id with Some e -> Ldb.string_value e "block/title"
          | None -> None)
      | None -> None)

let tag_uuid db (v : value) : string option =
  match uuid_of_value v with
  | Some u -> Some u
  | None -> (
      match id_of_value v with
      | Some id -> (
          match Ldb.ent_of_id db id with
          | Some e -> Ldb.uuid_value e "block/uuid"
          | None -> None)
      | None -> None)

let tag_ident db (v : value) : string option =
  match map_key_of v "db/ident" with
  | Some (Keyword k) -> Some k
  | _ -> (
      match id_of_value v with
      | Some id -> (
          match Ldb.ent_of_id db id with
          | Some e -> Ldb.ident_of e
          | None -> None)
      | None -> None)

(* put a key into a tag Map value (no-op for non-maps) *)
let tag_put (v : value) (k : attr) (x : value) : value =
  match v with
  | Map kvs ->
      Map
        (List.filter (fun (k', _) -> k' <> Keyword k && k' <> String k) kvs
         @ [ (Keyword k, x) ])
  | _ -> v

let tag_dissoc (v : value) (a : attr) : value =
  match v with
  | Map kvs ->
      Map (List.filter (fun (k, _) -> k <> Keyword a && k <> String a) kvs)
  | _ -> v

(* narrow a tag map to [:db/id :block/uuid :block/title :block/name] resolved
   via its entity *)
let tag_select (db : db) (v : value) : value =
  match tag_db_id v with
  | Some id -> (
      match Ldb.ent_of_id db id with
      | Some e ->
          Map
            (List.filter_map
               (fun x -> x)
               [ Some (Keyword "db/id", Ref e.id)
               ; (match Ldb.uuid_value e "block/uuid" with
                  | Some u -> Some (Keyword "block/uuid", Uuid u)
                  | None -> None)
               ; (match Ldb.string_value e "block/title" with
                  | Some t -> Some (Keyword "block/title", String t)
                  | None -> None)
               ; (match Ldb.string_value e "block/name" with
                  | Some n -> Some (Keyword "block/name", String n)
                  | None -> None) ])
      | None -> v)
  | None -> v

(* fix-tag-ids — repair block/tags from block/refs when title-based refs
   were re-resolved (Escape path). *)
let fix_tag_ids (m : Block_map.t) (db : db) : Block_map.t =
  let refs_v =
    match mget m "block/refs" with
    | Some (Vector vs) | Some (List vs) | Some (Set vs) -> vs
    | _ -> []
  in
  let ref_names = List.filter_map (tag_name db) refs_v in
  let tags_v =
    match mget m "block/tags" with
    | Some (Vector vs) | Some (List vs) | Some (Set vs) -> vs
    | _ -> []
  in
  if ref_names = [] || tags_v = [] then m
  else
    let tags =
      List.map (fun t -> match tag_db_id t with Some _ -> tag_select db t | None -> t)
        tags_v
    in
    let tags =
      List.map
        (fun tag ->
          match tag_name db tag with
          | Some n when List.mem n ref_names ->
              let matched =
                List.find_opt (fun r -> tag_name db r = Some n) refs_v
              in
              let tag =
                match matched with
                | Some r -> (
                    match uuid_of_value r with
                    | Some u -> tag_put tag "block/uuid" (Uuid u)
                    | None -> tag)
                | None -> tag
              in
              (match matched with
               | Some r -> (
                   match map_key_of r "db/ident" with
                   | Some (Keyword i) -> tag_put tag "db/ident" (Keyword i)
                   | _ -> tag)
               | None -> tag)
          | _ -> tag)
        tags
    in
    let ref_titles = List.filter_map (tag_title db) refs_v in
    let lc_ref_titles = List.map String.lowercase_ascii ref_titles in
    let tags =
      List.filter
        (fun tag ->
          match tag_title db tag with
          | Some t ->
              not
                ((not (List.mem t ref_titles))
                 && List.mem (String.lowercase_ascii t) lc_ref_titles)
          | None -> true)
        tags
    in
    Block_map.put m "block/tags" (Vector tags)

(* ---------- ref-tags / ref-tag-idents / new-page-ref? ---------- *)

(* (:block/tags ref) as a value list *)
let ref_tags (v : value) : value list =
  match map_key_of v "block/tags" with
  | Some (Keyword k) -> [ Keyword k ]
  | Some (Vector vs) | Some (List vs) | Some (Set vs) -> vs
  | _ -> []

let ref_tag_idents (v : value) : string list =
  List.filter_map
    (fun tag ->
      match tag with
      | Keyword k -> Some k
      | Map _ -> (
          match map_key_of tag "db/ident" with
          | Some (Keyword k) -> Some k
          | _ -> None)
      | _ -> None)
    (ref_tags v)

let new_page_ref (v : value) : bool =
  match v with
  | Map _ ->
      map_key_of v "db/id" = None
      && map_key_of v "db/ident" = None
      &&
      (let block_type =
         match map_key_of v "block/type" with
         | Some (String s) -> Some s
         | Some (Keyword s) -> Some s
         | _ -> None
       in
       match block_type with
       | Some ("page" | "journal") -> true
       | _ ->
           List.exists
             (fun i ->
               i = "logseq.class/Page" || i = "logseq.class/Journal")
             (ref_tag_idents v))
  | _ -> false

(* ---------- resolve-page-ref ---------- *)

(* entity -> full Map value (cljs (d/entity db x) embedded in a value) *)
let entity_map_value (e : entity) : value =
  Map (List.map (fun (a, v) -> (Keyword a, v)) (Block_map.of_entity e))

(* select [:db/id :block/uuid :block/title :block/name :db/ident] of an
   entity into a Map value *)
let entity_select_map (e : entity) : value =
  Map
    (List.filter_map
       (fun x -> x)
       [ Some (Keyword "db/id", Ref e.id)
       ; (match Ldb.uuid_value e "block/uuid" with
          | Some u -> Some (Keyword "block/uuid", Uuid u)
          | None -> None)
       ; (match Ldb.string_value e "block/title" with
          | Some t -> Some (Keyword "block/title", String t)
          | None -> None)
       ; (match Ldb.string_value e "block/name" with
          | Some n -> Some (Keyword "block/name", String n)
          | None -> None)
       ; (match Ldb.ident_of e with
          | Some i -> Some (Keyword "db/ident", Keyword i)
          | None -> None) ])

(* -> (resolved ref map, page creation tx) *)
let resolve_page_ref (db : db) (v : value) (tag_names : string list)
    : value * tx_op list =
  if not (new_page_ref v) then (v, [])
  else
    let name =
      match map_key_of v "block/name" with
      | Some (String s) -> s
      | _ -> ""
    in
    let class_ = List.mem name tag_names in
    match
      if not class_ then Ldb.get_page db (String name) else None
    with
    | Some page ->
        let m =
          match entity_select_map page with
          | Map kvs -> kvs
          | _ -> []
        in
        let m =
          match map_key_of v "block.temp/original-page-name" with
          | Some x -> m @ [ (Keyword "block.temp/original-page-name", x) ]
          | None -> m
        in
        (Map m, [])
    | None ->
        let title =
          match map_key_of v "block/title" with
          | Some (String s) -> s
          | _ -> name
        in
        let uuid_ =
          match uuid_of_value v with Some u -> Some u | None -> None
        in
        let journal_ =
          (match map_key_of v "block/type" with
           | Some (String "journal") | Some (Keyword "journal") -> true
           | _ -> false)
          || List.mem "logseq.class/Journal" (ref_tag_idents v)
        in
        let res =
          Outliner_page.create db title ?uuid:uuid_ ~class_
            ~journal:journal_ ()
        in
        (match res.page_uuid with
         | Some page_uuid ->
             let m =
               match map_key_of v "block.temp/original-page-name" with
               | Some x ->
                   [ (Keyword "block/title", String title)
                   ; (Keyword "block/name", String name)
                   ; (Keyword "block.temp/original-page-name", x) ]
               | None ->
                   [ (Keyword "block/title", String title)
                   ; (Keyword "block/name", String name) ]
             in
             let m = m @ [ (Keyword "block/uuid", Uuid page_uuid) ] in
             let m =
               if class_ then
                 let ident =
                   match
                     entity db (Lookup_ref ("block/uuid", Uuid page_uuid))
                   with
                   | Some e -> Ldb.ident_of e
                   | None -> None
                 in
                 match ident with
                 | Some i -> m @ [ (Keyword "db/ident", Keyword i) ]
                 | None -> m
               else m
             in
             let tx_data =
               List.filter_map
                 (fun w -> tx_op_of_value db (Ds_wire.value_of_transit w))
                 res.tx_data
             in
             (Map m, tx_data)
         | None -> (v, []))

(* resolve-page-refs — rewrite block/refs + block/tags and title uuids *)
let resolve_page_refs (db : db) (block : Block_map.t) : Block_map.t * tx_op list =
  let refs =
    match mget block "block/refs" with
    | Some (Vector vs) | Some (List vs) | Some (Set vs) -> vs
    | _ -> []
  in
  if refs = [] then (block, [])
  else
    let tag_names =
      match mget block "block/tags" with
      | Some (Vector vs) | Some (List vs) | Some (Set vs) ->
          List.filter_map
            (fun t ->
              match map_key_of t "block/name" with
              | Some (String s) -> Some s
              | _ -> None)
            vs
      | _ -> []
    in
    let resolved = List.map (fun r -> resolve_page_ref db r tag_names) refs in
    let refs' = List.map fst resolved in
    let page_txs = List.concat_map snd resolved in
    let tag_refs =
      List.filter_map
        (fun r ->
          match map_key_of r "db/ident", map_key_of r "block/name" with
          | Some _, Some (String n) -> Some (n, r)
          | _ -> None)
        refs'
    in
    let tags =
      match mget block "block/tags" with
      | Some (Vector vs) | Some (List vs) | Some (Set vs) -> vs
      | _ -> []
    in
    let tags' =
      List.map
        (fun tag ->
          let tn =
            match map_key_of tag "block/name" with
            | Some (String s) -> Some s
            | _ -> None
          in
          match tn with
          | Some n -> (
              match List.assoc_opt n tag_refs with
              | Some r ->
                  let tag = tag_dissoc tag "block/type" in
                  let tag =
                    match map_key_of r "block/uuid" with
                    | Some u -> tag_put tag "block/uuid" u
                    | None -> tag
                  in
                  (match map_key_of r "db/ident" with
                   | Some i -> tag_put tag "db/ident" i
                   | None -> tag)
              | None -> tag)
          | None -> tag)
        tags
    in
    let replacements =
      List.filter_map
        (fun (r, r') ->
          match uuid_of_value r, uuid_of_value r' with
          | Some old_u, Some new_u when old_u <> new_u -> Some (old_u, new_u)
          | _ -> None)
        (List.combine refs refs')
    in
    let replace_refs title =
      List.fold_left
        (fun (t : string) (old_u, new_u) ->
          Db_content.replace_all t
            ~pattern:(Page_ref.to_page_ref old_u)
            ~replacement:(Page_ref.to_page_ref new_u))
        title replacements
    in
    let block = Block_map.put block "block/refs" (Vector refs') in
    let block = Block_map.put block "block/tags" (Vector tags') in
    let block =
      if replacements <> [] then
        let block =
          match mget_str block "block/title" with
          | Some t -> Block_map.put block "block/title" (String (replace_refs t))
          | None -> block
        in
        match mget_str block "block/raw-title" with
        | Some t -> Block_map.put block "block/raw-title" (String (replace_refs t))
        | None -> block
      else block
    in
    (block, page_txs)

(* ---------- remove-tags-when-title-changed ---------- *)

let remove_tags_when_title_changed (block : entity) (new_content : string option)
    : tx_op list =
  match Ldb.string_value block "block/raw-title", new_content with
  | Some raw_title, Some new_content ->
      Ldb.ref_ents block "block/tags"
      |> List.filter (fun tag ->
          let in_old =
            match Ldb.uuid_value tag "block/uuid" with
            | Some u -> Ldb.inline_tag raw_title u
            | None -> false
          in
          let in_new =
            match Ldb.uuid_value tag "block/uuid" with
            | Some u -> Ldb.inline_tag new_content u
            | None -> false
          in
          in_old && not in_new)
      |> List.map (fun tag -> Retract (Entity_id block.id, "block/tags", Some (Ref tag.id)))
  | _ -> []

(* ---------- add-missing-tag-idents ---------- *)

let add_missing_tag_idents (db : db) (tags : value list) : tx_op list =
  List.concat_map
    (fun t ->
      let db_id = id_of_value t in
      let has_ident =
        match map_key_of t "db/ident" with Some _ -> true | None -> false
      in
      let uuid =
        match uuid_of_value t with Some u -> Some u | None -> None
      in
      match db_id, has_ident, uuid with
      | None, false, Some u ->
          let eid = Lookup_ref ("block/uuid", Uuid u) in
          let title =
            match map_key_of t "block/title" with
            | Some (String s) -> s
            | _ -> ""
          in
          [ Add (eid, "db/ident",
                 Keyword (Db_ident.create_user_class_ident_from_name ~db title))
          ; Add (eid, "logseq.property.class/extends",
                 Ref_to (Ident "logseq.class/Root"))
          ; Retract (eid, "block/tags", Some (Ref_to (Ident "logseq.class/Page"))) ]
      | _ -> [])
    tags

(* ---------- inline-tag-disallowed? / remove-disallowed-inline-classes ---------- *)

let inline_tag_disallowed (db : db) (t : value) : bool =
  let disallowed_idents = Db_class.disallowed_inline_tags @
    [ "logseq.property/query"; "logseq.property/asset" ] in
  match t with
  | Map _ ->
      let ident =
        match tag_ident db t with
        | Some i -> Some i
        | None -> None
      in
      let ident =
        match ident with
        | Some i -> Some i
        | None -> (
            match tag_uuid db t with
            | Some u -> (
                match entity db (Lookup_ref ("block/uuid", Uuid u)) with
                | Some e -> Ldb.ident_of e
                | None -> None)
            | None -> None)
      in
      (match ident with
       | Some i when List.mem i disallowed_idents -> true
       | _ -> false)
      ||
      (let title =
         match map_key_of t "block/title" with
         | Some (String s) -> Some s
         | _ -> (
             match tag_uuid db t with
             | Some u -> (
                 match entity db (Lookup_ref ("block/uuid", Uuid u)) with
                 | Some e -> Ldb.string_value e "block/title"
                 | None -> None)
             | None -> None)
       in
       match title with
       | Some t -> List.mem t Ldb.built_in_pages_names
       | None -> false)
  | _ -> false

(* remove-disallowed-inline-classes *)
let remove_disallowed_inline_classes (db : db) (block : Block_map.t) : Block_map.t =
  let as_entity =
    match mget block "db/id" with
    | Some v -> (
        match id_of_value v with
        | Some id -> Ldb.ent_of_id db id
        | None -> None)
    | None -> None
  in
  let is_page =
    match as_entity with
    | Some e -> Ldb.is_page e
    | None -> Option.is_some (mget block "block/name")
  in
  if is_page then block
  else
    let tags_v =
      match mget block "block/tags" with
      | Some v -> (
          match v with
          | Int _ | Ref _ | Keyword _ -> (
              (* scalar tag -> resolve to entity *)
              match v with
              | Int id -> (
                  match Ldb.ent_of_id db id with
                  | Some e -> [ entity_map_value e ]
                  | None -> [])
              | Ref id -> (
                  match Ldb.ent_of_id db id with
                  | Some e -> [ entity_map_value e ]
                  | None -> [])
              | Keyword k -> (
                  match entity db (Ident k) with
                  | Some e -> [ entity_map_value e ]
                  | None -> [])
              | _ -> [])
          | Vector [ Keyword "block/uuid"; Uuid u ]
          | List [ Keyword "block/uuid"; Uuid u ] -> (
              match entity db (Lookup_ref ("block/uuid", Uuid u)) with
              | Some e -> [ entity_map_value e ]
              | None -> [])
          | Vector vs | List vs | Set vs ->
              List.filter_map
                (fun t ->
                  match t with
                  | Keyword k -> (
                      match entity db (Ident k) with
                      | Some e -> Some (entity_map_value e)
                      | None -> None)
                  | _ -> Some t)
                vs
          | _ -> [])
      | None -> []
    in
    if tags_v = [] then block
    else
      let block = Block_map.put block "block/tags" (Vector tags_v) in
      let disallowed =
        List.filter (fun t -> inline_tag_disallowed db t) tags_v
      in
      let title = Option.value (mget_str block "block/title") ~default:"" in
      let is_disallowed_inline t =
        match tag_uuid db t with
        | Some u -> str_contains title ("#" ^ Page_ref.to_page_ref u)
        | None -> false
      in
      if disallowed <> [] && List.exists is_disallowed_inline disallowed then begin
        let block =
          Block_map.put block "block/tags"
            (Vector
               (List.filter (fun t -> not (inline_tag_disallowed db t)) tags_v))
        in
        let block =
          match mget block "block/refs" with
          | Some (Vector vs) | Some (List vs) | Some (Set vs) ->
              Block_map.put block "block/refs"
                (Vector
                   (List.filter
                      (fun r -> not (inline_tag_disallowed db r))
                      vs))
          | _ -> block
        in
        let title' =
          List.fold_left
            (fun (t : string) tag ->
              match tag_uuid db tag, map_key_of tag "block/title" with
              | Some u, Some (String ttitle) ->
                  Db_content.replace_all t
                    ~pattern:("#" ^ Page_ref.to_page_ref u)
                    ~replacement:("#" ^ ttitle)
                  |> String.trim
              | _ -> t)
            title disallowed
        in
        Block_map.put block "block/title" (String title')
      end
      else block

(* ---------- db-schema/retract-attributes ---------- *)

let retract_attributes = [ "block/warning" ]

(* ---------- -save (INode save on a block) ---------- *)

type save_opts =
  { retract_attributes : bool
  ; retract_attr_list : attr list
  ; outliner_op : string option }

let default_save_opts =
  { retract_attributes = true; retract_attr_list = []; outliner_op = None }

(* -save — [data] is the incoming block map (entity flattened into a map
   by callers). Returns tx ops accumulated into [txs_state]. *)
let save_in_txs (db : db) (txs_state : txs_state) (data : Block_map.t)
    (opts : save_opts) : unit =
  let data' = remove_disallowed_inline_classes db data in
  let data'' =
    Block_map.dissoc data'
      [ "block/children"; "block/meta"; "block/unordered"
      ; "block.temp/ast-title"; "block.temp/ast-body"; "block/level"
      ; "block.temp/load-status"; "block.temp/has-children?" ]
  in
  let block, page_txs = resolve_page_refs db data'' in
  let collapse_or_expand =
    opts.outliner_op = Some "collapse-expand-blocks"
  in
  let m0 = fix_tag_ids block db in
  let m0 = if collapse_or_expand then m0 else block_with_updated_at m0 in
  let db_id = mget_int m0 "db/id" in
  let block_uuid = mget_uuid m0 "block/uuid" in
  let eid : entity_ref option =
    match db_id with
    | Some id -> Some (Entity_id id)
    | None -> (
        match block_uuid with
        | Some u -> Some (Lookup_ref ("block/uuid", Uuid u))
        | None -> None)
  in
  let block_entity = Option.bind eid (entity db) in
  let page_ =
    match block_entity with
    | Some e -> Ldb.is_page e
    | None -> false
  in
  let m0 =
    match block_entity, mget_str m0 "block/title" with
    | Some e, Some t ->
        if not (Option.is_some (Ldb.value e "logseq.property.node/display-type"))
        then
          Block_map.put m0 "block/title" (String (Db_content.clear_markdown_heading t))
        else m0
    | _ -> m0
  in
  let block_title = mget_str m0 "block/title" in
  let page_title_changed =
    match block_entity, block_title with
    | Some e, Some t ->
        page_ && Ldb.string_value e "block/title" <> Some t
    | _ -> false
  in
  (match block_entity, block_title with
   | Some _, Some t when page_ ->
       Outliner_validate.validate_page_title_characters t
   | _ -> ());
  let m =
    if page_title_changed then begin
      (match block_title with Some t -> Outliner_validate.validate_page_title t | None -> ());
      let e = Option.get block_entity in
      let page_name =
        match Ldb.value e "block/journal-day" with
        | Some (Int day) ->
            Ldb.page_name_sanity_lc
              (Ldb.journal_title_of_day day
                 Date_time_util.default_journal_title_formatter)
        | _ -> (
            match block_title with
            | Some t -> Ldb.page_name_sanity_lc t
            | None -> "")
      in
      Block_map.put m0 "block/name" (String page_name)
    end
    else m0
  in
  (match block_entity, mget_str m "block/title" with
   | Some e, Some t
     when (Ldb.is_page e || Ldb.is_object e)
          && Ldb.string_value e "block/title" <> Some t ->
       Outliner_validate.validate_block_title db t (Some e)
   | _ -> ());
  (* uuid never changes *)
  (match db_id, block_uuid with
   | Some id, Some u -> (
       match Ldb.ent_of_id db id with
       | Some e ->
           if Ldb.uuid_value e "block/uuid" <> Some u then
             failwith "Block UUID changed"
       | None -> ())
   | _ -> ());
  txs_push txs_state page_txs;
  (match eid with
   | Some eid ->
       let do_retract =
         (opts.retract_attributes && mget_str m "block/title" <> None)
         || opts.retract_attr_list <> []
       in
       if do_retract then begin
         let attrs = retract_attributes @ opts.retract_attr_list in
         txs_push txs_state
           (List.map (fun a -> RetractAttr (eid, a)) attrs)
       end;
       (match block_entity with
        | Some e ->
            if not collapse_or_expand then
              update_page_when_save_block txs_state e;
            (match mget_str m "block/title" with
             | Some t when Ldb.string_value e "block/title" <> Some t ->
                 remove_orphaned_refs_when_save db txs_state e m
             | _ -> ())
        | None -> ())
   | None -> ());
  (* :db/other-tx — raw tx entries encoded as vectors *)
  let m =
    match mget m "db/other-tx" with
    | Some (Vector vs) | Some (List vs) ->
        txs_push txs_state (List.filter_map (tx_op_of_value db) vs);
        Block_map.dissoc m [ "db/other-tx" ]
    | _ -> m
  in
  txs_push txs_state [ Block_map.to_tx_op db m ];
  (match block_entity with
   | Some e ->
       if Ldb.values e "block/tags" <> [] then
         txs_push txs_state
           (remove_tags_when_title_changed e (mget_str m "block/title"))
   | None -> ());
  (match mget m "block/tags" with
   | Some (Vector vs) | Some (List vs) | Some (Set vs) ->
       txs_push txs_state (add_missing_tag_idents db vs)
   | _ -> ())


(* ---------- save-block ---------- *)

exception Block_eid_missing

type tx_result = { tx_data : tx_op list; tx_meta : tx_meta }

let save_block (db : db) (block : Block_map.t) (opts : save_opts) : tx_result =
  let eid =
    match mget_int block "db/id" with
    | Some _ -> true
    | None -> mget_uuid block "block/uuid" <> None
  in
  if not eid then raise Block_eid_missing;
  let entity_ =
    match mget_int block "db/id" with
    | Some id -> Ldb.ent_of_id db id
    | None -> (
        match mget_uuid block "block/uuid" with
        | Some u -> entity db (Lookup_ref ("block/uuid", Uuid u))
        | None -> None)
  in
  (match entity_ with
   | Some e when Outliner_validate.built_in_entity e ->
       raise
         (Outliner_validate.Notification
            (Outliner_validate.notification_payload
               ~message:"Built-in nodes can't be modified" ~i18n_key:"" ~i18n_args:[]))
   | _ -> ());
  let txs_state = new_txs_state () in
  let block' =
    match entity_ with
    | Some e -> Block_map.merge (Block_map.of_entity e) block
    | None -> block
  in
  save_in_txs db txs_state block' opts;
  { tx_data = txs_state.txs; tx_meta = [] }

(* ---------- insert-blocks ---------- *)

let get_right_siblings (node : entity) : entity list =
  match Ldb.ref_ent node "block/parent" with
  | Some parent -> (
      let children = Ldb.sort_by_order (Ldb.ref_ents parent "block/_parent") in
      let rec drop_until l =
        match l with
        | x :: rest ->
            let xu = Ldb.uuid_value x "block/uuid" in
            let nu = Ldb.uuid_value node "block/uuid" in
            if xu = nu then rest else drop_until rest
        | [] -> []
      in
      drop_until children)
  | None -> []

let blocks_with_ordered_list_props (blocks : Block_map.t list)
    (target_block : entity) (sibling : bool) : Block_map.t list =
  let target_block =
    if sibling then Some target_block else Ldb.get_down target_block
  in
  let list_type =
    match target_block with
    | Some tb -> Ldb.ref_ent tb "logseq.property/order-list-type"
    | None -> None
  in
  match list_type with
  | Some lt ->
      List.map
        (fun b ->
          match mget_uuid b "block/uuid" with
          | Some _ -> (
              let has_list =
                match mget b "logseq.property/order-list-type" with
                | Some _ -> true
                | None -> false
              in
              if has_list then b
              else
                Block_map.put b "logseq.property/order-list-type" (Ref lt.id))
          | None -> b)
        blocks
  | None -> blocks

let get_block_orders (blocks : Block_map.t list) (target_block : entity)
    (sibling : bool) (keep_block_order : bool) : string list =
  if keep_block_order
     && List.for_all (fun b -> mget_str b "block/order" <> None) blocks
  then List.filter_map (fun b -> mget_str b "block/order") blocks
  else
    let target_order = Ldb.string_value target_block "block/order" in
    let start_order = if sibling then target_order else None in
    let end_order =
      if sibling then
        match Ldb.get_right_sibling target_block with
        | Some r -> Ldb.string_value r "block/order"
        | None -> None
      else
        match Ldb.get_down target_block with
        | Some c -> Ldb.string_value c "block/order"
        | None -> None
    in
    Db_order.gen_n_keys (List.length blocks) start_order end_order

(* update-property-ref-when-paste — [:block/uuid u] values get reminted *)
let update_property_ref_when_paste (block : Block_map.t)
    (uuids : (string * string) list) : Block_map.t =
  let is_id_lookup v =
    match v with
    | Vector [ Keyword "block/uuid"; _ ] -> true
    | List [ Keyword "block/uuid"; _ ] -> true
    | _ -> false
  in
  let resolve_id v =
    match v with
    | Vector [ Keyword "block/uuid"; Uuid u ] ->
        Vector
          [ Keyword "block/uuid"
          ; Uuid (match List.assoc_opt u uuids with Some u' -> u' | None -> u) ]
    | List [ Keyword "block/uuid"; Uuid u ] ->
        List
          [ Keyword "block/uuid"
          ; Uuid (match List.assoc_opt u uuids with Some u' -> u' | None -> u) ]
    | _ -> v
  in
  List.map
    (fun (k, v) ->
      let v' =
        if is_id_lookup v then resolve_id v
        else
          match v with
          | Vector vs | List vs | Set vs ->
              if List.for_all is_id_lookup vs && vs <> [] then
                Vector (List.map resolve_id vs)
              else v
          | _ -> v
      in
      (k, v'))
    block

let get_target_block_page (target_block : entity) (sibling : bool) : entity_id option =
  match Ldb.ref_ent target_block "block/page" with
  | Some p -> Some p.id
  | None -> (
      if sibling then
        match Ldb.ref_ent target_block "block/parent" with
        | Some p when Ldb.is_page p -> Some p.id
        | _ ->
            (* target-block is a page itself *)
            if Ldb.is_page target_block then Some target_block.id else None
      else if Ldb.is_page target_block then Some target_block.id
      else None)

type insert_opts =
  { sibling : bool
  ; bottom : bool
  ; top : bool
  ; indent : bool
  ; up : bool
  ; keep_uuid : bool
  ; keep_block_order : bool
  ; outliner_op : string option
  ; outliner_real_op : string option
  ; replace_empty_target : bool
  ; update_timestamps : bool
  ; insert_template : bool
  ; created_from_property : value option }

let default_insert_opts =
  { sibling = false
  ; bottom = false
  ; top = false
  ; indent = false
  ; up = false
  ; keep_uuid = false
  ; keep_block_order = false
  ; outliner_op = None
  ; outliner_real_op = None
  ; replace_empty_target = false
  ; update_timestamps = true
  ; insert_template = false
  ; created_from_property = None }

(* get-id — map -> :db/id; vector -> second; scalar -> itself *)
let get_id (v : value) : value =
  match v with
  | Map _ -> (
      match map_key_of v "db/id" with Some x -> x | None -> v)
  | Vector [ _; x ] -> x
  | List [ _; x ] -> x
  | _ -> v

let compute_block_parent (_block : Block_map.t) (parent : value option)
    (target_block : entity) (top_level : bool) (sibling : bool)
    (get_new_id : value -> value option) (outliner_op : string option)
    (replace_empty_target : bool) (idx : int) : value option =
  if
    (outliner_op = Some "paste" || outliner_op = Some "insert-blocks")
    && replace_empty_target
    && str_blank (Ldb.string_value target_block "block/title")
    && idx = 0
  then
    (match Ldb.ref_ent target_block "block/parent" with
     | Some p -> Some (Ref p.id)
     | None -> None)
  else if top_level then
    if sibling then
      match Ldb.ref_ent target_block "block/parent" with
      | Some p -> Some (Ref p.id)
      | None -> None
    else Some (Ref target_block.id)
  else
    match parent with
    | Some p -> get_new_id p
    | None -> None

(* Map value <-> Block_map.t (Keyword/String keys only) *)
let block_map_of_map_value (v : value) : Block_map.t option =
  match v with
  | Map kvs ->
      Some
        (List.filter_map
           (fun (k, v') ->
             match k with
             | Keyword a -> Some (a, v')
             | String a -> Some (a, v')
             | _ -> None)
           kvs)
  | _ -> None

let map_value_of_block_map (m : Block_map.t) : value =
  Map (List.map (fun (a, v) -> (Keyword a, v)) m)

(* Map value -> Block_map.t list for :block/children-ish vectors *)
let block_maps_of_children_value (v : value option) : Block_map.t list =
  match v with
  | Some (List vs) | Some (Vector vs) ->
      List.filter_map block_map_of_map_value vs
  | _ -> []

let tree_vec_flatten ?(children_key = "children") (tree_vec : Block_map.t list)
    : Block_map.t list =
  let rec assoc_level_aux (level : int) (nodes : Block_map.t list) : Block_map.t list =
    List.map
      (fun b ->
        let children =
          block_maps_of_children_value (Block_map.attr_value b children_key)
        in
        let children' = assoc_level_aux (level + 1) children in
        let b = Block_map.put b "block/level" (Int level) in
        match children' with
        | [] -> b
        | _ ->
            Block_map.put b children_key
              (List (List.map map_value_of_block_map children')))
      nodes
  in
  let rec flatten (b : Block_map.t) : Block_map.t list =
    let children =
      block_maps_of_children_value (Block_map.attr_value b children_key)
    in
    Block_map.dissoc b [ "block/children"; children_key ]
    :: List.concat_map flatten children
  in
  tree_vec
  |> assoc_level_aux 1
  |> List.concat_map flatten

(* uuid-for-insert *)
let uuid_for_insert (db : db) (keep_uuid : bool) (outliner_op : string option)
    (block_uuid : string option) : string =
  match keep_uuid, block_uuid with
  | true, Some u -> (
      let existing = entity db (Lookup_ref ("block/uuid", Uuid u)) in
      match existing, outliner_op with
      | Some e, Some "paste" when not (Ldb.recycled e) ->
          Common_uuid.new_block_id ()
      | _ -> u)
  | _ -> Common_uuid.new_block_id ()

(* get-target-block *)
let get_target_block (db : db) (blocks : Block_map.t list)
    (target_block : entity) (opts : insert_opts) : (entity * bool) option =
  let linked = Ldb.ref_ent target_block "block/link" in
  let library_ = Ldb.is_library target_block in
  let up_down = opts.outliner_op = Some "move-blocks-up-down" in
  if up_down then
    if opts.sibling then Some (target_block, true)
    else
      let target = match linked with Some l -> l | None -> target_block in
      let first_parent =
        match blocks with
        | b :: _ -> (
            match mget b "block/parent" with
            | Some v -> Option.bind (id_of_value v) (Ldb.ent_of_id db)
            | None -> None)
        | [] -> None
      in
      let parent_parent =
        match first_parent with
        | Some p -> Ldb.ref_ent p "block/parent"
        | None -> None
      in
      if
        opts.up
        && (match first_parent with
            | Some p -> p.id <> target.id
            | None -> true)
        && (match parent_parent with
            | Some pp -> pp.id <> target.id
            | None -> true)
      then Some (get_last_child_or_self db target)
      else Some (target, false)
  else if
    opts.outliner_op = Some "indent-outdent-blocks"
    && ((not opts.indent) || (opts.indent && opts.sibling))
  then Some (target_block, opts.sibling)
  else if
    opts.outliner_op = Some "insert-blocks"
    || opts.outliner_op = Some "move-blocks"
  then begin
    if opts.top then Some (target_block, false)
    else if opts.bottom && not opts.replace_empty_target then
      match List.rev (Ldb.sort_by_order (Ldb.ref_ents target_block "block/_parent")) with
      | last_child :: _ -> Some (last_child, true)
      | [] -> Some (target_block, false)
    else Some (target_block, (if library_ then false else opts.sibling))
  end
  else
    match linked with
    | Some l -> Some (get_last_child_or_self db l)
    | None -> Some (target_block, opts.sibling)

(* blocks-with-level — annotate :block/level from parent chains in the
   input order *)
let blocks_with_level (blocks : Block_map.t list) : Block_map.t list =
  match blocks with
  | [] -> []
  | first :: rest ->
      let root = Block_map.put first "block/level" (Int 1) in
      let id_to_level = Hashtbl.create 16 in
      let uuid_to_level = Hashtbl.create 16 in
      (match mget_int root "db/id" with
       | Some id -> Hashtbl.replace id_to_level id 1
       | None -> ());
      (match mget_uuid root "block/uuid" with
       | Some u -> Hashtbl.replace uuid_to_level u 1
       | None -> ());
      let rec aux acc bs =
        match bs with
        | [] -> List.rev acc
        | b :: tl ->
            let parent_level =
              match mget b "block/parent" with
              | Some v -> (
                  match id_of_value v with
                  | Some id -> Hashtbl.find_opt id_to_level id
                  | None -> (
                      match v with
                      | Vector [ _; Uuid u ] | List [ _; Uuid u ] ->
                          Hashtbl.find_opt uuid_to_level u
                      | Map _ -> (
                          match uuid_of_value v with
                          | Some u -> Hashtbl.find_opt uuid_to_level u
                          | None -> None)
                      | _ -> None))
              | None -> None
            in
            let level = match parent_level with Some l -> l + 1 | None -> 1 in
            let b' = Block_map.put b "block/level" (Int level) in
            (match mget_int b' "db/id" with
             | Some id -> Hashtbl.replace id_to_level id level
             | None -> ());
            (match mget_uuid b' "block/uuid" with
             | Some u -> Hashtbl.replace uuid_to_level u level
             | None -> ());
            aux (b' :: acc) tl
      in
      aux [ root ] rest

(* url-property-value? — created-from-property of :url type *)
let url_property_value (block : entity) : bool =
  match Ldb.ref_ent block "logseq.property/created-from-property" with
  | Some p -> Ldb.value p "logseq.property/type" = Some (Keyword "url")
  | None -> false

let default_value_block (block : entity) : bool =
  match Ldb.ref_ent block "block/parent" with
  | Some parent -> (
      match Ldb.ref_ent parent "logseq.property/default-value" with
      | Some d -> d.id = block.id
      | None -> false)
  | None -> false

let url_property_value_forbidden_target (target : entity) (sibling : bool) : bool =
  (url_property_value target
   &&
   ((not sibling)
    ||
    (match Ldb.ref_ent target "logseq.property/created-from-property" with
     | Some p -> Ldb.value p "db/cardinality" <> Some (Keyword "db.cardinality/many")
     | None -> true)))
  ||
  (sibling
   &&
   (match Ldb.ref_ent target "block/parent" with
    | Some p -> url_property_value p
    | None -> false))

let leaf_property_value_forbidden_target (target : entity) (sibling : bool)
    : bool =
  url_property_value_forbidden_target target sibling
  || default_value_block target
  || (sibling
      &&
      (match Ldb.ref_ent target "block/parent" with
       | Some p -> default_value_block p
       | None -> false))

let resolve_created_from_property (db : db) (v : value option) : entity option =
  match v with
  | Some v -> (
      match id_of_value v with
      | Some id -> Ldb.ent_of_id db id
      | None -> (
          match v with
          | Keyword k -> entity db (Ident k)
          | _ -> None))
  | None -> None

(* assign-temp-id *)
let assign_temp_id (blocks : Block_map.t list) (target_block : entity)
    (replace_empty_target : bool) : Block_map.t list =
  List.mapi
    (fun idx block ->
      let replacing = replace_empty_target && idx = 0 in
      if replacing then
        let b =
          Block_map.put block "db/id" (Ref target_block.id)
        in
        let b =
          match Ldb.uuid_value target_block "block/uuid" with
          | Some u -> Block_map.put b "block/uuid" (Uuid u)
          | None -> b
        in
        (match Ldb.string_value target_block "block/order" with
         | Some o -> Block_map.put b "block/order" (String o)
         | None -> b)
      else
        let db_id =
          match mget block "block.temp/use-old-db-id?" with
          | Some (Bool true) -> mget_int block "db/id"
          | _ -> None
        in
        let db_id =
          match db_id with Some id -> id | None -> -(idx + 1)
        in
        Block_map.put block "db/id" (Int db_id))
    blocks

(* insert-blocks-aux — uuids/id maps + per-block tx entries *)
let insert_blocks_aux (db : db) (blocks : Block_map.t list)
    (target_block : entity) (opts : insert_opts) :
    Block_map.t list * tx_op list list * (entity_id * string) list
    * (string * string) list =
  let block_uuids =
    List.map (fun b -> mget_uuid b "block/uuid") blocks
  in
  let uuids =
    List.map
      (fun u ->
        match u with
        | Some u -> uuid_for_insert db opts.keep_uuid opts.outliner_op (Some u)
        | None -> Common_uuid.new_block_id ())
      block_uuids
  in
  let uuid_map = List.combine (List.map (Option.value ~default:"") block_uuids) uuids in
  let uuid_map =
    if opts.replace_empty_target then
      match block_uuids, Ldb.uuid_value target_block "block/uuid" with
      | Some u :: _, Some tu ->
          List.filter (fun (k, _) -> k <> u) uuid_map @ [ (u, tu) ]
      | _ -> uuid_map
    else uuid_map
  in
  let id_to_new_uuid =
    List.filter_map
      (fun (b, uu) ->
        match mget_int b "db/id" with
        | Some id -> Some (id, uu)
        | None -> None)
      (List.combine blocks uuids)
  in
  let get_new_id (lookup : value) : value option =
    match lookup with
    | Map _ -> (
        match id_of_value lookup with
        | Some id -> (
            match List.assoc_opt id id_to_new_uuid with
            | Some u -> Some (Ref_to (Lookup_ref ("block/uuid", Uuid u)))
            | None -> None)
        | None -> (
            match uuid_of_value lookup with
            | Some u -> (
                match List.assoc_opt u uuid_map with
                | Some uu -> Some (Ref_to (Lookup_ref ("block/uuid", Uuid uu)))
                | None -> None)
            | None -> None))
    | Vector [ Keyword "block/uuid"; Uuid u ]
    | List [ Keyword "block/uuid"; Uuid u ] -> (
        match List.assoc_opt u uuid_map with
        | Some uu -> Some (Ref_to (Lookup_ref ("block/uuid", Uuid uu)))
        | None -> None)
    | Int id -> Some (Int id)
    | Ref id -> Some (Ref id)
    | _ ->
        failwith
          (Printf.sprintf "[insert-blocks] illegal lookup")
  in
  let orders = get_block_orders blocks target_block opts.sibling opts.keep_block_order in
  let target_page = get_target_block_page target_block opts.sibling in
  let block_ids =
    List.filter_map (fun b -> mget_uuid b "block/uuid") blocks
  in
  let rec loop (db : db) (idx : int) (bs : Block_map.t list) acc =
    match bs with
    | [] -> List.rev acc
    | block :: rest ->
        let uuid' =
          match mget_uuid block "block/uuid" with
          | Some u -> List.assoc_opt u uuid_map
          | None -> None
        in
        (match uuid' with
         | Some uuid' ->
             let block, page_txs =
               resolve_page_refs db (remove_disallowed_inline_classes db block)
             in
             let top_level =
               mget_int block "block/level" = Some 1
             in
             let parent =
               compute_block_parent block (mget block "block/parent")
                 target_block top_level opts.sibling get_new_id
                 opts.outliner_op opts.replace_empty_target idx
             in
             let order = List.nth_opt orders idx in
             (match parent, order with
              | Some _, Some _ -> ()
              | _ -> failwith "Parent or order is nil");
             let template_ref_uuids =
               if opts.insert_template then
                 match mget_int block "db/id" with
                 | Some id -> (
                     match Ldb.ent_of_id db id with
                     | Some e ->
                         let ref_uuids =
                           Ldb.ref_ents e "block/refs"
                           |> List.filter_map (fun r -> Ldb.uuid_value r "block/uuid")
                         in
                         List.filter
                           (fun u ->
                             List.mem u block_ids
                             && Some u <> mget_uuid block "block/uuid")
                           ref_uuids
                     | None -> [])
                 | None -> []
               else []
             in
             let m =
               List.filter_map
                 (fun x -> x)
                 [ Some ("db/id", (match mget block "db/id" with Some v -> v | None -> Nil))
                 ; Some ("block/uuid", Uuid uuid')
                 ; (match parent with
                    | Some p -> Some ("block/parent", p)
                    | None -> None)
                 ; (match order with
                    | Some o -> Some ("block/order", String o)
                    | None -> None) ]
             in
             let result =
               let merged =
                 (* cljs: entity -> keep level; map -> merge block into m *)
                 match mget block "db/id" with
                 | Some (Int id) when Ldb.ent_of_id db id <> None ->
                     m @ [ ("block/level", (match mget block "block/level" with Some v -> v | None -> Nil)) ]
                 | _ -> block @ m
               in
               match template_ref_uuids with
               | [] -> merged
               | _ ->
                   List.map
                     (fun (k, v) ->
                       if k = "block/title" then
                         match v with
                         | String t ->
                             let t' =
                               List.fold_left
                                 (fun (t : string) id ->
                                   match
                                     List.assoc_opt id uuid_map
                                   with
                                   | Some nu ->
                                       Db_content.replace_all t
                                         ~pattern:(Page_ref.to_page_ref id)
                                         ~replacement:(Page_ref.to_page_ref nu)
                                   | None -> t)
                                 t template_ref_uuids
                             in
                             (k, String t')
                         | _ -> (k, v)
                       else (k, v))
                     merged
             in
             let result =
               match mget result "block.temp/use-old-db-id?" with
               | Some (Bool true) -> result
               | _ -> Block_map.dissoc result [ "db/id" ]
             in
             let page_ =
               (match mget_int result "db/id" with
                | Some id -> (
                    match Ldb.ent_of_id db id with
                    | Some e -> Ldb.is_page e
                    | None -> false)
                | None -> false)
               || Option.is_some (mget result "block/name")
             in
             let result =
               if page_ then Block_map.dissoc result [ "block/page" ]
               else
                 match target_page with
                 | Some tp -> Block_map.put result "block/page" (Ref tp)
                 | None -> result
             in
             let db' =
               if page_txs <> [] then
                 match Datascript.db_with page_txs db with
                 | d -> d
               else db
             in
             loop db' (idx + 1) rest ((result, page_txs) :: acc)
         | None -> loop db (idx + 1) rest ((block, []) :: acc))
  in
  let entries = loop db 0 blocks [] in
  ( List.map fst entries
  , List.map snd entries
  , id_to_new_uuid
  , uuid_map )

(* rewrite full-tx: entities -> eids, maps lose :block/level *)
let rec rewrite_value (id_to_new_uuid : (entity_id * string) list) (v : value)
    : value =
  match v with
  | Ref id -> (
      match List.assoc_opt id id_to_new_uuid with
      | Some u -> Ref_to (Lookup_ref ("block/uuid", Uuid u))
      | None -> v)
  | Int id -> (
      match List.assoc_opt id id_to_new_uuid with
      | Some u -> Ref_to (Lookup_ref ("block/uuid", Uuid u))
      | None -> v)
  | Ref_to _ -> v
  | Map kvs ->
      Map
        (List.filter_map
           (fun (k, x) ->
             match k with
             | Keyword "block/level" | String "block/level" -> None
             | _ -> Some (k, rewrite_value id_to_new_uuid x))
           kvs)
  | Vector vs -> Vector (List.map (rewrite_value id_to_new_uuid) vs)
  | List vs -> List (List.map (rewrite_value id_to_new_uuid) vs)
  | Set vs -> Set (List.map (rewrite_value id_to_new_uuid) vs)
  | _ -> v

let rewrite_tx_op (id_to_new_uuid : (entity_id * string) list) (op : tx_op)
    : tx_op =
  match op with
  | Entity te ->
      Entity
        { te with
          attrs =
            List.filter_map
              (fun (a, tv) ->
                if a = "block/level" then None
                else
                  let tv' =
                    match tv with
                    | One_value v -> One_value (rewrite_value id_to_new_uuid v)
                    | Many_values vs ->
                        Many_values (List.map (rewrite_value id_to_new_uuid) vs)
                    | One_entity t -> One_entity t
                    | Many_entities ts -> Many_entities ts
                  in
                  Some (a, tv'))
              te.attrs
        }
  | Add (r, a, v) -> Add (r, a, rewrite_value id_to_new_uuid v)
  | _ -> op

exception Invalid_outliner_data
exception Not_allowed_move_block_page

(* insert-blocks — full port *)
let insert_blocks (db : db) (blocks : Block_map.t list) (target_block : Block_map.t)
    (opts : insert_opts) : tx_result * Block_map.t list =
  let blocks =
    List.filter_map
      (fun b ->
        let eid =
          match mget_int b "db/id" with
          | Some _ -> true
          | None -> mget_uuid b "block/uuid" <> None
        in
        if eid then
          let e_opt =
            match mget_int b "db/id" with
            | Some id -> Ldb.ent_of_id db id
            | None -> (
                match mget_uuid b "block/uuid" with
                | Some u -> entity db (Lookup_ref ("block/uuid", Uuid u))
                | None -> None)
          in
          let b' =
            match e_opt with
            | Some e ->
                let base =
                  Block_map.of_entity e
                  |> fun m ->
                  (match Ldb.string_value e "block/raw-title" with
                   | Some rt -> Block_map.put m "block/title" (String rt)
                   | None -> m)
                in
                Block_map.merge base b
            | None -> b
          in
          let dissoc_keys =
            "block/tx-id"
            :: (if
                  (opts.outliner_op = Some "insert-template-blocks"
                   || opts.outliner_op = Some "paste")
                  && opts.outliner_real_op <> Some "paste-text"
                then [ "block/refs" ]
                else [])
          in
          Some (Block_map.dissoc b' dissoc_keys)
        else Some b)
      blocks
  in
  let blocks =
    if opts.outliner_op = Some "paste" || opts.insert_template then
      List.filter
        (fun b ->
          match mget_int b "db/id" with
          | Some id -> (
              match Ldb.ent_of_id db id with
              | Some e -> not (Ldb.asset e)
              | None -> true)
          | None -> true)
        blocks
    else blocks
  in
  let target_entity =
    match mget_int target_block "db/id" with
    | Some id -> Ldb.ent_of_id db id
    | None -> (
        match mget_uuid target_block "block/uuid" with
        | Some u -> entity db (Lookup_ref ("block/uuid", Uuid u))
        | None -> None)
  in
  match target_entity with
  | None -> ({ tx_data = []; tx_meta = [] }, [])
  | Some tb -> (
      match get_target_block db blocks tb opts with
      | None -> ({ tx_data = []; tx_meta = [] }, [])
      | Some (target_block, sibling) ->
          let replace_empty_target =
            if
              Option.is_some (if opts.replace_empty_target then Some () else None)
              && str_blank (Ldb.string_value target_block "block/title")
              && Ldb.string_value target_block "block/title" <> None
            then opts.replace_empty_target
            else
              sibling
              && str_blank (Ldb.string_value target_block "block/title")
              && Ldb.string_value target_block "block/title" <> None
              && List.length blocks > 1
          in
          if
            blocks <> []
            && not (leaf_property_value_forbidden_target target_block sibling)
          then begin
            let from_property =
              Ldb.ref_ent target_block "logseq.property/created-from-property"
            in
            let paste_as_property_values =
              sibling
              && (match from_property with
                  | Some p ->
                      Ldb.value p "db/cardinality"
                      = Some (Keyword "db.cardinality/many")
                  | None -> false)
            in
            let blocks' =
              let bl = blocks_with_level blocks in
              let bl = blocks_with_ordered_list_props bl target_block sibling in
              let bl =
                if opts.update_timestamps then
                  List.map
                    (fun b -> Block_map.dissoc b [ "block/created-at"; "block/updated-at" ])
                    bl
                else bl
              in
              let bl = List.map block_with_timestamps bl in
              if opts.outliner_op = Some "paste" && not paste_as_property_values then
                List.map
                  (fun b ->
                    if mget_int b "block/level" = Some 1 then
                      Block_map.dissoc b [ "logseq.property/created-from-property" ]
                    else b)
                  bl
              else bl
            in
            let insert_opts' =
              { opts with sibling; replace_empty_target }
            in
            let blocks_tx, page_txs, id_to_new_uuid, _uuid_map =
              insert_blocks_aux db blocks' target_block insert_opts'
            in
            let invalid =
              List.exists
                (fun b ->
                  mget b "block/parent" = None || mget b "block/order" = None)
                blocks_tx
            in
            if invalid then raise Invalid_outliner_data
            else
              let tx = assign_temp_id blocks_tx target_block replace_empty_target in
              let old_db_id_blocks =
                List.filter_map
                  (fun b ->
                    match mget b "block.temp/use-old-db-id?" with
                    | Some (Bool true) -> mget_uuid b "block/uuid"
                    | _ -> None)
                  tx
              in
              let uuids_tx =
                List.filter_map
                  (fun b -> mget_uuid b "block/uuid")
                  blocks_tx
                |> List.filter (fun u -> not (List.mem u old_db_id_blocks))
                |> List.map (fun u -> Entity { db_id = None; attrs = [ "block/uuid", One_value (Uuid u) ] })
              in
              let uuids_tx =
                if opts.keep_uuid && replace_empty_target then List.tl uuids_tx
                else uuids_tx
              in
              let restore_from_property =
                match if paste_as_property_values then from_property else None with
                | Some p -> Some p
                | None -> resolve_created_from_property db opts.created_from_property
              in
              let property_values_tx =
                match restore_from_property with
                | Some rfp ->
                    let owner_id =
                      if sibling then
                        match Ldb.ref_ent target_block "block/parent" with
                        | Some p -> Some p.id
                        | None -> None
                      else Some target_block.id
                    in
                    let prop_ident =
                      Ldb.ident_of rfp
                    in
                    (match owner_id, prop_ident with
                     | Some owner_id, Some prop_ident ->
                         List.concat_map
                           (fun b ->
                             if mget_int b "block/level" = Some 1 then
                               let new_id =
                                 match mget_int b "db/id" with
                                 | Some id -> (
                                     match List.assoc_opt id id_to_new_uuid with
                                     | Some u -> Some u
                                     | None -> mget_uuid b "block/uuid")
                                 | None -> mget_uuid b "block/uuid"
                               in
                               (match new_id with
                                | Some uuid ->
                                    [ Entity
                                        { db_id = Some (Lookup_ref ("block/uuid", Uuid uuid))
                                        ; attrs =
                                            [ "logseq.property/created-from-property"
                                            , One_entity
                                                { db_id = Some (Entity_id rfp.id)
                                                ; attrs = [] } ] }
                                    ; Add (Entity_id owner_id, prop_ident,
                                           Ref_to (Lookup_ref ("block/uuid", Uuid uuid))) ]
                                | None -> [])
                             else [])
                           blocks'
                     | _ -> [])
                | None -> []
              in
              let full_tx =
                List.concat page_txs @ uuids_tx
                @ List.map (fun m -> Entity (Block_map.to_tx_entity db m)) tx
                @ property_values_tx
              in
              let full_tx' =
                List.map (rewrite_tx_op id_to_new_uuid) full_tx
              in
              ({ tx_data = full_tx'; tx_meta = [] }, tx)
          end
          else ({ tx_data = []; tx_meta = [] }, []))

(* ---------- delete-blocks ---------- *)

let get_top_level_blocks (top_level : entity list) (non_consecutive : bool)
    : entity list =
  let reversed =
    (not non_consecutive)
    &&
    match top_level with
    | a :: b :: _ ->
        let oa = Ldb.string_value a "block/order"
        and ob = Ldb.string_value b "block/order" in
        (match oa, ob with
         | Some oa, Some ob -> String.compare oa ob > 0
         | _ -> false)
    | _ -> false
  in
  if reversed then List.rev top_level else top_level

let comments_tag_ident = "logseq.class/Comments"
let comment_tag_ident = "logseq.class/Comment"
let comments_blocks_property = "logseq.property.comments/blocks"

let tagged_with (block : entity) (tag_ident : string) : bool =
  Ldb.has_tag block tag_ident
  ||
  (Ldb.ref_ents block "block/tags"
   |> List.exists (fun t -> Ldb.ident_of t = Some tag_ident))

let comments_area (block : entity) : bool = tagged_with block comments_tag_ident

let comment_block (block : entity) : bool =
  tagged_with block comment_tag_ident
  ||
  (match Ldb.ref_ent block "block/parent" with
   | Some p -> comments_area p
   | None -> false)

let protected_comment_block (block : entity) : bool =
  comments_area block || comment_block block

let move_source_allowed_for_comments (block : entity) (sibling : bool) : bool =
  (not (comment_block block))
  && (sibling || not (comments_area block))

let move_target_allowed_for_comments (target : entity) (sibling : bool) : bool =
  (not (comment_block target))
  && (sibling || not (comments_area target))

let block_subtree_ids (db : db) (block : entity) : entity_id list =
  block.id :: Ldb.get_block_full_children_ids db block.id

let datom_value_ids (v : value) : entity_id list =
  match v with
  | Set vs -> List.filter_map (function Ref id -> Some id | _ -> None) vs
  | Ref id -> [ id ]
  | _ -> []

(* orphaned-range-comments-areas *)
let orphaned_range_comments_areas (db : db) (deleted_ids : entity_id list)
    : entity list =
  let schema_has =
    match entity db (Ident comments_blocks_property) with
    | Some e -> Ldb.value e "db/valueType" = Some (Keyword "db.type/ref")
    | None -> false
  in
  if not schema_has then []
  else
    let candidates =
      deleted_ids
      |> List.concat_map (fun id ->
          List.of_seq
            (datoms db Avet ~a:comments_blocks_property ~v:(Ref id) ()))
      |> List.map (fun (d : datom) -> d.e)
      |> List.sort_uniq compare
      |> List.filter_map (Ldb.ent_of_id db)
      |> List.filter comments_area
      |> List.filter (fun e -> not (List.mem e.id deleted_ids))
    in
    List.filter
      (fun (comments_area : entity) ->
        let targets =
          List.concat_map datom_value_ids
            (Ldb.values comments_area comments_blocks_property)
        in
        targets <> [] && List.for_all (fun id -> List.mem id deleted_ids) targets)
      candidates

(* otree -del *)
let del_in_txs (db : db) (txs_state : txs_state) (block_uuid : string) : unit =
  match entity db (Lookup_ref ("block/uuid", Uuid block_uuid)) with
  | Some block when Ldb.is_page block ->
      txs_push txs_state
        [ RetractAttr (Entity_id block.id, "block/parent")
        ; RetractAttr (Entity_id block.id, "block/order")
        ; RetractAttr (Entity_id block.id, "block/page") ]
  | Some block ->
      let ids = block_subtree_ids db block in
      txs_push txs_state
        (List.map (fun id -> RetractEntity (Entity_id id)) ids)
  | None -> ()

(* delete-blocks *)
let delete_blocks (db : db) (blocks : Block_map.t list) : tx_result =
  let top_level = filter_top_level_blocks db blocks in
  let non_consecutive =
    List.length top_level > 1
    && Ldb.get_non_consecutive_blocks db top_level <> []
  in
  let top_level' = get_top_level_blocks top_level non_consecutive in
  let built_in_check =
    List.exists Outliner_validate.built_in_entity top_level'
  in
  let top_level =
    List.filter (fun b -> not (Outliner_validate.built_in_entity b)) top_level'
  in
  let deleted_ids =
    List.concat_map (block_subtree_ids db) top_level
    |> List.sort_uniq compare
  in
  let orphaned_comments = orphaned_range_comments_areas db deleted_ids in
  let top_level = top_level @ orphaned_comments in
  let txs_state = new_txs_state () in
  if built_in_check then
    raise
      (Outliner_validate.Notification
         (Outliner_validate.notification_payload
            ~message:"Built-in nodes can't be deleted."
            ~i18n_key:"node/built-in-cant-delete-error" ~i18n_args:[]));
  (match top_level with
   | [] -> ()
   | _ ->
       let start_block = List.hd top_level in
       let end_block = List.hd (List.rev top_level) in
       let delete_one =
         List.length top_level = 1 || start_block.id = end_block.id
       in
       let from_property =
         Ldb.ref_ent start_block "logseq.property/created-from-property"
       in
       let default_value_property =
         match from_property with
         | Some fp ->
             Option.is_some (Ldb.value fp "logseq.property/default-value")
             &&
             (match Ldb.ref_ent fp "logseq.property/default-value" with
              | Some dv -> dv.id <> start_block.id
              | None -> false)
             && not (Option.is_some (Ldb.value start_block "block/closed-value-property"))
         | None -> false
       in
       if delete_one && default_value_property then
         match from_property with
         | Some fp -> (
             match Ldb.ident_of fp with
             | Some ident ->
                 let tx_data =
                   List.of_seq
                     (datoms db Avet ~a:ident ~v:(Ref start_block.id) ())
                   |> List.map (fun (d : datom) ->
                       Entity
                         { db_id = Some (Entity_id d.e)
                         ; attrs =
                             [ ( ident
                               , One_entity
                                   { db_id =
                                       Some
                                         (Ident
                                            "logseq.property/empty-placeholder")
                                   ; attrs = [] } ) ] })
                 in
                 txs_push txs_state tx_data
             | None -> ())
         | None -> ()
       else
         List.iter
           (fun b ->
             match Ldb.uuid_value b "block/uuid" with
             | Some u -> del_in_txs db txs_state u
             | None -> ())
           top_level);
  { tx_data = txs_state.txs; tx_meta = [] }

(* ---------- move-blocks ---------- *)

let move_to_original_position db (blocks : entity list) (target_block : entity)
    (sibling : bool) (non_consecutive : bool) : bool =
  match blocks with
  | block :: _ ->
      (not non_consecutive)
      &&
      (if sibling then
         match Ldb.get_left_sibling block with
         | Some ls -> ls.id = target_block.id
         | None -> false
       else
         match Ldb.get_first_child db target_block.id with
         | Some fc -> fc.id = block.id
         | None -> false)
  | [] -> false

let move_block (db : db) (block : entity) (target_block : entity) (sibling : bool)
    (created_from_property : value option) : tx_op list =
  let target_without_parent =
    sibling && Ldb.ref_ent target_block "block/parent" = None
  in
  let move_page_as_block_child =
    (not sibling) && not (Ldb.is_page target_block) && Ldb.is_page block
  in
  if target_without_parent || move_page_as_block_child then
    raise Not_allowed_move_block_page
  else
    let first_block_page = Ldb.ref_ent block "block/page" in
    let target_page = get_target_block_page target_block sibling in
    let not_same_page =
      match first_block_page, target_page with
      | Some p, Some t -> p.id <> t
      | _ -> false
    in
    let block_order =
      if sibling then
        let right =
          match Ldb.get_right_sibling target_block with
          | Some r -> Ldb.string_value r "block/order"
          | None -> None
        in
        Db_order.gen_key (Ldb.string_value target_block "block/order") right
      else
        let down =
          match Ldb.get_down target_block with
          | Some d -> Ldb.string_value d "block/order"
          | None -> None
        in
        Db_order.gen_key None down
    in
    let parent_ref =
      if sibling then
        match Ldb.ref_ent target_block "block/parent" with
        | Some p -> p.id
        | None -> -1
      else target_block.id
    in
    let attrs =
      List.filter_map
        (fun x -> x)
        [ Some ("block/parent", One_entity { db_id = Some (Entity_id parent_ref); attrs = [] })
        ; Some ("block/order", One_value (String block_order))
        ; (if not (Ldb.is_page block) then
             match target_page with
             | Some tp ->
                 Some
                   ("block/page",
                    One_entity { db_id = Some (Entity_id tp); attrs = [] })
             | None -> None
           else None) ]
    in
    let tx_data =
      [ Entity { db_id = Some (Entity_id block.id); attrs } ]
    in
    let children_page_tx =
      if not_same_page && not (Ldb.is_page block) then
        Ldb.get_block_full_children_ids db block.id
        |> List.filter_map (fun id ->
            match Ldb.ent_of_id db id with
            | Some child when not (Ldb.is_page child) ->
                (match Ldb.uuid_value child "block/uuid" with
                 | Some u -> (
                     match target_page with
                     | Some tp ->
                         Some
                           (Entity
                              { db_id = Some (Lookup_ref ("block/uuid", Uuid u))
                              ; attrs =
                                  [ ( "block/page"
                                    , One_entity
                                        { db_id = Some (Entity_id tp)
                                        ; attrs = [] } ) ] })
                     | None -> None)
                 | None -> None)
            | _ -> None)
      else []
    in
    let target_from_property =
      if sibling then
        Ldb.ref_ent target_block "logseq.property/created-from-property"
      else None
    in
    let block_from_property =
      Ldb.ref_ent block "logseq.property/created-from-property"
    in
    let restore_from_property =
      match target_from_property with
      | Some p -> Some p
      | None -> resolve_created_from_property db created_from_property
    in
    let retract_property_tx =
      match block_from_property, Ldb.ref_ent block "block/parent" with
      | Some bp, Some parent -> (
          match Ldb.ident_of bp with
          | Some ident ->
              [ Retract (Entity_id parent.id, ident, Some (Ref block.id))
              ; RetractAttr (Entity_id block.id, "logseq.property/created-from-property") ]
          | None -> [])
      | _ -> []
    in
    let add_property_tx =
      match restore_from_property with
      | Some rfp -> (
          let owner_id =
            if sibling then
              match Ldb.ref_ent target_block "block/parent" with
              | Some p -> Some p.id
              | None -> None
            else Some target_block.id
          in
          match owner_id, Ldb.ident_of rfp with
          | Some owner_id, Some ident ->
              [ Add (Entity_id block.id, "logseq.property/created-from-property",
                     Ref rfp.id)
              ; Add (Entity_id owner_id, ident, Ref block.id) ]
          | _ -> [])
      | None -> []
    in
    tx_data @ children_page_tx @ retract_property_tx @ add_property_tx

(* ldb/transact! alias for worker path *)
let ldb_transact (conn : conn) (tx_ops : tx_op list) (tx_meta : tx_meta) : unit =
  ignore (Db_tx.transact ~tx_meta conn tx_ops)

let transact_move_blocks (conn : conn) (blocks : entity list)
    (target_block : entity) (sibling : bool) (created_from_property : value option)
    (outliner_op : string option) (top_level : entity list) : unit =
  let uuids_of =
    List.filter_map (fun (b : entity) -> Ldb.uuid_value b "block/uuid") top_level
  in
  let opts_entry =
    match created_from_property with
    | Some v -> Map [ Keyword "created-from-property", v ]
    | None -> Map []
  in
  let tx_meta =
    [ ( "outliner-ops"
      , Vector
          [ Vector
              [ Keyword "move-blocks"
              ; Vector
                  [ Vector (List.map (fun u -> Uuid u) uuids_of)
                  ; (match Ldb.uuid_value target_block "block/uuid" with
                     | Some u -> Uuid u
                     | None -> Nil)
                  ; opts_entry ] ] ] )
    ; "outliner-op", Keyword "move-blocks" ]
  in
  Db_tx.batch_transact_with_temp_conn conn ~tx_meta (fun temp ->
      List.iteri
        (fun idx block ->
          let first_block = idx = 0 in
          let sibling' = if first_block then sibling else true in
          let target =
            if first_block then target_block
            else
              match List.nth_opt blocks (idx - 1) with
              | Some prev -> (
                  match Ldb.ent_of_id (Conn.db temp) prev.id with
                  | Some e -> e
                  | None -> target_block)
              | None -> target_block
          in
          match Ldb.ent_of_id (Conn.db temp) block.id with
          | Some b ->
              if
                not
                  (move_to_original_position (Conn.db temp) [ b ] target sibling'
                     false)
              then
                let tx =
                  move_block (Conn.db temp) b target sibling' created_from_property
                in
                ldb_transact temp tx
                  [ "sibling?", Bool sibling'
                  ; ( "outliner-op"
                    , Keyword (Option.value outliner_op ~default:"move-blocks") ) ]
          | None -> ())
        blocks)
  |> ignore

let move_blocks (conn : conn) (blocks : entity list) (target_block : entity)
    (opts : insert_opts) : tx_result option =
  List.iter
    (fun (b : entity) ->
      if Outliner_validate.built_in_entity b then
        raise
          (Outliner_validate.Notification
             (Outliner_validate.notification_payload
                ~message:"Built-in nodes can't be modified" ~i18n_key:"" ~i18n_args:[])))
    blocks;
  let db = Conn.db conn in
  let current_blocks =
    List.filter_map (fun (b : entity) -> Ldb.ent_of_id db b.id) blocks
  in
  let top_level =
    filter_top_level_blocks db
      (List.map Block_map.of_entity current_blocks)
    |> List.filter (fun b -> not (comment_block b))
  in
  if top_level = [] then None
  else
    match get_target_block db (List.map Block_map.of_entity top_level) target_block opts with
    | None -> None
    | Some (target_block, sibling) ->
        let non_consecutive =
          List.length top_level > 1
          && Ldb.get_non_consecutive_blocks db top_level <> []
        in
        let top_level = get_top_level_blocks top_level non_consecutive in
        let blocks =
          (if non_consecutive then Ldb.sort_page_random_blocks db top_level
           else top_level)
          |> List.filter_map (fun (b : entity) -> Ldb.ent_of_id db b.id)
        in
        let original_position =
          move_to_original_position db blocks target_block sibling non_consecutive
        in
        if
          List.for_all (fun b -> move_source_allowed_for_comments b sibling) blocks
          && move_target_allowed_for_comments target_block sibling
          && not (leaf_property_value_forbidden_target target_block sibling)
          && not (List.mem target_block.id (List.map (fun (b : entity) -> b.id) blocks))
          && not original_position
        then begin
          let parents' =
            match Ldb.uuid_value target_block "block/uuid" with
            | Some u ->
                Ldb.get_block_parents db u |> List.map (fun (p : entity) -> p.id)
            | None -> []
          in
          let move_parents_to_child =
            List.exists
              (fun pid -> List.mem pid parents')
              (List.map (fun (b : entity) -> b.id) blocks)
          in
          if not move_parents_to_child then begin
            transact_move_blocks conn blocks target_block sibling
              opts.created_from_property opts.outliner_op top_level;
            None
          end
          else None
        end
        else None

let move_blocks_up_down (conn : conn) (blocks : entity list) (up : bool)
    : tx_result option =
  let db = Conn.db conn in
  let top_level =
    filter_top_level_blocks db (List.map Block_map.of_entity blocks)
  in
  let opts = { default_insert_opts with outliner_op = Some "move-blocks-up-down" } in
  if up then
    match top_level with
    | first :: _ -> (
        let first_block = first in
        let first_parent = Ldb.ref_ent first_block "block/parent" in
        let left_sibling = Ldb.get_left_sibling first_block in
        let left_or_parent =
          match left_sibling with Some l -> Some l | None -> first_parent
        in
        let left_left =
          match left_or_parent with
          | Some l -> (
              match Ldb.get_left_sibling l with
              | Some ll -> Some ll
              | None -> first_parent)
          | None -> first_parent
        in
        let sibling_ =
          match left_left, first_parent with
          | Some ll, Some fp -> (
              match Ldb.ref_ent ll "block/parent" with
              | Some llp -> llp.id = fp.id
              | None -> false)
          | _ -> false
        in
        match left_left with
        | Some ll ->
            if
              (match first_parent, ll with
               | Some fp, _ ->
                   (match Ldb.ref_ent fp "block/page" with
                    | Some fpp -> fpp.id <> ll.id
                    | None -> true)
               | None, _ -> true)
              && not
                   (Option.is_some
                      (Ldb.value first_block "logseq.property/created-from-property")
                    && left_sibling = None)
            then
              move_blocks conn top_level ll
                { opts with sibling = sibling_; up = true }
            else None
        | None -> None)
    | [] -> None
  else
    match List.rev top_level with
    | last_top :: _ -> (
        let right =
          match Ldb.get_right_sibling last_top with
          | Some r -> Some r
          | None -> (
              match Ldb.ref_ent last_top "block/parent" with
              | Some p -> Ldb.get_right_sibling p
              | None -> None)
        in
        let sibling_ =
          match right with
          | Some r -> (
              match Ldb.ref_ent last_top "block/parent", Ldb.ref_ent r "block/parent" with
              | Some lp, Some rp -> lp.id = rp.id
              | _ -> false)
          | None -> false
        in
        match right with
        | Some r ->
            if
              not
                (Option.is_some
                   (Ldb.value last_top "logseq.property/created-from-property")
                 && Ldb.get_right_sibling last_top = None)
            then
              move_blocks conn
                (List.filter_map
                   (fun (b : entity) -> Ldb.ent_of_id db b.id)
                   blocks)
                r { opts with sibling = sibling_; up = false }
            else None
        | None -> None)
    | [] -> None

(* ---------- indent-outdent-blocks ---------- *)

let indent_outdent_blocks (conn : conn) (blocks : entity list) (indent : bool)
    ?(parent_original : entity option) ?(logical_outdenting = false) () :
    tx_result option =
  let db = Conn.db conn in
  let top_level =
    filter_top_level_blocks db (List.map Block_map.of_entity blocks)
  in
  let non_consecutive =
    List.length top_level > 1
    && Ldb.get_non_consecutive_blocks db top_level <> []
  in
  let top_level = get_top_level_blocks top_level non_consecutive in
  let created_from_prop (b : entity) =
    Option.is_some (Ldb.value b "logseq.property/created-from-property")
  in
  if
    non_consecutive
    || ((not indent) && List.exists created_from_prop top_level)
  then None
  else
    match top_level with
    | [] -> None
    | first :: _ -> (
        let first_block = first in
        let left = Ldb.get_left_sibling first_block in
        let parent = Ldb.ref_ent first_block "block/parent" in
        let opts =
          { default_insert_opts with outliner_op = Some "indent-outdent-blocks" }
        in
        if indent then
          match left with
          | None -> None
          | Some left -> (
              let last_direct_child_id =
                Ldb.get_block_last_direct_child_id db left.id
              in
              let blocks' =
                List.filter
                  (fun b ->
                    match Ldb.ref_ent b "block/parent" with
                    | Some p -> p.id <> left.id
                    | None -> true)
                  top_level
              in
              match blocks' with
              | [] -> None
              | _ ->
                  (match last_direct_child_id with
                   | Some id -> (
                       match Ldb.ent_of_id db id with
                       | Some last_child ->
                           let r =
                             move_blocks conn blocks' last_child
                               { opts with sibling = true; indent = true }
                           in
                           let collapsed_tx =
                             if
                               Ldb.truthy (Ldb.value left "block/collapsed?")
                             then
                               Some
                                 [ Entity
                                     { db_id = Some (Entity_id left.id)
                                     ; attrs =
                                         [ "block/collapsed?", One_value (Bool false) ] } ]
                             else None
                           in
                           (match r, collapsed_tx with
                            | Some r, Some c ->
                                Some { r with tx_data = r.tx_data @ c }
                            | Some r, None -> Some r
                            | None, Some c -> Some { tx_data = c; tx_meta = [] }
                            | None, None -> None)
                       | None -> None)
                   | None ->
                       move_blocks conn blocks' left
                         { opts with sibling = false; indent = true }))
        else
          match parent_original with
          | Some parent_original ->
              let parent_parent =
                match parent with
                | Some p -> Ldb.ref_ent p "block/parent"
                | None -> None
              in
              let blocks' =
                List.filter
                  (fun b ->
                    match Ldb.ref_ent b "block/parent", parent_parent with
                    | Some bp, Some pp -> bp.id <> pp.id
                    | _ -> true)
                  top_level
              in
              (* cljs take-while: stops at first block whose parent ==
                 parent's parent *)
              let rec take_while acc l =
                match l with
                | b :: rest ->
                    let stop =
                      match Ldb.ref_ent b "block/parent", parent_parent with
                      | Some bp, Some pp -> bp.id = pp.id
                      | _ -> false
                    in
                    if stop then List.rev acc else take_while (b :: acc) rest
                | [] -> List.rev acc
              in
              let blocks' = take_while [] blocks' in
              move_blocks conn blocks' parent_original
                { opts with sibling = true; indent = false }
          | None -> (
              match parent with
              | None -> None
              | Some parent ->
                  let parent_parent = Ldb.ref_ent parent "block/parent" in
                  let rec take_while acc l =
                    match l with
                    | b :: rest ->
                        let stop =
                          match Ldb.ref_ent b "block/parent", parent_parent with
                          | Some bp, Some pp -> bp.id = pp.id
                          | _ -> false
                        in
                        if stop then List.rev acc else take_while (b :: acc) rest
                    | [] -> List.rev acc
                  in
                  let blocks' = take_while [] top_level in
                  let result =
                    move_blocks conn blocks' parent { opts with sibling = true }
                  in
                  if logical_outdenting then result
                  else
                    match List.rev blocks' with
                    | [] -> result
                    | last_top :: _ -> (
                        let right_siblings =
                          get_right_siblings last_top
                          |> List.filter (fun b -> not (protected_comment_block b))
                        in
                        match right_siblings with
                        | [] -> result
                        | _ ->
                            (match
                               Ldb.get_block_last_direct_child_id db last_top.id
                             with
                             | Some id -> (
                                 match Ldb.ent_of_id db id with
                                 | Some ldc ->
                                     move_blocks conn right_siblings ldc
                                       { opts with sibling = true }
                                 | None -> result)
                             | None ->
                                 move_blocks conn right_siblings last_top
                                   { opts with sibling = false }))))

(* ---------- op-transact! + public ! fns ---------- *)

(* op args as values for direct-op-entry *)
let op_transact (outliner_op : string) (f : unit -> tx_result option)
    (args : value list) (conn : conn) : tx_result option =
  match
    (try f () with Not_allowed_move_block_page -> None)
  with
  | Some result when result.tx_data <> [] || result.tx_meta <> [] ->
      let entry = direct_op_entry outliner_op args in
      let tx_meta =
        Outliner_tx_meta.ensure_outliner_ops result.tx_meta entry
      in
      let tx_meta =
        Outliner_tx_meta.tx_meta_put tx_meta "outliner-op" (Keyword outliner_op)
      in
      ldb_transact conn result.tx_data tx_meta;
      Some result
  | r -> r

(* conn/block value conversions for direct-op-entry args *)
(* cljs ->block-id is (:block/uuid block) — entities serialize as their uuid *)
let entity_arg (e : entity) : value =
  match Ldb.value e "block/uuid" with
  | Some (Uuid u) -> Uuid u
  | _ -> Nil
let bmap_arg (m : Block_map.t) : value =
  Map (List.map (fun (a, v) -> (Keyword a, v)) m)
let bmaps_arg (ms : Block_map.t list) : value = Vector (List.map bmap_arg ms)
let opts_arg (opts : Block_map.t) : value =
  Map (List.map (fun (a, v) -> (Keyword a, v)) opts)

(* save-block! *)
let save_block_conn (conn : conn) (block : Block_map.t) (opts : save_opts)
    (opts_entry : Block_map.t) : tx_result option =
  let outliner_op = Option.value opts.outliner_op ~default:"save-block" in
  let opts = { opts with outliner_op = Some outliner_op } in
  op_transact "save-block"
    (fun () ->
      Some (save_block (Conn.db conn) block opts))
    [ Ref 0 (* conn placeholder — cljs args[0] is conn, unused *)
    ; bmap_arg block; opts_arg opts_entry ]
    conn

let insert_blocks_conn (conn : conn) (blocks : Block_map.t list)
    (target_block : Block_map.t) (opts : insert_opts) (opts_entry : Block_map.t)
    : tx_result option =
  let outliner_op = Option.value opts.outliner_op ~default:"insert-blocks" in
  let opts = { opts with outliner_op = Some outliner_op } in
  op_transact "insert-blocks"
    (fun () ->
      let r, _blocks =
        insert_blocks (Conn.db conn) blocks target_block opts
      in
      Some r)
    [ Ref 0; bmaps_arg blocks; bmap_arg target_block; opts_arg opts_entry ]
    conn

let delete_blocks_conn (conn : conn) (blocks : Block_map.t list)
    (opts_entry : Block_map.t) : tx_result option =
  op_transact "delete-blocks"
    (fun () -> Some (delete_blocks (Conn.db conn) blocks))
    [ Ref 0; bmaps_arg blocks; opts_arg opts_entry ]
    conn

let move_blocks_conn (conn : conn) (blocks : entity list) (target_block : entity)
    (opts : insert_opts) (opts_entry : Block_map.t) : unit =
  let outliner_op = Option.value opts.outliner_op ~default:"move-blocks" in
  let opts = { opts with outliner_op = Some outliner_op } in
  ignore
    (op_transact "move-blocks"
       (fun () -> move_blocks conn blocks target_block opts)
       [ Ref 0
       ; Vector (List.map entity_arg blocks)
       ; entity_arg target_block
       ; opts_arg opts_entry ]
       conn)

let move_blocks_up_down_conn (conn : conn) (blocks : entity list) (up : bool)
    : unit =
  ignore
    (op_transact "move-blocks-up-down"
       (fun () -> move_blocks_up_down conn blocks up)
       [ Ref 0; Vector (List.map entity_arg blocks); Bool up ]
       conn)

let indent_outdent_blocks_conn (conn : conn) (blocks : entity list) (indent : bool)
    ?(parent_original : entity option) ?(logical_outdenting = false)
    (opts_entry : Block_map.t) : unit =
  ignore
    (op_transact "indent-outdent-blocks"
       (fun () ->
         indent_outdent_blocks conn blocks indent ?parent_original
           ~logical_outdenting ())
       [ Ref 0; Vector (List.map entity_arg blocks); Bool indent
       ; opts_arg opts_entry ]
       conn)
