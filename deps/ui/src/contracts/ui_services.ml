type storage = {
  get : string -> string option;
  set : string -> string -> unit;
  remove : string -> unit;
}

type t = {
  storage : storage;
  literal_text : string -> string;
  request_flush : unit -> unit;
  assert_owner : unit -> unit;
}

let installed : t option ref = ref None
let install services = match !installed with
  | Some _ -> invalid_arg "UI services already installed"
  | None -> services.assert_owner (); installed := Some services
let get () = match !installed with
  | None -> invalid_arg "UI services not installed"
  | Some services -> services.assert_owner (); services

let storage_get key = (get ()).storage.get key
let storage_set key value = (get ()).storage.set key value
let storage_remove key = (get ()).storage.remove key
let literal_text value = (get ()).literal_text value
let request_flush () = (get ()).request_flush ()
