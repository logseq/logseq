type span = {
  stage : string;
  span_id : int;
  start_time : Time.date;
  end_time : Time.date;
  elapsed_span : Time.span;
}

type stage_summary = {
  stage : string;
  count : int;
  total_span : Time.span;
  avg_span : Time.span;
}

type session

type report = {
  command : string;
  status : Cli_primitive.keyword;
  total_span : Time.span;
  spans : span Rrbvec.t;
  stages : stage_summary Rrbvec.t;
}

val create_session : bool -> session option

val time :
  session option -> string -> (unit -> 'a Cli_effect.t) -> 'a Cli_effect.t

val record_span : session -> span -> unit
val report : session -> command:string -> status:Cli_primitive.keyword -> report
val render_lines : report -> string Rrbvec.t
