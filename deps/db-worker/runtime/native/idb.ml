(* cljs platform/node.cljs kv-store: a single transit-json map at
   <LOGSEQ_WORKER_KV_DIR>/kv-store.json — the same file the node daemon
   writes. Byte-compatible: string values stay strings; binaries use
   cljs's custom {"~#uint8array":[byte ints]} tag. *)

let kv_path () =
  let dir =
    match Runtime_env.env "LOGSEQ_WORKER_KV_DIR" with
    | Some d -> d
    | None -> "./.worker-kv"
  in
  Filename.concat dir "kv-store.json"

let kv_state : (string * Wire.t) list option ref = ref None

let load_kv () =
  match !kv_state with
  | Some m -> Db_worker_effect.pure m
  | None ->
      Db_worker_effect.catch
        (Db_worker_effect.bind (File_sys.read_text (kv_path ()))
           (fun text ->
             let m =
               match Transit_codec.of_string text with
               | Wire.Map kvs ->
                   List.filter_map
                     (fun (k, v) ->
                       match Wire.as_string k with
                       | Some ks -> Some (ks, v)
                       | None -> None)
                     kvs
               | _ -> []
             in
             kv_state := Some m;
             Db_worker_effect.pure m))
        (fun _exn ->
          kv_state := Some [];
          Db_worker_effect.pure [])

let write_kv key value_opt =
  Db_worker_effect.bind (load_kv ()) (fun m ->
      let m =
        match value_opt with
        | Some v -> (key, v) :: List.remove_assoc key m
        | None -> List.remove_assoc key m
      in
      kv_state := Some m;
      let wire = Wire.Map (List.map (fun (k, v) -> Wire.String k, v) m) in
      Db_worker_effect.bind
        (File_sys.mkdir_p (Filename.dirname (kv_path ())))
        (fun () ->
          File_sys.write_text (kv_path ()) (Transit_codec.to_string wire)))

let get key =
  Db_worker_effect.map
    (fun m ->
      match List.assoc_opt key m with
      | Some v -> Wire.as_string v
      | None -> None)
    (load_kv ())

let set key value = write_kv key (Some (Wire.String value))
let delete key = write_kv key None
let keys () = Db_worker_effect.map (fun m -> List.map fst m) (load_kv ())

(* cljs idb/init! — no-op on file stores. *)
let init () = Db_worker_effect.pure ()

(* cljs kv-transit-writer "uint8array" handler — Uint8Array <-> vector
   of byte ints under a custom transit tag. *)
let uint8array_tag = "uint8array"

let get_binary key =
  Db_worker_effect.map
    (fun m ->
      match List.assoc_opt key m with
      | Some (Wire.Binary s) -> Some s
      | Some (Wire.Tagged (tag, Wire.Array xs)) when tag = uint8array_tag ->
          Some
            (String.concat ""
               (List.filter_map
                  (fun w ->
                    match w with
                    | Wire.Int n -> Some (String.make 1 (Char.chr n))
                    | Wire.Int64 n -> Some (String.make 1 (Char.chr (Int64.to_int n)))
                    | Wire.Float f -> Some (String.make 1 (Char.chr (int_of_float f)))
                    | _ -> None)
                  xs))
      | _ -> None)
    (load_kv ())

let set_binary key value =
  write_kv key
    (Some
       (Wire.Tagged
          ( uint8array_tag
          , Wire.Array
              (List.init (String.length value)
                 (fun i -> Wire.Int (Char.code value.[i]))) )))
