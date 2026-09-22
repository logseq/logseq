(* logseq.db.sqlite.debug — SQLite debug fns for the kvs table. *)

open Datascript

(* both cljs variants (wasm .exec and node .prepare/.get/.all) compute
   the same thing: addresses referenced by the schema root or by branch
   nodes' :children that have no row in kvs. *)
let find_missing_addresses (db : Sqlite.db) : int64 list =
  let root_indexes =
    match
      Sqlite.query db ~sql:"select content from kvs where addr = 0" ~bind:[||]
    with
    | [| Sqlite.Text content |] :: _ ->
        (match Storage_codec.decode content with
         | Storage_root r ->
             [ r.storage_eavt; r.storage_aevt; r.storage_avet ]
         | _ -> [])
    | _ -> []
  in
  let rows =
    Sqlite.query db ~sql:"select addr, addresses from kvs" ~bind:[||]
  in
  let row_addr (row : Sqlite.row) : int64 =
    match row.(0) with
    | Sqlite.Integer a -> a
    | _ -> invalid_arg "kvs.addr must be an integer"
  in
  let row_children (row : Sqlite.row) : string list =
    match row.(1) with
    | Sqlite.Text json -> Storage_codec.decode_addresses json
    | Sqlite.Null -> []
    | _ -> invalid_arg "kvs.addresses must be a JSON text column"
  in
  let present = List.map row_addr rows in
  let used =
    List.concat_map row_children rows
    @ ("0" :: "1" :: root_indexes)
  in
  let present_tbl = Hashtbl.create 64 in
  List.iter (fun a -> Hashtbl.replace present_tbl (Int64.to_string a) ())
    present;
  let missing =
    used
    |> List.filter (fun a -> not (Hashtbl.mem present_tbl a))
    |> List.sort_uniq (fun (a : string) (b : string) ->
           compare (Int64.of_string a) (Int64.of_string b))
  in
  List.map Int64.of_string missing
