type keyword = Melange_edn_melange.keyword Melange_edn_melange.t
type graph = string
type repo = string
type db_id = int64
type uuid = string
type path = string
type url = string
type email = string
type shell = Bash | Zsh
type port = int
type pid = int
type owner_source = Cli | Electron | Unknown | Other of string

type ds_where_clause =
  | V of Melange_edn_melange.vector Melange_edn_melange.t
  | L of Melange_edn_melange.list_ Melange_edn_melange.t

type datascript_query = {
  find : Melange_edn_melange.any Rrbvec.t;
  in_ : Melange_edn_melange.symbol Melange_edn_melange.t Rrbvec.t option;
  where : ds_where_clause Rrbvec.t;
}

let trim = String.trim
let db_version_prefix = "logseq_db_"

let starts_with ~prefix value =
  let prefix_len = String.length prefix in
  String.length value >= prefix_len && String.sub value 0 prefix_len = prefix

let create_graph value = String.trim value

let create_repo value =
  let value = String.trim value in
  if starts_with ~prefix:db_version_prefix value then value
  else db_version_prefix ^ value

let string_of_graph graph = graph
let string_of_repo repo = repo

let non_empty s =
  let s = trim s in
  if s = "" then None else Some s

let is_uuid_hex = function
  | '0' .. '9' | 'a' .. 'f' | 'A' .. 'F' -> true
  | _ -> false

let is_uuid_string s =
  let s = String.trim s in
  let valid_char idx ch =
    match idx with 8 | 13 | 18 | 23 -> ch = '-' | _ -> is_uuid_hex ch
  in
  let rec loop idx =
    idx = String.length s || (valid_char idx s.[idx] && loop (idx + 1))
  in
  String.length s = 36 && loop 0

let shell_of_string = function
  | "bash" -> Some Bash
  | "zsh" -> Some Zsh
  | _ -> None

let string_of_owner_source = function
  | Cli -> "cli"
  | Electron -> "electron"
  | Unknown -> "unknown"
  | Other s -> s

let make_datascript_query ~find ?in_ ~where () =
  let in_ =
    match in_ with
    | None -> None
    | Some values when Vec.is_empty values -> None
    | Some values -> Some values
  in
  { find; in_; where }

let datascript_query_to_edn query =
  let input_clause =
    match query.in_ with
    | None -> Vec.empty
    | Some inputs ->
        Vec.push_front
          (inputs |> Vec.map (fun value -> Edn_util.any value))
          (Edn_util.keyword "in")
  in
  let where_clause = function
    | V value -> Edn_util.any value
    | L value -> Edn_util.any value
  in
  Edn_util.vector_t_vec
    (Vec.append
       (Vec.push_front query.find (Edn_util.keyword "find"))
       (Vec.append input_clause
          (Vec.push_front
             (query.where |> Vec.map where_clause)
             (Edn_util.keyword "where"))))
