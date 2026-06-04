type request = {
  method_ : string;
  url : Cli_primitive.url;
  headers : (string * string) list;
  body : string option;
  timeout_ms : Cli_primitive.duration_ms option;
}

type response = { status : int; body : string }

type invoke_config = {
  base_url : Cli_primitive.url;
  timeout_ms : Cli_primitive.duration_ms;
  profile_session : Profile_types.session option;
}

type event_type = Cli_primitive.keyword
type event_payload = Edn_ocaml.any
type event_subscription = { close : unit -> unit Cli_effect.t }

let thread_api_method name = Edn_util.keyword_t (":thread-api/" ^ name)

module Js_runtime = struct
  type t

  external string : string -> t = "caml_js_from_string"
  external to_string : t -> string = "caml_js_to_string"
  external variable : string -> t = "caml_js_var"
  external get : 'a -> 'b -> 'c = "caml_js_get"
  external fun_call : 'a -> t array -> 'b = "caml_js_fun_call"
  external meth_call : 'a -> string -> t array -> 'b = "caml_js_meth_call"
  external new_obj : 'a -> t array -> 'b = "caml_js_new"
  external obj : (string * t) array -> t = "caml_js_object"
  external callback : ('a -> 'b) -> t = "caml_js_wrap_callback"
  external eval_string : string -> t = "caml_js_eval_string"
  external inject : 'a -> t = "%identity"

  let number value =
    fun_call
      (eval_string "(function(value) { return Number(value); })")
      [| string (Printf.sprintf "%.0f" value) |]

  let bool value =
    fun_call
      (eval_string "(function(value) { return value === 'true'; })")
      [| string (if value then "true" else "false") |]

  let to_bool value =
    to_string
      (fun_call
         (eval_string "(function(value) { return value ? 'true' : 'false'; })")
         [| inject value |])
    = "true"
end

module T = Transit.Json
module E = Edn_ocaml

type parsed_url = { host : string; port : int; path : string }

let js_backend () =
  let executable = Sys.executable_name in
  if
    Filename.check_suffix executable ".wasm.js"
    || Filename.check_suffix executable ".js"
  then true
  else
    match Sys.backend_type with
    | Native -> false
    | Bytecode -> false
    | Other _ -> true

let starts_with ~prefix value =
  let prefix_len = String.length prefix in
  String.length value >= prefix_len && String.sub value 0 prefix_len = prefix

let json_escape value =
  let buffer = Buffer.create (String.length value + 8) in
  String.iter
    (function
      | '"' -> Buffer.add_string buffer "\\\""
      | '\\' -> Buffer.add_string buffer "\\\\"
      | '\n' -> Buffer.add_string buffer "\\n"
      | '\r' -> Buffer.add_string buffer "\\r"
      | '\t' -> Buffer.add_string buffer "\\t"
      | c -> Buffer.add_char buffer c)
    value;
  Buffer.contents buffer

let strip_prefix prefix value =
  if starts_with ~prefix value then
    String.sub value (String.length prefix)
      (String.length value - String.length prefix)
  else value

let transit_keyword_name keyword = strip_prefix ":" keyword

let keyword_from_name name =
  if starts_with ~prefix:":" name then name else ":" ^ name

let symbol_name value =
  if starts_with ~prefix:"~$" value then
    Some (String.sub value 2 (String.length value - 2))
  else None

let rec transit_of_value value =
  match value with
  | Edn_ocaml.Any Edn_ocaml.Nil -> T.Null
  | Any (Bool value) -> T.Bool value
  | Any (Int value) -> (
      match Edn_util.int64_to_int_opt value with
      | Some value -> T.Int value
      | None -> T.String (Int64.to_string value))
  | Any (Bigint value) | Any (Decimal value) -> T.String value
  | Any (Float value) -> T.Float value
  | Any (String value) -> (
      match symbol_name value with
      | Some symbol -> T.Symbol symbol
      | None -> T.String value)
  | Any (Symbol value) -> T.Symbol value
  | Any (Keyword keyword) -> T.Keyword (transit_keyword_name (":" ^ keyword))
  | Any (Tagged ("uuid", value)) -> (
      match Edn_util.as_string value with
      | Some uuid -> T.Uuid uuid
      | None -> T.of_edn value)
  | Any (Tagged ("bytes", value)) -> (
      match Edn_util.as_string value with
      | Some value -> T.Bytes value
      | None -> T.of_edn value)
  | Any (List values) ->
      T.List (List.map transit_of_value (Edn_util.iarray_to_list values))
  | Any (Vector values) ->
      T.Array (List.map transit_of_value (Edn_util.iarray_to_list values))
  | Any (Set values) ->
      T.Set (List.map transit_of_value (Edn_util.iarray_to_list values))
  | Any (Map fields) ->
      T.Map
        (List.map
           (fun (key, value) -> (transit_of_value key, transit_of_value value))
           (Edn_util.iarray_to_list fields))
  | _ -> T.of_edn value

let value_of_transit = T.to_edn
let transit_json_of_value value = T.to_string (transit_of_value value)
let value_of_transit_string text = T.of_string text |> value_of_transit
let edn_of_value value = value
let value_of_edn value = value

