type t = private string
(** unicode string *)

val of_string : string -> t
(** convert utf8-encoded byte string to unicode string *)

val to_string : t -> string
(** identity *)
