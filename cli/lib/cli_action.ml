type t =
  | Version
  | Graph of Graph.action
  | List of List_command.action
  | Upsert of Upsert.action
  | Remove of Remove.action
  | Search of Search.action
  | Query of Query.action
  | Show of Show.action
  | Server of Server_command.action
  | Sync of Sync.action
  | Auth of Auth_command.action
  | Agent of Agent.action
  | Doctor of Doctor.action
  | Debug of Debug.action
  | Skill of Skill.action
  | Completion of Completion.action
  | Example of Example.action

let build_time : string =
  [%mel.raw
    {|
typeof LOGSEQ_CLI_BUILD_TIME !== "undefined" ? LOGSEQ_CLI_BUILD_TIME : "unknown"
|}]

let revision : string =
  [%mel.raw
    {|
typeof LOGSEQ_CLI_REVISION !== "undefined" ? LOGSEQ_CLI_REVISION : "dev"
|}]

let version_output () =
  "Build time: " ^ build_time ^ "\nRevision: " ^ revision

let build config request =
  let result =
    match request.Cli_request.command with
    | Cli_request.Version -> Ok Version
    | Graph parsed ->
        Error.bind (Graph.build config request.globals parsed) (fun action ->
            Ok (Graph action))
    | List parsed ->
        Error.bind (List_command.build config request.globals parsed)
          (fun action -> Ok (List action))
    | Upsert parsed ->
        Error.bind (Upsert.build config request.globals parsed) (fun action ->
            Ok (Upsert action))
    | Remove parsed ->
        Error.bind (Remove.build config request.globals parsed) (fun action ->
            Ok (Remove action))
    | Search parsed ->
        Error.bind (Search.build config request.globals parsed) (fun action ->
            Ok (Search action))
    | Query parsed ->
        Error.bind (Query.build config request.globals parsed) (fun action ->
            Ok (Query action))
    | Show parsed ->
        Error.bind (Show.build config request.globals parsed) (fun action ->
            Ok (Show action))
    | Server parsed ->
        Error.bind (Server_command.build config request.globals parsed)
          (fun action -> Ok (Server action))
    | Sync parsed ->
        Error.bind (Sync.build config request.globals parsed) (fun action ->
            Ok (Sync action))
    | Debug parsed ->
        Error.bind (Debug.build config request.globals parsed) (fun action ->
            Ok (Debug action))
    | Doctor parsed ->
        Error.bind (Doctor.build config request.globals parsed) (fun action ->
            Ok (Doctor action))
    | Skill parsed ->
        Error.bind (Skill.build config request.globals parsed) (fun action ->
            Ok (Skill action))
    | Completion parsed ->
        Error.bind (Completion.build config request.globals parsed)
          (fun action -> Ok (Completion action))
    | Example parsed ->
        Error.bind (Example.build config request.globals parsed) (fun action ->
            Ok (Example action))
    | Auth parsed ->
        Error.bind (Auth_command.build config request.globals parsed)
          (fun action -> Ok (Auth action))
    | Agent parsed ->
        Error.bind (Agent.build config request.globals parsed) (fun action ->
            Ok (Agent action))
  in
  Cli_effect.pure result

let output_mode config =
  Option.value config.Cli_config.output_format ~default:Output_mode.default

let execute action config =
  let (Output.Mode.Packed mode) = output_mode config in
  match action with
  | Version ->
      Cli_effect.pure
        (Cli_result.ok ~command:Command_id.Version mode
           (Message (version_output ())))
  | Graph action -> Graph.execute action config
  | List action -> List_command.execute action config
  | Upsert action -> Upsert.execute action config
  | Remove action -> Remove.execute action config
  | Search action -> Search.execute action config
  | Query action -> Query.execute action config
  | Show action -> Show.execute action config
  | Server action -> Server_command.execute action config
  | Sync action -> Sync.execute action config
  | Debug action -> Debug.execute action config
  | Doctor action -> Doctor.execute action config
  | Skill action -> Skill.execute action config
  | Completion action -> Completion.execute action config
  | Example action -> Example.execute action config
  | Auth action -> Auth_command.execute action config
  | Agent action -> Agent.execute action config

let requires_missing_graph = function
  | Graph (Graph.Graph_import { opts = { import_type = Graph.Import_sqlite; _ }; _ })
    ->
      true
  | Sync (Sync.Sync_download { require_missing_graph; _ }) ->
      require_missing_graph
  | _ -> false

let repo = function
  | Graph a -> Graph.repo a
  | Upsert a -> Some (Upsert.repo a)
  | Sync (Sync.Sync_download { repo; _ }) -> Some repo
  | _ -> None

let graph = function
  | Graph a -> Graph.graph a
  | Upsert a -> Some (Upsert.graph a)
  | Sync (Sync.Sync_download { graph; _ }) -> Some graph
  | _ -> None
