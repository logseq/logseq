(* Port of logseq.db.sqlite.debug — sqlite debug fns over the kvs table.
   The cljs wasm and node variants differ only in the SQL API used;
   both compute the same set, so they share one implementation here. *)

module Int64_set = Set.Make (Int64)

let bind_to_int64 = function
  | Sqlite.Integer n -> Some n
  | Sqlite.Float f -> Some (Int64.of_float f)
  | _ -> None

let wire_to_int64 = function
  | Wire.Int n -> Some (Int64.of_int n)
  | Wire.Int64 n -> Some n
  | Wire.Float f -> Some (Int64.of_float f)
  | _ -> None

(* find-missing-addresses — addrs referenced from kvs rows (the
   addresses JSON column plus the storage header nodes {0, 1, eavt,
   avet, aevt}) that are not themselves rows in kvs. *)
let find_missing_addresses (db : Sqlite.db) : int64 list =
  let schema =
    match
      Sqlite.query db ~sql:"select content from kvs where addr = 0" ~bind:[||]
    with
    | row :: _ ->
        (match row.(0) with
         | Sqlite.Text s | Sqlite.Blob s -> Transit_codec.of_string s
         | _ -> Wire.Nil)
    | [] -> Wire.Nil
  in
  let rows =
    Sqlite.query db ~sql:"select addr, addresses from kvs" ~bind:[||]
  in
  let used = ref Int64_set.empty in
  let add x = used := Int64_set.add x !used in
  add 0L;
  add 1L;
  List.iter
    (fun k ->
      match Wire.get k schema with
      | Some v ->
          (match wire_to_int64 v with
           | Some n -> add n
           | None -> ())
      | None -> ())
    [ "eavt"; "avet"; "aevt" ];
  let existing = ref Int64_set.empty in
  List.iter
    (fun row ->
      (match bind_to_int64 row.(0) with
       | Some addr -> existing := Int64_set.add addr !existing
       | None -> ());
      match row.(1) with
      | Sqlite.Text json | Sqlite.Blob json ->
          (match Json.parse json with
           | Wire.Array xs ->
               List.iter
                 (fun x ->
                   match wire_to_int64 x with
                   | Some n -> add n
                   | None -> ())
                 xs
           | _ -> ())
      | _ -> ())
    rows;
  Int64_set.elements (Int64_set.diff !used !existing)

(* find-missing-addresses-node-version — same computation as the wasm
   variant; kept as a distinct entry point for API parity. *)
let find_missing_addresses_node_version = find_missing_addresses
