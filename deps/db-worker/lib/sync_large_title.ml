(* frontend.worker.sync.large-title — offload/rehydrate of block titles
   larger than 4k to the remote asset store. *)

open Datascript
open Db_worker_effect.Infix

module Int_set = Set.Make (Int)

let large_title_byte_limit = 4096
let large_title_asset_type = "txt"
let large_title_object_attr = "logseq.property.sync/large-title-object"

let utf8_byte_length (v : value) : int option =
  match v with
  | String s -> Some (String.length s)
  | _ -> None

let large_title (v : value) : bool =
  match utf8_byte_length v with
  | Some n -> n > large_title_byte_limit
  | None -> false

let large_title_datom (d : datom) : bool =
  d.a = "block/title" && large_title d.v

(* assoc-datom-value — tx item vector [op e a v rest...] *)
let assoc_datom_value (item : Wire.t) (new_value : Wire.t) : Wire.t =
  match item with
  | Wire.Array l | Wire.List l ->
      (match l with
       | op :: e :: a :: _v :: others ->
           Wire.Array (op :: e :: a :: new_value :: others)
       | _ -> item)
  | _ -> item

let large_title_object asset_uuid asset_type : value =
  Map
    [ Keyword "asset-uuid", String asset_uuid
    ; Keyword "asset-type", String asset_type ]

let large_title_object_wire asset_uuid asset_type : Wire.t =
  Wire.Map
    [ Wire.Keyword "asset-uuid", Wire.String asset_uuid
    ; Wire.Keyword "asset-type", Wire.String asset_type ]

let large_title_object_wire_of (v : Wire.t) : Wire.t option =
  match v with
  | Wire.Map _ ->
      (match (Wire.get "asset-uuid" v, Wire.get "asset-type" v) with
       | Some (Wire.String _), Some (Wire.String _) -> Some v
       | _ -> None)
  | _ -> None

let large_title_object_value (v : value) : bool =
  match v with
  | Map kvs ->
      let get k =
        match List.assoc_opt (Keyword k) kvs with
        | Some (String _) -> true
        | _ -> false
      in
      get "asset-uuid" && get "asset-type"
  | _ -> false

let value_attr (v : value) (a : string) : value option =
  match v with
  | Map kvs -> List.assoc_opt (Keyword a) kvs
  | _ -> None

let schema_indexed (db : db) (a : attr) : bool =
  match Schema.schema_attr_by_name (Datascript.schema db) a with
  | Some s -> s.indexed
  | None -> false

let large_title_object_datoms (db : db) : datom Seq.t =
  if schema_indexed db large_title_object_attr then
    datoms db Avet ~a:large_title_object_attr ()
  else
    datoms db Eavt ()
    |> Seq.filter (fun (d : datom) -> d.a = large_title_object_attr)

let find_large_title_object_eid (db : db) (obj : value) : entity_id option =
  (* cljs (= obj (:v datom)) — map equality is entry-order-insensitive,
     so compare normalized values *)
  let obj' = Util.normalize_value obj in
  large_title_object_datoms db
  |> Seq.find_map (fun (d : datom) ->
         if Util.value_equal (Util.normalize_value d.v) obj' then Some d.e
         else None)

let resolve_large_title_item_eid (db : db) ~(e : Wire.t) ~(obj : value)
    : entity_id option =
  (* cljs (number? e) — ints and floats both *)
  match e with
  | Wire.Int n -> Some n
  | Wire.Int64 n -> Some (Int64.to_int n)
  | Wire.Float f -> Some (int_of_float f)
  | _ ->
      (* cljs (some-> (d/entity db e) :db/id) — d/entity resolves through
         its guarded entid: non-resolvable refs (tempids, strings) yield
         nil so resolution falls back to the object lookup; only true
         entid violations (malformed lookup-refs) propagate *)
      (match Datascript.entity db (Ds_wire.entity_ref_of_transit e) with
       | Some ent -> Some ent.id
       | None -> find_large_title_object_eid db obj)

(* asset-url — shared with sync-assets *)
let asset_url base graph_id asset_uuid asset_type =
  Printf.sprintf "%s/assets/%s/%s.%s" base graph_id asset_uuid asset_type

