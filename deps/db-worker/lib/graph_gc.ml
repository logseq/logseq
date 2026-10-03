(* logseq.db.sqlite.gc — GC unused addresses in the kvs table (WASM variant). *)

let get_non_refed_addrs_sql =
  "WITH all_referenced AS (\
     SELECT CAST(value AS INTEGER) AS addr \
     FROM kvs, json_each(kvs.addresses) \
  ) \
  SELECT kvs.addr \
  FROM kvs \
  WHERE kvs.addr NOT IN (SELECT addr FROM all_referenced)"

(* kvs addr 0 = db meta (eavt/avet/aevt root addrs); addr 1 = tail. *)
let internal_addresses db =
  match Graph_store.restore db "0" with
  | Some (Datascript.Storage_root r) ->
      [ "0"; "1"; r.storage_eavt; r.storage_avet; r.storage_aevt ]
  | _ -> [ "0"; "1" ]

let get_unused_addresses db : string list =
  let internal = internal_addresses db in
  Sqlite.query db ~sql:get_non_refed_addrs_sql ~bind:[||]
  |> List.filter_map (function
       | [| Sqlite.Integer n |] -> Some (Int64.to_string n)
       | _ -> None)
  |> List.filter (fun a -> not (List.mem a internal))

let rec gc_kvs_table ?(full_gc = true) db =
  let unused = get_unused_addresses db in
  if unused <> [] then begin
    Sqlite.transaction db (fun () -> Graph_store.delete db unused);
    if full_gc then gc_kvs_table ~full_gc db
  end
