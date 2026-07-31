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
  path : string Rrbvec.t;
  command : parsed_command;
  raw_args : string Rrbvec.t;
}

let make ~globals ~path ~command ~raw_args =
  { globals; path; command; raw_args }

let command_id t =
  match t.command with
  | Version -> Command_id.Version
  | Graph p -> Graph.command_id p
  | List p -> List_command.command_id p
  | Upsert p -> Upsert.command_id p
  | Remove p -> Remove.command_id p
  | Search p -> Search.command_id p
  | Query p -> Query.command_id p
  | Show p -> Show.command_id p
  | Server p -> Server_command.command_id p
  | Sync p -> Sync.command_id p
  | Auth p -> Auth_command.command_id p
  | Agent p -> Agent.command_id p
  | Doctor p -> Doctor.command_id p
  | Debug p -> Debug.command_id p
  | Skill p -> Skill.command_id p
  | Completion p -> Completion.command_id p
  | Example p -> Example.command_id p
