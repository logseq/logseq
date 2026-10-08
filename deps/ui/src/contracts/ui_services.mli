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

val install : t -> unit
(* Install once before creating the application. Service calls require the
   owning application context, and raw preferences keep their existing format. *)
val storage_get : string -> string option
val storage_set : string -> string -> unit
val storage_remove : string -> unit
val literal_text : string -> string
val request_flush : unit -> unit
