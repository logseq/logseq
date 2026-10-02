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

(* transit vectors may decode as Array|List|Set — treat all three as seqs *)
let elems = function
  | Array xs | List xs | Set xs -> xs
  | _ -> []

(* get-blocks result element: {id, block} pair map — the entity is the
   "block" slot, or the second positional element of the pair vector *)
let block_of_pair pair =
  match get pair "block" with
  | Some res -> Some res
  | None -> (
      match elems pair with
      | [ _; res ] -> Some res
      | _ -> None)

(* uuid-string check (36-char canonical form) — cljs uuid-string? *)
let is_uuid_char c =
  ('0' <= c && c <= '9') || ('a' <= c && c <= 'f') || ('A' <= c && c <= 'F')
  || c = '-'

let is_uuid_string s =
  String.length s = 36
  && String.get s 8 = '-'
  && String.get s 13 = '-'
  && String.get s 18 = '-'
  && String.get s 23 = '-'
  && String.for_all is_uuid_char (String.sub s 0 8)

(* ref wire for get-page-blocks-tree / get-page-route-info: Uuid for uuid
   strings, String for page names (Ldb.get_page accepts Uuid/String/Int64
   only — a [:block/uuid u] lookup-ref vector decodes to Vector and
   returns no page) *)
let page_ref s = if is_uuid_string s then Uuid s else String s
