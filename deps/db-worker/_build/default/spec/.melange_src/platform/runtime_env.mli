# 1 "spec/platform/runtime_env.mli"
type kind =
  | Browser_worker
  | Node
  | Native

val kind : unit -> kind
val env : string -> string option
