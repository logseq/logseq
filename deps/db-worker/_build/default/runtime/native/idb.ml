(* File-backed KV under LOGSEQ_WORKER_KV_DIR (default ./.worker-kv). *)
let dir () =
  match Runtime_env.env "LOGSEQ_WORKER_KV_DIR" with
  | Some d -> d
  | None -> "./.worker-kv"

let key_path key = Filename.concat (dir ()) key

let get key =
  Db_worker_effect.bind (File_sys.exists (key_path key)) (function
    | true -> Db_worker_effect.map Option.some (File_sys.read_text (key_path key))
    | false -> Db_worker_effect.pure None)

let set key value =
  Db_worker_effect.bind (File_sys.mkdir_p (dir ())) (fun () ->
      File_sys.write_text (key_path key) value)

let delete key =
  Db_worker_effect.bind (File_sys.exists (key_path key)) (function
    | true -> File_sys.remove (key_path key)
    | false -> Db_worker_effect.pure ())

let keys () = File_sys.readdir (dir ())
