(* logseq.common.path — path/url helpers used by the graph-parser port.
   1:1 port of the cljs fns; js/URL is implemented by a minimal
   scheme://host/path parser sufficient for file://-style URLs. *)

let starts_with (s : string) (prefix : string) : bool =
  let n = String.length s and m = String.length prefix in
  n >= m && String.sub s 0 m = prefix

let ends_with (s : string) (suffix : string) : bool =
  let n = String.length s and m = String.length suffix in
  n >= m && String.sub s (n - m) m = suffix

let safe_decode_uri_component (uri : string) : string =
  match Common_util.decode_uri_component uri with
  | Some s -> Unicode.nfc s
  | None ->
    Worker_log.error "decode-uri-component-failed" [ ("uri", uri) ];
    uri

let is_file_url (s : string) : bool =
  starts_with s "memory://"  (* special memory fs *)
  || starts_with s "assets://"  (* Electron asset, urlencoded *)
  || starts_with s "file://" (* Electron files *)

(* path/filename *)
let filename (path : string) : string option =
  let fname =
    if ends_with path "/" then None
    else
      match List.rev (String.split_on_char '/' path) with
      | last :: _ -> Some last
      | [] -> Some path
  in
  match fname with
  | Some f when is_file_url path -> Some (safe_decode_uri_component f)
  | _ -> fname

(* path/split-ext *)
let split_ext (path : string) : string * string =
  match filename path with
  | None -> ("", "")
  | Some fname ->
    (match String.rindex_opt fname '.' with
     | Some pos when pos <> 0 ->
       (String.sub fname 0 pos,
        Unicode.lowercase (String.sub fname (pos + 1) (String.length fname - pos - 1)))
     | _ -> (fname, ""))

let file_stem path = fst (split_ext path)
let file_ext path = snd (split_ext path)

(* shared inner loop of path-join-internal / uri-path-join-internal *)
let path_join_impl ~(encode : bool) (segments : string list) : string =
  let segments = List.filter (fun s -> Unicode.trim s <> "") segments in
  let segments =
    List.map
      (fun s ->
        Regexp.replace_all (Regexp.compile "[/\\\\]+")
          ~f:(fun ~match_:_ ~groups:_ ~offset:_ ~input:_ -> "/") s)
      segments
  in
  let split_fn s =
    if s = "/" then [ "" ]
    else
      (* clojure.string/split drops trailing empty strings *)
      let parts = String.split_on_char '/' s in
      let rec drop_trailing_empties = function
        | [] -> []
        | "" :: rest ->
            (match drop_trailing_empties rest with [] -> [] | l -> l)
        | l -> l
      in
      drop_trailing_empties (List.rev parts) |> List.rev
  in
  let join_fn segs =
    match segs with
    | [] -> "."
    | [ "" ] -> "/"
    | _ -> String.concat "/" segs
  in
  (* cljs (remove string/blank? segments) *)
  let segments = List.filter (fun s -> String.trim s <> "") segments in
  let parts =
    List.concat_map split_fn segments
    |> (if encode then List.map Common_util.encode_uri_component else Fun.id)
  in
  let rec reduce acc = function
    | [] -> List.rev acc
    | segment :: rest ->
      let acc' =
        match segment, acc with
        | "", _ -> [ segment ]
        | "..", last :: _ when last = ".." -> segment :: acc
        | "..", "" :: _ -> acc
        | "..", [] -> [ ".." ]
        | "..", _ :: tl -> tl
        | ".", _ -> acc
        | _ -> segment :: acc
      in
      reduce acc' rest
  in
  join_fn (reduce [] parts)

let path_join_internal segments = path_join_impl ~encode:false segments
let uri_path_join_internal segments = path_join_impl ~encode:true segments

(* Re.Pcre has no lookahead — capture the trailing / or end in group 2
   and re-emit it. *)
let win_drive_re = Regexp.compile "^/([a-zA-Z])%3[Aa](/|$)"

let preserve_file_url_win_drive (scheme : string) (encoded_path : string) : string =
  if scheme = "file:" then
    Regexp.replace_all win_drive_re
      ~f:(fun ~match_:_ ~groups ~offset:_ ~input:_ ->
        let tail = match groups.(2) with Some t -> t | None -> "" in
        match groups.(1) with
        | Some drive -> "/" ^ drive ^ ":" ^ tail
        | None -> "/" ^ tail)
      encoded_path
  else encoded_path

(* minimal js/URL for scheme://host/path forms *)
type url_parts = { protocol : string; host : string; pathname : string }

let scheme_re = Regexp.compile "^[a-zA-Z][a-zA-Z0-9_.+-]*:"

let url_parse (s : string) : url_parts option =
  match Regexp.exec scheme_re s with
  | None -> None
  | Some m ->
    let scheme = Option.value ~default:"" m.groups.(0) in
    let rest = String.sub s (String.length scheme) (String.length s - String.length scheme) in
    if not (starts_with rest "//") then
      Some { protocol = scheme; host = ""; pathname = rest }
    else
      (* WHATWG: backslashes count as path separators for file: URLs *)
      let rest' = String.sub rest 2 (String.length rest - 2) in
      let rest' =
        if scheme = "file:" then
          String.map (fun c -> if c = '\\' then '/' else c) rest'
        else rest'
      in
      let host, pathname =
        match Common_util.str_index_of rest' "/" with
        | None -> (rest', "/")
        | Some i ->
          ( String.sub rest' 0 i
          , String.sub rest' i (String.length rest' - i) )
      in
      (* WHATWG: in file: URLs a windows drive letter in host position is
         part of the path, and localhost is dropped *)
      let host, pathname =
        if scheme = "file:" then
          if String.length host = 2 && host.[1] = ':' then
            ("", "/" ^ host ^ pathname)
          else if String.lowercase_ascii host = "localhost" then
            ("", pathname)
          else (host, pathname)
        else (host, pathname)
      in
      (* js/URL pathname excludes query and fragment *)
      let pathname =
        let i =
          match
            ( Common_util.str_index_of pathname "?"
            , Common_util.str_index_of pathname "#" )
          with
          | Some a, Some b -> Some (min a b)
          | Some a, None | None, Some a -> Some a
          | None, None -> None
        in
        match i with
        | Some i -> String.sub pathname 0 i
        | None -> pathname
      in
      (* js/URL normalizes empty path to "/" *)
      let pathname = if pathname = "" then "/" else pathname in
      (* js/URL lowercases the host *)
      Some { protocol = scheme; host = String.lowercase_ascii host; pathname }

let custom_scheme_re = Regexp.compile "^[a-zA-Z0-9_+\\-.]+://"

let url_join (base_url : string) (segments : string list) : string =
  let custom_scheme =
    match Regexp.exec custom_scheme_re base_url with
    | Some m -> Option.value ~default:"" m.groups.(0)
    | None -> ""
  in
  let custom_scheme_b = custom_scheme <> "" && custom_scheme <> "file://" in
  let base_url =
    if custom_scheme_b then
      Regexp.replace (Regexp.compile (Common_util.escape_regex_chars custom_scheme))
        ~f:(fun ~match_:_ ~groups:_ ~offset:_ ~input:_ -> "file://")
        base_url
    else base_url
  in
  let url =
    match url_parse (safe_decode_uri_component base_url) with
    | Some u -> u
    | None ->
      Worker_log.error "Failed to construct URL in url-join"
        [ ("base-url", base_url) ];
      { protocol = "file:"; host = ""; pathname = "/" }
  in
  let scheme =
    if custom_scheme_b then
      Common_util.str_replace_all custom_scheme "//" ""
    else url.protocol
  in
  let path = url.pathname in
  let domain =
    match url.host with
    | "" -> if custom_scheme_b || starts_with path "/" then "" else "/"
    | h -> h
  in
  let encoded_new_path =
    uri_path_join_internal (path :: segments) |> preserve_file_url_win_drive scheme
  in
  scheme ^ "//" ^ domain ^ encoded_new_path

(* path/path-join *)
let path_join (base : string) (segments : string list) : string =
  if is_file_url base then url_join base segments
  else
    let rejoined_path = path_join_internal (base :: segments) in
    if base <> "" && starts_with base "//" (* Win path fix *)
    then "/" ^ rejoined_path
    else rejoined_path

(* path/prepend-protocol — protocol is one of file: http: https:
   assets:. UNC paths ("//…") get the protocol prepended verbatim. *)
let prepend_protocol (protocol : string) (path : string) : string =
  if starts_with path protocol then path
  else if starts_with path "//" then protocol ^ path
  else path_join (protocol ^ "//") [ path ]

let path_normalize_internal (path : string) : string = path_join path []

let url_normalize (origin_url : string) : string =
  match url_parse (safe_decode_uri_component origin_url) with
  | None ->
    Worker_log.error "Failed to construct URL in url-normalize"
      [ ("url", origin_url) ];
    origin_url
  | Some url ->
    let scheme = url.protocol in
    let domain = match url.host with "" -> "/" | h -> h in
    let encoded_new_path =
      uri_path_join_internal [ url.pathname ] |> preserve_file_url_win_drive scheme
    in
    scheme ^ "//" ^ domain ^ encoded_new_path

(* path/path-normalize *)
let path_normalize (path : string) : string =
  Unicode.nfc
    (if is_file_url path then url_normalize path else path_normalize_internal path)

(* path/url-to-path *)
let url_to_path (original_url : string) : string =
  if is_file_url original_url then
    let u = Common_util.str_replace_all (safe_decode_uri_component original_url) "assets://" "file://" in
    match url_parse u with
    | None ->
      Worker_log.error "Failed to construct URL in url-to-path"
        [ ("url", original_url) ];
      original_url
    | Some url ->
      let path = url.pathname in
      let host = url.host in
      let path =
        if starts_with path "///" then
          String.sub path 2 (String.length path - 2)
        else path
      in
      let path =
        if Regexp.test (Regexp.compile "^/[a-zA-Z]:") path (* Win path fix *)
        then String.sub path 1 (String.length path - 1)
        else path
      in
      if Unicode.trim host = "" then path else "//" ^ host ^ path
  else original_url

let file_url_or_path_to_path (s : string) : string =
  if is_file_url s then url_to_path s else s

(* path/parent *)
(* path/trim-dir-prefix *)
let trim_dir_prefix (base_path : string) (sub_path : string) : string option =
  let base_path = path_normalize base_path in
  let sub_path = path_normalize sub_path in
  let is_url = is_file_url base_path in
  if Common_util.str_starts_with sub_path base_path then
    let rest =
      String.sub sub_path (String.length base_path)
        (String.length sub_path - String.length base_path)
    in
    let rec drop_leading_slash s =
      if String.length s > 0 && s.[0] = '/' then
        drop_leading_slash (String.sub s 1 (String.length s - 1))
      else s
    in
    let rest = drop_leading_slash rest in
    Some (if is_url then safe_decode_uri_component rest else rest)
  else None

let parent (path : string) : string option =
  if String.contains path '/' then Some (path_normalize (path ^ "/..")) else None

(* path/basename *)
let basename (path : string) : string option =
  let path = Regexp.replace_all (Regexp.compile "/+$")
      ~f:(fun ~match_:_ ~groups:_ ~offset:_ ~input:_ -> "") path in
  filename path

(* path/absolute? *)
let absolute (p : string) : bool =
  let p = path_normalize p in
  is_file_url p
  || starts_with p "/"
  || Regexp.test (Regexp.compile "^[a-zA-Z]:[/\\\\]") p

(* path/protocol-url? *)
let protocol_url (p : string) : bool =
  Regexp.test (Regexp.compile "^[a-zA-Z0-9_+\\-.]{2,}:") p && not (String.contains p ' ')
