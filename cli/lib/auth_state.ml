type auth_data = {
  provider : string;
  id_token : string option;
  access_token : string option;
  refresh_token : string option;
  expires_at : Ptime.t option;
  sub : string option;
  email : Cli_primitive.email option;
  updated_at : Ptime.t;
}

type login_result = {
  auth_path : Cli_primitive.path;
  authorize_url : Cli_primitive.url;
  opened : bool;
  email : Cli_primitive.email option;
  sub : string option;
  updated_at : Ptime.t;
}

type logout_result = {
  auth_path : Cli_primitive.path;
  deleted : bool;
  logout_url : Cli_primitive.url;
  opened : bool;
  logout_completed : bool;
}

let default_auth_path () =
  Filename.concat
    (Filename.concat
       (Sys.getenv_opt "HOME" |> Option.value ~default:".")
       "logseq")
    "auth.json"

let auth_path config =
  Option.value config.Cli_config.auth_path ~default:(default_auth_path ())

let rec mkdir_p path =
  if path = "" || path = Filename.dirname path || Sys.file_exists path then ()
  else (
    mkdir_p (Filename.dirname path);
    Cli_unix.mkdir path 0o755)

let read_file path =
  let ic = open_in_bin path in
  Fun.protect
    ~finally:(fun () -> close_in_noerr ic)
    (fun () ->
      let len = in_channel_length ic in
      really_input_string ic len)

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

let json_string key value = "\"" ^ key ^ "\":\"" ^ json_escape value ^ "\""
let json_int key value = "\"" ^ key ^ "\":" ^ Int64.to_string value

let add_opt_string key value fields =
  match value with
  | Some value -> json_string key value :: fields
  | None -> fields

let add_opt_int key value fields =
  match value with Some value -> json_int key value :: fields | None -> fields

let add_opt_time key value fields =
  add_opt_int key (Option.map Ptime_util.time_to_epoch_ms value) fields

let auth_json data =
  []
  |> add_opt_string "email" data.email
  |> add_opt_string "sub" data.sub
  |> add_opt_time "expires-at" data.expires_at
  |> add_opt_string "refresh-token" data.refresh_token
  |> add_opt_string "access-token" data.access_token
  |> add_opt_string "id-token" data.id_token
  |> fun fields ->
  json_int "updated-at" (Ptime_util.time_to_epoch_ms data.updated_at) :: fields
  |> fun fields ->
  json_string "provider" data.provider :: fields
  |> List.rev |> String.concat ","
  |> fun body -> "{" ^ body ^ "}\n"

let find_substring ~needle haystack =
  let needle_len = String.length needle in
  let haystack_len = String.length haystack in
  let rec loop i =
    if i + needle_len > haystack_len then None
    else if String.sub haystack i needle_len = needle then Some i
    else loop (i + 1)
  in
  loop 0

let skip_ws text index =
  let rec loop i =
    if i < String.length text then
      match text.[i] with ' ' | '\n' | '\r' | '\t' -> loop (i + 1) | _ -> i
    else i
  in
  loop index

let find_key_value_start text key =
  match find_substring ~needle:("\"" ^ key ^ "\"") text with
  | None -> None
  | Some key_pos ->
      let colon_pos = ref None in
      let i = ref (key_pos + String.length key + 2) in
      while Option.is_none !colon_pos && !i < String.length text do
        if text.[!i] = ':' then colon_pos := Some !i;
        incr i
      done;
      Option.map (fun pos -> skip_ws text (pos + 1)) !colon_pos

let parse_json_string_at text start =
  if start >= String.length text || text.[start] <> '"' then None
  else
    let buffer = Buffer.create 32 in
    let rec loop i =
      if i >= String.length text then None
      else
        match text.[i] with
        | '"' -> Some (Buffer.contents buffer)
        | '\\' when i + 1 < String.length text ->
            let c =
              match text.[i + 1] with
              | '"' -> '"'
              | '\\' -> '\\'
              | '/' -> '/'
              | 'n' -> '\n'
              | 'r' -> '\r'
              | 't' -> '\t'
              | other -> other
            in
            Buffer.add_char buffer c;
            loop (i + 2)
        | c ->
            Buffer.add_char buffer c;
            loop (i + 1)
    in
    loop (start + 1)

