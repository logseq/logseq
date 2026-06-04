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

type session = {
  enabled : bool;
  started_ms : Cli_primitive.timestamp_ms;
  mutable spans : span list;
  mutable next_span_id : int;
}

type report = {
  command : string;
  status : Cli_primitive.keyword;
  total_ms : Cli_primitive.duration_ms;
  spans : span list;
  stages : stage_summary list;
}

let now_ms () = Int64.of_float (Cli_unix.gettimeofday () *. 1000.)

let create_session enabled =
  if enabled then
    Some { enabled; started_ms = now_ms (); spans = []; next_span_id = 0 }
  else None

let next_span_id session =
  session.next_span_id <- session.next_span_id + 1;
  session.next_span_id

let record_span (s : session) span = s.spans <- span :: s.spans

let record_timed_span session stage span_id started_ms ended_ms =
  let elapsed_ms = Int64.max 0L (Int64.sub ended_ms started_ms) in
  record_span session { stage; span_id; started_ms; ended_ms; elapsed_ms }

let time session stage f =
  match session with
  | None -> f ()
  | Some session -> (
      let started_ms = now_ms () in
      let span_id = next_span_id session in
      let finish () =
        record_timed_span session stage span_id started_ms (now_ms ());
        Cli_effect.pure ()
      in
      try Cli_effect.finally (f ()) finish
      with exn ->
        record_timed_span session stage span_id started_ms (now_ms ());
        raise exn)

let summarize_stages spans =
  let table = Hashtbl.create 16 in
  let order = ref [] in
  List.iter
    (fun (span : span) ->
      if not (Hashtbl.mem table span.stage) then order := span.stage :: !order;
      let count, total_ms =
        Option.value (Hashtbl.find_opt table span.stage) ~default:(0, 0L)
      in
      Hashtbl.replace table span.stage
        (count + 1, Int64.add total_ms span.elapsed_ms))
    spans;
  List.rev !order
  |> List.map (fun stage ->
      let count, total_ms = Hashtbl.find table stage in
      {
        stage;
        count;
        total_ms;
        avg_ms =
          (if count > 0 then Int64.div total_ms (Int64.of_int count) else 0L);
      })

let report (s : session) ~command ~status =
  let ended_ms = now_ms () in
  let total_ms = Int64.max 0L (Int64.sub ended_ms s.started_ms) in
  let spans : span list = List.rev s.spans in
  let spans =
    if List.exists (fun (span : span) -> span.stage = "cli.total") spans then
      spans
    else
      spans
      @ [
          {
            stage = "cli.total";
            span_id = 0;
            started_ms = s.started_ms;
            ended_ms;
            elapsed_ms = total_ms;
          };
        ]
  in
  { command; status; total_ms; spans; stages = summarize_stages spans }

type stage_node = {
  label : string;
  elapsed_ms : int64;
  started_ms : int64;
  ended_ms : int64;
  mutable children : stage_node list;
}

let span_contains outer inner =
  outer.started_ms <= inner.started_ms && outer.ended_ms >= inner.ended_ms

let node_of_span (span : span) =
  {
    label = span.stage;
    elapsed_ms = span.elapsed_ms;
    started_ms = span.started_ms;
    ended_ms = span.ended_ms;
    children = [];
  }

let sort_spans spans =
  List.sort
    (fun (left : span) (right : span) ->
      let duration_left =
        Int64.max 0L (Int64.sub left.ended_ms left.started_ms)
      in
      let duration_right =
        Int64.max 0L (Int64.sub right.ended_ms right.started_ms)
      in
      match Int64.compare left.started_ms right.started_ms with
      | 0 -> (
          match Int64.compare duration_right duration_left with
          | 0 -> compare left.span_id right.span_id
          | value -> value)
      | value -> value)
    spans

let build_stage_tree spans =
  let roots = ref [] in
  let stack = ref [] in
  let rec trim_stack span = function
    | parent :: rest when not (span_contains parent span) ->
        trim_stack span rest
    | items -> items
  in
  List.iter
    (fun span ->
      let node = node_of_span span in
      let current_stack = trim_stack node !stack in
      (match current_stack with
      | parent :: _ -> parent.children <- parent.children @ [ node ]
      | [] -> roots := !roots @ [ node ]);
      stack := node :: current_stack)
    (sort_spans spans);
  !roots

let status_text status =
  let status = Edn_util.keyword_to_string status in
  if String.length status > 0 && status.[0] = ':' then
    String.sub status 1 (String.length status - 1)
  else status

let rec collect_rows prefix rows = function
  | [] -> rows
  | nodes ->
      let total = List.length nodes in
      List.mapi (fun idx node -> (idx, node)) nodes
      |> List.fold_left
           (fun rows (idx, node) ->
             let last = idx = total - 1 in
             let branch = if last then "└── " else "├── " in
             let next_prefix = prefix ^ if last then "    " else "│   " in
             let rows =
               rows @ [ (Some node.elapsed_ms, prefix ^ branch ^ node.label) ]
             in
             collect_rows next_prefix rows node.children)
           rows

let pad_right value width =
  let padding = max 0 (width - String.length value) in
  value ^ String.make padding ' '

let render_lines report =
  let rows =
    [
      ( Some report.total_ms,
        "command=" ^ report.command ^ " status=" ^ status_text report.status );
      (None, "stages");
    ]
    @ collect_rows "" [] (build_stage_tree report.spans)
  in
  let duration_text =
    List.map
      (function Some ms, _ -> Int64.to_string ms ^ "ms" | None, _ -> "")
      rows
  in
  let width =
    List.fold_left
      (fun width text -> max width (String.length text))
      0 duration_text
  in
  List.map2
    (fun duration (_, text) -> pad_right duration width ^ " " ^ text)
    duration_text rows
