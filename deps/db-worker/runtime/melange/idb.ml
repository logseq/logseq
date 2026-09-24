(* cljs frontend.common.idb / idbkv: browser workers keep KV in
   IndexedDB — db "localforage" version 2, store "keyvaluepairs",
   values are structured-clone JS values (strings / Uint8Array).
   Node keeps a transit-encoded {key value} map in
   <LOGSEQ_WORKER_KV_DIR>/kv-store.json (platform/node.cljs kv-store). *)

(* ---------- IndexedDB (browser) ---------- *)

module Idb_db = struct
  type idb
  type db
  type tx
  type store
  type request
  type idb_error
  type event

  external indexed_db : idb Js.Undefined.t = "indexedDB"
    [@@mel.scope "globalThis"]

  external open_ : idb -> string -> int -> request = "open" [@@mel.send]

  external event_target_request : event -> request = "target" [@@mel.get]

  external event_target_tx : event -> tx = "target" [@@mel.get]

  external set_onsuccess : request -> (event -> unit) -> unit = "onsuccess"
    [@@mel.set]

  external set_onerror : request -> (event -> unit) -> unit = "onerror"
    [@@mel.set]

  external set_onupgradeneeded : request -> (event -> unit) -> unit
    = "onupgradeneeded" [@@mel.set]

  external req_error : request -> idb_error Js.Nullable.t = "error" [@@mel.get]
  external error_message : idb_error -> string = "message" [@@mel.get]
  external result_db : request -> db = "result" [@@mel.get]

  external result_string : request -> string Js.Undefined.t = "result"
    [@@mel.get]

  external result_u8 : request -> Js.Typed_array.Uint8Array.t Js.Undefined.t
    = "result" [@@mel.get]

  external result_keys : request -> string array = "result" [@@mel.get]
  external create_object_store : db -> string -> unit = "createObjectStore"
    [@@mel.send]

  external transaction : db -> string -> string -> tx = "transaction"
    [@@mel.send]

  external set_tx_oncomplete : tx -> (event -> unit) -> unit = "oncomplete"
    [@@mel.set]

  external set_tx_onerror : tx -> (event -> unit) -> unit = "onerror"
    [@@mel.set]

  external set_tx_onabort : tx -> (event -> unit) -> unit = "onabort"
    [@@mel.set]
  external tx_error : tx -> idb_error Js.Nullable.t = "error" [@@mel.get]
  external object_store : tx -> string -> store = "objectStore" [@@mel.send]
  external store_get : store -> string -> request = "get" [@@mel.send]
  external store_put : store -> 'a -> string -> unit = "put" [@@mel.send]
  external store_delete : store -> string -> unit = "delete" [@@mel.send]
  external store_get_all_keys : store -> request = "getAllKeys" [@@mel.send]
end

let error_message = function
  | Some err -> Idb_db.error_message err
  | None -> "IndexedDB error"

(* cljs make-store caches the open promise in the store state; a failed
   open stays memoized the same way. *)
let db_task_ref : (Idb_db.db, exn) result Db_worker_effect.t option ref =
  ref None

let db_task () =
  let task =
    match !db_task_ref with
    | Some t -> t
    | None ->
        let task, resolver = Db_worker_effect.wait () in
        (match Js.Undefined.toOption Idb_db.indexed_db with
         | None ->
             Db_worker_effect.wakeup resolver
               (Error (Failure "indexedDB is not available"))
         | Some idb ->
             let req = Idb_db.open_ idb "localforage" 2 in
             Idb_db.set_onupgradeneeded req (fun event ->
                 Idb_db.create_object_store
                   (Idb_db.result_db (Idb_db.event_target_request event))
                   "keyvaluepairs");
             Idb_db.set_onsuccess req (fun event ->
                 Db_worker_effect.wakeup resolver
                   (Ok (Idb_db.result_db (Idb_db.event_target_request event))));
             Idb_db.set_onerror req (fun event ->
                 Db_worker_effect.wakeup resolver
                   (Error
                      (Failure
                         (error_message
                            (Js.Nullable.toOption
                               (Idb_db.req_error
                                  (Idb_db.event_target_request event))))))));
        db_task_ref := Some task;
        task
  in
  Db_worker_effect.bind task (function
    | Ok db -> Db_worker_effect.pure db
    | Error exn -> Db_worker_effect.error exn)

(* cljs with-idb-store: run f on the "keyvaluepairs" objectStore inside
   a "readwrite" tx; resolve on tx-complete, reject on error/abort or
   on a synchronous throw inside the callback. *)
let with_store f =
  Db_worker_effect.bind (db_task ()) (fun db ->
      let task, resolver = Db_worker_effect.wait () in
      let finish result =
        if Db_worker_effect.is_pending task then Db_worker_effect.wakeup resolver result
      in
      let tx = Idb_db.transaction db "keyvaluepairs" "readwrite" in
      Idb_db.set_tx_oncomplete tx (fun _ -> finish (Ok ()));
      let error_result event =
        Error
          (Failure
             (error_message
                (Js.Nullable.toOption
                   (Idb_db.tx_error (Idb_db.event_target_tx event)))))
      in
      Idb_db.set_tx_onerror tx (fun event -> finish (error_result event));
      Idb_db.set_tx_onabort tx (fun event -> finish (error_result event));
      (try f (Idb_db.object_store tx "keyvaluepairs")
       with exn -> finish (Error exn));
      Db_worker_effect.bind task (function
        | Ok () -> Db_worker_effect.pure ()
        | Error exn -> Db_worker_effect.error exn))