let json_string_field text keys =
  keys
  |> List.find_map (fun key ->
      match find_key_value_start text key with
      | Some start -> parse_json_string_at text start
      | None -> None)

let json_int_field text keys =
  keys
  |> List.find_map (fun key ->
      match find_key_value_start text key with
      | None -> None
      | Some start ->
          let stop = ref start in
          while
            !stop < String.length text
            && ((text.[!stop] >= '0' && text.[!stop] <= '9')
               || text.[!stop] = '-')
          do
            incr stop
          done;
          if !stop = start then None
          else Int64.of_string_opt (String.sub text start (!stop - start)))

let parse_auth_json text =
  let id_token = json_string_field text [ "id-token"; "id_token" ] in
  let access_token =
    json_string_field text [ "access-token"; "access_token" ]
  in
  let refresh_token =
    json_string_field text [ "refresh-token"; "refresh_token" ]
  in
  let provider = json_string_field text [ "provider" ] in
  match (provider, id_token, access_token, refresh_token) with
  | None, None, None, None ->
      Error
        (Error.make
           (Edn_util.keyword_t "invalid-auth-file")
           "invalid auth file")
  | _, _, _, _ ->
      let provider = Option.value provider ~default:"cognito" in
      Ok
        {
          provider;
          id_token;
          access_token;
          refresh_token;
          expires_at =
            Option.map Ptime_util.time_of_epoch_ms
              (json_int_field text [ "expires-at"; "expires_at" ]);
          sub = json_string_field text [ "sub" ];
          email = json_string_field text [ "email" ];
          updated_at =
            Option.value
              (Option.map Ptime_util.time_of_epoch_ms
                 (json_int_field text [ "updated-at"; "updated_at" ]))
              ~default:Ptime.epoch;
        }

let base64url_index = function
  | 'A' .. 'Z' as c -> Some (Char.code c - Char.code 'A')
  | 'a' .. 'z' as c -> Some (Char.code c - Char.code 'a' + 26)
  | '0' .. '9' as c -> Some (Char.code c - Char.code '0' + 52)
  | '-' -> Some 62
  | '_' -> Some 63
  | '=' -> None
  | _ -> None

let base64url_decode text =
  let buffer = Buffer.create (String.length text) in
  let bits = ref 0 in
  let value = ref 0 in
  String.iter
    (fun c ->
      match base64url_index c with
      | None -> ()
      | Some sextet ->
          value := (!value lsl 6) lor sextet;
          bits := !bits + 6;
          while !bits >= 8 do
            bits := !bits - 8;
            Buffer.add_char buffer (Char.chr ((!value lsr !bits) land 0xff));
            value := !value land ((1 lsl !bits) - 1)
          done)
    text;
  Buffer.contents buffer

let jwt_payload token =
  match String.split_on_char '.' token with
  | [ _header; payload; _signature ] -> Ok (base64url_decode payload)
  | _ ->
      Error
        (Error.make
           (Edn_util.keyword_t "invalid-auth-token")
           "invalid auth token")

let claims_of_id_token id_token =
  Error.bind (jwt_payload id_token) (fun payload ->
      Ok
        ( json_string_field payload [ "sub" ],
          json_string_field payload [ "email" ],
          Option.map
            (fun exp -> Ptime_util.time_of_epoch_ms (Int64.mul exp 1_000L))
            (json_int_field payload [ "exp" ]) ))

let auth_path_context path =
  Edn_util.map [ (Edn_util.keyword ":auth-path", Edn_util.string path) ]

