type span = {
  stage : string;
  span_id : int;
  start_time : Ptime.t;
  end_time : Ptime.t;
  elapsed_span : Ptime.span;
}

type stage_summary = {
  stage : string;
  count : int;
  total_span : Ptime.span;
  avg_span : Ptime.span;
}

type session

type report = {
  command : string;
  status : Cli_primitive.keyword;
  total_span : Ptime.span;
  spans : span list;
  stages : stage_summary list;
}

val create_session : bool -> session option

val time :
  session option -> string -> (unit -> 'a Cli_effect.t) -> 'a Cli_effect.t

val record_span : session -> span -> unit
val report : session -> command:string -> status:Cli_primitive.keyword -> report
val render_lines : report -> string list
