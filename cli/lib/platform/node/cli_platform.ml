open Cli_effect.Infix

let hostname = Cli_unix.gethostname

module Stdout = struct
  type writable

  external stdout : writable = "stdout" [@@mel.module "process"]

  external on_error :
    writable -> (_[@mel.as "error"]) -> ((Js.Exn.t -> unit)[@u]) -> unit = "on"
  [@@mel.send]

  external error_code : Js.Exn.t -> string option = "code"
  [@@mel.get] [@@mel.return { undefined_to_opt }]
end

let stdout_error_handler_installed = ref false

let install_stdout_error_handler () =
  if not !stdout_error_handler_installed then (
    stdout_error_handler_installed := true;
    Stdout.on_error Stdout.stdout (fun[@u] error ->
        match Stdout.error_code error with
        | Some "EPIPE" -> exit 0
        | _ ->
            Js.Exn.raiseError
              (Option.value (Js.Exn.message error) ~default:"JavaScript error")))

let argv () =
  install_stdout_error_handler ();
  Node.Process.argv

type login_callback_request = { target : string option }
type login_callback_response = { status : int; body : string }

type login_callback_server_error =
  | Login_callback_timeout
  | Login_callback_server_start_failed of string
  | Login_callback_server_aborted of string

let timeout_ms span = if Float.compare span 0. > 0 then int_of_float span else 0

module Timer = struct
  let set_timeout f ms = Js.Global.setTimeout ~f ms
  let clear_timeout = Js.Global.clearTimeout
end

module Http_server = struct
  type server
  type request
  type response

  external create_server : ((request -> response -> unit)[@u]) -> server
    = "createServer"
  [@@mel.module "http"]

  external listen : server -> int -> string -> ((unit -> unit)[@u]) -> unit
    = "listen"
  [@@mel.send]

  external on_error :
    server -> (_[@mel.as "error"]) -> ((Js.Exn.t -> unit)[@u]) -> unit = "on"
  [@@mel.send]

  external close : server -> ((unit -> unit)[@u]) -> unit = "close" [@@mel.send]

  external target : request -> string option = "url"
  [@@mel.get] [@@mel.return { undefined_to_opt }]

  external write_head : response -> int -> string Js.Dict.t -> unit
    = "writeHead"
  [@@mel.send]

  external end_ : response -> string -> ((unit -> unit)[@u]) -> unit = "end"
  [@@mel.send]

  let text_headers () =
    let headers = Js.Dict.empty () in
    Js.Dict.set headers "Content-Type" "text/plain; charset=utf-8";
    Js.Dict.set headers "Connection" "close";
    headers

  let close_ignore server = try close server (fun[@u] () -> ()) with _ -> ()
end

let js_error_message exn =
  match Js.Exn.message exn with
  | Some message when String.trim message <> "" -> message
  | _ -> "JavaScript error"