let normalize_base_url base_url =
  let base_url = String.trim base_url in
  if base_url = "" then invalid_arg "base-url is required"
  else if
    String.length base_url > 0 && base_url.[String.length base_url - 1] = '/'
  then String.sub base_url 0 (String.length base_url - 1)
  else base_url

let parse_http_url url =
  let rest =
    if starts_with ~prefix:"http://" url then
      String.sub url 7 (String.length url - 7)
    else if starts_with ~prefix:"https://" url then
      invalid_arg "https transport is not implemented"
    else invalid_arg ("unsupported url: " ^ url)
  in
  let host_port, path =
    match String.index_opt rest '/' with
    | Some idx ->
        (String.sub rest 0 idx, String.sub rest idx (String.length rest - idx))
    | None -> (rest, "/")
  in
  let host, port =
    match String.rindex_opt host_port ':' with
    | Some idx ->
        let host = String.sub host_port 0 idx in
        let port =
          String.sub host_port (idx + 1) (String.length host_port - idx - 1)
          |> int_of_string
        in
        (host, port)
    | None -> (host_port, 80)
  in
  { host; port; path }

let trim_cr value =
  let len = String.length value in
  if len > 0 && value.[len - 1] = '\r' then String.sub value 0 (len - 1)
  else value

let read_headers ic =
  let rec loop acc =
    let line = input_line ic |> trim_cr in
    if line = "" then List.rev acc
    else
      match String.split_on_char ':' line with
      | key :: rest ->
          loop
            (( String.lowercase_ascii (String.trim key),
               String.trim (String.concat ":" rest) )
            :: acc)
      | [] -> loop acc
  in
  loop []

let read_all ic =
  let buffer = Buffer.create 256 in
  (try
     while true do
       Buffer.add_char buffer (input_char ic)
     done
   with End_of_file -> ());
  Buffer.contents buffer

let read_chunked_body ic =
  let buffer = Buffer.create 256 in
  let rec loop () =
    let size_line = input_line ic |> trim_cr in
    let size_text =
      match String.index_opt size_line ';' with
      | Some idx -> String.sub size_line 0 idx
      | None -> size_line
    in
    let size = int_of_string ("0x" ^ String.trim size_text) in
    if size = 0 then (
      ignore (input_line ic);
      Buffer.contents buffer)
    else
      let bytes = Bytes.create size in
      really_input ic bytes 0 size;
      Buffer.add_string buffer (Bytes.to_string bytes);
      ignore (input_line ic);
      loop ()
  in
  loop ()

let read_body ic headers =
  match List.assoc_opt "transfer-encoding" headers with
  | Some value when String.lowercase_ascii value = "chunked" ->
      read_chunked_body ic
  | _ -> (
      match List.assoc_opt "content-length" headers with
      | Some value ->
          let len = int_of_string value in
          let bytes = Bytes.create len in
          really_input ic bytes 0 len;
          Bytes.to_string bytes
      | None -> read_all ic)

let parse_status line =
  match String.split_on_char ' ' line with
  | _http :: code :: _ -> int_of_string code
  | _ -> invalid_arg ("invalid http response: " ^ line)

let find_substring_from ~needle haystack start =
  let needle_len = String.length needle in
  let haystack_len = String.length haystack in
  let rec loop idx =
    if idx + needle_len > haystack_len then None
    else if String.sub haystack idx needle_len = needle then Some idx
    else loop (idx + 1)
  in
  loop start

let parse_json_string_at text start =
  if start >= String.length text || text.[start] <> '"' then None
  else
    let buffer = Buffer.create 16 in
    let rec loop idx =
      if idx >= String.length text then None
      else
        match text.[idx] with
        | '"' -> Some (Buffer.contents buffer)
        | '\\' when idx + 1 < String.length text ->
            (match text.[idx + 1] with
            | '"' -> Buffer.add_char buffer '"'
            | '\\' -> Buffer.add_char buffer '\\'
            | '/' -> Buffer.add_char buffer '/'
            | 'n' -> Buffer.add_char buffer '\n'
            | 'r' -> Buffer.add_char buffer '\r'
            | 't' -> Buffer.add_char buffer '\t'
            | other -> Buffer.add_char buffer other);
            loop (idx + 2)
        | c ->
            Buffer.add_char buffer c;
            loop (idx + 1)
    in
    loop (start + 1)

let json_string_field_from ?(start = 0) field body =
  let key = "\"" ^ field ^ "\"" in
  match find_substring_from ~needle:key body start with
  | None -> None
  | Some idx ->
      let rec skip_ws idx =
        if idx < String.length body then
          match body.[idx] with
          | ' ' | '\n' | '\r' | '\t' -> skip_ws (idx + 1)
          | _ -> idx
        else idx
      in
      let colon = skip_ws (idx + String.length key) in
      if colon >= String.length body || body.[colon] <> ':' then None
      else
        let value_start = skip_ws (colon + 1) in
        parse_json_string_at body value_start

let http_error_message status body =
  let fallback =
    if String.trim body = "" then
      "http request failed (" ^ string_of_int status ^ ")"
    else
      "http request failed (" ^ string_of_int status ^ ")\nhttp response: "
      ^ body
  in
  match find_substring_from ~needle:{|"error"|} body 0 with
  | Some error_start ->
      Option.value
        (json_string_field_from ~start:error_start "message" body)
        ~default:fallback
  | None ->
      Option.value (json_string_field_from "message" body) ~default:fallback

