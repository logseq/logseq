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
  mutable spans : span Rrbvec.t;
  mutable next_span_id : int;
}

type report = {
  command : string;
  status : Cli_primitive.keyword;
  total_span : float;
  spans : span Rrbvec.t;
  stages : stage_summary Rrbvec.t;
}

let create_session enabled =
  if enabled then
    Some
      { enabled; start_time = Time.now (); spans = Vec.empty; next_span_id = 0 }
  else None

let next_span_id session =
  session.next_span_id <- session.next_span_id + 1;
  session.next_span_id

let record_span (s : session) span = s.spans <- Vec.push_back s.spans span

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
  let order = ref Vec.empty in
  Vec.iter
    (fun (span : span) ->
      if not (Hashtbl.mem table span.stage) then
        order := Vec.push_back !order span.stage;
      let count, total_span =
        Option.value
          (Hashtbl.find_opt table span.stage)
          ~default:(0, Time.zero_span)
      in
      Hashtbl.replace table span.stage
        (count + 1, Time.add_span_value total_span span.elapsed_span))
    spans;
  Vec.map
    (fun stage ->
      let count, total_span = Hashtbl.find table stage in
      { stage; count; total_span; avg_span = Time.avg_span total_span count })
    !order

let report (s : session) ~command ~status =
  let end_time = Time.now () in
  let total_span = Time.non_negative_diff ~start_time:s.start_time ~end_time in
  let spans : span Rrbvec.t = s.spans in
  let spans =
    if Vec.exists (fun (span : span) -> span.stage = "cli.total") spans then
      spans
    else
      Vec.push_back spans
        {
          stage = "cli.total";
          span_id = 0;
          start_time = s.start_time;
          end_time;
          elapsed_span = total_span;
        }
  in
  { command; status; total_span; spans; stages = summarize_stages spans }

type stage_node = {
  label : string;
  elapsed_span : float;
  start_time : Js.Date.t;
  end_time : Js.Date.t;
  mutable children : stage_node Rrbvec.t;
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
    children = Vec.empty;
  }

let sort_spans spans =
  Vec.sort
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
  let roots = ref Vec.empty in
  let stack = ref Vec.empty in
  let rec trim_stack span items =
    match Vec.pop_front items with
    | Some (parent, rest) when not (span_contains parent span) ->
        trim_stack span rest
    | _ -> items
  in
  Vec.iter
    (fun span ->
      let node = node_of_span span in
      let current_stack = trim_stack node !stack in
      (match Vec.peek_front current_stack with
      | Some parent -> parent.children <- Vec.push_back parent.children node
      | None -> roots := Vec.push_back !roots node);
      stack := Vec.push_front current_stack node)
    (sort_spans spans);
  !roots

let status_text status =
  let status = Edn_util.keyword_to_string status in
  if String.length status > 0 && status.[0] = ':' then
    String.sub status 1 (String.length status - 1)
  else status

let rec collect_rows prefix rows = function
  | nodes when Vec.is_empty nodes -> rows
  | nodes ->
      let total = Vec.length nodes in
      Vec.mapi (fun idx node -> (idx, node)) nodes
      |> Vec.fold_left
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
               Vec.push_back rows
                 (Some node.elapsed_span, prefix ^ branch ^ node.label)
             in
             collect_rows next_prefix rows node.children)
           rows

let pad_right value width =
  let padding = max 0 (width - String.length value) in
  value ^ String.make padding ' '

let render_lines report =
  let rows =
    Vec.of_array
      [|
        ( Some report.total_span,
          "command=" ^ report.command ^ " status=" ^ status_text report.status
        );
        (None, "stages");
      |]
    |> fun rows -> collect_rows "" rows (build_stage_tree report.spans)
  in
  let duration_text =
    Vec.map
      (function
        | Some span, _ -> Int64.to_string (Time.span_to_ms span) ^ "ms"
        | None, _ -> "")
      rows
  in
  let width =
    Vec.fold_left
      (fun width text -> max width (String.length text))
      0 duration_text
  in
  Vec.map2
    (fun duration (_, text) -> pad_right duration width ^ " " ^ text)
    duration_text rows
