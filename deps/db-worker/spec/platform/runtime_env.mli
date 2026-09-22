type kind =
  | Browser_worker
  | Node
  | Native

val kind : unit -> kind
val env : string -> string option

(* cljs platform env :owner-source — browser worker gets it from the
   "electron"/"capacitor" URL search params; node from daemon config. *)
val electron_owner : unit -> bool
