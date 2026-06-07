(** Lightweight command assembly boundary. *)

type 'a term = 'a
type 'a cmd = { name : string; term : 'a term }
type 'a conv = (string -> ('a, [ `Msg of string ]) result) * (Format.formatter -> 'a -> unit)
type request_term = Cli_request.t term
type request_cmd = Cli_request.t cmd

type leaf = {
  meta : Command_registry.command_meta;
  term : request_term;
  cmd : request_cmd;
}

type group = {
  name : string;
  doc : string;
  meta : Command_registry.group_meta option;
  children : node list;
}

and node = Leaf of leaf | Group of group

type app = {
  root : request_cmd;
  registry : Command_registry.t;
  leaves : leaf list;
}

type eval_result =
  | Parsed of Cli_request.t
  | Help of string
  | Version of string
  | Parse_error of Error.t

val output_format_conv : Output.Mode.packed conv
val shell_conv : Cli_primitive.shell conv
val position_conv : Block.position conv
val keyword_conv : Cli_primitive.keyword conv
val uuid_conv : Cli_primitive.uuid conv
val global_opts_term : Global_opts.t term
val make_leaf : Command_registry.command_meta -> request_term -> leaf

val make_group :
  ?meta:Command_registry.group_meta ->
  name:string ->
  doc:string ->
  node list ->
  node

val flatten_leaves : node list -> leaf list
val make_app : ?version:string -> node list -> app

val eval :
  ?argv:string array -> ?env:Cli_config.env -> app -> eval_result Cli_effect.t
