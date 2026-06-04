type span = {
  stage : string;
  span_id : int;
  started_ms : Cli_primitive.timestamp_ms;
  ended_ms : Cli_primitive.timestamp_ms;
  elapsed_ms : Cli_primitive.duration_ms;
}

type stage_summary = {
  stage : string;
  count : int;
  total_ms : Cli_primitive.duration_ms;
  avg_ms : Cli_primitive.duration_ms;
}

type session

type report = {
  command : string;
  status : Cli_primitive.keyword;
  total_ms : Cli_primitive.duration_ms;
  spans : span list;
  stages : stage_summary list;
}

val create_session : bool -> session option

val time :
  session option -> string -> (unit -> 'a Cli_effect.t) -> 'a Cli_effect.t

val record_span : session -> span -> unit
val report : session -> command:string -> status:Cli_primitive.keyword -> report
val render_lines : report -> string list
