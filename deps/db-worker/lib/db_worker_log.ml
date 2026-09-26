(* logseq.db-worker.log — the db-worker-node rolling file logger:
   per-repo-dir daily files under <storage.graphsDir>/<encoded-repo>/,
   stdio/console capture, 7-day retention. *)

module E = Db_worker_effect

type state =
  { file_path : string
  ; original_root_level : Worker_log.level
  ; untaps : (unit -> unit) list
  }

let installed : state option ref = ref None
let writing : bool ref = ref false

let pad2 (v : int) : string = if v < 10 then "0" ^ string_of_int v else string_of_int v

(* yyyymmdd — local calendar date (Date#getFullYear/Month/Date). *)
let yyyymmdd (t : Time.epoch_ms) : string =
  let year, month, day, _, _, _, _ =
    Time.civil_fields (Time.civil_of_epoch_ms (Time.local_tz ()) t)
  in
  Printf.sprintf "%04d%s%s" year (pad2 month) (pad2 day)

let resolve_root_dir (root_dir : string) : string =
  Root_dir.normalize_root_dir (Some root_dir)

let graphs_dir (root_dir : string) : string =
  Root_dir.graphs_dir (resolve_root_dir root_dir)

(* repo-dir — graphsDir + encoded repo dir name; throws
   {:code :missing-repo} on empty repo. *)
let repo_dir (root_dir : string) (repo : string) : string =
  if repo = "" then
    raise
      (Dispatcher.Exn_info
         ( "repo is required"
         , [ Wire.Keyword "code", Wire.Keyword "missing-repo" ] ));
  match Graph_dir.repo_to_encoded_graph_dir_name repo with
  | Some encoded -> Filename.concat (graphs_dir root_dir) encoded
  | None -> invalid_arg ("invalid repo: " ^ repo)

let log_path (root_dir : string) (repo : string) : string =
  Filename.concat
    (repo_dir root_dir repo)
    ("db-worker-node-" ^ yyyymmdd (Time.now ()) ^ ".log")

let log_file_re = Regexp.compile "db-worker-node-\\d{8}\\.log"

let log_files (graph_dir_path : string) : string list E.t =
  E.bind (File_sys.exists graph_dir_path) (fun exists ->
      if not exists then E.pure []
      else
        E.map
          (fun names ->
             List.sort compare
               (List.filter
                  (fun name -> Regexp.test log_file_re name)
                  names))
          (File_sys.readdir graph_dir_path))

(* enforce-retention! — keep the 7 most recent daily logs. *)
let enforce_retention (graph_dir_path : string) : unit E.t =
  E.bind (log_files graph_dir_path) (fun files ->
      let excess = max 0 (List.length files - 7) in
      let rec drop n = function
        | [] -> E.pure ()
        | _ :: rest when n <= 0 -> drop n rest
        | name :: rest ->
            E.bind
              (E.catch
                 (File_sys.remove (Filename.concat graph_dir_path name))
                 (fun _ -> E.pure ()))
              (fun () -> drop (n - 1) rest)
      in
      drop excess files)

(* ensure-log-file! — mkdir + touch (append "" creates the file) +
   retention; returns (repo-dir, file-path). *)
let ensure_log_file ~(storage : Graph_lifecycle.storage) ~(repo : string)
    : (string * string) E.t =
  let encoded =
    match Graph_dir.repo_to_encoded_graph_dir_name repo with
    | Some e -> e
    | None -> invalid_arg ("invalid repo: " ^ repo)
  in
  let graph_dir_path = Filename.concat storage.graphs_dir encoded in
  let file_path =
    Filename.concat graph_dir_path
      ("db-worker-node-" ^ yyyymmdd (Time.now ()) ^ ".log")
  in
  E.bind (File_sys.mkdir_p graph_dir_path) (fun () ->
      E.bind (File_sys.append_text file_path "") (fun () ->
          E.bind (enforce_retention graph_dir_path) (fun () ->
              E.pure (graph_dir_path, file_path))))

(* ---- formatting ---- *)

let pr_str (s : string) : string =
  let b = Buffer.create (String.length s + 2) in
  Buffer.add_char b '"';
  String.iter
    (fun c ->
       match c with
       | '"' -> Buffer.add_string b "\\\""
       | '\\' -> Buffer.add_string b "\\\\"
       | '\n' -> Buffer.add_string b "\\n"
       | c -> Buffer.add_char b c)
    s;
  Buffer.add_char b '"';
  Buffer.contents b

(* pr-str of the record's message: fields render as an EDN map
   {:k "v"} — values are strings here, so each renders pr-str-quoted
   like cljs glogi. *)
let fields_to_edn (fields : (string * string) list) : string =
  "{"
  ^ String.concat ", "
      (List.map (fun (k, v) -> ":" ^ k ^ " " ^ pr_str v) fields)
  ^ "}"

(* format-glogi-line — `ts [level] [logger] {:event {:fields}}`: cljs
   pr-str's the glogi record message, which is the event map itself. *)
let format_glogi_line (entry : Worker_log.entry) : string =
  let ts = Time.iso_string_of_epoch_ms (Time.epoch_ms_of_float entry.time_ms) in
  let level =
    match entry.level with
    | Worker_log.Trace -> "trace"
    | Debug -> "debug"
    | Info -> "info"
    | Warn -> "warn"
    | Error -> "error"
  in
  let event =
    if entry.fields = [] then Printf.sprintf "{:%s}" entry.message
    else Printf.sprintf "{:%s %s}" entry.message (fields_to_edn entry.fields)
  in
  Printf.sprintf "%s [%s] [logseq.db-worker-node] %s\n" ts level event

(* append-lines! — split text into lines and append each as
   `iso [stdio] [source] line`; guarded by *writing?. *)
let append_lines (file_path : string) (source : string) (text : string) : unit =
  if not !writing then begin
    writing := true;
    (try
       let text = Regexp.replace_all
           (Regexp.compile "\\r\\n?")
           ~f:(fun ~match_:_ ~groups:_ ~offset:_ ~input:_ -> "\n")
           text
       in
       let text =
         Regexp.replace_all (Regexp.compile "\\n$")
           ~f:(fun ~match_:_ ~groups:_ ~offset:_ ~input:_ -> "")
           text
       in
       let lines =
         if Unicode.trim text = "" then [ "" ]
         else String.split_on_char '\n' text
       in
       List.iter
         (fun line ->
            let chunk =
              Printf.sprintf "%s [stdio] [%s] %s\n"
                (Time.iso_string_of_epoch_ms (Time.now ()))
                source line
            in
            E.async (fun () ->
                E.catch (File_sys.append_text file_path chunk)
                  (fun _ -> E.pure ())))
         lines
     with _ -> ());
    writing := false
  end

(* cljs *forwarding? — set while a wrapped stream/console fn calls its
   original. With Node_console.tap_stdio the original runs inside the
   tap; appends only need the *writing? guard, but the flag stays for
   parity with the cljs state machine. *)
let forwarding : bool ref = ref false

(* uninstall! — drop the log sink, restore stdio taps and the saved
   root log level. *)
let uninstall () : unit =
  match !installed with
  | None -> ()
  | Some state ->
      Worker_log.set_entry_sink None;
      List.iter (fun untap -> untap ()) state.untaps;
      Worker_log.set_min_level state.original_root_level;
      installed := None

let level_of_string (s : string) : Worker_log.level =
  match s with
  | "trace" -> Worker_log.Trace
  | "debug" -> Debug
  | "info" -> Info
  | "warn" | "warning" -> Warn
  | "error" -> Error
  | _ -> Info

(* install! — resolve storage, ensure today's log file, attach the
   glogi-equivalent sink, tap stdio, and set the root level. Returns
   the file path. *)
let install ~(root_dir : string) ~(storage : Graph_lifecycle.storage option)
    ~(repo : string) ~(log_level : string option) : string E.t =
  uninstall ();
  let storage =
    match storage with
    | Some s -> s
    | None -> Graph_lifecycle.resolve_storage ~root:root_dir ~graphs_dir:(graphs_dir root_dir)
  in
  E.bind (ensure_log_file ~storage ~repo) (fun (_repo_dir, file_path) ->
      let original_root_level = Worker_log.min_level () in
      Worker_log.set_entry_sink
        (Some
           (fun entry ->
              if (not !forwarding) && not !writing then
                E.async (fun () ->
                    E.catch
                      (File_sys.append_text file_path
                         (format_glogi_line entry))
                      (fun _ -> E.pure ()))));
      let untaps =
        [ Node_console.tap_stdio
            (fun ~source ~text -> append_lines file_path source text) ]
      in
      Worker_log.set_min_level
        (match log_level with
         | Some l -> level_of_string l
         | None -> Info);
      installed :=
        Some
          { file_path
          ; original_root_level
          ; untaps };
      E.pure file_path)
