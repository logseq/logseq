(* js/URL for the daemon's request router. *)

type t = Js.Json.t

external url_ : string -> string -> t = "URL" [@@mel.new]

let parse ~base s = url_ s base

external pathname : t -> string = "pathname" [@@mel.get]
external search_params : t -> Js.Json.t = "searchParams" [@@mel.get]
external param_get : Js.Json.t -> string -> string Js.null = "get" [@@mel.send]

let search_param t k =
  Js.nullToOption (param_get (search_params t) k)
