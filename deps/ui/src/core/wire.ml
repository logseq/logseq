(* Wire.t — transit-decoded value tree shared with the db-worker protocol.
   Mirrors deps/db-worker/lib/wire.ml. *)

type t =
  | Nil
  | Bool of bool
  | String of string
  | Int of int
  | Int64 of int64
  | Float of float
  | Binary of string
  | Keyword of string
  | Symbol of string
  | Big_decimal of string
  | Big_int of string
  | Date_ms of int64
  | Uuid of string
  | Uri of string
  | Array of t list
  | List of t list
  | Map of (t * t) list
  | Set of t list
  | Tagged of string * t

let kw s = Keyword s
let str s = String s

let as_string = function
  | String s -> Some s
  | _ -> None

let as_int = function
  | Int n -> Some n
  | Int64 n -> Some (Int64.to_int n)
  | _ -> None

let as_bool = function
  | Bool b -> Some b
  | _ -> None

let as_keyword = function
  | Keyword s -> Some s
  | _ -> None

let as_uuid = function
  | Uuid s -> Some s
  | String s -> Some s
  | _ -> None

let rec get map key =
  match map with
  | Map kvs -> get_key kvs key
  | _ -> None

and get_key kvs key =
  match kvs with
  | [] -> None
  | (k, v) :: rest ->
      let matches =
        match k with
        | Keyword s | String s | Symbol s -> s = key
        | _ -> false
      in
      if matches then Some v else get_key rest key

let map_get map key = get map key

let map_get_string map key = Option.bind (get map key) as_string
let map_get_int map key = Option.bind (get map key) as_int
let map_get_uuid map key = Option.bind (get map key) as_uuid

let args_list = function
  | Array xs | List xs -> xs
  | _ -> []

let nth_arg args n =
  match args with
  | Array xs | List xs -> List.nth_opt xs n
  | _ -> None