(* upload-large-title! — PUT text/plain; returns the object map *)
let upload_large_title ~repo ~graph_id ~title ~(aes_key : Wire.t)
    ~(http_base : string)
    ~(auth_headers : (string * string) list) : Wire.t Db_worker_effect.t =
  if http_base = "" then
    Sync_util.fail_fast "db-sync/missing-field"
      (Wire.Map
         [ Wire.Keyword "repo", Wire.String repo
         ; Wire.Keyword "field", Wire.Keyword "http-base" ]);
  if graph_id = "" then
    Sync_util.fail_fast "db-sync/missing-field"
      (Wire.Map
         [ Wire.Keyword "repo", Wire.String repo
         ; Wire.Keyword "field", Wire.Keyword "graph-id" ]);
  let asset_uuid = Uuid_gen.uuid () in
  let url = asset_url http_base graph_id asset_uuid large_title_asset_type in
  (match aes_key with
   | Wire.Nil -> Db_worker_effect.pure title
   | _ ->
       Sync_deps.require "encrypt_text_value" Sync_deps.encrypt_text_value
         aes_key title)
  >>= fun payload ->
  Http.send
    { Http.url
    ; method_ = "PUT"
    ; headers =
        ("content-type", "text/plain; charset=utf-8")
        :: ("x-amz-meta-type", large_title_asset_type)
           :: auth_headers
    ; body = Some payload }
  >>= fun (resp : Http.response) ->
  if resp.status >= 200 && resp.status < 300 then
    Db_worker_effect.pure
      (large_title_object_wire asset_uuid large_title_asset_type)
  else
    Sync_util.fail_fast "db-sync/large-title-upload-failed"
      (Wire.Map
         [ Wire.Keyword "repo", Wire.String repo
         ; Wire.Keyword "status", Wire.Int resp.status ])

(* download-large-title! — GET; returns the plain-text title *)
let download_large_title ~repo ~graph_id ~(obj : Wire.t)
    ~(aes_key : Wire.t) ~(http_base : string)
    ~(auth_headers : (string * string) list) : string Db_worker_effect.t =
  if http_base = "" then
    Sync_util.fail_fast "db-sync/missing-field"
      (Wire.Map
         [ Wire.Keyword "repo", Wire.String repo
         ; Wire.Keyword "field", Wire.Keyword "http-base" ]);
  if graph_id = "" then
    Sync_util.fail_fast "db-sync/missing-field"
      (Wire.Map
         [ Wire.Keyword "repo", Wire.String repo
         ; Wire.Keyword "field", Wire.Keyword "graph-id" ]);
  let asset_uuid =
    match Wire.get "asset-uuid" obj with
    | Some (Wire.String s) -> s
    | _ -> ""
  in
  let asset_type =
    match Wire.get "asset-type" obj with
    | Some (Wire.String s) -> s
    | _ -> ""
  in
  let url = asset_url http_base graph_id asset_uuid asset_type in
  let status_failed status =
    status < 200 || status >= 300
  in
  let download_failed status =
    Sync_util.fail_fast "db-sync/large-title-download-failed"
      (Wire.Map
         [ Wire.Keyword "repo", Wire.String repo
         ; Wire.Keyword "status", Wire.Int status ])
  in
  (match aes_key with
   | Wire.Nil ->
       (* Plain-text title: fetch decodes the utf-8 body to text. *)
       Http.send
         { Http.url; method_ = "GET"; headers = auth_headers; body = None }
       >>= fun (resp : Http.response) ->
       if status_failed resp.status then download_failed resp.status
       else Db_worker_effect.pure resp.body
   | _ ->
       (* Encrypted payload must stay raw bytes for decryption. *)
       Http_bytes.send
         { Http_bytes.url
         ; method_ = "GET"
         ; headers = auth_headers
         ; body = None }
       >>= fun (resp : Http_bytes.response) ->
       if status_failed resp.status then download_failed resp.status
       else
         let payload_str = resp.body in
         Db_worker_effect.catch
           (Sync_deps.require "decrypt_text_value"
              Sync_deps.decrypt_text_value aes_key payload_str)
           (fun _ -> Db_worker_effect.pure payload_str))

(* offload-large-titles — tx item vectors in; placeholder + object datom out *)
let offload_large_titles (tx_data : Wire.t list)
    ~(upload_fn : string -> Wire.t Db_worker_effect.t) : Wire.t list Db_worker_effect.t =
  let rec loop acc remaining : Wire.t list Db_worker_effect.t =
    match remaining with
    | [] -> Db_worker_effect.pure (List.rev acc)
    | item :: rest -> (
        match item with
        | Wire.Array l | Wire.List l -> (
            match l with
            | op :: e :: a :: (Wire.String title as v) :: _
              when op = Wire.Keyword "db/add"
                   && a = Wire.Keyword "block/title"
                   && String.length title > large_title_byte_limit ->
                ignore v;
                upload_fn title >>= fun obj ->
                let placeholder = assoc_datom_value item (Wire.String "") in
                let obj_datom =
                  Wire.Array
                    [ Wire.Keyword "db/add"; e
                    ; Wire.Keyword large_title_object_attr; obj ]
                in
                loop (obj_datom :: placeholder :: acc) rest
            | _ -> loop (item :: acc) rest)
        | _ -> loop (item :: acc) rest)
  in
  loop [] tx_data

