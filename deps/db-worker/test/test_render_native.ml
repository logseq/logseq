(* Native tests for :thread-api/get-blocks and
   :thread-api/get-render-snapshots — builds a small graph over
   create_conn + transact_conn_string and invokes the registered
   handlers through Dispatcher.invoke_transit, mirroring the cljs
   worker endpoint behavior. *)

open Datascript

let failures = ref 0

let check name cond =
  if cond then Printf.printf "ok - %s\n" name
  else begin
    incr failures;
    Printf.printf "FAIL - %s\n%!" name
  end

let string_contains haystack needle =
  let hl = String.length haystack and nl = String.length needle in
  let rec go i =
    if i + nl > hl then false
    else if String.sub haystack i nl = needle then true
    else go (i + 1)
  in
  go 0

let await task =
  let result = ref None in
  Db_worker_effect.on_any task
    (fun v -> result := Some (Ok v))
    (fun e -> result := Some (Error e));
  match !result with
  | Some (Ok v) -> v
  | Some (Error e) -> raise e
  | None -> failwith "task still pending"

let repo = "test/render-graph"
let kw s = Wire.Keyword s

let schema_edn =
  "{:db/ident {:db/unique :db.unique/identity}
    :block/name {:db/unique :db.unique/identity}
    :block/uuid {:db/unique :db.unique/identity}
    :block/title {}
    :block/order {}
    :block/parent {:db/valueType :db.type/ref}
    :block/page {:db/valueType :db.type/ref}
    :block/tags {:db/valueType :db.type/ref :db/cardinality :db.cardinality/many}
    :block/refs {:db/valueType :db.type/ref :db/cardinality :db.cardinality/many}
    :block/alias {:db/valueType :db.type/ref :db/cardinality :db.cardinality/many}
    :block/created-at {}
    :block/collapsed? {}
    :block/journal-day {:db/index true}
    :block/link {:db/valueType :db.type/ref}
    :logseq.property/status {:db/valueType :db.type/ref}}"

let uuid_b1 = "11111111-1111-1111-1111-111111111111"
let uuid_b2 = "22222222-2222-2222-2222-222222222222"
let uuid_missing = "99999999-9999-9999-9999-999999999999"

