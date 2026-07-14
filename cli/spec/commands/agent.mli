type parsed = Parsed_bridge

type action =
  | Agent_bridge of { repo : Cli_primitive.repo; graph : Cli_primitive.graph }

type routable_reason =
  | Missing_stable_uuid
  | Missing_task_tag
  | Not_todo
  | Assignee_mismatch
  | Already_routed

type routable_decision = Routable | Not_routable of routable_reason
type template_kind = Task | Comment

type prompt_template = {
  kind : template_kind;
  body : string;
  required_vars : string Rrbvec.t;
  allowed_vars : string Rrbvec.t;
}

type bridge_result = {
  mode : Cli_primitive.keyword;
  graph : Cli_primitive.graph;
  agent_name : string;
  routed : Melange_edn_melange.any Rrbvec.t;
}

include Command_spec.S with type parsed := parsed and type action := action

val resolve_agent_name :
  Cli_config.t -> string option -> string Error.build_result

val routable_task_decision : Entity.t -> agent_name:string -> routable_decision
val validate_prompt_template : prompt_template -> unit Error.build_result