let login_callback_server ~host ~port ~timeout_span ~on_listen ~handle_request =
  let task, resolver = Cli_effect.wait () in
  let settled = ref false in
  let server_ref = ref None in
  let timeout_ref = ref None in
  let clear_timer () =
    match !timeout_ref with
    | None -> ()
    | Some timeout_handle ->
        timeout_ref := None;
        Timer.clear_timeout timeout_handle
  in
  let close_server () =
    match !server_ref with
    | None -> ()
    | Some server ->
        server_ref := None;
        Http_server.close_ignore server
  in
  let finish result =
    if not !settled then (
      settled := true;
      clear_timer ();
      close_server ();
      Cli_effect.wakeup resolver result)
  in
  let on_request request response =
    if !settled then (
      Http_server.write_head response 410 (Http_server.text_headers ());
      Http_server.end_ response "Login callback already handled" (fun[@u] () ->
          ()))
    else
      let response_body, result =
        handle_request { target = Http_server.target request }
      in
      finish (Ok result);
      Http_server.write_head response response_body.status
        (Http_server.text_headers ());
      Http_server.end_ response response_body.body (fun[@u] () ->
          match !server_ref with
          | None -> ()
          | Some server -> Http_server.close_ignore server)
  in
  let on_listening () =
    let timeout = timeout_ms timeout_span in
    if timeout > 0 then
      timeout_ref :=
        Some
          (Timer.set_timeout
             (fun () -> finish (Error Login_callback_timeout))
             timeout);
    Cli_effect.on_any (on_listen ())
      (function
        | Ok () -> ()
        | Error message ->
            finish (Error (Login_callback_server_aborted message)))
      (fun exn ->
        finish (Error (Login_callback_server_aborted (Printexc.to_string exn))))
  in
  try
    let server =
      Http_server.create_server (fun[@u] request response ->
          on_request request response)
    in
    server_ref := Some server;
    Http_server.on_error server (fun[@u] error ->
        finish
          (Error (Login_callback_server_start_failed (js_error_message error))));
    Http_server.listen server port host (fun[@u] () -> on_listening ());
    task
  with exn ->
    finish (Error (Login_callback_server_start_failed (Printexc.to_string exn)));
    task

module Symbols = struct
  let ellipsis = Js.String.fromCodePoint 0x2026
  let linked_arrow = Js.String.fromCodePoint 0x2192 ^ " "
  let tree_line = Js.String.fromCodePoint 0x2500
  let tree_last = Js.String.fromCodePoint 0x2514 ^ tree_line ^ tree_line ^ " "
  let tree_middle = Js.String.fromCodePoint 0x251c ^ tree_line ^ tree_line ^ " "
  let tree_pipe = Js.String.fromCodePoint 0x2502 ^ "   "
end