let read_auth_file config =
  let path = auth_path config in
  Cli_effect.pure
    (if not (Sys.file_exists path) then Ok None
     else
       try Error.map (fun data -> Some data) (parse_auth_json (read_file path))
       with exn ->
         Error
           (Error.make ~context:(auth_path_context path)
              (Edn_util.keyword_t "invalid-auth-file")
              (Printexc.to_string exn)))

let write_auth_file config data =
  let path = auth_path config in
  Cli_effect.pure
    (try
       mkdir_p (Filename.dirname path);
       let oc = open_out_bin path in
       Fun.protect
         ~finally:(fun () -> close_out_noerr oc)
         (fun () -> output_string oc (auth_json data));
       (try Cli_unix.chmod path 0o600 with Cli_unix.Cli_unix_error _ -> ());
       Ok data
     with exn ->
       Error
         (Error.make ~context:(auth_path_context path)
            (Edn_util.keyword_t "auth-file-write-failed")
            (Printexc.to_string exn)))

let delete_auth_file config =
  let path = auth_path config in
  Cli_effect.pure
    (try
       if Sys.file_exists path then Sys.remove path;
       Ok ()
     with exn ->
       Error
         (Error.make ~context:(auth_path_context path)
            (Edn_util.keyword_t "auth-file-delete-failed")
            (Printexc.to_string exn)))

let expired_auth auth =
  match auth.expires_at with
  | Some expires_at -> Ptime.compare expires_at (Ptime_util.now ()) <= 0
  | None -> true

let missing_auth config message =
  Error.make ~hint:"Run `logseq login` first."
    ~context:(auth_path_context (auth_path config))
    (Edn_util.keyword_t "missing-auth")
    message

let config_auth config =
  if
    Option.is_some config.Cli_config.id_token
    || Option.is_some config.access_token
    || Option.is_some config.refresh_token
  then
    Some
      {
        provider = "cognito";
        id_token = config.id_token;
        access_token = config.access_token;
        refresh_token = config.refresh_token;
        expires_at = None;
        sub = None;
        email = None;
        updated_at = Ptime_util.now ();
      }
  else None

let raw_config_string config keys =
  match config.Cli_config.raw_file_config with
  | None -> None
  | Some value -> List.find_map (Edn_util.get_string value) keys

let default_oauth_domain = "logseq-prod.auth.us-east-1.amazoncognito.com"
let default_oauth_client_id = "69cs1lgme7p8kbgld8n5kseii6"
let default_api_http_base = "https://api.logseq.io"

let normalize_base_url value =
  let value = String.trim value in
  if value <> "" && value.[String.length value - 1] = '/' then
    String.sub value 0 (String.length value - 1)
  else value

let oauth_domain_base config =
  match raw_config_string config [ ":oauth-domain"; ":domain" ] with
  | Some domain when String.trim domain <> "" -> "https://" ^ String.trim domain
  | _ -> "https://" ^ default_oauth_domain

let raw_http_base config = raw_config_string config [ ":http-base" ]

let configured_http_base config =
  match raw_http_base config with
  | Some base when String.trim base <> "" -> Some base
  | _ -> (
      match config.Cli_config.http_base with
      | Some base
        when String.trim base <> ""
             && normalize_base_url base <> default_api_http_base ->
          Some base
      | _ -> None)

let oauth_endpoint_base config =
  Option.value (configured_http_base config) ~default:(oauth_domain_base config)

let token_endpoint config =
  match
    raw_config_string config [ ":oauth-token-endpoint"; ":token-endpoint" ]
  with
  | Some endpoint when String.trim endpoint <> "" -> Some endpoint
  | _ -> Some (normalize_base_url (oauth_endpoint_base config) ^ "/oauth2/token")

let oauth_client_id config =
  match raw_config_string config [ ":oauth-client-id"; ":client-id" ] with
  | Some client_id when String.trim client_id <> "" -> Some client_id
  | _ -> Some default_oauth_client_id

