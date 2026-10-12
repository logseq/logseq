type t
type element = Yojson.Safe.t
type rect = { x : float; y : float; width : float; height : float }
type sdk_namespace = Api | Ui | Utils | Assets | Experiments | Debug
exception Timeout of string

val poll : ?timeout:float -> string -> (unit -> 'a option) -> 'a
val create : ?root:string -> ?on_input:(unit -> unit) -> ?on_sdk_call:(unit -> unit) -> repo:string -> artifacts:string -> label:string -> unit -> t
val start : t -> unit
val close : t -> unit
val request : t -> string -> (string * Yojson.Safe.t) list -> Yojson.Safe.t
val status : t -> Yojson.Safe.t
val snapshot : t -> element list
val query : t -> string -> element list
val rect : element -> rect
val text_content : element -> string
val attr : element -> string -> string option
val wait_for : ?timeout:float -> ?text:string -> t -> string -> element list
val move : ?dx:int -> ?dy:int -> t -> int -> int -> unit
val button : ?button:int -> ?clicks:int -> ?modifiers:int -> t -> down:bool -> int -> int -> unit
val click_at : ?button:int -> ?clicks:int -> ?modifiers:int -> t -> int -> int -> unit
val click : ?text:string -> ?index:int -> ?button:int -> ?clicks:int -> ?modifiers:int -> t -> string -> unit
val drag : ?steps:int -> ?modifiers:int -> t -> int * int -> int * int -> unit
val key : ?modifiers:int -> t -> down:bool -> int -> unit
val press : t -> string -> unit
val text : t -> string -> unit
val fill : t -> string -> string -> unit
val wheel : ?x:int -> ?modifiers:int -> t -> int -> unit
val focused : t -> int
val clipboard_read : t -> string
val clipboard_write : t -> string -> unit
val read : ?repo:string -> t -> string -> Wire.t list -> Wire.t
val validate : ?repo:string -> t -> Wire.t
val invoke_fixture : ?repo:string -> t -> string -> Wire.t list -> Wire.t
val q : ?repo:string -> ?inputs:Wire.t list -> t -> string -> Wire.t
val sdk_call : ?namespace:sdk_namespace -> t -> string -> Yojson.Safe.t list -> Yojson.Safe.t
val daemon : ?repo:string -> t -> int * string * string
val restart : ?daemon:bool -> t -> unit -> unit
val reload : t -> unit
val screenshot : ?name:string -> t -> string
val evidence : t -> string -> unit
val root : t -> string
val settings : t -> string
val artifacts : t -> string
val input_count : t -> int
val sdk_calls : t -> int
