type opts = {
  target_id : Cli_primitive.db_id option;
  target_uuid : Cli_primitive.uuid option;
  target_page_name : string option;
  pos : Block.position option;
  status : string option;
  tags_edn : string option;
  properties_edn : string option;
  content : string option;
  blocks_markdown : string option;
  blocks_file : Cli_primitive.path option;
}

type action = {
  repo : Cli_primitive.repo;
  graph : Cli_primitive.graph;
  target_id : Cli_primitive.db_id option;
  target_uuid : Cli_primitive.uuid option;
  target_page_name : string option;
  pos : Block.position;
  status : Cli_primitive.keyword option;
  tags : Selector.tag Rrbvec.t;
  properties : Property.assignment Rrbvec.t;
  blocks : Block.t Rrbvec.t;
  markdown_blocks : bool;
}

let kw value = Edn_util.keyword value
let vector_vec values = Edn_util.vector_vec values
let vector values = vector_vec values
let list_vec values = Edn_util.list_vec values
let list values = list_vec values
let sym value = Edn_util.symbol value
let normalized_lookup_name value = String.lowercase_ascii (String.trim value)

let query_value query =
  Edn_util.any (Cli_primitive.datascript_query_to_edn query)

let edn_value_of_string ~label text =
  try Ok (Melange_edn_melange.of_edn_string text)
  with Melange_edn_melange.Parse_error _ ->
    Error (Error.invalid_options ("invalid " ^ label ^ " edn"))

let strip_tag_prefix value =
  let value = String.trim value in
  let rec loop index =
    if index < String.length value && value.[index] = '#' then loop (index + 1)
    else index
  in
  let start = loop 0 in
  String.sub value start (String.length value - start) |> String.trim

let tag_of_value value =
  match
    ( Edn_util.as_int64 value,
      Edn_util.as_uuid value,
      Edn_util.as_keyword_t value,
      Edn_util.as_string value )
  with
  | Some id, _, _, _ -> Some (Selector.Tag_id id)
  | _, Some uuid, _, _ -> Some (Tag_uuid uuid)
  | _, _, Some ident, _ -> Some (Tag_ident ident)
  | _, _, _, Some value ->
      let value = strip_tag_prefix value in
      if value = "" then None
      else if Cli_primitive.is_uuid_string value then Some (Tag_uuid value)
      else if value.[0] = ':' then Some (Tag_ident (Edn_util.keyword_t value))
      else Some (Tag_name value)
  | _ -> None

let parse_tags_option = function
  | None -> Ok Vec.empty
  | Some text ->
      Error.bind (edn_value_of_string ~label:"tags" text) (fun value ->
          match Edn_util.as_vector value with
          | Some values when Vec.is_empty values ->
              Error (Error.invalid_options "tags must be a non-empty vector")
          | Some values ->
              let rec loop acc values =
                match Vec.pop_front values with
                | None -> Ok acc
                | Some (value, rest) -> (
                    match tag_of_value value with
                    | Some tag -> loop (Vec.push_back acc tag) rest
                    | None ->
                        Error
                          (Error.invalid_options
                             "tags must be strings, keywords, uuids, or ids"))
              in
              loop Vec.empty values
          | None -> Error (Error.invalid_options "tags must be a vector"))

let parse_tags_vector_option = parse_tags_option

let normalize_property_name value =
  let value = String.trim value in
  if value = "" then None else Some (Edn_util.keyword_t value)

let property_key_of_value value =
  match
    ( Edn_util.as_int64 value,
      Edn_util.as_keyword_t value,
      Edn_util.as_string value )
  with
  | Some id, _, _ -> Some (Property.Key_id id)
  | _, Some ident, _ -> Some (Key_ident ident)
  | _, _, Some value ->
      Option.map
        (fun ident -> Property.Key_ident ident)
        (normalize_property_name value)
  | _ -> None

let parse_properties_option ?(allow_non_built_in = false) = function
  | None -> Ok Vec.empty
  | Some text ->
      let _ = allow_non_built_in in
      Error.bind (edn_value_of_string ~label:"properties" text) (fun value ->
          match Edn_util.as_map value with
          | Some fields when Vec.is_empty fields ->
              Error (Error.invalid_options "properties must be a non-empty map")
          | Some fields ->
              let rec loop acc fields =
                match Vec.pop_front fields with
                | None -> Ok acc
                | Some ((key, value), rest) -> (
                    match property_key_of_value key with
                    | Some key ->
                        loop (Vec.push_back acc { Property.key; value }) rest
                    | None ->
                        Error
                          (Error.invalid_options
                             ("invalid property key: "
                             ^ Melange_edn_melange.to_edn_string key)))
              in
              loop Vec.empty fields
          | None -> Error (Error.invalid_options "properties must be a map"))

let parse_properties_vector_option ?(allow_non_built_in = false) = function
  | None -> Ok Vec.empty
  | Some text ->
      let _ = allow_non_built_in in
      Error.bind (edn_value_of_string ~label:"properties" text) (fun value ->
          match Edn_util.as_vector value with
          | Some values when Vec.is_empty values ->
              Error
                (Error.invalid_options "properties must be a non-empty vector")
          | Some values ->
              let rec loop acc values =
                match Vec.pop_front values with
                | None -> Ok acc
                | Some (value, rest) -> (
                    match property_key_of_value value with
                    | Some key -> loop (Vec.push_back acc key) rest
                    | None ->
                        Error
                          (Error.invalid_options
                             ("invalid property key: "
                             ^ Melange_edn_melange.to_edn_string value)))
              in
              loop Vec.empty values
          | None -> Error (Error.invalid_options "properties must be a vector"))

let normalize_status value =
  match String.lowercase_ascii (String.trim value) with
  | "" -> None
  | "todo" | "later" -> Some (Edn_util.keyword_t "logseq.property/status.todo")
  | "doing" | "now" | "in-progress" | "in progress" | "inprogress" ->
      Some (Edn_util.keyword_t "logseq.property/status.doing")
  | "done" -> Some (Edn_util.keyword_t "logseq.property/status.done")
  | "wait" | "waiting" | "backlog" ->
      Some (Edn_util.keyword_t "logseq.property/status.backlog")
  | "canceled" | "cancelled" ->
      Some (Edn_util.keyword_t "logseq.property/status.canceled")
  | "in-review" | "in_review" | "inreview" ->
      Some (Edn_util.keyword_t "logseq.property/status.in-review")
  | value when String.length value > 0 && value.[0] = ':' ->
      Some (Edn_util.keyword_t value)
  | _ -> None

let invalid_options (opts : opts) =
  let target_selectors =
    Vec.filter Option.is_some
      (Vec.of_array
         [|
           Option.map Int64.to_string opts.target_id;
           opts.target_uuid;
           Option.map String.trim opts.target_page_name;
         |])
  in
  let nonempty = function
    | Some value -> String.trim value <> ""
    | None -> false
  in
  let has_blocks =
    nonempty opts.blocks_markdown || Option.is_some opts.blocks_file
  in
  let has_metadata = nonempty opts.tags_edn || nonempty opts.properties_edn in
  let invalid_target_uuid =
    match opts.target_uuid with
    | Some uuid -> not (Cli_primitive.is_uuid_string uuid)
    | None -> false
  in
  match (opts.pos, opts.target_page_name, target_selectors) with
  | _, _, _ when invalid_target_uuid ->
      Some "Option target-uuid must be a valid UUID string"
  | Some Block.Sibling, Some page, _ when String.trim page <> "" ->
      Some "--pos sibling is only valid for block targets"
  | Some Block.Sibling, _, selectors when Vec.is_empty selectors ->
      Some "--pos sibling is only valid for block targets"
  | _, _, _ when Vec.length target_selectors > 1 ->
      Some
        "only one of --target-id, --target-uuid, or --target-page-name is \
         allowed"
  | _, _, _ when has_blocks && has_metadata ->
      Some
        "tags and properties cannot be combined with --blocks or --blocks-file"
  | _ -> None

