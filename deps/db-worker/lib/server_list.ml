(* logseq.db-worker.server-list — locked pid/port registry at
   <root>/server-list, guarded by <root>/server-list.lock. All fns
   take the server-list file path (not the root dir), like the cljs
   api. *)

module E = Db_worker_effect

type entry =
  { pid : int
  ; port : int
  }

type lock_metadata =
  { lock_pid : int
  ; lock_id : string
  ; created_at : string
  }

type lock =
  { file_path : string
  ; lock_path : string
  ; metadata : lock_metadata
  }

let write_lock_timeout_ms = 2000.
let write_lock_poll_interval_ms = 25

let path (root_dir : string) : string =
  if root_dir = "" then failwith "root-dir is required"
  else Filename.concat root_dir "server-list"

let lock_path (file_path : string) : string =
  if file_path = "" then failwith "server-list file path is required"
  else Filename.concat (Filename.dirname file_path) "server-list.lock"

let entry_re = Regexp.compile "(\\d+)\\s+(\\d+)"

(* parse-line — trimmed `re-matches` on "PID PORT", both positive. *)
let parse_line (line : string) : entry option =
  let trimmed = Unicode.trim line in
  match Regexp.exec entry_re trimmed with
  | Some m ->
      (match m.Regexp.groups.(1), m.Regexp.groups.(2) with
       | Some pid_s, Some port_s ->
           (match int_of_string_opt pid_s, int_of_string_opt port_s with
            | Some pid, Some port when pid > 0 && port > 0 ->
                Some { pid; port }
            | _ -> None)
       | _ -> None)
  | None -> None

let string_contains (s : string) (sub : string) : bool =
  let ls = String.length s and lsub = String.length sub in
  let rec go i =
    if lsub = 0 then true
    else if i + lsub > ls then false
    else if String.sub s i lsub = sub then true
    else go (i + 1)
  in
  go 0

(* read-entries — ENOENT -> [], other fs errors propagate. *)
let read_entries (file_path : string) : entry list E.t =
  if file_path = "" then E.pure []
  else
    E.catch
      (E.map
         (fun text ->
            String.split_on_char '\n' text |> List.filter_map parse_line)
         (File_sys.read_text file_path))
      (fun e ->
         let msg = Printexc.to_string e in
         if string_contains msg "ENOENT" then E.pure [] else E.error e)

let entry_key (e : entry) : int * int = (e.pid, e.port)

let valid_entry (e : entry) : bool = e.pid > 0 && e.port > 0

let normalize_entries (entries : entry list) : entry list =
  let rec go seen acc = function
    | [] -> List.rev acc
    | (e : entry) :: rest ->
        if valid_entry e && not (List.mem (entry_key e) seen) then
          go (entry_key e :: seen) (e :: acc) rest
        else go seen acc rest
  in
  go [] [] entries

let payload_for_entries (entries : entry list) : string =
  if entries = [] then ""
  else
    String.concat "\n"
      (List.map
         (fun (e : entry) -> Printf.sprintf "%d %d" e.pid e.port)
         entries)
    ^ "\n"

let process_status (pid : int) : Node_process.pid_status =
  Node_process.kill0 pid

(* ---- write lock ---- *)

let lock_metadata_json (m : lock_metadata) : string =
  Json.stringify
    (Wire.Map
       [ Wire.String "pid", Wire.Int m.lock_pid
       ; Wire.String "lock-id", Wire.String m.lock_id
       ; Wire.String "created-at", Wire.String m.created_at ])

type lock_info =
  { raw : string option
  ; metadata : lock_metadata option
  ; read_error : bool
  ; parse_error : bool
  }

let metadata_of_json (raw : string) : lock_metadata option =
  match (try Json.parse raw with _ -> Wire.Nil) with
  | Wire.Map kvs ->
      let get k = Wire.get k (Wire.Map kvs) in
      (match get "pid", get "lock-id" with
       | Some pid_w, Some (Wire.String lock_id) ->
           let pid =
             match pid_w with
             | Wire.Int n -> n
             | Wire.Float f -> int_of_float f
             | Wire.Int64 n -> Int64.to_int n
             | _ -> 0
           in
           if pid > 0 then
             Some
               { lock_pid = pid
               ; lock_id
               ; created_at =
                   (match get "created-at" with
                    | Some (Wire.String ts) -> ts
                    | _ -> "") }
           else None
       | _ -> None)
  | _ -> None

(* read-lock-metadata — nil on ENOENT, {:read-error} on other fs
   errors, {:raw :parse-error} on bad JSON, {:raw :metadata} on
   success. *)
let read_lock_metadata (lock_file : string) : lock_info option E.t =
  E.catch
    (E.map
       (fun raw ->
          let metadata = metadata_of_json raw in
          Some
            { raw = Some raw
            ; metadata
            ; read_error = false
            ; parse_error = (metadata = None) })
       (File_sys.read_text lock_file))
    (fun e ->
       if string_contains (Printexc.to_string e) "ENOENT" then
         E.pure None
       else
         E.pure
           (Some
              { raw = None
              ; metadata = None
              ; read_error = true
              ; parse_error = false }))

(* lock-stale? — recorded pid no longer exists. *)
let lock_stale (lock_info : lock_info option) : bool =
  match lock_info with
  | Some { metadata = Some m; _ } ->
      process_status m.lock_pid = Node_process.Not_found
  | _ -> false