let timeout_seconds = function
  | Some timeout_ms when Int64.compare timeout_ms 0L > 0 ->
      Some (Int64.to_float timeout_ms /. 1000.)
  | _ -> None

let apply_socket_timeout socket timeout_ms =
  match timeout_seconds timeout_ms with
  | None -> ()
  | Some seconds ->
      Cli_unix.setsockopt_float socket Cli_unix.SO_RCVTIMEO seconds;
      Cli_unix.setsockopt_float socket Cli_unix.SO_SNDTIMEO seconds

let is_timeout_error = function
  | Cli_unix.EAGAIN | Cli_unix.EWOULDBLOCK | Cli_unix.ETIMEDOUT -> true
  | _ -> false

let request_blocking req =
  try
    let url = parse_http_url req.url in
    let sockaddr =
      Cli_unix.ADDR_INET
        ((Cli_unix.gethostbyname url.host).Cli_unix.h_addr_list.(0), url.port)
    in
    let socket = Cli_unix.socket Cli_unix.PF_INET Cli_unix.SOCK_STREAM 0 in
    Fun.protect
      ~finally:(fun () ->
        try Cli_unix.close socket with Cli_unix.Cli_unix_error _ -> ())
      (fun () ->
        apply_socket_timeout socket req.timeout_ms;
        Cli_unix.connect socket sockaddr;
        let ic = Cli_unix.in_channel_of_descr socket in
        let oc = Cli_unix.out_channel_of_descr socket in
        let body = Option.value req.body ~default:"" in
        let headers =
          [
            ("Host", url.host ^ ":" ^ string_of_int url.port);
            ("Connection", "close");
            ("Content-Length", string_of_int (String.length body));
          ]
          @ req.headers
        in
        Printf.fprintf oc "%s %s HTTP/1.1\r\n" req.method_ url.path;
        List.iter
          (fun (key, value) -> Printf.fprintf oc "%s: %s\r\n" key value)
          headers;
        Printf.fprintf oc "\r\n%s%!" body;
        let status = input_line ic |> trim_cr |> parse_status in
        let headers = read_headers ic in
        let body = read_body ic headers in
        if status >= 200 && status <= 299 then { status; body }
        else failwith (http_error_message status body))
  with
  | Cli_unix.Cli_unix_error (code, _, _) when is_timeout_error code ->
      failwith "request timeout"
  | Sys_blocked_io when Option.is_some (timeout_seconds req.timeout_ms) ->
      failwith "request timeout"

let js_error_message error =
  try
    let text : Js_runtime.t = Js_runtime.meth_call error "toString" [||] in
    Js_runtime.to_string text
  with _ -> "fetch failed"

let request_fetch req =
  let task, resolver = Lwt.wait () in
  let timeout_handle = ref None in
  let clear_timeout () =
    match !timeout_handle with
    | None -> ()
    | Some handle -> (
        timeout_handle := None;
        try
          let clear_timeout = Js_runtime.variable "clearTimeout" in
          ignore
            (Js_runtime.fun_call clear_timeout [| Js_runtime.inject handle |]
              : Js_runtime.t)
        with _ -> ())
  in
  let wake value =
    if Lwt.is_sleeping task then (
      clear_timeout ();
      Lwt.wakeup resolver value)
  in
  let wake_exn exn =
    if Lwt.is_sleeping task then (
      clear_timeout ();
      Lwt.wakeup_exn resolver exn)
  in
  let string value = Js_runtime.inject (Js_runtime.string value) in
  let headers =
    Js_runtime.obj
      (Array.of_list
         (List.map (fun (key, value) -> (key, string value)) req.headers))
  in
  let timeout_fields, install_timeout =
    match timeout_seconds req.timeout_ms with
    | None -> ([], fun () -> ())
    | Some _ ->
        let controller =
          try
            Some
              (Js_runtime.new_obj (Js_runtime.variable "AbortController") [||])
          with _ -> None
        in
        let fields =
          match controller with
          | None -> []
          | Some controller ->
              let signal : Js_runtime.t = Js_runtime.get controller "signal" in
              [ ("signal", Js_runtime.inject signal) ]
        in
        let install () =
          try
            let set_timeout = Js_runtime.variable "setTimeout" in
            let on_timeout () =
              (match controller with
              | None -> ()
              | Some controller -> (
                  try
                    ignore
                      (Js_runtime.meth_call controller "abort" [||]
                        : Js_runtime.t)
                  with _ -> ()));
              wake_exn (Failure "request timeout");
              Js_runtime.inject ()
            in
            let handle : Js_runtime.t =
              Js_runtime.fun_call set_timeout
                [|
                  Js_runtime.callback on_timeout;
                  Js_runtime.number
                    (Int64.to_float (Option.value req.timeout_ms ~default:0L));
                |]
            in
            timeout_handle := Some handle
          with _ -> ()
        in
        (fields, install)
  in
  let fields =
    [ ("method", string req.method_); ("headers", Js_runtime.inject headers) ]
    @ timeout_fields
    @ match req.body with None -> [] | Some body -> [ ("body", string body) ]
  in
  let options = Js_runtime.obj (Array.of_list fields) in
  let fetch = Js_runtime.variable "fetch" in
  install_timeout ();
  let promise =
    Js_runtime.fun_call fetch [| string req.url; Js_runtime.inject options |]
  in
  let on_text status text =
    let body = Js_runtime.to_string text in
    if status >= 200 && status <= 299 then wake { status; body }
    else wake_exn (Failure (http_error_message status body));
    text
  in
  let on_response response =
    let status : int = Js_runtime.get response "status" in
    let text_promise = Js_runtime.meth_call response "text" [||] in
    ignore
      (Js_runtime.meth_call text_promise "then"
         [| Js_runtime.callback (on_text status) |]);
    response
  in
  let on_error error =
    wake_exn (Failure (js_error_message error));
    error
  in
  ignore
    (Js_runtime.meth_call promise "then"
       [| Js_runtime.callback on_response; Js_runtime.callback on_error |]);
  task

