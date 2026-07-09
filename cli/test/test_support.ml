external tmpdir : unit -> string = "tmpdir" [@@mel.module "os"]

external mkdir_sync : string -> Js.Json.t Js.Dict.t -> unit = "mkdirSync"
[@@mel.module "fs"]

external mkdtemp_sync : string -> string = "mkdtempSync" [@@mel.module "fs"]

external rm_sync : string -> Js.Json.t Js.Dict.t -> unit = "rmSync"
[@@mel.module "fs"]

external chmod_sync : string -> int -> unit = "chmodSync" [@@mel.module "fs"]
external process_pid : int = "pid" [@@mel.module "process"]

external promise_error_message : Js.Promise.error -> string option = "message"
[@@mel.get] [@@mel.return { undefined_to_opt }]

let decode_uri_component = Js.Global.decodeURIComponent
let encode_uri_component = Js.Global.encodeURIComponent
let parse_json = Js.Json.parseExn
let set_timeout f ms = ignore (Js.Global.setTimeout ~f ms : Js.Global.timeoutId)

type timer = Js.Global.intervalId

let set_interval f ms = Js.Global.setInterval ~f ms
let clear_interval = Js.Global.clearInterval

external current_dirname : string = "__dirname"

type request
type response
type server
type stream
type child = < stdout : stream ; stderr : stream > Js.t
type cli_output = { code : int; stdout : string; stderr : string }

external create_server : ((request -> response -> unit)[@u]) -> server
  = "createServer"
[@@mel.module "http"]

external req_method : request -> string = "method" [@@mel.get]
external req_url : request -> string = "url" [@@mel.get]

external req_set_encoding : request -> string -> unit = "setEncoding"
[@@mel.send]

external req_on_data : request -> string -> ((string -> unit)[@u]) -> unit
  = "on"
[@@mel.send]

external req_on_end : request -> string -> ((unit -> unit)[@u]) -> unit = "on"
[@@mel.send]

external res_write_head : response -> int -> string Js.Dict.t -> unit
  = "writeHead"
[@@mel.send]

external res_write : response -> string -> unit = "write" [@@mel.send]
external res_end : response -> string -> unit = "end" [@@mel.send]
external res_destroy : response -> unit = "destroy" [@@mel.send]

external server_listen : server -> int -> string -> ((unit -> unit)[@u]) -> unit
  = "listen"
[@@mel.send]

external server_address : server -> < port : int > Js.t = "address" [@@mel.send]

external server_close : server -> ((unit -> unit)[@u]) -> unit = "close"
[@@mel.send]

external spawn_async :
  string -> string array -> < env : string Js.Dict.t > Js.t -> child = "spawn"
[@@mel.module "child_process"]

external stream_set_encoding : stream -> string -> unit = "setEncoding"
[@@mel.send]

external stream_on_data : stream -> string -> ((string -> unit)[@u]) -> unit
  = "on"
[@@mel.send]

external child_on_exit : child -> string -> ((int -> unit)[@u]) -> unit = "on"
[@@mel.send]

external child_on_close : child -> string -> ((int -> unit)[@u]) -> unit = "on"
[@@mel.send]

external child_on_error : child -> string -> ((exn -> unit)[@u]) -> unit = "on"
[@@mel.send]

external child_kill : child -> string -> unit = "kill" [@@mel.send]
external string_split : string -> string -> string array = "split" [@@mel.send]
external string_trim_end : string -> string = "trimEnd" [@@mel.send]

external string_match : string -> Js.Re.t -> < index : int > Js.t Js.null
  = "match"
[@@mel.send]

external chars_of_string : string -> string array = "from" [@@mel.scope "Array"]

type spawn_options = < encoding : string ; env : string Js.Dict.t > Js.t

type spawn_result =
  < status : int Js.null ; stdout : string ; stderr : string > Js.t

external spawn_sync : string -> string array -> spawn_options -> spawn_result
  = "spawnSync"
[@@mel.module "child_process"]