module Node_crypto = struct
  external random_uuid : unit -> string = "randomUUID" [@@mel.module "crypto"]
end

let generate_uuid = Node_crypto.random_uuid
let unique = Uuid_refs_types.unique_preserve_order

let ensure_block_uuid block =
  match block.Block.uuid with
  | Some _ -> block
  | None -> { block with uuid = Some (generate_uuid ()) }

let rec ensure_block_uuids block =
  let children = Vec.map ensure_block_uuids block.Block.children in
  ensure_block_uuid { block with children }

let read_file path = Cli_unix.read_text_file path

let read_blocks (opts : opts) args =
  match
    ( opts.blocks_markdown,
      opts.blocks_file,
      Option.map String.trim opts.content )
  with
  | Some text, _, _ -> (
      match Markdown_blocks.of_markdown text with
      | result -> result
      | exception exn ->
          Error
            (Error.make Error.Invalid_blocks
               ("invalid blocks markdown: " ^ Printexc.to_string exn)))
  | None, Some path, _ -> (
      try Markdown_blocks.of_markdown (read_file path)
      with exn ->
        Error
          (Error.make Error.Invalid_blocks
             (path ^ ": " ^ Printexc.to_string exn)))
  | None, None, Some content when content <> "" ->
      Ok (Vec.singleton (Block.make ~title:content ()))
  | None, None, _ when not (Vec.is_empty args) ->
      Ok (Vec.singleton (Block.make ~title:(Vec.string_concat " " args) ()))
  | _ -> Error (Error.make Error.Missing_content "content is required")

let build_add_block_action (opts : opts) args repo =
  match invalid_options opts with
  | Some message -> Error (Error.invalid_options message)
  | None ->
      Error.bind (read_blocks opts args) (fun blocks ->
          Error.bind (parse_tags_option opts.tags_edn) (fun tags ->
              Error.bind (parse_properties_option opts.properties_edn)
                (fun properties ->
                  let pos = Option.value opts.pos ~default:Block.Last_child in
                  let status = Option.bind opts.status normalize_status in
                  match (Option.map String.trim opts.status, status) with
                  | Some status_text, None when status_text <> "" ->
                      Error
                        (Error.invalid_options
                           ("invalid status: " ^ status_text))
                  | _ ->
                      let blocks = Vec.map ensure_block_uuids blocks in
                      Ok
                        {
                          repo;
                          graph = Cli_config.repo_to_graph repo;
                          target_id = opts.target_id;
                          target_uuid = opts.target_uuid;
                          target_page_name = opts.target_page_name;
                          pos;
                          status;
                          tags;
                          properties;
                          blocks;
                          markdown_blocks =
                            Option.is_some opts.blocks_markdown
                            || Option.is_some opts.blocks_file;
                        })))

let page_selector =
  vector_vec
    (Vec.of_array
       [|
         kw "db/id";
         kw "block/uuid";
         kw "block/name";
         kw "block/title";
         kw "logseq.property/deleted-at";
       |])

let tag_selector =
  vector_vec
    (Vec.of_array
       [|
         kw "db/id";
         kw "block/uuid";
         kw "block/name";
         kw "block/title";
         Edn_util.map_vec
           (Vec.of_array
              [|
                (kw "block/tags", vector_vec (Vec.of_array [| kw "db/ident" |]));
              |]);
         kw "logseq.property/public?";
         kw "logseq.property/built-in?";
       |])

let property_entity_selector =
  vector_vec
    (Vec.of_array
       [|
         kw "db/id";
         kw "db/ident";
         kw "block/name";
         kw "block/title";
         kw "logseq.property/type";
         kw "db/cardinality";
         kw "logseq.property/public?";
       |])

let page_query selector =
  Cli_primitive.make_datascript_query
    ~find:
      (Vec.singleton
         (vector_vec
            (Vec.of_array
               [|
                 list_vec (Vec.of_array [| sym "pull"; sym "?e"; selector |]);
                 sym "...";
               |])))
    ~in_:
      (Vec.of_array
         [|
           Melange_edn_melange.symbol "$"; Melange_edn_melange.symbol "?name";
         |])
    ~where:
      (Vec.singleton
         (Cli_primitive.V
            (Edn_util.vector_t_vec
               (Vec.of_array [| sym "?e"; kw "block/name"; sym "?name" |]))))
    ()

let tag_query selector =
  Cli_primitive.make_datascript_query
    ~find:
      (Vec.singleton
         (vector_vec
            (Vec.of_array
               [|
                 list_vec (Vec.of_array [| sym "pull"; sym "?e"; selector |]);
                 sym "...";
               |])))
    ~in_:
      (Vec.of_array
         [|
           Melange_edn_melange.symbol "$"; Melange_edn_melange.symbol "?name";
         |])
    ~where:
      (Vec.of_array
         [|
           Cli_primitive.V
             (Edn_util.vector_t_vec
                (Vec.of_array [| sym "?e"; kw "block/name"; sym "?name" |]));
           Cli_primitive.V
             (Edn_util.vector_t_vec
                (Vec.of_array [| sym "?e"; kw "block/tags"; sym "?t" |]));
           Cli_primitive.V
             (Edn_util.vector_t_vec
                (Vec.of_array
                   [| sym "?t"; kw "db/ident"; kw "logseq.class/Tag" |]));
         |])
    ()

let property_query selector =
  Cli_primitive.make_datascript_query
    ~find:
      (Vec.singleton
         (vector_vec
            (Vec.of_array
               [|
                 list_vec (Vec.of_array [| sym "pull"; sym "?e"; selector |]);
                 sym "...";
               |])))
    ~in_:
      (Vec.of_array
         [|
           Melange_edn_melange.symbol "$"; Melange_edn_melange.symbol "?name";
         |])
    ~where:
      (Vec.of_array
         [|
           Cli_primitive.V
             (Edn_util.vector_t_vec
                (Vec.of_array [| sym "?e"; kw "block/name"; sym "?name" |]));
           Cli_primitive.V
             (Edn_util.vector_t_vec
                (Vec.of_array [| sym "?e"; kw "block/tags"; sym "?t" |]));
           Cli_primitive.V
             (Edn_util.vector_t_vec
                (Vec.of_array
                   [| sym "?t"; kw "db/ident"; kw "logseq.class/Property" |]));
         |])
    ()

let first_entity = function
  | value -> (
      match
        (Edn_util.as_vector value, Edn_util.as_list value, Edn_util.as_map value)
      with
      | Some values, _, _ when not (Vec.is_empty values) ->
          Some (Vec.peek_front values)
      | _, Some values, _ when not (Vec.is_empty values) ->
          Some (Vec.peek_front values)
      | _, _, Some _ -> Some value
      | _ -> None)

let uuid_of_entity value =
  Option.bind (Edn_util.get value "block/uuid") Edn_util.as_string_like

let id_of_entity value = Edn_util.get_int64 value "db/id"

