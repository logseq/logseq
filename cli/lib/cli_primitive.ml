type keyword = Melange_edn.keyword Melange_edn.t
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

let keyword_name kw =
  match kw with
  | Melange_edn.Keyword kw -> (
      let kw = Melange_edn.keyword_to_string kw in
      match String.rindex_opt kw '/' with
      | Some i -> String.sub kw (i + 1) (String.length kw - i - 1)
      | None -> String.trim kw)

let keyword_namespace kw =
  match kw with
  | Melange_edn.Keyword kw -> (
      let kw = Melange_edn.keyword_to_string kw in
      match String.rindex_opt kw '/' with
      | Some i -> Some (String.sub kw 0 i)
      | None -> None)

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

let uuid_of_string s = if is_uuid_string s then Some s else None
let string_of_shell = function Bash -> "bash" | Zsh -> "zsh"

let shell_of_string = function
  | "bash" -> Some Bash
  | "zsh" -> Some Zsh
  | _ -> None

let owner_source_of_string = function
  | None -> Unknown
  | Some "cli" -> Cli
  | Some "electron" -> Electron
  | Some "" -> Unknown
  | Some s -> Other s

let string_of_owner_source = function
  | Cli -> "cli"
  | Electron -> "electron"
  | Unknown -> "unknown"
  | Other s -> s