(* rehydrate-large-titles! *)
let rehydrate_large_titles repo ~(graph_id : string option)
    ~(tx_data : Wire.t list option)
    ~(download_fn : repo:string -> graph_id:string -> obj:Wire.t ->
       aes_key:Wire.t -> string Db_worker_effect.t)
    ~(graph_e2ee : unit -> bool) ~(ensure_graph_aes_key : string -> Wire.t Db_worker_effect.t)
    ~(conn : conn option)
    : unit Db_worker_effect.t =
  match conn with
  | None -> Db_worker_effect.pure ()
  | Some conn -> (
      let db = Conn.db conn in
      let graph_id =
        match graph_id with
        | Some g -> g
        | None -> Option.value (Sync_util.get_graph_id repo) ~default:""
      in
      let items =
        match tx_data with
        | Some txs ->
            List.filter_map
              (fun item ->
                 match item with
                 | Wire.Array (op :: e :: a :: obj :: _)
                 | Wire.List (op :: e :: a :: obj :: _)
                   when op = Wire.Keyword "db/add"
                        && a = Wire.Keyword large_title_object_attr -> (
                     match large_title_object_wire_of obj with
                     | Some _ -> Some (e, obj)
                     | None -> None)
                 | _ -> None)
              txs
            (* cljs distinct — first-occurrence order *)
            |> Sync_state.distinct_by Fun.id
        | None ->
            large_title_object_datoms db
            |> Seq.filter_map (fun (d : datom) ->
                   let obj_wire = Ds_wire.transit_of_value d.v in
                   match large_title_object_wire_of obj_wire with
                   | Some _ -> Some (Wire.Int d.e, obj_wire)
                   | None -> None)
            |> List.of_seq |> Sync_state.distinct_by Fun.id
      in
      match items with
      | [] -> Db_worker_effect.pure ()
      | _ ->
          (if graph_e2ee () then
             ensure_graph_aes_key graph_id >>= fun k ->
             (match k with
              | Wire.Nil ->
                  Sync_util.fail_fast "db-sync/missing-field"
                    (Wire.Map
                       [ Wire.Keyword "repo", Wire.String repo
                       ; Wire.Keyword "field", Wire.Keyword "aes-key" ])
              | _ -> Db_worker_effect.pure k)
           else Db_worker_effect.pure Wire.Nil)
          >>= fun aes_key ->
          Db_worker_effect.all
            (List.map
               (fun (e, obj_wire) ->
                  let obj_value = Ds_wire.value_of_transit obj_wire in
                  (* eids must resolve on the conn the title lands on: a
                     pending-created entity's display eid is unallocated
                     on the server conn — writing there would
                     materialize a phantom entity (or, worse, hit an
                     eid a server entity took later). *)
                  let confirmed_db =
                    match Sync_state.confirmed_conn repo with
                    | Some c -> Conn.db c
                    | None -> Conn.db conn
                  in
                  let resolve_on (d : db) : int option =
                    match e with
                    | Wire.Int n -> (
                        match Datascript.entity d (Entity_id n) with
                        | Some _ -> Some n
                        | None -> None)
                    | _ ->
                        resolve_large_title_item_eid d ~e ~obj:obj_value
                  in
                  let eid, server_writes =
                    match resolve_on confirmed_db with
                    | Some eid -> (Some eid, true)
                    | None ->
                        (* display-only entity — the rehydrate belongs
                           to the projection alone *)
                        (resolve_on (Conn.db conn), false)
                  in
                  match eid with
                  | None ->
                      Sync_util.fail_fast "db-sync/large-title-entity-missing"
                        (Wire.Map
                           [ Wire.Keyword "repo", Wire.String repo
                           ; Wire.Keyword "e", e
                           ; Wire.Keyword "obj", obj_wire ])
                  | Some eid ->
                      download_fn ~repo ~graph_id ~obj:obj_wire ~aes_key
                      >>= fun title -> (
                      let tx_data =
                        [ Wire.Array
                            [ Wire.Keyword "db/add"; Wire.Int eid
                            ; Wire.Keyword "block/title"
                            ; Wire.String title ] ]
                      and tx_meta =
                        [ "rtc-tx?", Bool true
                        ; "persist-op?", Bool false
                        ; "op", Keyword "large-title-rehydrate" ]
                      in
                      if server_writes then
                        ignore
                          (Db_transact.transact
                             (Option.value (Sync_state.confirmed_conn repo)
                                ~default:conn)
                             tx_data tx_meta);
                      (* confirmed data must also land on the display
                         conn — the server conn's only listener is
                         checksum, so without this the UI keeps showing
                         the offloaded placeholder until the next remote
                         tx rebuilds the projection *)
                      (match Sync_state.server_conn repo with
                       | Some _ ->
                           ignore (Db_transact.transact conn tx_data tx_meta)
                       | None when not server_writes ->
                           ignore (Db_transact.transact conn tx_data tx_meta)
                       | None -> ());
                      Db_worker_effect.pure ()))
               items)
          >>= fun _ -> Db_worker_effect.pure ())