let authorize_endpoint config =
  match
    raw_config_string config
      [ ":oauth-authorize-endpoint"; ":authorize-endpoint" ]
  with
  | Some endpoint when String.trim endpoint <> "" -> Some endpoint
  | _ ->
      Some
        (normalize_base_url (oauth_endpoint_base config) ^ "/oauth2/authorize")

let oauth_scope config =
  Option.value
    (raw_config_string config [ ":oauth-scope"; ":scope" ])
    ~default:"email openid phone"

let raw_config_bool config keys ~default =
  match config.Cli_config.raw_file_config with
  | None -> default
  | Some value -> (
      match List.find_map (Edn_util.get value) keys with
      | Some value when Option.is_some (Edn_util.as_bool value) ->
          Option.get (Edn_util.as_bool value)
      | Some value when Option.is_some (Edn_util.as_string value) ->
          let value = Option.get (Edn_util.as_string value) in
          String.lowercase_ascii (String.trim value) = "true"
      | _ -> default)

let form_encode value =
  let hex = "0123456789ABCDEF" in
  let buffer = Buffer.create (String.length value) in
  String.iter
    (fun c ->
      match c with
      | 'A' .. 'Z' | 'a' .. 'z' | '0' .. '9' | '-' | '_' | '.' | '~' ->
          Buffer.add_char buffer c
      | _ ->
          let code = Char.code c in
          Buffer.add_char buffer '%';
          Buffer.add_char buffer hex.[code lsr 4];
          Buffer.add_char buffer hex.[code land 0x0f])
    value;
  Buffer.contents buffer

let form_body fields =
  fields
  |> List.map (fun (key, value) -> form_encode key ^ "=" ^ form_encode value)
  |> String.concat "&"

let query_string fields =
  fields
  |> List.map (fun (key, value) -> form_encode key ^ "=" ^ form_encode value)
  |> String.concat "&"

let random_base64url size =
  let chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
  in
  let buffer = Bytes.create size in
  for i = 0 to size - 1 do
    Bytes.set buffer i chars.[Random.int (String.length chars)]
  done;
  Bytes.to_string buffer

let pkce_challenge verifier = Sha256.base64url verifier

let raw_or_random config keys size =
  match raw_config_string config keys with
  | Some value when String.trim value <> "" -> value
  | _ -> random_base64url size

let refreshed_auth_of_body current body =
  match json_string_field body [ "id_token"; "id-token" ] with
  | None ->
      Error
        (Error.make
           (Edn_util.keyword_t "missing-id-token")
           "auth token response missing id_token")
  | Some id_token ->
      Error.bind (claims_of_id_token id_token) (fun (sub, email, expires_at) ->
          Ok
            {
              provider = "cognito";
              id_token = Some id_token;
              access_token =
                json_string_field body [ "access_token"; "access-token" ];
              refresh_token =
                (match
                   json_string_field body [ "refresh_token"; "refresh-token" ]
                 with
                | Some _ as token -> token
                | None -> current.refresh_token);
              expires_at;
              sub;
              email;
              updated_at = Ptime_util.now ();
            })

