type kind =
  | Browser_worker
  | Node
  | Native

val kind : unit -> kind
val env : string -> string option