let request req =
  if js_backend () then
    try Cli_effect.of_lwt (request_fetch req) with exn -> Cli_effect.error exn
  else
    try Cli_effect.pure (request_blocking req)
    with exn ->
      let message = Printexc.to_string exn in
      if starts_with ~prefix:"Failure(\"Error: caml_unix_" message then
        Cli_effect.of_lwt (request_fetch req)
      else Cli_effect.error exn

let method_name method_ =
  let method_ = Edn_util.keyword_to_string method_ |> String.trim in
  if starts_with ~prefix:":" method_ then
    String.sub method_ 1 (String.length method_ - 1)
  else method_

let invoke_body method_ args =
  let args_transit = transit_json_of_value (Edn_util.vector args) in
  "{\"method\":\""
  ^ json_escape (method_name method_)
  ^ "\",\"argsTransit\":\"" ^ json_escape args_transit ^ "\"}"

type json_parser = { text : string; mutable pos : int }

let parser text = { text; pos = 0 }
let parser_done p = p.pos >= String.length p.text
let peek p = if parser_done p then None else Some p.text.[p.pos]

let bump p =
  let c = p.text.[p.pos] in
  p.pos <- p.pos + 1;
  c

let rec skip_ws p =
  match peek p with
  | Some (' ' | '\n' | '\r' | '\t') ->
      ignore (bump p);
      skip_ws p
  | _ -> ()

let expect p expected =
  skip_ws p;
  match peek p with
  | Some c when c = expected -> ignore (bump p)
  | _ -> invalid_arg ("expected " ^ String.make 1 expected)

let parse_json_string p =
  skip_ws p;
  expect p '"';
  let buffer = Buffer.create 16 in
  let rec loop () =
    match bump p with
    | '"' -> Buffer.contents buffer
    | '\\' -> (
        match bump p with
        | '"' ->
            Buffer.add_char buffer '"';
            loop ()
        | '\\' ->
            Buffer.add_char buffer '\\';
            loop ()
        | '/' ->
            Buffer.add_char buffer '/';
            loop ()
        | 'n' ->
            Buffer.add_char buffer '\n';
            loop ()
        | 'r' ->
            Buffer.add_char buffer '\r';
            loop ()
        | 't' ->
            Buffer.add_char buffer '\t';
            loop ()
        | other ->
            Buffer.add_char buffer other;
            loop ())
    | c ->
        Buffer.add_char buffer c;
        loop ()
  in
  loop ()

let rec parse_json_value p =
  skip_ws p;
  match peek p with
  | Some '"' -> Edn_util.string (parse_json_string p)
  | Some '{' -> parse_json_object p
  | Some '[' -> parse_json_array p
  | Some 't' ->
      p.pos <- p.pos + 4;
      Edn_util.bool true
  | Some 'f' ->
      p.pos <- p.pos + 5;
      Edn_util.bool false
  | Some 'n' ->
      p.pos <- p.pos + 4;
      Edn_util.nil
  | Some _ -> parse_json_number p
  | None -> invalid_arg "empty json"

and parse_json_object p =
  expect p '{';
  skip_ws p;
  let rec loop fields =
    skip_ws p;
    match peek p with
    | Some '}' ->
        ignore (bump p);
        Edn_util.map (List.rev fields)
    | _ -> (
        let key = parse_json_string p in
        expect p ':';
        let value = parse_json_value p in
        skip_ws p;
        match peek p with
        | Some ',' ->
            ignore (bump p);
            loop ((Edn_util.string key, value) :: fields)
        | Some '}' ->
            ignore (bump p);
            Edn_util.map (List.rev ((Edn_util.string key, value) :: fields))
        | _ -> invalid_arg "expected object separator")
  in
  loop []

and parse_json_array p =
  expect p '[';
  skip_ws p;
  let rec loop values =
    skip_ws p;
    match peek p with
    | Some ']' ->
        ignore (bump p);
        Edn_util.vector (List.rev values)
    | _ -> (
        let value = parse_json_value p in
        skip_ws p;
        match peek p with
        | Some ',' ->
            ignore (bump p);
            loop (value :: values)
        | Some ']' ->
            ignore (bump p);
            Edn_util.vector (List.rev (value :: values))
        | _ -> invalid_arg "expected array separator")
  in
  loop []