module HTTP = struct
  external promise_error_name : Js.Promise.error -> string option = "name"
  [@@mel.get] [@@mel.return { undefined_to_opt }]

  external promise_error_message : Js.Promise.error -> string option = "message"
  [@@mel.get] [@@mel.return { undefined_to_opt }]

  let promise_to_effect ?(on_settle = fun () -> ()) promise =
    let task, resolver = Cli_effect.wait () in
    let finish result =
      if Cli_effect.is_pending task then Cli_effect.wakeup resolver result
    in
    let on_ok value =
      on_settle ();
      finish (Ok value);
      Js.Promise.resolve ()
    in
    let on_error error =
      let message =
        match promise_error_name error with
        | Some "AbortError" -> "request timeout"
        | _ ->
            Option.value
              (promise_error_message error)
              ~default:"JavaScript promise rejected"
      in
      on_settle ();
      finish (Error message);
      Js.Promise.resolve ()
    in
    ignore
      (promise |> Js.Promise.then_ on_ok |> Js.Promise.catch on_error
        : unit Js.Promise.t);
    task >>= function
    | Ok value -> Cli_effect.pure value
    | Error message -> Cli_effect.error (Failure message)

  let timeout_ms = function
    | Some timeout_span when Float.compare timeout_span 0. > 0 ->
        int_of_float timeout_span
    | _ -> 0

  let is_body_forbidden = function Fetch.Get | Fetch.Head -> true | _ -> false

  let request_body body = if body = "" then None else Some (Fetch.BodyInit.make body)

  let abort_after controller timeout_span =
    match timeout_ms timeout_span with
    | 0 -> None
    | ms ->
        Some
          (Timer.set_timeout
             (fun () -> Fetch.AbortController.abort controller)
             ms)

  let clear_timeout_opt = function
    | None -> ()
    | Some timeout_handle -> Timer.clear_timeout timeout_handle

  let response_text response =
    Fetch.Response.text response
    |> Js.Promise.then_ (fun body -> Js.Promise.resolve (response, body))

  let fetch_request ?timeout_span method_ url ~headers ~body =
    let controller = Fetch.AbortController.make () in
    let timeout_handle = abort_after controller timeout_span in
    let body = request_body body in
    let init =
      Fetch.RequestInit.make ~method_
        ~headers:(Fetch.HeadersInit.makeWithArray (Rrbvec.to_array headers))
        ?body
        ~signal:(Fetch.AbortController.signal controller)
        ()
    in
    promise_to_effect
      ~on_settle:(fun () -> clear_timeout_opt timeout_handle)
      (Fetch.fetchWithInit url init |> Js.Promise.then_ response_text)

  type parsed_url
  type client_request
  type incoming_message
  type socket
  type request_options
  type chunks = string array

  external parse_url : string -> parsed_url = "URL" [@@mel.new]
  external url_protocol : parsed_url -> string = "protocol" [@@mel.get]
  external url_hostname : parsed_url -> string = "hostname" [@@mel.get]
  external url_port : parsed_url -> string = "port" [@@mel.get]
  external url_pathname : parsed_url -> string = "pathname" [@@mel.get]
  external url_search : parsed_url -> string = "search" [@@mel.get]

  external empty_options : unit -> request_options = "Object" [@@mel.new]
  external set_method : request_options -> string -> unit = "method" [@@mel.set]

  external set_hostname : request_options -> string -> unit = "hostname"
  [@@mel.set]

  external set_port : request_options -> string -> unit = "port" [@@mel.set]
  external set_path : request_options -> string -> unit = "path" [@@mel.set]

  external set_headers : request_options -> string Js.Dict.t -> unit = "headers"
  [@@mel.set]

  let request_options method_ hostname port path headers =
    let options = empty_options () in
    set_method options method_;
    set_hostname options hostname;
    Option.iter (set_port options) port;
    set_path options path;
    set_headers options headers;
    options

  external http_request :
    request_options -> ((incoming_message -> unit)[@u]) -> client_request
    = "request"
  [@@mel.module "http"]

  external request_write : client_request -> string -> unit = "write"
  [@@mel.send]

  external request_end : client_request -> unit = "end" [@@mel.send]

  type js_error

  external make_error : string -> js_error = "Error" [@@mel.new]

  external request_destroy : client_request -> js_error -> unit = "destroy"
  [@@mel.send]

  external request_on_error :
    client_request -> (_[@mel.as "error"]) -> ((js_error -> unit)[@u]) -> unit
    = "on"
  [@@mel.send]

  external request_on_socket :
    client_request -> (_[@mel.as "socket"]) -> ((socket -> unit)[@u]) -> unit
    = "on"
  [@@mel.send]

  external set_no_delay : socket -> bool -> unit = "setNoDelay" [@@mel.send]

  external response_status_code : incoming_message -> int = "statusCode"
  [@@mel.get]

  external response_set_encoding : incoming_message -> string -> unit
    = "setEncoding"
  [@@mel.send]

  external response_on_data :
    incoming_message -> (_[@mel.as "data"]) -> ((string -> unit)[@u]) -> unit
    = "on"
  [@@mel.send]

  external response_on_end :
    incoming_message -> (_[@mel.as "end"]) -> ((unit -> unit)[@u]) -> unit
    = "on"
  [@@mel.send]

  external response_on_error :
    incoming_message -> (_[@mel.as "error"]) -> ((js_error -> unit)[@u]) -> unit
    = "on"
  [@@mel.send]

  external byte_length : string -> string -> int = "byteLength"
  [@@mel.scope "Buffer"]

  external push_chunk : chunks -> string -> int = "push" [@@mel.send]
  external join_chunks : chunks -> string -> string = "join" [@@mel.send]

  external empty_response : unit -> Fetch.Response.t = "Object" [@@mel.new]
  external set_status : Fetch.Response.t -> int -> unit = "status" [@@mel.set]
  external set_ok : Fetch.Response.t -> bool -> unit = "ok" [@@mel.set]

  (* Callers only read [Fetch.Response.status]. The global Response constructor
     loads undici, and that init dominates a one-shot CLI process. *)
  let make_response status =
    let response = empty_response () in
    set_status response status;
    set_ok response (status >= 200 && status < 300);
    response

  let invoke_reject : ((exn -> unit)[@u]) -> js_error -> unit =
    [%mel.raw {| function (reject, error) { reject(error); } |}]

  let method_name = function
    | Fetch.Get -> "GET"
    | Fetch.Head -> "HEAD"
    | Fetch.Post -> "POST"
    | Fetch.Put -> "PUT"
    | Fetch.Delete -> "DELETE"
    | Fetch.Connect -> "CONNECT"
    | Fetch.Options -> "OPTIONS"
    | Fetch.Trace -> "TRACE"
    | Fetch.Patch -> "PATCH"
    | Fetch.Other name -> name

  let header_exists headers name =
    let name = String.lowercase_ascii name in
    Rrbvec.exists
      (fun (key, _) -> String.lowercase_ascii key = name)
      headers

  let headers_dict headers body =
    let dict = Js.Dict.empty () in
    Rrbvec.iter (fun (key, value) -> Js.Dict.set dict key value) headers;
    if body <> "" && not (header_exists headers "content-length") then
      Js.Dict.set dict "Content-Length"
        (string_of_int (byte_length body "utf8"));
    dict

  let request ?timeout_span method_ url ~headers ~body =
    if is_body_forbidden method_ && body <> "" then
      invalid_arg "GET and HEAD requests must not include a body";
    let parsed = parse_url url in
    (* https stays on fetch: login uses AbortSignal, and the CLI tests stub
       global fetch. The worker query path is http and was paying undici init
       on every one-shot process. *)
    if url_protocol parsed = "https:" then
      fetch_request ?timeout_span method_ url ~headers ~body
    else
    let path = url_pathname parsed ^ url_search parsed in
    let port = url_port parsed in
    let port = if port = "" then None else Some port in
    let options =
      request_options (method_name method_) (url_hostname parsed) port path
        (headers_dict headers body)
    in
    let promise =
      Js.Promise.make (fun ~resolve ~reject ->
          let settled = ref false in
          let finish_ok value =
            if not !settled then (
              settled := true;
              (resolve value [@u]))
          in
          let finish_error error =
            if not !settled then (
              settled := true;
              invoke_reject reject error)
          in
          let timeout_handle = ref None in
          let clear_timeout () =
            match !timeout_handle with
            | None -> ()
            | Some handle ->
                timeout_handle := None;
                Timer.clear_timeout handle
          in
          let on_incoming incoming =
            let chunks = [||] in
            response_set_encoding incoming "utf8";
            response_on_data incoming (fun[@u] chunk ->
                ignore (push_chunk chunks chunk));
            response_on_error incoming (fun[@u] error ->
                clear_timeout ();
                finish_error error);
            response_on_end incoming (fun[@u] () ->
                clear_timeout ();
                finish_ok
                  ( make_response (response_status_code incoming),
                    join_chunks chunks "" ))
          in
          let req =
            http_request options (fun[@u] incoming -> on_incoming incoming)
          in
          request_on_socket req (fun[@u] socket -> set_no_delay socket true);
          request_on_error req (fun[@u] error ->
              clear_timeout ();
              finish_error error);
          (match timeout_ms timeout_span with
          | 0 -> ()
          | ms ->
              timeout_handle :=
                Some
                  (Timer.set_timeout
                     (fun () ->
                       let error = make_error "request timeout" in
                       request_destroy req error;
                       finish_error error)
                     ms));
          if body <> "" then request_write req body;
          request_end req)
    in
    promise_to_effect promise