let ident_of_entity value =
  Option.bind (Edn_util.get value "db/ident") Edn_util.as_keyword_t

let recycled_entity value =
  Option.is_some (Edn_util.get value "logseq.property/deleted-at")

(* Page names are not unique: a recycled page can share a name with a live
   one. Prefer a live match; report recycled only when every match is
   recycled. *)
let live_or_all_recycled result =
  let entities =
    match Edn_util.as_seq result with
    | Some items -> items
    | None -> (
        match Edn_util.as_map result with
        | Some _ -> Vec.singleton result
        | None -> Vec.empty)
  in
  match Vec.find_opt (fun e -> not (recycled_entity e)) entities with
  | Some entity -> `Live entity
  | None when not (Vec.is_empty entities) -> `All_recycled
  | None -> `Missing

let page_not_found () = Error.make Error.Page_not_found "page not found"
let recycled_page_error () = Error.make Error.Recycled_page "page is recycled"

let pull_entity config repo selector lookup =
  Transport.thread_api_pull config ~repo
    ~selector:(Edn_util.expect_vector_t "add pull selector" selector)
    ~lookup

let apply_outliner_ops config repo ops =
  Transport.thread_api_apply_outliner_ops config ~repo
    ~ops:(Edn_util.vector_t_vec ops)
    ~options:(Edn_util.map_t_vec Vec.empty)

let create_page config repo name uuid =
  let op =
    Edn_util.vector_vec
      (Vec.of_array
         [|
           kw "create-page";
           Edn_util.vector_vec
             (Vec.of_array
                [|
                  Edn_util.string name;
                  Edn_util.map_vec
                    (Vec.of_array
                       [|
                         (kw "uuid", Edn_util.uuid uuid);
                         (kw "split-namespace?", Edn_util.bool true);
                       |]);
                |]);
         |])
  in
  apply_outliner_ops config repo (Vec.singleton op)

let pull_pages_by_name config repo name selector =
  Transport.thread_api_q config ~repo
    ~query:
      (Edn_util.vector_t_vec
         (Vec.of_array
            [|
              query_value (page_query selector);
              Edn_util.string (normalized_lookup_name name);
            |]))

let pull_tag_by_name config repo name selector =
  Transport.thread_api_q config ~repo
    ~query:
      (Edn_util.vector_t_vec
         (Vec.of_array
            [|
              query_value (tag_query selector);
              Edn_util.string (normalized_lookup_name name);
            |]))

let list_tags config repo =
  Transport.thread_api_cli_list_tags config ~repo
    ~options:(Edn_util.map_t_vec Vec.empty)

let tag_name_matches name entity =
  let expected = normalized_lookup_name name in
  let matches value = String.equal (normalized_lookup_name value) expected in
  match
    ( Edn_util.get_string entity "block/title",
      Edn_util.get_string entity "block/name" )
  with
  | Some title, _ when matches title -> true
  | _, Some name when matches name -> true
  | _ -> false

let pull_property_by_name config repo name selector =
  Transport.thread_api_q config ~repo
    ~query:
      (Edn_util.vector_t_vec
         (Vec.of_array
            [|
              query_value (property_query selector);
              Edn_util.string (normalized_lookup_name name);
            |]))

(* The apply-outliner-ops invoke returns {:result <op-result>}; the
   create-page op result is [title page-uuid]. *)
let created_page_uuid create_result =
  let op_result =
    match Edn_util.get create_result "result" with
    | Some value -> value
    | None -> create_result
  in
  match
    (Edn_util.as_vector op_result, Edn_util.as_list op_result)
  with
  | Some values, _ -> (
      match Vec.nth_opt values 1 with
      | Some value -> Edn_util.as_string_like value
      | None -> None)
  | _, Some values -> (
      match Vec.nth_opt values 1 with
      | Some value -> Edn_util.as_string_like value
      | None -> None)
  | _ -> None

let pull_created_page config repo name create_result =
  match created_page_uuid create_result with
  | Some uuid ->
      pull_entity config repo page_selector
        (vector_vec
           (Vec.of_array [| kw "block/uuid"; Edn_util.uuid uuid |]))
  | None ->
      pull_entity config repo page_selector
        (vector_vec
           (Vec.of_array
              [|
                kw "block/name"; Edn_util.string (normalized_lookup_name name);
              |]))

(* Returns the EDN value usable as the insert-blocks op target plus the names
   of pages that would be created. A missing target page stays a [:block/name]
   lookup vec — materialize_name_lookups creates it right before apply, and
   dry-run previews report it. *)
let resolve_add_target config (action : action) =
  let open Cli_effect in
  let block_target lookup =
    bind
      (pull_entity config action.repo
         (vector_vec
            (Vec.of_array [| kw "db/id"; kw "block/uuid"; kw "block/title" |]))
         lookup)
      (fun block ->
        match uuid_of_entity block with
        | Some uuid -> pure (Ok (Edn_util.uuid uuid, Vec.empty))
        | None ->
            pure
              (Error
                 (Error.make Error.Target_not_found "target block not found")))
  in
  match (action.target_id, action.target_uuid, action.target_page_name) with
  | Some id, _, _ -> block_target (Edn_util.int64 id)
  | None, Some uuid, _ ->
      block_target
        (vector_vec (Vec.of_array [| kw "block/uuid"; Edn_util.uuid uuid |]))
  | None, None, Some page_name ->
      bind
        (pull_pages_by_name config action.repo page_name page_selector)
        (fun result ->
          match live_or_all_recycled result with
          | `All_recycled -> pure (Error (recycled_page_error ()))
          | `Live entity -> (
              match uuid_of_entity entity with
              | Some uuid -> pure (Ok (Edn_util.uuid uuid, Vec.empty))
              | None -> pure (Error (page_not_found ())))
          | `Missing ->
              pure
                (Ok
                   ( vector_vec
                       (Vec.of_array
                          [|
                            kw "block/name"; Edn_util.string page_name;
                          |]),
                     Vec.singleton page_name )))
  | None, None, None ->
      pure
        (Error
           (Error.make Error.Missing_target "target page or block is required"))

let flatten_blocks blocks =
  let rec flatten_one parent_uuid block =
    let parent =
      match parent_uuid with
      | Some uuid -> Some (Selector.Block_uuid uuid)
      | None -> block.Block.parent
    in
    let children = block.children in
    let block = { block with parent; children = Vec.empty } in
    let child_parent_uuid = block.Block.uuid in
    Vec.push_front
      (Vec.concat_map (flatten_one child_parent_uuid) children)
      block
  in
  Vec.concat_map (flatten_one None) blocks

let insert_opts = function
  | Block.Last_child ->
      Edn_util.map_vec
        (Vec.of_array
           [|
             (kw "sibling?", Edn_util.bool false);
             (kw "bottom?", Edn_util.bool true);
             (kw "keep-uuid?", Edn_util.bool true);
             (kw "outliner-op", kw "insert-blocks");
           |])
  | First_child ->
      Edn_util.map_vec
        (Vec.of_array
           [|
             (kw "sibling?", Edn_util.bool false);
             (kw "keep-uuid?", Edn_util.bool true);
             (kw "outliner-op", kw "insert-blocks");
           |])
  | Sibling ->
      Edn_util.map_vec
        (Vec.of_array
           [|
             (kw "sibling?", Edn_util.bool true);
             (kw "keep-uuid?", Edn_util.bool true);
             (kw "outliner-op", kw "insert-blocks");
           |])

