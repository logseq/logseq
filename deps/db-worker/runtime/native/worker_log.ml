type level =
  | Trace
  | Debug
  | Info
  | Warn
  | Error

let min_level = ref Info
let set_min_level level = min_level := level

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

let log level message fields =
  let entry =
    { level; message; fields; time_ms = Clock.now_ms () }
  in
  Queue.add entry ring;
  while Queue.length ring > 1000 do
    ignore (Queue.pop ring)
  done;
  if level_rank level >= level_rank !min_level then begin
    let fields_str =
      fields |> List.map (fun (k, v) -> k ^ "=" ^ v) |> String.concat " "
    in
    if fields_str = "" then Printf.eprintf "%s\n%!" message
    else Printf.eprintf "%s %s\n%!" message fields_str
  end

let trace m f = log Trace m f
let debug m f = log Debug m f
let info m f = log Info m f
let warn m f = log Warn m f
let error m f = log Error m f
