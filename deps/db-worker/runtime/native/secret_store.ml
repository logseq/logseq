(* Transit-encoded {key: text} map under the worker kv dir — same
   kv-store.json format the node daemon uses as its keychain fallback.

   The OS keychain (keytar) is a Node-specific binding; the native
   worker stores secrets through this kv file on every owner, which
   matches the node.cljs CLI_E2E_TEST code path. *)

let kv_path () =
  let dir =
    match Runtime_env.env "LOGSEQ_WORKER_KV_DIR" with
    | Some d -> d
    | None -> "./.worker-kv"
  in
  Filename.concat dir "kv-store.json"

let kv_state : (string * string option) list option ref = ref None

let load_kv () =
  match !kv_state with
  | Some m -> Db_worker_effect.pure m
  | None ->
      Db_worker_effect.catch
        (Db_worker_effect.bind (File_sys.read_text (kv_path ())) (fun text ->
             let m =
               match Transit_codec.of_string text with
               | Wire.Map kvs ->
                   List.filter_map
                     (fun (k, v) ->
                       match Wire.as_string k with
                       | Some ks -> Some (ks, Wire.as_string v)
                       | None -> None)
                     kvs
               | _ -> []
             in
             kv_state := Some m;
             Db_worker_effect.pure m))
        (fun _exn ->
          kv_state := Some [];
          Db_worker_effect.pure [])

let write_kv key value =
  Db_worker_effect.bind (load_kv ()) (fun m ->
      let m = (key, value) :: List.remove_assoc key m in
      kv_state := Some m;
      let wire =
        Wire.Map
          (List.map
             (fun (k, v) ->
               ( Wire.String k
               , match v with Some s -> Wire.String s | None -> Wire.Nil ))
             m)
      in
      Db_worker_effect.bind (File_sys.mkdir_p (Filename.dirname (kv_path ())))
        (fun () -> File_sys.write_text (kv_path ()) (Transit_codec.to_string wire)))

let save ~key text = write_kv key (Some text)

let read ~key =
  Db_worker_effect.map
    (fun m -> match List.assoc_opt key m with Some v -> v | None -> None)
    (load_kv ())

let delete ~key = write_kv key None
