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

type build_context = {
  config : Cli_config.t;
  request : Cli_request.t;
  selected_graph : Cli_primitive.graph option;
  selected_repo : Cli_primitive.repo option;
}

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

let execute action config mode =
  match action with
  | Version ->
      Cli_effect.pure
        (Cli_result.ok ~command:Command_id.Version mode
           (Message "logseq-cli ocaml"))
  | Graph action -> Graph.execute action config mode
  | List action -> List_command.execute action config mode
  | Upsert action -> Upsert.execute action config mode
  | Remove action -> Remove.execute action config mode
  | Search action -> Search.execute action config mode
  | Query action -> Query.execute action config mode
  | Show action -> Show.execute action config mode
  | Server action -> Server_command.execute action config mode
  | Sync action -> Sync.execute action config mode
  | Debug action -> Debug.execute action config mode
  | Doctor action -> Doctor.execute action config mode
  | Skill action -> Skill.execute action config mode
  | Completion action -> Completion.execute action config mode
  | Example action -> Example.execute action config mode
  | Auth action -> Auth_command.execute action config mode
  | Agent action -> Agent.execute action config mode

let requires_missing_graph = function
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
