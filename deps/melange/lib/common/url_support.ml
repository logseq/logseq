type t

external make : string -> t = "URL" [@@mel.new]
external origin : t -> string = "origin" [@@mel.get]
external protocol : t -> string = "protocol" [@@mel.get]
external host : t -> string = "host" [@@mel.get]
external pathname : t -> string = "pathname" [@@mel.get]

let can_parse value =
  try
    ignore (make value);
    true
  with _ -> false