let test = Fest.test
let test_promise = Fest.Promise.test
let ( let* ) = Fest.Promise.( let* )
let pass = ()
let fail_test message = Fest.expect |> Fest.equal message ""

let sleep_ms ms =
  Js.Promise.make (fun ~resolve ~reject:_ ->
      set_timeout
        (fun () ->
          let value = () in
          (resolve value [@u]))
        ms)

let reject_with_assertion reject message =
  try fail_test message with exn -> reject exn [@u]

let fail_promise message =
  Js.Promise.make (fun ~resolve:_ ~reject ->
      reject_with_assertion reject message)

let assert_true name condition message =
  ignore name;
  if condition then pass else fail_test message

let assert_false name condition message =
  assert_true name (not condition) message

let entrypoint =
  match
    Js.Dict.get Node.Process.process##env "LOGSEQ_CLI_MELANGE_ENTRYPOINT"
  with
  | Some value -> value
  | None ->
      fail_test "missing LOGSEQ_CLI_MELANGE_ENTRYPOINT";
      ""

let run_cli args =
  let command =
    Array.append [| "node"; entrypoint |] args
    |> Vec.of_array |> Vec.string_concat " "
  in
  Node.Child_process.execSync command
    (Node.Child_process.option ~encoding:"utf8" ())

