val to_snake_case : string -> string
external json_stringify : 'a -> string = "stringify" [@@mel.scope "JSON"]
external json_parse : string -> 'a = "parse" [@@mel.scope "JSON"]
val ls_api_call : Env.t -> string -> 'a -> 'b Js.Promise.t
external get_index : 'a -> string -> 'b Js.Nullable.t = "" [@@mel.get_index]
external nullable : 'a -> 'a Js.Nullable.t = "%identity"
val get : 'a -> string -> 'b Js.Nullable.t
val get_string : 'a -> string -> 'b option
val get_int : 'a -> string -> int option
val get_float : 'a -> string -> float option
val get_bool : 'a -> string -> 'b option
val get_list : 'b -> string -> 'a array option
val get_raw : 'a -> string -> 'b
val get_uuid : 'a -> 'b -> 'c option
val get_id : 'a -> 'b -> int option
val str : string -> Js.Json.t
val num : float -> Js.Json.t
val bool : bool -> Js.Json.t
val arr : Js.Json.t array -> Js.Json.t
val obj : (Js.Dict.key * Js.Json.t) list -> Js.Json.t
val null : Js.Json.t
