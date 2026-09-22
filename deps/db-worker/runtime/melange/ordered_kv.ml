(* Ordered hex-key store over sqlite (datascript-sqlite IOrderedKV
   semantics: [begin,end) half-open, set-membership only). *)
type t = { table : string; db : Sqlite.db }

let make db =
  let t = { table = "keys"; db } in
  Sqlite.exec db ~sql:"create table if not exists keys (k text primary key)" ~bind:[||];
  t

let text s = Sqlite.Text s

let range t ~begin_ ~end_ ~reverse =
  let order = if reverse then "desc" else "asc" in
  let rows =
    Sqlite.query t.db
      ~sql:(Printf.sprintf "select k from %s where k >= ? and k < ? order by k %s" t.table order)
      ~bind:[| text begin_; text end_ |]
  in
  List.filter_map
    (fun row -> match row.(0) with Sqlite.Text k -> Some k | _ -> None)
    rows

let put t keys =
  List.iter
    (fun k ->
       Sqlite.exec t.db
         ~sql:(Printf.sprintf "insert or ignore into %s (k) values (?)" t.table)
         ~bind:[| text k |])
    keys

let delete_range t ~begin_ ~end_ =
  Sqlite.exec t.db
    ~sql:(Printf.sprintf "delete from %s where k >= ? and k < ?" t.table)
    ~bind:[| text begin_; text end_ |]