let collect_action_block_uuids blocks =
  blocks |> flatten_blocks
  |> Vec.map (fun block -> Option.get block.Block.uuid)
  |> Uuid_refs_types.unique_preserve_order

let result_ids ids =
  Edn_util.map_vec
    (Vec.of_array
       [|
         ( kw "result",
           Edn_util.vector_vec (ids |> Vec.map (fun id -> Edn_util.int64 id)) );
       |])

let lookup_of_tag = function
  | Selector.Tag_id id -> Edn_util.int64 id
  | Tag_name name -> Edn_util.string (normalized_lookup_name name)
  | Tag_ident ident -> Edn_util.any ident
  | Tag_uuid uuid ->
      vector_vec (Vec.of_array [| kw "block/uuid"; Edn_util.uuid uuid |])

let tag_entity value =
  match Option.bind (Edn_util.get value "block/tags") Edn_util.as_seq with
  | Some tags ->
      Vec.exists
        (fun tag ->
          match
            Option.bind (Edn_util.get tag "db/ident") Edn_util.as_string_like
          with
          | Some "logseq.class/Tag" -> true
          | _ -> false)
        tags
  | None -> false

let resolve_tag_entity invoke_config repo tag_list tag =
  let open Cli_effect in
  let tag_not_found =
    Error.make Error.Tag_not_found "tag not found"
  in
  match tag with
  | Selector.Tag_name name -> (
      match
        Option.bind
          (Option.bind tag_list Edn_util.as_seq)
          (fun entities -> Vec.find_opt (tag_name_matches name) entities)
      with
      | Some entity when Option.is_some (id_of_entity entity) ->
          pure (Ok (Entity.of_value entity))
      | _ ->
          pure
            (Error
               (Error.make Error.Tag_not_found ("tag not found: " ^ name))))
  | _ ->
      bind
        (pull_entity invoke_config repo tag_selector (lookup_of_tag tag))
        (fun entity ->
          match first_entity entity with
          | Some entity
            when Option.is_some (id_of_entity entity) && tag_entity entity ->
              pure (Ok (Entity.of_value entity))
          | _ -> pure (Error tag_not_found))

(* Concurrent per-element resolution: every effect is constructed eagerly
   so its HTTP request is in flight immediately, then the results fold in
   input order so the first error still wins deterministically. *)
let all_results tasks =
  let open Cli_effect in
  map
    (fun results ->
      Vec.fold_left
        (fun acc result ->
          match (acc, result) with
          | Error _, _ -> acc
          | Ok _, Error err -> Error err
          | Ok acc, Ok value -> Ok (Vec.push_back acc value))
        (Ok Vec.empty) results)
    (all tasks)

let resolve_tag_entities invoke_config repo tags =
  let open Cli_effect in
  (* Fetch the tag table once for the whole command instead of once per
     Tag_name selector. *)
  let has_tag_name =
    Vec.exists
      (fun tag -> match tag with Selector.Tag_name _ -> true | _ -> false)
      tags
  in
  bind
    (if has_tag_name then map Option.some (list_tags invoke_config repo)
     else pure None)
    (fun tag_list ->
      all_results
        (Vec.map (resolve_tag_entity invoke_config repo tag_list) tags))

let resolve_tags config repo tags =
  if Vec.is_empty tags then Cli_effect.pure (Ok Vec.empty)
  else
    let open Cli_effect in
    bind (Server_runtime.ensure_server config repo ~create_empty_db:false)
      (function
      | Error err -> pure (Error err)
      | Ok invoke_config ->
          resolve_tag_entities invoke_config repo tags)

let lookup_property_entity invoke_config repo = function
  | Property.Key_id id ->
      pull_entity invoke_config repo property_entity_selector
        (Edn_util.int64 id)
  | Key_ident ident ->
      pull_entity invoke_config repo property_entity_selector
        (vector_vec (Vec.of_array [| kw "db/ident"; Edn_util.any ident |]))
  | Key_name name ->
      let open Cli_effect in
      bind
        (pull_property_by_name invoke_config repo name property_entity_selector)
        (fun result ->
          match first_entity result with
          | Some entity when Option.is_some (id_of_entity entity) -> pure entity
          | _ ->
              let ident = Edn_util.keyword_t name in
              pull_entity invoke_config repo property_entity_selector
                (vector_vec
                   (Vec.of_array [| kw "db/ident"; Edn_util.any ident |])))

let resolve_property_assignment invoke_config repo assignment =
  let open Cli_effect in
  bind (lookup_property_entity invoke_config repo assignment.Property.key)
    (fun entity ->
      match
        ( id_of_entity entity,
          ident_of_entity entity,
          Edn_util.get entity "logseq.property/type" )
      with
      | Some _, Some ident, Some _ ->
          pure
            (Ok { assignment with Property.key = Property.Key_ident ident })
      | _ ->
          pure
            (Error
               (Error.make Error.Property_not_found "property not found")))

let resolve_property_assignments invoke_config repo assignments =
  all_results
    (Vec.map (resolve_property_assignment invoke_config repo) assignments)

let resolve_properties config repo properties =
  if Vec.is_empty properties then Cli_effect.pure (Ok Vec.empty)
  else
    let open Cli_effect in
    bind (Server_runtime.ensure_server config repo ~create_empty_db:false)
      (function
      | Error err -> pure (Error err)
      | Ok invoke_config ->
          resolve_property_assignments invoke_config repo properties)

let resolve_created_ids config repo blocks =
  let open Cli_effect in
  let uuids = collect_action_block_uuids blocks in
  let rec loop acc remaining =
    match Vec.pop_front remaining with
    | None -> pure (Ok acc)
    | Some (uuid, rest) ->
        bind
          (pull_entity config repo
             (vector_vec (Vec.of_array [| kw "db/id"; kw "block/uuid" |]))
             (vector_vec
                (Vec.of_array [| kw "block/uuid"; Edn_util.uuid uuid |])))
          (fun entity ->
            match id_of_entity entity with
            | Some id -> loop (Vec.push_back acc id) rest
            | None ->
                pure
                  (Error
                     (Error.make Error.Add_id_resolution_failed
                        "unable to resolve created ids")))
  in
  loop Vec.empty uuids

let target_not_found_error () =
  Error.make Error.Target_not_found "target block not found"

let resolve_created_ids_or_target_error config repo target_uuid blocks =
  let open Cli_effect in
  bind (resolve_created_ids config repo blocks) (function
    | Ok ids -> pure (Ok ids)
    | Error err when err.Error.code = Error.Add_id_resolution_failed ->
        bind
          (pull_entity config repo
             (vector_vec (Vec.of_array [| kw "db/id"; kw "block/uuid" |]))
             (vector_vec
                (Vec.of_array [| kw "block/uuid"; Edn_util.uuid target_uuid |])))
          (fun target ->
            if Option.is_some (id_of_entity target) then pure (Error err)
            else pure (Error (target_not_found_error ())))
    | Error err -> pure (Error err))

let property_key_to_value = function
  | Property.Key_ident ident -> Edn_util.any ident
  | Key_id id -> Edn_util.int64 id
  | Key_name name -> Edn_util.string name