and parse_json_number p =
  let start = p.pos in
  let rec loop () =
    match peek p with
    | Some ('0' .. '9' | '-' | '+') ->
        ignore (bump p);
        loop ()
    | _ -> ()
  in
  loop ();
  let text = String.sub p.text start (p.pos - start) in
  Edn_util.int (int_of_string text)

let value_of_json text = parse_json_value (parser text)
let find_substring ~needle haystack = find_substring_from ~needle haystack 0

let extract_json_string_field ~field body =
  let key = "\"" ^ field ^ "\"" in
  match find_substring ~needle:key body with
  | Some idx ->
      let p = parser body in
      p.pos <- idx + String.length key;
      expect p ':';
      Some (parse_json_string p)
  | None -> None

let invoke config method_ args =
  let base_url = normalize_base_url config.base_url in
  let stage = "transport.invoke:" ^ method_name method_ in
  Profile_types.time config.profile_session stage (fun () ->
      Cli_effect.map
        (fun response ->
          match
            extract_json_string_field ~field:"resultTransit" response.body
          with
          | Some result_transit -> value_of_transit_string result_transit
          | None -> Edn_util.nil)
        (request
           {
             method_ = "POST";
             url = base_url ^ "/v1/invoke";
             headers =
               [
                 ("Content-Type", "application/json");
                 ("Accept", "application/json");
               ];
             body = Some (invoke_body method_ args);
             timeout_ms = Some config.timeout_ms;
           }))

let repo_value repo = Edn_util.string (Cli_primitive.string_of_repo repo)

let thread_api_apply_outliner_ops config ~(repo : Cli_primitive.repo)
    ~(ops : Edn_ocaml.vector Edn_ocaml.t) ~(options : Edn_ocaml.map Edn_ocaml.t) =
  invoke config
    (thread_api_method "apply-outliner-ops")
    [ repo_value repo; Edn_util.any ops; Edn_util.any options ]

let thread_api_backup_db_sqlite config ~(repo : Cli_primitive.repo) ~path =
  invoke config
    (thread_api_method "backup-db-sqlite")
    [ repo_value repo; Edn_util.string path ]

let thread_api_cli_list_nodes config ~(repo : Cli_primitive.repo)
    ~(options : Edn_ocaml.map Edn_ocaml.t) =
  invoke config
    (thread_api_method "cli-list-nodes")
    [ repo_value repo; Edn_util.any options ]

let thread_api_cli_list_pages config ~(repo : Cli_primitive.repo)
    ~(options : Edn_ocaml.map Edn_ocaml.t) =
  invoke config
    (thread_api_method "cli-list-pages")
    [ repo_value repo; Edn_util.any options ]

let thread_api_cli_list_properties config ~(repo : Cli_primitive.repo)
    ~(options : Edn_ocaml.map Edn_ocaml.t) =
  invoke config
    (thread_api_method "cli-list-properties")
    [ repo_value repo; Edn_util.any options ]

let thread_api_cli_list_tags config ~(repo : Cli_primitive.repo)
    ~(options : Edn_ocaml.map Edn_ocaml.t) =
  invoke config
    (thread_api_method "cli-list-tags")
    [ repo_value repo; Edn_util.any options ]

let thread_api_cli_list_tasks config ~(repo : Cli_primitive.repo)
    ~(options : Edn_ocaml.map Edn_ocaml.t) =
  invoke config
    (thread_api_method "cli-list-tasks")
    [ repo_value repo; Edn_util.any options ]

let thread_api_create_or_open_db config ~(repo : Cli_primitive.repo)
    ~(options : Edn_ocaml.map Edn_ocaml.t) =
  invoke config
    (thread_api_method "create-or-open-db")
    [ repo_value repo; Edn_util.any options ]

let thread_api_db_sync_download_graph_by_id config
    ~(repo : Cli_primitive.repo) ~graph_id ~graph_e2ee =
  invoke config
    (thread_api_method "db-sync-download-graph-by-id")
    [ repo_value repo; Edn_util.string graph_id; Edn_util.bool graph_e2ee ]

let thread_api_db_sync_ensure_user_rsa_keys ?options config =
  let args =
    match options with None -> [] | Some options -> [ Edn_util.any options ]
  in
  invoke config (thread_api_method "db-sync-ensure-user-rsa-keys") args

let thread_api_db_sync_grant_graph_access config ~(repo : Cli_primitive.repo)
    ~graph_id ~email =
  invoke config
    (thread_api_method "db-sync-grant-graph-access")
    [ repo_value repo; Edn_util.string graph_id; Edn_util.string email ]

let thread_api_db_sync_list_remote_graphs config =
  invoke config (thread_api_method "db-sync-list-remote-graphs") []

let thread_api_db_sync_request_asset_download config
    ~(repo : Cli_primitive.repo) ~asset_uuid =
  invoke config
    (thread_api_method "db-sync-request-asset-download")
    [ repo_value repo; Edn_util.uuid asset_uuid ]

let thread_api_db_sync_start config ~(repo : Cli_primitive.repo) =
  invoke config (thread_api_method "db-sync-start") [ repo_value repo ]

