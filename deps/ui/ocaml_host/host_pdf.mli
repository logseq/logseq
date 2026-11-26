val page_count : string -> int
val page_size : string -> int -> float * float
val render_ppm : string -> int -> float -> Bytes.t
val selection_json : string -> int -> float -> float -> float -> float -> string
val reset_for_tests : unit -> unit