let refresh_auth config data =
  match data.refresh_token with
  | None ->
      Cli_effect.pure (Error (missing_auth config "missing refresh token"))
  | Some refresh_token -> (
      match token_endpoint config with
      | None ->
          Cli_effect.pure
            (Error
               (Error.make ~hint:"Run `logseq login` first."
                  (Edn_util.keyword_t "auth-refresh-failed")
                  "auth token endpoint is not configured"))
      | Some url ->
          let fields =
            [
              ("grant_type", "refresh_token"); ("refresh_token", refresh_token);
            ]
          in
          let fields =
            match oauth_client_id config with
            | Some client_id -> fields @ [ ("client_id", client_id) ]
            | None -> fields
          in
          let request =
            Transport.request
              {
                method_ = "POST";
                url;
                headers =
                  [
                    ("Content-Type", "application/x-www-form-urlencoded");
                    ("Accept", "application/json");
                  ];
                body = Some (form_body fields);
                timeout_span = Some config.timeout_span;
              }
          in
          Cli_effect.catch
            (Cli_effect.map
               (fun response ->
                 refreshed_auth_of_body data response.Transport.body)
               request)
            (fun exn ->
              Cli_effect.pure
                (Error
                   (Error.make ~hint:"Run `logseq login` first."
                      ~context:
                        (Edn_util.map
                           [
                             ( Edn_util.keyword ":auth-path",
                               Edn_util.string (auth_path config) );
                             ( Edn_util.keyword ":error",
                               Edn_util.string (Printexc.to_string exn) );
                           ])
                      (Edn_util.keyword_t "auth-refresh-failed")
                      "auth refresh failed"))))

let auth_code_exchange config ~code ~redirect_uri ~code_verifier =
  match token_endpoint config with
  | None ->
      Cli_effect.pure
        (Error
           (Error.make ~hint:"Run `logseq login` first."
              (Edn_util.keyword_t "auth-code-exchange-failed")
              "auth token endpoint is not configured"))
  | Some url ->
      let fields =
        [
          ("grant_type", "authorization_code");
          ("code", code);
          ("redirect_uri", redirect_uri);
          ("code_verifier", code_verifier);
        ]
      in
      let fields =
        match oauth_client_id config with
        | Some client_id -> fields @ [ ("client_id", client_id) ]
        | None -> fields
      in
      let request =
        Transport.request
          {
            method_ = "POST";
            url;
            headers =
              [
                ("Content-Type", "application/x-www-form-urlencoded");
                ("Accept", "application/json");
              ];
            body = Some (form_body fields);
            timeout_span = Some config.timeout_span;
          }
      in
      Cli_effect.catch
        (Cli_effect.map
           (fun response ->
             refreshed_auth_of_body
               {
                 provider = "cognito";
                 id_token = None;
                 access_token = None;
                 refresh_token = None;
                 expires_at = None;
                 sub = None;
                 email = None;
                 updated_at = Ptime_util.now ();
               }
               response.Transport.body)
           request)
        (fun exn ->
          Cli_effect.pure
            (Error
               (Error.make ~hint:"Run `logseq login` first."
                  ~context:
                    (Edn_util.map
                       [
                         ( Edn_util.keyword ":auth-path",
                           Edn_util.string (auth_path config) );
                         ( Edn_util.keyword ":error",
                           Edn_util.string (Printexc.to_string exn) );
                       ])
                  (Edn_util.keyword_t "auth-code-exchange-failed")
                  "authorization code exchange failed")))

let redirect_path = "/auth/callback"
let callback_host = "localhost"
let callback_port = 8765

let split_once c value =
  match String.index_opt value c with
  | None -> (value, "")
  | Some idx ->
      ( String.sub value 0 idx,
        String.sub value (idx + 1) (String.length value - idx - 1) )

let hex_value = function
  | '0' .. '9' as c -> Some (Char.code c - Char.code '0')
  | 'a' .. 'f' as c -> Some (Char.code c - Char.code 'a' + 10)
  | 'A' .. 'F' as c -> Some (Char.code c - Char.code 'A' + 10)
  | _ -> None

let url_decode value =
  let buffer = Buffer.create (String.length value) in
  let rec loop index =
    if index >= String.length value then Buffer.contents buffer
    else
      match value.[index] with
      | '+' ->
          Buffer.add_char buffer ' ';
          loop (index + 1)
      | '%' when index + 2 < String.length value -> (
          match (hex_value value.[index + 1], hex_value value.[index + 2]) with
          | Some hi, Some lo ->
              Buffer.add_char buffer (Char.chr ((hi lsl 4) lor lo));
              loop (index + 3)
          | _ ->
              Buffer.add_char buffer value.[index];
              loop (index + 1))
      | c ->
          Buffer.add_char buffer c;
          loop (index + 1)
  in
  loop 0

