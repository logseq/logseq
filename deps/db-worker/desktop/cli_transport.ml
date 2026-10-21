(* Port of logseq.cli.transport — the request/invoke surface the desktop
   port uses (POST {base-url}/v1/invoke, transit-encoded args). The cljs
   version drives node http/https sockets; this one goes through the
   platform Http.send (fetch) and Db_worker_effect timeouts. The
   event-stream helpers (connect-events!/read-input) are not part of
   this port. *)

module E = Db_worker_effect

type config =
  { base_url : string option
  ; timeout_ms : float option
  ; profile_session : Cli_profile.session option
  }

let exn_info ~(code : string) (message : string)
    (fields : (string * Wire.t) list) : exn =
  Dispatcher.Exn_info
    ( message
    , (Wire.Keyword "code", Wire.Keyword code)
      :: List.map (fun (k, v) -> (Wire.Keyword k, v)) fields )

let default_timeout_ms = 10000.

let base_headers =
  [ ("Content-Type", "application/json")
  ; ("Accept", "application/json")
  ]

(* normalize-base-url *)
let normalize_base_url (base_url : string option) : string =
  match Option.map String.trim base_url with
  | None | Some "" ->
      raise (exn_info ~code:"missing-base-url" "base-url is required" [])
  | Some url ->
      let len = String.length url in
      if len > 0 && url.[len - 1] = '/' then String.sub url 0 (len - 1)
      else url

external get_index : Js.Json.t -> string -> Js.Json.t Js.Undefined.t = ""
  [@@mel.get_index]

let json_obj (kvs : (string * Js.Json.t) list) : Js.Json.t =
  let d = Js.Dict.empty () in
  List.iter (fun (k, v) -> Js.Dict.set d k v) kvs;
  Js.Json.object_ d

let json_field (json : Js.Json.t) (key : string) : Js.Json.t option =
  match Js.Json.classify json with
  | Js.Json.JSONObject _ -> Js.Undefined.toOption (get_index json key)
  | _ -> None

let json_string_field (json : Js.Json.t) (key : string) : string option =
  Option.bind (json_field json key) Js.Json.decodeString

(* parsed error body: {error: {message, code}} — cljs keywordized keys
   arrive as plain string fields in the JSON object. *)
let api_error_fields (body : string) : string option * string option =
  let error =
    try
      Option.bind
        (json_field (Js.Json.parseExn body) "error")
        (fun e -> Some e)
    with _ -> None
  in
  match error with
  | Some e -> (json_string_field e "message", json_string_field e "code")
  | None -> (None, None)

(* request — resolves {:status :body} on 2xx; otherwise raises ex-info
   {:code (or api-code :http-error) :status :body}. *)
let request ~(method_ : string) ~(url : string)
    ?(headers : (string * string) list = []) ?(body : string option)
    ~(timeout_ms : float) () : (int * string) E.t =
  E.bind
    (E.timeout (Http.send { url; method_; headers; body }) timeout_ms)
    (fun (res : Http.response) ->
      if res.status >= 200 && res.status <= 299 then
        E.pure (res.status, res.body)
      else
        let api_message, api_code = api_error_fields res.body in
        let message =
          match api_message with
          | Some m when String.trim m <> "" -> m
          | _ ->
              if String.trim res.body <> "" then
                Printf.sprintf "http request failed (%d)\nhttp response: %s"
                  res.status res.body
              else
                Printf.sprintf "http request failed (%d)" res.status
        in
        E.error
          (Dispatcher.Exn_info
             ( message
             , [
                 ( Wire.Keyword "code"
                 , Wire.Keyword
                     (Option.value api_code ~default:"http-error") )
               ; (Wire.Keyword "status", Wire.Int res.status)
               ; (Wire.Keyword "body", Wire.String res.body)
               ] )))

(* invoke — cljs takes a keyword/string method and a cljs seq of args;
   callers here pass a string method and a Datascript.value array. *)
let invoke_task (config : config) (method_ : string)
    (args : Datascript.value array) : Datascript.value E.t =
  let base_url = normalize_base_url config.base_url in
  let method_ = String.trim method_ in
  if String.equal method_ "" then
    raise
      (exn_info ~code:"missing-invoke-method" "invoke method is required" []);
  let url = base_url ^ "/v1/invoke" in
  let body =
    Js.Json.stringify
      (json_obj
         [ ("method", Js.Json.string method_)
         ; ( "argsTransit"
           , Js.Json.string
               (Transit_codec.to_string
                  (Wire.Array
                     (List.map Ds_wire.transit_of_value
                        (Array.to_list args)))) )
         ])
  in
  let stage = "transport.invoke:" ^ method_ in
  let start_ms = Js.Date.now () in
  Cli_profile.time_task config.profile_session stage (fun () ->
      Electron_logger.debug_args
        [| Js.Json.string "cli.transport/invoke"
         ; Js.Json.string "method"
         ; Js.Json.string method_
         ; Js.Json.string "url"
         ; Js.Json.string url
        |];
      E.bind
        (request ~method_:"POST" ~url ~headers:base_headers ~body
           ~timeout_ms:(Option.value config.timeout_ms
                          ~default:default_timeout_ms)
           ())
        (fun (_status, body) ->
          let parsed = Js.Json.parseExn body in
          let result_transit = json_string_field parsed "resultTransit" in
          let decoded =
            match result_transit with
            | Some s -> Ds_wire.value_of_transit (Transit_codec.of_string s)
            | None -> Datascript.Nil
          in
          Electron_logger.debug_args
            [| Js.Json.string "cli.transport/response"
             ; Js.Json.string "method"
             ; Js.Json.string method_
             ; Js.Json.string "elapsed-ms"
             ; Js.Json.number (Js.Date.now () -. start_ms)
            |];
          E.pure decoded))

let invoke (config : config) (method_ : string)
    (args : Datascript.value array) : Datascript.value Js.Promise.t =
  Cli_server.promise_of_task (invoke_task config method_ args)