(* offload-large-titles-in-datoms-batch — datoms -> datoms; cljs derives
   offloaded-title-eids from the large-title datoms when not supplied *)
let offload_large_titles_in_datoms_batch repo graph_id
    (datoms : datom list) ~(aes_key : Wire.t)
    ~(upload_fn : repo:string -> graph_id:string -> title:string ->
       aes_key:Wire.t -> Wire.t Db_worker_effect.t)
    ?(offloaded_title_eids : int list option) () :
    datom list Db_worker_effect.t =
  let offloaded_title_eids =
    match offloaded_title_eids with
    | Some ids -> ids
    | None ->
        List.filter_map
          (fun (d : datom) -> if large_title_datom d then Some d.e else None)
          datoms
  in
  let eid_set =
    List.fold_left (fun s e -> Int_set.add e s) Int_set.empty
      offloaded_title_eids
  in
  let upload title : Wire.t Db_worker_effect.t =
    upload_fn ~repo ~graph_id ~title ~aes_key
  in
  let rec loop acc remaining : datom list Db_worker_effect.t =
    match remaining with
    | [] -> Db_worker_effect.pure (List.rev acc)
    | (d : datom) :: rest -> (
        if large_title_datom d then
          (match d.v with
           | String title ->
               upload title >>= fun obj ->
               let obj_v = Ds_wire.value_of_transit obj in
               let placeholder = { d with v = String "" } in
               let obj_datom =
                 { d with a = large_title_object_attr; v = obj_v }
               in
               loop (obj_datom :: placeholder :: acc) rest
           | _ -> loop (d :: acc) rest)
        else if d.a = large_title_object_attr
                && Int_set.mem d.e eid_set then
          loop acc rest
        else loop (d :: acc) rest)
  in
  loop [] datoms

(* process-upload-datoms-in-batches! — streams the seq so the whole
   index never materializes as one list *)
let process_upload_datoms_in_batches (datoms : 'a Seq.t) ~total
    ~batch_size ~(process_batch : 'a list -> unit Db_worker_effect.t)
    ~(progress : int -> int -> unit) : unit Db_worker_effect.t =
  let remaining = ref datoms in
  let processed = ref 0 in
  let done_task, done_resolver = Db_worker_effect.wait () in
  (* flat step driver — see stream_snapshot_row_batches *)
  let rec step () : unit =
    let rec take acc s n =
      if n >= batch_size then (List.rev acc, s)
      else
        match s () with
        | Seq.Nil -> (List.rev acc, Seq.empty)
        | Seq.Cons (x, s') -> take (x :: acc) s' (n + 1)
    in
    match take [] !remaining 0 with
    | [], _ -> Db_worker_effect.wakeup done_resolver ()
    | batch, rest ->
        remaining := rest;
        processed := !processed + List.length batch;
        Db_worker_effect.on_any
          (process_batch batch
           >>= fun () ->
           progress !processed total;
           Db_worker_effect.sleep 0.)
          (fun () -> step ())
          (fun e -> Db_worker_effect.reject done_resolver e)
  in
  step ();
  done_task

(* rehydrate-large-titles-from-db! *)
let rehydrate_large_titles_from_db repo graph_id
    ~(rehydrate : tx_data:Wire.t list -> graph_id:string ->
        unit Db_worker_effect.t) : unit Db_worker_effect.t =
  match Worker_state.datascript_conn repo with
  | None -> Db_worker_effect.pure ()
  | Some conn ->
      let tx_data =
        large_title_object_datoms (Conn.db conn)
        |> Seq.map (fun (d : datom) ->
               Wire.Array
                 [ Wire.Keyword "db/add"; Wire.Int d.e
                 ; Wire.Keyword large_title_object_attr
                 ; Ds_wire.transit_of_value d.v ])
        |> List.of_seq
      in
      (match tx_data with
       | [] -> Db_worker_effect.pure ()
       | _ -> rehydrate ~tx_data ~graph_id)