let metadata_ops block_uuids status tags properties =
  let uuid_values =
    Edn_util.vector_vec (block_uuids |> Vec.map (fun uuid -> Edn_util.uuid uuid))
  in
  let status_ops =
    match (status, block_uuids) with
    | Some status, uuids when not (Vec.is_empty uuids) ->
        Vec.singleton
          (Edn_util.vector_vec
             (Vec.of_array
                [|
                  kw "batch-set-property";
                  Edn_util.vector_vec
                    (Vec.of_array
                       [|
                         uuid_values;
                         kw "logseq.property/status";
                         Edn_util.any status;
                         Edn_util.map_vec Vec.empty;
                       |]);
                |]))
    | _ -> Vec.empty
  in
  let tag_ops =
    tags
    |> Vec.filter_map (fun tag -> tag.Entity.id)
    |> Uuid_refs_types.unique_preserve_order
    |> Vec.map (fun tag_id ->
        Edn_util.vector_vec
          (Vec.of_array
             [|
               kw "batch-set-property";
               Edn_util.vector_vec
                 (Vec.of_array
                    [|
                      uuid_values;
                      kw "block/tags";
                      Edn_util.int64 tag_id;
                      Edn_util.map_vec Vec.empty;
                    |]);
             |]))
  in
  let property_ops =
    Vec.map
      (fun assignment ->
        Edn_util.vector_vec
          (Vec.of_array
             [|
               kw "batch-set-property";
               Edn_util.vector_vec
                 (Vec.of_array
                    [|
                      uuid_values;
                      property_key_to_value assignment.Property.key;
                      assignment.value;
                      Edn_util.map_vec Vec.empty;
                    |]);
             |]))
      properties
  in
  if Vec.is_empty block_uuids then Vec.empty
  else Vec.append status_ops (Vec.append tag_ops property_ops)

(* Mldoc.get_references on a block title returns the AST-level references:
   [[page]] links, ((block-uuid)) refs and #tags, without counting text inside
   code blocks or verbatim markup. *)
let title_references ~block_refs title =
  (* Namespaced pages need a create-page op with split-namespace? — the
     worker's inline page-map resolution rejects "/" titles. A [:block/name]
     lookup routes them through materialize_name_lookups instead. *)
  let page_ref_map name =
    if String.contains name '/' then
      vector_vec (Vec.of_array [| kw "block/name"; Edn_util.string name |])
    else
      Edn_util.map_vec
        (Vec.of_array
           [|
             (kw "block/title", Edn_util.string name);
             (kw "block/name", Edn_util.string (normalized_lookup_name name));
             ( kw "block/tags",
               Edn_util.vector_vec (Vec.singleton (kw "logseq.class/Page")) );
           |])
  in
  let tag_name_of_content content =
    match Js.Json.decodeArray content with
    | Some nodes -> (
        Array.find_map
          (fun node ->
            match Js.Json.decodeArray node with
            | Some parts when Array.length parts >= 2 -> (
                match Js.Json.decodeString parts.(0) with
                | Some "Plain" -> Js.Json.decodeString parts.(1)
                (* `#[[Tag Name]]` — multi-word tags arrive as a Link node
                   carrying a Page_ref url. *)
                | Some "Link" -> (
                    match Js.Json.decodeObject parts.(1) with
                    | Some link -> (
                        match
                          Option.bind
                            (Js.Dict.get link "url")
                            Js.Json.decodeArray
                        with
                        | Some url_parts
                          when Array.length url_parts >= 2 -> (
                            match
                              ( Js.Json.decodeString url_parts.(0),
                                Js.Json.decodeString url_parts.(1) )
                            with
                            | Some "Page_ref", Some name -> (
                                (* mldoc has no | alias syntax — [[a|b]]
                                   is a page literally named a|b. *)
                                match String.trim name with
                                | "" -> None
                                | name -> Some name)
                            | _ -> None)
                        | _ -> None)
                    | None -> None)
                | _ -> None)
            | _ -> Js.Json.decodeString node)
          nodes
        |> function
        | Some name when String.trim name <> "" -> Some (String.trim name)
        | _ -> None)
    | None -> None
  in
  match
    try Js.Json.decodeArray (Mldoc.references title)
    with _ -> None
  with
  | None -> (Vec.empty, Vec.empty)
  | Some items ->
      Array.fold_left
        (fun (refs, tag_names) item ->
          match Js.Json.decodeArray item with
          | Some pair when Array.length pair >= 2 -> (
              match Js.Json.decodeString pair.(0) with
              | Some "Tag" -> (
                  match tag_name_of_content pair.(1) with
                  | Some name -> (refs, Vec.push_back tag_names name)
                  | None -> (refs, tag_names))
              | Some "Link" -> (
                  match Js.Json.decodeObject pair.(1) with
                  | Some content -> (
                      match
                        Option.bind
                          (Js.Dict.get content "url")
                          Js.Json.decodeArray
                      with
                      | Some url_parts when Array.length url_parts >= 2 -> (
                          match
                            ( Js.Json.decodeString url_parts.(0),
                              Js.Json.decodeString url_parts.(1) )
                          with
                          | Some "Page_ref", Some name -> (
                              match String.trim name with
                              | "" -> (refs, tag_names)
                              (* [[<uuid>]] is not a page name — the old
                                 extractor filtered it the same way. *)
                              | name when Cli_primitive.is_uuid_string name ->
                                  (refs, tag_names)
                              | name ->
                                  ( Vec.push_back refs (page_ref_map name),
                                    tag_names ))
                          | Some "Block_ref", Some uuid ->
                              (* ((uuid)) block refs resolve to real links
                                 only for markdown --blocks; --content keeps
                                 them as literal text like before. *)
                              if
                                block_refs && Cli_primitive.is_uuid_string uuid
                              then
                                ( Vec.push_back refs
                                    (vector_vec
                                       (Vec.of_array
                                          [|
                                            kw "block/uuid";
                                            Edn_util.uuid uuid;
                                          |])),
                                  tag_names )
                              else (refs, tag_names)
                          | _ -> (refs, tag_names))
                      | _ -> (refs, tag_names))
                  | None -> (refs, tag_names))
              | _ -> (refs, tag_names))
          | _ -> (refs, tag_names))
        (Vec.empty, Vec.empty) items

(* Dry-run preview: page names that do not exist yet; the worker would create
   them while applying the planned ops. Read-only — pulls, never creates. *)