end

module Crypto = struct
  module Node_crypto = struct
    type hash

    external create_hash : string -> hash = "createHash" [@@mel.module "crypto"]
    external update : hash -> string -> string -> hash = "update" [@@mel.send]
    external digest : hash -> string -> string = "digest" [@@mel.send]

    external random_bytes : int -> Node.Buffer.t = "randomBytes"
    [@@mel.module "crypto"]
  end

  let sha256_digest output_encoding text =
    let hash = Node_crypto.create_hash "sha256" in
    let hash = Node_crypto.update hash text "latin1" in
    Node_crypto.digest hash output_encoding

  let sha256_hex text = sha256_digest "hex" text
  let sha256_base64url text = sha256_digest "base64url" text

  let random_base64url size =
    let text =
      Node_crypto.random_bytes size |> Node.Buffer.toString ~encoding:`base64url
    in
    if String.length text <= size then text else String.sub text 0 size

  let base64url_decode text =
    Node.Buffer.fromStringWithEncoding text ~encoding:`base64url
    |> Node.Buffer.toString ~encoding:`utf8
end

module Events = struct
  type subscription = { close : unit -> unit Cli_effect.t }
  type readable_stream
  type reader
  type read_result
  type text_decoder
  type uint8_array

  external response_body : Fetch.Response.t -> readable_stream option = "body"
  [@@mel.get] [@@mel.return { null_to_opt }]

  external get_reader : readable_stream -> reader = "getReader" [@@mel.send]
  external read : reader -> read_result Js.Promise.t = "read" [@@mel.send]
  external cancel : reader -> unit Js.Promise.t = "cancel" [@@mel.send]
  external read_done : read_result -> bool = "done" [@@mel.get]

  external read_value : read_result -> uint8_array option = "value"
  [@@mel.get] [@@mel.return { undefined_to_opt }]

  external make_decoder : unit -> text_decoder = "TextDecoder" [@@mel.new]

  external decode :
    text_decoder -> uint8_array -> < stream : bool > Js.t -> string = "decode"
  [@@mel.send]

  let stream_options =
    let options = Js.Obj.empty () in
    Js.Obj.assign options [%obj { stream = true }]

  let rec read_loop closed decoder reader on_chunk =
    if !closed then Js.Promise.resolve ()
    else
      read reader
      |> Js.Promise.then_ (fun result ->
          if !closed || read_done result then Js.Promise.resolve ()
          else (
            result |> read_value
            |> Option.iter (fun value ->
                on_chunk (decode decoder value stream_options));
            read_loop closed decoder reader on_chunk))

  let connect ~url ~on_chunk =
    let closed = ref false in
    let reader_ref = ref None in
    let controller = Fetch.AbortController.make () in
    let init =
      Fetch.RequestInit.make ~method_:Fetch.Get
        ~headers:
          (Fetch.HeadersInit.makeWithArray
             [| ("Accept", "text/event-stream") |])
        ~signal:(Fetch.AbortController.signal controller)
        ()
    in
    Cli_effect.bind
      (HTTP.promise_to_effect (Fetch.fetchWithInit url init))
      (fun response ->
        if not (Fetch.Response.ok response) then
          Cli_effect.error
            (Js.Exn.raiseError
               ("events request failed ("
               ^ string_of_int (Fetch.Response.status response)
               ^ ")"))
        else
          let request =
            (match response_body response with
              | None ->
                  Fetch.Response.text response
                  |> Js.Promise.then_ (fun text ->
                      if not !closed then on_chunk text;
                      Js.Promise.resolve ())
              | Some body ->
                  let reader = get_reader body in
                  reader_ref := Some reader;
                  read_loop closed (make_decoder ()) reader on_chunk)
            |> Js.Promise.catch (fun _ -> Js.Promise.resolve ())
          in
          let close () =
            Fetch.AbortController.abort controller;
            (match !reader_ref with
            | None -> ()
            | Some reader ->
                ignore
                  (cancel reader
                   |> Js.Promise.catch (fun _ -> Js.Promise.resolve ())
                    : unit Js.Promise.t));
            Cli_effect.catch (HTTP.promise_to_effect request) (fun _ ->
                Cli_effect.pure ())
          in
          Cli_effect.pure { close })
end