let thread_api_db_sync_status config ~(repo : Cli_primitive.repo) =
  invoke config (thread_api_method "db-sync-status") [ repo_value repo ]

let thread_api_db_sync_stop config =
  invoke config (thread_api_method "db-sync-stop") []

let thread_api_db_sync_upload_graph config ~(repo : Cli_primitive.repo) =
  invoke config
    (thread_api_method "db-sync-upload-graph")
    [ repo_value repo ]

let thread_api_export_edn config ~(repo : Cli_primitive.repo)
    ~(options : Edn_ocaml.map Edn_ocaml.t) =
  invoke config
    (thread_api_method "export-edn")
    [ repo_value repo; Edn_util.any options ]

let thread_api_get_block_parents config ~(repo : Cli_primitive.repo) ~block_id =
  invoke config
    (thread_api_method "get-block-parents")
    [ repo_value repo; Edn_util.int64 block_id ]

let thread_api_get_block_refs config ~(repo : Cli_primitive.repo) ~block_id =
  invoke config
    (thread_api_method "get-block-refs")
    [ repo_value repo; Edn_util.int64 block_id ]

let thread_api_get_e2ee_password config ~refresh_token =
  invoke config
    (thread_api_method "get-e2ee-password")
    [ Edn_util.string refresh_token ]

let thread_api_import_db_binary config ~(repo : Cli_primitive.repo) ~data =
  invoke config
    (thread_api_method "import-db-binary")
    [ repo_value repo; data ]

let thread_api_import_edn config ~(repo : Cli_primitive.repo) ~data =
  invoke config
    (thread_api_method "import-edn")
    [ repo_value repo; data ]

let thread_api_pull config ~(repo : Cli_primitive.repo)
    ~(selector : Edn_ocaml.vector Edn_ocaml.t) ~lookup =
  invoke config
    (thread_api_method "pull")
    [ repo_value repo; Edn_util.any selector; lookup ]

let thread_api_q config ~(repo : Cli_primitive.repo)
    ~(query : Edn_ocaml.vector Edn_ocaml.t) =
  invoke config (thread_api_method "q")
    [ repo_value repo; Edn_util.any query ]

let thread_api_set_db_sync_config config ~config:sync_config =
  invoke config
    (thread_api_method "set-db-sync-config")
    [ Edn_util.any sync_config ]

let thread_api_sync_app_state config ~(auth_state : Edn_ocaml.map Edn_ocaml.t) =
  invoke config (thread_api_method "sync-app-state") [ Edn_util.any auth_state ]

let thread_api_validate_db config ~(repo : Cli_primitive.repo)
    ~(options : Edn_ocaml.map Edn_ocaml.t) =
  invoke config
    (thread_api_method "validate-db")
    [ repo_value repo; Edn_util.any options ]

let thread_api_verify_and_save_e2ee_password config ~refresh_token ~password =
  invoke config
    (thread_api_method "verify-and-save-e2ee-password")
    [ Edn_util.string refresh_token; Edn_util.string password ]

let value_get_string_key key value =
  match Edn_util.as_map value with
  | Some fields ->
      List.find_map
        (fun (field_key, value) ->
          match
            (Edn_util.as_string_like field_key, Edn_util.as_string value)
          with
          | Some field, Some value when field = key || field = ":" ^ key ->
              Some value
          | _ -> None)
        fields
  | None -> None

let keyword_from_string value =
  Edn_util.keyword_t
    (if starts_with ~prefix:":" value then value else ":" ^ value)

let decode_event_payload payload =
  try value_of_transit_string payload with _ -> Edn_util.string payload

let max_non_progress_event_decode_bytes = 256 * 1024

let json_string_field field text =
  let len = String.length text in
  let rec skip_ws index =
    if index < len then
      match text.[index] with
      | ' ' | '\n' | '\r' | '\t' -> skip_ws (index + 1)
      | _ -> index
    else index
  in
  let rec parse_string index buffer =
    if index >= len then None
    else
      match text.[index] with
      | '"' -> Some (Buffer.contents buffer, index + 1)
      | '\\' when index + 1 < len ->
          Buffer.add_char buffer text.[index];
          Buffer.add_char buffer text.[index + 1];
          parse_string (index + 2) buffer
      | c ->
          Buffer.add_char buffer c;
          parse_string (index + 1) buffer
  in
  match find_substring ~needle:("\"" ^ field ^ "\"") text with
  | None -> None
  | Some field_index ->
      let colon_index = skip_ws (field_index + String.length field + 2) in
      if colon_index >= len || text.[colon_index] <> ':' then None
      else
        let value_index = skip_ws (colon_index + 1) in
        if value_index >= len || text.[value_index] <> '"' then None
        else Option.map fst (parse_string (value_index + 1) (Buffer.create 16))

