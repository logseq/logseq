(* logseq.common.util.namespace — namespace page helpers. *)

let parent_char = "/"
let namespace_char = "/"

let str_starts_with (s : string) (prefix : string) : bool =
  let n = String.length prefix in
  String.length s >= n && String.sub s 0 n = prefix

let str_contains (s : string) (sub : string) : bool =
  let n = String.length sub in
  let rec go i =
    if i + n > String.length s then false
    else if String.sub s i n = sub then true
    else go (i + 1)
  in
  n = 0 || go 0

let url (s : string) : bool =
  (* common-util/url? — `new URL(s).origin` is non-null: a scheme:// rest
     whose scheme produces a real origin (file/data/javascript give "null"). *)
  match String.index_opt s ':' with
  | None -> false
  | Some i ->
    let scheme = String.sub s 0 i in
    let is_scheme =
      String.length scheme > 0
      && (match scheme.[0] with 'a'..'z' | 'A'..'Z' -> true | _ -> false)
      && String.for_all
           (fun c ->
             match c with
             | 'a'..'z' | 'A'..'Z' | '0'..'9' | '+' | '.' | '-' -> true
             | _ -> false)
           scheme
    in
    is_scheme
    && i + 2 < String.length s
    && s.[i + 1] = '/' && s.[i + 2] = '/'
    && not (List.mem scheme [ "file"; "data"; "javascript"; "blob"; "about" ])

let namespace_page (page_name : string option) : bool =
  match page_name with
  | Some s ->
    str_contains s namespace_char
    && String.trim s <> namespace_char
    && not (str_starts_with s "../")
    && not (str_starts_with s "./")
    && not (url s)
  | None -> false

let split_on_char (sep : char) (s : string) : string list =
  String.split_on_char sep s

let get_last_part (page_name : string) : string =
  if namespace_page (Some page_name) then
    match List.rev (split_on_char '/' page_name) with
    | h :: _ -> h
    | [] -> page_name
  else page_name

(* text/get-nested-page-name — [[a/b]] inner page inside page-ref markup *)
let get_nested_page_name (s : string) : string option =
  (* text/get-nested-page-name — first match of /\[\[([^\[\]]+)\]\]/ *)
  let n = String.length s in
  let rec find_open i =
    if i + 1 >= n then None
    else if s.[i] = '[' && s.[i + 1] = '[' then
      (match find_close (i + 2) with
       | Some j -> Some (String.sub s (i + 2) (j - i - 2))
       | None -> None)
    else find_open (i + 1)
  and find_close i =
    if i + 1 >= n then None
    else if s.[i] = '[' then None
    else if s.[i] = ']' && s.[i + 1] = ']' then Some i
    else find_close (i + 1)
  in
  find_open 0

let split_last (sep : string) (s : string) : string * string option =
  (* common-util/split-last *)
  let n = String.length sep in
  let rec last i =
    if i + n > String.length s then -1
    else if String.sub s i n = sep then i
    else last (i + 1)
  in
  let j = last 0 in
  if j = -1 then (s, None)
  else (String.sub s 0 j, Some (String.sub s (j + n) (String.length s - j - n)))

let split_namespace_pages (page_name : string) : string list =
  (* common-util/split-namespace-pages — "a/b/c" -> ["a"; "a/b"; "a/b/c"] *)
  let parts = List.filter (fun p -> String.trim p <> "") (split_on_char '/' page_name) in
  let rec go acc prefix = function
    | [] -> List.rev acc
    | p :: rest ->
      let cur = if prefix = "" then p else prefix ^ "/" ^ p in
      go (cur :: acc) cur rest
  in
  go [] "" parts
