(* logseq.graph-parser.import-profile — import profiling + watchdog. *)

open Datascript

let now_ms () : float = Clock.now_ms ()

let elapsed_ms (start_ms : float) : float = now_ms () -. start_ms

(* import-profile/log-phase! *)
let log_phase (log_fn : (string -> (attr * value) list -> unit) option)
    (phase : string) (start_ms : float)
    ?(extra : (attr * value) list option) () =
  match log_fn with
  | Some f ->
    f "import-profile"
      ([ "phase", String phase; "ms", Float (elapsed_ms start_ms) ]
       @ Option.value ~default:[] extra)
  | None -> ()

type watchdog_state =
  { mutable start_ms : float
  ; mutable step : string
  ; mutable phase : string option
  ; mutable file : string option
  ; mutable file_idx : int option
  ; mutable total_files : int option
  ; mutable timer_id : Timers.timer option }

type watchdog =
  { timeout_ms : int
  ; heartbeat_ms : int
  ; log_fn : string -> (attr * value) list -> unit
  ; state : watchdog_state }

let new_watchdog ?(timeout_ms = 30000) ?(heartbeat_ms = 5000)
    ?(log_fn = fun _ _ -> ()) () : watchdog =
  { timeout_ms
  ; heartbeat_ms
  ; log_fn
  ; state =
      { start_ms = now_ms ()
      ; step = "init"
      ; phase = None
      ; file = None
      ; file_idx = None
      ; total_files = None
      ; timer_id = None } }

let snapshot (w : watchdog) : (attr * value) list =
  let s = w.state in
  [ "elapsed-ms", Float (elapsed_ms s.start_ms)
  ; "step", String (if s.step = "" then "unknown" else s.step)
  ; "phase", (match s.phase with Some p -> String p | None -> Nil)
  ; "file", (match s.file with Some f -> String f | None -> Nil)
  ; "file-idx", (match s.file_idx with Some i -> Int i | None -> Nil)
  ; "total-files", (match s.total_files with Some t -> Int t | None -> Nil) ]

let update_watchdog (w : watchdog) (m : (string * value) list) : unit =
  List.iter
    (fun (k, v) ->
      match k, v with
      | "step", String s -> w.state.step <- s
      | "phase", String s -> w.state.phase <- Some s
      | "phase", Nil -> w.state.phase <- None
      | "file", String s -> w.state.file <- Some s
      | "file", Nil -> w.state.file <- None
      | "file-idx", Int i -> w.state.file_idx <- Some i
      | "file-idx", Nil -> w.state.file_idx <- None
      | "total-files", Int i -> w.state.total_files <- Some i
      | "total-files", Nil -> w.state.total_files <- None
      | _ -> ())
    m

(* import-profile/set-import-progress! — options is the importer options map *)
let set_import_progress (watchdog : watchdog option) (m : (string * value) list)
    : unit =
  match watchdog with
  | Some w -> update_watchdog w m
  | None -> ()

let log_watchdog_event (w : watchdog) (event : string)
    (extra : (attr * value) list) : unit =
  w.log_fn event (snapshot w @ extra)

let start_watchdog (w : watchdog) : unit =
  match w.state.timer_id with
  | Some _ -> ()
  | None ->
    let t =
      Timers.set_interval w.heartbeat_ms
        (fun () -> log_watchdog_event w "import-heartbeat" [])
    in
    w.state.timer_id <- Some t

let stop_watchdog (w : watchdog) : unit =
  match w.state.timer_id with
  | Some t ->
    Timers.clear t;
    w.state.timer_id <- None
  | None -> ()
