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

val build : Cli_config.t -> Cli_request.t -> t Error.build_result Cli_effect.t

val execute :
  t -> Cli_config.t -> 'o Output.Mode.t -> 'o Cli_result.t Cli_effect.t

val requires_missing_graph : t -> bool
val repo : t -> Cli_primitive.repo option
val graph : t -> Cli_primitive.graph option
