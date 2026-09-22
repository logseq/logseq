(* cljs.reader / clojure.edn read+write bridge via melange-edn-core and the
   Datascript value domain used by the graph-parser port. *)

open Datascript

exception Edn_error of string

(* ---- EDN -> value ---- *)

let rec value_of_edn (Edn_parser.Any v) : value =
  match v with
  | Edn_parser.Nil -> Nil
  | Edn_parser.Bool b -> Bool b
  | Edn_parser.String s -> String s
  | Edn_parser.Char u -> String (let b = Buffer.create 4 in Buffer.add_utf_8_uchar b u; Buffer.contents b)
  | Edn_parser.Symbol s -> Symbol s
  | Edn_parser.Keyword k -> Keyword (Edn_parser.keyword_to_string k)
  | Edn_parser.Int n ->
      if Int64.abs n <= Int64.of_int max_int then Int (Int64.to_int n) else Instant n
  | Edn_parser.Bigint s -> Int (int_of_string_opt s |> Option.value ~default:0)
  | Edn_parser.Float f -> Float f
  | Edn_parser.Decimal s -> Float (float_of_string_opt s |> Option.value ~default:0.0)
  | Edn_parser.Ratio s -> Float (float_of_string_opt s |> Option.value ~default:0.0)
  | Edn_parser.Regex s -> Regex s
  | Edn_parser.List xs -> List (List.map value_of_edn (Array.to_list xs))
  | Edn_parser.Vector xs -> Vector (List.map value_of_edn (Array.to_list xs))
  | Edn_parser.Map kvs ->
    Map (List.map (fun (k, v) -> (value_of_edn k, value_of_edn v)) (Array.to_list kvs))
  | Edn_parser.Set xs -> Set (List.map value_of_edn (Array.to_list xs))
  | Edn_parser.Tagged (t, v) -> Tuple [ Some (Symbol t); Some (value_of_edn v) ]

(* edn/read-string: reads the first form *)
let read_string (s : string) : value = value_of_edn (Edn_parser.of_edn_string s)

(* common-util/safe-read-string *)
let safe_read_string (content : string) : value option =
  try Some (read_string content)
  with _ ->
    Worker_log.error "parse/read-string-failed" [ ("content", content) ];
    None

(* common-util/safe-read-map-string — {} on parse failure *)
let safe_read_map_string (content : string) : value =
  try read_string content
  with _ ->
    Worker_log.error "parse/read-string-failed" [ ("content", content) ];
    Map []

(* common-util/valid-edn-keyword? *)
let valid_edn_keyword (s : string) : bool =
  String.length s > 0 && s.[0] = ':'
  &&
  (try
     ignore (Edn_parser.of_edn_string ("{" ^ s ^ " nil}"));
     true
   with _ -> false)

(* ---- value -> EDN string (cljs pr-str subset) ---- *)

let utf8_len (s : string) : int = String.length s

let buffer_add_edn_escaped buf s =
  Buffer.add_char buf '"';
  String.iter
    (fun c ->
      match c with
      | '"' -> Buffer.add_string buf "\\\""
      | '\\' -> Buffer.add_string buf "\\\\"
      | '\n' -> Buffer.add_string buf "\\n"
      | '\t' -> Buffer.add_string buf "\\t"
      | '\r' -> Buffer.add_string buf "\\r"
      | _ -> Buffer.add_char buf c)
    s;
  Buffer.add_char buf '"'

let rec pr_str_to buf (v : value) : unit =
  match v with
  | Nil -> Buffer.add_string buf "nil"
  | Bool b -> Buffer.add_string buf (if b then "true" else "false")
  | Int n -> Buffer.add_string buf (string_of_int n)
  | Float f ->
    let s = Printf.sprintf "%g" f in
    Buffer.add_string buf s
  | String s -> buffer_add_edn_escaped buf s
  | Symbol s -> Buffer.add_string buf s
  | Keyword s -> Buffer.add_string buf (":" ^ s)
  | Uuid s -> Buffer.add_string buf ("#uuid \"" ^ s ^ "\"")
  | Instant _ -> Buffer.add_string buf "#inst"
  | Regex s -> Buffer.add_string buf ("#\"" ^ s ^ "\"")
  | Ref n -> Buffer.add_string buf (string_of_int n)
  | Ref_to _ -> Buffer.add_string buf "<ref>"
  | TxRef -> Buffer.add_string buf ":db/current-tx"
  | List xs -> pr_seq_to buf "(" ")" xs
  | Vector xs -> pr_seq_to buf "[" "]" xs
  | Set xs -> pr_seq_to buf "#{" "}" xs
  | Map kvs ->
    Buffer.add_char buf '{';
    List.iteri
      (fun i (k, v) ->
        if i > 0 then Buffer.add_char buf ' ';
        pr_str_to buf k;
        Buffer.add_char buf ' ';
        pr_str_to buf v)
      kvs;
    Buffer.add_char buf '}'
  | Tuple vs ->
    pr_seq_to buf "[" "]" (List.filter_map Fun.id vs)

and pr_seq_to buf open_ close xs =
  Buffer.add_string buf open_;
  List.iteri
    (fun i v ->
      if i > 0 then Buffer.add_char buf ' ';
      pr_str_to buf v)
    xs;
  Buffer.add_string buf close

let pr_str (v : value) : string =
  let buf = Buffer.create 64 in
  pr_str_to buf v;
  Buffer.contents buf
