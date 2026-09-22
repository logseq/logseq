(* kvs-format storage, byte-compatible with
   frontend.worker.db-core/new-sqlite-storage:

     kvs (addr INTEGER primary key, content TEXT, addresses JSON)

   content   = transit-encoded storage payload
   addresses = JSON array of child node addrs (branch payloads only)

   cljs-written branches store children only in the `addresses`
   column; OCaml stores them in content too. Restore merges the
   column so both write formats read correctly. *)
open Datascript

let kvs_table_sql =
  "create table if not exists kvs (addr INTEGER primary key, content TEXT, addresses JSON)"

let create_kvs_table db = Sqlite.exec db ~sql:kvs_table_sql ~bind:[||]

let row_addr row =
  match row.(0) with
  | Sqlite.Integer n -> Int64.to_string n
  | _ -> invalid_arg "kvs addr is not an integer"

let row_text row i =
  match row.(i) with
  | Sqlite.Text s -> Some s
  | Sqlite.Blob s -> Some s
  | _ -> None

let store db addr_payloads =
  List.iter
    (fun (addr, payload) ->
       let content = Storage_codec.encode payload in
       let addresses =
         match payload with
         | Storage_node (Persistent_sorted_set.Branch (_, children)) ->
             Sqlite.Text (Storage_codec.encode_addresses children)
         | _ -> Sqlite.Null
       in
       Sqlite.exec db
         ~sql:"insert or replace into kvs (addr, content, addresses) values (?, ?, ?)"
         ~bind:[| Sqlite.Integer (Int64.of_string addr); Sqlite.Text content; addresses |])
    addr_payloads

let restore db addr =
  let rows =
    Sqlite.query db
      ~sql:"select content, addresses from kvs where addr = ?"
      ~bind:[| Sqlite.Integer (Int64.of_string addr) |]
  in
  match rows with
  | [] -> None
  | row :: _ ->
      (match row_text row 0 with
       | None -> None
       | Some content ->
           let payload = Storage_codec.decode content in
           (* cljs-written branch nodes have no :children in content;
              merge the addresses column. *)
           let payload =
             match payload with
             | Storage_node (Persistent_sorted_set.Leaf keys) ->
                 (match row_text row 1 with
                  | Some json ->
                      (match Storage_codec.decode_addresses json with
                       | [] -> payload
                       | children -> Storage_node (Persistent_sorted_set.Branch (keys, children)))
                  | None -> payload)
             | other -> other
           in
           Some payload)

let list_addresses db =
  let rows = Sqlite.query db ~sql:"select addr from kvs" ~bind:[||] in
  List.map row_addr rows

let delete db addrs =
  List.iter
    (fun addr ->
       Sqlite.exec db ~sql:"delete from kvs where addr = ?"
         ~bind:[| Sqlite.Integer (Int64.of_string addr) |])
    addrs

let storage db =
  {
    storage_store = (fun addr_payloads -> store db addr_payloads);
    storage_restore = (fun addr -> restore db addr);
    storage_list_addresses = (fun () -> list_addresses db);
    storage_delete = (fun addrs -> delete db addrs);
  }
