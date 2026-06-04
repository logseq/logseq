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

let command_id = function
  | Version -> Command_id.Version
  | Graph action -> (
      match action with
      | Graph.Graph_list -> Graph_list
      | Graph_create _ -> Graph_create
      | Graph_switch _ -> Graph_switch
      | Graph_remove _ -> Graph_remove
      | Graph_validate _ -> Graph_validate
      | Graph_info _ -> Graph_info
      | Graph_backup_list _ -> Graph_backup_list
      | Graph_backup_create _ -> Graph_backup_create
      | Graph_backup_restore _ -> Graph_backup_restore
      | Graph_backup_remove _ -> Graph_backup_remove
      | Graph_export _ -> Graph_export
      | Graph_import _ -> Graph_import)
  | List action -> action.List_command.command
  | Upsert action -> (
      match action with
      | Upsert.Upsert_block _ -> Upsert_block
      | Upsert_page _ -> Upsert_page
      | Upsert_task _ -> Upsert_task
      | Upsert_asset _ -> Upsert_asset
      | Upsert_tag _ -> Upsert_tag
      | Upsert_property _ -> Upsert_property)
  | Remove _ -> Remove_block
  | Search action -> action.Search.command
  | Query _ -> Query
  | Show _ -> Show
  | Server action -> (
      match action with
      | Server_command.Server_list -> Server_list
      | Server_cleanup -> Server_cleanup
      | Server_start _ -> Server_start
      | Server_stop _ -> Server_stop
      | Server_restart _ -> Server_restart)
  | Sync action -> (
      match action with
      | Sync.Sync_status _ -> Sync_status
      | Sync_start _ -> Sync_start
      | Sync_stop _ -> Sync_stop
      | Sync_upload _ -> Sync_upload
      | Sync_download _ -> Sync_download
      | Sync_asset_download _ -> Sync_asset_download
      | Sync_remote_graphs -> Sync_remote_graphs
      | Sync_ensure_keys _ -> Sync_ensure_keys
      | Sync_grant_access _ -> Sync_grant_access
      | Sync_config_get _ -> Sync_config_get
      | Sync_config_set _ -> Sync_config_set
      | Sync_config_unset _ -> Sync_config_unset)
  | Auth Auth_command.Login -> Login
  | Auth Logout -> Logout
  | Agent _ -> Agent_bridge
  | Doctor _ -> Doctor
  | Debug _ -> Debug_pull
  | Skill (Skill.Skill_show _) -> Skill_show
  | Skill (Skill.Skill_install _) -> Skill_install
  | Completion _ -> Completion
  | Example _ -> Example

let context _ = Edn_util.map_t []

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

let requires_existing_graph _ = false

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