let decode_event event_text =
  let data_line =
    event_text |> String.split_on_char '\n'
    |> List.find_map (fun line ->
        if starts_with ~prefix:"data: " line then
          Some (String.sub line 6 (String.length line - 6))
        else None)
  in
  match data_line with
  | None -> None
  | Some data -> (
      try
        match json_string_field "type" data with
        | Some event_type
          when event_type <> "rtc-log"
               && String.length data > max_non_progress_event_decode_bytes ->
            Some (keyword_from_string event_type, Edn_util.nil)
        | _ ->
            let event = value_of_json data in
            let decoded_payload =
              match value_get_string_key "payload" event with
              | Some payload -> decode_event_payload payload
              | None -> Edn_util.nil
            in
            (match Edn_util.as_vector decoded_payload with
            | Some [ event_type_value; payload ] -> (
                match Edn_util.as_keyword_t event_type_value with
                | Some event_type -> Some (event_type, payload)
                | None -> None)
            | _ -> (
                match value_get_string_key "type" event with
                | Some event_type ->
                    Some (keyword_from_string event_type, decoded_payload)
                | None -> None))
      with _ -> None)

let split_sse_events buffer =
  let rec loop start acc =
    match
      find_substring ~needle:"\n\n"
        (String.sub buffer start (String.length buffer - start))
    with
    | None ->
        (List.rev acc, String.sub buffer start (String.length buffer - start))
    | Some rel_idx ->
        let idx = start + rel_idx in
        let event_text = String.sub buffer start (idx - start) in
        loop (idx + 2) (event_text :: acc)
  in
  loop 0 []

let dispatch_event on_event event_type payload =
  Lwt.async (fun () ->
      Lwt.catch
        (fun () -> Cli_effect.to_lwt (on_event event_type payload))
        (fun _ -> Lwt.return_unit))

let consume_sse_text on_event text =
  let events, _rest = split_sse_events text in
  List.iter
    (fun event_text ->
      match decode_event event_text with
      | Some (event_type, payload) -> dispatch_event on_event event_type payload
      | None -> ())
    events

let consume_sse_chunk on_event buffer chunk =
  let events, rest = split_sse_events (!buffer ^ chunk) in
  buffer := rest;
  List.iter
    (fun event_text ->
      match decode_event event_text with
      | Some (event_type, payload) -> dispatch_event on_event event_type payload
      | None -> ())
    events

let connect_events_fetch config on_event =
  let base_url = normalize_base_url config.base_url in
  let task, resolver = Lwt.wait () in
  let closed = ref false in
  let reader_ref = ref None in
  let buffer = ref "" in
  let wake value = if Lwt.is_sleeping task then Lwt.wakeup resolver value in
  let ignore_js value = value in
  let string value = Js_runtime.inject (Js_runtime.string value) in
  let promise_then promise ~ok ~error =
    ignore
      (Js_runtime.meth_call promise "then"
         [|
           Js_runtime.callback (fun value ->
               try ok value with _ -> ignore_js value);
           Js_runtime.callback (fun value ->
               try error value with _ -> ignore_js value);
         |]
        : Js_runtime.t)
  in
  let promise_catch promise =
    try
      ignore
        (Js_runtime.meth_call promise "catch"
           [| Js_runtime.callback ignore_js |]
          : Js_runtime.t)
    with _ -> ()
  in
  let controller =
    try Some (Js_runtime.new_obj (Js_runtime.variable "AbortController") [||])
    with _ -> None
  in
  let cancel_reader reader =
    try
      let promise = Js_runtime.meth_call reader "cancel" [||] in
      promise_catch promise
    with _ -> ()
  in
  let abort_controller controller =
    try
      ignore (Js_runtime.meth_call controller "abort" [||] : Js_runtime.t)
    with _ -> ()
  in
  let close () =
    closed := true;
    Option.iter cancel_reader !reader_ref;
    Option.iter abort_controller controller;
    Cli_effect.pure ()
  in
  let subscription = { close } in
  let subscription_woken = ref false in
  let wake_subscription () =
    if not !subscription_woken then (
      subscription_woken := true;
      wake subscription)
  in
  let consume_chunk_text text =
    try
      if not !closed then consume_sse_chunk on_event buffer text;
      wake_subscription ()
    with _ -> wake_subscription ()
  in
  let on_error value =
    wake_subscription ();
    value
  in
  let rec read_loop reader decoder =
    if not !closed then
      let promise = Js_runtime.meth_call reader "read" [||] in
      promise_then promise
        ~ok:(fun result ->
          if not !closed then (
            let done_ =
              Js_runtime.to_bool (Js_runtime.get result "done")
            in
            if not done_ then (
              let value : Js_runtime.t = Js_runtime.get result "value" in
              let options =
                Js_runtime.obj [| ("stream", Js_runtime.bool true) |]
              in
              let chunk : Js_runtime.t =
                Js_runtime.meth_call decoder "decode"
                  [| Js_runtime.inject value; Js_runtime.inject options |]
              in
              consume_chunk_text (Js_runtime.to_string chunk);
              read_loop reader decoder));
          result)
        ~error:on_error
  in
  let read_text_response response =
    try
      let promise = Js_runtime.meth_call response "text" [||] in
      promise_then promise
        ~ok:(fun text ->
          consume_chunk_text (Js_runtime.to_string text);
          text)
        ~error:on_error
    with _ -> wake_subscription ()
  in
  let on_response response =
    let ok = Js_runtime.to_bool (Js_runtime.get response "ok") in
    if ok then
      try
        let body : Js_runtime.t = Js_runtime.get response "body" in
        let reader : Js_runtime.t = Js_runtime.meth_call body "getReader" [||] in
        let decoder : Js_runtime.t =
          Js_runtime.new_obj (Js_runtime.variable "TextDecoder") [||]
        in
        reader_ref := Some reader;
        wake_subscription ();
        read_loop reader decoder
      with _ -> read_text_response response
    else wake_subscription ();
    response
  in
  let headers =
    Js_runtime.obj [| ("Accept", string "text/event-stream") |]
  in
  let fields =
    [
      ("method", string "GET");
      ("headers", Js_runtime.inject headers);
    ]
    @
    match controller with
    | Some controller ->
        let signal : Js_runtime.t = Js_runtime.get controller "signal" in
        [ ("signal", Js_runtime.inject signal) ]
    | None -> []
  in
  let options = Js_runtime.obj (Array.of_list fields) in
  let fetch = Js_runtime.variable "fetch" in
  let promise =
    Js_runtime.fun_call fetch
      [| string (base_url ^ "/v1/events"); Js_runtime.inject options |]
  in
  ignore
    (promise_then promise ~ok:on_response ~error:on_error);
  wake_subscription ();
  Cli_effect.of_lwt task

