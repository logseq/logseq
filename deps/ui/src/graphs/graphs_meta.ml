(* ls-graphs-metadata: localStorage EDN map {repo {field value, ...}} —
   per-graph bookkeeping shared between graphs_ops (last-seen ordering)
   and boot (graph-id -> repo resolution for deep links). *)

let key = "ls-graphs-metadata"

let read () =
  match Ui_services.storage_get key with
  | Some s -> (
      try
        match Edn.parse s with
        | Wire.Map pairs -> pairs
        | _ -> []
      with _ -> [])
  | None -> []

let write pairs =
  Ui_services.storage_set key (Edn.to_string (Wire.Map pairs))

let key_is_repo k repo =
  k = Wire.String repo || k = Wire.Keyword repo

let field repo name =
  match List.find_opt (fun (k, _) -> key_is_repo k repo) (read ()) with
  | Some (_, Wire.Map fields) -> Wire.map_get (Wire.Map fields) name
  | _ -> None

let last_seen repo =
  match field repo "last-seen-at" with
  | Some (Wire.Int n) -> Some (float_of_int n)
  | Some (Wire.Int64 n) -> Some (Int64.to_float n)
  | Some (Wire.Float f) -> Some f
  | Some (Wire.Date_ms n) -> Some (Int64.to_float n)
  | _ -> None

(* merge fields into repo's entry (creates the entry when missing) *)
let upsert repo fields =
  let names = List.map (fun (k, _) -> k) fields in
  let found = ref false in
  let pairs' =
    List.map
      (fun (k, v) ->
        match key_is_repo k repo, v with
        | true, Wire.Map existing ->
            found := true;
            let kept =
              List.filter (fun (ek, _) -> not (List.mem ek names)) existing
            in
            (k, Wire.Map (fields @ kept))
        | _ -> (k, v))
      (read ())
  in
  if !found then write pairs'
  else write (pairs' @ [ (Wire.String repo, Wire.Map fields) ])

(* merge {:last-seen-at now :_v now} (+ :created-at on first sight) *)
let touch repo =
  let now = Int64.of_float (Ui_services.time_now ()) in
  let fields =
    [ (Wire.kw "last-seen-at", Wire.Int64 now)
    ; (Wire.kw "_v", Wire.Int64 now) ]
  in
  let fields =
    match field repo "created-at" with
    | Some _ -> fields
    | None -> (Wire.kw "created-at", Wire.Int64 now) :: fields
  in
  upsert repo fields

let drop repo =
  write (List.filter (fun (k, _) -> not (key_is_repo k repo)) (read ()))

(* worker-reported uuid, remembered so boot can resolve ?graph-id= *)
let remember_uuid repo uuid =
  upsert repo [ (Wire.kw "graph-uuid", Wire.String uuid) ]

let uuid_of repo =
  match field repo "graph-uuid" with
  | Some w -> Wire.as_uuid w
  | None -> None

let repo_of_uuid uuid =
  List.find_map
    (fun (k, v) ->
      match v with
      | Wire.Map fields -> (
          match Wire.map_get (Wire.Map fields) "graph-uuid" with
          | Some w when Wire.as_uuid w = Some uuid -> (
              match k with
              | Wire.String r | Wire.Keyword r -> Some r
              | _ -> None)
          | _ -> None)
      | _ -> None)
    (read ())
