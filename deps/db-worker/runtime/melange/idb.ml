(* localStorage-backed string KV for node/browser dev; IDB adapter
   for durable browser state lands with the offline port. *)
external local_storage : < .. > Js.t option = "localStorage" [@@mel.scope "globalThis"] [@@mel.return { undefined_to_opt }]

external ls_get : < .. > Js.t -> string -> string option = "getItem"
  [@@mel.send] [@@mel.return { null_to_opt }]

external ls_set : < .. > Js.t -> string -> string -> unit = "setItem" [@@mel.send]
external ls_remove : < .. > Js.t -> string -> unit = "removeItem" [@@mel.send]
external ls_length : < .. > Js.t -> int = "length" [@@mel.get]
external ls_key : < .. > Js.t -> int -> string option = "key" [@@mel.send] [@@mel.return { null_to_opt }]

let not_available () = Db_worker_effect.error (Failure "Idb: localStorage unavailable in this runtime")

let get key =
  match local_storage with
  | Some ls -> Db_worker_effect.pure (ls_get ls key)
  | None -> not_available ()

let set key value =
  match local_storage with
  | Some ls -> ls_set ls key value; Db_worker_effect.pure ()
  | None -> not_available ()

let delete key =
  match local_storage with
  | Some ls -> ls_remove ls key; Db_worker_effect.pure ()
  | None -> not_available ()

let keys () =
  match local_storage with
  | Some ls ->
      let n = ls_length ls in
      let rec go i acc =
        if i >= n then List.rev acc else go (i + 1) (match ls_key ls i with Some k -> k :: acc | None -> acc)
      in
      Db_worker_effect.pure (go 0 [])
  | None -> not_available ()
