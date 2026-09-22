type kind =
  | Browser_worker
  | Node
  | Native

val kind : unit -> kind
val env : string -> string option

(* cljs platform env :owner-source — browser worker gets it from the
   "electron"/"capacitor" URL search params; node from daemon config. *)
val electron_owner : unit -> bool

(* Generalized owner source: "browser" | "capacitor" | "electron" |
   "cli" | "unknown". Browser reads URL search params; node/native
   read LOGSEQ_OWNER_SOURCE (native defaults to "cli"). *)
val owner_source : unit -> string