let lock_timeout_exn (file_path : string) (lock_file : string)
    (lock_info : lock_info option) : exn =
  let kvs =
    [ Wire.Keyword "code", Wire.Keyword "server-list-lock-timeout"
    ; Wire.Keyword "file-path", Wire.String file_path
    ; Wire.Keyword "lock-path", Wire.String lock_file ]
  in
  let kvs =
    match lock_info with
    | Some { metadata = Some m; _ } ->
        kvs
        @ [ Wire.Keyword "lock-metadata"
          , Wire.Map
              [ Wire.Keyword "pid", Wire.Int m.lock_pid
              ; Wire.Keyword "lock-id", Wire.String m.lock_id
              ; Wire.Keyword "created-at", Wire.String m.created_at ] ]
    | _ -> kvs
  in
  let kvs =
    match lock_info with
    | Some { raw = Some raw; _ } ->
        kvs @ [ Wire.Keyword "lock-raw", Wire.String raw ]
    | _ -> kvs
  in
  Dispatcher.Exn_info
    ("Timed out acquiring server-list lock: " ^ lock_file, kvs)

let unlink_if_exists (file_path : string) : unit E.t =
  E.catch (File_sys.remove file_path) (fun e ->
      if string_contains (Printexc.to_string e) "ENOENT" then E.pure ()
      else E.error e)

(* acquire-write-lock! — openSync "wx" spin; EEXIST -> stale check +
   deadline check + sleep+retry; other errors propagate. *)
let acquire_write_lock (file_path : string) : lock E.t =
  E.bind (File_sys.mkdir_p (Filename.dirname file_path)) (fun () ->
      let lock_file = lock_path file_path in
      let deadline = Clock.now_ms () +. write_lock_timeout_ms in
      let rec try_lock () =
        let metadata =
          { lock_pid = Node_process.pid ()
          ; lock_id = Uuid_gen.uuid ()
          ; created_at = Clock.iso_string_ms (Clock.now_ms ()) }
        in
        E.catch
          (E.map
             (fun () -> { file_path; lock_path = lock_file; metadata })
             (File_sys.write_file_exclusive lock_file
                (lock_metadata_json metadata)))
          (fun e ->
             if string_contains (Printexc.to_string e) "EEXIST" then
               E.bind (read_lock_metadata lock_file) (fun lock_info ->
                   if lock_stale lock_info then
                     E.bind (unlink_if_exists lock_file) (fun () ->
                         retry_or_timeout lock_info ())
                   else retry_or_timeout lock_info ())
             else E.error e)
      and retry_or_timeout lock_info () =
        if Clock.now_ms () >= deadline then
          E.error (lock_timeout_exn file_path lock_file lock_info)
        else begin
          Node_process.sleep_sync_ms write_lock_poll_interval_ms;
          try_lock ()
        end
      in
      try_lock ())

(* release-write-lock! — removes the lock file only when the metadata
   it currently holds is still ours. *)
let release_write_lock (lock : lock) : unit E.t =
  E.bind (read_lock_metadata lock.lock_path) (fun lock_info ->
      match lock_info with
      | Some { metadata = Some m; _ }
        when m.lock_id = lock.metadata.lock_id ->
          unlink_if_exists lock.lock_path
      | _ -> E.pure ())

(* ---- locked updates ---- *)

let write_entries_unlocked (file_path : string) (entries : entry list) : unit E.t =
  let dir = Filename.dirname file_path in
  let tmp_file =
    Printf.sprintf "%s/server-list.%d.%s.tmp" dir (Node_process.pid ())
      (Uuid_gen.uuid ())
  in
  E.catch
    (E.bind
       (File_sys.write_text tmp_file (payload_for_entries entries))
       (fun () -> File_sys.rename tmp_file file_path))
    (fun e ->
       E.bind
         (E.catch (File_sys.remove tmp_file) (fun _ -> E.pure ()))
         (fun () -> E.error e))

let update_entries (file_path : string) (transform : entry list -> entry list)
    : unit E.t =
  if file_path = "" then E.pure ()
  else
    E.bind (acquire_write_lock file_path) (fun lock ->
        E.finally
          (E.bind (read_entries file_path) (fun entries ->
               write_entries_unlocked file_path
                 (normalize_entries (transform entries))))
          (fun () -> release_write_lock lock))

let rewrite_entries (file_path : string) (entries : entry list) : unit E.t =
  if file_path = "" then E.pure ()
  else update_entries file_path (fun _ -> entries)

let append_entry (file_path : string) ~(pid : int) ~(port : int) : unit E.t =
  if file_path = "" || pid <= 0 || port <= 0 then E.pure ()
  else
    update_entries file_path (fun entries -> entries @ [ { pid; port } ])

let remove_entry (file_path : string) ~(pid : int) ~(port : int) : unit E.t =
  if file_path = "" then E.pure ()
  else
    update_entries file_path (fun entries ->
        List.filter
          (fun (e : entry) -> not (e.pid = pid && e.port = port))
          entries)

let remove_entries (file_path : string) (to_remove : entry list) : unit E.t =
  if file_path = "" then E.pure ()
  else
    let keys = List.map entry_key (normalize_entries to_remove) in
    update_entries file_path (fun entries ->
        List.filter
          (fun (e : entry) -> not (List.mem (entry_key e) keys))
          entries)
