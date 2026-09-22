type kind =
  | Browser_worker
  | Node
  | Native

val kind : unit -> kind
val env : string -> string option

(* os/homedir — raises Invalid_argument in the browser worker, where no
   home directory exists. *)
val home_dir : unit -> string

(* cljs platform env :owner-source — browser worker gets it from the
   "electron"/"capacitor" URL search params; node from daemon config. *)
val electron_owner : unit -> bool

(* Generalized owner source: "browser" | "capacitor" | "electron" |
   "cli" | "unknown". Browser reads URL search params; node/native
   read LOGSEQ_OWNER_SOURCE (native defaults to "cli"). *)
val owner_source : unit -> string

(* cljs :publishing? env flag — the browser worker reads
   "publishing=true" from the page URL; false elsewhere. *)
val publishing : unit -> bool