let query_params query =
  query |> String.split_on_char '&'
  |> List.filter_map (fun part ->
      if part = "" then None
      else
        let key, value = split_once '=' part in
        Some (url_decode key, url_decode value))

let login_callback_response status body : Cli_platform.login_callback_response =
  { status; body }

let callback_result_of_target ~state = function
  | None ->
      ( login_callback_response 400 "Invalid request",
        Error
          (Error.make
             (Edn_util.keyword_t "invalid-callback-request")
             "invalid login callback request") )
  | Some target -> (
      let path, query = split_once '?' target in
      let params = query_params query in
      let param key = List.assoc_opt key params in
      match (path, param "error", param "state", param "code") with
      | path, _, _, _ when path <> redirect_path ->
          ( login_callback_response 404 "Not found",
            Error
              (Error.make
                 (Edn_util.keyword_t "login-callback-not-found")
                 "login callback path not found") )
      | _, Some oauth_error, _, _ ->
          ( login_callback_response 400
              "Login failed. You can return to the CLI.",
            Error
              (Error.make
                 ~context:
                   (Edn_util.map
                      [
                        ( Edn_util.keyword ":oauth-error",
                          Edn_util.string oauth_error );
                      ])
                 (Edn_util.keyword_t "login-callback-error")
                 "login callback returned oauth error") )
      | _, _, Some callback_state, _ when callback_state <> state ->
          ( login_callback_response 400
              "Login failed due to state mismatch. Return to the CLI and retry.",
            Error
              (Error.make
                 (Edn_util.keyword_t "invalid-callback-state")
                 "login callback state mismatch") )
      | _, _, _, Some code when String.trim code <> "" ->
          ( login_callback_response 200
              "Login successful. You can return to the CLI.",
            Ok code )
      | _ ->
          ( login_callback_response 400
              "Login failed because the callback did not include a code.",
            Error
              (Error.make
                 (Edn_util.keyword_t "missing-callback-code")
                 "missing authorization code") ))

let open_browser config url =
  if
    not
      (raw_config_bool config
         [ ":open-browser"; ":open-browser?" ]
         ~default:true)
  then Ok false
  else if Cli_unix.open_url url then Ok true
  else
    Error
      (Error.make
         (Edn_util.keyword_t "browser-open-failed")
         "failed to open browser")

let resolve_auth config =
  match config_auth config with
  | Some auth -> Cli_effect.pure (Ok auth)
  | None ->
      Cli_effect.bind (read_auth_file config) (function
        | Error err -> Cli_effect.pure (Error err)
        | Ok None ->
            Cli_effect.pure (Error (missing_auth config "missing auth"))
        | Ok (Some auth) ->
            if expired_auth auth then
              Cli_effect.bind (refresh_auth config auth) (function
                | Error err -> Cli_effect.pure (Error err)
                | Ok refreshed -> write_auth_file config refreshed)
            else Cli_effect.pure (Ok auth))

let resolve_auth_token config =
  Cli_effect.bind (resolve_auth config) (function
    | Error err -> Cli_effect.pure (Error err)
    | Ok auth -> (
        match auth.id_token with
        | Some token when String.trim token <> "" -> Cli_effect.pure (Ok token)
        | _ ->
            Cli_effect.pure
              (Error (missing_auth config "auth token is required"))))