let fixture_edn =
  Printf.sprintf
    "[{:db/id -101 :block/name \"page1\" :block/title \"page1\"
       :block/uuid #uuid \"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\"}
      {:db/id -1 :block/title \"b1 content\" :block/page -101
       :block/uuid #uuid \"%s\" :block/order \"a1\" :block/created-at 1000}
      {:db/id -2 :block/title \"child of b1\" :block/page -101
       :block/parent -1 :block/uuid #uuid \"%s\" :block/order \"a1\"
       :block/created-at 2000}
      {:db/id -3 :block/title \"ref to b1\" :block/page -101
       :block/refs [-1] :block/order \"a2\" :block/created-at 3000}]"
    uuid_b1 uuid_b2

let conn =
  let schema = Datascript.schema_of_edn_string schema_edn in
  let conn = Datascript.create_conn ~schema () in
  ignore (Datascript.transact_conn_string conn fixture_edn);
  conn

(* Force module init so the endpoint registrations run (in worker_core.ml
   these are `ignore Module.fn` lines wired by the maintainer). *)
let () =
  ignore Endpoint_block.get_blocks;
  ignore Render_resource.get_render_snapshots;
  Worker_state.set_datascript_conn repo conn

let invoke name args =
  Transit_codec.of_string
    (await
       (Dispatcher.invoke_transit name
          (Transit_codec.to_string (Wire.Array args))))

let wire_get k w =
  match w with
  | Wire.Map kvs -> Plain_value.map_get k kvs
  | _ -> None

(* ---------- thread-api/get-blocks ---------- *)

let () =
  let res =
    invoke "thread-api/get-blocks"
      [ Wire.String repo
      ; Wire.Array
          [ Wire.Map
              [ (kw "id", Wire.Uuid uuid_b1)
              ; ( kw "opts"
                , Wire.Map [ (kw "children?", Wire.Bool true) ] ) ] ] ]
  in
  let ok =
    match res with
    | Wire.Array [ Wire.Map kvs ] ->
        (match Plain_value.map_get "block" kvs with
         | Some b -> (
             match wire_get "block/uuid" b with
             | Some (Wire.Uuid u) -> u = uuid_b1
             | _ -> false)
         | _ -> false)
        && Plain_value.map_get "id" kvs <> None
        && (match Plain_value.map_get "children" kvs with
            | Some (Wire.Array _ | Wire.List _) -> true
            | _ -> false)
    | _ -> false
  in
  check "get-blocks returns block with children" ok

let () =
  let res =
    invoke "thread-api/get-blocks"
      [ Wire.String repo
      ; Wire.Array
          [ Wire.Map [ (kw "id", Wire.Uuid uuid_missing); (kw "opts", Wire.Map []) ] ] ]
  in
  (* missing block -> {:id id} (no :block key) *)
  let ok =
    match res with
    | Wire.Array [ Wire.Map kvs ] ->
        Plain_value.map_get "id" kvs <> None
        && Plain_value.map_get "block/uuid" kvs = None
    | _ -> false
  in
  check "get-blocks missing block returns id-only map" ok

let () =
  let res =
    invoke "thread-api/get-blocks"
      [ Wire.String "test/no-such-graph"; Wire.Array [] ]
  in
  check "get-blocks missing conn returns nil" (res = Wire.Nil)

(* ---------- thread-api/get-render-snapshots ---------- *)

let () =
  let res =
    invoke "thread-api/get-render-snapshots"
      [ Wire.String repo
      ; Wire.Map
          [ (kw "blocks", Wire.Array [ Wire.Uuid uuid_b1 ])
          ; (kw "children", Wire.Array [ Wire.Uuid uuid_b1 ])
          ; ( kw "resources"
            , Wire.Array
                [ Wire.Array [ kw "block-ref-count"; Wire.Uuid uuid_b1 ]
                ; Wire.Array [ kw "block-breadcrumb"; Wire.Uuid uuid_b1; Wire.Int 3 ]
                ; Wire.Array [ kw "journals" ] ] ) ] ]
  in
  let basis_ok =
    match wire_get "basis-rev" res with
    | Some (Wire.Int n) -> n > 0
    | _ -> false
  in
  check "render-snapshots basis-rev" basis_ok;
  let slots_ok =
    match wire_get "slots" res with
    | Some (Wire.Map kvs) ->
        List.exists
          (fun (k, _) -> k = Wire.Array [ kw "block"; Wire.Uuid uuid_b1 ])
          kvs
        && List.exists
             (fun (k, _) -> k = Wire.Array [ kw "children"; Wire.Uuid uuid_b1 ])
             kvs
        && List.exists
             (fun (k, _) ->
               k = Wire.Array
                     [ kw "resource"; Wire.Array [ kw "journals" ] ])
             kvs
    | _ -> false
  in
  check "render-snapshots slots keys" slots_ok;
  let groups_ok =
    match wire_get "groups" res with
    | Some (Wire.Map kvs) ->
        List.exists
          (fun (k, _) -> k = Wire.Array [ kw "children"; Wire.Uuid uuid_b1 ])
          kvs
    | _ -> false
  in
  check "render-snapshots groups keys" groups_ok;
  (* resource value: block-ref-count resolves to an int >= 1 *)
  let ref_count_ok =
    match wire_get "slots" res with
    | Some (Wire.Map kvs) -> (
        match
          List.assoc_opt
            (Wire.Array
               [ kw "resource"
               ; Wire.Array [ kw "block-ref-count"; Wire.Uuid uuid_b1 ] ])
            kvs
        with
        | Some (Wire.Map entry) -> (
            match Plain_value.map_get "value" entry with
            | Some (Wire.Int n) -> n >= 1
            | _ -> false)
        | _ -> false)
    | _ -> false
  in
  check "render-snapshots block-ref-count value" ref_count_ok

let () =
  (* invalid request (non-map) raises Exn_info — surfaces to JS as a
     rejected invoke, matching the cljs endpoint throw *)
  let raised =
    try
      ignore
        (invoke "thread-api/get-render-snapshots"
           [ Wire.String repo; Wire.Array [] ]);
      false
    with
    | Dispatcher.Exn_info (msg, _) -> string_contains msg "snapshot request"
    | _ -> false
  in
  check "render-snapshots invalid request errors" raised

let () =
  if !failures > 0 then begin
    Printf.printf "%d failures\n%!" !failures;
    exit 1
  end
  else Printf.printf "all tests passed\n"
