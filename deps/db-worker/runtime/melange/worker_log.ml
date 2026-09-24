type level =
  | Trace
  | Debug
  | Info
  | Warn
  | Error

let min_level_ref = ref Info
let set_min_level level = min_level_ref := level
let min_level () = !min_level_ref

let level_rank = function
  | Trace -> 0
  | Debug -> 1
  | Info -> 2
  | Warn -> 3
  | Error -> 4

type entry = {
  level : level;
  message : string;
  fields : (string * string) list;
  time_ms : float;
}

(* Rolling ring, cap 1000 like worker-state/*log. *)
let ring : entry Queue.t = Queue.create ()

let entries () = List.of_seq (Queue.to_seq ring)

let entry_sink = ref (fun _ -> ())
let set_entry_sink = function
  | Some f -> entry_sink := f
  | None -> entry_sink := (fun _ -> ())

let log level message fields =
  let entry =
    { level; message; fields; time_ms = Clock.now_ms () }
  in
  Queue.add entry ring;
  !entry_sink entry;
  (* cljs: (when (> (count @*log) 1000) (reset! *log (subvec @*log 800))) *)
  if Queue.length ring > 1000 then
    while Queue.length ring > 800 do
      ignore (Queue.pop ring)
    done;
  if level_rank level >= level_rank !min_level_ref then begin
    let fields_str =
      fields |> List.map (fun (k, v) -> k ^ "=" ^ v) |> String.concat " "
    in
    let line = if fields_str = "" then message else message ^ " " ^ fields_str in
    match level with
    | Trace | Debug -> Js.Console.log line
    | Info -> Js.Console.info line
    | Warn -> Js.Console.warn line
    | Error -> Js.Console.error line
  end

let trace m f = log Trace m f
let debug m f = log Debug m f
let info m f = log Info m f
let warn m f = log Warn m f
let error m f = log Error m f
