type span = {
  stage : string;
  span_id : int;
  start_time : Js.Date.t;
  end_time : Js.Date.t;
  elapsed_span : float;
}

type stage_summary = {
  stage : string;
  count : int;
  total_span : float;
  avg_span : float;
}

type session = {
  enabled : bool;
  start_time : Js.Date.t;
  mutable spans : span list;
  mutable next_span_id : int;
}

type report = {
  command : string;
  status : Cli_primitive.keyword;
  total_span : float;
  spans : span list;
  stages : stage_summary list;
}

let create_session enabled =
  if enabled then
    Some { enabled; start_time = Time.now (); spans = []; next_span_id = 0 }
  else None

let next_span_id session =
  session.next_span_id <- session.next_span_id + 1;
  session.next_span_id

let record_span (s : session) span = s.spans <- span :: s.spans

let record_timed_span session stage span_id start_time end_time =
  let elapsed_span = Time.non_negative_diff ~start_time ~end_time in
  record_span session { stage; span_id; start_time; end_time; elapsed_span }

let time session stage f =
  match session with
  | None -> f ()
  | Some session -> (
      let start_time = Time.now () in
      let span_id = next_span_id session in
      let finish () =
        record_timed_span session stage span_id start_time (Time.now ());
        Cli_effect.pure ()
      in
      try Cli_effect.finally (f ()) finish
      with exn ->
        record_timed_span session stage span_id start_time (Time.now ());
        raise exn)

let summarize_stages spans =
  let table = Hashtbl.create 16 in
  let order = ref [] in
  List.iter
    (fun (span : span) ->
      if not (Hashtbl.mem table span.stage) then order := span.stage :: !order;
      let count, total_span =
        Option.value
          (Hashtbl.find_opt table span.stage)
          ~default:(0, Time.zero_span)
      in
      Hashtbl.replace table span.stage
        (count + 1, Time.add_span_value total_span span.elapsed_span))
    spans;
  List.rev !order
  |> List.map (fun stage ->
      let count, total_span = Hashtbl.find table stage in
      { stage; count; total_span; avg_span = Time.avg_span total_span count })

let report (s : session) ~command ~status =
  let end_time = Time.now () in
  let total_span = Time.non_negative_diff ~start_time:s.start_time ~end_time in
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
            start_time = s.start_time;
            end_time;
            elapsed_span = total_span;
          };
        ]
  in
  { command; status; total_span; spans; stages = summarize_stages spans }

type stage_node = {
  label : string;
  elapsed_span : float;
  start_time : Js.Date.t;
  end_time : Js.Date.t;
  mutable children : stage_node list;
}

let span_contains outer inner =
  Time.compare_time outer.start_time inner.start_time <= 0
  && Time.compare_time outer.end_time inner.end_time >= 0

let node_of_span (span : span) =
  {
    label = span.stage;
    elapsed_span = span.elapsed_span;
    start_time = span.start_time;
    end_time = span.end_time;
    children = [];
  }

let sort_spans spans =
  List.sort
    (fun (left : span) (right : span) ->
      let duration_left = left.elapsed_span in
      let duration_right = right.elapsed_span in
      match Time.compare_time left.start_time right.start_time with
      | 0 -> (
          match Time.compare_span duration_right duration_left with
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
             let branch =
               if last then Cli_platform.Symbols.tree_last
               else Cli_platform.Symbols.tree_middle
             in
             let next_prefix =
               prefix ^ if last then "    " else Cli_platform.Symbols.tree_pipe
             in
             let rows =
               rows @ [ (Some node.elapsed_span, prefix ^ branch ^ node.label) ]
             in
             collect_rows next_prefix rows node.children)
           rows

let pad_right value width =
  let padding = max 0 (width - String.length value) in
  value ^ String.make padding ' '

let render_lines report =
  let rows =
    [
      ( Some report.total_span,
        "command=" ^ report.command ^ " status=" ^ status_text report.status );
      (None, "stages");
    ]
    @ collect_rows "" [] (build_stage_tree report.spans)
  in
  let duration_text =
    List.map
      (function
        | Some span, _ -> Int64.to_string (Time.span_to_ms span) ^ "ms"
        | None, _ -> "")
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