let consume_events_response config on_event closed socket_ref =
  let base_url = normalize_base_url config.base_url in
  let url = parse_http_url (base_url ^ "/v1/events") in
  let socket = Cli_unix.socket Cli_unix.PF_INET Cli_unix.SOCK_STREAM 0 in
  socket_ref := Some socket;
  try
    let sockaddr =
      Cli_unix.ADDR_INET
        ((Cli_unix.gethostbyname url.host).Cli_unix.h_addr_list.(0), url.port)
    in
    Cli_unix.connect socket sockaddr;
    let ic = Cli_unix.in_channel_of_descr socket in
    let oc = Cli_unix.out_channel_of_descr socket in
    Printf.fprintf oc "GET %s HTTP/1.1\r\n" url.path;
    Printf.fprintf oc "Host: %s:%d\r\n" url.host url.port;
    Printf.fprintf oc "Accept: text/event-stream\r\n";
    Printf.fprintf oc "Connection: close\r\n";
    Printf.fprintf oc "Content-Length: 0\r\n\r\n%!";
    ignore (input_line ic |> trim_cr |> parse_status);
    ignore (read_headers ic);
    let body = read_all ic in
    if not !closed then consume_sse_text on_event body;
    close_in_noerr ic;
    close_out_noerr oc
  with _ -> ( try Cli_unix.close socket with Cli_unix.Cli_unix_error _ -> ())

let connect_events config on_event =
  if js_backend () then connect_events_fetch config on_event
  else
    let closed = ref false in
    let socket_ref = ref None in
    consume_events_response config on_event closed socket_ref;
    let close () =
      closed := true;
      (match !socket_ref with
      | Some socket -> (
          try Cli_unix.shutdown socket Cli_unix.SHUTDOWN_ALL
          with Cli_unix.Cli_unix_error _ -> ())
      | None -> ());
      Cli_effect.pure ()
    in
    Cli_effect.pure { close }

let normalize_format format =
  let format = Edn_util.keyword_to_string format |> String.trim in
  if starts_with ~prefix:":" format then format else ":" ^ format

let write_file_binary path content =
  let oc = open_out_bin path in
  Fun.protect
    ~finally:(fun () -> close_out_noerr oc)
    (fun () -> output_string oc content)

let read_file_binary path =
  let ic = open_in_bin path in
  Fun.protect
    ~finally:(fun () -> close_in_noerr ic)
    (fun () ->
      let len = in_channel_length ic in
      let bytes = Bytes.create len in
      really_input ic bytes 0 len;
      bytes)

let bytes_of_output_data value =
  match (Edn_util.as_bytes value, Edn_util.as_string value) with
  | Some bytes, _ -> Bytes.to_string bytes
  | _, Some value -> value
  | _ -> Edn_ocaml.to_edn_string value

let unsupported_output_format format =
  Error.make
    (Edn_util.keyword_t "unsupported-output-format")
    ("unsupported output format: " ^ format)

let unsupported_input_format format =
  Error.make
    (Edn_util.keyword_t "unsupported-input-format")
    ("unsupported input format: " ^ format)

let write_output ~format ~path ~data =
  let format = normalize_format format in
  try
    let result =
      match format with
      | ":edn" ->
          write_file_binary path (E.to_edn_string (edn_of_value data));
          Ok ()
      | ":db" | ":sqlite" ->
          write_file_binary path (bytes_of_output_data data);
          Ok ()
      | _ -> Error (unsupported_output_format format)
    in
    Cli_effect.pure result
  with exn -> Cli_effect.pure (Error (Error.exception_error exn))

let read_input ~format ~path =
  let format = normalize_format format in
  try
    let result =
      match format with
      | ":edn" ->
          let content = read_file_binary path |> Bytes.to_string in
          Ok (E.of_edn_string content |> value_of_edn)
      | ":db" | ":sqlite" -> Ok (Edn_util.bytes (read_file_binary path))
      | _ -> Error (unsupported_input_format format)
    in
    Cli_effect.pure result
  with exn -> Cli_effect.pure (Error (Error.exception_error exn))
