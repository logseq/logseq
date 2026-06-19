type parsed_command =
  | Version
  | Graph of Graph.parsed
  | List of List_command.parsed
  | Upsert of Upsert.parsed
  | Remove of Remove.parsed
  | Search of Search.parsed
  | Query of Query.parsed
  | Show of Show.parsed
  | Server of Server_command.parsed
  | Sync of Sync.parsed
  | Auth of Auth_command.parsed
  | Agent of Agent.parsed
  | Doctor of Doctor.parsed
  | Debug of Debug.parsed
  | Skill of Skill.parsed
  | Completion of Completion.parsed
  | Example of Example.parsed

type t = {
  globals : Global_opts.t;
  path : string list;
  command : parsed_command;
  raw_args : string list;
}

val make :
  globals:Global_opts.t ->
  path:string list ->
  command:parsed_command ->
  raw_args:string list ->
  t

val command_id : t -> Command_id.t
