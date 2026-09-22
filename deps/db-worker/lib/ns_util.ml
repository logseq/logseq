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

(* `new URL(s)` parseability — approximates the WHATWG basic URL parser:
   leading/trailing C0-control-or-space are trimmed and tab/LF/CR removed
   before parsing; then a `scheme:` prefix is required; special schemes
   need a valid host; non-special `//` authorities follow opaque-host
   rules; anything else parses. *)
type url_parse = { scheme : string; rest : string }

let special_schemes = [ "http"; "https"; "ws"; "wss"; "ftp" ]

let is_scheme_start c =
  (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')

let is_scheme_char c =
  is_scheme_start c || (c >= '0' && c <= '9') || c = '+' || c = '-' || c = '.'

let is_forbidden_host_char c =
  Char.code c <= 0x20 || Char.code c = 0x7f
  ||
  match c with
  | '"' | '#' | '<' | '>' | '?' | '[' | '\\' | ']' | '^' | '|' | '{' | '}' ->
      true
  | _ -> false

let all_digits s = String.for_all (fun c -> c >= '0' && c <= '9') s

let is_hex c =
  (c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F')

(* every '%' must start a 2-hex percent-encoding (special-scheme hosts) *)
let valid_pct (s : string) : bool =
  let n = String.length s in
  let rec go i =
    if i >= n then true
    else if s.[i] = '%' then i + 2 < n && is_hex s.[i + 1] && is_hex s.[i + 2] && go (i + 3)
    else go (i + 1)
  in
  go 0

(* authority = the part before the next / ? # — userinfo is skipped; the
   host+port must have no forbidden chars, an IPv6 literal must be
   bracketed, and a ':'-delimited port must be digits-or-empty. *)
let valid_authority ~special (authority : string) : bool =
  if String.exists is_forbidden_host_char authority then false
  else if special && not (valid_pct authority) then false
  else
    let host_port =
      match String.rindex_opt authority '@' with
      | Some i ->
          String.sub authority (i + 1) (String.length authority - i - 1)
      | None -> authority
    in
    if str_starts_with host_port "[" then
      match String.index_opt host_port ']' with
      | None -> false
      | Some j ->
          j >= 2 (* non-empty IPv6 literal *)
          &&
          let after =
            String.sub host_port (j + 1) (String.length host_port - j - 1)
          in
          after = ""
          || (str_starts_with after ":"
              && all_digits (String.sub after 1 (String.length after - 1)))
    else
      match String.rindex_opt host_port ':' with
      | None -> true
      | Some j ->
          all_digits
            (String.sub host_port (j + 1) (String.length host_port - j - 1))

let drop_leading c s =
  let n = String.length s in
  let i = ref 0 in
  while !i < n && s.[!i] = c do incr i done;
  String.sub s !i (n - !i)

let take_authority (s : string) : string =
  let n = String.length s in
  let i = ref 0 in
  while !i < n && s.[!i] <> '/' && s.[!i] <> '?' && s.[!i] <> '#' do incr i done;
  String.sub s 0 !i

let url_parse (s : string) : url_parse option =
  let n0 = String.length s in
  let lo = ref 0 and hi = ref (n0 - 1) in
  while !lo < n0 && Char.code s.[!lo] <= 0x20 do incr lo done;
  while !hi >= !lo && Char.code s.[!hi] <= 0x20 do decr hi done;
  let b = Buffer.create (!hi - !lo + 1) in
  for k = !lo to !hi do
    match s.[k] with '\t' | '\n' | '\r' -> () | c -> Buffer.add_char b c
  done;
  let t = Buffer.contents b in
  match String.index_opt t ':' with
  | None -> None
  | Some i ->
      let scheme = String.sub t 0 i in
      let valid_scheme =
        String.length scheme > 0
        && is_scheme_start scheme.[0]
        && String.for_all is_scheme_char scheme
      in
      if not valid_scheme then None
      else
        let scheme = Unicode.lowercase scheme in
        let rest = String.sub t (i + 1) (String.length t - i - 1) in
        if List.mem scheme special_schemes then
          let authority = take_authority (drop_leading '/' rest) in
          if authority = "" || not (valid_authority ~special:true authority)
          then None
          else Some { scheme; rest }
        else if str_starts_with rest "//" then
          let authority =
            take_authority (String.sub rest 2 (String.length rest - 2))
          in
          (* `file:` and non-special schemes allow an empty host *)
          if authority = "" || valid_authority ~special:false authority
          then Some { scheme; rest }
          else None
        else Some { scheme; rest }

let url_parses (s : string) : bool = Option.is_some (url_parse s)

let url (s : string) : bool =
  (* common-util/url? — `new URL(s).origin` ∉ #{nil "null"}: only the
     special schemes produce a real origin — file/data/javascript and
     every non-special scheme give "null" — except blob: which inherits
     the inner URL's origin. *)
  match url_parse s with
  | Some p ->
      List.mem p.scheme special_schemes
      || (p.scheme = "blob"
          &&
          match url_parse p.rest with
          | Some inner -> List.mem inner.scheme special_schemes
          | None -> false)
  | None -> false

let namespace_page (page_name : string option) : bool =
  match page_name with
  | Some s ->
    str_contains s namespace_char
    && Unicode.trim s <> namespace_char
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
  let parts = List.filter (fun p -> Unicode.trim p <> "") (split_on_char '/' page_name) in
  let rec go acc prefix = function
    | [] -> List.rev acc
    | p :: rest ->
      let cur = if prefix = "" then p else prefix ^ "/" ^ p in
      go (cur :: acc) cur rest
  in
  go [] "" parts