let login config =
  match authorize_endpoint config with
  | None ->
      Cli_effect.pure
        (Error
           (Error.make
              (Edn_util.keyword_t "login-not-configured")
              "oauth authorize endpoint is not configured"))
  | Some authorize_endpoint -> (
      match oauth_client_id config with
      | None ->
          Cli_effect.pure
            (Error
               (Error.make
                  (Edn_util.keyword_t "login-not-configured")
                  "oauth client id is not configured"))
      | Some client_id ->
          let state = raw_or_random config [ ":oauth-state"; ":state" ] 24 in
          let code_verifier =
            raw_or_random config [ ":oauth-code-verifier"; ":code-verifier" ] 48
          in
          let code_challenge =
            match
              raw_config_string config
                [ ":oauth-code-challenge"; ":code-challenge" ]
            with
            | Some value when String.trim value <> "" -> value
            | _ -> pkce_challenge code_verifier
          in
          let redirect_uri =
            "http://" ^ callback_host ^ ":"
            ^ string_of_int callback_port
            ^ redirect_path
          in
          let authorize_url =
            authorize_endpoint ^ "?"
            ^ query_string
                [
                  ("response_type", "code");
                  ("client_id", client_id);
                  ("scope", oauth_scope config);
                  ("redirect_uri", redirect_uri);
                  ("state", state);
                  ("code_challenge", code_challenge);
                  ("code_challenge_method", "S256");
                ]
          in
          let finish_login opened code =
            Cli_effect.bind
              (auth_code_exchange config ~code ~redirect_uri ~code_verifier)
              (function
              | Error err -> Cli_effect.pure (Error err)
              | Ok auth ->
                  Cli_effect.bind (write_auth_file config auth) (function
                    | Error err -> Cli_effect.pure (Error err)
                    | Ok data ->
                        Cli_effect.pure
                          (Ok
                             {
                               auth_path = auth_path config;
                               authorize_url;
                               opened;
                               email = data.email;
                               sub = data.sub;
                               updated_at = data.updated_at;
                             })))
          in
          let opened_ref = ref false in
          let browser_open_error = ref None in
          let on_listen () =
            match open_browser config authorize_url with
            | Ok opened ->
                opened_ref := opened;
                Cli_effect.pure (Ok ())
            | Error err ->
                browser_open_error := Some err;
                Cli_effect.pure (Error err.Error.message)
          in
          let handle_request request =
            callback_result_of_target ~state request.Cli_platform.target
          in
          Cli_effect.bind
            (Cli_platform.login_callback_server ~host:callback_host
               ~port:callback_port ~timeout_span:config.login_timeout_span
               ~on_listen ~handle_request) (function
            | Ok (Ok code) -> finish_login !opened_ref code
            | Ok (Error err) -> Cli_effect.pure (Error err)
            | Error Cli_platform.Login_callback_timeout ->
                Cli_effect.pure
                  (Error
                     (Error.make
                        (Edn_util.keyword_t "login-timeout")
                        "login callback timed out"))
            | Error (Cli_platform.Login_callback_server_aborted message) -> (
                match !browser_open_error with
                | Some err -> Cli_effect.pure (Error err)
                | None ->
                    Cli_effect.pure
                      (Error
                         (Error.make
                            ~context:
                              (Edn_util.map
                                 [
                                   ( Edn_util.keyword ":error",
                                     Edn_util.string message );
                                 ])
                            (Edn_util.keyword_t
                               "login-callback-server-start-failed")
                            "failed to start login callback server")))
            | Error (Cli_platform.Login_callback_server_start_failed message) ->
                Cli_effect.pure
                  (Error
                     (Error.make
                        ~context:
                          (Edn_util.map
                             [
                               ( Edn_util.keyword ":error",
                                 Edn_util.string message );
                             ])
                        (Edn_util.keyword_t "login-callback-server-start-failed")
                        "failed to start login callback server"))))

let logout config =
  let path = auth_path config in
  let existed = Sys.file_exists path in
  Cli_effect.bind (delete_auth_file config) (function
    | Error err -> Cli_effect.pure (Error err)
    | Ok () ->
        Cli_effect.pure
          (Ok
             {
               auth_path = path;
               deleted = existed;
               logout_url = "";
               opened = false;
               logout_completed = false;
             }))