let missing_page_names invoke_config repo names =
  let open Cli_effect in
  map
    (fun result ->
      match result with
      | Error err -> Error err
      | Ok presence -> Ok (Vec.filter_map (fun name -> name) presence))
    (all_results
       (Vec.map
          (fun name ->
            map
              (fun result ->
                (* A recycled-only name resolves to an error on the real
                   path, so the dry-run fails the same way rather than
                   reporting a clean plan. *)
                match live_or_all_recycled result with
                | `Live _ -> Ok None
                | `All_recycled -> Error (recycled_page_error ())
                | `Missing -> Ok (Some name))
              (pull_pages_by_name invoke_config repo name page_selector))
          names))

let missing_ref_page_names invoke_config repo links =
  let names =
    links
    |> Vec.concat_map (fun (_, refs, _) -> refs)
    |> Vec.filter_map (fun ref_value ->
           Edn_util.get_string ref_value "block/title")
    |> unique
  in
  missing_page_names invoke_config repo names

(* 2-element lookup vectors [:block/name "x"] inside the planned ops — the
   target lookup and unresolved date property values under --dry-run — name
   pages the worker may need to create while applying. *)
let block_name_lookups_in_ops ops =
  let rec collect acc value =
    match Edn_util.as_vector value with
    | Some items -> (
        if Vec.length items = 2 then
          match
            ( Edn_util.as_string_like (Vec.nth items 0),
              Edn_util.as_string_like (Vec.nth items 1) )
          with
          | Some "block/name", Some name -> Vec.push_back acc name
          | _ -> Vec.fold_left collect acc items
        else Vec.fold_left collect acc items)
    | None -> (
        match Edn_util.as_map value with
        | Some fields ->
            Vec.fold_left (fun a (_, v) -> collect a v) acc fields
        | None -> acc)
  in
  Vec.fold_left collect Vec.empty ops |> unique

(* Replaces each [:block/name "x"] lookup vec in the ops with the resolved
   reference: the block uuid at the insert-blocks target position (the op
   schema requires a uuid there) and the entity id everywhere else. Returns
   the rewritten ops plus the materialized target lookup. *)
let rewrite_name_lookups ~target ids ops =
  let by_name = Hashtbl.create (Vec.length ids) in
  Vec.iter (fun (n, uuid, id) -> Hashtbl.replace by_name n (uuid, id)) ids;
  let find name = Hashtbl.find_opt by_name name in
  let rec rewrite ~as_uuid ~in_blocks value =
    match Edn_util.as_vector value with
    | Some items -> (
        if Vec.length items = 2 then
          match
            ( Edn_util.as_string_like (Vec.nth items 0),
              Edn_util.as_string_like (Vec.nth items 1) )
          with
          | Some "block/name", Some name -> (
              match find name with
              | Some (uuid, id) ->
                  (* insert-blocks payloads may not carry numeric entity
                     ids (the worker's op forwarding rejects them), so refs
                     there take [:block/uuid] lookups; property values in
                     batch-set-property / batch-delete-property-value must
                     carry the resolved entity id itself. *)
                  if as_uuid then
                    Edn_util.uuid uuid
                  else if in_blocks then
                    vector_vec
                      (Vec.of_array
                         [| kw "block/uuid"; Edn_util.uuid uuid |])
                  else Edn_util.int64 id
              | None -> value)
          | _ ->
              Edn_util.vector_vec (Vec.map (rewrite ~as_uuid:false ~in_blocks) items)
        else Edn_util.vector_vec (Vec.map (rewrite ~as_uuid:false ~in_blocks) items))
    | None -> (
        match Edn_util.as_map value with
        | Some fields ->
            Edn_util.map_vec
              (Vec.map
                 (fun (k, v) -> (k, rewrite ~as_uuid:false ~in_blocks v))
                 fields)
        | None -> value)
  in
  ( Vec.map
      (fun op ->
        match Edn_util.as_vector op with
        | Some items when Vec.length items = 2 -> (
            match
              ( Edn_util.as_string_like (Vec.nth items 0),
                Edn_util.as_vector (Vec.nth items 1) )
            with
            | Some "insert-blocks", Some args when Vec.length args = 3 ->
                Edn_util.vector_vec
                  (Vec.of_array
                     [|
                       Vec.nth items 0;
                       Edn_util.vector_vec
                         (Vec.of_array
                            [|
                              rewrite ~as_uuid:false ~in_blocks:true
                                (Vec.nth args 0);
                              rewrite ~as_uuid:true ~in_blocks:false
                                (Vec.nth args 1);
                              rewrite ~as_uuid:false ~in_blocks:true
                                (Vec.nth args 2);
                            |]);
                     |])
            | _ -> rewrite ~as_uuid:false ~in_blocks:false op)
        | _ -> rewrite ~as_uuid:false ~in_blocks:false op)
      ops,
    rewrite ~as_uuid:true ~in_blocks:false target )

(* Best-effort cleanup of pages materialize_name_lookups created when the final
   apply fails. Creation cannot join that transaction (insert-blocks requires a
   concrete uuid target and ref property values require entity ids), and the
   apply error is ambiguous — a timeout can fire after the worker committed, or
   a concurrent client may own a returned page. To avoid destroying committed or
   foreign content, each created page is re-checked for incoming references and
   only deleted when it still holds none. *)
(* Entities referencing a page through any ref attribute — block/parent
   (children), block/refs, block/page, property values. When the final apply
   committed despite a client-side error (e.g. a timeout), inserted blocks hold
   incoming references to the created pages; a page with no incoming refs can
   only come from a pre-commit failure or an unrelated orphan, so it is the
   only shape safe to delete. *)
let incoming_ref_query =
  Cli_primitive.make_datascript_query
    ~find:(Vec.singleton (sym "?x"))
    ~in_:
      (Vec.of_array
         [|
           Melange_edn_melange.symbol "$"; Melange_edn_melange.symbol "?uuid";
         |])
    ~where:
      (Vec.of_array
         [|
           Cli_primitive.V
             (Edn_util.vector_t_vec
                (Vec.of_array
                   [| sym "?p"; kw "block/uuid"; sym "?uuid" |]));
           Cli_primitive.V
             (Edn_util.vector_t_vec
                (Vec.of_array [| sym "?x"; sym "?a"; sym "?p" |]));
           Cli_primitive.V
             (Edn_util.vector_t_vec
                (Vec.of_array [| sym "?ae"; kw "db/ident"; sym "?a" |]));
           Cli_primitive.V
             (Edn_util.vector_t_vec
                (Vec.of_array
                   [| sym "?ae"; kw "db/valueType"; kw "db.type/ref" |]));
         |])
    ()

(* created_uuids arrive leaf-first (deepest namespace level first). Pages are
   checked and deleted one at a time in that order so a namespace parent's
   orphan check runs only after its children were already removed. Deletion
   goes through delete-page (recycle bin) rather than permanent removal: a
   concurrent client may reference a page between the orphan check and the
   delete, and a recycled page is recoverable while a purged one is not. *)
let rollback_pages invoke_config repo created_uuids =
  let open Cli_effect in
  let still_orphaned uuid =
    bind
      (Transport.thread_api_q invoke_config ~repo
         ~query:
           (Edn_util.vector_t_vec
              (Vec.of_array
                 [|
                   query_value incoming_ref_query; Edn_util.uuid uuid;
                 |])))
      (fun result ->
        match Edn_util.as_seq result with
        | Some items -> pure (Vec.is_empty items)
        | None -> pure false)
  in
  let rec loop remaining =
    match Vec.pop_front remaining with
    | None -> pure ()
    | Some (uuid, rest) ->
        bind (still_orphaned uuid) (fun orphaned ->
            bind
              (if orphaned then
                 catch
                   (map
                      (fun _ -> ())
                      (apply_outliner_ops invoke_config repo
                         (Vec.singleton
                            (Edn_util.vector_vec
                               (Vec.of_array
                                  [|
                                    kw "delete-page";
                                    Edn_util.vector_vec
                                      (Vec.of_array
                                         [|
                                           Edn_util.uuid uuid;
                                           Edn_util.map_vec Vec.empty;
                                         |]);
                                  |])))))
                   (fun _ -> pure ())
               else pure ())
              (fun () -> loop rest))
  in
  catch (loop created_uuids) (fun _ -> pure ())

(* "A/B/C" -> ["A"; "A/B"] — the namespace prefixes a split-namespace
   create-page may also create as parent pages. *)
let ancestor_prefixes name =
  let parts = Vec.split_on_char '/' name in
  let rec loop acc prefix remaining =
    match Vec.pop_front remaining with
    | None -> acc
    | Some (part, rest) ->
        let prefix = if prefix = "" then part else prefix ^ "/" ^ part in
        if Vec.is_empty rest then acc
        else loop (Vec.push_back acc prefix) prefix rest
  in
  loop Vec.empty "" parts

(* Resolves every [:block/name] lookup vec left in the planned ops to concrete
   references, creating the named pages that do not exist yet. Page creation
   happens only after all read-only validation has succeeded, so a rejected
   command leaves no orphaned pages behind. Returns the rewritten ops, the
   materialized target lookup, and the uuids of pages created here — deepest
   first so rollback can walk leaf-to-root (for rollback when the final apply
   fails). *)
let materialize_name_lookups invoke_config repo ~target_lookup ops =
  let open Cli_effect in
  let names = block_name_lookups_in_ops ops in
  let created = ref Vec.empty in
  let track_created name uuid =
    if Vec.exists (fun (_, known) -> String.equal known uuid) !created then ()
    else
      created
      := Vec.push_back !created (Vec.length (Vec.split_on_char '/' name), uuid)
  in
  let returned_uuid create_result = created_page_uuid create_result in
  (* A namespaced leaf's create-page can also create its ancestors; an
     ancestor absent before the call and live after it belongs to this
     command and joins the rollback set. Runs ancestor name pulls before
     the create and returns the post-create check as a suspended task so
     ownership is recorded only once the leaf is confirmed ours. *)
  let track_ancestors invoke_config repo name =
    let ancestors = ancestor_prefixes name in
    if Vec.is_empty ancestors then pure (fun () -> pure ())
    else
      map
        (fun presences ->
          let was_live =
            Vec.map
              (fun result ->
                match live_or_all_recycled result with
                | `Live _ -> true
                | _ -> false)
              presences
          in
          fun () ->
            (* Deepest ancestor first, matching leaf-to-root rollback order. *)
            map
              (fun _ -> ())
              (map_s
                 (fun (ancestor, live_before) ->
                   if live_before then pure ()
                   else
                     (* One rejected re-pull must not skip tracking the
                        ancestors that follow it. *)
                     catch
                       (map
                          (fun result ->
                            match live_or_all_recycled result with
                            | `Live entity -> (
                                match uuid_of_entity entity with
                                | Some uuid -> track_created ancestor uuid
                                | None -> ())
                            | _ -> ())
                          (pull_pages_by_name invoke_config repo ancestor
                             page_selector))
                       (fun _ -> pure ()))
                 (Vec.rev (Vec.combine ancestors was_live))))
        (all
           (Vec.map
              (fun ancestor ->
                pull_pages_by_name invoke_config repo ancestor page_selector)
              ancestors))
  in
  let resolve_one name =
    let found entity =
      match (uuid_of_entity entity, id_of_entity entity) with
      | Some uuid, Some id -> Some (name, uuid, id)
      | _ -> None
    in
    bind
      (pull_pages_by_name invoke_config repo name page_selector)
      (fun result ->
        match live_or_all_recycled result with
        | `Live entity -> (
            match found entity with
            | Some entry -> pure (Ok entry)
            | None -> pure (Error (page_not_found ())))
        | `All_recycled -> pure (Error (recycled_page_error ()))
        | `Missing -> (
            (* A create-page op carries our generated uuid: the worker
               returns it only when this call actually created the page —
               an existing (or concurrently created) page returns its own
               uuid, which must never enter the rollback set. Journal
               pages are never tracked: their uuid is derived from the
               journal day, so every concurrent creator returns the same
               uuid and ownership cannot be proven — a failed run may
               leave an empty journal page behind, which is harmless
               (the app creates today's journal on demand anyway). *)
            let our_uuid = generate_uuid () in
            bind (track_ancestors invoke_config repo name)
              (fun check_ancestors ->
                bind
                  (create_page invoke_config repo name our_uuid)
                  (fun create_result ->
                    (* Register ownership as soon as the worker confirms it
                       returned our uuid — the page exists even if the
                       follow-up pull below rejects. *)
                    (match returned_uuid create_result with
                    | Some uuid when String.equal uuid our_uuid ->
                        track_created name our_uuid
                    | _ -> ());
                    bind (check_ancestors ()) (fun () ->
                        bind
                          ((* A name pull misses namespaced pages: split-
                              namespace gives the leaf its own title. Pull
                              by uuid instead — the worker's returned uuid
                              when it reports one (it differs from ours when
                              the page already existed), else ours. *)
                             let uuids =
                               (match returned_uuid create_result with
                                | Some uuid ->
                                    Vec.of_array [| uuid; our_uuid |]
                                | None -> Vec.singleton our_uuid)
                               |> unique
                             in
                             let rec try_uuid remaining =
                               match Vec.pop_front remaining with
                               | None ->
                                   pull_created_page invoke_config repo name
                                     create_result
                               | Some (uuid, rest) ->
                                   bind
                                     (pull_entity invoke_config repo
                                        page_selector
                                        (vector_vec
                                           (Vec.of_array
                                              [|
                                                kw "block/uuid";
                                                Edn_util.uuid uuid;
                                              |])))
                                     (fun entity ->
                                       match found entity with
                                       | Some _ -> pure entity
                                       | None -> try_uuid rest)
                             in
                             try_uuid uuids)
                          (fun entity ->
                            if recycled_entity entity then
                              pure (Error (recycled_page_error ()))
                            else
                              match found entity with
                              | Some entry -> pure (Ok entry)
                              | None -> pure (Error (page_not_found ()))))))))
  in
  let created_uuids () =
    !created
    |> Vec.sort (fun (a, _) (b, _) -> compare b a)
    |> Vec.map snd
  in
  (* all-settled: a sibling's failure leaves other resolve_one tasks in
     flight, and their create-page requests can still land — waiting for
     every task keeps !created complete before rollback runs. *)
  bind
    (all
       (Vec.map
          (fun name ->
            catch
              (map (fun value -> Ok value) (resolve_one name))
              (fun exn -> pure (Error exn)))
          names))
    (fun settled ->
      let first_failure =
        Vec.find_map
          (function
            | Error exn -> Some (Ok exn)
            | Ok (Error err) -> Some (Error err)
            | Ok (Ok _) -> None)
          settled
      in
      match first_failure with
      | Some (Ok exn) ->
          (* Rollback is best-effort: a rollback rejection must not mask the
             real resolution/apply error. *)
          bind
            (catch
               (rollback_pages invoke_config repo (created_uuids ()))
               (fun _ -> pure ()))
            (fun () -> Cli_effect.error exn)
      | Some (Error err) ->
          bind
            (catch
               (rollback_pages invoke_config repo (created_uuids ()))
               (fun _ -> pure ()))
            (fun () -> pure (Error err))
      | None ->
          let ids =
            Vec.filter_map
              (function Ok (Ok entry) -> Some entry | _ -> None)
              settled
          in
          pure
            (Ok
               ( rewrite_name_lookups ~target:target_lookup ids ops,
                 created_uuids () )))

let execute_add_block ~extra_ops ?(dry_run = false) action config mode =
  let open Cli_effect in
  bind (Server_runtime.ensure_server config action.repo ~create_empty_db:false)
    (function
    | Error err ->
        pure (Cli_result.error ~command:Command_id.Upsert_block mode err)
    | Ok invoke_config ->
        bind (resolve_add_target invoke_config action) (function
          | Error err ->
              pure (Cli_result.error ~command:Command_id.Upsert_block mode err)
          | Ok (target_lookup, would_create_pages) ->
              bind (resolve_tags config action.repo action.tags) (function
                | Error err ->
                    pure
                      (Cli_result.error ~command:Command_id.Upsert_block
                         mode err)
                | Ok tags ->
                    bind
                      (resolve_properties config action.repo action.properties)
                      (function
                      | Error err ->
                          pure
                            (Cli_result.error ~command:Command_id.Upsert_block
                               mode err)
                      | Ok properties ->
                      let flat_blocks = flatten_blocks action.blocks in
                      let links =
                        Vec.filter_map
                          (fun block ->
                            match (block.Block.uuid, block.title) with
                            | Some uuid, Some title ->
                                let refs, tag_names =
                                  title_references
                                    ~block_refs:action.markdown_blocks title
                                in
                                (* #tags resolve to block/tags only for
                                   markdown --blocks input; literal --content
                                   keeps its plain-text meaning. *)
                                let tag_names =
                                  if action.markdown_blocks then tag_names
                                  else Vec.empty
                                in
                                (* App semantics put tags in block/refs too
                                   so the tag page's linked references list
                                   the block; a [:block/name] lookup
                                   resolves to the existing tag entity. *)
                                let refs =
                                  Vec.fold_left
                                    (fun refs name ->
                                      Vec.push_back refs
                                        (vector_vec
                                           (Vec.of_array
                                              [|
                                                kw "block/name";
                                                Edn_util.string
                                                  (normalized_lookup_name name);
                                              |])))
                                    refs tag_names
                                in
                                if
                                  Vec.is_empty refs && Vec.is_empty tag_names
                                then None
                                else Some (uuid, refs, tag_names)
                            | _ -> None)
                          flat_blocks
                      in
                      let block_tag_names =
                        links
                        |> Vec.concat_map (fun (_, _, names) -> names)
                        |> unique
                      in
                      bind
                        (resolve_tags config action.repo
                           (Vec.map
                              (fun name -> Selector.Tag_name name)
                              block_tag_names))
                        (function
                        | Error err ->
                            pure
                              (Cli_result.error
                                 ~command:Command_id.Upsert_block mode err)
                        | Ok block_tag_entities ->
                          let tag_id_of_name name =
                            Vec.find_map
                              (fun (n, entity) ->
                                if n = name then entity.Entity.id else None)
                              (Vec.combine block_tag_names block_tag_entities)
                          in
                          let block_tag_ops =
                            Vec.concat_map
                              (fun (uuid, _, names) ->
                                Vec.filter_map
                                  (fun name ->
                                    match tag_id_of_name name with
                                    | Some tag_id ->
                                        Some
                                          (Edn_util.vector_vec
                                             (Vec.of_array
                                                [|
                                                  kw "batch-set-property";
                                                  Edn_util.vector_vec
                                                    (Vec.of_array
                                                       [|
                                                         Edn_util.vector_vec
                                                           (Vec.of_array
                                                              [|
                                                                Edn_util.uuid
                                                                  uuid;
                                                              |]);
                                                         kw "block/tags";
                                                         Edn_util.int64 tag_id;
                                                         Edn_util.map_vec
                                                           Vec.empty;
                                                       |]);
                                                |]))
                                    | None -> None)
                                  names)
                              links
                          in
                          let block_uuids =
                            collect_action_block_uuids action.blocks
                          in
                          let refs_by_uuid =
                            Hashtbl.create (Vec.length links)
                          in
                          Vec.iter
                            (fun (u, refs, _) ->
                              Hashtbl.replace refs_by_uuid u refs)
                            links;
                          let block_value_for_insert block =
                            let value =
                              Edn_util.any (Block.to_value block)
                            in
                            match block.Block.uuid with
                            | Some uuid -> (
                                match Hashtbl.find_opt refs_by_uuid uuid with
                                | Some refs when not (Vec.is_empty refs) ->
                                    Edn_util.assoc "block/refs"
                                      (Edn_util.vector_vec refs) value
                                | _ -> value)
                            | None -> value
                          in
                          let insert_op =
                            Edn_util.vector_vec
                              (Vec.of_array
                                 [|
                                   kw "insert-blocks";
                                   Edn_util.vector_vec
                                     (Vec.of_array
                                        [|
                                          Edn_util.vector_vec
                                            (Vec.map block_value_for_insert
                                               flat_blocks);
                                          target_lookup;
                                          insert_opts action.pos;
                                        |]);
                                 |])
                          in
                          let ops =
                            Vec.append
                              (Vec.singleton insert_op)
                              (Vec.append
                                 (metadata_ops block_uuids action.status tags
                                    properties)
                                 (Vec.append block_tag_ops extra_ops))
                          in
                          if dry_run then
                            bind
                              (missing_ref_page_names invoke_config action.repo
                                 links) (function
                              | Error err ->
                                  pure
                                    (Cli_result.error
                                       ~command:Command_id.Upsert_block mode
                                       err)
                              | Ok missing_refs ->
                                bind
                                  (missing_page_names invoke_config
                                     action.repo
                                     (block_name_lookups_in_ops ops))
                                  (function
                                  | Error err ->
                                      pure
                                        (Cli_result.error
                                           ~command:Command_id.Upsert_block
                                           mode err)
                                  | Ok missing_lookups ->
                                    let would_create_pages =
                                      Vec.append would_create_pages
                                        (Vec.append missing_refs
                                           missing_lookups)
                                      |> unique
                                    in
                                    pure
                                      (Cli_result.ok
                                         ~command:Command_id.Upsert_block mode
                                         (Raw
                                            (Edn_util.map_vec
                                               (Vec.of_array
                                                  [|
                                                    ( kw "dry-run",
                                                      Edn_util.bool true );
                                                    ( kw "ops",
                                                      Edn_util.vector_vec ops
                                                    );
                                                    ( kw "would-create-pages",
                                                      Edn_util.vector_vec
                                                        (would_create_pages
                                                        |> Vec.map
                                                             (fun name ->
                                                               Edn_util.string
                                                                 name)) );
                                                  |]))))))
                          else
                            bind
                              (materialize_name_lookups invoke_config
                                 action.repo ~target_lookup ops) (function
                              | Error err ->
                                  pure
                                    (Cli_result.error
                                       ~command:Command_id.Upsert_block mode
                                       err)
                              | Ok ((ops, target_lookup), created_uuids) ->
                              bind
                                (catch
                                   (apply_outliner_ops invoke_config
                                      action.repo ops)
                                   (fun exn ->
                                     bind
                                       (catch
                                          (rollback_pages invoke_config
                                             action.repo created_uuids)
                                          (fun _ -> pure ()))
                                       (fun () -> Cli_effect.error exn))) (fun _apply_result ->
                                match Edn_util.as_uuid target_lookup with
                                | Some target_uuid ->
                                    bind
                                      (resolve_created_ids_or_target_error
                                         invoke_config action.repo target_uuid
                                         action.blocks) (function
                                      | Error err ->
                                          pure
                                            (Cli_result.error
                                               ~command:
                                                 Command_id.Upsert_block mode
                                               err)
                                      | Ok ids ->
                                          pure
                                            (Cli_result.ok
                                               ~command:
                                                 Command_id.Upsert_block mode
                                               (Raw (result_ids ids))))
                                | None ->
                                    bind
                                      (resolve_created_ids invoke_config
                                         action.repo action.blocks) (function
                                      | Error err ->
                                          pure
                                            (Cli_result.error
                                               ~command:
                                                 Command_id.Upsert_block mode
                                               err)
                                      | Ok ids ->
                                          pure
                                            (Cli_result.ok
                                               ~command:
                                                 Command_id.Upsert_block mode
                                               (Raw (result_ids ids)))))))))))
