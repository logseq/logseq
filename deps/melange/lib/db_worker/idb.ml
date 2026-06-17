type indexed_db
type open_request
type database
type transaction
type object_store
type request
type global
type window

type store = {
  db_name : string;
  store_name : string;
  version : int;
  mutable dbp : database Js.Promise.t option;
}

external global_this : global = "globalThis"

external window : global -> window option = "window"
[@@mel.get] [@@mel.return { undefined_to_opt }]

external window_indexed_db : window -> indexed_db option = "indexedDB"
[@@mel.get] [@@mel.return { undefined_to_opt }]

external global_indexed_db : global -> indexed_db option = "indexedDB"
[@@mel.get] [@@mel.return { undefined_to_opt }]

external open_ : indexed_db -> string -> int -> open_request = "open"
[@@mel.send]

external result : open_request -> database = "result" [@@mel.get]

external set_onerror : open_request -> (unit -> unit) -> unit = "onerror"
[@@mel.set]

external set_onsuccess : open_request -> (unit -> unit) -> unit = "onsuccess"
[@@mel.set]

external set_onupgradeneeded : open_request -> (unit -> unit) -> unit
  = "onupgradeneeded"
[@@mel.set]

external create_object_store : database -> string -> object_store
  = "createObjectStore"
[@@mel.send]

external transaction_ : database -> string -> string -> transaction
  = "transaction"
[@@mel.send]

external object_store : transaction -> string -> object_store = "objectStore"
[@@mel.send]

external set_tx_oncomplete : transaction -> (unit -> unit) -> unit
  = "oncomplete"
[@@mel.set]

external set_tx_onabort : transaction -> (unit -> unit) -> unit = "onabort"
[@@mel.set]

external set_tx_onerror : transaction -> (unit -> unit) -> unit = "onerror"
[@@mel.set]

external get_ : object_store -> string -> request = "get" [@@mel.send]
external put : object_store -> Js.Json.t -> string -> unit = "put" [@@mel.send]
external delete : object_store -> string -> unit = "delete" [@@mel.send]

external request_result : request -> Js.Json.t option = "result"
[@@mel.get] [@@mel.return { undefined_to_opt }]

let indexed_db () =
  match window global_this with
  | Some window -> window_indexed_db window
  | None -> global_indexed_db global_this

let new_store db_name store_name version =
  { db_name; store_name; version; dbp = None }

let default_store = ref None

let store () =
  match !default_store with
  | Some store -> store
  | None ->
      let store = new_store "localforage" "keyvaluepairs" 2 in
      default_store := Some store;
      store

let init store =
  match store.dbp with
  | Some dbp -> dbp
  | None ->
      let dbp =
        Js.Promise.make (fun ~resolve ~reject ->
            match indexed_db () with
            | None -> reject (Failure "indexedDB is not available") [@u]
            | Some idb ->
                let request = open_ idb store.db_name store.version in
                set_onerror request (fun () ->
                    (reject (Failure "indexedDB open failed") [@u]));
                set_onsuccess request (fun () ->
                    (resolve (result request) [@u]));
                set_onupgradeneeded request (fun () ->
                    ignore
                      (create_object_store (result request) store.store_name
                        : object_store)))
      in
      store.dbp <- Some dbp;
      dbp

let with_idb_store tx_type callback =
  let store = store () in
  init store
  |> Js.Promise.then_ (fun db ->
      Js.Promise.make (fun ~resolve ~reject ->
          let tx = transaction_ db store.store_name tx_type in
          set_tx_oncomplete tx (fun () -> (resolve true [@u]));
          set_tx_onabort tx (fun () ->
              (reject (Failure "indexedDB transaction aborted") [@u]));
          set_tx_onerror tx (fun () ->
              (reject (Failure "indexedDB transaction failed") [@u]));
          callback (object_store tx store.store_name);
          ()))

let get_item key =
  let request = ref None in
  with_idb_store "readonly" (fun store -> request := Some (get_ store key))
  |> Js.Promise.then_ (fun _ ->
      match !request with
      | None -> Js.Promise.resolve None
      | Some request -> Js.Promise.resolve (request_result request))

let set_item key value =
  with_idb_store "readwrite" (fun store -> put store value key)
  |> Js.Promise.then_ (fun _ -> Js.Promise.resolve ())

let remove_item key =
  with_idb_store "readwrite" (fun store -> delete store key)
  |> Js.Promise.then_ (fun _ -> Js.Promise.resolve ())
