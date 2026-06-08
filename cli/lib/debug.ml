type selector =
  | By_id of Cli_primitive.db_id
  | By_uuid of Cli_primitive.uuid
  | By_ident of Cli_primitive.keyword

type opts = {
  id : Cli_primitive.db_id option;
  uuid : Cli_primitive.uuid option;
  ident : Cli_primitive.keyword option;
}

type parsed = Parsed_pull of opts

type action =
  | Debug_pull of {
      repo : Cli_primitive.repo;
      graph : Cli_primitive.graph;
      lookup : selector;
      selector : Melange_edn.any;
    }

let parse_ident_option value =
  let value = String.trim value in
  try
    match Edn_util.as_keyword_t (Melange_edn.of_edn_string value) with
    | Some keyword -> Ok keyword
    | None ->
        Error
          (Error.invalid_options
             "ident must be a strict EDN keyword (e.g. :logseq.class/Tag)")
  with _ ->
    Error
      (Error.invalid_options
         "ident must be a strict EDN keyword (e.g. :logseq.class/Tag)")

let resolve_selector opts =
  let uuid = Option.bind opts.uuid Cli_primitive.non_empty in
  let selectors =
    []
    |> (fun acc ->
    match opts.id with Some id -> By_id id :: acc | None -> acc)
    |> (fun acc ->
    match uuid with Some uuid -> By_uuid uuid :: acc | None -> acc)
    |> (fun acc ->
    match opts.ident with Some ident -> By_ident ident :: acc | None -> acc)
    |> List.rev
  in
  match selectors with
  | [] ->
      Error
        (Error.invalid_options
           "exactly one of --id, --uuid, or --ident is required")
  | [ By_uuid uuid ] when not (Cli_primitive.is_uuid_string uuid) ->
      Error (Error.invalid_options "Option uuid must be a valid UUID string")
  | [ selector ] -> Ok selector
  | _ ->
      Error
        (Error.invalid_options "only one of --id, --uuid, or --ident is allowed")

let command_id _ = Command_id.Debug_pull

let validate_parsed (Parsed_pull opts) =
  Error.map (fun _ -> ()) (resolve_selector opts)

let selector_value = function
  | By_id id -> Edn_util.int64 id
  | By_uuid uuid ->
      Edn_util.vector [ Edn_util.keyword "block/uuid"; Edn_util.uuid uuid ]
  | By_ident ident ->
      Edn_util.vector [ Edn_util.keyword "db/ident"; Edn_util.any ident ]

let default_selector = Edn_util.vector [ Edn_util.string "~$*" ]

let build ?registry:_ config _globals (Parsed_pull opts) =
  Error.bind (resolve_selector opts) (fun lookup ->
      match config.Cli_config.repo with
      | Some repo ->
          Ok
            (Debug_pull
               {
                 repo;
                 graph = Cli_config.repo_to_graph repo;
                 lookup;
                 selector = default_selector;
               })
      | None -> Error (Error.missing_repo "repo is required for debug pull"))

let execute (Debug_pull action) config mode =
  let open Cli_effect in
  bind (Server_runtime.ensure_server config action.repo ~create_empty_db:false)
    (function
    | Error err ->
        pure (Output_mode.error ~command:Command_id.Debug_pull mode err)
    | Ok invoke_config ->
        bind
          (Transport.thread_api_pull invoke_config ~repo:action.repo
             ~selector:
               (Edn_util.expect_vector_t "debug pull selector" action.selector)
             ~lookup:(selector_value action.lookup))
          (fun entity ->
            if Edn_util.is_null entity then
              pure
                (Output_mode.error ~command:Command_id.Debug_pull mode
                   (Error.make
                      (Edn_util.keyword_t "entity-not-found")
                      "entity not found"))
            else
              pure
                (Cli_result.ok ~command:Command_id.Debug_pull mode
                   (Raw
                      (Edn_util.map
                         [
                           (Edn_util.keyword "entity", entity);
                           ( Edn_util.keyword "lookup",
                             selector_value action.lookup );
                           (Edn_util.keyword "selector", action.selector);
                         ])))))

let metadata () =
  [
    {
      Command_registry.id = Command_id.Debug_pull;
      path = Command_id.to_path Command_id.Debug_pull;
      doc = "Pull raw entity data for debugging";
      long_doc = None;
      examples = [];
      options = [];
      category = Command_registry.Hidden;
      requires_graph = Command_id.requires_graph Command_id.Debug_pull;
      requires_auth = Command_id.requires_auth Command_id.Debug_pull;
      write_command = Command_id.is_write Command_id.Debug_pull;
    };
  ]