let clone_env extra =
  let env = Js.Dict.fromArray (Js.Dict.entries Node.Process.process##env) in
  Array.iter (fun (key, value) -> Js.Dict.set env key value) extra;
  env

let spawn_cli ?(env = [||]) args =
  spawn_sync Node.Process.argv.(0)
    (Array.append [| entrypoint |] args)
    [%obj { encoding = "utf8"; env = clone_env env }]

let spawn_cli_async ?(env = [||]) args =
  spawn_async Node.Process.argv.(0)
    (Array.append [| entrypoint |] args)
    [%obj { env = clone_env env }]

let result_status result =
  match Js.Null.toOption result##status with
  | Some status -> status
  | None -> -1

let assert_includes name text needle =
  assert_true name
    (Js.String.includes ~search:needle text)
    (Printf.sprintf "%s: expected output to contain %S\n%s" name needle text)

let assert_not_includes name text needle =
  assert_false name
    (Js.String.includes ~search:needle text)
    (Printf.sprintf "%s: expected output not to contain %S\n%s" name needle text)

let assert_exit_zero name result =
  let status = result_status result in
  assert_true name (status = 0)
    (Printf.sprintf "%s: expected exit 0, got %d\nstdout:\n%s\nstderr:\n%s" name
       status result##stdout result##stderr)

let assert_exit_non_zero name result =
  let status = result_status result in
  assert_true name (status <> 0)
    (Printf.sprintf
       "%s: expected non-zero exit, got 0\nstdout:\n%s\nstderr:\n%s" name
       result##stdout result##stderr)

let temp_dir prefix = mkdtemp_sync (Node.Path.join [| tmpdir (); prefix |])
let control_char = String.make 1 (Char.chr 1)

let expect_valid_json name text =
  try
    ignore (parse_json text);
    pass
  with exn ->
    fail_test
      (Printf.sprintf "%s: expected valid JSON, got %s\n%s" name
         (Printexc.to_string exn) text)

let expect_valid_edn name text =
  try
    ignore (Melange_edn_melange.of_edn_string text);
    pass
  with exn ->
    fail_test
      (Printf.sprintf "%s: expected valid EDN, got %s\n%s" name
         (Printexc.to_string exn) text)

let edn_any value = Melange_edn_melange.any value
let edn_keyword value = edn_any (Melange_edn_melange.keyword value)
let edn_string value = edn_any (Melange_edn_melange.string value)

let edn_map fields =
  Melange_edn_melange.map fields |> edn_any |> Melange_edn_melange.to_edn_string

let remove_tree path =
  rm_sync path
    (Js.Dict.fromArray
       [|
         ("recursive", Js.Json.boolean true); ("force", Js.Json.boolean true);
       |])

let write_file path text = Node.Fs.writeFileAsUtf8Sync path text
let read_file path = Node.Fs.readFileAsUtf8Sync path

let mkdir_p path =
  mkdir_sync path (Js.Dict.fromArray [| ("recursive", Js.Json.boolean true) |])

let json_response result_transit =
  "{\"resultTransit\":"
  ^ Js.Json.stringify (Js.Json.string result_transit)
  ^ "}"

let error_response message =
  "{\"error\":{\"message\":" ^ Js.Json.stringify (Js.Json.string message) ^ "}}"

let write_json res status body =
  res_write_head res status
    (Js.Dict.fromArray [| ("Content-Type", "application/json") |]);
  res_end res body

let base64url text =
  Node.Buffer.fromString text |> Node.Buffer.toString ~encoding:`base64url

let jwt_token payload =
  base64url "{\"alg\":\"none\",\"typ\":\"JWT\"}"
  ^ "." ^ base64url payload ^ ".signature"

let id_token ?(sub = "user-1") ?(email = "user@example.com") () =
  jwt_token
    (Printf.sprintf "{\"sub\":%s,\"email\":%s,\"exp\":4102444800}"
       (Js.Json.stringify (Js.Json.string sub))
       (Js.Json.stringify (Js.Json.string email)))

let token_response ?(sub = "user-1") ?(email = "user@example.com") () =
  let object_ = Js.Dict.empty () in
  Js.Dict.set object_ "id_token" (Js.Json.string (id_token ~sub ~email ()));
  Js.Dict.set object_ "access_token" (Js.Json.string "access-token");
  Js.Dict.set object_ "refresh_token" (Js.Json.string "refresh-token");
  Js.Json.stringify (Js.Json.object_ object_)

let query_param url key =
  let parts = Vec.split_on_char '?' url in
  if Vec.length parts = 2 then
    let query = Vec.nth parts 1 in
    query |> Vec.split_on_char '&'
    |> Vec.find_map (fun part ->
        let pair = Vec.split_on_char '=' part in
        if Vec.length pair = 2 && Vec.nth pair 0 = key then
          Some (Vec.nth pair 1)
        else None)
  else None

let json_data_object stdout =
  match Js.Json.decodeObject (parse_json stdout) with
  | None ->
      fail_test ("expected json object: " ^ stdout);
      Js.Dict.empty ()
  | Some root -> (
      match Option.bind (Js.Dict.get root "data") Js.Json.decodeObject with
      | None ->
          fail_test ("expected data object: " ^ stdout);
          Js.Dict.empty ()
      | Some data -> data)

let json_data_string stdout key =
  match
    Option.bind (Js.Dict.get (json_data_object stdout) key) Js.Json.decodeString
  with
  | Some value -> value
  | None ->
      fail_test ("expected string data field " ^ key ^ ": " ^ stdout);
      ""

let json_data_bool stdout key =
  match
    Option.bind
      (Js.Dict.get (json_data_object stdout) key)
      Js.Json.decodeBoolean
  with
  | Some value -> value
  | None ->
      fail_test ("expected boolean data field " ^ key ^ ": " ^ stdout);
      false

let run_cli_p ?(env = [||]) args =
  Js.Promise.make (fun ~resolve ~reject ->
      let child = spawn_cli_async ~env args in
      let stdout = ref "" in
      let stderr = ref "" in
      stream_set_encoding child##stdout "utf8";
      stream_set_encoding child##stderr "utf8";
      stream_on_data child##stdout "data" (fun[@u] chunk ->
          stdout := !stdout ^ chunk);
      stream_on_data child##stderr "data" (fun[@u] chunk ->
          stderr := !stderr ^ chunk);
      child_on_error child "error" (fun[@u] exn -> (reject exn [@u]));
      child_on_close child "close" (fun[@u] code ->
          (resolve { code; stdout = !stdout; stderr = !stderr } [@u])))

let invoke_server response_for_body =
  create_server (fun[@u] req res ->
      let body = ref "" in
      req_set_encoding req "utf8";
      req_on_data req "data" (fun[@u] chunk -> body := !body ^ chunk);
      req_on_end req "end" (fun[@u] () ->
          if req_method req <> "POST" || req_url req <> "/v1/invoke" then
            write_json res 404 (error_response "not found")
          else
            try write_json res 200 (json_response (response_for_body !body))
            with exn ->
              write_json res 400 (error_response (Printexc.to_string exn))))

let oauth_server () =
  create_server (fun[@u] req res ->
      let body = ref "" in
      req_set_encoding req "utf8";
      req_on_data req "data" (fun[@u] chunk -> body := !body ^ chunk);
      req_on_end req "end" (fun[@u] () ->
          ignore !body;
          if req_method req <> "POST" || req_url req <> "/oauth2/token" then
            write_json res 404 (error_response "not found")
          else write_json res 200 (token_response ())))

let rec fetch_with_retry attempts url =
  let request =
    Fetch.fetch url
    |> Js.Promise.then_ (fun response ->
        let status = Fetch.Response.status response in
        if status >= 200 && status <= 299 then Js.Promise.resolve ()
        else Js.Promise.reject (Failure ("HTTP " ^ string_of_int status)))
  in
  Js.Promise.catch
    (fun error ->
      if attempts <= 0 then
        let message =
          Option.value
            (promise_error_message error)
            ~default:"callback request failed"
        in
        Js.Promise.reject (Failure message)
      else
        sleep_ms 50
        |> Js.Promise.then_ (fun () -> fetch_with_retry (attempts - 1) url))
    request

let with_server server run =
  Js.Promise.make (fun ~resolve ~reject ->
      server_listen server 0 "127.0.0.1" (fun[@u] () ->
          let port = (server_address server)##port in
          let base_url = Printf.sprintf "http://127.0.0.1:%d" port in
          let finish resolve_or_reject value =
            server_close server (fun[@u] () -> (resolve_or_reject value [@u]))
          in
          match
            try Some (run base_url)
            with exn ->
              server_close server (fun[@u] () -> (reject exn [@u]));
              None
          with
          | None -> ()
          | Some promise ->
              ignore
                (Js.Promise.then_
                   (fun result ->
                     finish resolve result;
                     Js.Promise.resolve ())
                   promise);
              ignore
                (Js.Promise.catch
                   (fun error ->
                     let message =
                       Option.value
                         (promise_error_message error)
                         ~default:"JavaScript promise rejected"
                     in
                     server_close server (fun[@u] () ->
                         reject_with_assertion reject message);
                     Js.Promise.resolve pass)
                   promise)))

let assert_cli_exit_zero name output =
  assert_true name (output.code = 0)
    (Printf.sprintf "%s: expected exit 0, got %d\nstdout:\n%s\nstderr:\n%s" name
       output.code output.stdout output.stderr)

let assert_line_starts_with name text prefix =
  let lines = string_split (string_trim_end text) "\n" in
  assert_true name
    (Array.exists (fun line -> Js.String.startsWith ~prefix line) lines)
    (Printf.sprintf "%s: expected a line starting with %S\n%s" name prefix text)

let headers_from stdout =
  let lines = string_split (String.trim stdout) "\n" in
  if Array.length lines = 0 then [||]
  else
    let first = lines.(0) in
    string_split (String.trim first) " "
    |> Vec.of_array
    |> Vec.filter (( <> ) "")
    |> Vec.to_array

let array_prefix array length = Array.sub array 0 length

let array_suffix array length =
  Array.sub array (Array.length array - length) length

let string_array_equal left right =
  Array.length left = Array.length right && Array.for_all2 ( = ) left right

let char_width code =
  if
    code = 0 || code < 32
    || (code >= 0x7f && code < 0xa0)
    || (code >= 0x0300 && code <= 0x036f)
    || (code >= 0x1ab0 && code <= 0x1aff)
    || (code >= 0x1dc0 && code <= 0x1dff)
    || (code >= 0x20d0 && code <= 0x20ff)
    || (code >= 0xfe20 && code <= 0xfe2f)
  then 0
  else if
    code >= 0x1100
    && (code <= 0x115f || code = 0x2329 || code = 0x232a
       || (code >= 0x2e80 && code <= 0xa4cf && code <> 0x303f)
       || (code >= 0xac00 && code <= 0xd7a3)
       || (code >= 0xf900 && code <= 0xfaff)
       || (code >= 0xfe10 && code <= 0xfe19)
       || (code >= 0xfe30 && code <= 0xfe6f)
       || (code >= 0xff00 && code <= 0xff60)
       || (code >= 0xffe0 && code <= 0xffe6))
  then 2
  else 1

let display_width text =
  chars_of_string text
  |> Array.fold_left
       (fun width ch ->
         match Js.String.codePointAt ~index:0 ch with
         | Some code -> width + char_width code
         | None -> width)
       0

let assert_created_at_column_aligned stdout =
  let lines = string_split (string_trim_end stdout) "\n" in
  match Vec.pop_front (Rrbvec.of_array lines) with
  | None -> fail_test "missing list page output"
  | Some (header, rows) ->
      let created_index =
        match Js.String.indexOf ~search:"created-at" header with
        | -1 ->
            fail_test ("missing created-at header:\n" ^ stdout);
            0
        | index -> index
      in
      let expected = display_width (String.sub header 0 created_index) in
      let data_rows =
        match Vec.rev rows with
        | reversed when Vec.is_empty reversed -> Vec.empty
        | reversed -> (
            match Vec.pop_front reversed with
            | Some (_footer, reversed_data_rows) -> Vec.rev reversed_data_rows
            | None -> Vec.empty)
      in
      data_rows
      |> Vec.iter (fun line ->
          match
            Js.Null.toOption
              (string_match line (Js.Re.fromString "\\d+ [A-Za-z]+ ago"))
          with
          | None ->
              fail_test
                ("missing relative created-at cell in line: " ^ line ^ "\n"
               ^ stdout)
          | Some match_ ->
              let actual = display_width (String.sub line 0 match_##index) in
              if actual <> expected then
                fail_test
                  (Printf.sprintf
                     "created-at column mismatch: expected %d, got %d\n%s"
                     expected actual stdout));
      pass

let extract_snapshot_path body =
  let marker = "logseq_db_alpha\\\",\\\"" in
  let start = Js.String.indexOf ~search:marker body in
  if start < 0 then fail_test ("missing snapshot path marker in " ^ body);
  let value_start = start + String.length marker in
  let end_ = Js.String.indexOf ~search:"\\\"" ~start:value_start body in
  if end_ < 0 then fail_test ("unterminated snapshot path in " ^ body);
  Js.String.slice ~start:value_start ~end_ body

let expect_graph_in_json_list output graph =
  match Js.Json.decodeObject (parse_json output) with
  | None -> fail_test ("json graph list: expected object in " ^ output)
  | Some root -> (
      match Option.bind (Js.Dict.get root "data") Js.Json.decodeObject with
      | None -> fail_test ("json graph list: expected data object in " ^ output)
      | Some data -> (
          match Option.bind (Js.Dict.get data "graphs") Js.Json.decodeArray with
          | None ->
              fail_test ("json graph list: expected graphs array in " ^ output)
          | Some graphs ->
              let names =
                graphs |> Vec.of_array |> Vec.filter_map Js.Json.decodeString
              in
              if Vec.mem graph names then pass
              else fail_test ("json graph list: missing graph in " ^ output)))

let expect_named_contains _name text needle = assert_includes _name text needle

let expect_named_not_contains _name text needle =
  assert_not_includes _name text needle

let expect_exit_zero = assert_exit_zero
let expect_exit_non_zero = assert_exit_non_zero
let expect_cli_exit_zero = assert_cli_exit_zero
let expect_line_starts_with = assert_line_starts_with
let expect_created_at_column_aligned = assert_created_at_column_aligned
