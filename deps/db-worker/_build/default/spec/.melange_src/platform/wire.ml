# 1 "spec/platform/wire.ml"
(* Closed wire-value type shared by all endpoints and codecs.
   Mirrors the transit Json.value domain; each runtime's Transit_codec
   converts between this and its transit backend's value type. *)
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

type mode =
  | Normal
  | Verbose

let nil = Nil
let keyword s = Keyword s
let symbol s = Symbol s
let string s = String s
let int n = Int n
let int64 n = Int64 n
let float f = Float f
let bool b = Bool b
let uuid s = Uuid s
let binary s = Binary s
let date_ms ms = Date_ms ms
let array xs = Array xs
let list_ xs = List xs
let map kvs = Map kvs
let set xs = Set xs
let tagged tag rep = Tagged (tag, rep)
let kw_map entries = Map (List.map (fun (k, v) -> (Keyword k, v)) entries)

let key_matches k = function
  | Keyword s | String s -> String.equal s k
  | _ -> false

let get k = function
  | Map entries -> List.find_map (fun (ek, v) -> if key_matches k ek then Some v else None) entries
  | _ -> None

let get_exn k t = match get k t with Some v -> v | None -> invalid_arg ("missing key :" ^ k)

let nth t n =
  match t with
  | Array xs | List xs -> List.nth_opt xs n
  | _ -> None

let as_string = function
  | String s -> Some s
  | _ -> None

let as_keyword = function
  | Keyword s -> Some s
  | _ -> None

let as_keyword_exn = function
  | Keyword s -> s
  | _ -> invalid_arg "expected keyword wire value"

let as_int = function
  | Int n -> Some n
  | Int64 n -> Some (Int64.to_int n)
  | _ -> None

let as_int64 = function
  | Int n -> Some (Int64.of_int n)
  | Int64 n -> Some n
  | _ -> None

let as_float = function
  | Float f -> Some f
  | Int n -> Some (Float.of_int n)
  | Int64 n -> Some (Int64.to_float n)
  | _ -> None

let as_bool = function
  | Bool b -> Some b
  | _ -> None

let as_seq = function
  | Array xs | List xs | Set xs -> xs
  | _ -> []

let as_map = function
  | Map entries -> entries
  | _ -> []

let as_uuid = function
  | Uuid s -> Some s
  | _ -> None

let as_tagged = function
  | Tagged (tag, rep) -> Some (tag, rep)
  | _ -> None

let is_nil = function
  | Nil -> true
  | _ -> false
