(* js/URL parsing for the db-worker-node request router
   (new URL(req.url, "http://127.0.0.1")). Melange wraps the URL
   class; native raises [Invalid_argument]. *)

type t

val parse : base:string -> string -> t
val pathname : t -> string
val search_param : t -> string -> string option