(* ---------- node kv-store.json ---------- *)

let kv_path () =
  let dir =
    match Runtime_env.env "LOGSEQ_WORKER_KV_DIR" with
    | Some d -> d
    | None -> "./.worker-kv"
  in
  Filename.concat dir "kv-store.json"

(* cljs parse-kv-state: transit-read, map or {}, warn on error. *)
let load_state () =
  Db_worker_effect.bind (File_sys.exists (kv_path ())) (function
    | false -> Db_worker_effect.pure []
    | true ->
        Db_worker_effect.catch
          (Db_worker_effect.map
             (fun contents ->
               match Transit_codec.of_string contents with
               | Wire.Map kvs -> kvs
               | _ -> [])
             (File_sys.read_text (kv_path ())))
          (fun exn ->
            Worker_log.warn "db-worker-node-kv-parse-failed"
              [ "error", Printexc.to_string exn ];
            Db_worker_effect.pure []))

let store_state kvs =
  File_sys.write_text (kv_path ()) (Transit_codec.to_string (Wire.Map kvs))

let u8_of_string s =
  let n = String.length s in
  let a = Js.Typed_array.Uint8Array.fromLength n in
  for i = 0 to n - 1 do
    Js.Typed_array.Uint8Array.unsafe_set a i (Char.code (String.unsafe_get s i))
  done;
  a

let string_of_u8 a =
  let n = Js.Typed_array.Uint8Array.length a in
  String.init n (fun i -> Char.chr (Js.Typed_array.Uint8Array.unsafe_get a i))

(* transit "uint8array" tag — node.cljs kv-transit-writer encodes
   Uint8Array as a tagged vector of byte ints. *)
let wire_of_bytes s =
  Wire.Tagged
    ( "uint8array",
      Wire.Array
        (List.init (String.length s)
           (fun i -> Wire.Int (Char.code (String.unsafe_get s i)))) )

let bytes_of_wire = function
  | Wire.Tagged ("uint8array", Wire.Array items) ->
      Some
        (String.init (List.length items) (fun i ->
             match List.nth items i with
             | Wire.Int n -> Char.chr (n land 0xFF)
             | _ -> '\000'))
  | _ -> None

(* ---------- spec ops ---------- *)

let is_browser () =
  match Runtime_env.kind () with
  | Runtime_env.Browser_worker -> true
  | _ -> false

let init () =
  if is_browser () then Db_worker_effect.map (fun _ -> ()) (db_task ())
  else Db_worker_effect.pure ()

let get key =
  if is_browser () then begin
    let req = ref None in
    Db_worker_effect.map
      (fun () ->
        match !req with
        | Some r -> Js.Undefined.toOption (Idb_db.result_string r)
        | None -> None)
      (with_store (fun os -> req := Some (Idb_db.store_get os key)))
  end
  else
    Db_worker_effect.map (fun kvs ->
        match List.assoc_opt (Wire.String key) kvs with
        | Some (Wire.String s) -> Some s
        | Some other -> bytes_of_wire other
        | None -> None)
        (load_state ())

let set key value =
  if is_browser () then
    with_store (fun os -> Idb_db.store_put os value key)
  else
    Db_worker_effect.bind (load_state ()) (fun kvs ->
        let kvs = List.remove_assoc (Wire.String key) kvs in
        store_state (kvs @ [ Wire.String key, Wire.String value ]))

let delete key =
  if is_browser () then with_store (fun os -> Idb_db.store_delete os key)
  else
    Db_worker_effect.bind (load_state ()) (fun kvs ->
        store_state (List.remove_assoc (Wire.String key) kvs))

let keys () =
  if is_browser () then begin
    let req = ref None in
    Db_worker_effect.map
      (fun () ->
        match !req with
        | Some r -> Array.to_list (Idb_db.result_keys r)
        | None -> [])
      (with_store (fun os -> req := Some (Idb_db.store_get_all_keys os)))
  end
  else
    Db_worker_effect.map
      (fun kvs ->
        List.filter_map
          (fun (k, _) -> match k with Wire.String s -> Some s | _ -> None)
          kvs)
      (load_state ())

let get_binary key =
  if is_browser () then begin
    let req = ref None in
    Db_worker_effect.map
      (fun () ->
        match !req with
        | Some r ->
            (match Js.Undefined.toOption (Idb_db.result_u8 r) with
             | Some u8 -> Some (string_of_u8 u8)
             | None -> None)
        | None -> None)
      (with_store (fun os -> req := Some (Idb_db.store_get os key)))
  end
  else
    Db_worker_effect.map
      (fun kvs ->
        match List.assoc_opt (Wire.String key) kvs with
        | Some v -> bytes_of_wire v
        | None -> None)
      (load_state ())

let set_binary key value =
  if is_browser () then
    with_store (fun os -> Idb_db.store_put os (u8_of_string value) key)
  else
    Db_worker_effect.bind (load_state ()) (fun kvs ->
        let kvs = List.remove_assoc (Wire.String key) kvs in
        store_state (kvs @ [ Wire.String key, wire_of_bytes value ]))
