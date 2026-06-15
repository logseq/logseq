open Test_support

let expect_equal name expected actual =
  if expected = actual then pass
  else fail_test (Printf.sprintf "%s: expected %S, got %S" name expected actual)

let expect_bool name expected actual =
  if expected = actual then pass
  else fail_test (Printf.sprintf "%s: expected %b, got %b" name expected actual)

let expect_int name expected actual =
  if expected = actual then pass
  else fail_test (Printf.sprintf "%s: expected %d, got %d" name expected actual)

let expect_int64 name expected actual =
  if expected = actual then pass
  else
    fail_test
      (Printf.sprintf "%s: expected %s, got %s" name (Int64.to_string expected)
         (Int64.to_string actual))

external string_char_code_at : string -> int -> int = "charCodeAt" [@@mel.send]

let expect_some name = function
  | Some value -> value
  | None ->
      fail_test (name ^ ": expected Some value");
      assert false

let expect_none name = function
  | None -> pass
  | Some _ -> fail_test (name ^ ": expected None")

let expect_ok name = function
  | Ok value -> value
  | Error err ->
      fail_test (name ^ ": " ^ err.Error.message);
      assert false

let expect_error_code name expected = function
  | Error err ->
      let normalize_code code =
        if String.length code > 0 && code.[0] = ':' then
          String.sub code 1 (String.length code - 1)
        else code
      in
      expect_equal name (normalize_code expected)
        (normalize_code (Edn_util.keyword_to_string err.Error.code))
  | Ok _ -> fail_test (name ^ ": expected Error")

let expect_error_context_code name expected err =
  match err.Error.context with
  | None -> fail_test (name ^ ": expected error context")
  | Some context ->
      expect_equal name expected
        (expect_some (name ^ " code")
           (Option.bind (Edn_util.get context "code") Edn_util.as_keyword))

let expect_parse_ok name argv =
  match Cli_parse.parse argv with
  | Ok request -> request
  | Error err ->
      fail_test (name ^ ": " ^ err.Error.message);
      assert false

let expect_parse_error_code name expected argv =
  expect_error_code name expected (Cli_parse.parse argv)

let keyword_text value = Edn_util.keyword_to_string value
let edn_of_string text = Melange_edn.of_edn_string text
let repo_text repo = Cli_primitive.string_of_repo repo
let graph_text graph = Cli_primitive.string_of_graph graph

let unicode_text codepoints =
  String.concat "" (List.map Js.String.fromCodePoint codepoints)

let property_key_text = function
  | Property.Key_ident ident -> keyword_text ident
  | Property.Key_id id -> Int64.to_string id
  | Property.Key_name name -> name

let empty_common_opts =
  {
    List_command.fields = None;
    limit = None;
    offset = None;
    sort = None;
    order = None;
  }

let entity ?id ?title ?name ?ident ?updated_at ?created_at () =
  let raw_fields =
    ( ( ( ( ( [] |> fun fields ->
              match id with
              | Some id ->
                  (Edn_util.keyword "db/id", Edn_util.int64 id) :: fields
              | None -> fields )
          |> fun fields ->
            match title with
            | Some title ->
                (Edn_util.keyword "block/title", Edn_util.string title)
                :: fields
            | None -> fields )
        |> fun fields ->
          match name with
          | Some name ->
              (Edn_util.keyword "block/name", Edn_util.string name) :: fields
          | None -> fields )
      |> fun fields ->
        match ident with
        | Some ident ->
            (Edn_util.keyword "db/ident", Edn_util.keyword ident) :: fields
        | None -> fields )
    |> fun fields ->
      match updated_at with
      | Some updated_at ->
          (Edn_util.keyword "block/updated-at", Edn_util.int64 updated_at)
          :: fields
      | None -> fields )
    |> fun fields ->
    match created_at with
    | Some created_at ->
        (Edn_util.keyword "block/created-at", Edn_util.int64 created_at)
        :: fields
    | None -> fields
  in
  Entity.of_value (Edn_util.map raw_fields)

let span stage span_id start_ms end_ms =
  let start_time = Time.time_of_epoch_ms (Int64.of_int start_ms) in
  let end_time = Time.time_of_epoch_ms (Int64.of_int end_ms) in
  {
    Profile_types.stage;
    span_id;
    start_time;
    end_time;
    elapsed_span = Time.non_negative_diff ~start_time ~end_time;
  }

let stage_count stage summaries =
  summaries
  |> List.find_map (fun (summary : Profile_types.stage_summary) ->
      if summary.stage = stage then Some summary.count else None)

let config ?graph ?repo ?output_format ?auth_path ?id_token ?access_token
    ?refresh_token ?raw_file_config ?list_title_max_display_width
    ?(root_dir = "/tmp/logseq-cli-test") () =
  let defaults = Cli_config.defaults () in
  {
    Cli_config.graph = Option.map Cli_primitive.create_graph graph;
    repo = Option.map Cli_primitive.create_repo repo;
    root_dir;
    config_path = Node.Path.join [| root_dir; "cli.edn" |];
    timeout_span = defaults.timeout_span;
    login_timeout_span = defaults.login_timeout_span;
    logout_timeout_span = defaults.logout_timeout_span;
    list_title_max_display_width =
      Option.value list_title_max_display_width
        ~default:defaults.list_title_max_display_width;
    output_format;
    verbose = false;
    profile = false;
    ws_url = Some defaults.ws_url;
    http_base = Some defaults.http_base;
    auth_path;
    id_token;
    access_token;
    refresh_token;
    base_url = None;
    owner_source = Cli_primitive.Cli;
    project_dir = None;
    raw_file_config;
    profile_session = None;
  }

let config_with_output config mode =
  { config with Cli_config.output_format = Some (Output.Mode.Packed mode) }

let execute_with_output execute action config mode =
  execute action (config_with_output config mode)

let effect_result name task =
  let value = ref None in
  let error = ref None in
  Cli_effect.on_any task
    (fun result -> value := Some result)
    (fun exn -> error := Some exn);
  match (!value, !error) with
  | Some value, None -> value
  | None, Some exn ->
      fail_test (name ^ ": " ^ Printexc.to_string exn);
      assert false
  | None, None ->
      fail_test (name ^ ": effect is still pending");
      assert false
  | Some _, Some _ ->
      fail_test (name ^ ": effect resolved and rejected");
      assert false

let effect_to_promise task =
  Js.Promise.make (fun ~resolve ~reject ->
      Cli_effect.on_any task
        (fun value -> (resolve value [@u]))
        (fun exn -> (reject exn [@u])))

type lifecycle_output = {
  stdout : string option;
  stderr : string list;
  exit_code : int;
}

let run_cli_lifecycle ?(env = []) argv =
  let result = spawn_cli ~env:(Array.of_list env) argv in
  let stderr =
    let stderr = string_trim_end result##stderr in
    if stderr = "" then [] else Array.to_list (string_split stderr "\n")
  in
  { stdout = Some result##stdout; stderr; exit_code = result_status result }

let stdout_text name output = expect_some name output.stdout

let invoke_args body =
  match Json_util.object_of_json_string body with
  | Some object_ -> (
      match
        Option.bind (Js.Dict.get object_ "argsTransit") Js.Json.decodeString
      with
      | Some args -> Transit.Json.(of_string args |> to_edn)
      | None ->
          fail_test ("missing invoke argsTransit: " ^ body);
          Edn_util.vector [])
  | None ->
      fail_test ("invalid invoke JSON body: " ^ body);
      Edn_util.vector []

let invoke_arg_string body index =
  let args =
    expect_some "invoke args vector" (Edn_util.as_seq (invoke_args body))
  in
  expect_some
    ("invoke arg " ^ string_of_int index)
    (Edn_util.as_string (List.nth args index))

let sample_auth ?(id_token = Some "id-token-1")
    ?(access_token = Some "access-token-1")
    ?(refresh_token = Some "refresh-token-1") ?expires_at
    ?(updated_at = 1_735_686_000_000L) ?(sub = Some "user-123")
    ?(email = Some "user@example.com") () : Auth_state.auth_data =
  {
    provider = "cognito";
    id_token;
    access_token;
    refresh_token;
    expires_at;
    sub;
    email;
    updated_at = Time.time_of_epoch_ms updated_at;
  }

let env_from_pairs pairs key = List.assoc_opt key pairs

let resolve_config ?(env = []) globals =
  let resolved =
    expect_ok "resolve config"
      (effect_result "resolve config"
         (Cli_config.resolve ~defaults:(Cli_config.defaults ())
            ~env:(env_from_pairs env) globals))
  in
  resolved.Cli_config.config

let mode_text (Output.Mode.Packed mode) = Output.Mode.to_string mode

let agent_task_entity ?(uuid = Some "11111111-1111-4111-8111-111111111111")
    ?(tags = [ "logseq.class/Task" ]) ?(status = Some "todo")
    ?(assignees = [ "build-host" ]) ?session_id () =
  let tag_values =
    tags
    |> List.map (fun ident ->
        Edn_util.map
          [
            (Edn_util.keyword "db/ident", Edn_util.keyword ident);
            (Edn_util.keyword "block/title", Edn_util.string "Task");
          ])
  in
  let assignee_values =
    assignees
    |> List.map (fun title ->
        Edn_util.map [ (Edn_util.keyword "block/title", Edn_util.string title) ])
  in
  let fields =
    [
      (Edn_util.keyword "db/id", Edn_util.int64 42L);
      (Edn_util.keyword "block/title", Edn_util.string "Ship the CLI bridge");
      (Edn_util.keyword "block/tags", Edn_util.vector tag_values);
      ( Edn_util.keyword "logseq.property/assignee",
        Edn_util.vector assignee_values );
    ]
  in
  let fields =
    match uuid with
    | Some uuid ->
        (Edn_util.keyword "block/uuid", Edn_util.string uuid) :: fields
    | None -> fields
  in
  let fields =
    match status with
    | Some status ->
        ( Edn_util.keyword "logseq.property/status",
          Edn_util.map
            [
              ( Edn_util.keyword "db/ident",
                Edn_util.keyword ("logseq.property/status." ^ status) );
            ] )
        :: fields
    | None -> fields
  in
  let fields =
    match session_id with
    | Some session_id ->
        ( Edn_util.keyword "logseq.property.agent/session-id",
          Edn_util.string session_id )
        :: fields
    | None -> fields
  in
  Entity.of_value (Edn_util.map fields)

let routable_reason_text = function
  | Agent.Missing_stable_uuid -> "missing-stable-uuid"
  | Missing_task_tag -> "missing-task-tag"
  | Not_todo -> "not-todo"
  | Assignee_mismatch -> "assignee-mismatch"
  | Already_routed -> "already-routed"

let () =
  test "CLI parity output modes parse and mark structured modes" (fun () ->
      let mode_name = function
        | Output.Mode.Packed mode -> Output.Mode.to_string mode
      in
      expect_equal "human mode" "human"
        (mode_name (expect_some "human" (Output.Mode.of_string "human")));
      expect_equal "json mode" "json"
        (mode_name (expect_some "json" (Output.Mode.of_string "json")));
      expect_equal "edn mode" "edn"
        (mode_name (expect_some "edn" (Output.Mode.of_string "edn")));
      expect_none "invalid output mode" (Output.Mode.of_string "yaml");
      expect_bool "human structured" false (Output.Mode.structured Human);
      expect_bool "json structured" true (Output.Mode.structured Json);
      expect_bool "edn structured" true (Output.Mode.structured Edn));

  test "CLI parity primitive parsers keep graph repo shell and uuid contracts"
    (fun () ->
      let graph = Cli_primitive.create_graph "demo" in
      let repo = Cli_config.graph_to_repo graph in
      expect_equal "graph text" "demo" (Cli_primitive.string_of_graph graph);
      expect_equal "repo text" "logseq_db_demo"
        (Cli_primitive.string_of_repo repo);
      expect_equal "repo to graph" "demo"
        (Cli_primitive.string_of_graph (Cli_config.repo_to_graph repo));
      expect_bool "uuid valid" true
        (Cli_primitive.is_uuid_string "00000000-0000-4000-8000-000000000001");
      expect_bool "uuid invalid" false
        (Cli_primitive.is_uuid_string "not-a-uuid");
      (match expect_some "bash" (Cli_primitive.shell_of_string "bash") with
      | Cli_primitive.Bash -> pass
      | _ -> fail_test "expected bash shell");
      expect_none "unknown shell" (Cli_primitive.shell_of_string "fish"));

  test "CLI parity ustring decodes utf8 byte strings to JS unicode strings"
    (fun () ->
      let utf8_byte_string =
        Js.String.fromCharCode 0xe4
        ^ Js.String.fromCharCode 0xb8
        ^ Js.String.fromCharCode 0xad
      in
      let decoded = Ustring.of_string utf8_byte_string |> Ustring.to_string in
      expect_equal "decoded unicode text" (unicode_text [ 0x4e2d ]) decoded;
      expect_int "decoded JS length" 1 (String.length decoded);
      expect_int "decoded char code" 0x4e2d (string_char_code_at decoded 0));

  test
    "CLI parity id parser accepts single multi comma whitespace and vector \
     input" (fun () ->
      let single = expect_ok "single id" (Id_parse.parse_id_string "42") in
      expect_bool "single multi" false single.multi;
      expect_int64 "single id value" 42L
        (expect_some "single" (Id_parse.to_single single));
      let multi =
        expect_ok "multi ids" (Id_parse.parse_id_string "[1, 2  3\t4]")
      in
      expect_bool "multi flag" true multi.multi;
      expect_int "multi length" 4 (List.length multi.ids);
      expect_none "multi to_single" (Id_parse.to_single multi);
      expect_error_code "zero id" ":invalid-options"
        (Id_parse.parse_id_string "0");
      expect_error_code "non numeric id" ":invalid-options"
        (Id_parse.parse_id_string "abc"));

  test
    "CLI parity graph directory names preserve canonical and old-format \
     encoding" (fun () ->
      expect_equal "space graph dir" "space name"
        (Graph_dir.encode_graph_dir_name "space name");
      expect_equal "slash graph dir" "old~2Fname"
        (Graph_dir.encode_graph_dir_name "old/name");
      expect_equal "tilde graph dir" "tilde~7Ename"
        (Graph_dir.encode_graph_dir_name "tilde~name");
      expect_equal "decode canonical" "old/name"
        (expect_some "canonical"
           (Graph_dir.canonical_graph_name_of_dir "old~2Fname"));
      expect_none "old-format dir is not canonical"
        (Graph_dir.canonical_graph_name_of_dir "old++name");
      expect_equal "decode old-format slash" "old/name"
        (expect_some "old-format"
           (Graph_dir.decode_legacy_graph_dir_name "old++name")));

  test "CLI parity unlink graph moves canonical encoded dir to unlinked dir"
    (fun () ->
      let root = temp_dir "logseq-cli-parity-unlink-graph-" in
      let graphs_dir = Node.Path.join [| root; "graphs" |] in
      let graph = Cli_primitive.create_graph "foo/bar" in
      let repo = Cli_config.graph_to_repo graph in
      let encoded_dir = Graph_dir.encode_graph_dir_name "foo/bar" in
      let graph_path = Node.Path.join [| graphs_dir; encoded_dir |] in
      let unlinked_path =
        Node.Path.join [| graphs_dir; "Unlinked graphs"; encoded_dir |]
      in
      try
        mkdir_p graph_path;
        write_file (Node.Path.join [| graph_path; "db.sqlite" |]) "test-data";
        let result =
          effect_result "graph remove slash"
            (execute_with_output Graph.execute
               (Graph.Graph_remove { graph; repo })
               (config ~root_dir:root ()) Output.Mode.Human)
        in
        expect_bool "graph remove ok" true
          (result.Cli_result.status = Cli_result.Ok);
        expect_bool "source removed" false (Cli_unix.file_exists graph_path);
        expect_bool "destination exists" true
          (Cli_unix.file_exists unlinked_path);
        expect_equal "contents preserved" "test-data"
          (read_file (Node.Path.join [| unlinked_path; "db.sqlite" |]));
        remove_tree root
      with exn ->
        remove_tree root;
        fail_test (Printexc.to_string exn));

  test
    "CLI parity unlink graph moves space-preserving canonical dir to unlinked \
     dir" (fun () ->
      let root = temp_dir "logseq-cli-parity-unlink-space-" in
      let graphs_dir = Node.Path.join [| root; "graphs" |] in
      let graph = Cli_primitive.create_graph "space name" in
      let repo = Cli_config.graph_to_repo graph in
      let graph_path = Node.Path.join [| graphs_dir; "space name" |] in
      let unlinked_path =
        Node.Path.join [| graphs_dir; "Unlinked graphs"; "space name" |]
      in
      try
        mkdir_p graph_path;
        write_file (Node.Path.join [| graph_path; "db.sqlite" |]) "test-data";
        let result =
          effect_result "graph remove space"
            (execute_with_output Graph.execute
               (Graph.Graph_remove { graph; repo })
               (config ~root_dir:root ()) Output.Mode.Human)
        in
        expect_bool "space graph remove ok" true
          (result.Cli_result.status = Cli_result.Ok);
        expect_bool "space source removed" false
          (Cli_unix.file_exists graph_path);
        expect_bool "space destination exists" true
          (Cli_unix.file_exists unlinked_path);
        expect_equal "space contents preserved" "test-data"
          (read_file (Node.Path.join [| unlinked_path; "db.sqlite" |]));
        remove_tree root
      with exn ->
        remove_tree root;
        fail_test (Printexc.to_string exn));

  test "CLI parity root-dir helpers create directories and reject files"
    (fun () ->
      let root = temp_dir "logseq-cli-parity-root-" in
      let nested = Node.Path.join [| root; "a"; "b" |] in
      let file_path = Node.Path.join [| root; "file" |] in
      try
        let ensured =
          expect_ok "ensure nested"
            (Root_dir_types.ensure_root_dir (Some nested))
        in
        expect_bool "nested exists" true (Node.Fs.existsSync ensured);
        write_file file_path "not a dir";
        expect_error_code "reject file" ":root-dir-permission"
          (Root_dir_types.ensure_root_dir (Some file_path));
        remove_tree root
      with exn ->
        remove_tree root;
        fail_test (Printexc.to_string exn));

  test "CLI parity root-dir defaults and normalization stay stable" (fun () ->
      let home = Sys.getenv_opt "HOME" |> Option.value ~default:"." in
      let default_root = Node.Path.join [| home; "logseq" |] in
      expect_equal "default root" default_root
        (Root_dir_types.normalize_root_dir None);
      expect_equal "relative root"
        (Node.Path.join [| Sys.getcwd (); "relative-logseq" |])
        (Root_dir_types.normalize_root_dir (Some "relative-logseq"));
      expect_equal "home root"
        (Node.Path.join [| home; "custom-logseq" |])
        (Root_dir_types.normalize_root_dir (Some "~/custom-logseq")));

  test "CLI parity root-dir rejects read-only directories" (fun () ->
      if Node.Process.process##platform = "win32" then pass
      else
        let root = temp_dir "logseq-cli-parity-root-readonly-" in
        try
          chmod_sync root 0o555;
          expect_error_code "read-only root" ":root-dir-permission"
            (Root_dir_types.ensure_root_dir (Some root));
          chmod_sync root 0o755;
          remove_tree root
        with exn ->
          chmod_sync root 0o755;
          remove_tree root;
          fail_test (Printexc.to_string exn));

  test "CLI parity auth default path follows HOME logseq auth.json" (fun () ->
      let home = Sys.getenv_opt "HOME" |> Option.value ~default:"." in
      let expected = Node.Path.join [| home; "logseq"; "auth.json" |] in
      expect_equal "default auth path" expected
        (Auth_state.default_auth_path ()));

  test "CLI parity auth file write read and delete round-trips token data"
    (fun () ->
      let root = temp_dir "logseq-cli-parity-auth-" in
      let auth_path =
        Node.Path.join [| root; "nested"; "tokens"; "auth.json" |]
      in
      let config = config ~root_dir:root ~auth_path () in
      let auth = sample_auth () in
      try
        expect_bool "auth dir missing" false
          (Node.Fs.existsSync (Node.Path.dirname auth_path));
        ignore
          (expect_ok "write auth"
             (effect_result "write auth"
                (Auth_state.write_auth_file config auth)));
        expect_bool "auth dir exists" true
          (Node.Fs.existsSync (Node.Path.dirname auth_path));
        expect_bool "auth file exists" true (Node.Fs.existsSync auth_path);
        let stored =
          expect_some "stored auth"
            (expect_ok "read auth"
               (effect_result "read auth" (Auth_state.read_auth_file config)))
        in
        expect_equal "provider" auth.provider stored.provider;
        expect_equal "id-token" "id-token-1"
          (expect_some "id-token" stored.id_token);
        expect_equal "access-token" "access-token-1"
          (expect_some "access-token" stored.access_token);
        expect_equal "refresh-token" "refresh-token-1"
          (expect_some "refresh-token" stored.refresh_token);
        expect_equal "sub" "user-123" (expect_some "sub" stored.sub);
        expect_equal "email" "user@example.com"
          (expect_some "email" stored.email);
        ignore
          (expect_ok "delete auth"
             (effect_result "delete auth" (Auth_state.delete_auth_file config)));
        expect_bool "auth file deleted" false (Node.Fs.existsSync auth_path);
        ignore
          (expect_ok "delete auth idempotent"
             (effect_result "delete auth again"
                (Auth_state.delete_auth_file config)));
        remove_tree root
      with exn ->
        remove_tree root;
        fail_test (Printexc.to_string exn));

  test
    "CLI parity auth read returns none when missing and errors on invalid json"
    (fun () ->
      let root = temp_dir "logseq-cli-parity-auth-read-" in
      let missing_path = Node.Path.join [| root; "missing"; "auth.json" |] in
      let invalid_path = Node.Path.join [| root; "auth.json" |] in
      try
        let missing =
          expect_ok "missing auth"
            (effect_result "read missing auth"
               (Auth_state.read_auth_file
                  (config ~root_dir:root ~auth_path:missing_path ())))
        in
        expect_none "missing auth none" missing;
        write_file invalid_path "{\"provider\":";
        expect_error_code "invalid auth json" "invalid-auth-file"
          (effect_result "read invalid auth"
             (Auth_state.read_auth_file
                (config ~root_dir:root ~auth_path:invalid_path ())));
        remove_tree root
      with exn ->
        remove_tree root;
        fail_test (Printexc.to_string exn));

  test "CLI parity auth expired status uses expires-at strictly" (fun () ->
      expect_bool "missing expires-at is expired" true
        (Auth_state.expired_auth (sample_auth ()));
      expect_bool "past expires-at is expired" true
        (Auth_state.expired_auth
           (sample_auth ~expires_at:(Time.time_of_epoch_ms 0L) ()));
      expect_bool "future expires-at is not expired" false
        (Auth_state.expired_auth (sample_auth ~expires_at:Time.max_time ())));

  test "CLI parity auth read supports old underscore fields and config tokens"
    (fun () ->
      let root = temp_dir "logseq-cli-parity-auth-compat-" in
      let auth_path = Node.Path.join [| root; "auth.json" |] in
      try
        write_file auth_path
          "{\"id_token\":\"id-token-2\",\"access_token\":\"access-token-2\",\"refresh_token\":\"refresh-token-2\",\"updated_at\":1735686000000}";
        let underscore =
          expect_ok "read underscore auth"
            (effect_result "read underscore auth"
               (Auth_state.read_auth_file (config ~root_dir:root ~auth_path ())))
        in
        let underscore = expect_some "underscore auth" underscore in
        expect_equal "default provider" "cognito" underscore.provider;
        expect_equal "underscore id token" "id-token-2"
          (expect_some "underscore id token" underscore.id_token);
        expect_int64 "underscore updated-at" 1_735_686_000_000L
          (Time.time_to_epoch_ms underscore.updated_at);
        let from_config =
          expect_ok "resolve config auth"
            (effect_result "resolve config auth"
               (Auth_state.resolve_auth
                  (config ~id_token:"id-token-cfg"
                     ~access_token:"access-token-cfg"
                     ~refresh_token:"refresh-token-cfg" ())))
        in
        expect_equal "config auth provider" "cognito" from_config.provider;
        expect_equal "config auth id token" "id-token-cfg"
          (expect_some "config id token" from_config.id_token);
        expect_none "config auth expires-at" from_config.expires_at;
        expect_error_code "resolve missing auth" "missing-auth"
          (effect_result "resolve missing auth"
             (Auth_state.resolve_auth
                (config ~root_dir:root
                   ~auth_path:(Node.Path.join [| root; "missing.json" |])
                   ())));
        remove_tree root
      with exn ->
        remove_tree root;
        fail_test (Printexc.to_string exn));

  test_promise
    "CLI parity auth refresh uses token endpoint and validates id token"
    (fun () ->
      let request_bodies = ref [] in
      let token_server response_body =
        create_server (fun[@u] req res ->
            let body = ref "" in
            req_set_encoding req "utf8";
            req_on_data req "data" (fun[@u] chunk -> body := !body ^ chunk);
            req_on_end req "end" (fun[@u] () ->
                request_bodies := !request_bodies @ [ !body ];
                if req_method req <> "POST" || req_url req <> "/oauth2/token"
                then write_json res 404 (error_response "not found")
                else write_json res 200 response_body))
      in
      let* () =
        with_server
          (token_server
             "{\"id_token\":\"eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJmcmVzaC11c2VyIiwiZW1haWwiOiJmcmVzaEBleGFtcGxlLmNvbSIsImV4cCI6NDEwMjQ0NDgwMH0.signature\",\"access_token\":\"fresh-access-token\"}")
          (fun base_url ->
            let raw_config =
              Edn_util.map
                [
                  ( Edn_util.keyword "oauth-token-endpoint",
                    Edn_util.string (base_url ^ "/oauth2/token") );
                  ( Edn_util.keyword "oauth-client-id",
                    Edn_util.string "client-1" );
                ]
            in
            let config =
              config ~raw_file_config:raw_config
                ~refresh_token:"refresh-token-cfg" ()
            in
            let* refreshed =
              effect_to_promise
                (Auth_state.refresh_auth config
                   (sample_auth ~id_token:(Some "expired-id")
                      ~access_token:(Some "expired-access")
                      ~refresh_token:(Some "refresh-token-1")
                      ~expires_at:(Time.time_of_epoch_ms 0L) ()))
            in
            let refreshed = expect_ok "refresh auth" refreshed in
            expect_equal "fresh id token sub" "fresh-user"
              (expect_some "fresh sub" refreshed.sub);
            expect_equal "fresh email" "fresh@example.com"
              (expect_some "fresh email" refreshed.email);
            expect_equal "fresh access token" "fresh-access-token"
              (expect_some "fresh access token" refreshed.access_token);
            expect_equal "refresh token preserved" "refresh-token-1"
              (expect_some "fresh refresh token" refreshed.refresh_token);
            let body = String.concat "\n" !request_bodies in
            expect_named_contains "refresh grant type" body
              "grant_type=refresh_token";
            expect_named_contains "refresh token body" body
              "refresh_token=refresh-token-1";
            expect_named_contains "refresh client id" body "client_id=client-1";
            Js.Promise.resolve pass)
      in
      with_server
        (token_server
           "{\"access_token\":\"access-token-only\",\"refresh_token\":\"refresh-token-2\"}")
        (fun base_url ->
          let raw_config =
            Edn_util.map
              [
                ( Edn_util.keyword "oauth-token-endpoint",
                  Edn_util.string (base_url ^ "/oauth2/token") );
              ]
          in
          let* result =
            effect_to_promise
              (Auth_state.refresh_auth
                 (config ~raw_file_config:raw_config ())
                 (sample_auth ~refresh_token:(Some "refresh-token-1") ()))
          in
          expect_error_code "missing id token" "missing-id-token" result;
          Js.Promise.resolve pass));

  test_promise "CLI parity auth refresh returns precise token errors" (fun () ->
      let token_server response_body =
        create_server (fun[@u] req res ->
            let body = ref "" in
            req_set_encoding req "utf8";
            req_on_data req "data" (fun[@u] chunk -> body := !body ^ chunk);
            req_on_end req "end" (fun[@u] () ->
                ignore !body;
                if req_method req <> "POST" || req_url req <> "/oauth2/token"
                then write_json res 404 (error_response "not found")
                else write_json res 200 response_body))
      in
      let config_for base_url =
        config
          ~raw_file_config:
            (Edn_util.map
               [
                 ( Edn_util.keyword "oauth-token-endpoint",
                   Edn_util.string (base_url ^ "/oauth2/token") );
               ])
          ()
      in
      let* () =
        with_server
          (token_server
             "{\"id_token\":\"not-a-jwt\",\"access_token\":\"access-token\"}")
          (fun base_url ->
            let* result =
              effect_to_promise
                (Auth_state.refresh_auth (config_for base_url)
                   (sample_auth ~refresh_token:(Some "refresh-token-1") ()))
            in
            expect_error_code "invalid token" "invalid-auth-token" result;
            Js.Promise.resolve pass)
      in
      let missing_result = ref None in
      let* () =
        with_server (token_server "{\"access_token\":\"access-token-only\"}")
          (fun base_url ->
            let* result =
              effect_to_promise
                (Auth_state.refresh_auth (config_for base_url)
                   (sample_auth ~refresh_token:(Some "refresh-token-1") ()))
            in
            missing_result := Some result;
            Js.Promise.resolve pass)
      in
      let result = expect_some "missing id token result" !missing_result in
      match result with
      | Ok _ ->
          fail_test "missing id token: expected Error";
          Js.Promise.resolve pass
      | Error err ->
          expect_equal "missing id token code" "missing-id-token"
            (Edn_util.keyword_to_string err.Error.code);
          Js.Promise.resolve pass);

  test_promise
    "CLI parity resolve auth refreshes expired file auth and stores it"
    (fun () ->
      let root = temp_dir "logseq-cli-parity-auth-resolve-refresh-" in
      let auth_path = Node.Path.join [| root; "auth.json" |] in
      let refreshed_id_token =
        id_token ~sub:"resolved-user" ~email:"resolved@example.com" ()
      in
      let response_body =
        Printf.sprintf
          "{\"id_token\":%s,\"access_token\":\"resolved-access-token\",\"refresh_token\":\"resolved-refresh-token\"}"
          (Js.Json.stringify (Js.Json.string refreshed_id_token))
      in
      let server =
        create_server (fun[@u] req res ->
            let body = ref "" in
            req_set_encoding req "utf8";
            req_on_data req "data" (fun[@u] chunk -> body := !body ^ chunk);
            req_on_end req "end" (fun[@u] () ->
                ignore !body;
                if req_method req <> "POST" || req_url req <> "/oauth2/token"
                then write_json res 404 (error_response "not found")
                else write_json res 200 response_body))
      in
      with_server server (fun base_url ->
          let raw_config =
            Edn_util.map
              [
                ( Edn_util.keyword "oauth-token-endpoint",
                  Edn_util.string (base_url ^ "/oauth2/token") );
              ]
          in
          let config =
            config ~root_dir:root ~auth_path ~raw_file_config:raw_config ()
          in
          let* written =
            effect_to_promise
              (Auth_state.write_auth_file config
                 (sample_auth ~id_token:(Some "expired-id-token")
                    ~access_token:(Some "expired-access-token")
                    ~refresh_token:(Some "refresh-token-1")
                    ~expires_at:(Time.time_of_epoch_ms 0L) ()))
          in
          ignore (expect_ok "write expired auth" written);
          let* resolved = effect_to_promise (Auth_state.resolve_auth config) in
          let resolved = expect_ok "resolve refreshed auth" resolved in
          expect_equal "resolved sub" "resolved-user"
            (expect_some "resolved sub" resolved.sub);
          expect_equal "resolved email" "resolved@example.com"
            (expect_some "resolved email" resolved.email);
          expect_equal "resolved access" "resolved-access-token"
            (expect_some "resolved access" resolved.access_token);
          let* stored = effect_to_promise (Auth_state.read_auth_file config) in
          let stored =
            expect_some "stored refreshed auth"
              (expect_ok "read refreshed auth" stored)
          in
          expect_equal "stored id token" refreshed_id_token
            (expect_some "stored id token" stored.id_token);
          expect_equal "stored refresh token" "resolved-refresh-token"
            (expect_some "stored refresh token" stored.refresh_token);
          remove_tree root;
          Js.Promise.resolve pass));

  test "CLI parity auth commands parse and build login logout actions"
    (fun () ->
      let login_request = expect_parse_ok "login parse" [ "login" ] in
      (match login_request.command with
      | Cli_request.Auth Auth_command.Parsed_login -> pass
      | _ -> fail_test "login parse: expected auth login");
      let logout_request = expect_parse_ok "logout parse" [ "logout" ] in
      (match logout_request.command with
      | Cli_request.Auth Auth_command.Parsed_logout -> pass
      | _ -> fail_test "logout parse: expected auth logout");
      (match
         Auth_command.build (config ()) (Global_opts.create ())
           Auth_command.Parsed_login
       with
      | Ok Auth_command.Login -> pass
      | Ok _ -> fail_test "login build: expected Login"
      | Error err -> fail_test ("login build: " ^ err.Error.message));
      match
        Auth_command.build (config ()) (Global_opts.create ())
          Auth_command.Parsed_logout
      with
      | Ok Auth_command.Logout -> pass
      | Ok _ -> fail_test "logout build: expected Logout"
      | Error err -> fail_test ("logout build: " ^ err.Error.message));

  test "CLI parity auth logout command deletes file and reports absent file"
    (fun () ->
      let root = temp_dir "logseq-cli-parity-auth-logout-" in
      let auth_path = Node.Path.join [| root; "auth.json" |] in
      let raw_config =
        Edn_util.map
          [
            (Edn_util.keyword "open-browser", Edn_util.bool false);
            (Edn_util.keyword "oauth-logout-state", Edn_util.string "state-1");
          ]
      in
      let config =
        {
          (config ~root_dir:root ~auth_path ()) with
          raw_file_config = Some raw_config;
        }
      in
      let deleted_flag result =
        let data = expect_some "logout data" (Cli_result.data_value result) in
        expect_some "deleted flag" (Edn_util.get_bool data "deleted")
      in
      try
        ignore
          (expect_ok "write auth"
             (effect_result "write auth"
                (Auth_state.write_auth_file config (sample_auth ()))));
        let result =
          effect_result "logout existing"
            (execute_with_output Auth_command.execute Auth_command.Logout config
               Output.Mode.Json)
        in
        expect_bool "logout status" false (Cli_result.is_error result);
        expect_bool "deleted existing" true (deleted_flag result);
        expect_bool "auth file removed" false (Node.Fs.existsSync auth_path);
        let missing_result =
          effect_result "logout missing"
            (execute_with_output Auth_command.execute Auth_command.Logout config
               Output.Mode.Json)
        in
        expect_bool "missing logout status" false
          (Cli_result.is_error missing_result);
        expect_bool "deleted missing" false (deleted_flag missing_result);
        remove_tree root
      with exn ->
        remove_tree root;
        fail_test (Printexc.to_string exn));

  test "CLI parity config resolves argv over env over file" (fun () ->
      let root = temp_dir "logseq-cli-parity-config-" in
      let cfg_path = Node.Path.join [| root; "cli.edn" |] in
      try
        write_file cfg_path
          "{:graph \"file-graph\" :root-dir \"file-root\" :timeout-ms 111 \
           :login-timeout-ms 444 :logout-timeout-ms 555 :output-format :edn \
           :auth-token \"legacy-secret\" :retries 2 :e2ee-password \
           \"legacy-password\"}\n";
        let config =
          resolve_config
            ~env:
              [
                ("LOGSEQ_CLI_GRAPH", "env-graph");
                ("LOGSEQ_CLI_ROOT_DIR", "env-root");
                ("LOGSEQ_CLI_TIMEOUT_MS", "222");
                ("LOGSEQ_CLI_LOGIN_TIMEOUT_MS", "666");
                ("LOGSEQ_CLI_LOGOUT_TIMEOUT_MS", "777");
                ("LOGSEQ_CLI_OUTPUT", "json");
              ]
            (Global_opts.create
               ~graph:(Cli_primitive.create_graph "argv-graph")
               ~root_dir:"argv-root" ~config_path:cfg_path
               ~timeout_span:(Time.span_of_ms 333L)
               ~output_format:(Output.Mode.Packed Output.Mode.Human) ())
        in
        expect_equal "config path" cfg_path config.config_path;
        expect_equal "graph" "argv-graph"
          (Cli_primitive.string_of_graph (expect_some "graph" config.graph));
        expect_equal "root-dir" "argv-root" config.root_dir;
        expect_int64 "timeout" 333L (Time.span_to_ms config.timeout_span);
        expect_int64 "login timeout" 666L
          (Time.span_to_ms config.login_timeout_span);
        expect_int64 "logout timeout" 777L
          (Time.span_to_ms config.logout_timeout_span);
        expect_equal "output" "human"
          (mode_text (expect_some "output" config.output_format));
        (match config.raw_file_config with
        | Some raw ->
            expect_none "sanitized auth-token" (Edn_util.get raw "auth-token");
            expect_none "sanitized retries" (Edn_util.get raw "retries");
            expect_none "sanitized e2ee-password"
              (Edn_util.get raw "e2ee-password")
        | None -> fail_test "missing raw file config");
        remove_tree root
      with exn ->
        remove_tree root;
        fail_test (Printexc.to_string exn));

  test "CLI parity config env output overrides file output" (fun () ->
      let root = temp_dir "logseq-cli-parity-config-output-" in
      let cfg_path = Node.Path.join [| root; "cli.edn" |] in
      try
        write_file cfg_path "{:output-format :edn}\n";
        let config =
          resolve_config
            ~env:[ ("LOGSEQ_CLI_OUTPUT", "json") ]
            (Global_opts.create ~config_path:cfg_path ())
        in
        expect_equal "env output" "json"
          (mode_text (expect_some "output" config.output_format));
        remove_tree root
      with exn ->
        remove_tree root;
        fail_test (Printexc.to_string exn));

  test "CLI parity config output-format key overrides old output key" (fun () ->
      let root = temp_dir "logseq-cli-parity-config-output-key-" in
      let cfg_path = Node.Path.join [| root; "cli.edn" |] in
      try
        write_file cfg_path "{:output :json :output-format :edn}\n";
        let config =
          resolve_config (Global_opts.create ~config_path:cfg_path ())
        in
        expect_equal "output-format wins" "edn"
          (mode_text (expect_some "output" config.output_format));
        write_file cfg_path "{:output :json}\n";
        let config =
          resolve_config (Global_opts.create ~config_path:cfg_path ())
        in
        expect_equal "old output fallback" "json"
          (mode_text (expect_some "output" config.output_format));
        remove_tree root
      with exn ->
        remove_tree root;
        fail_test (Printexc.to_string exn));

  test "CLI parity config defaults use standard root URLs and timeouts"
    (fun () ->
      let root = temp_dir "logseq-cli-parity-config-default-" in
      let cfg_path = Node.Path.join [| root; "missing-cli.edn" |] in
      try
        let config =
          resolve_config (Global_opts.create ~config_path:cfg_path ())
        in
        expect_equal "config path" cfg_path config.config_path;
        expect_equal "root-dir"
          (Node.Path.join
             [| Sys.getenv_opt "HOME" |> Option.value ~default:"."; "logseq" |])
          config.root_dir;
        expect_equal "ws-url" "wss://api.logseq.io/sync/%s"
          (expect_some "ws-url" config.ws_url);
        expect_equal "http-base" "https://api.logseq.io"
          (expect_some "http-base" config.http_base);
        expect_int64 "timeout" 10_000L (Time.span_to_ms config.timeout_span);
        expect_int64 "login timeout" 300_000L
          (Time.span_to_ms config.login_timeout_span);
        expect_int64 "logout timeout" 120_000L
          (Time.span_to_ms config.logout_timeout_span);
        expect_int "title max width" 40 config.list_title_max_display_width;
        remove_tree root
      with exn ->
        remove_tree root;
        fail_test (Printexc.to_string exn));

  test "CLI parity empty config file uses defaults" (fun () ->
      let root = temp_dir "logseq-cli-parity-config-empty-" in
      let cfg_path = Node.Path.join [| root; "cli.edn" |] in
      try
        write_file cfg_path " \n\t";
        let config =
          resolve_config (Global_opts.create ~config_path:cfg_path ())
        in
        expect_equal "config path" cfg_path config.config_path;
        expect_equal "root-dir"
          (Node.Path.join
             [| Sys.getenv_opt "HOME" |> Option.value ~default:"."; "logseq" |])
          config.root_dir;
        expect_equal "ws-url" "wss://api.logseq.io/sync/%s"
          (expect_some "ws-url" config.ws_url);
        expect_equal "http-base" "https://api.logseq.io"
          (expect_some "http-base" config.http_base);
        expect_int64 "timeout" 10_000L (Time.span_to_ms config.timeout_span);
        expect_int64 "login timeout" 300_000L
          (Time.span_to_ms config.login_timeout_span);
        expect_int64 "logout timeout" 120_000L
          (Time.span_to_ms config.logout_timeout_span);
        expect_int "title max width" 40 config.list_title_max_display_width;
        remove_tree root
      with exn ->
        remove_tree root;
        fail_test (Printexc.to_string exn));

  test "CLI parity config path follows root-dir unless explicitly set"
    (fun () ->
      let root = temp_dir "logseq-cli-parity-config-path-" in
      let custom_root = Node.Path.join [| root; "custom-logseq" |] in
      let explicit_cfg =
        Node.Path.join [| root; "nested"; "custom-cli.edn" |]
      in
      try
        let derived =
          resolve_config (Global_opts.create ~root_dir:custom_root ())
        in
        expect_equal "derived root" custom_root derived.root_dir;
        expect_equal "derived config path"
          (Node.Path.join [| custom_root; "cli.edn" |])
          derived.config_path;
        let explicit =
          resolve_config
            (Global_opts.create ~root_dir:custom_root ~config_path:explicit_cfg
               ())
        in
        expect_equal "explicit root" custom_root explicit.root_dir;
        expect_equal "explicit config path" explicit_cfg explicit.config_path;
        remove_tree root
      with exn ->
        remove_tree root;
        fail_test (Printexc.to_string exn));

  test "CLI parity server runtime dirs are derived from resolved root"
    (fun () ->
      let config = config ~root_dir:"/tmp/logseq-root" () in
      expect_equal "resolved root" "/tmp/logseq-root"
        (Server_runtime.resolve_root_dir config);
      expect_equal "graphs dir" "/tmp/logseq-root/graphs"
        (Server_runtime.graphs_dir config));

  test
    "CLI parity config list title max width reads positive and defaults \
     non-positive" (fun () ->
      let root = temp_dir "logseq-cli-parity-title-width-" in
      try
        let cfg_path = Node.Path.join [| root; "cli.edn" |] in
        write_file cfg_path "{:list-title-max-display-width 72}\n";
        let config =
          resolve_config (Global_opts.create ~config_path:cfg_path ())
        in
        expect_int "positive width" 72 config.list_title_max_display_width;
        write_file cfg_path "{:list-title-max-display-width 0}\n";
        let config =
          resolve_config (Global_opts.create ~config_path:cfg_path ())
        in
        expect_int "zero width default" 40 config.list_title_max_display_width;
        write_file cfg_path "{:list-title-max-display-width -3}\n";
        let config =
          resolve_config (Global_opts.create ~config_path:cfg_path ())
        in
        expect_int "negative width default" 40
          config.list_title_max_display_width;
        remove_tree root
      with exn ->
        remove_tree root;
        fail_test (Printexc.to_string exn));

  test "CLI parity config invalid list title width fails fast" (fun () ->
      let root = temp_dir "logseq-cli-parity-title-width-invalid-" in
      let cfg_path = Node.Path.join [| root; "cli.edn" |] in
      try
        write_file cfg_path "{:list-title-max-display-width \"abc\"}\n";
        let result =
          effect_result "resolve invalid title width fallback"
            (Cli_config.resolve ~defaults:(Cli_config.defaults ())
               ~env:(env_from_pairs [])
               (Global_opts.create ~config_path:cfg_path ()))
        in
        (match result with
        | Ok _ -> fail_test "invalid width: expected Error"
        | Error err ->
            expect_equal "invalid width code" "invalid-config"
              (Edn_util.keyword_to_string err.Error.code);
            expect_named_contains "invalid width message" err.Error.message
              "Expected integer");
        remove_tree root
      with exn ->
        remove_tree root;
        fail_test (Printexc.to_string exn));

  test "CLI parity config invalid output fails fast" (fun () ->
      let root = temp_dir "logseq-cli-parity-invalid-output-" in
      let cfg_path = Node.Path.join [| root; "cli.edn" |] in
      try
        write_file cfg_path "{:output-format :edn}\n";
        let result =
          effect_result "resolve invalid output fallback"
            (Cli_config.resolve ~defaults:(Cli_config.defaults ())
               ~env:(env_from_pairs [ ("LOGSEQ_CLI_OUTPUT", "yaml") ])
               (Global_opts.create ~config_path:cfg_path ()))
        in
        (match result with
        | Ok _ -> fail_test "invalid output: expected Error"
        | Error err ->
            expect_equal "invalid output code" "invalid-config"
              (Edn_util.keyword_to_string err.Error.code);
            expect_named_contains "invalid output message" err.Error.message
              "Expected one of human, json, edn");
        remove_tree root
      with exn ->
        remove_tree root;
        fail_test (Printexc.to_string exn));

  test
    "CLI parity uuid ref helpers extract unique lowercase refs and replace \
     labels" (fun () ->
      let first = "11111111-1111-4111-8111-111111111111" in
      let upper = "22222222-2222-4222-8222-222222222222" in
      let text =
        "A [[" ^ first ^ "]] B [[not-a-uuid]] C [["
        ^ String.uppercase_ascii upper
        ^ "]] A [[" ^ first ^ "]]"
      in
      let refs = Uuid_refs_types.extract_uuid_refs text in
      expect_int "uuid ref count" 2 (List.length refs);
      expect_equal "first uuid" first (List.nth refs 0);
      expect_equal "second uuid" upper (List.nth refs 1);
      let replaced =
        Uuid_refs_types.replace_uuid_refs text
          [ (first, "First"); (upper, "Second") ]
      in
      expect_named_contains "replace first" replaced "[[First]]";
      expect_named_contains "replace second" replaced "[[Second]]";
      expect_named_contains "keep invalid" replaced "[[not-a-uuid]]");

  test "CLI parity uuid refs are collected from entity string fields" (fun () ->
      let uuid = "33333333-3333-4333-8333-333333333333" in
      let items =
        [
          entity ~title:("Title [[" ^ uuid ^ "]]") ();
          entity ~name:("Name [[" ^ uuid ^ "]]") ();
        ]
      in
      let refs =
        Uuid_refs_types.collect_uuid_refs_from_items items
          [ Edn_util.keyword_t "block/title"; Edn_util.keyword_t "block/name" ]
      in
      expect_int "collected uuid refs" 1 (List.length refs);
      expect_equal "collected uuid" uuid (List.hd refs));

  test "CLI parity human count helpers use grouped counts and pluralization"
    (fun () ->
      expect_equal "count" "1,234" (Humanize_types.format_count 1234);
      expect_equal "singular" "1 graph"
        (Humanize_types.format_count_with_noun 1 "graph");
      expect_equal "plural" "2 graphs"
        (Humanize_types.format_count_with_noun 2 "graph"));

  test "CLI parity display width truncates ascii cjk and combining text"
    (fun () ->
      let cjk = decode_uri_component "%E7%95%8C" in
      let combining_acute = decode_uri_component "%CC%81" in
      let repeat count value =
        String.concat "" (List.init count (fun _ -> value))
      in
      expect_int "ascii width" 5 (Display_width.width "Hello");
      expect_int "cjk width" 2 (Display_width.width cjk);
      expect_int "combining width" 1
        (Display_width.width ("e" ^ combining_acute));
      expect_equal "short segment" "Project Alpha"
        (Display_width.truncate "Project Alpha" 24);
      expect_equal "exact ascii segment" "123456789012345678901234"
        (Display_width.truncate "123456789012345678901234" 24);
      expect_equal "one over ascii segment"
        ("12345678901234567890123" ^ Cli_platform.Symbols.ellipsis)
        (Display_width.truncate "1234567890123456789012345" 24);
      expect_equal "exact cjk segment" (repeat 12 cjk)
        (Display_width.truncate (repeat 12 cjk) 24);
      expect_equal "one over cjk segment"
        (repeat 11 cjk ^ Cli_platform.Symbols.ellipsis)
        (Display_width.truncate (repeat 13 cjk) 24));

  test "CLI parity profile sessions aggregate repeated stages" (fun () ->
      expect_none "disabled profile" (Profile_types.create_session false);
      let session =
        expect_some "enabled profile" (Profile_types.create_session true)
      in
      Profile_types.record_span session (span "cli.parse-argv" 1 0 2);
      Profile_types.record_span session (span "cli.parse-argv" 2 3 5);
      Profile_types.record_span session (span "cli.build-action" 3 6 8);
      let report =
        Profile_types.report session ~command:"graph-list"
          ~status:(Edn_util.keyword_t "ok")
      in
      expect_equal "profile command" "graph-list" report.command;
      expect_equal "profile status" "ok" (keyword_text report.status);
      expect_int "parse count" 2
        (expect_some "parse count" (stage_count "cli.parse-argv" report.stages));
      expect_int "build count" 1
        (expect_some "build count"
           (stage_count "cli.build-action" report.stages));
      expect_int "total count" 1
        (expect_some "total count" (stage_count "cli.total" report.stages)));

  test "CLI parity profile render lines use containment tree" (fun () ->
      let report : Profile_types.report =
        {
          command = "graph-list";
          status = Edn_util.keyword_t "ok";
          total_span = Time.span_of_ms 42L;
          stages = [];
          spans =
            [
              span "cli.total" 0 0 42;
              span "cli.parse-argv" 1 1 3;
              span "cli.execute-action" 2 5 35;
              span "transport.invoke:thread-api/q" 3 12 20;
            ];
        }
      in
      let lines = Profile_types.render_lines report in
      expect_equal "profile headline" "42ms command=graph-list status=ok"
        (List.hd lines);
      expect_bool "profile stages heading" true
        (List.exists (fun line -> String.trim line = "stages") lines);
      expect_bool "profile total line" true
        (List.exists
           (fun line -> Js.String.includes ~search:"cli.total" line)
           lines);
      expect_bool "profile nested transport" true
        (List.exists
           (fun line ->
             Js.String.includes ~search:"transport.invoke:thread-api/q" line)
           lines);
      expect_bool "profile no aggregate count labels" false
        (List.exists
           (fun line -> Js.String.includes ~search:"count=" line)
           lines));

  test "CLI parity profile render keeps repeated stage calls separate"
    (fun () ->
      let report : Profile_types.report =
        {
          command = "query";
          status = Edn_util.keyword_t "ok";
          total_span = Time.span_of_ms 30L;
          stages = [];
          spans =
            [
              span "outer" 0 0 30;
              span "transport.invoke:thread-api/q" 1 5 10;
              span "transport.invoke:thread-api/q" 2 15 20;
            ];
        }
      in
      let lines = Profile_types.render_lines report in
      let q_lines =
        List.filter
          (fun line ->
            Js.String.includes ~search:"transport.invoke:thread-api/q" line)
          lines
      in
      expect_int "repeated stage lines" 2 (List.length q_lines));

  test "CLI parity human table formats blanks and appends footer" (fun () ->
      let output =
        Output.Human_output.create ~headers:[ "ID"; "TITLE" ]
          ~rows:[ [ "1"; "Alpha" ]; [ "2"; "" ] ]
          ~footer:"Count: 2" ()
        |> Output.Human_output.to_string
      in
      expect_named_contains "header" output "ID  TITLE";
      expect_named_contains "blank value" output "2   -";
      expect_named_contains "footer" output "Count: 2");

  test "CLI parity output mode parser accepts exact lowercase values only"
    (fun () ->
      expect_equal "json" "json"
        (mode_text (expect_some "json" (Output.Mode.of_string "json")));
      expect_equal "edn" "edn"
        (mode_text (expect_some "edn" (Output.Mode.of_string "edn")));
      expect_none "uppercase json" (Output.Mode.of_string " JSON ");
      expect_none "uppercase edn" (Output.Mode.of_string "EDN");
      expect_none "blank output" (Output.Mode.of_string "  ");
      expect_none "unknown output" (Output.Mode.of_string "yaml"));

  test "CLI parity log truncate preview keeps string length without EDN quotes"
    (fun () ->
      let long_value = String.make 50 'a' |> Edn_util.string in
      let long_preview = Log_types.truncate_preview ~max_len:10 long_value in
      expect_int "long string length" 50 long_preview.length;
      expect_int "long preview length" 10 (String.length long_preview.preview);
      expect_bool "long preview truncated" true long_preview.truncated;
      let short_preview =
        Log_types.truncate_preview ~max_len:10 (Edn_util.string "short")
      in
      expect_int "short string length" 5 short_preview.length;
      expect_equal "short preview" "short" short_preview.preview;
      expect_bool "short preview not truncated" false short_preview.truncated;
      let nil_preview = Log_types.truncate_preview ~max_len:10 Edn_util.nil in
      expect_int "nil length" 3 nil_preview.length;
      expect_equal "nil preview" "nil" nil_preview.preview;
      expect_bool "nil not truncated" false nil_preview.truncated;
      let vector_preview =
        Log_types.truncate_preview ~max_len:100
          (Edn_util.vector [ Edn_util.int 1; Edn_util.int 2; Edn_util.int 3 ])
      in
      expect_equal "vector preview" "[1 2 3]" vector_preview.preview;
      expect_bool "vector not truncated" false vector_preview.truncated);

  test "CLI parity pretty edn matches jet command formatting" (fun () ->
      expect_equal "flat pretty edn" "{:a 1, :bb 22, :ccc 333, :dddd 4444}\n"
        (Pretty_print.pprint_edn
           (edn_of_string "{:a 1 :bb 22 :ccc 333 :dddd 4444}"));
      expect_equal "escaped string pretty edn"
        "{:text \"a { b [ c ] } \\\" q\", :empty [], :m {}}\n"
        (Pretty_print.pprint_edn
           (edn_of_string "{:text \"a { b [ c ] } \\\" q\" :empty [] :m {}}"));
      expect_equal "nested pretty edn"
        "{:classes {:user.class/DUOL {:block/title \"DUOL\",\n\
        \                             :block/created-at 1773581891284,\n\
        \                             :block/updated-at 1773581891284},\n\
        \           :user.class/NVDA {:block/title \"NVDA\",\n\
        \                             :block/created-at 1773583745410,\n\
        \                             :block/updated-at 1773583745410}},\n\
        \ :pages [{:block/title \"A\", :block/tags [:x :y]}\n\
        \         {:block/title \"B\", :block/properties {:k \"v\"}}]}\n"
        (Pretty_print.pprint_edn
           (edn_of_string
              "{:classes {:user.class/DUOL {:block/title \"DUOL\" \
               :block/created-at 1773581891284 :block/updated-at \
               1773581891284} :user.class/NVDA {:block/title \"NVDA\" \
               :block/created-at 1773583745410 :block/updated-at \
               1773583745410}} :pages [{:block/title \"A\" :block/tags [:x \
               :y]} {:block/title \"B\" :block/properties {:k \"v\"}}]}")));

  test "CLI parity json output preserves namespaced keys and keyword values"
    (fun () ->
      let value =
        Edn_util.map
          [
            (Edn_util.keyword "block/title", Edn_util.string "Block title");
            (Edn_util.keyword "db/id", Edn_util.int64 42L);
            (Edn_util.keyword "db/ident", Edn_util.keyword "logseq.class/Tag");
          ]
      in
      let output =
        Format_types.to_json
          (Cli_result.ok Output.Mode.Json (Cli_result.Raw value))
      in
      expect_named_contains "json title" output
        "\"block/title\":\"Block title\"";
      expect_named_contains "json id" output "\"db/id\":42";
      expect_named_contains "json ident" output
        "\"db/ident\":\"logseq.class/Tag\"");

  test "CLI parity cli result exit codes follow status" (fun () ->
      let ok = Cli_result.ok Output.Mode.Human (Cli_result.Message "ok") in
      expect_bool "ok is not error" false (Cli_result.is_error ok);
      expect_int "ok exit" 0 (Cli_result.exit_code ok);
      let err = Error.make (Edn_util.keyword_t "missing-auth") "missing auth" in
      let error = Cli_result.error Output.Mode.Human err in
      expect_bool "error is error" true (Cli_result.is_error error);
      expect_int "error exit" 1 (Cli_result.exit_code error));

  test "CLI parity edn includes hint and human error stays concise" (fun () ->
      let err =
        Error.make ~hint:"Run `logseq login` first."
          (Edn_util.keyword_t "missing-auth")
          "missing auth"
      in
      let edn = Format_types.to_edn (Cli_result.error Output.Mode.Edn err) in
      let human =
        Format_types.format_result
          (Cli_result.error Output.Mode.Human err)
          (config ())
      in
      expect_named_contains "edn code" edn ":missing-auth";
      expect_named_contains "edn hint" edn "Run `logseq login` first.";
      expect_equal "human error" "Error (missing-auth): missing auth" human);

  test
    "CLI parity parse rejects unknown command and retired qmd qsearch commands"
    (fun () ->
      expect_parse_error_code "unknown command" ":unknown-command" [ "bogus" ];
      expect_parse_error_code "qmd retired" ":unknown-command" [ "qmd" ];
      expect_parse_error_code "qsearch retired" ":unknown-command" [ "qsearch" ]);

  test
    "CLI parity parse reads global graph output timeout verbose and profile \
     flags" (fun () ->
      let request =
        expect_parse_ok "global parse"
          [
            "--graph";
            "demo";
            "--output";
            "json";
            "--timeout-ms";
            "1234";
            "--verbose";
            "--profile";
            "graph";
            "list";
          ]
      in
      expect_equal "path" "graph/list" (String.concat "/" request.path);
      expect_equal "graph" "demo"
        (Cli_primitive.string_of_graph
           (expect_some "graph" request.globals.Global_opts.graph));
      expect_bool "verbose" true request.globals.verbose;
      expect_bool "profile" true request.globals.profile;
      match request.globals.output_format with
      | Some (Output.Mode.Packed Output.Mode.Json) -> pass
      | _ -> fail_test "expected json output mode");

  test "CLI parity parse supports list page filters and validation" (fun () ->
      let request =
        expect_parse_ok "list page parse"
          [
            "list";
            "page";
            "--fields";
            "title,updated-at";
            "--limit";
            "10";
            "--offset";
            "2";
            "--sort";
            "updated-at";
            "--order";
            "asc";
            "--include-hidden";
          ]
      in
      match request.command with
      | Cli_request.List (List_command.Parsed_page opts) ->
          expect_int "limit" 10 (expect_some "limit" opts.common.limit);
          expect_int "offset" 2 (expect_some "offset" opts.common.offset);
          expect_equal "sort" "updated-at" (expect_some "sort" opts.common.sort);
          expect_equal "order" "asc"
            (List_command.string_of_order
               (expect_some "order" opts.common.order));
          expect_bool "include hidden" true opts.include_hidden
      | _ ->
          fail_test "expected list page request";
          expect_parse_error_code "bad order" ":invalid-options"
            [ "list"; "page"; "--order"; "sideways" ];
          expect_parse_error_code "bad limit" ":invalid-options"
            [ "list"; "page"; "--limit"; "nope" ]);

  test "CLI parity parse rejects malformed boolean and selector values"
    (fun () ->
      expect_parse_error_code "bad boolean equals" ":invalid-options"
        [ "list"; "page"; "--include-built-in=maybe" ];
      expect_parse_error_code "bad boolean value" ":invalid-options"
        [ "show"; "--id"; "1"; "--linked-references=maybe" ];
      expect_parse_error_code "bad remove page id" ":invalid-options"
        [ "remove"; "page"; "--id"; "abc"; "--page"; "Home" ];
      expect_parse_error_code "bad sync asset id" ":invalid-options"
        [ "sync"; "asset"; "download"; "--id"; "abc"; "--uuid"; "id" ];
      expect_parse_error_code "bad debug id" ":invalid-options"
        [ "debug"; "pull"; "--id"; "abc"; "--uuid"; "id" ]);

  test "CLI parity parse supports list tag property task node and asset options"
    (fun () ->
      let tag =
        expect_parse_ok "list tag parse"
          [
            "list";
            "tag";
            "--expand";
            "--include-built-in";
            "--with-properties";
            "--with-extends";
            "--fields";
            "title,properties";
          ]
      in
      (match tag.command with
      | Cli_request.List (List_command.Parsed_tag opts) ->
          expect_bool "tag expand" true opts.expand;
          expect_bool "tag include built in" true
            (expect_some "tag include built in" opts.include_built_in);
          expect_bool "tag with properties" true opts.with_properties;
          expect_bool "tag with extends" true opts.with_extends;
          expect_int "tag fields" 2
            (List.length (expect_some "tag fields" opts.common.fields))
      | _ -> fail_test "expected list tag");
      let property =
        expect_parse_ok "list property parse"
          [
            "list";
            "property";
            "--expand";
            "--include-built-in";
            "--with-classes";
            "--with-type";
            "--sort";
            "cardinality";
            "--fields";
            "title,type,cardinality";
          ]
      in
      (match property.command with
      | Cli_request.List (List_command.Parsed_property opts) ->
          expect_bool "property expand" true opts.expand;
          expect_bool "property include built in" true
            (expect_some "property include built in" opts.include_built_in);
          expect_bool "property with classes" true opts.with_classes;
          expect_bool "property with type" true opts.with_type;
          expect_equal "property sort" "cardinality"
            (expect_some "property sort" opts.common.sort)
      | _ -> fail_test "expected list property");
      let task =
        expect_parse_ok "list task parse"
          [
            "list";
            "task";
            "--status";
            "doing";
            "--priority";
            "high";
            "-c";
            "1111";
            "--fields";
            "id,title,status,priority";
            "--limit";
            "10";
            "--offset";
            "2";
            "--sort";
            "priority";
            "--order";
            "desc";
          ]
      in
      (match task.command with
      | Cli_request.List (List_command.Parsed_task opts) ->
          expect_equal "task status" "doing"
            (expect_some "task status" opts.status);
          expect_equal "task priority" "high"
            (expect_some "task priority" opts.priority);
          expect_equal "task numeric content" "1111"
            (expect_some "task content" opts.content);
          expect_int "task limit" 10
            (expect_some "task limit" opts.common.limit);
          expect_equal "task order" "desc"
            (List_command.string_of_order
               (expect_some "task order" opts.common.order))
      | _ -> fail_test "expected list task");
      let node =
        expect_parse_ok "list node parse"
          [
            "list";
            "node";
            "--tags";
            "project,work";
            "--properties";
            "status,priority";
            "--fields";
            "id,title,type,updated-at";
            "--limit";
            "10";
            "--offset";
            "2";
            "--sort";
            "updated-at";
            "--order";
            "desc";
          ]
      in
      (match node.command with
      | Cli_request.List (List_command.Parsed_node opts) ->
          expect_int "node tags" 2 (List.length opts.tags);
          expect_int "node properties" 2 (List.length opts.properties);
          expect_equal "node sort" "updated-at"
            (expect_some "node sort" opts.common.sort)
      | _ -> fail_test "expected list node");
      let asset =
        expect_parse_ok "list asset parse"
          [
            "list";
            "asset";
            "--fields";
            "id,title,asset-type,size,updated-at";
            "--limit";
            "5";
            "--offset";
            "1";
            "--sort";
            "updated-at";
            "--order";
            "desc";
          ]
      in
      match asset.command with
      | Cli_request.List (List_command.Parsed_asset opts) ->
          expect_int "asset limit" 5
            (expect_some "asset limit" opts.common.limit);
          expect_int "asset offset" 1
            (expect_some "asset offset" opts.common.offset);
          expect_equal "asset order" "desc"
            (List_command.string_of_order
               (expect_some "asset order" opts.common.order))
      | _ -> fail_test "expected list asset");

  test "CLI parity list rejects old name fields for tag and property" (fun () ->
      expect_parse_error_code "list tag old name field" ":invalid-options"
        [ "list"; "tag"; "--fields"; "name,properties" ];
      expect_parse_error_code "list property old name field" ":invalid-options"
        [ "list"; "property"; "--fields"; "name,type,cardinality" ]);

  test "CLI parity list apply offset limit returns requested window" (fun () ->
      let opts = { empty_common_opts with offset = Some 1; limit = Some 2 } in
      let items =
        [
          entity ~id:1L (); entity ~id:2L (); entity ~id:3L (); entity ~id:4L ();
        ]
      in
      let result = List_command.apply_offset_limit opts items in
      expect_int "window size" 2 (List.length result);
      expect_int64 "first window id" 2L
        (expect_some "id" (List.hd result).Entity.id));

  test "CLI parity list build action validates repo and option contracts"
    (fun () ->
      let page_opts =
        List_command.Parsed_page
          {
            common =
              {
                empty_common_opts with
                fields = Some [ "id"; "title" ];
                limit = Some 20;
                sort = Some "updated-at";
                order = Some List_command.Desc;
              };
            expand = false;
            include_built_in = None;
            include_journal = Some false;
            journal_only = true;
            include_hidden = false;
            updated_after = None;
            created_after = None;
          }
      in
      let action =
        expect_ok "list page build"
          (List_command.build (config ~repo:"demo" ()) (Global_opts.create ())
             page_opts)
      in
      expect_bool "list page kind" true
        (action.List_command.kind = List_command.Page);
      expect_equal "list page command" "list-page"
        (Command_id.to_string action.command);
      expect_equal "list page repo" "logseq_db_demo"
        (Cli_primitive.string_of_repo action.repo);
      expect_equal "list page graph" "demo"
        (Cli_primitive.string_of_graph action.graph);
      expect_int "list page limit" 20
        (expect_some "limit" (Edn_util.get_int action.options "limit"));
      expect_equal "list page order" "desc"
        (expect_some "order" (Edn_util.get_string action.options "order"));
      expect_error_code "list requires repo" "missing-repo"
        (List_command.build (config ()) (Global_opts.create ()) page_opts);
      let conflict =
        List_command.Parsed_page
          {
            common = empty_common_opts;
            expand = false;
            include_built_in = None;
            include_journal = Some true;
            journal_only = true;
            include_hidden = false;
            updated_after = None;
            created_after = None;
          }
      in
      expect_error_code "journal conflict" "invalid-options"
        (List_command.build (config ~repo:"demo" ()) (Global_opts.create ())
           conflict);
      let task =
        List_command.Parsed_task
          {
            common = empty_common_opts;
            status = Some "todo";
            priority = Some "bad";
            content = None;
          }
      in
      expect_error_code "task bad priority" "invalid-options"
        (List_command.build (config ~repo:"demo" ()) (Global_opts.create ())
           task);
      let node =
        List_command.Parsed_node
          { common = empty_common_opts; tags = []; properties = [] }
      in
      expect_error_code "node requires filters" "invalid-options"
        (List_command.build (config ~repo:"demo" ()) (Global_opts.create ())
           node));

  test_promise
    "CLI parity list execute default sort limit and explicit order contracts"
    (fun () ->
      let call_count = ref 0 in
      let server =
        invoke_server (fun body ->
            if Js.String.includes ~search:"thread-api/cli-list-pages" body then (
              incr call_count;
              match !call_count with
              | 1 ->
                  "[[\"^ \",\"~:db/id\",11,\"~:block/title\",\"Page \
                   C\",\"~:block/updated-at\",30],[\"^ \
                   \",\"^0\",7,\"^1\",\"Page B\",\"^2\",10],[\"^ \
                   \",\"^0\",5,\"^1\",\"Page A\",\"^2\",10]]"
              | 2 ->
                  "[[\"^ \",\"~:db/id\",4,\"~:block/title\",\"Page \
                   4\",\"~:block/updated-at\",4],[\"^ \
                   \",\"^0\",12,\"^1\",\"Page 12\",\"^2\",12],[\"^ \
                   \",\"^0\",1,\"^1\",\"Page 1\",\"^2\",1],[\"^ \
                   \",\"^0\",8,\"^1\",\"Page 8\",\"^2\",8],[\"^ \
                   \",\"^0\",3,\"^1\",\"Page 3\",\"^2\",3],[\"^ \
                   \",\"^0\",11,\"^1\",\"Page 11\",\"^2\",11],[\"^ \
                   \",\"^0\",2,\"^1\",\"Page 2\",\"^2\",2],[\"^ \
                   \",\"^0\",10,\"^1\",\"Page 10\",\"^2\",10],[\"^ \
                   \",\"^0\",5,\"^1\",\"Page 5\",\"^2\",5],[\"^ \
                   \",\"^0\",9,\"^1\",\"Page 9\",\"^2\",9],[\"^ \
                   \",\"^0\",6,\"^1\",\"Page 6\",\"^2\",6],[\"^ \
                   \",\"^0\",7,\"^1\",\"Page 7\",\"^2\",7]]"
              | _ ->
                  "[[\"^ \
                   \",\"~:db/id\",3,\"~:block/title\",\"Beta\",\"~:block/updated-at\",20],[\"^ \
                   \",\"^0\",2,\"^1\",\"Gamma\",\"^2\",5],[\"^ \
                   \",\"^0\",1,\"^1\",\"Alpha\",\"^2\",10]]")
            else "null")
      in
      with_server server (fun base_url ->
          let cfg =
            {
              (config ~repo:"demo" ()) with
              Cli_config.base_url = Some base_url;
            }
          in
          let run ?(common = empty_common_opts) () =
            let action =
              expect_ok "list page build"
                (List_command.build cfg (Global_opts.create ())
                   (List_command.Parsed_page
                      {
                        common;
                        expand = false;
                        include_built_in = None;
                        include_journal = None;
                        journal_only = false;
                        include_hidden = false;
                        updated_after = None;
                        created_after = None;
                      }))
            in
            execute_with_output List_command.execute action cfg
              Output.Mode.Human
          in
          let ids result =
            let data = expect_some "list data" (Cli_result.data_value result) in
            let items =
              expect_some "items"
                (Option.bind (Edn_util.get data "items") Edn_util.as_seq)
            in
            items
            |> List.map (fun item ->
                Int64.to_string
                  (expect_some "item id" (Edn_util.get_int64 item "db/id")))
            |> String.concat ","
          in
          let* default_result = effect_to_promise (run ()) in
          expect_equal "default updated-at desc with id tie" "11,7,5"
            (ids default_result);
          let* limited =
            effect_to_promise
              (run ~common:{ empty_common_opts with limit = Some 10 } ())
          in
          expect_equal "default limit newest records" "12,11,10,9,8,7,6,5,4,3"
            (ids limited);
          let* explicit_order =
            effect_to_promise
              (run
                 ~common:
                   { empty_common_opts with order = Some List_command.Asc }
                 ())
          in
          expect_equal "explicit asc order" "2,1,3" (ids explicit_order);
          let* explicit_sort =
            effect_to_promise
              (run ~common:{ empty_common_opts with sort = Some "title" } ())
          in
          expect_equal "explicit title sort desc" "2,3,1" (ids explicit_sort);
          Js.Promise.resolve pass));

  test_promise
    "CLI parity list property execute supports cardinality sort and fields"
    (fun () ->
      let server =
        invoke_server (fun body ->
            if Js.String.includes ~search:"thread-api/cli-list-properties" body
            then
              "[[\"^ \
               \",\"~:db/id\",30,\"~:block/title\",\"Gamma\",\"~:db/cardinality\",\"~:db.cardinality/one\"],[\"^ \
               \",\"^0\",10,\"^1\",\"Alpha\",\"^2\",\"~:db.cardinality/many\"],[\"^ \
               \",\"^0\",20,\"^1\",\"Beta\",\"^2\",\"~:db.cardinality/many\"]]"
            else "null")
      in
      with_server server (fun base_url ->
          let cfg =
            {
              (config ~repo:"demo" ()) with
              Cli_config.base_url = Some base_url;
            }
          in
          let action =
            expect_ok "list property build"
              (List_command.build cfg (Global_opts.create ())
                 (List_command.Parsed_property
                    {
                      common =
                        {
                          empty_common_opts with
                          sort = Some "cardinality";
                          fields = Some [ "id"; "title"; "cardinality" ];
                        };
                      expand = false;
                      include_built_in = None;
                      with_classes = false;
                      with_type = true;
                    }))
          in
          let* result =
            effect_to_promise
              (execute_with_output List_command.execute action cfg
                 Output.Mode.Human)
          in
          let data =
            expect_some "property list data" (Cli_result.data_value result)
          in
          let items =
            expect_some "property items"
              (Option.bind (Edn_util.get data "items") Edn_util.as_seq)
          in
          let ids =
            items
            |> List.map (fun item ->
                Int64.to_string
                  (expect_some "item id" (Edn_util.get_int64 item "db/id")))
            |> String.concat ","
          in
          expect_equal "cardinality sort ids" "30,20,10" ids;
          List.iter
            (fun item ->
              expect_bool "has id" true
                (Option.is_some (Edn_util.get item "db/id"));
              expect_bool "has title" true
                (Option.is_some (Edn_util.get item "block/title"));
              expect_bool "has cardinality" true
                (Option.is_some (Edn_util.get item "db/cardinality"));
              expect_bool "only selected fields" true
                (match Edn_util.as_map item with
                | Some fields -> List.length fields = 3
                | None -> false))
            items;
          Js.Promise.resolve pass));

  test_promise "CLI parity list asset execute filters by asset tag id"
    (fun () ->
      let calls = ref [] in
      let server =
        invoke_server (fun body ->
            calls := body :: !calls;
            if Js.String.includes ~search:"thread-api/pull" body then
              "[\"^ \",\"~:db/id\",900]"
            else if Js.String.includes ~search:"thread-api/cli-list-nodes" body
            then (
              expect_named_contains "asset tag id option" body "900";
              "[[\"^ \
               \",\"~:db/id\",2,\"~:block/title\",\"asset-b\",\"~:node/type\",\"block\",\"~:block/updated-at\",30],[\"^ \
               \",\"^0\",1,\"^1\",\"asset-a\",\"^2\",\"block\",\"^3\",10]]")
            else "null")
      in
      with_server server (fun base_url ->
          let cfg =
            {
              (config ~repo:"demo" ()) with
              Cli_config.base_url = Some base_url;
            }
          in
          let action =
            expect_ok "list asset build"
              (List_command.build cfg (Global_opts.create ())
                 (List_command.Parsed_asset
                    { common = { empty_common_opts with limit = Some 1 } }))
          in
          let* result =
            effect_to_promise
              (execute_with_output List_command.execute action cfg
                 Output.Mode.Human)
          in
          let data =
            expect_some "asset list data" (Cli_result.data_value result)
          in
          let items =
            expect_some "asset items"
              (Option.bind (Edn_util.get data "items") Edn_util.as_seq)
          in
          expect_int "asset limit" 1 (List.length items);
          expect_int64 "newest asset first" 2L
            (expect_some "asset id"
               (Edn_util.get_int64 (List.hd items) "db/id"));
          expect_int "pull plus list calls" 2 (List.length !calls);
          Js.Promise.resolve pass));

  test "CLI parity parse supports search scopes and rejects unknown option"
    (fun () ->
      let request =
        expect_parse_ok "search tag" [ "search"; "tag"; "--content"; "quote" ]
      in
      match request.command with
      | Cli_request.Search (Search.Parsed_tag opts) ->
          expect_equal "query" "quote" opts.content
      | _ ->
          fail_test "expected search tag";
          expect_parse_error_code "unknown search option" ":invalid-options"
            [ "search"; "tag"; "--unknown"; "x"; "quote" ]);

  test
    "CLI parity search parser keeps content alias globals and strict \
     positionals" (fun () ->
      let alias =
        expect_parse_ok "search block alias"
          [ "search"; "block"; "-c"; "1111"; "--output"; "json" ]
      in
      (match alias.command with
      | Cli_request.Search (Search.Parsed_block opts) ->
          expect_equal "alias content" "1111" opts.content
      | _ -> fail_test "expected search block");
      (match alias.globals.output_format with
      | Some (Output.Mode.Packed Output.Mode.Json) -> pass
      | _ -> fail_test "expected search json output");
      let page =
        expect_parse_ok "search page multi-word"
          [ "search"; "page"; "--content"; "project notes" ]
      in
      (match page.command with
      | Cli_request.Search (Search.Parsed_page opts) ->
          expect_equal "page query" "project notes" opts.content
      | _ -> fail_test "expected search page");
      expect_parse_error_code "search positional command" ":unknown-command"
        [ "search"; "block"; "alpha" ]);

  test "CLI parity search build action validates repo and query text" (fun () ->
      let action =
        expect_ok "search block action"
          (Search.build (config ~repo:"demo" ()) (Global_opts.create ())
             (Search.Parsed_block { content = "  Alpha Beta  " }))
      in
      expect_bool "search block scope" true (action.Search.scope = Search.Block);
      expect_equal "search block command" "search-block"
        (Command_id.to_string action.command);
      expect_equal "search repo" "logseq_db_demo"
        (Cli_primitive.string_of_repo action.repo);
      expect_equal "search graph" "demo"
        (Cli_primitive.string_of_graph action.graph);
      expect_equal "search query trim" "Alpha Beta" action.query;
      expect_error_code "search requires repo" "missing-repo"
        (Search.build (config ()) (Global_opts.create ())
           (Search.Parsed_page { content = "Home" }));
      expect_error_code "search rejects blank content" "missing-query-text"
        (Search.build (config ~repo:"demo" ()) (Global_opts.create ())
           (Search.Parsed_tag { content = "   " })));

  test_promise "CLI parity search execute sorts scopes and strips raw fields"
    (fun () ->
      let calls = ref [] in
      let server =
        invoke_server (fun body ->
            if Js.String.includes ~search:"thread-api/q" body then (
              calls := body :: !calls;
              "[[\"^ \
               \",\"~:db/id\",9,\"~:block/title\",\"beta\",\"~:unused\",true],[\"^ \
               \",\"^0\",7,\"^1\",\"Alpha\"]]")
            else "null")
      in
      with_server server (fun base_url ->
          let cfg =
            {
              (config ~repo:"demo" ()) with
              Cli_config.base_url = Some base_url;
            }
          in
          let repo = Cli_primitive.create_repo "demo" in
          let run scope command query =
            execute_with_output Search.execute
              {
                Search.scope;
                command;
                repo;
                graph = Cli_config.repo_to_graph repo;
                query;
              }
              cfg Output.Mode.Human
          in
          let item_titles result =
            let data =
              expect_some "search data" (Cli_result.data_value result)
            in
            let items =
              expect_some "search items"
                (Option.bind (Edn_util.get data "items") Edn_util.as_seq)
            in
            List.map
              (fun item ->
                expect_some "item title"
                  (Edn_util.get_string item "block/title"))
              items
          in
          let* block =
            effect_to_promise (run Search.Block Command_id.Search_block "alpha")
          in
          let* page =
            effect_to_promise (run Search.Page Command_id.Search_page "home")
          in
          let* property =
            effect_to_promise
              (run Search.Property Command_id.Search_property "owner")
          in
          let* tag =
            effect_to_promise (run Search.Tag Command_id.Search_tag "quote")
          in
          List.iter
            (fun result ->
              expect_bool "search ok" false (Cli_result.is_error result);
              expect_equal "sorted titles" "Alpha,beta"
                (String.concat "," (item_titles result)))
            [ block; page; property; tag ];
          expect_int "q calls" 4 (List.length !calls);
          expect_named_contains "block query pulls deleted-at"
            (List.nth !calls 3) "logseq.property/deleted-at";
          expect_named_contains "page query uses block name" (List.nth !calls 2)
            "block/name";
          expect_named_contains "property query class" (List.nth !calls 1)
            "logseq.class/Property";
          expect_named_contains "tag query class" (List.nth !calls 0)
            "logseq.class/Tag";
          Js.Promise.resolve pass));

  test_promise "CLI parity search execute filters recycled pages and blocks"
    (fun () ->
      let block_results =
        "[[\"^ \",\"~:db/id\",1,\"~:block/title\",\"alpha \
         live\",\"~:block/parent\",[\"^ \",\"^0\",51,\"^1\",\"Live \
         Page\"]],[\"^ \",\"^0\",2,\"^1\",\"alpha orphan\",\"^2\",[\"^ \
         \",\"^0\",10,\"^1\",\"intermediate\",\"^2\",[\"^ \
         \",\"^0\",50,\"^1\",\"Old \
         Page\",\"~:logseq.property/deleted-at\",1712000000000,\"^2\",[\"^ \
         \",\"^0\",999,\"^1\",\"Recycle\"]]]],[\"^ \",\"^0\",3,\"^1\",\"alpha \
         tombstone\",\"^2\",[\"^ \",\"^0\",50,\"^1\",\"Old \
         Page\",\"^3\",1712000000000]]]"
      in
      let page_results =
        "[[\"^ \",\"~:db/id\",1,\"~:block/title\",\"Home\"],[\"^ \
         \",\"^0\",2,\"^1\",\"Recycled \
         Home\",\"~:logseq.property/deleted-at\",1712000000000],[\"^ \
         \",\"^0\",3,\"^1\",\"Homework\"]]"
      in
      let call_count = ref 0 in
      let server =
        invoke_server (fun body ->
            if Js.String.includes ~search:"thread-api/q" body then (
              incr call_count;
              if !call_count = 1 then block_results else page_results)
            else "null")
      in
      with_server server (fun base_url ->
          let repo = Cli_primitive.create_repo "demo" in
          let cfg =
            {
              (config ~repo:"demo" ()) with
              Cli_config.base_url = Some base_url;
            }
          in
          let run scope command query =
            execute_with_output Search.execute
              {
                Search.scope;
                command;
                repo;
                graph = Cli_config.repo_to_graph repo;
                query;
              }
              cfg Output.Mode.Human
          in
          let titles result =
            let data =
              expect_some "search data" (Cli_result.data_value result)
            in
            let items =
              expect_some "items"
                (Option.bind (Edn_util.get data "items") Edn_util.as_seq)
            in
            List.map
              (fun item ->
                expect_some "title" (Edn_util.get_string item "block/title"))
              items
          in
          let* block =
            effect_to_promise (run Search.Block Command_id.Search_block "alpha")
          in
          expect_equal "live block only" "alpha live"
            (String.concat "," (titles block));
          let* page =
            effect_to_promise (run Search.Page Command_id.Search_page "home")
          in
          expect_equal "live pages only" "Home,Homework"
            (String.concat "," (titles page));
          Js.Promise.resolve pass));

  test_promise "CLI parity search execute replaces uuid refs in block titles"
    (fun () ->
      let ref_uuid = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" in
      let calls = ref [] in
      let server =
        invoke_server (fun body ->
            calls := body :: !calls;
            if Js.String.includes ~search:"thread-api/q" body then
              "[[\"^ \",\"~:db/id\",7,\"~:block/title\",\"foo \
               [[aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa]]\"]]"
            else if Js.String.includes ~search:"thread-api/pull" body then
              "[\"^ \
               \",\"~:db/id\",99,\"~:block/uuid\",\"~uaaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa\",\"~:block/title\",\"bar\"]"
            else "null")
      in
      with_server server (fun base_url ->
          let repo = Cli_primitive.create_repo "demo" in
          let cfg =
            {
              (config ~repo:"demo" ()) with
              Cli_config.base_url = Some base_url;
            }
          in
          let* result =
            effect_to_promise
              (execute_with_output Search.execute
                 {
                   Search.scope = Search.Block;
                   command = Command_id.Search_block;
                   repo;
                   graph = Cli_config.repo_to_graph repo;
                   query = "foo";
                 }
                 cfg Output.Mode.Human)
          in
          let data = expect_some "search data" (Cli_result.data_value result) in
          let items =
            expect_some "items"
              (Option.bind (Edn_util.get data "items") Edn_util.as_seq)
          in
          let title =
            expect_some "title"
              (Edn_util.get_string (List.hd items) "block/title")
          in
          expect_equal "replaced uuid ref" "foo [[bar]]" title;
          expect_int "q and pull calls" 2 (List.length !calls);
          expect_named_contains "pull lookup uuid" (List.hd !calls) ref_uuid;
          Js.Promise.resolve pass));

  test "CLI parity remove validation rejects ambiguous and blank targets"
    (fun () ->
      expect_equal "remove page ambiguous"
        "only one of --id or --page is allowed"
        (expect_some "invalid"
           (Remove.invalid_options
              (Remove.Parsed_page { id = Some 1L; page = Some "Home" })));
      expect_equal "remove tag blank" "name must be non-empty"
        (expect_some "invalid"
           (Remove.invalid_options
              (Remove.Parsed_tag { id = None; name = Some " " }))));

  test "CLI parity remove build action resolves targets and repo" (fun () ->
      let block =
        expect_ok "remove block ids"
          (Remove.build (config ~repo:"demo" ()) (Global_opts.create ())
             (Remove.Parsed_block { id_raw = Some "[1,2]"; uuid = None }))
      in
      (match block with
      | Remove.Remove_block { repo; graph; id; ids; multi_id; uuid } ->
          expect_equal "remove repo" "logseq_db_demo"
            (Cli_primitive.string_of_repo repo);
          expect_equal "remove graph" "demo"
            (Cli_primitive.string_of_graph graph);
          expect_none "remove block single id" id;
          expect_int "remove block ids" 2 (List.length ids);
          expect_bool "remove block multi" true multi_id;
          expect_none "remove block uuid none" uuid
      | _ -> fail_test "expected remove block");
      let block_uuid =
        expect_ok "remove block uuid"
          (Remove.build (config ~repo:"demo" ()) (Global_opts.create ())
             (Remove.Parsed_block
                {
                  id_raw = None;
                  uuid = Some "00000000-0000-4000-8000-000000000001";
                }))
      in
      (match block_uuid with
      | Remove.Remove_block { uuid = Some uuid; multi_id; ids; _ } ->
          expect_equal "remove block uuid"
            "00000000-0000-4000-8000-000000000001" uuid;
          expect_bool "remove uuid multi" false multi_id;
          expect_int "remove uuid ids" 0 (List.length ids)
      | _ -> fail_test "expected uuid remove block");
      let page =
        expect_ok "remove page by title"
          (Remove.build (config ~repo:"demo" ()) (Global_opts.create ())
             (Remove.Parsed_page { id = None; page = Some " Home " }))
      in
      (match page with
      | Remove.Remove_page { page = Some page; id = None; _ } ->
          expect_equal "remove page trims" "Home" page
      | _ -> fail_test "expected remove page by title");
      let tag =
        expect_ok "remove tag by id"
          (Remove.build (config ~repo:"demo" ()) (Global_opts.create ())
             (Remove.Parsed_tag { id = Some 42L; name = None }))
      in
      (match tag with
      | Remove.Remove_tag { id = Some 42L; name = None; _ } -> pass
      | _ -> fail_test "expected remove tag by id");
      expect_error_code "remove requires repo" "missing-repo"
        (Remove.build (config ()) (Global_opts.create ())
           (Remove.Parsed_block { id_raw = Some "1"; uuid = None }));
      expect_error_code "remove block missing target" "missing-target"
        (Remove.build (config ~repo:"demo" ()) (Global_opts.create ())
           (Remove.Parsed_block { id_raw = None; uuid = None }));
      expect_error_code "remove page missing" "missing-page-name"
        (Remove.build (config ~repo:"demo" ()) (Global_opts.create ())
           (Remove.Parsed_page { id = None; page = None })));

  test_promise "CLI parity remove block rejects page entities before delete"
    (fun () ->
      let apply_called = ref false in
      let server =
        invoke_server (fun body ->
            if Js.String.includes ~search:"thread-api/pull" body then
              "[\"^ \
               \",\"~:db/id\",190,\"~:block/uuid\",\"~u00000000-0000-4000-8000-000000000190\",\"~:block/name\",\"some-page\"]"
            else if
              Js.String.includes ~search:"thread-api/apply-outliner-ops" body
            then (
              apply_called := true;
              "[\"^ \",\"~:result\",true]")
            else "null")
      in
      with_server server (fun base_url ->
          let repo = Cli_primitive.create_repo "demo" in
          let action =
            Remove.Remove_block
              {
                repo;
                graph = Cli_config.repo_to_graph repo;
                id = Some 190L;
                ids = [ 190L ];
                multi_id = false;
                uuid = None;
              }
          in
          let cfg =
            {
              (config ~repo:"demo" ()) with
              Cli_config.base_url = Some base_url;
            }
          in
          let* result =
            effect_to_promise
              (execute_with_output Remove.execute action cfg Output.Mode.Human)
          in
          expect_bool "remove page target is error" true
            (Cli_result.is_error result);
          (match result.Cli_result.error with
          | Some err ->
              expect_equal "remove page target code" "invalid-target"
                (keyword_text err.Error.code)
          | None -> fail_test "expected remove error");
          expect_bool "delete not called" false !apply_called;
          Js.Promise.resolve pass));

  test_promise "CLI parity remove block by id deletes resolved block uuid"
    (fun () ->
      let captured_apply_body = ref None in
      let server =
        invoke_server (fun body ->
            if Js.String.includes ~search:"thread-api/pull" body then
              "[\"^ \
               \",\"~:db/id\",190,\"~:block/uuid\",\"~u00000000-0000-4000-8000-000000000190\"]"
            else if
              Js.String.includes ~search:"thread-api/apply-outliner-ops" body
            then (
              captured_apply_body := Some body;
              "[\"^ \",\"~:result\",true]")
            else "null")
      in
      with_server server (fun base_url ->
          let repo = Cli_primitive.create_repo "demo" in
          let action =
            Remove.Remove_block
              {
                repo;
                graph = Cli_config.repo_to_graph repo;
                id = Some 190L;
                ids = [ 190L ];
                multi_id = false;
                uuid = None;
              }
          in
          let cfg =
            {
              (config ~repo:"demo" ()) with
              Cli_config.base_url = Some base_url;
            }
          in
          let* result =
            effect_to_promise
              (execute_with_output Remove.execute action cfg Output.Mode.Human)
          in
          expect_bool "remove block succeeds" false (Cli_result.is_error result);
          let body = expect_some "captured apply body" !captured_apply_body in
          expect_named_contains "delete method" body
            "thread-api/apply-outliner-ops";
          expect_named_contains "delete op" body "delete-blocks";
          expect_named_contains "delete uuid" body
            "00000000-0000-4000-8000-000000000190";
          Js.Promise.resolve pass));

  test "CLI parity show target resolves stdin ids vectors ids uuid and pages"
    (fun () ->
      expect_equal "stdin trim" "42"
        (expect_some "stdin" (Show.normalize_stdin_id (Some " 42\n")));
      expect_none "blank stdin" (Show.normalize_stdin_id (Some " \n"));
      let by_id =
        expect_ok "show id"
          (Show.resolve_target
             {
               id_raw = Some "42";
               uuid = None;
               page = None;
               page_hierarchy = false;
               linked_references = None;
               ref_id_footer = None;
               level = None;
               stdin_id = None;
             })
      in
      (match by_id with
      | Show.By_id 42L -> pass
      | _ -> fail_test "expected By_id 42");
      let multi =
        expect_ok "show ids"
          (Show.resolve_target
             {
               id_raw = Some "[1,2]";
               uuid = None;
               page = None;
               page_hierarchy = false;
               linked_references = None;
               ref_id_footer = None;
               level = None;
               stdin_id = None;
             })
      in
      (match multi with
      | Show.By_ids [ 1L; 2L ] -> pass
      | _ -> fail_test "expected By_ids");
      expect_equal "ambiguous show"
        "only one of --id, --uuid, or --page is allowed"
        (expect_some "invalid"
           (Show.invalid_options
              {
                id_raw = Some "1";
                uuid = Some "00000000-0000-4000-8000-000000000001";
                page = None;
                page_hierarchy = false;
                linked_references = None;
                ref_id_footer = None;
                level = None;
                stdin_id = None;
              })));

  test "CLI parity show build threads hierarchy references footer and level"
    (fun () ->
      let base_opts =
        {
          Show.id_raw = Some "42";
          uuid = None;
          page = None;
          page_hierarchy = false;
          linked_references = None;
          ref_id_footer = None;
          level = None;
          stdin_id = None;
        }
      in
      let default_action =
        expect_ok "show defaults"
          (Show.build (config ~repo:"demo" ()) (Global_opts.create ())
             (Show.Parsed_show base_opts))
      in
      expect_equal "show repo" "logseq_db_demo"
        (repo_text default_action.Show.repo);
      expect_equal "show graph" "demo" (graph_text default_action.Show.graph);
      (match default_action.Show.target with
      | Show.By_id 42L -> pass
      | _ -> fail_test "expected By_id target");
      expect_bool "single id" false default_action.Show.multi_id;
      expect_bool "linked refs default" true
        default_action.Show.linked_references;
      expect_bool "ref id footer default" true default_action.Show.ref_id_footer;
      expect_bool "page hierarchy default" false
        default_action.Show.page_hierarchy;
      expect_int "default level" 10
        (expect_some "level" default_action.Show.level);
      let custom_action =
        expect_ok "show custom flags"
          (Show.build (config ~repo:"demo" ()) (Global_opts.create ())
             (Show.Parsed_show
                {
                  base_opts with
                  id_raw = Some "[1,2]";
                  linked_references = Some false;
                  ref_id_footer = Some false;
                  page_hierarchy = true;
                  level = Some 3;
                }))
      in
      (match custom_action.Show.target with
      | Show.By_ids [ 1L; 2L ] -> pass
      | _ -> fail_test "expected multi-id target");
      expect_bool "multi id flag" true custom_action.Show.multi_id;
      expect_bool "linked refs disabled" false
        custom_action.Show.linked_references;
      expect_bool "ref id footer disabled" false
        custom_action.Show.ref_id_footer;
      expect_bool "page hierarchy enabled" true
        custom_action.Show.page_hierarchy;
      expect_int "custom level" 3
        (expect_some "custom level" custom_action.Show.level);
      expect_error_code "show requires repo" "missing-repo"
        (Show.build (config ()) (Global_opts.create ())
           (Show.Parsed_show base_opts));
      expect_error_code "show invalid level" "invalid-options"
        (Show.build (config ~repo:"demo" ()) (Global_opts.create ())
           (Show.Parsed_show { base_opts with level = Some 0 })));

  test
    "CLI parity upsert validation rejects ambiguous and mode-specific options"
    (fun () ->
      expect_equal "upsert page ambiguous"
        "only one of --id or --page is allowed"
        (expect_some "invalid"
           (Upsert.invalid_options
              (Upsert.Parsed_page
                 {
                   id = Some 1L;
                   page = Some "Home";
                   update_tags_edn = None;
                   update_properties_edn = None;
                   remove_tags_edn = None;
                   remove_properties_edn = None;
                 })));
      expect_equal "asset missing path" "--path is required in create mode"
        (expect_some "invalid"
           (Upsert.invalid_options
              (Upsert.Parsed_asset
                 {
                   id = None;
                   uuid = None;
                   path = None;
                   target_id = None;
                   target_uuid = None;
                   target_page = None;
                   pos = None;
                   content = None;
                 })));
      expect_equal "task no status conflict"
        "--status and --no-status are mutually exclusive"
        (expect_some "invalid"
           (Upsert.invalid_options
              (Upsert.Parsed_task
                 {
                   id = None;
                   uuid = None;
                   page = Some "Home";
                   content = None;
                   target_id = None;
                   target_uuid = None;
                   target_page = None;
                   pos = None;
                   status = Some "todo";
                   priority = None;
                   scheduled = None;
                   deadline = None;
                   no_status = true;
                   no_priority = false;
                   no_scheduled = false;
                   no_deadline = false;
                 }))));

  test "CLI parity upsert block update property parsing keeps update contracts"
    (fun () ->
      let block_update_opts =
        {
          Upsert.id = Some 207L;
          uuid = None;
          target_id = None;
          target_uuid = None;
          target_page = None;
          pos = None;
          content = None;
          blocks_edn = None;
          blocks_file = None;
          update_tags_edn = None;
          update_properties_edn = None;
          remove_tags_edn = None;
          remove_properties_edn = None;
        }
      in
      expect_error_code "update-properties vector" "invalid-options"
        (Upsert.build (config ~repo:"demo" ()) (Global_opts.create ())
           (Upsert.Parsed_block
              { block_update_opts with update_properties_edn = Some "[\"p1\"]" }));
      expect_error_code "update-tags map" "invalid-options"
        (Upsert.build (config ~repo:"demo" ()) (Global_opts.create ())
           (Upsert.Parsed_block
              { block_update_opts with update_tags_edn = Some "{\"t1\" true}" }));
      let action =
        expect_ok "valid update-properties map"
          (Upsert.build (config ~repo:"demo" ()) (Global_opts.create ())
             (Upsert.Parsed_block
                {
                  block_update_opts with
                  update_properties_edn = Some "{\"p1\" \"val\"}";
                }))
      in
      match action with
      | Upsert.Upsert_block (Upsert.Block_update update) ->
          expect_int "update property count" 1
            (List.length update.update_properties);
          expect_equal "update property key" "p1"
            (property_key_text (List.hd update.update_properties).Property.key)
      | _ -> fail_test "expected Upsert_block update action");

  test "CLI parity upsert tag parses schema property vectors" (fun () ->
      let action =
        expect_ok "valid tag schema properties"
          (Upsert.build (config ~repo:"demo" ()) (Global_opts.create ())
             (Upsert.Parsed_tag
                {
                  id = None;
                  name = Some "Project";
                  add_properties_edn = Some "[\"status\" :user.property/owner]";
                  remove_properties_edn = Some "[123]";
                }))
      in
      (match action with
      | Upsert.Upsert_tag
          { mode = Upsert.Create; add_properties; remove_properties; _ } ->
          expect_int "add property count" 2 (List.length add_properties);
          expect_equal "add property by name" "status"
            (property_key_text (List.hd add_properties));
          expect_equal "remove property by id" "123"
            (property_key_text (List.hd remove_properties))
      | _ -> fail_test "expected Upsert_tag create action");
      expect_error_code "add-properties map" "invalid-options"
        (Upsert.build (config ~repo:"demo" ()) (Global_opts.create ())
           (Upsert.Parsed_tag
              {
                id = None;
                name = Some "Project";
                add_properties_edn = Some "{\"status\" true}";
                remove_properties_edn = None;
              })));

  test
    "CLI parity upsert task build preserves create update and clear semantics"
    (fun () ->
      let base_task_opts =
        {
          Upsert.id = None;
          uuid = None;
          page = None;
          content = None;
          target_id = None;
          target_uuid = None;
          target_page = None;
          pos = None;
          status = None;
          priority = None;
          scheduled = None;
          deadline = None;
          no_status = false;
          no_priority = false;
          no_scheduled = false;
          no_deadline = false;
        }
      in
      let build_task name opts =
        expect_ok name
          (Upsert.build (config ~repo:"demo" ()) (Global_opts.create ())
             (Upsert.Parsed_task opts))
      in
      expect_error_code "task requires target" "missing-target"
        (Upsert.build (config ~repo:"demo" ()) (Global_opts.create ())
           (Upsert.Parsed_task base_task_opts));
      expect_error_code "task rejects page and content" "invalid-options"
        (Upsert.build (config ~repo:"demo" ()) (Global_opts.create ())
           (Upsert.Parsed_task
              { base_task_opts with page = Some "Home"; content = Some "Task" }));
      let scheduled =
        expect_some "scheduled date"
          (Time.parse_rfc3339 "2026-02-10T08:00:00.000Z")
      in
      let deadline =
        expect_some "deadline date"
          (Time.parse_rfc3339 "2026-02-12T18:00:00.000Z")
      in
      let created =
        build_task "create task"
          {
            base_task_opts with
            content = Some "Task from CLI";
            status = Some "todo";
            priority = Some "high";
            scheduled = Some scheduled;
            deadline = Some deadline;
          }
      in
      (match created with
      | Upsert.Upsert_task task ->
          expect_bool "create mode" true (task.mode = Upsert.Create);
          expect_equal "create repo" "logseq_db_demo" (repo_text task.repo);
          expect_equal "create graph" "demo" (graph_text task.graph);
          expect_equal "create content" "Task from CLI"
            (expect_some "content" task.content);
          expect_equal "status input" "todo"
            (expect_some "status input" task.status_input);
          let property_keys =
            task.update_properties
            |> List.map (fun item -> item.Property.key)
            |> List.map property_key_text
          in
          expect_bool "priority update" true
            (List.mem "logseq.property/priority" property_keys);
          expect_bool "scheduled update" true
            (List.mem "logseq.property/scheduled" property_keys);
          expect_bool "deadline update" true
            (List.mem "logseq.property/deadline" property_keys)
      | _ -> fail_test "expected Upsert_task create action");
      let updated =
        build_task "update task"
          {
            base_task_opts with
            id = Some 42L;
            no_status = true;
            no_priority = true;
            no_scheduled = true;
            no_deadline = true;
          }
      in
      (match updated with
      | Upsert.Upsert_task task ->
          expect_bool "update mode" true (task.mode = Upsert.Update);
          expect_int64 "update id" 42L (expect_some "update id" task.id);
          let clear_keys =
            task.clear_properties |> List.map property_key_text
          in
          expect_bool "clear status" true
            (List.mem "logseq.property/status" clear_keys);
          expect_bool "clear priority" true
            (List.mem "logseq.property/priority" clear_keys);
          expect_bool "clear scheduled" true
            (List.mem "logseq.property/scheduled" clear_keys);
          expect_bool "clear deadline" true
            (List.mem "logseq.property/deadline" clear_keys)
      | _ -> fail_test "expected Upsert_task update action");
      List.iter
        (fun opts ->
          expect_error_code "task set no conflict" "invalid-options"
            (Upsert.build (config ~repo:"demo" ()) (Global_opts.create ())
               (Upsert.Parsed_task opts)))
        [
          {
            base_task_opts with
            id = Some 42L;
            status = Some "todo";
            no_status = true;
          };
          {
            base_task_opts with
            id = Some 42L;
            priority = Some "high";
            no_priority = true;
          };
          {
            base_task_opts with
            id = Some 42L;
            scheduled = Some scheduled;
            no_scheduled = true;
          };
          {
            base_task_opts with
            id = Some 42L;
            deadline = Some deadline;
            no_deadline = true;
          };
        ];
      let unknown_status =
        build_task "unknown status"
          {
            base_task_opts with
            content = Some "Task from CLI";
            status = Some "wat";
          }
      in
      (match unknown_status with
      | Upsert.Upsert_task task ->
          expect_bool "unknown status create mode" true
            (task.mode = Upsert.Create);
          expect_equal "unknown status input" "wat"
            (expect_some "unknown status input" task.status_input)
      | _ -> fail_test "expected Upsert_task unknown status action");
      let invalid_priority =
        Upsert.build (config ~repo:"demo" ()) (Global_opts.create ())
          (Upsert.Parsed_task
             {
               base_task_opts with
               content = Some "Task from CLI";
               priority = Some "wat";
             })
      in
      expect_error_code "invalid priority code" "invalid-options"
        invalid_priority;
      match invalid_priority with
      | Error err ->
          expect_named_contains "invalid priority message" err.Error.message
            "Invalid value for option :priority: wat";
          expect_named_contains "invalid priority values" err.Error.message
            "Available values: low, medium, high, urgent"
      | Ok _ -> fail_test "expected invalid priority");

  test "CLI parity upsert asset build derives title and selector modes"
    (fun () ->
      let base_asset_opts =
        {
          Upsert.id = None;
          uuid = None;
          path = None;
          target_id = None;
          target_uuid = None;
          target_page = Some "Home";
          pos = None;
          content = None;
        }
      in
      let created =
        expect_ok "asset create"
          (Upsert.build (config ~repo:"demo" ()) (Global_opts.create ())
             (Upsert.Parsed_asset
                { base_asset_opts with path = Some "/tmp/images/team-logo.png" }))
      in
      (match created with
      | Upsert.Upsert_asset asset ->
          expect_bool "asset create mode" true (asset.mode = Upsert.Create);
          expect_equal "asset create path" "/tmp/images/team-logo.png"
            (expect_some "asset path" asset.path);
          expect_equal "asset default title" "team-logo.png"
            (expect_some "asset content" asset.content);
          ignore (expect_some "asset create action" asset.create_action)
      | _ -> fail_test "expected Upsert_asset create action");
      let updated =
        expect_ok "asset update"
          (Upsert.build (config ~repo:"demo" ()) (Global_opts.create ())
             (Upsert.Parsed_asset
                {
                  base_asset_opts with
                  id = Some 42L;
                  target_page = None;
                  content = Some "Caption";
                }))
      in
      match updated with
      | Upsert.Upsert_asset asset ->
          expect_bool "asset update mode" true (asset.mode = Upsert.Update);
          expect_int64 "asset id" 42L (expect_some "asset id" asset.id);
          expect_none "asset update path ignored" asset.path;
          expect_equal "asset update content" "Caption"
            (expect_some "asset update content" asset.content)
      | _ -> fail_test "expected Upsert_asset update action");

  test "CLI parity property and block option parsers normalize known values"
    (fun () ->
      expect_bool "position first-child" true
        (Block.position_of_string "first-child" = Some Block.First_child);
      expect_bool "position sibling" true
        (Block.position_of_string "sibling" = Some Block.Sibling);
      expect_none "position invalid" (Block.position_of_string "middle");
      expect_bool "property url kind" true
        (Property.kind_of_string "url" = Some Property.Url);
      expect_equal "property kind string" "date"
        (Property.string_of_kind Property.Date);
      expect_equal "property other kind string" "user.property/custom"
        (Property.string_of_kind
           (Property.Other (Edn_util.keyword_t "user.property/custom")));
      expect_bool "cardinality many" true
        (Property.cardinality_of_string "many" = Some Property.Many);
      expect_none "bad cardinality" (Property.cardinality_of_string "all");
      (match Property.parse_key (Edn_util.int64 801L) with
      | Some (Property.Key_id 801L) -> pass
      | _ -> fail_test "expected property key id");
      (match Property.parse_key (Edn_util.keyword "user.property/rating") with
      | Some (Property.Key_ident ident) ->
          expect_equal "property ident key" "user.property/rating"
            (Edn_util.keyword_to_string ident)
      | _ -> fail_test "expected property key ident");
      (match Property.parse_key (Edn_util.string "Correct Answer") with
      | Some (Property.Key_name name) ->
          expect_equal "property name key" "Correct Answer" name
      | _ -> fail_test "expected property key name");
      expect_none "property key rejects bool"
        (Property.parse_key (Edn_util.bool true));
      let child =
        Block.make ~uuid:"00000000-0000-4000-8000-000000000102" ~title:"Child"
          ()
      in
      let root =
        Block.make ~uuid:"00000000-0000-4000-8000-000000000101" ~title:"Root"
          ~children:[ child ] ()
      in
      let flat = Block.flatten [ root ] in
      expect_int "flatten count" 2 (List.length flat);
      expect_equal "flatten root first" "Root"
        (expect_some "root label" (Block.label (List.nth flat 0)));
      expect_equal "flatten child second" "Child"
        (expect_some "child label" (Block.label (List.nth flat 1)));
      let serialized = Edn_util.any (Block.to_value root) in
      expect_equal "serialized block title" "Root"
        (expect_some "serialized title"
           (Edn_util.get_string serialized "block/title"));
      expect_bool "serialized child vector" true
        (Option.is_some (Edn_util.get serialized "block/children")));

  test "CLI parity add block parsing preserves uuids tags and raw blocks"
    (fun () ->
      let parsed =
        expect_ok "parse blocks"
          (Add.parse_blocks_edn ~label:"blocks"
             "[{:block/title \"Root\" :block/uuid #uuid \
              \"00000000-0000-4000-8000-000000000301\" :block/tags \
              [\"Project\" :logseq.class/Tag] :block/children [{:block/content \
              \"Child\" :block/uuid #uuid \
              \"00000000-0000-4000-8000-000000000302\"}]} \"Loose\"]")
      in
      expect_int "parsed block count" 2 (List.length parsed);
      let root = List.nth parsed 0 in
      expect_equal "root title" "Root" (expect_some "root title" root.title);
      expect_equal "root uuid" "00000000-0000-4000-8000-000000000301"
        (expect_some "root uuid" root.uuid);
      expect_int "root tags" 2 (List.length root.tags);
      expect_int "root children" 1 (List.length root.children);
      expect_equal "child content title" "Child"
        (expect_some "child title" (List.hd root.children).title);
      expect_equal "string block title" "Loose"
        (expect_some "loose title" (List.nth parsed 1).title);
      expect_error_code "blocks must be vector" "invalid-blocks"
        (Add.parse_blocks_edn ~label:"blocks" "{:block/title \"Root\"}");
      expect_error_code "invalid blocks edn" "invalid-options"
        (Add.parse_blocks_edn ~label:"blocks" "[{:block/title"));

  test "CLI parity add collect created block uuids depth-first and unique"
    (fun () ->
      let nested =
        Edn_util.map
          [
            ( Edn_util.keyword "block/uuid",
              Edn_util.uuid "00000000-0000-4000-8000-000000000401" );
            ( Edn_util.keyword "block/children",
              Edn_util.vector
                [
                  Edn_util.map
                    [
                      ( Edn_util.keyword "block/uuid",
                        Edn_util.uuid "00000000-0000-4000-8000-000000000402" );
                    ];
                  Edn_util.map
                    [
                      (Edn_util.keyword "block/title", Edn_util.string "No uuid");
                      ( Edn_util.keyword "block/children",
                        Edn_util.vector
                          [
                            Edn_util.map
                              [
                                ( Edn_util.keyword "block/uuid",
                                  Edn_util.uuid
                                    "00000000-0000-4000-8000-000000000403" );
                              ];
                          ] );
                    ];
                ] );
          ]
      in
      let inserted =
        Edn_util.vector
          [
            nested;
            Edn_util.map
              [
                ( Edn_util.keyword "block/uuid",
                  Edn_util.uuid "00000000-0000-4000-8000-000000000404" );
              ];
            Edn_util.map
              [
                ( Edn_util.keyword "block/uuid",
                  Edn_util.uuid "00000000-0000-4000-8000-000000000402" );
              ];
          ]
      in
      expect_equal "collected uuids"
        (String.concat ","
           [
             "00000000-0000-4000-8000-000000000401";
             "00000000-0000-4000-8000-000000000402";
             "00000000-0000-4000-8000-000000000403";
             "00000000-0000-4000-8000-000000000404";
           ])
        (String.concat ","
           (Add.collect_uuids_from_value inserted |> Add.unique));
      let child =
        Block.make ~uuid:"00000000-0000-4000-8000-000000000502" ~title:"Child"
          ()
      in
      let root =
        Block.make ~uuid:"00000000-0000-4000-8000-000000000501" ~title:"Root"
          ~children:[ child ] ()
      in
      let duplicate =
        Block.make ~uuid:"00000000-0000-4000-8000-000000000502"
          ~title:"Duplicate" ()
      in
      expect_equal "action uuids"
        "00000000-0000-4000-8000-000000000501,00000000-0000-4000-8000-000000000502"
        (String.concat "," (Add.collect_action_block_uuids [ root; duplicate ])));

  test "CLI parity add action validates targets metadata and status" (fun () ->
      let base_opts =
        {
          Add.target_id = None;
          target_uuid = None;
          target_page_name = Some "Home";
          pos = None;
          status = None;
          tags_edn = None;
          properties_edn = None;
          content = Some "Hello from add";
          blocks_edn = None;
          blocks_file = None;
        }
      in
      expect_error_code "ambiguous target" "invalid-options"
        (Add.build_add_block_action
           { base_opts with target_id = Some 42L }
           []
           (Cli_primitive.create_repo "demo"));
      expect_error_code "invalid target uuid" "invalid-options"
        (Add.build_add_block_action
           { base_opts with target_page_name = None; target_uuid = Some "bad" }
           []
           (Cli_primitive.create_repo "demo"));
      expect_error_code "sibling requires block target" "invalid-options"
        (Add.build_add_block_action
           { base_opts with pos = Some Block.Sibling }
           []
           (Cli_primitive.create_repo "demo"));
      expect_error_code "blocks cannot combine metadata" "invalid-options"
        (Add.build_add_block_action
           {
             base_opts with
             blocks_edn = Some "[\"Block\"]";
             tags_edn = Some "[\"Project\"]";
           }
           []
           (Cli_primitive.create_repo "demo"));
      expect_error_code "invalid status" "invalid-options"
        (Add.build_add_block_action
           { base_opts with status = Some "wat" }
           []
           (Cli_primitive.create_repo "demo"));
      let action =
        expect_ok "add action"
          (Add.build_add_block_action
             {
               base_opts with
               status = Some "in progress";
               tags_edn =
                 Some
                   "[\"Project\" :logseq.class/Tag #uuid \
                    \"00000000-0000-4000-8000-000000000601\" 701]";
               properties_edn = Some "{\"Correct Answer\" \"42\" 801 true}";
             }
             []
             (Cli_primitive.create_repo "demo"))
      in
      expect_equal "repo" "logseq_db_demo" (repo_text action.repo);
      expect_equal "graph" "demo" (graph_text action.graph);
      expect_bool "default position" true (action.pos = Block.Last_child);
      expect_equal "normalized status" "logseq.property/status.doing"
        (keyword_text (expect_some "status" action.status));
      expect_int "tag selectors" 4 (List.length action.tags);
      expect_int "property assignments" 2 (List.length action.properties);
      expect_int "block count" 1 (List.length action.blocks);
      expect_equal "content block" "Hello from add"
        (expect_some "block title" (List.hd action.blocks).title);
      ignore (expect_some "generated uuid" (List.hd action.blocks).uuid));

  test "CLI parity add metadata ops apply status tags and properties by uuid"
    (fun () ->
      let ops =
        Add.metadata_ops
          [
            "00000000-0000-4000-8000-000000000701";
            "00000000-0000-4000-8000-000000000702";
          ]
          (Some (Edn_util.keyword_t "logseq.property/status.todo"))
          [
            Entity.of_value
              (Edn_util.map [ (Edn_util.keyword "db/id", Edn_util.int64 901L) ]);
            Entity.of_value
              (Edn_util.map [ (Edn_util.keyword "db/id", Edn_util.int64 901L) ]);
          ]
          [
            {
              Property.key =
                Property.Key_ident
                  (Edn_util.keyword_t "user.property/root-answer");
              value = Edn_util.string "root";
            };
          ]
      in
      expect_int "metadata ops count" 3 (List.length ops);
      let output =
        String.concat "\n" (List.map Melange_edn.to_edn_string ops)
      in
      expect_named_contains "status op" output ":logseq.property/status.todo";
      expect_named_contains "tag op" output ":block/tags 901";
      expect_named_contains "property op" output
        ":user.property/root-answer \"root\"");

  test "CLI parity update build action validates property and tag edn"
    (fun () ->
      let base_opts =
        {
          Update.id = Some 207L;
          uuid = None;
          target_id = None;
          target_uuid = None;
          target_page = None;
          pos = None;
          status = None;
          content = None;
          update_tags_edn = None;
          update_properties_edn = None;
          remove_tags_edn = None;
          remove_properties_edn = None;
          blocks_edn = None;
          blocks_file = None;
        }
      in
      expect_error_code "update properties vector" "invalid-options"
        (Update.build_action
           { base_opts with update_properties_edn = Some "[\"p1\"]" }
           (Cli_primitive.create_repo "demo"));
      expect_error_code "update tags map" "invalid-options"
        (Update.build_action
           { base_opts with update_tags_edn = Some "{\"t1\" true}" }
           (Cli_primitive.create_repo "demo"));
      expect_error_code "missing source" "missing-source"
        (Update.build_action
           {
             base_opts with
             id = None;
             update_properties_edn = Some "{\"p1\" 1}";
           }
           (Cli_primitive.create_repo "demo"));
      let action =
        expect_ok "valid update"
          (Update.build_action
             {
               base_opts with
               status = Some "todo";
               content = Some "Updated";
               target_page = Some "Archive";
               update_tags_edn = Some "[\"Project\"]";
               update_properties_edn = Some "{\"p1\" \"val\"}";
               remove_tags_edn = Some "[701]";
               remove_properties_edn = Some "[\"old-prop\"]";
             }
             (Cli_primitive.create_repo "demo"))
      in
      expect_equal "repo" "logseq_db_demo" (repo_text action.repo);
      expect_equal "graph" "demo" (graph_text action.graph);
      expect_int64 "source id" 207L (expect_some "id" action.id);
      expect_equal "content" "Updated" (expect_some "content" action.content);
      expect_equal "target page" "Archive"
        (expect_some "target page" action.target_page);
      expect_bool "default move position" true
        (action.pos = Some Block.First_child);
      expect_equal "source label" "207"
        (expect_some "source label" action.source_label);
      expect_equal "target label" "page:Archive"
        (expect_some "target label" action.target_label);
      expect_int "update tags" 1 (List.length action.update_tags);
      expect_int "remove tags" 1 (List.length action.remove_tags);
      expect_int "update properties include status" 2
        (List.length action.update_properties);
      expect_int "remove properties" 1 (List.length action.remove_properties));

  test "CLI parity sync config key parser accepts ws-url and http-base only"
    (fun () ->
      expect_bool "ws-url" true
        (Sync.config_key_of_string "ws-url" = Some Sync.Ws_url);
      expect_bool "http-base" true
        (Sync.config_key_of_string "http-base" = Some Sync.Http_base);
      expect_equal "ws-url string" "ws-url"
        (Sync.string_of_config_key Sync.Ws_url);
      expect_none "bad sync key" (Sync.config_key_of_string "graph"));

  test "CLI parity sync build validates repo selectors and e2ee options"
    (fun () ->
      let globals =
        Global_opts.create ~graph:(Cli_primitive.create_graph "demo") ()
      in
      expect_error_code "sync status requires repo" "missing-repo"
        (Sync.build (config ()) (Global_opts.create ()) Sync.Parsed_status);
      expect_error_code "sync download requires graph" "missing-graph"
        (Sync.build (config ()) (Global_opts.create ())
           (Sync.Parsed_download { progress = None; e2ee_password = None }));
      let default_download =
        expect_ok "sync download default"
          (Sync.build (config ()) globals
             (Sync.Parsed_download { progress = None; e2ee_password = None }))
      in
      (match default_download with
      | Sync.Sync_download action ->
          expect_equal "download repo" "logseq_db_demo" (repo_text action.repo);
          expect_equal "download graph" "demo" (graph_text action.graph);
          expect_bool "download allow missing" true action.allow_missing_graph;
          expect_bool "download require missing" true
            action.require_missing_graph;
          expect_bool "download progress default" false action.progress;
          expect_bool "download progress not explicit" false
            action.progress_explicit
      | _ -> fail_test "expected Sync_download action");
      let explicit_download =
        expect_ok "sync download explicit"
          (Sync.build (config ()) globals
             (Sync.Parsed_download
                { progress = Some false; e2ee_password = Some "pw" }))
      in
      (match explicit_download with
      | Sync.Sync_download action ->
          expect_bool "download progress false" false action.progress;
          expect_bool "download progress explicit" true action.progress_explicit;
          expect_equal "download password" "pw"
            (expect_some "download e2ee" action.e2ee_password)
      | _ -> fail_test "expected explicit Sync_download action");
      let start =
        expect_ok "sync start"
          (Sync.build (config ~repo:"demo" ()) (Global_opts.create ())
             (Sync.Parsed_start { e2ee_password = Some "pw" }))
      in
      (match start with
      | Sync.Sync_start action ->
          expect_equal "start password" "pw"
            (expect_some "start e2ee" action.e2ee_password)
      | _ -> fail_test "expected Sync_start action");
      let upload =
        expect_ok "sync upload"
          (Sync.build (config ~repo:"demo" ()) (Global_opts.create ())
             (Sync.Parsed_upload { e2ee_password = Some "pw" }))
      in
      (match upload with
      | Sync.Sync_upload action ->
          expect_equal "upload password" "pw"
            (expect_some "upload e2ee" action.e2ee_password)
      | _ -> fail_test "expected Sync_upload action");
      let ensure_keys =
        expect_ok "sync ensure keys"
          (Sync.build (config ()) (Global_opts.create ())
             (Sync.Parsed_ensure_keys
                { e2ee_password = Some "pw"; upload_keys = true }))
      in
      match ensure_keys with
      | Sync.Sync_ensure_keys action ->
          expect_equal "ensure keys password" "pw"
            (expect_some "ensure keys e2ee" action.e2ee_password);
          expect_bool "ensure keys upload" true action.upload_keys
      | _ -> fail_test "expected Sync_ensure_keys action");

  test "CLI parity sync build validates config and asset download actions"
    (fun () ->
      expect_error_code "config set missing key" "invalid-options"
        (Sync.build (config ()) (Global_opts.create ())
           (Sync.Parsed_config_set { key = None; value = None }));
      expect_error_code "config set missing value" "invalid-options"
        (Sync.build (config ()) (Global_opts.create ())
           (Sync.Parsed_config_set { key = Some Sync.Ws_url; value = None }));
      expect_error_code "config get missing key" "invalid-options"
        (Sync.build (config ()) (Global_opts.create ())
           (Sync.Parsed_config_get { key = None }));
      expect_error_code "config unset missing key" "invalid-options"
        (Sync.build (config ()) (Global_opts.create ())
           (Sync.Parsed_config_unset { key = None }));
      let set_action =
        expect_ok "config set"
          (Sync.build (config ()) (Global_opts.create ())
             (Sync.Parsed_config_set
                { key = Some Sync.Ws_url; value = Some "ws://example/%s" }))
      in
      (match set_action with
      | Sync.Sync_config_set { key; value } ->
          expect_bool "config set key" true (key = Sync.Ws_url);
          expect_equal "config set value" "ws://example/%s" value
      | _ -> fail_test "expected Sync_config_set action");
      expect_error_code "grant access missing graph id" "invalid-options"
        (Sync.build (config ~repo:"demo" ()) (Global_opts.create ())
           (Sync.Parsed_grant_access
              { graph_id = None; email = Some "user@example.com" }));
      expect_error_code "grant access missing email" "invalid-options"
        (Sync.build (config ~repo:"demo" ()) (Global_opts.create ())
           (Sync.Parsed_grant_access
              {
                graph_id = Some "11111111-1111-4111-8111-111111111111";
                email = None;
              }));
      let by_id =
        expect_ok "asset download id"
          (Sync.build (config ~repo:"demo" ()) (Global_opts.create ())
             (Sync.Parsed_asset_download { id = Some 123L; uuid = None }))
      in
      (match by_id with
      | Sync.Sync_asset_download action ->
          expect_equal "asset repo" "logseq_db_demo" (repo_text action.repo);
          expect_equal "asset graph" "demo" (graph_text action.graph);
          expect_int64 "asset id" 123L (expect_some "asset id" action.id);
          expect_none "asset uuid absent" action.uuid
      | _ -> fail_test "expected Sync_asset_download id action");
      let asset_uuid = "11111111-1111-4111-8111-111111111111" in
      let by_uuid =
        expect_ok "asset download uuid"
          (Sync.build (config ~repo:"demo" ()) (Global_opts.create ())
             (Sync.Parsed_asset_download { id = None; uuid = Some asset_uuid }))
      in
      (match by_uuid with
      | Sync.Sync_asset_download action ->
          expect_equal "asset uuid" asset_uuid
            (expect_some "asset uuid" action.uuid);
          expect_none "asset id absent" action.id
      | _ -> fail_test "expected Sync_asset_download uuid action");
      expect_error_code "asset download requires repo" "missing-repo"
        (Sync.build (config ()) (Global_opts.create ())
           (Sync.Parsed_asset_download { id = Some 123L; uuid = None }));
      expect_error_code "asset download requires selector" "invalid-options"
        (Sync.build (config ~repo:"demo" ()) (Global_opts.create ())
           (Sync.Parsed_asset_download { id = None; uuid = None }));
      expect_error_code "asset download rejects conflict" "invalid-options"
        (Sync.build (config ~repo:"demo" ()) (Global_opts.create ())
           (Sync.Parsed_asset_download
              { id = Some 123L; uuid = Some asset_uuid })));

  test_promise
    "CLI parity sync asset download requests missing local remote asset"
    (fun () ->
      let root = temp_dir "logseq-cli-sync-asset-" in
      let request_called = ref false in
      let asset_uuid = "00000000-0000-4000-8000-000000000abc" in
      let server =
        invoke_server (fun body ->
            if Js.String.includes ~search:"thread-api/pull" body then (
              expect_named_contains "uuid lookup" body asset_uuid;
              "[\"^ \
               \",\"~:db/id\",123,\"~:block/uuid\",\"~u00000000-0000-4000-8000-000000000abc\",\"~:block/tags\",[[\"^ \
               \",\"~:db/ident\",\"~:logseq.class/Asset\"]],\"~:logseq.property.asset/type\",\"png\",\"~:logseq.property.asset/checksum\",\"sha\",\"~:logseq.property.asset/remote-metadata\",[\"^ \
               \"]]")
            else if Js.String.includes ~search:"thread-api/db-sync-status" body
            then
              "[\"^ \
               \",\"~:repo\",\"logseq_db_demo\",\"~:graph-id\",\"graph-id\",\"~:ws-state\",\"~:open\"]"
            else if
              Js.String.includes
                ~search:"thread-api/db-sync-request-asset-download" body
            then (
              request_called := true;
              expect_named_contains "download request uuid" body asset_uuid;
              "[\"^ \",\"~:result\",true]")
            else "null")
      in
      with_server server (fun base_url ->
          let repo = Cli_primitive.create_repo "demo" in
          let action =
            Sync.Sync_asset_download
              {
                repo;
                graph = Cli_config.repo_to_graph repo;
                id = None;
                uuid = Some asset_uuid;
              }
          in
          let cfg =
            {
              (config ~repo:"demo" ~root_dir:root ()) with
              Cli_config.base_url = Some base_url;
            }
          in
          let* result =
            effect_to_promise
              (execute_with_output Sync.execute action cfg Output.Mode.Human)
          in
          remove_tree root;
          expect_bool "asset download ok" false (Cli_result.is_error result);
          let data =
            expect_some "asset download data" (Cli_result.data_value result)
          in
          expect_equal "asset uuid" asset_uuid
            (expect_some "asset uuid" (Edn_util.get_string data "asset-uuid"));
          expect_equal "asset type" "png"
            (expect_some "asset type" (Edn_util.get_string data "asset-type"));
          expect_bool "download requested" true
            (expect_some "download requested"
               (Edn_util.get_bool data "download-requested?"));
          expect_equal "checksum missing" "missing"
            (expect_some "checksum status"
               (Option.bind
                  (Edn_util.get data "checksum-status")
                  Edn_util.as_keyword));
          expect_bool "request called" true !request_called;
          Js.Promise.resolve pass));

  test_promise
    "CLI parity sync asset download requires active sync before requesting"
    (fun () ->
      let root = temp_dir "logseq-cli-sync-asset-stopped-" in
      let request_called = ref false in
      let asset_uuid = "00000000-0000-4000-8000-000000000abc" in
      let server =
        invoke_server (fun body ->
            if Js.String.includes ~search:"thread-api/pull" body then
              "[\"^ \
               \",\"~:db/id\",123,\"~:block/uuid\",\"~u00000000-0000-4000-8000-000000000abc\",\"~:block/tags\",[[\"^ \
               \",\"~:db/ident\",\"~:logseq.class/Asset\"]],\"~:logseq.property.asset/type\",\"png\",\"~:logseq.property.asset/checksum\",\"sha\",\"~:logseq.property.asset/remote-metadata\",[\"^ \
               \"]]"
            else if Js.String.includes ~search:"thread-api/db-sync-status" body
            then
              "[\"^ \
               \",\"~:repo\",\"logseq_db_demo\",\"~:graph-id\",\"graph-id\",\"~:ws-state\",\"~:stopped\"]"
            else if
              Js.String.includes
                ~search:"thread-api/db-sync-request-asset-download" body
            then (
              request_called := true;
              "[\"^ \",\"~:result\",true]")
            else "null")
      in
      with_server server (fun base_url ->
          let repo = Cli_primitive.create_repo "demo" in
          let action =
            Sync.Sync_asset_download
              {
                repo;
                graph = Cli_config.repo_to_graph repo;
                id = None;
                uuid = Some asset_uuid;
              }
          in
          let cfg =
            {
              (config ~repo:"demo" ~root_dir:root ()) with
              Cli_config.base_url = Some base_url;
            }
          in
          let* result =
            effect_to_promise
              (execute_with_output Sync.execute action cfg Output.Mode.Human)
          in
          remove_tree root;
          expect_bool "asset download error" true (Cli_result.is_error result);
          (match result.Cli_result.error with
          | Some err ->
              expect_equal "sync not started code" "sync-not-started"
                (keyword_text err.Error.code);
              expect_equal "sync start hint"
                "Run logseq sync start --graph demo first."
                (expect_some "sync hint" err.hint)
          | None -> fail_test "expected sync not started error");
          expect_bool "request not called" false !request_called;
          Js.Promise.resolve pass));

  test_promise "CLI parity sync asset download validates remote asset metadata"
    (fun () ->
      let asset_uuid = "00000000-0000-4000-8000-000000000abc" in
      let valid_tags =
        "\"~:block/tags\",[[\"^ \",\"~:db/ident\",\"~:logseq.class/Asset\"]]"
      in
      let base_fields =
        "\"~:db/id\",123,\"~:block/uuid\",\"~u" ^ asset_uuid ^ "\","
        ^ valid_tags
        ^ ",\"~:logseq.property.asset/type\",\"png\",\"~:logseq.property.asset/checksum\",\"sha\",\"~:logseq.property.asset/remote-metadata\",[\"^ \
           \"]"
      in
      let asset fields = "[\"^ \"," ^ fields ^ "]" in
      let run_case label asset_transit expected_code =
        let root = temp_dir ("logseq-cli-sync-asset-" ^ label ^ "-") in
        let request_called = ref false in
        let server =
          invoke_server (fun body ->
              if Js.String.includes ~search:"thread-api/pull" body then
                asset_transit
              else if
                Js.String.includes
                  ~search:"thread-api/db-sync-request-asset-download" body
              then (
                request_called := true;
                "[\"^ \",\"~:result\",true]")
              else "null")
        in
        with_server server (fun base_url ->
            let repo = Cli_primitive.create_repo "demo" in
            let action =
              Sync.Sync_asset_download
                {
                  repo;
                  graph = Cli_config.repo_to_graph repo;
                  id = None;
                  uuid = Some asset_uuid;
                }
            in
            let cfg =
              {
                (config ~repo:"demo" ~root_dir:root ()) with
                Cli_config.base_url = Some base_url;
              }
            in
            let* result =
              effect_to_promise
                (execute_with_output Sync.execute action cfg Output.Mode.Human)
            in
            remove_tree root;
            expect_bool (label ^ " error") true (Cli_result.is_error result);
            (match result.Cli_result.error with
            | Some err ->
                expect_equal (label ^ " code") expected_code
                  (keyword_text err.Error.code)
            | None -> fail_test (label ^ ": expected error"));
            expect_bool (label ^ " no request") false !request_called;
            Js.Promise.resolve pass)
      in
      let* () = run_case "missing" "null" "asset-not-found" in
      let* () =
        run_case "non-asset"
          (asset
             ("\"~:db/id\",123,\"~:block/uuid\",\"~u" ^ asset_uuid
            ^ "\",\"~:block/tags\",[],\"~:logseq.property.asset/type\",\"png\",\"~:logseq.property.asset/checksum\",\"sha\",\"~:logseq.property.asset/remote-metadata\",[\"^ \
               \"]"))
          "not-asset"
      in
      let* () =
        run_case "missing-uuid"
          (asset
             ("\"~:db/id\",123," ^ valid_tags
            ^ ",\"~:logseq.property.asset/type\",\"png\",\"~:logseq.property.asset/checksum\",\"sha\",\"~:logseq.property.asset/remote-metadata\",[\"^ \
               \"]"))
          "asset-uuid-missing"
      in
      let* () =
        run_case "missing-type"
          (asset
             ("\"~:db/id\",123,\"~:block/uuid\",\"~u" ^ asset_uuid ^ "\","
            ^ valid_tags
            ^ ",\"~:logseq.property.asset/checksum\",\"sha\",\"~:logseq.property.asset/remote-metadata\",[\"^ \
               \"]"))
          "asset-type-missing"
      in
      let* () =
        run_case "missing-checksum"
          (asset
             ("\"~:db/id\",123,\"~:block/uuid\",\"~u" ^ asset_uuid ^ "\","
            ^ valid_tags
            ^ ",\"~:logseq.property.asset/type\",\"png\",\"~:logseq.property.asset/remote-metadata\",[\"^ \
               \"]"))
          "asset-checksum-missing"
      in
      let* () =
        run_case "missing-remote"
          (asset
             ("\"~:db/id\",123,\"~:block/uuid\",\"~u" ^ asset_uuid ^ "\","
            ^ valid_tags
            ^ ",\"~:logseq.property.asset/type\",\"png\",\"~:logseq.property.asset/checksum\",\"sha\""
             ))
          "asset-not-remote"
      in
      let* () =
        run_case "external"
          (asset
             (base_fields
            ^ ",\"~:logseq.property.asset/external-url\",\"https://example.com/a.png\""
             ))
          "external-asset"
      in
      Js.Promise.resolve pass);

  test
    "CLI parity query validation rejects db/id datom clauses and non-vector \
     queries" (fun () ->
      let valid =
        edn_of_string "[:find ?b :in $ ?id :where [?b :block/title ?title]]"
      in
      ignore (expect_ok "valid query" (Query.validate_query valid));
      let invalid = edn_of_string "[:find ?b :where [?b :db/id ?id]]" in
      expect_error_code "db/id datom" ":invalid-query"
        (Query.validate_query invalid);
      expect_error_code "non vector query" ":invalid-options"
        (Query.validate_query (Edn_util.map [])));

  test "CLI parity datascript query primitive serializes query clauses" (fun () ->
      let title_clause =
        Edn_util.vector_t
          [
            Edn_util.symbol "?b";
            Edn_util.keyword "block/title";
            Edn_util.symbol "?title";
          ]
      in
      let page_clause =
        Edn_util.vector_t
          [
            Edn_util.symbol "?b";
            Edn_util.keyword "block/page";
            Edn_util.symbol "?page";
          ]
      in
      let predicate_clause =
        Edn_util.list_t
          [
            Edn_util.symbol "clojure.string/includes?";
            Edn_util.symbol "?title";
            Edn_util.symbol "?query";
          ]
      in
      let edn query =
        Melange_edn.to_edn_string
          (Edn_util.any (Cli_primitive.datascript_query_to_edn query))
      in
      let without_inputs =
        Cli_primitive.make_datascript_query ~find:[ Edn_util.symbol "?b" ]
          ~where:[ Cli_primitive.V title_clause ] ()
      in
      expect_equal "datascript query without inputs"
        "[:find ?b :where [?b :block/title ?title]]" (edn without_inputs);
      let with_inputs =
        Cli_primitive.make_datascript_query ~find:[ Edn_util.symbol "?b" ]
          ~in_:[ Melange_edn.symbol "$"; Melange_edn.symbol "?title" ]
          ~where:[ Cli_primitive.V title_clause ] ()
      in
      expect_equal "datascript query with inputs"
        "[:find ?b :in $ ?title :where [?b :block/title ?title]]"
        (edn with_inputs);
      let with_empty_inputs =
        Cli_primitive.make_datascript_query ~find:[ Edn_util.symbol "?b" ]
          ~in_:[] ~where:[ Cli_primitive.V title_clause ] ()
      in
      expect_equal "datascript query with empty inputs"
        "[:find ?b :where [?b :block/title ?title]]" (edn with_empty_inputs);
      let with_multiple_clauses =
        Cli_primitive.make_datascript_query ~find:[ Edn_util.symbol "?b" ]
          ~where:[ Cli_primitive.V title_clause; Cli_primitive.V page_clause ]
          ()
      in
      expect_equal "datascript query with multiple where clauses"
        "[:find ?b :where [?b :block/title ?title] [?b :block/page ?page]]"
        (edn with_multiple_clauses);
      let with_list_clause =
        Cli_primitive.make_datascript_query
          ~find:[ Edn_util.symbol "?b"; Edn_util.symbol "?title" ]
          ~where:
            [
              Cli_primitive.V title_clause;
              Cli_primitive.L predicate_clause;
            ]
          ()
      in
      expect_equal "datascript query with list where clause"
        "[:find ?b ?title :where [?b :block/title ?title] (clojure.string/includes? ?title ?query)]"
        (edn with_list_clause));

  test
    "CLI parity query input normalization fills defaults and validates \
     required inputs" (fun () ->
      let entry =
        {
          Query.name = "custom";
          source = Query.Custom;
          doc = None;
          inputs =
            [
              { name = "?required"; optional = false; default = None };
              {
                name = "?optional";
                optional = true;
                default = Some (Edn_util.string "fallback");
              };
            ];
          query = Edn_util.vector [];
        }
      in
      expect_error_code "missing required input" ":invalid-options"
        (Query.normalize_inputs (Some entry) []);
      let inputs =
        expect_ok "normalize inputs"
          (Query.normalize_inputs (Some entry) [ Edn_util.string "value" ])
      in
      expect_int "input count" 2 (List.length inputs);
      expect_equal "default input" "fallback"
        (expect_some "default" (Edn_util.as_string (List.nth inputs 1)));
      let padded =
        {
          entry with
          Query.name = "padded";
          inputs =
            [
              { name = "required"; optional = false; default = None };
              { name = "?optional"; optional = true; default = None };
            ];
        }
      in
      let padded_inputs =
        expect_ok "pad optional input"
          (Query.normalize_inputs (Some padded) [ Edn_util.string "value" ])
      in
      expect_bool "optional input pads nil" true
        (Edn_util.is_null (List.nth padded_inputs 1));
      let task_search =
        expect_some "task-search entry"
          (Query.find_query (config ()) "task-search")
      in
      let task_inputs =
        expect_ok "task-search defaults"
          (Query.normalize_inputs (Some task_search)
             [ Edn_util.string "doing" ])
      in
      expect_equal "task status keyword" "logseq.property/status.doing"
        (expect_some "status keyword"
           (Edn_util.as_keyword (List.nth task_inputs 0)));
      expect_equal "task title default" ""
        (expect_some "title default"
           (Edn_util.as_string (List.nth task_inputs 1)));
      expect_int "task recent-days default" 0
        (expect_some "recent-days default"
           (Edn_util.as_int (List.nth task_inputs 2)));
      ignore
        (expect_some "task now-ms default"
           (Edn_util.as_int64 (List.nth task_inputs 3))));

  test "CLI parity query build action parses query inputs and named queries"
    (fun () ->
      let run =
        expect_ok "query run"
          (Query.build (config ~repo:"demo" ()) (Global_opts.create ())
             (Query.Parsed_run
                {
                  query_edn =
                    Some
                      "[:find ?e :in $ ?title :where [?e :block/title ?title]]";
                  name = None;
                  inputs_edn = Some "[\"Hello\"]";
                }))
      in
      (match run with
      | Query.Run { repo; graph; query; inputs; name } ->
          expect_equal "query repo" "logseq_db_demo"
            (Cli_primitive.string_of_repo repo);
          expect_equal "query graph" "demo"
            (Cli_primitive.string_of_graph graph);
          ignore (expect_ok "built query valid" (Query.validate_query query));
          expect_int "query inputs length" 1 (List.length inputs);
          expect_equal "query input" "Hello"
            (expect_some "query input string"
               (Edn_util.as_string (List.hd inputs)));
          expect_none "query name none" name
      | Query.List -> fail_test "expected query run");
      expect_error_code "query invalid edn" "invalid-options"
        (Query.build (config ~repo:"demo" ()) (Global_opts.create ())
           (Query.Parsed_run
              { query_edn = Some "[:find ?e"; name = None; inputs_edn = None }));
      expect_error_code "query invalid inputs edn" "invalid-options"
        (Query.build (config ~repo:"demo" ()) (Global_opts.create ())
           (Query.Parsed_run
              {
                query_edn = Some "[:find ?e :where [?e :block/title \"Hello\"]]";
                name = None;
                inputs_edn = Some "[\"Hello";
              }));
      let non_vector_inputs =
        Query.build (config ~repo:"demo" ()) (Global_opts.create ())
          (Query.Parsed_run
             {
               query_edn = None;
               name = Some "recent-updated";
               inputs_edn = Some "1";
             })
      in
      expect_error_code "query non-vector inputs" "invalid-options"
        non_vector_inputs;
      (match non_vector_inputs with
      | Error err ->
          expect_equal "query non-vector inputs message"
            "inputs must be a vector" err.Error.message
      | Ok _ -> fail_test "query non-vector inputs: expected error");
      expect_error_code "query rejects db/id datom" "invalid-query"
        (Query.build (config ~repo:"demo" ()) (Global_opts.create ())
           (Query.Parsed_run
              {
                query_edn =
                  Some
                    "[:find (pull ?v [*]) :where [?b :db/id 400] [?b \
                     :user.property/owner ?v]]";
                name = None;
                inputs_edn = None;
              }));
      expect_error_code "query requires repo" "missing-repo"
        (Query.build (config ()) (Global_opts.create ())
           (Query.Parsed_run
              {
                query_edn = Some "[:find ?e :where [?e :block/title]]";
                name = None;
                inputs_edn = None;
              }));
      let raw_config =
        Edn_util.map
          [
            ( Edn_util.keyword "custom-queries",
              Edn_util.map
                [
                  ( Edn_util.string "my-query",
                    Edn_util.map
                      [
                        (Edn_util.keyword "doc", Edn_util.string "Custom query");
                        ( Edn_util.keyword "inputs",
                          Edn_util.vector [ Edn_util.string "title" ] );
                        ( Edn_util.keyword "query",
                          edn_of_string
                            "[:find ?e :in $ ?title :where [?e :block/title \
                             ?title]]" );
                      ] );
                ] );
          ]
      in
      let named =
        expect_ok "named query"
          (Query.build
             (config ~repo:"demo" ~raw_file_config:raw_config ())
             (Global_opts.create ())
             (Query.Parsed_run
                {
                  query_edn = None;
                  name = Some ":my-query";
                  inputs_edn = Some "[\"Alpha\"]";
                }))
      in
      (match named with
      | Query.Run { inputs; name; _ } ->
          expect_equal "named query normalized" "my-query"
            (expect_some "named query name" name);
          expect_equal "named query input" "Alpha"
            (expect_some "named query input"
               (Edn_util.as_string (List.hd inputs)))
      | Query.List -> fail_test "expected named query run");
      expect_error_code "unknown named query" "unknown-query"
        (Query.build
           (config ~repo:"demo" ~raw_file_config:(Edn_util.map []) ())
           (Global_opts.create ())
           (Query.Parsed_run
              { query_edn = None; name = Some "missing"; inputs_edn = None }));
      expect_error_code "query name conflict" "invalid-options"
        (Query.build
           (config ~repo:"demo" ~raw_file_config:raw_config ())
           (Global_opts.create ())
           (Query.Parsed_run
              {
                query_edn = Some "[:find ?e]";
                name = Some "my-query";
                inputs_edn = None;
              })));

  test_promise "CLI parity query execute appends DSL rules for percent input"
    (fun () ->
      let raw_config =
        Edn_util.map
          [
            ( Edn_util.keyword "custom-queries",
              Edn_util.map
                [
                  ( Edn_util.string "task",
                    Edn_util.map
                      [
                        ( Edn_util.keyword "inputs",
                          Edn_util.vector
                            [ Edn_util.string "task statuses set" ] );
                        ( Edn_util.keyword "query",
                          edn_of_string
                            "[:find (pull ?b [*]) :in $ ?status % :where (task \
                             ?b ?status)]" );
                      ] );
                ] );
          ]
      in
      let cfg = config ~repo:"demo" ~raw_file_config:raw_config () in
      let action =
        expect_ok "task query build"
          (Query.build cfg (Global_opts.create ())
             (Query.Parsed_run
                {
                  query_edn = None;
                  name = Some "task";
                  inputs_edn = Some "[\"Todo\"]";
                }))
      in
      let captured_body = ref None in
      let server =
        invoke_server (fun body ->
            captured_body := Some body;
            "[]")
      in
      with_server server (fun base_url ->
          let cfg = { cfg with Cli_config.base_url = Some base_url } in
          let* result =
            effect_to_promise
              (execute_with_output Query.execute action cfg Output.Mode.Human)
          in
          expect_bool "query execute ok" false (Cli_result.is_error result);
          let body = expect_some "query request body" !captured_body in
          expect_named_contains "query method" body "thread-api/q";
          expect_named_contains "query input" body "Todo";
          expect_named_contains "rules parent" body "parent";
          expect_named_contains "rules class extends" body "class-extends";
          expect_named_contains "rules task" body "task";
          Js.Promise.resolve pass));

  test "CLI parity query list merges built-in and custom query metadata"
    (fun () ->
      let raw_config =
        Edn_util.map
          [
            ( Edn_util.keyword "custom-queries",
              Edn_util.map
                [
                  (Edn_util.string "custom-q", edn_of_string "[:find ?e]");
                  (Edn_util.string "block-search", edn_of_string "[:find ?b]");
                ] );
          ]
      in
      let queries =
        Query.list_queries (config ~raw_file_config:raw_config ())
      in
      let names =
        List.map (fun (entry : Query.query_entry) -> entry.name) queries
      in
      expect_bool "task-search built-in listed" true
        (List.mem "task-search" names);
      expect_bool "list-status built-in listed" true
        (List.mem "list-status" names);
      expect_bool "list-priority built-in listed" true
        (List.mem "list-priority" names);
      expect_bool "custom query listed" true (List.mem "custom-q" names);
      let block_search =
        expect_some "block-search override"
          (List.find_opt
             (fun (entry : Query.query_entry) -> entry.name = "block-search")
             queries)
      in
      expect_bool "block-search custom source" true
        (block_search.source = Query.Custom);
      let list_status =
        expect_some "list-status"
          (List.find_opt
             (fun (entry : Query.query_entry) -> entry.name = "list-status")
             queries)
      in
      expect_int "list-status inputs" 0 (List.length list_status.inputs);
      let status_query = Melange_edn.to_edn_string list_status.query in
      expect_named_contains "list-status query status keyword" status_query
        ":logseq.property/status";
      let list_priority =
        expect_some "list-priority"
          (List.find_opt
             (fun (entry : Query.query_entry) -> entry.name = "list-priority")
             queries)
      in
      expect_int "list-priority inputs" 0 (List.length list_priority.inputs);
      expect_named_contains "list-priority query priority keyword"
        (Melange_edn.to_edn_string list_priority.query)
        ":logseq.property/priority");

  test "CLI parity debug selector requires exactly one id uuid or ident"
    (fun () ->
      expect_error_code "missing selector" ":invalid-options"
        (Debug.resolve_selector { id = None; uuid = None; ident = None });
      let by_id =
        expect_ok "debug id"
          (Debug.resolve_selector { id = Some 9L; uuid = None; ident = None })
      in
      (match by_id with Debug.By_id 9L -> pass | _ -> fail_test "expected id");
      expect_error_code "ambiguous selector" ":invalid-options"
        (Debug.resolve_selector
           {
             id = Some 9L;
             uuid = Some "00000000-0000-4000-8000-000000000001";
             ident = None;
           });
      expect_error_code "bad uuid" ":invalid-options"
        (Debug.resolve_selector
           { id = None; uuid = Some "not-a-uuid"; ident = None }));

  test "CLI parity debug build action resolves id uuid ident and repo"
    (fun () ->
      let action =
        expect_ok "debug id build"
          (Debug.build (config ~repo:"demo" ()) (Global_opts.create ())
             (Debug.Parsed_pull { id = Some 42L; uuid = None; ident = None }))
      in
      (match action with
      | Debug.Debug_pull { repo; graph; lookup; selector } ->
          expect_equal "debug repo" "logseq_db_demo"
            (Cli_primitive.string_of_repo repo);
          expect_equal "debug graph" "demo"
            (Cli_primitive.string_of_graph graph);
          (match lookup with
          | Debug.By_id 42L -> pass
          | _ -> fail_test "expected debug id lookup");
          expect_equal "debug selector" "[*]"
            (Melange_edn.to_edn_string selector));
      let ident =
        expect_ok "debug ident option"
          (Debug.parse_ident_option ":logseq.class/Tag")
      in
      let ident_action =
        expect_ok "debug ident build"
          (Debug.build (config ~repo:"demo" ()) (Global_opts.create ())
             (Debug.Parsed_pull { id = None; uuid = None; ident = Some ident }))
      in
      (match ident_action with
      | Debug.Debug_pull { lookup = Debug.By_ident parsed_ident; _ } ->
          expect_equal "debug ident" "logseq.class/Tag"
            (Edn_util.keyword_to_string parsed_ident)
      | _ -> fail_test "expected ident lookup");
      expect_error_code "debug invalid ident" "invalid-options"
        (Debug.parse_ident_option "logseq.class/Tag");
      expect_error_code "debug requires repo" "missing-repo"
        (Debug.build (config ()) (Global_opts.create ())
           (Debug.Parsed_pull { id = Some 1L; uuid = None; ident = None })));

  test "CLI parity doctor build and filesystem checks report stable statuses"
    (fun () ->
      let missing_path = "/tmp/logseq-cli-missing-db-worker-node.js" in
      let missing =
        Doctor.check_db_worker_script
          (Doctor.Doctor { script_path = Some missing_path })
      in
      expect_equal "doctor missing script id" "db-worker-script"
        (Edn_util.keyword_to_string missing.id);
      expect_bool "doctor missing status" true (missing.status = Doctor.Error);
      expect_equal "doctor missing code" "doctor-script-missing"
        (Edn_util.keyword_to_string
           (expect_some "missing script code" missing.code));
      expect_equal "doctor missing path" missing_path
        (expect_some "missing script path" missing.path);
      let root = temp_dir "logseq-cli-parity-doctor-" in
      let script_path = Node.Path.join [| root; "db-worker-node.js" |] in
      try
        write_file script_path "console.log('ok');\n";
        let readable =
          Doctor.check_db_worker_script
            (Doctor.Doctor { script_path = Some script_path })
        in
        expect_bool "doctor readable script" true (readable.status = Doctor.Ok);
        expect_none "doctor readable script code" readable.code;
        let nested_root = Node.Path.join [| root; "nested-root" |] in
        let root_check =
          Doctor.check_root_dir (config ~root_dir:nested_root ())
        in
        expect_equal "doctor root id" "root-dir"
          (Edn_util.keyword_to_string root_check.id);
        expect_bool "doctor root ok" true (root_check.status = Doctor.Ok);
        expect_bool "doctor root created" true
          (Cli_unix.file_exists nested_root);
        (match
           Doctor.build (config ()) (Global_opts.create ())
             (Doctor.Parsed_doctor { dev_script = true })
         with
        | Ok (Doctor.Doctor { script_path = Some path }) ->
            expect_named_contains "doctor dev script" path "db-worker-node.js"
        | Ok (Doctor.Doctor { script_path = None }) ->
            fail_test "doctor dev script: expected script path"
        | Error err -> fail_test ("doctor build: " ^ err.Error.message));
        remove_tree root
      with exn ->
        remove_tree root;
        fail_test (Printexc.to_string exn));

  test "CLI parity command metadata keeps expected command ids and paths"
    (fun () ->
      expect_equal "graph list id" "graph-list"
        (Command_id.to_string Command_id.Graph_list);
      expect_bool "graph create write" true
        (Command_id.is_write Command_id.Graph_create);
      expect_bool "graph list read" false
        (Command_id.is_write Command_id.Graph_list);
      expect_bool "show requires graph" true
        (Command_id.requires_graph Command_id.Show);
      expect_bool "login does not require auth" false
        (Command_id.requires_auth Command_id.Login));

  test "CLI parity example selector returns matched commands and examples"
    (fun () ->
      let registry =
        Command_registry.make
          [
            {
              Command_registry.id = Command_id.Graph_list;
              path = [ "graph"; "list" ];
              doc = "List graphs";
              long_doc = None;
              examples = [ "logseq graph list" ];
              options = [];
              category = Command_registry.Graph_management;
              requires_graph = false;
              requires_auth = false;
              write_command = false;
            };
            {
              id = Command_id.Graph_create;
              path = [ "graph"; "create" ];
              doc = "Create graph";
              long_doc = None;
              examples = [ "logseq graph create --graph demo" ];
              options = [];
              category = Graph_management;
              requires_graph = true;
              requires_auth = false;
              write_command = true;
            };
          ]
      in
      let action =
        expect_ok "graph examples"
          (Example.resolve_selector registry [ "graph" ])
      in
      expect_equal "selector" "graph" action.selector;
      expect_int "matched commands" 2 (List.length action.matched_commands);
      expect_int "examples" 2 (List.length action.examples);
      expect_error_code "unknown selector" ":unknown-command"
        (Example.resolve_selector registry [ "sync" ]));

  test "CLI parity example selector reports missing and large example counts"
    (fun () ->
      let registry =
        Command_registry.make
          [
            {
              Command_registry.id = Command_id.Upsert_page;
              path = [ "upsert"; "page" ];
              doc = "Upsert page";
              long_doc = None;
              examples = [ "logseq upsert page --graph demo --page Home" ];
              options = [];
              category = Graph_inspect_and_edit;
              requires_graph = true;
              requires_auth = false;
              write_command = true;
            };
            {
              id = Command_id.Upsert_tag;
              path = [ "upsert"; "tag" ];
              doc = "Upsert tag";
              long_doc = None;
              examples = [];
              options = [];
              category = Graph_inspect_and_edit;
              requires_graph = true;
              requires_auth = false;
              write_command = true;
            };
          ]
      in
      expect_error_code "missing examples" "missing-examples"
        (Example.resolve_selector registry [ "upsert" ]);
      let large_registry =
        Command_registry.make
          [
            {
              Command_registry.id = Command_id.Upsert_page;
              path = [ "upsert"; "page" ];
              doc = "Upsert page";
              long_doc = None;
              examples =
                List.init 1234 (fun index ->
                    "logseq upsert page --graph demo --page Page-"
                    ^ string_of_int index);
              options = [];
              category = Graph_inspect_and_edit;
              requires_graph = true;
              requires_auth = false;
              write_command = true;
            };
          ]
      in
      let action =
        expect_ok "large example count"
          (Example.resolve_selector large_registry [ "upsert"; "page" ])
      in
      expect_equal "large example message"
        "Found 1,234 examples for selector upsert page" action.message);

  test "CLI parity task status normalization resolves available statuses"
    (fun () ->
      let values =
        [
          Edn_util.map
            [
              ( Edn_util.keyword "ident",
                Edn_util.keyword "logseq.property/status.todo" );
              (Edn_util.keyword "value", Edn_util.string "Todo");
            ];
          Edn_util.map
            [
              ( Edn_util.keyword "ident",
                Edn_util.keyword "logseq.property/status.done" );
              (Edn_util.keyword "value", Edn_util.string "Done");
            ];
        ]
      in
      let statuses = Task_status.normalize_available_statuses values in
      expect_int "status count" 2 (List.length statuses);
      expect_bool "resolve todo" true
        (Option.is_some (Task_status.resolve_status_ident "todo" statuses));
      expect_named_contains "invalid status message"
        (Task_status.invalid_status_message "bad" statuses)
        "Available values");

  test
    "CLI parity config graph repo conversion strips one leading db prefix only"
    (fun () ->
      expect_equal "repo to graph" "demo"
        (Cli_primitive.string_of_graph
           (Cli_config.repo_to_graph
              (Cli_primitive.create_repo "logseq_db_demo")));
      expect_equal "nested prefix graph" "logseq_db_other"
        (Cli_primitive.string_of_graph
           (Cli_config.repo_to_graph
              (Cli_primitive.create_repo "logseq_db_logseq_db_other"))));

  test
    "CLI parity parse covers graph backup import export and sync requirements"
    (fun () ->
      let backup =
        expect_parse_ok "backup restore"
          [
            "graph";
            "backup";
            "restore";
            "--src";
            "demo-nightly";
            "--dst";
            "demo-restored";
          ]
      in
      (match backup.command with
      | Cli_request.Graph (Graph.Parsed_backup_restore opts) ->
          expect_equal "backup src" "demo-nightly" opts.src;
          expect_equal "backup dst" "demo-restored"
            (Cli_primitive.string_of_graph opts.dst)
      | _ -> fail_test "expected backup restore");
      let export =
        expect_parse_ok "graph export"
          [
            "graph";
            "export";
            "--type";
            "edn";
            "--file";
            "/tmp/export.edn";
            "--edn-options";
            "{:export-type :graph :include-timestamps? true}";
            "--pretty-print";
          ]
      in
      (match export.command with
      | Cli_request.Graph (Graph.Parsed_export opts) ->
          expect_bool "export edn" true (opts.export_type = Graph.Edn);
          expect_equal "export file" "/tmp/export.edn"
            (expect_some "file" opts.file);
          expect_bool "pretty" true opts.pretty_print;
          expect_some "edn options" opts.edn_options |> ignore
      | _ -> fail_test "expected graph export");
      let export_aliases =
        expect_parse_ok "graph export aliases"
          [
            "graph";
            "export";
            "-t";
            "edn";
            "--file";
            "/tmp/export.edn";
            "-e";
            "{:export-type :graph}";
            "-p";
          ]
      in
      (match export_aliases.command with
      | Cli_request.Graph (Graph.Parsed_export opts) ->
          expect_bool "export alias edn" true (opts.export_type = Graph.Edn);
          expect_bool "export alias pretty" true opts.pretty_print;
          expect_some "export alias edn options" opts.edn_options |> ignore
      | _ -> fail_test "expected graph export");
      List.iter
        (fun flag ->
          expect_parse_error_code
            ("retired export option " ^ flag)
            ":invalid-options"
            [
              "graph";
              "export";
              "--type";
              "edn";
              "--file";
              "/tmp/export.edn";
              flag;
            ])
        [ "--include-timestamps"; "--exclude-built-in-pages" ];
      expect_parse_error_code "retired export option --exclude-namespaces"
        ":invalid-options"
        [
          "graph";
          "export";
          "--type";
          "edn";
          "--file";
          "/tmp/export.edn";
          "--exclude-namespaces";
          "journal";
        ];
      expect_parse_error_code "missing backup src" ":invalid-options"
        [ "graph"; "backup"; "restore"; "--dst"; "demo" ];
      expect_parse_error_code "bad sync config key" ":invalid-options"
        [ "sync"; "config"; "get"; "--key"; "graph" ]);

  test "CLI parity graph build validates graph selection and export contracts"
    (fun () ->
      let globals =
        Global_opts.create ~graph:(Cli_primitive.create_graph "demo") ()
      in
      expect_error_code "graph create requires explicit graph" "missing-graph"
        (Graph.build (config ()) (Global_opts.create ())
           (Graph.Parsed_create { enable_sync = false; e2ee_password = None }));
      expect_error_code "graph create password requires sync" "invalid-options"
        (Graph.build (config ()) globals
           (Graph.Parsed_create
              { enable_sync = false; e2ee_password = Some "pw" }));
      List.iter
        (fun graph_name ->
          expect_error_code
            ("reject graph name " ^ graph_name)
            "invalid-options"
            (Graph.build (config ())
               (Global_opts.create
                  ~graph:(Cli_primitive.create_graph graph_name)
                  ())
               (Graph.Parsed_create
                  { enable_sync = false; e2ee_password = None })))
        [ ""; "   "; "."; " .. " ];
      let create =
        expect_ok "graph create build"
          (Graph.build (config ()) globals
             (Graph.Parsed_create
                { enable_sync = true; e2ee_password = Some "pw" }))
      in
      (match create with
      | Graph.Graph_create { graph; repo; opts } ->
          expect_equal "create graph" "demo" (graph_text graph);
          expect_equal "create repo" "logseq_db_demo" (repo_text repo);
          expect_bool "create sync" true opts.enable_sync;
          expect_equal "create password" "pw"
            (expect_some "create password" opts.e2ee_password)
      | _ -> fail_test "expected Graph_create action");
      expect_error_code "export edn requires file" "invalid-options"
        (Graph.build (config ~graph:"demo" ()) (Global_opts.create ())
           (Graph.Parsed_export
              {
                export_type = Graph.Edn;
                file = None;
                edn_options = None;
                pretty_print = false;
                include_timestamps = false;
                exclude_built_in_pages = false;
                exclude_namespaces = [];
              }));
      expect_error_code "sqlite rejects edn options" "invalid-options"
        (Graph.build (config ~graph:"demo" ()) (Global_opts.create ())
           (Graph.Parsed_export
              {
                export_type = Graph.Sqlite;
                file = Some "/tmp/demo.sqlite";
                edn_options = Some (Edn_util.map []);
                pretty_print = false;
                include_timestamps = false;
                exclude_built_in_pages = false;
                exclude_namespaces = [];
              }));
      expect_error_code "export edn options must be map" "invalid-options"
        (Graph.build (config ~graph:"demo" ()) (Global_opts.create ())
           (Graph.Parsed_export
              {
                export_type = Graph.Edn;
                file = Some "/tmp/demo.edn";
                edn_options = Some (Edn_util.vector []);
                pretty_print = false;
                include_timestamps = false;
                exclude_built_in_pages = false;
                exclude_namespaces = [];
              }));
      let export =
        expect_ok "export edn build"
          (Graph.build (config ~graph:"demo" ()) (Global_opts.create ())
             (Graph.Parsed_export
                {
                  export_type = Graph.Edn;
                  file = Some "/tmp/demo.edn";
                  edn_options =
                    Some
                      (edn_of_string
                         "{:export-type :graph :include-timestamps? true}");
                  pretty_print = true;
                  include_timestamps = false;
                  exclude_built_in_pages = false;
                  exclude_namespaces = [];
                }))
      in
      match export with
      | Graph.Graph_export { graph; repo; opts } ->
          expect_equal "export graph" "demo" (graph_text graph);
          expect_equal "export repo" "logseq_db_demo" (repo_text repo);
          expect_bool "export type" true (opts.export_type = Graph.Edn);
          expect_equal "export file" "/tmp/demo.edn"
            (expect_some "export file" opts.file);
          expect_bool "export pretty" true opts.pretty_print;
          expect_some "export edn options" opts.edn_options |> ignore
      | _ -> fail_test "expected Graph_export action");

  test_promise "CLI parity graph validate result reports ok and error states"
    (fun () ->
      let run_validate response_transit assert_result =
        let server =
          invoke_server (fun body ->
              if Js.String.includes ~search:"thread-api/validate-db" body then
                response_transit
              else "null")
        in
        with_server server (fun base_url ->
            let repo = Cli_primitive.create_repo "demo" in
            let action =
              Graph.Graph_validate
                { graph = Cli_config.repo_to_graph repo; repo; fix = false }
            in
            let cfg =
              {
                (config ~repo:"demo" ()) with
                Cli_config.base_url = Some base_url;
              }
            in
            let* result =
              effect_to_promise
                (execute_with_output Graph.execute action cfg Output.Mode.Human)
            in
            assert_result result;
            Js.Promise.resolve pass)
      in
      let* () =
        run_validate
          "[\"^ \",\"~:errors\",[[\"^ \",\"~:entity\",[\"^ \
           \",\"~:db/id\",1],\"^0\",[\"^ \",\"~:foo\",[\"bad\"]]]]]"
          (fun invalid ->
            expect_bool "invalid graph status" true
              (Cli_result.is_error invalid);
            match invalid.Cli_result.error with
            | Some err ->
                expect_equal "validation error code" "graph-validation-failed"
                  (keyword_text err.Error.code);
                expect_named_contains "validation error count" err.message
                  "Found 1 entity with errors:"
            | None -> fail_test "expected graph validation error")
      in
      let* () =
        run_validate "[\"^ \",\"~:errors\",null,\"~:datom-count\",10]"
          (fun valid ->
            expect_bool "valid graph status" false (Cli_result.is_error valid);
            let data =
              expect_some "validation data" (Cli_result.data_value valid)
            in
            expect_bool "validation wraps result" true
              (Option.is_some (Edn_util.get data "result")))
      in
      Js.Promise.resolve pass);

  test_promise "CLI parity graph info queries kv rows with thread api q"
    (fun () ->
      let q_called = ref false in
      let server =
        invoke_server (fun body ->
            if Js.String.includes ~search:"thread-api/q" body then (
              q_called := true;
              expect_named_contains "graph info repo" body "logseq_db_demo";
              expect_named_contains "graph info query namespace" body
                "logseq.kv";
              "[[\"~:logseq.kv/schema-version\",7],[\"~:logseq.kv/graph-created-at\",40000],[\"~:logseq.kv/db-type\",\"~:sqlite\"]]")
            else "null")
      in
      with_server server (fun base_url ->
          let repo = Cli_primitive.create_repo "demo" in
          let action =
            Graph.Graph_info { graph = Cli_config.repo_to_graph repo; repo }
          in
          let cfg =
            {
              (config ~repo:"demo" ()) with
              Cli_config.base_url = Some base_url;
            }
          in
          let* result =
            effect_to_promise
              (execute_with_output Graph.execute action cfg Output.Mode.Edn)
          in
          expect_bool "graph info ok" false (Cli_result.is_error result);
          expect_bool "q called" true !q_called;
          let data =
            expect_some "graph info data" (Cli_result.data_value result)
          in
          expect_equal "graph info graph" "demo"
            (expect_some "graph" (Edn_util.get_string data "graph"));
          expect_int "schema version" 7
            (expect_some "schema"
               (Edn_util.get_int data "logseq.kv/schema-version"));
          expect_bool "kv map present" true
            (Option.is_some (Edn_util.get data "kv"));
          Js.Promise.resolve pass));

  test "CLI parity graph build normalizes backup and import actions" (fun () ->
      let selected = config ~graph:"demo" () in
      let backup =
        expect_ok "backup create"
          (Graph.build selected (Global_opts.create ())
             (Graph.Parsed_backup_create { name = Some " nightly " }))
      in
      (match backup with
      | Graph.Graph_backup_create { graph; repo; name; backup_name } ->
          expect_equal "backup graph" "demo" (graph_text graph);
          expect_equal "backup repo" "logseq_db_demo" (repo_text repo);
          expect_equal "backup label" "nightly" (expect_some "name" name);
          expect_named_contains "backup generated name"
            (expect_some "backup name" backup_name)
            "demo-nightly-"
      | _ -> fail_test "expected Graph_backup_create action");
      let restore =
        expect_ok "backup restore"
          (Graph.build selected (Global_opts.create ())
             (Graph.Parsed_backup_restore
                {
                  src = " nightly ";
                  dst = Cli_primitive.create_graph " restored ";
                }))
      in
      (match restore with
      | Graph.Graph_backup_restore
          { source_repo; source_graph; dst_repo; dst_graph; src; dst } ->
          expect_equal "restore source repo" "logseq_db_demo"
            (repo_text source_repo);
          expect_equal "restore source graph" "demo" (graph_text source_graph);
          expect_equal "restore dst repo" "logseq_db_restored"
            (repo_text dst_repo);
          expect_equal "restore dst graph" "restored" (graph_text dst_graph);
          expect_equal "restore src trim" "nightly" src;
          expect_equal "restore dst trim" "restored" dst
      | _ -> fail_test "expected Graph_backup_restore action");
      expect_error_code "backup restore blank dst" "missing-dst"
        (Graph.build selected (Global_opts.create ())
           (Graph.Parsed_backup_restore
              { src = "nightly"; dst = Cli_primitive.create_graph "   " }));
      let sqlite_import =
        expect_ok "sqlite import"
          (Graph.build selected (Global_opts.create ())
             (Graph.Parsed_import
                {
                  import_type = Graph.Import_sqlite;
                  input = "/tmp/demo.sqlite";
                }))
      in
      (match sqlite_import with
      | Graph.Graph_import { graph; repo; opts; require_missing_graph } ->
          expect_equal "sqlite import graph" "demo" (graph_text graph);
          expect_equal "sqlite import repo" "logseq_db_demo" (repo_text repo);
          expect_bool "sqlite import type" true
            (opts.import_type = Graph.Import_sqlite);
          expect_bool "sqlite requires missing" true require_missing_graph
      | _ -> fail_test "expected Graph_import sqlite action");
      let edn_import =
        expect_ok "edn import"
          (Graph.build selected (Global_opts.create ())
             (Graph.Parsed_import
                { import_type = Graph.Import_edn; input = "/tmp/demo.edn" }))
      in
      match edn_import with
      | Graph.Graph_import { opts; require_missing_graph; _ } ->
          expect_bool "edn import type" true
            (opts.import_type = Graph.Import_edn);
          expect_bool "edn does not require missing" false require_missing_graph
      | _ -> fail_test "expected Graph_import edn action");

  test_promise
    "CLI parity graph backup create invokes worker and writes metadata"
    (fun () ->
      let root = temp_dir "logseq-cli-backup-create-" in
      let invoke_calls = ref [] in
      let server =
        invoke_server (fun body ->
            invoke_calls := body :: !invoke_calls;
            if Js.String.includes ~search:"thread-api/backup-db-sqlite" body
            then (
              let tmp_path = invoke_arg_string body 1 in
              mkdir_p (Filename.dirname tmp_path);
              write_file tmp_path "sqlite-copy";
              "[\"^ \",\"~:ok\",true]")
            else "null")
      in
      with_server server (fun base_url ->
          let graph = Cli_primitive.create_graph "demo" in
          let repo = Cli_primitive.create_repo "demo" in
          let backup_name = "demo-nightly-20260101T000000Z" in
          let action =
            Graph.Graph_backup_create
              {
                graph;
                repo;
                name = Some "nightly";
                backup_name = Some backup_name;
              }
          in
          let cfg =
            {
              (config ~repo:"demo" ~root_dir:root ()) with
              Cli_config.base_url = Some base_url;
            }
          in
          let* result =
            effect_to_promise
              (execute_with_output Graph.execute action cfg Output.Mode.Edn)
          in
          let backup_dir =
            Node.Path.join [| root; "graphs"; "demo"; "backup"; backup_name |]
          in
          let db_path = Node.Path.join [| backup_dir; "db.sqlite" |] in
          let metadata_path = Node.Path.join [| backup_dir; "metadata.edn" |] in
          expect_bool "backup create ok" false (Cli_result.is_error result);
          expect_int "backup invoke count" 1 (List.length !invoke_calls);
          expect_equal "backup method repo" "logseq_db_demo"
            (invoke_arg_string (List.hd !invoke_calls) 0);
          expect_equal "final sqlite payload" "sqlite-copy" (read_file db_path);
          let data =
            expect_some "backup create data" (Cli_result.data_value result)
          in
          expect_equal "backup result name" backup_name
            (expect_some "backup-name" (Edn_util.get_string data "backup-name"));
          expect_equal "backup result path" db_path
            (expect_some "path" (Edn_util.get_string data "path"));
          let metadata = edn_of_string (read_file metadata_path) in
          expect_equal "metadata source" "cli"
            (expect_some "metadata source"
               (Edn_util.get_string metadata "source"));
          expect_equal "metadata name" backup_name
            (expect_some "metadata name" (Edn_util.get_string metadata "name"));
          remove_tree root;
          Js.Promise.resolve pass));

  test_promise
    "CLI parity graph backup create cleans reserved target after worker failure"
    (fun () ->
      let root = temp_dir "logseq-cli-backup-create-cleanup-" in
      let backup_name = "demo-failure" in
      let backup_dir =
        Node.Path.join [| root; "graphs"; "demo"; "backup"; backup_name |]
      in
      let server =
        invoke_server (fun body ->
            if Js.String.includes ~search:"thread-api/backup-db-sqlite" body
            then failwith "snapshot failed"
            else "null")
      in
      Js.Promise.make (fun ~resolve ~reject ->
          server_listen server 0 "127.0.0.1" (fun[@u] () ->
              let port = (server_address server)##port in
              let base_url = Printf.sprintf "http://127.0.0.1:%d" port in
              let resolve_after_close () =
                server_close server (fun[@u] () -> (resolve pass [@u]))
              in
              let reject_after_close message =
                server_close server (fun[@u] () ->
                    (reject (Failure message) [@u]))
              in
              let close_and_fail message =
                remove_tree root;
                reject_after_close message
              in
              let action =
                Graph.Graph_backup_create
                  {
                    graph = Cli_primitive.create_graph "demo";
                    repo = Cli_primitive.create_repo "demo";
                    name = None;
                    backup_name = Some backup_name;
                  }
              in
              let cfg =
                {
                  (config ~repo:"demo" ~root_dir:root ()) with
                  Cli_config.base_url = Some base_url;
                }
              in
              Cli_effect.on_any
                (execute_with_output Graph.execute action cfg Output.Mode.Human)
                (fun result ->
                  if not (Cli_result.is_error result) then
                    close_and_fail "expected backup create error result"
                  else
                    let target_exists = Node.Fs.existsSync backup_dir in
                    if target_exists then
                      close_and_fail
                        "reserved backup target removed: expected false, got \
                         true"
                    else (
                      remove_tree root;
                      resolve_after_close ()))
                (fun exn ->
                  let target_exists = Node.Fs.existsSync backup_dir in
                  if target_exists then
                    close_and_fail
                      "reserved backup target removed: expected false, got true"
                  else (
                    remove_tree root;
                    reject_after_close (Printexc.to_string exn))))));

  test_promise
    "CLI parity graph backup list restore and remove use scoped backup dirs"
    (fun () ->
      let root = temp_dir "logseq-cli-backup-flow-" in
      let demo_backup =
        Node.Path.join
          [| root; "graphs"; "demo"; "backup"; "demo-nightly"; "db.sqlite" |]
      in
      let other_backup =
        Node.Path.join
          [| root; "graphs"; "other"; "backup"; "other-nightly"; "db.sqlite" |]
      in
      mkdir_p (Filename.dirname demo_backup);
      mkdir_p (Filename.dirname other_backup);
      write_file demo_backup "demo";
      write_file other_backup "other";
      let calls = ref [] in
      let server =
        invoke_server (fun body ->
            calls := body :: !calls;
            if Js.String.includes ~search:"thread-api/import-db-binary" body
            then "[\"^ \",\"~:ok\",true]"
            else "null")
      in
      with_server server (fun base_url ->
          let graph = Cli_primitive.create_graph "demo" in
          let repo = Cli_primitive.create_repo "demo" in
          let cfg =
            {
              (config ~repo:"demo" ~root_dir:root ()) with
              Cli_config.base_url = Some base_url;
            }
          in
          let* list_result =
            effect_to_promise
              (execute_with_output Graph.execute
                 (Graph.Graph_backup_list { graph; repo })
                 cfg Output.Mode.Edn)
          in
          let backups =
            expect_some "backups"
              (Option.bind
                 (Option.bind (Cli_result.data_value list_result) (fun data ->
                      Edn_util.get data "backups"))
                 Edn_util.as_seq)
          in
          expect_int "only current graph backups" 1 (List.length backups);
          expect_equal "backup name" "demo-nightly"
            (expect_some "backup name"
               (Edn_util.get_string (List.hd backups) "name"));
          let* missing_restore =
            effect_to_promise
              (execute_with_output Graph.execute
                 (Graph.Graph_backup_restore
                    {
                      source_repo = repo;
                      source_graph = graph;
                      dst_repo = Cli_primitive.create_repo "restored";
                      dst_graph = Cli_primitive.create_graph "restored";
                      src = "missing";
                      dst = "restored";
                    })
                 cfg Output.Mode.Human)
          in
          expect_bool "missing restore is error" true
            (Cli_result.is_error missing_restore);
          (match missing_restore.Cli_result.error with
          | Some err ->
              expect_equal "missing restore code" "backup-not-found"
                (keyword_text err.Error.code)
          | None -> fail_test "expected missing restore error");
          let* restore_result =
            effect_to_promise
              (execute_with_output Graph.execute
                 (Graph.Graph_backup_restore
                    {
                      source_repo = repo;
                      source_graph = graph;
                      dst_repo = Cli_primitive.create_repo "restored";
                      dst_graph = Cli_primitive.create_graph "restored";
                      src = "demo-nightly";
                      dst = "restored";
                    })
                 cfg Output.Mode.Edn)
          in
          expect_bool "restore ok" false (Cli_result.is_error restore_result);
          expect_bool "restore invokes import" true
            (List.exists
               (fun body ->
                 Js.String.includes ~search:"thread-api/import-db-binary" body)
               !calls);
          let* missing_remove =
            effect_to_promise
              (execute_with_output Graph.execute
                 (Graph.Graph_backup_remove
                    { graph; repo; src = "missing-nightly" })
                 cfg Output.Mode.Human)
          in
          expect_bool "missing remove is error" true
            (Cli_result.is_error missing_remove);
          let* remove_result =
            effect_to_promise
              (execute_with_output Graph.execute
                 (Graph.Graph_backup_remove
                    { graph; repo; src = "demo-nightly" })
                 cfg Output.Mode.Human)
          in
          expect_bool "remove ok" false (Cli_result.is_error remove_result);
          expect_bool "backup dir removed" false
            (Node.Fs.existsSync (Filename.dirname demo_backup));
          remove_tree root;
          Js.Promise.resolve pass));

  test_promise
    "CLI parity graph export and import execute through transport and files"
    (fun () ->
      let root = temp_dir "logseq-cli-graph-io-" in
      let edn_export = Node.Path.join [| root; "export.edn" |] in
      let import_edn = Node.Path.join [| root; "import.edn" |] in
      let import_sqlite = Node.Path.join [| root; "import.sqlite" |] in
      write_file import_edn "{:page \"Import Page\"}";
      write_file import_sqlite "sqlite";
      let calls = ref [] in
      let server =
        invoke_server (fun body ->
            calls := body :: !calls;
            if Js.String.includes ~search:"thread-api/backup-db-sqlite" body
            then (
              let path = invoke_arg_string body 1 in
              mkdir_p (Filename.dirname path);
              write_file path "sqlite-copy";
              "[\"^ \",\"~:ok\",true]")
            else if Js.String.includes ~search:"thread-api/export-edn" body then
              "[\"^ \",\"~:exported\",true]"
            else if Js.String.includes ~search:"thread-api/import-edn" body then
              "[\"^ \",\"~:ok\",true]"
            else if
              Js.String.includes ~search:"thread-api/import-db-binary" body
            then "[\"^ \",\"~:ok\",true]"
            else "null")
      in
      with_server server (fun base_url ->
          let graph = Cli_primitive.create_graph "demo" in
          let repo = Cli_primitive.create_repo "demo" in
          let cfg =
            {
              (config ~repo:"demo" ~root_dir:root ()) with
              Cli_config.base_url = Some base_url;
            }
          in
          let edn_opts =
            {
              Graph.export_type = Graph.Edn;
              file = Some edn_export;
              edn_options =
                Some
                  (edn_of_string
                     "{:export-type :graph :include-timestamps? true}");
              pretty_print = true;
              include_timestamps = false;
              exclude_built_in_pages = false;
              exclude_namespaces = [];
            }
          in
          let sqlite_opts =
            {
              Graph.export_type = Graph.Sqlite;
              file = None;
              edn_options = None;
              pretty_print = false;
              include_timestamps = false;
              exclude_built_in_pages = false;
              exclude_namespaces = [];
            }
          in
          let* edn_result =
            effect_to_promise
              (execute_with_output Graph.execute
                 (Graph.Graph_export { graph; repo; opts = edn_opts })
                 cfg Output.Mode.Edn)
          in
          expect_bool "edn export ok" false (Cli_result.is_error edn_result);
          expect_named_contains "export file content" (read_file edn_export)
            ":exported true";
          expect_named_contains "pretty export writes multiline edn"
            (read_file edn_export) "\n";
          let* sqlite_result =
            effect_to_promise
              (execute_with_output Graph.execute
                 (Graph.Graph_export { graph; repo; opts = sqlite_opts })
                 cfg Output.Mode.Human)
          in
          expect_bool "sqlite export ok" false
            (Cli_result.is_error sqlite_result);
          let sqlite_path = invoke_arg_string (List.hd !calls) 1 in
          expect_named_contains "default sqlite export path" sqlite_path
            (Node.Path.join [| root; "graphs"; "demo"; "export"; "demo_" |]);
          expect_bool "default sqlite export suffix" true
            (Js.String.endsWith ~suffix:".sqlite" sqlite_path);
          let* import_edn_result =
            effect_to_promise
              (execute_with_output Graph.execute
                 (Graph.Graph_import
                    {
                      graph;
                      repo;
                      opts =
                        {
                          Graph.import_type = Graph.Import_edn;
                          input = import_edn;
                        };
                      require_missing_graph = false;
                    })
                 cfg Output.Mode.Edn)
          in
          expect_bool "edn import ok" false
            (Cli_result.is_error import_edn_result);
          let* import_sqlite_result =
            effect_to_promise
              (execute_with_output Graph.execute
                 (Graph.Graph_import
                    {
                      graph;
                      repo;
                      opts =
                        {
                          Graph.import_type = Graph.Import_sqlite;
                          input = import_sqlite;
                        };
                      require_missing_graph = true;
                    })
                 cfg Output.Mode.Edn)
          in
          expect_bool "sqlite import ok" false
            (Cli_result.is_error import_sqlite_result);
          let joined = String.concat "\n" !calls in
          expect_named_contains "export edn invoked" joined
            "thread-api/export-edn";
          expect_named_contains "sqlite export invoked" joined
            "thread-api/backup-db-sqlite";
          expect_named_contains "import edn invoked" joined
            "thread-api/import-edn";
          expect_named_contains "import sqlite invoked" joined
            "thread-api/import-db-binary";
          remove_tree root;
          Js.Promise.resolve pass));

  test "CLI parity top-level graph constraints reject existing sqlite imports"
    (fun () ->
      let root = temp_dir "logseq-cli-graph-constraints-" in
      let graph_dir = Node.Path.join [| root; "graphs"; "demo" |] in
      let sqlite_path = Node.Path.join [| root; "input.sqlite" |] in
      mkdir_p graph_dir;
      write_file sqlite_path "sqlite";
      let output =
        run_cli_lifecycle
          [
            "--root-dir";
            root;
            "--graph";
            "demo";
            "graph";
            "import";
            "--type";
            "sqlite";
            "--input";
            sqlite_path;
          ]
      in
      expect_int "existing sqlite import exit" 1 output.exit_code;
      expect_named_contains "existing sqlite import code"
        (stdout_text "existing sqlite import stdout" output)
        "graph-exists";
      remove_tree root);

  test "CLI parity errors are printed to stdout with non-zero exit" (fun () ->
      let result = spawn_cli [ "list"; "page"; "--limit"; "nope" ] in
      ignore (expect_exit_non_zero "bad list limit" result);
      expect_named_contains "error code" result##stdout "invalid-options";
      expect_named_contains "error message" result##stdout "Expected integer");

  test "CLI parity main version output includes build metadata" (fun () ->
      let output = run_cli_lifecycle [ "--version" ] in
      expect_int "version exit" 0 output.exit_code;
      let stdout = stdout_text "version stdout" output in
      expect_named_contains "version build time" stdout "Build time: ";
      expect_named_contains "version revision" stdout "Revision: ";
      expect_bool "profile disabled" true (output.stderr = []));

  test "CLI parity version action output includes build metadata" (fun () ->
      let result =
        effect_result "version action"
          (execute_with_output Cli_action.execute Cli_action.Version (config ())
             Output.Mode.Human)
      in
      let output = Format_types.format_result result (config ()) in
      expect_named_contains "version action build time" output "Build time: ";
      expect_named_contains "version action revision" output "Revision: ");

  test "CLI parity main structured help respects output modes" (fun () ->
      let json_output = run_cli_lifecycle [ "--output"; "json"; "--help" ] in
      expect_int "json help exit" 0 json_output.exit_code;
      let json_stdout = stdout_text "json help stdout" json_output in
      expect_valid_json "json help output" json_stdout;
      expect_named_contains "json help status" json_stdout "\"status\":\"ok\"";
      expect_named_contains "json help message" json_stdout "Usage: logseq";
      let edn_output = run_cli_lifecycle [ "--output"; "edn"; "--help" ] in
      expect_int "edn help exit" 0 edn_output.exit_code;
      let edn_stdout = stdout_text "edn help stdout" edn_output in
      expect_valid_edn "edn help output" edn_stdout;
      expect_named_contains "edn help status" edn_stdout ":status :ok";
      expect_named_contains "edn help message" edn_stdout "Usage: logseq");

  test "CLI parity main structured parse errors respect output modes" (fun () ->
      let json_output = run_cli_lifecycle [ "--output"; "json"; "wat" ] in
      expect_int "json parse exit" 1 json_output.exit_code;
      let json_stdout = stdout_text "json parse stdout" json_output in
      expect_valid_json "json parse error output" json_stdout;
      expect_named_contains "json parse error status" json_stdout
        "\"status\":\"error\"";
      expect_named_contains "json parse error message" json_stdout "\"message\"";
      let edn_output = run_cli_lifecycle [ "--output"; "edn"; "wat" ] in
      expect_int "edn parse exit" 1 edn_output.exit_code;
      let edn_stdout = stdout_text "edn parse stdout" edn_output in
      expect_valid_edn "edn parse error output" edn_stdout;
      expect_named_contains "edn parse error status" edn_stdout ":status :error";
      expect_named_contains "edn parse error message" edn_stdout ":message");

  test "CLI parity main profile lines are emitted for version" (fun () ->
      let output = run_cli_lifecycle [ "--profile"; "--version" ] in
      expect_int "profile version exit" 0 output.exit_code;
      let stdout = stdout_text "profile version stdout" output in
      expect_named_contains "profile version build time" stdout "Build time: ";
      let profile = String.concat "\n" output.stderr in
      expect_named_contains "profile version headline" profile
        "command=version status=ok";
      expect_named_contains "profile version stages" profile "stages";
      expect_named_contains "profile version parse stage" profile
        "cli.parse-args";
      expect_named_contains "profile version total stage" profile "cli.total");

  test "CLI parity main profile lines are disabled by default" (fun () ->
      let output = run_cli_lifecycle [ "--help" ] in
      expect_int "help exit" 0 output.exit_code;
      expect_bool "no profile lines" true (output.stderr = []));

  test "CLI parity command help includes primary and secondary command groups"
    (fun () ->
      let output = run_cli [ "--help" ] in
      expect_named_contains "graph command" output "graph list";
      expect_named_contains "upsert command" output "upsert block";
      expect_named_contains "sync command" output "sync upload";
      expect_named_contains "skill command" output "skill show";
      expect_named_not_contains "retired qmd" output "qmd");

  test "CLI parity group help surfaces subcommands without option suffix"
    (fun () ->
      let list_help = run_cli [ "list" ] in
      expect_named_contains "list usage" list_help
        "Usage: logseq list <subcommand> [options]";
      expect_named_contains "list page command" list_help "list page";
      expect_named_contains "list asset command" list_help "list asset";
      expect_named_not_contains "list command options suffix" list_help
        "list page [options]";
      let backup_help = run_cli [ "graph"; "backup" ] in
      expect_named_contains "backup usage" backup_help
        "Usage: logseq graph backup <subcommand> [options]";
      expect_named_contains "backup list command" backup_help
        "graph backup list";
      expect_named_contains "backup restore command" backup_help
        "graph backup restore";
      let query_help = run_cli [ "query"; "-h" ] in
      expect_named_contains "query option" query_help "--query";
      expect_named_contains "query name" query_help "--name";
      expect_named_contains "query inputs" query_help "--inputs");

  test "CLI parity command help includes registry examples" (fun () ->
      let remove_help = run_cli [ "remove"; "block"; "--help" ] in
      expect_named_contains "remove block usage" remove_help
        "Usage: logseq remove block";
      expect_named_contains "remove block options" remove_help
        "Command options:";
      expect_named_contains "remove block examples" remove_help "Examples:";
      let upsert_help = run_cli [ "upsert"; "block"; "--help" ] in
      expect_named_contains "upsert block usage" upsert_help
        "Usage: logseq upsert block";
      expect_named_contains "upsert block examples" upsert_help "Examples:";
      let example_help = run_cli [ "example"; "upsert"; "--help" ] in
      expect_named_contains "example upsert usage" example_help
        "Usage: logseq example upsert";
      expect_named_not_contains "example upsert group has no examples"
        example_help "Examples:");

  test
    "CLI parity structured example output keeps selector matched commands and \
     message" (fun () ->
      let result = spawn_cli [ "--output"; "json"; "example"; "upsert" ] in
      ignore (expect_exit_zero "example upsert json" result);
      expect_named_contains "selector" result##stdout "\"selector\":\"upsert\"";
      expect_named_contains "matched command" result##stdout "upsert block";
      expect_named_contains "message" result##stdout "Found");

  test "CLI parity show validation rejects ambiguous targets" (fun () ->
      expect_error_code "show id uuid" "invalid-options"
        (Show.validate_parsed
           (Show.Parsed_show
              {
                id_raw = Some "1";
                uuid = Some "00000000-0000-4000-8000-000000000001";
                page = None;
                page_hierarchy = false;
                linked_references = None;
                ref_id_footer = None;
                level = None;
                stdin_id = None;
              }));
      let result =
        spawn_cli [ "--graph"; "demo"; "show"; "--id"; "1"; "--page"; "Home" ]
      in
      ignore (expect_exit_non_zero "show ambiguous cli" result);
      expect_named_contains "show ambiguous message" result##stdout
        "only one of --id, --uuid, or --page is allowed");

  test "CLI parity completion command parses shell argument and validation"
    (fun () ->
      let positional =
        expect_parse_ok "completion positional" [ "completion"; "zsh" ]
      in
      (match positional.command with
      | Cli_request.Completion
          (Completion.Parsed_completion { shell = Some Cli_primitive.Zsh }) ->
          pass
      | _ -> fail_test "expected zsh completion request");
      let option =
        expect_parse_ok "completion option" [ "completion"; "--shell"; "bash" ]
      in
      (match option.command with
      | Cli_request.Completion
          (Completion.Parsed_completion { shell = Some Cli_primitive.Bash }) ->
          pass
      | _ -> fail_test "expected bash completion request");
      expect_parse_error_code "completion missing shell" ":invalid-options"
        [ "completion" ];
      expect_parse_error_code "completion unsupported shell" ":invalid-options"
        [ "completion"; "fish" ]);

  test "CLI parity completion generation includes top nested and value cases"
    (fun () ->
      let registry = (Cli.make_app_context ()).Cli.registry in
      let zsh = Completion.generate Cli_primitive.Zsh registry in
      expect_named_contains "zsh header" zsh "#compdef logseq";
      expect_named_contains "zsh graph group" zsh "_logseq_graph()";
      expect_named_contains "zsh nested backup" zsh "_logseq_graph_backup()";
      expect_named_contains "zsh graph completions" zsh "_logseq_graphs";
      expect_named_contains "zsh output choices" zsh
        "--output=[Output format]:value:(human json edn)";
      let bash = Completion.generate Cli_primitive.Bash registry in
      expect_named_contains "bash header" bash
        "# Auto-generated by `logseq completion bash`";
      expect_named_contains "bash graph command" bash " graph ";
      expect_named_contains "bash upsert command" bash " upsert";
      expect_named_contains "bash search command" bash " search ";
      expect_named_contains "bash nested backup case" bash "graph:backup";
      expect_named_contains "bash graph names" bash "_logseq_json_names_bash");

  test "CLI parity completion generation keeps current dynamic helper surface"
    (fun () ->
      let registry = (Cli.make_app_context ()).Cli.registry in
      let zsh = Completion.generate Cli_primitive.Zsh registry in
      expect_named_contains "zsh graph helper" zsh "_logseq_graphs";
      expect_named_not_contains "zsh page helper removed" zsh "_logseq_pages";
      expect_named_not_contains "zsh query helper removed" zsh "_logseq_queries";
      expect_named_not_contains "zsh current graph helper removed" zsh
        "_logseq_current_graph";
      let bash = Completion.generate Cli_primitive.Bash registry in
      expect_named_not_contains "bash page helper removed" bash
        "_logseq_pages_bash";
      expect_named_not_contains "bash query helper removed" bash
        "_logseq_queries_bash";
      expect_named_contains "bash json name helper" bash
        "_logseq_json_names_bash";
      expect_named_not_contains "bash current graph helper removed" bash
        "_logseq_current_graph_bash");

  test "CLI parity zsh completion keeps current global option contracts"
    (fun () ->
      let registry = (Cli.make_app_context ()).Cli.registry in
      let zsh = Completion.generate Cli_primitive.Zsh registry in
      expect_named_contains "zsh top dispatcher" zsh "_logseq()";
      expect_named_contains "zsh graph helper" zsh "_logseq_graphs";
      expect_named_contains "zsh global output option" zsh
        "--output=[Output format]:value:(human json edn)";
      expect_named_not_contains "zsh graph export edn options removed" zsh
        "--edn-options";
      expect_named_not_contains "zsh graph create sync option removed" zsh
        "--enable-sync";
      expect_named_not_contains "zsh search content option removed" zsh
        "--content";
      expect_named_not_contains "zsh content short alias removed" zsh "-c[";
      expect_named_not_contains "zsh command boolean negation removed" zsh
        "--no-include-built-in";
      expect_named_not_contains "zsh global boolean negation" zsh "--no-verbose";
      expect_named_not_contains "zsh multi value helper removed" zsh
        "_logseq_multi_values");

  test "CLI parity bash completion keeps current global option contracts"
    (fun () ->
      let registry = (Cli.make_app_context ()).Cli.registry in
      let bash = Completion.generate Cli_primitive.Bash registry in
      expect_named_contains "bash global opts helper" bash "_logseq_opts_for";
      expect_named_contains "bash global options" bash
        "--help -h --version --config --graph -g --root-dir --timeout-ms \
         --output -o --verbose -v --profile";
      expect_named_not_contains "bash graph export edn options removed" bash
        "--edn-options";
      expect_named_not_contains "bash search content option removed" bash
        "--content -c";
      expect_named_not_contains "bash command boolean negation removed" bash
        "--no-include-built-in";
      expect_named_not_contains "bash global boolean negation" bash
        "--no-verbose";
      expect_named_not_contains "bash multi value helper removed" bash
        "_logseq_multi_values_bash";
      expect_named_not_contains "bash enum whitespace helper removed" bash
        "_logseq_enum_values_bash");

  test "CLI parity command registry fills catalog options for known paths"
    (fun () ->
      let registry = (Cli.make_app_context ()).Cli.registry in
      let has_name name (option : Command_registry.option_meta) =
        List.mem name option.names
      in
      let option_by_name name options = List.find_opt (has_name name) options in
      let output_option =
        expect_some "global output option"
          (option_by_name "--output" Command_registry.global_options)
      in
      expect_bool "global output has -o alias" true
        (has_name "-o" output_option);
      expect_equal "global output default" "human"
        (expect_some "output default" output_option.default);
      expect_bool "global output choices" true
        (output_option.choices = [ "human"; "json"; "edn" ]);
      let graph_option =
        expect_some "global graph option"
          (option_by_name "--graph" Command_registry.global_options)
      in
      expect_bool "global graph has -g alias" true (has_name "-g" graph_option);
      let profile_option =
        expect_some "global profile option"
          (option_by_name "--profile" Command_registry.global_options)
      in
      expect_bool "profile is flag" true
        (profile_option.arity = Command_registry.Flag);
      let completion =
        expect_some "completion command"
          (Command_registry.find_by_path [ "completion" ] registry)
      in
      expect_bool "completion shell choices" true
        (List.exists
           (fun (option : Command_registry.option_meta) ->
             option.names = [ "--shell" ] && option.choices = [ "zsh"; "bash" ])
           completion.Command_registry.options);
      let graph_create =
        expect_some "graph create"
          (Command_registry.find_by_path [ "graph"; "create" ] registry)
      in
      expect_bool "graph create enable sync" true
        (Option.is_some (option_by_name "--enable-sync" graph_create.options));
      expect_bool "graph create password" true
        (Option.is_some (option_by_name "--e2ee-password" graph_create.options));
      let graph_export =
        expect_some "graph export"
          (Command_registry.find_by_path [ "graph"; "export" ] registry)
      in
      let export_type =
        expect_some "export type option"
          (option_by_name "--type" graph_export.options)
      in
      expect_bool "export type choices" true
        (export_type.choices = [ "edn"; "sqlite" ]);
      expect_bool "export edn options" true
        (Option.is_some (option_by_name "--edn-options" graph_export.options));
      expect_bool "export edn options alias" true
        (Option.is_some (option_by_name "-e" graph_export.options));
      expect_bool "export pretty print" true
        (Option.is_some (option_by_name "--pretty-print" graph_export.options));
      expect_bool "export pretty print alias" true
        (Option.is_some (option_by_name "-p" graph_export.options));
      expect_bool "export timestamps retired" true
        (Option.is_none
           (option_by_name "--include-timestamps" graph_export.options));
      expect_bool "export built-ins retired" true
        (Option.is_none
           (option_by_name "--exclude-built-in-pages" graph_export.options));
      expect_bool "export namespaces retired" true
        (Option.is_none
           (option_by_name "--exclude-namespaces" graph_export.options));
      let graph_import =
        expect_some "graph import"
          (Command_registry.find_by_path [ "graph"; "import" ] registry)
      in
      let import_input =
        expect_some "import input option"
          (option_by_name "--input" graph_import.options)
      in
      expect_bool "import input required" true import_input.required;
      let list_page =
        expect_some "list page"
          (Command_registry.find_by_path [ "list"; "page" ] registry)
      in
      let page_sort =
        expect_some "page sort option"
          (option_by_name "--sort" list_page.options)
      in
      expect_bool "page sort has title" true
        (List.mem "title" page_sort.choices);
      let page_order =
        expect_some "page order option"
          (option_by_name "--order" list_page.options)
      in
      expect_bool "page order choices" true
        (page_order.choices = [ "asc"; "desc" ]);
      let list_tag =
        expect_some "list tag"
          (Command_registry.find_by_path [ "list"; "tag" ] registry)
      in
      let tag_fields =
        expect_some "tag fields option"
          (option_by_name "--fields" list_tag.options)
      in
      expect_bool "tag fields include title" true
        (List.mem "title" tag_fields.choices);
      expect_bool "tag fields include uuid" true
        (List.mem "uuid" tag_fields.choices);
      let show =
        expect_some "show command"
          (Command_registry.find_by_path [ "show" ] registry)
      in
      expect_bool "show page option" true
        (Option.is_some (option_by_name "--page" show.options));
      let upsert_block =
        expect_some "upsert block"
          (Command_registry.find_by_path [ "upsert"; "block" ] registry)
      in
      let block_pos =
        expect_some "block pos option"
          (option_by_name "--pos" upsert_block.options)
      in
      expect_bool "block pos choices" true
        (block_pos.choices = [ "first-child"; "last-child"; "sibling" ]);
      let task =
        expect_some "upsert task"
          (Command_registry.find_by_path [ "upsert"; "task" ] registry)
      in
      expect_bool "task status option" true
        (List.exists
           (fun (option : Command_registry.option_meta) ->
             option.names = [ "--status" ])
           task.options);
      expect_bool "task clear status option" true
        (List.exists
           (fun (option : Command_registry.option_meta) ->
             option.names = [ "--no-status" ])
           task.options);
      let property =
        expect_some "upsert property"
          (Command_registry.find_by_path [ "upsert"; "property" ] registry)
      in
      expect_bool "property type choices" true
        (List.exists
           (fun (option : Command_registry.option_meta) ->
             option.names = [ "--type" ]
             && List.mem "default" option.choices
             && List.mem "checkbox" option.choices)
           property.options);
      let query =
        expect_some "query command"
          (Command_registry.find_by_path [ "query" ] registry)
      in
      let query_list =
        expect_some "query list command"
          (Command_registry.find_by_path [ "query"; "list" ] registry)
      in
      expect_bool "query examples metadata" true (query.examples <> []);
      expect_bool "query name option" true
        (Option.is_some (option_by_name "--name" query.options));
      expect_bool "query list examples metadata" true (query_list.examples <> []);
      let search_block =
        expect_some "search block"
          (Command_registry.find_by_path [ "search"; "block" ] registry)
      in
      let search_content =
        expect_some "search content option"
          (option_by_name "--content" search_block.options)
      in
      expect_equal "search content doc" "Content search text" search_content.doc);

  test "CLI parity command registry help renders command and option details"
    (fun () ->
      let registry = (Cli.make_app_context ()).Cli.registry in
      let top_help = Command_registry.render_help registry in
      expect_named_contains "top commands heading" top_help
        "Available commands:";
      expect_named_contains "skill show command" top_help "skill show";
      expect_named_contains "completion command" top_help "completion";
      let upsert_help =
        Command_registry.render_help ~group:[ "upsert"; "task" ] registry
      in
      expect_named_contains "task usage" upsert_help
        "Usage: logseq upsert task [options]";
      expect_named_contains "task status option" upsert_help "--status <status>";
      expect_named_contains "task no status option" upsert_help "--no-status");

  test "CLI parity skill install target resolves local global and missing home"
    (fun () ->
      let local =
        expect_ok "local skill target"
          (Skill.resolve_install_target ~global:false ~cwd:"/tmp/work"
             ~home_dir:(Some "/Users/demo"))
      in
      expect_equal "local scope" "local" (keyword_text local.scope);
      expect_equal "local path" "/tmp/work/.agents/skills/logseq-cli/SKILL.md"
        local.path;
      expect_equal "local update command" "logseq skill install"
        local.update_command;
      let global =
        expect_ok "global skill target"
          (Skill.resolve_install_target ~global:true ~cwd:"/tmp/work"
             ~home_dir:(Some "/Users/demo"))
      in
      expect_equal "global scope" "global" (keyword_text global.scope);
      expect_equal "global path"
        "/Users/demo/.agents/skills/logseq-cli/SKILL.md" global.path;
      expect_error_code "missing home" ":skill-home-dir-unavailable"
        (Skill.resolve_install_target ~global:true ~cwd:"/tmp/work"
           ~home_dir:None));

  test "CLI parity installed skill targets omit unavailable global target"
    (fun () ->
      let targets =
        Skill.installed_skill_targets ~cwd:"/tmp/work"
          ~home_dir:(Some "/Users/demo")
      in
      expect_int "two targets" 2 (List.length targets);
      expect_equal "local target" "/tmp/work/.agents/skills/logseq-cli/SKILL.md"
        (List.nth targets 0).Skill.path;
      expect_equal "global target"
        "/Users/demo/.agents/skills/logseq-cli/SKILL.md"
        (List.nth targets 1).path;
      let local_only =
        Skill.installed_skill_targets ~cwd:"/tmp/work" ~home_dir:None
      in
      expect_int "local only" 1 (List.length local_only);
      expect_equal "local only scope" "local"
        (keyword_text (List.hd local_only).scope));

  test "CLI parity skill show and install read source and preserve neighbors"
    (fun () ->
      let root = temp_dir "logseq-cli-parity-skill-" in
      let source = Node.Path.join [| root; "source"; "SKILL.md" |] in
      let destination_dir =
        Node.Path.join [| root; "work"; ".agents"; "skills"; "logseq-cli" |]
      in
      let destination_file = Node.Path.join [| destination_dir; "SKILL.md" |] in
      let neighbor =
        Node.Path.join
          [| root; "work"; ".agents"; "skills"; "other"; "SKILL.md" |]
      in
      try
        mkdir_p (Node.Path.dirname source);
        mkdir_p (Node.Path.dirname neighbor);
        write_file source "# skill\nfrom source";
        write_file neighbor "keep me";
        let show =
          effect_result "skill show"
            (execute_with_output Skill.execute
               (Skill.Skill_show { source_path = Some source })
               (config ~root_dir:root ()) Output.Mode.Human)
        in
        expect_equal "show output" "# skill\nfrom source"
          (Format_types.format_result show (config ~root_dir:root ()));
        let install =
          effect_result "skill install"
            (execute_with_output Skill.execute
               (Skill.Skill_install
                  {
                    global = false;
                    source_path = Some source;
                    destination_dir = Some destination_dir;
                    destination_file = Some destination_file;
                  })
               (config ~root_dir:root ()) Output.Mode.Json)
        in
        let json_config =
          config ~root_dir:root
            ~output_format:(Output.Mode.Packed Output.Mode.Json) ()
        in
        let output = Format_types.format_result install json_config in
        expect_named_contains "installed path" output destination_file;
        expect_equal "installed content" "# skill\nfrom source"
          (read_file destination_file);
        expect_equal "neighbor preserved" "keep me" (read_file neighbor);
        remove_tree root
      with exn ->
        remove_tree root;
        fail_test (Printexc.to_string exn));

  test "CLI parity example selector uses registry examples before defaults"
    (fun () ->
      let registry =
        Command_registry.make
          [
            {
              Command_registry.id = Command_id.Graph_list;
              path = [ "graph"; "list" ];
              doc = "List graphs";
              long_doc = None;
              examples = [ "custom graph list example" ];
              options = [];
              category = Command_registry.Graph_management;
              requires_graph = false;
              requires_auth = false;
              write_command = false;
            };
          ]
      in
      let action =
        expect_ok "registry graph examples"
          (Example.resolve_selector registry [ "graph" ])
      in
      expect_equal "registry example" "custom graph list example"
        (List.hd action.examples);
      let defaults =
        expect_ok "default examples"
          (Example.resolve_selector Command_registry.empty [ "graph"; "list" ])
      in
      expect_equal "default selector" "graph list" defaults.selector;
      expect_named_contains "default graph list example"
        (List.hd defaults.examples)
        "logseq graph list");

  test "CLI parity config update writes sanitized patch and removes null fields"
    (fun () ->
      let root = temp_dir "logseq-cli-parity-config-update-" in
      let cfg_path = Node.Path.join [| root; "cli.edn" |] in
      try
        write_file cfg_path
          "{:graph \"old\" :ws-url \"wss://old.example/%s\" :auth-token \
           \"secret\" :retries 2 :e2ee-password \"password\"}\n";
        let resolved =
          resolve_config (Global_opts.create ~config_path:cfg_path ())
        in
        ignore
          (expect_ok "update config"
             (effect_result "update config"
                (Cli_config.update_config resolved
                   (Edn_util.map
                      [
                        (Edn_util.keyword "graph", Edn_util.string "new");
                        (Edn_util.keyword "ws-url", Edn_util.nil);
                      ]))));
        let parsed = edn_of_string (read_file cfg_path) in
        expect_equal "updated graph" "new"
          (expect_some "graph" (Edn_util.get_string parsed "graph"));
        expect_none "removed ws-url" (Edn_util.get parsed "ws-url");
        expect_none "sanitized auth-token" (Edn_util.get parsed "auth-token");
        expect_none "sanitized retries" (Edn_util.get parsed "retries");
        expect_none "sanitized e2ee-password"
          (Edn_util.get parsed "e2ee-password");
        remove_tree root
      with exn ->
        remove_tree root;
        fail_test (Printexc.to_string exn));

  test "CLI parity agent name resolves config hostname and invalid blanks"
    (fun () ->
      let with_raw raw =
        { (config ()) with Cli_config.raw_file_config = Some raw }
      in
      expect_equal "configured agent" "bridge-a"
        (expect_ok "configured agent"
           (Agent.resolve_agent_name
              (with_raw
                 (Edn_util.map
                    [
                      ( Edn_util.keyword "agent-name",
                        Edn_util.string " bridge-a " );
                    ]))
              (Some "fallback-host")));
      expect_equal "hostname fallback" "fallback-host"
        (expect_ok "hostname fallback"
           (Agent.resolve_agent_name (config ()) (Some "fallback-host")));
      expect_error_code "blank configured agent" ":agent-name-invalid"
        (Agent.resolve_agent_name
           (with_raw
              (Edn_util.map
                 [ (Edn_util.keyword "agent-name", Edn_util.string "   ") ]))
           (Some "fallback-host"));
      let platform_hostname =
        expect_ok "missing hostname falls back to platform hostname"
          (Agent.resolve_agent_name (config ()) (Some ""))
      in
      expect_bool "platform hostname non-empty" true
        (String.trim platform_hostname <> ""));

  test "CLI parity agent task routing returns explicit non-routable reasons"
    (fun () ->
      (match
         Agent.routable_task_decision (agent_task_entity ())
           ~agent_name:"build-host"
       with
      | Agent.Routable -> pass
      | Not_routable reason ->
          fail_test ("expected routable, got " ^ routable_reason_text reason));
      let expect_reason name expected entity =
        match Agent.routable_task_decision entity ~agent_name:"build-host" with
        | Agent.Not_routable reason ->
            expect_equal name expected (routable_reason_text reason)
        | Routable -> fail_test (name ^ ": expected non-routable")
      in
      expect_reason "missing uuid" "missing-stable-uuid"
        (agent_task_entity ~uuid:None ());
      expect_reason "missing task tag" "missing-task-tag"
        (agent_task_entity ~tags:[] ());
      expect_reason "done status" "not-todo"
        (agent_task_entity ~status:(Some "done") ());
      expect_reason "assignee mismatch" "assignee-mismatch"
        (agent_task_entity ~assignees:[ "other-host" ] ());
      expect_reason "already routed" "already-routed"
        (agent_task_entity ~session_id:"codex-1" ()));

  test "CLI parity agent prompt template validates required and unknown vars"
    (fun () ->
      let template body =
        {
          Agent.kind = Agent.Task;
          body;
          required_vars = [ "graph"; "task-block-tree" ];
          allowed_vars = [ "graph"; "agent-name"; "task-block-tree" ];
        }
      in
      ignore
        (expect_ok "valid template"
           (Agent.validate_prompt_template
              (template "{{graph}}\n{{task-block-tree}}\n{{agent-name}}")));
      expect_error_code "blank template" ":missing-template-code-block"
        (Agent.validate_prompt_template (template "   "));
      expect_error_code "unknown var" ":unknown-template-vars"
        (Agent.validate_prompt_template
           (template "{{graph}}\n{{task-block-tree}}\n{{other}}"));
      expect_error_code "missing var" ":missing-template-vars"
        (Agent.validate_prompt_template (template "{{graph}}"));
      let documented_template =
        template "{{graph}}\n{{task-block-tree}}\n'{{documented-only}}'"
      in
      ignore
        (expect_ok "quoted docs var ignored"
           (Agent.validate_prompt_template documented_template)));

  test "CLI parity parse covers additional command option surfaces" (fun () ->
      let list_node =
        expect_parse_ok "list node"
          [
            "list";
            "node";
            "--tags";
            "project,work";
            "--properties";
            "owner,status";
            "--sort";
            "updated-at";
          ]
      in
      (match list_node.command with
      | Cli_request.List (List_command.Parsed_node opts) ->
          expect_int "node tags" 2 (List.length opts.tags);
          expect_int "node properties" 2 (List.length opts.properties);
          expect_equal "node sort" "updated-at"
            (expect_some "node sort" opts.common.sort)
      | _ -> fail_test "expected list node");
      let query_run =
        expect_parse_ok "query run"
          [
            "query";
            "--query";
            "[:find ?e :in $ ?title :where [?e :block/title ?title]]";
            "--inputs";
            "[\"Hello\"]";
            "--graph";
            "demo";
            "--output";
            "json";
          ]
      in
      (match query_run.command with
      | Cli_request.Query
          (Query.Parsed_run
             { query_edn = Some query; inputs_edn = Some inputs; name = None })
        -> (
          expect_equal "query parse text"
            "[:find ?e :in $ ?title :where [?e :block/title ?title]]" query;
          expect_equal "query parse inputs" "[\"Hello\"]" inputs;
          match query_run.globals.output_format with
          | Some (Output.Mode.Packed Output.Mode.Json) -> pass
          | _ -> fail_test "expected json output mode")
      | _ -> fail_test "expected query run");
      let query_list = expect_parse_ok "query list" [ "query"; "list" ] in
      (match query_list.command with
      | Cli_request.Query Query.Parsed_list -> pass
      | _ -> fail_test "expected query list");
      let task =
        expect_parse_ok "upsert task"
          [
            "upsert";
            "task";
            "--page";
            "Inbox";
            "--content";
            "Ship release";
            "--status";
            "todo";
            "--priority";
            "high";
            "--no-deadline";
          ]
      in
      (match task.command with
      | Cli_request.Upsert (Upsert.Parsed_task opts) ->
          expect_equal "task page" "Inbox" (expect_some "page" opts.page);
          expect_equal "task content" "Ship release"
            (expect_some "content" opts.content);
          expect_equal "task status" "todo" (expect_some "status" opts.status);
          expect_bool "task no deadline" true opts.no_deadline
      | _ -> fail_test "expected upsert task");
      let property =
        expect_parse_ok "upsert property"
          [
            "upsert";
            "property";
            "--name";
            "status";
            "--type";
            "default";
            "--cardinality";
            "many";
            "--hide";
            "false";
            "--public";
            "true";
          ]
      in
      (match property.command with
      | Cli_request.Upsert (Upsert.Parsed_property opts) ->
          expect_equal "property name" "status" (expect_some "name" opts.name);
          expect_bool "property kind" true (opts.kind = Some Property.Default);
          expect_bool "property cardinality" true
            (opts.cardinality = Some Property.Many);
          expect_bool "hide false" false (expect_some "hide" opts.hide);
          expect_bool "public true" true (expect_some "public" opts.public)
      | _ -> fail_test "expected upsert property");
      let tag =
        expect_parse_ok "upsert tag schema properties"
          [
            "upsert";
            "tag";
            "--name";
            "project";
            "--add-properties";
            "[\"status\"]";
            "--remove-properties";
            "[:user.property/owner]";
          ]
      in
      (match tag.command with
      | Cli_request.Upsert (Upsert.Parsed_tag opts) ->
          expect_equal "tag name" "project" (expect_some "name" opts.name);
          expect_equal "add properties" "[\"status\"]"
            (expect_some "add-properties" opts.add_properties_edn);
          expect_equal "remove properties" "[:user.property/owner]"
            (expect_some "remove-properties" opts.remove_properties_edn)
      | _ -> fail_test "expected upsert tag");
      let sync_download =
        expect_parse_ok "sync download"
          [ "sync"; "download"; "--progress"; "--e2ee-password"; "secret" ]
      in
      (match sync_download.command with
      | Cli_request.Sync (Sync.Parsed_download opts) ->
          expect_bool "progress" true (expect_some "progress" opts.progress);
          expect_equal "download password" "secret"
            (expect_some "password" opts.e2ee_password)
      | _ -> fail_test "expected sync download");
      let sync_asset =
        expect_parse_ok "sync asset"
          [
            "sync";
            "asset";
            "download";
            "--uuid";
            "00000000-0000-4000-8000-000000000001";
          ]
      in
      (match sync_asset.command with
      | Cli_request.Sync (Sync.Parsed_asset_download opts) ->
          expect_equal "asset uuid" "00000000-0000-4000-8000-000000000001"
            (expect_some "asset uuid" opts.uuid)
      | _ -> fail_test "expected sync asset download");
      let grant =
        expect_parse_ok "sync grant"
          [
            "sync";
            "grant-access";
            "--graph-id";
            "00000000-0000-4000-8000-000000000001";
            "--email";
            "user@example.com";
          ]
      in
      (match grant.command with
      | Cli_request.Sync (Sync.Parsed_grant_access opts) ->
          expect_equal "grant graph id" "00000000-0000-4000-8000-000000000001"
            (expect_some "graph id" opts.graph_id);
          expect_equal "grant email" "user@example.com"
            (expect_some "email" opts.email)
      | _ -> fail_test "expected sync grant access");
      let graph_create =
        expect_parse_ok "graph create sync"
          [ "graph"; "create"; "--enable-sync"; "--e2ee-password"; "secret" ]
      in
      (match graph_create.command with
      | Cli_request.Graph (Graph.Parsed_create opts) ->
          expect_bool "enable sync" true opts.enable_sync;
          expect_equal "graph password" "secret"
            (expect_some "graph password" opts.e2ee_password)
      | _ -> fail_test "expected graph create");
      expect_parse_error_code "unknown agent subcommand" ":unknown-command"
        [ "agent"; "bridge"; "list" ];
      expect_parse_error_code "unknown option" ":invalid-options"
        [ "server"; "cleanup"; "--graph"; "demo"; "--unknown"; "x" ]);

  test "CLI parity transport reads and writes edn sqlite and db files"
    (fun () ->
      let root = temp_dir "logseq-cli-parity-transport-io-" in
      let edn_path = Node.Path.join [| root; "data.edn" |] in
      let edn_utf8_path = Node.Path.join [| root; "utf8.edn" |] in
      let edn_bytes_path = Node.Path.join [| root; "bytes.edn" |] in
      let sqlite_path = Node.Path.join [| root; "graph.sqlite" |] in
      let db_path = Node.Path.join [| root; "graph.db" |] in
      let title = unicode_text [ 0x4e2d; 0x6587; 0x6807; 0x9898 ] in
      let imported_title = unicode_text [ 0x5bfc; 0x5165; 0x4e2d; 0x6587 ] in
      try
        ignore
          (expect_ok "write edn"
             (effect_result "write edn"
                (Transport.write_output ~format:(Edn_util.keyword_t "edn")
                   ~path:edn_path
                   ~data:
                     (Edn_util.map
                        [
                          (Edn_util.keyword "title", Edn_util.string "中文标题");
                          (Edn_util.keyword "count", Edn_util.int 2);
                        ]))));
        expect_named_contains "edn file preserves utf8" (read_file edn_path)
          title;
        let edn_value =
          expect_ok "read edn"
            (effect_result "read edn"
               (Transport.read_input ~format:(Edn_util.keyword_t "edn")
                  ~path:edn_path))
        in
        expect_equal "edn title" title
          (expect_some "title" (Edn_util.get_string edn_value "title"));
        write_file edn_utf8_path ("{:title \"" ^ imported_title ^ "\"}");
        let edn_utf8_value =
          expect_ok "read utf8 edn"
            (effect_result "read utf8 edn"
               (Transport.read_input ~format:(Edn_util.keyword_t "edn")
                  ~path:edn_utf8_path))
        in
        expect_equal "utf8 edn title" imported_title
          (expect_some "utf8 title"
             (Edn_util.get_string edn_utf8_value "title"));
        ignore
          (expect_ok "write bytes edn"
             (effect_result "write bytes edn"
                (Transport.write_output ~format:(Edn_util.keyword_t "edn")
                   ~path:edn_bytes_path
                   ~data:
                     (Edn_util.map
                        [
                          ( Edn_util.keyword "payload",
                            Edn_util.bytes (Bytes.of_string "payload") );
                        ]))));
        expect_named_contains "edn bytes use transit tag"
          (read_file edn_bytes_path) "#transit/bytes";
        ignore
          (expect_ok "write sqlite"
             (effect_result "write sqlite"
                (Transport.write_output
                   ~format:(Edn_util.keyword_t "sqlite")
                   ~path:sqlite_path
                   ~data:(Edn_util.string "sqlite-bytes"))));
        let sqlite_value =
          expect_ok "read sqlite"
            (effect_result "read sqlite"
               (Transport.read_input
                  ~format:(Edn_util.keyword_t "sqlite")
                  ~path:sqlite_path))
        in
        expect_equal "sqlite bytes" "sqlite-bytes"
          (Bytes.to_string
             (expect_some "sqlite bytes" (Edn_util.as_bytes sqlite_value)));
        expect_named_contains "read sqlite uses transit bytes tag"
          (Melange_edn.to_edn_string sqlite_value)
          "#transit/bytes";
        ignore
          (expect_ok "write db"
             (effect_result "write db"
                (Transport.write_output ~format:(Edn_util.keyword_t "db")
                   ~path:db_path
                   ~data:(Edn_util.bytes (Bytes.of_string "db")))));
        let db_value =
          expect_ok "read db"
            (effect_result "read db"
               (Transport.read_input ~format:(Edn_util.keyword_t "db")
                  ~path:db_path))
        in
        expect_equal "db bytes" "db"
          (Bytes.to_string
             (expect_some "db bytes" (Edn_util.as_bytes db_value)));
        expect_named_contains "read db uses transit bytes tag"
          (Melange_edn.to_edn_string db_value)
          "#transit/bytes";
        expect_error_code "bad write format" ":unsupported-output-format"
          (effect_result "bad write format"
             (Transport.write_output
                ~format:(Edn_util.keyword_t "json")
                ~path:(Node.Path.join [| root; "data.json" |])
                ~data:(Edn_util.string "nope")));
        expect_error_code "bad read format" ":unsupported-input-format"
          (effect_result "bad read format"
             (Transport.read_input
                ~format:(Edn_util.keyword_t "json")
                ~path:edn_path));
        remove_tree root
      with exn ->
        remove_tree root;
        fail_test (Printexc.to_string exn));

  test_promise
    "CLI parity transport thread-api invoke sends transit args and decodes \
     resultTransit" (fun () ->
      let request_count = ref 0 in
      let large_int = 1_773_666_723_828L in
      let server =
        invoke_server (fun body ->
            incr request_count;
            expect_named_contains "invoke method" body "thread-api/q";
            expect_named_contains "invoke repo" body "logseq_db_alpha";
            expect_named_contains "invoke args transit field" body "argsTransit";
            let args =
              expect_some "invoke args" (Edn_util.as_seq (invoke_args body))
            in
            let query =
              expect_some "invoke query" (Edn_util.as_seq (List.nth args 1))
            in
            expect_int64 "invoke large int" large_int
              (expect_some "invoke large int value"
                 (Edn_util.as_int64 (List.nth query 5)));
            (match List.nth query 6 with
            | Melange_edn.Any (Melange_edn.Bigint value) ->
                expect_equal "invoke bigint" "900719925474099312345" value
            | _ -> fail_test "invoke bigint: expected Bigint");
            (match List.nth query 7 with
            | Melange_edn.Any (Melange_edn.Decimal value) ->
                expect_equal "invoke decimal" "1234567890.123456789" value
            | _ -> fail_test "invoke decimal: expected Decimal");
            "\"ok\"")
      in
      with_server server (fun base_url ->
          let invoke_config =
            {
              Transport.base_url;
              timeout_span = Time.span_of_ms 1_000L;
              profile_session = None;
            }
          in
          let* result =
            effect_to_promise
              (Transport.thread_api_q invoke_config
                 ~repo:(Cli_primitive.create_repo "logseq_db_alpha")
                 ~query:
                   (Edn_util.vector_t
                      [
                        Edn_util.keyword "find";
                        Edn_util.symbol "?title";
                        Edn_util.keyword "where";
                        Edn_util.vector
                          [
                            Edn_util.symbol "?b";
                            Edn_util.keyword "block/title";
                            Edn_util.symbol "?title";
                          ];
                        Edn_util.keyword "created-at";
                        Edn_util.int64 large_int;
                        Edn_util.any
                          (Melange_edn.bigint "900719925474099312345");
                        Edn_util.any
                          (Melange_edn.decimal "1234567890.123456789");
                      ]))
          in
          expect_equal "decoded invoke result" "ok"
            (expect_some "invoke result string" (Edn_util.as_string result));
          expect_int "one invoke request" 1 !request_count;
          Js.Promise.resolve pass));

  test_promise
    "CLI parity transport keeps prefixed symbol-looking strings as strings"
    (fun () ->
      let server =
        invoke_server (fun body ->
            let args =
              expect_some "invoke args" (Edn_util.as_seq (invoke_args body))
            in
            let query =
              expect_some "invoke query" (Edn_util.as_seq (List.nth args 1))
            in
            expect_equal "string stays string" "~$?title"
              (expect_some "string value"
                 (Edn_util.as_string (List.nth query 1)));
            "\"ok\"")
      in
      with_server server (fun base_url ->
          let invoke_config =
            {
              Transport.base_url;
              timeout_span = Time.span_of_ms 1_000L;
              profile_session = None;
            }
          in
          let* result =
            effect_to_promise
              (Transport.thread_api_q invoke_config
                 ~repo:(Cli_primitive.create_repo "logseq_db_alpha")
                 ~query:
                   (Edn_util.vector_t
                      [ Edn_util.keyword "find"; Edn_util.string "~$?title" ]))
          in
          expect_equal "decoded invoke result" "ok"
            (expect_some "invoke result string" (Edn_util.as_string result));
          Js.Promise.resolve pass));

  test_promise
    "CLI parity transport thread-api invoke decodes cached keyword vectors"
    (fun () ->
      let server =
        invoke_server (fun body ->
            expect_named_contains "invoke method" body "thread-api/q";
            "[\"~:block/uuid\",[\"^0\",\"x\"]]")
      in
      with_server server (fun base_url ->
          let invoke_config =
            {
              Transport.base_url;
              timeout_span = Time.span_of_ms 1_000L;
              profile_session = None;
            }
          in
          let* result =
            effect_to_promise
              (Transport.thread_api_q invoke_config
                 ~repo:(Cli_primitive.create_repo "logseq_db_alpha")
                 ~query:(Edn_util.vector_t [ Edn_util.keyword "find" ]))
          in
          match Edn_util.as_seq result with
          | Some [ key; nested ] -> (
              expect_equal "decoded key" "block/uuid"
                (expect_some "keyword" (Edn_util.as_keyword key));
              match Edn_util.as_seq nested with
              | Some [ nested_key; value ] ->
                  expect_equal "decoded nested key" "block/uuid"
                    (expect_some "nested keyword"
                       (Edn_util.as_keyword nested_key));
                  expect_equal "decoded nested value" "x"
                    (expect_some "nested value" (Edn_util.as_string value));
                  Js.Promise.resolve pass
              | _ -> fail_promise "expected nested vector")
          | _ -> fail_promise "expected decoded vector"));

  test_promise
    "CLI parity transport connect-events decodes rtc-log and closes \
     subscription" (fun () ->
      let received = ref [] in
      let closed = ref false in
      let server =
        create_server (fun[@u] req res ->
            if req_method req = "GET" && req_url req = "/v1/events" then (
              res_write_head res 200
                (Js.Dict.fromArray
                   [|
                     ("Content-Type", "text/event-stream");
                     ("Cache-Control", "no-cache");
                     ("Connection", "keep-alive");
                   |]);
              res_write res
                "data: {\"payload\":\"[\\\"~:rtc-log\\\",[\\\"^ \
                 \\\",\\\"~:type\\\",\\\"~:rtc.log/download\\\",\\\"~:graph-uuid\\\",\\\"~u00000000-0000-4000-8000-000000000001\\\",\\\"~:message\\\",\\\"downloaded \
                 1 block\\\"]]\"}\n\n";
              req_on_end req "close" (fun[@u] () -> closed := true))
            else write_json res 404 (error_response "not found"))
      in
      with_server server (fun base_url ->
          let invoke_config =
            {
              Transport.base_url;
              timeout_span = Time.span_of_ms 1_000L;
              profile_session = None;
            }
          in
          let* subscription =
            effect_to_promise
              (Transport.connect_events invoke_config (fun event_type payload ->
                   received :=
                     (event_type, Melange_edn.to_edn_string payload)
                     :: !received;
                   Cli_effect.pure ()))
          in
          let* () = sleep_ms 50 in
          let* () = effect_to_promise (subscription.Transport.close ()) in
          let* () = sleep_ms 50 in
          let event_type, payload =
            match List.rev !received with
            | event :: _ -> event
            | [] ->
                fail_test "received event: expected Some value";
                assert false
          in
          expect_equal "event type" "rtc-log"
            (Edn_util.keyword_to_string event_type);
          expect_named_contains "event payload" payload "downloaded 1 block";
          expect_bool "subscription closed" true !closed;
          Js.Promise.resolve pass));

  test "CLI parity server lock paths use canonical graph directory names"
    (fun () ->
      expect_equal "plain lock path"
        "/tmp/logseq-root/graphs/demo/db-worker.lock"
        (Server_runtime.lock_path ~root_dir:"/tmp/logseq-root"
           (Cli_primitive.create_repo "logseq_db_demo"));
      expect_equal "encoded lock path"
        "/tmp/logseq-root/graphs/foo~2Fbar/db-worker.lock"
        (Server_runtime.lock_path ~root_dir:"/tmp/logseq-root"
           (Cli_primitive.create_repo "logseq_db_foo/bar")));

  test "CLI parity server command build keeps cleanup repo-free contract"
    (fun () ->
      (match
         Server_command.build (config ()) (Global_opts.create ())
           Server_command.Parsed_list
       with
      | Ok Server_command.Server_list -> pass
      | Ok _ -> fail_test "server list: expected list action"
      | Error err -> fail_test ("server list: " ^ err.Error.message));
      (match
         Server_command.build (config ()) (Global_opts.create ())
           Server_command.Parsed_cleanup
       with
      | Ok Server_command.Server_cleanup -> pass
      | Ok _ -> fail_test "server cleanup: expected cleanup action"
      | Error err -> fail_test ("server cleanup: " ^ err.Error.message));
      expect_error_code "server start requires repo" "missing-repo"
        (Server_command.build (config ()) (Global_opts.create ())
           Server_command.Parsed_start);
      expect_error_code "server stop requires repo" "missing-repo"
        (Server_command.build (config ()) (Global_opts.create ())
           Server_command.Parsed_stop);
      expect_error_code "server restart requires repo" "missing-repo"
        (Server_command.build (config ()) (Global_opts.create ())
           Server_command.Parsed_restart);
      (match
         Server_command.build (config ~repo:"demo" ()) (Global_opts.create ())
           Server_command.Parsed_start
       with
      | Ok (Server_command.Server_start { repo; graph }) ->
          expect_equal "server start repo" "logseq_db_demo"
            (Cli_primitive.string_of_repo repo);
          expect_equal "server start graph" "demo"
            (Cli_primitive.string_of_graph graph)
      | Ok _ -> fail_test "server start: expected start action"
      | Error err -> fail_test ("server start: " ^ err.Error.message));
      (match
         Server_command.build (config ~repo:"demo" ()) (Global_opts.create ())
           Server_command.Parsed_stop
       with
      | Ok (Server_command.Server_stop { repo; graph }) ->
          expect_equal "server stop repo" "logseq_db_demo"
            (Cli_primitive.string_of_repo repo);
          expect_equal "server stop graph" "demo"
            (Cli_primitive.string_of_graph graph)
      | Ok _ -> fail_test "server stop: expected stop action"
      | Error err -> fail_test ("server stop: " ^ err.Error.message));
      (match
         Server_command.build (config ~repo:"demo" ()) (Global_opts.create ())
           Server_command.Parsed_restart
       with
      | Ok (Server_command.Server_restart { repo; graph }) ->
          expect_equal "server restart repo" "logseq_db_demo"
            (Cli_primitive.string_of_repo repo);
          expect_equal "server restart graph" "demo"
            (Cli_primitive.string_of_graph graph)
      | Ok _ -> fail_test "server restart: expected restart action"
      | Error err -> fail_test ("server restart: " ^ err.Error.message));
      pass);

  test
    "CLI parity server graph item listing ignores non-graphs and marks old dir \
     conflicts" (fun () ->
      let root = temp_dir "logseq-cli-parity-graph-items-" in
      let graphs = Node.Path.join [| root; "graphs" |] in
      try
        List.iter
          (fun dir -> mkdir_p (Node.Path.join [| graphs; dir |]))
          [
            "alpha";
            "backup";
            "foo~2G";
            "Unlinked graphs";
            "logseq_local_1";
            "old++name";
            "old~2Fname";
            "yy y";
            "yy~20y";
            "yy%20y";
            "bad%ZZname";
          ];
        let items =
          Server_runtime.list_graph_items (config ~root_dir:root ())
        in
        let canonical =
          List.filter
            (fun item -> item.Graph_types.kind = Graph_types.Canonical)
            items
        in
        expect_bool "has alpha canonical" true
          (List.exists
             (fun item ->
               Option.equal String.equal
                 (Option.map Cli_primitive.string_of_graph
                    item.Graph_types.graph_name)
                 (Some "alpha")
               && item.Graph_types.graph_dir = Some "alpha")
             canonical);
        expect_bool "ignores backup" false
          (List.exists
             (fun item -> item.Graph_types.graph_dir = Some "backup")
             items);
        let old_item =
          expect_some "old format item"
            (List.find_opt
               (fun item -> item.Graph_types.legacy_dir = Some "old++name")
               items)
        in
        expect_bool "old item kind" true
          (old_item.Graph_types.kind = Graph_types.Legacy);
        expect_equal "old graph name" "old/name"
          (Cli_primitive.string_of_graph
             (expect_some "old graph name" old_item.Graph_types.graph_name));
        expect_equal "old target dir" "old~2Fname"
          (expect_some "target dir" old_item.Graph_types.target_graph_dir);
        expect_bool "old conflict" true old_item.Graph_types.conflict;
        let percent_encoded_old_dirs =
          items
          |> List.filter (fun item ->
              match item.Graph_types.legacy_dir with
              | Some ("yy~20y" | "yy%20y") -> true
              | _ -> false)
        in
        expect_int "percent encoded old dir count" 1
          (List.length percent_encoded_old_dirs);
        List.iter
          (fun item ->
            expect_bool "percent encoded item kind" true
              (item.Graph_types.kind = Graph_types.Legacy);
            expect_equal "percent encoded graph name" "yy y"
              (Cli_primitive.string_of_graph
                 (expect_some "percent encoded graph name"
                    item.Graph_types.graph_name));
            expect_equal "percent encoded target dir" "yy y"
              (expect_some "percent encoded target"
                 item.Graph_types.target_graph_dir);
            expect_bool "percent encoded conflict" true
              item.Graph_types.conflict)
          percent_encoded_old_dirs;
        let undecodable =
          expect_some "undecodable item"
            (List.find_opt
               (fun item -> item.Graph_types.legacy_dir = Some "bad%ZZname")
               items)
        in
        expect_bool "undecodable kind" true
          (undecodable.Graph_types.kind = Graph_types.Legacy_undecodable);
        remove_tree root
      with exn ->
        remove_tree root;
        fail_test (Printexc.to_string exn));

  test "CLI parity format renders basic success outputs by selected mode"
    (fun () ->
      let message mode = Cli_result.ok mode (Cli_result.Message "ok") in
      expect_equal "human message" "ok"
        (Format_types.format_result (message Output.Mode.Human) (config ()));
      expect_equal "json message"
        "{\"status\":\"ok\",\"data\":{\"message\":\"ok\"}}"
        (Format_types.format_result (message Output.Mode.Json)
           (config ~output_format:(Output.Mode.Packed Output.Mode.Json) ()));
      expect_equal "edn message" "{:status :ok :data {:message \"ok\"}}"
        (Format_types.format_result (message Output.Mode.Edn)
           (config ~output_format:(Output.Mode.Packed Output.Mode.Edn) ())));

  test "CLI parity format graph list marks current graph and old graph dirs"
    (fun () ->
      let graph_list_data =
        Edn_util.map
          [
            ( Edn_util.keyword "graphs",
              Edn_util.vector
                [
                  Edn_util.string "alpha";
                  Edn_util.string "old/name";
                  Edn_util.string "mystery";
                ] );
            ( Edn_util.keyword "graph-items",
              Edn_util.vector
                [
                  Edn_util.map
                    [
                      (Edn_util.keyword "kind", Edn_util.keyword "canonical");
                      (Edn_util.keyword "graph-name", Edn_util.string "alpha");
                      (Edn_util.keyword "graph-dir", Edn_util.string "alpha");
                    ];
                  Edn_util.map
                    [
                      (Edn_util.keyword "kind", Edn_util.keyword "legacy");
                      ( Edn_util.keyword "legacy-dir",
                        Edn_util.string "old++name" );
                      ( Edn_util.keyword "legacy-graph-name",
                        Edn_util.string "old/name" );
                      ( Edn_util.keyword "target-graph-dir",
                        Edn_util.string "old~2Fname" );
                      (Edn_util.keyword "conflict?", Edn_util.bool false);
                    ];
                  Edn_util.map
                    [
                      ( Edn_util.keyword "kind",
                        Edn_util.keyword "legacy-undecodable" );
                      (Edn_util.keyword "legacy-dir", Edn_util.string "mystery");
                      (Edn_util.keyword "reason", Edn_util.keyword "undecodable");
                    ];
                ] );
          ]
      in
      let output =
        Format_types.format_result
          (Cli_result.ok ~command:Command_id.Graph_list Output.Mode.Human
             (Cli_result.Raw graph_list_data))
          (config ~graph:"old/name" ~root_dir:"/tmp/logseq-root" ())
      in
      expect_named_contains "current graph marker" output "* old/name";
      expect_named_not_contains "old graph marker" output "old/name [legacy]";
      expect_named_not_contains "old graph warning" output
        "legacy graph directories detected";
      expect_named_not_contains "rename guidance" output "old++name");

  test "CLI parity format list and search table outputs keep count footer"
    (fun () ->
      let list_value =
        Edn_util.map
          [
            ( Edn_util.keyword "items",
              Edn_util.vector
                [
                  Edn_util.map
                    [
                      (Edn_util.keyword "db/id", Edn_util.int64 1L);
                      (Edn_util.keyword "block/title", Edn_util.string "Alpha");
                      ( Edn_util.keyword "block/updated-at",
                        Edn_util.int64 90000L );
                      ( Edn_util.keyword "block/created-at",
                        Edn_util.int64 40000L );
                    ];
                ] );
          ]
      in
      let list_output =
        Format_types.format_result
          (Cli_result.ok ~command:Command_id.List_page Output.Mode.Human
             (Cli_result.Raw list_value))
          (config ())
      in
      expect_named_contains "list id header" list_output "db/id";
      expect_named_contains "list title" list_output "Alpha";
      expect_named_contains "list count" list_output "Count: 1";
      let search_value =
        Edn_util.map
          [
            ( Edn_util.keyword "items",
              Edn_util.vector
                [
                  Edn_util.map
                    [
                      (Edn_util.keyword "db/id", Edn_util.int64 3L);
                      ( Edn_util.keyword "block/title",
                        Edn_util.string "Alpha block" );
                    ];
                  Edn_util.map
                    [
                      (Edn_util.keyword "db/id", Edn_util.int64 7L);
                      ( Edn_util.keyword "block/title",
                        Edn_util.string "Second line\nIndented" );
                    ];
                ] );
          ]
      in
      let search_output =
        Format_types.format_result
          (Cli_result.ok ~command:Command_id.Search_block Output.Mode.Human
             (Cli_result.Raw search_value))
          (config ())
      in
      expect_named_contains "search title" search_output "Alpha block";
      expect_named_contains "search multiline" search_output "Indented";
      expect_named_contains "search count" search_output "Count: 2");

  test "CLI parity format list variants use current generic table contracts"
    (fun () ->
      let row fields = Edn_util.map fields in
      let items values =
        Edn_util.map [ (Edn_util.keyword "items", Edn_util.vector values) ]
      in
      let human command value =
        Format_types.format_result
          (Cli_result.ok ~command Output.Mode.Human (Cli_result.Raw value))
          (config ())
      in
      let tag_output =
        human Command_id.List_tag
          (items
             [
               row
                 [
                   (Edn_util.keyword "block/title", Edn_util.string "Tag");
                   (Edn_util.keyword "db/id", Edn_util.int64 42L);
                   ( Edn_util.keyword "db/ident",
                     Edn_util.keyword "logseq.class/Tag" );
                 ];
             ])
      in
      expect_named_contains "tag id header" tag_output "db/id";
      expect_named_contains "tag title header" tag_output "block/title";
      expect_named_contains "tag ident value" tag_output "logseq.class/Tag";
      let property_output =
        human Command_id.List_property
          (items
             [
               row
                 [
                   (Edn_util.keyword "block/title", Edn_util.string "Prop");
                   (Edn_util.keyword "db/id", Edn_util.int64 99L);
                   ( Edn_util.keyword "logseq.property/type",
                     Edn_util.keyword "node" );
                   ( Edn_util.keyword "db/cardinality",
                     Edn_util.keyword "db.cardinality/many" );
                 ];
               row
                 [
                   (Edn_util.keyword "block/title", Edn_util.string "Untyped");
                   (Edn_util.keyword "db/id", Edn_util.int64 100L);
                 ];
             ])
      in
      expect_named_contains "property type header" property_output
        "logseq.property/type";
      expect_named_contains "property cardinality header" property_output
        "db/cardinality";
      expect_named_contains "property cardinality value" property_output
        "db.cardinality/many";
      let task_output =
        human Command_id.List_task
          (items
             [
               row
                 [
                   (Edn_util.keyword "db/id", Edn_util.int64 12L);
                   (Edn_util.keyword "block/title", Edn_util.string "Alpha task");
                   ( Edn_util.keyword "logseq.property/status",
                     Edn_util.keyword "logseq.property/status.todo" );
                   ( Edn_util.keyword "logseq.property/priority",
                     Edn_util.keyword "logseq.property/priority.high" );
                 ];
             ])
      in
      expect_named_contains "task status column" task_output
        "logseq.property/status";
      expect_named_contains "task priority column" task_output
        "logseq.property/priority";
      let node_output =
        human Command_id.List_node
          (items
             [
               row
                 [
                   (Edn_util.keyword "db/id", Edn_util.int64 1L);
                   (Edn_util.keyword "block/title", Edn_util.string "Node Page");
                   (Edn_util.keyword "node/type", Edn_util.string "page");
                   ( Edn_util.keyword "block/uuid",
                     Edn_util.uuid "11111111-1111-1111-1111-111111111111" );
                 ];
             ])
      in
      expect_named_contains "node type column" node_output "node/type";
      expect_named_contains "node uuid column" node_output "block/uuid";
      let asset_output =
        human Command_id.List_asset
          (items
             [
               row
                 [
                   (Edn_util.keyword "db/id", Edn_util.int64 3L);
                   (Edn_util.keyword "block/title", Edn_util.string "Asset Node");
                   ( Edn_util.keyword "logseq.property.asset/type",
                     Edn_util.string "md" );
                   ( Edn_util.keyword "logseq.property.asset/size",
                     Edn_util.int64 2552L );
                 ];
             ])
      in
      expect_named_contains "asset type column" asset_output
        "logseq.property.asset/type";
      expect_named_contains "asset size column" asset_output
        "logseq.property.asset/size";
      expect_named_contains "asset raw size" asset_output "2552");

  test "CLI parity format list title truncation keeps current display contracts"
    (fun () ->
      let ellipsis = decode_uri_component "%E2%80%A6" in
      let item title =
        Edn_util.map
          [
            (Edn_util.keyword "db/id", Edn_util.int64 1L);
            (Edn_util.keyword "block/title", Edn_util.string title);
          ]
      in
      let value title =
        Edn_util.map
          [ (Edn_util.keyword "items", Edn_util.vector [ item title ]) ]
      in
      let truncated =
        Format_types.format_result
          (Cli_result.ok ~command:Command_id.List_page Output.Mode.Human
             (Cli_result.Raw (value "ABCDEFGH")))
          (config ~list_title_max_display_width:6 ())
      in
      expect_named_contains "single line display truncation" truncated
        ("ABCDE" ^ ellipsis);
      expect_named_not_contains "single line hides full title" truncated
        "ABCDEFGH";
      let multiline =
        Format_types.format_result
          (Cli_result.ok ~command:Command_id.List_page Output.Mode.Human
             (Cli_result.Raw (value "Line 1\nLine 2\nLine 3\nLine 4\nLine 5")))
          (config ())
      in
      expect_named_contains "multiline line one" multiline "Line 1";
      expect_named_contains "multiline line two" multiline "Line 2";
      ignore ellipsis;
      expect_named_contains "multiline line three" multiline "Line 3";
      expect_named_contains "multiline line four" multiline "Line 4";
      expect_named_contains "multiline line five" multiline "Line 5");

  test "CLI parity format upsert summaries use current generic tables"
    (fun () ->
      let raw_ids ids =
        Cli_result.Raw
          (Edn_util.map
             [
               ( Edn_util.keyword "result",
                 Edn_util.vector (List.map Edn_util.int64 ids) );
             ])
      in
      let upsert_block =
        Format_types.format_result
          (Cli_result.ok ~command:Command_id.Upsert_block Output.Mode.Human
             (raw_ids [ 201L; 202L ]))
          (config ())
      in
      expect_equal "upsert block table" "Value\n201\n202\nCount: 2" upsert_block;
      let upsert_page =
        Format_types.format_result
          (Cli_result.ok ~command:Command_id.Upsert_page Output.Mode.Human
             (raw_ids [ 123L ]))
          (config ())
      in
      expect_equal "upsert page table" "Value\n123\nCount: 1" upsert_page);

  test "CLI parity format remove summaries use current generic tables"
    (fun () ->
      let success_data =
        Cli_result.Raw
          (Edn_util.map
             [
               ( Edn_util.keyword "result",
                 Edn_util.map [ (Edn_util.keyword "ok", Edn_util.bool true) ] );
             ])
      in
      let page_output =
        Format_types.format_result
          (Cli_result.ok ~command:Command_id.Remove_page Output.Mode.Human
             success_data)
          (config ~repo:"demo-repo" ())
      in
      expect_equal "remove page result table" "result  {:ok true}" page_output;
      let block_output =
        Format_types.format_result
          (Cli_result.ok ~command:Command_id.Remove_block Output.Mode.Human
             success_data)
          (config ~repo:"demo-repo" ())
      in
      expect_equal "remove block result table" "result  {:ok true}" block_output);

  test
    "CLI parity format graph sync and auth summaries use current generic output"
    (fun () ->
      let graph_export =
        Format_types.format_result
          (Cli_result.ok ~command:Command_id.Graph_export Output.Mode.Human
             Cli_result.Empty)
          (config ())
      in
      expect_equal "graph export empty output" "" graph_export;
      let sync_status =
        Format_types.format_result
          (Cli_result.ok ~command:Command_id.Sync_status Output.Mode.Human
             (Cli_result.Raw
                (Edn_util.map
                   [
                     (Edn_util.keyword "repo", Edn_util.string "demo-graph");
                     (Edn_util.keyword "graph-id", Edn_util.string "graph-uuid");
                     (Edn_util.keyword "ws-state", Edn_util.keyword "open");
                     (Edn_util.keyword "pending-local", Edn_util.int64 2345L);
                   ])))
          (config ())
      in
      expect_named_contains "sync status repo" sync_status "demo-graph";
      expect_named_contains "sync status pending" sync_status "2345";
      let login =
        Format_types.format_result
          (Cli_result.ok ~command:Command_id.Login Output.Mode.Human
             (Cli_result.Raw
                (Edn_util.map
                   [
                     ( Edn_util.keyword "auth-path",
                       Edn_util.string "/tmp/auth.json" );
                     ( Edn_util.keyword "email",
                       Edn_util.string "user@example.com" );
                     ( Edn_util.keyword "id-token",
                       Edn_util.string "secret-token" );
                   ])))
          (config ())
      in
      expect_named_contains "login email" login "user@example.com";
      expect_named_contains "login current token field" login "secret-token");

  test "CLI parity format graph info keeps old kv redaction contracts"
    (fun () ->
      let token = "secret-token-value" in
      let kv_value =
        Edn_util.map
          [
            (Edn_util.string "logseq.kv/api-token", Edn_util.string token);
            (Edn_util.string "logseq.kv/db-type", Edn_util.keyword "sqlite");
          ]
      in
      let graph_info_value =
        Edn_util.map
          [
            (Edn_util.keyword "graph", Edn_util.string "demo-graph");
            (Edn_util.keyword "kv", kv_value);
          ]
      in
      let output =
        Format_types.format_result
          (Cli_result.ok ~command:Command_id.Graph_info Output.Mode.Human
             (Cli_result.Raw graph_info_value))
          (config ())
      in
      expect_named_contains "graph info graph row" output "graph";
      expect_named_contains "graph info graph value" output "demo-graph";
      expect_named_contains "graph info redacts token" output "[REDACTED]";
      expect_named_not_contains "graph info hides token" output token;
      let json_graph_info_value =
        Edn_util.map
          [
            (Edn_util.keyword "graph", Edn_util.string "demo-graph");
            ( Edn_util.keyword "kv",
              Edn_util.map
                [
                  (Edn_util.string "logseq.kv/api-token", Edn_util.string token);
                ] );
          ]
      in
      let json_output =
        Format_types.format_result
          (Cli_result.ok ~command:Command_id.Graph_info Output.Mode.Json
             (Cli_result.Raw json_graph_info_value))
          (config ~output_format:(Output.Mode.Packed Output.Mode.Json) ())
      in
      expect_named_contains "graph info json redaction" json_output
        "\"logseq.kv/api-token\":\"[REDACTED]\"";
      expect_named_not_contains "graph info json hides token" json_output token);

  test "CLI parity format server outputs use current owner revision contracts"
    (fun () ->
      let server =
        Edn_util.map
          [
            (Edn_util.keyword "repo", Edn_util.string "demo-repo");
            (Edn_util.keyword "status", Edn_util.keyword "ready");
            (Edn_util.keyword "host", Edn_util.string "127.0.0.1");
            (Edn_util.keyword "port", Edn_util.int64 1234L);
            (Edn_util.keyword "pid", Edn_util.int64 9876L);
            (Edn_util.keyword "owner-source", Edn_util.keyword "cli");
            (Edn_util.keyword "revision", Edn_util.string "worker-revision");
          ]
      in
      let list_output =
        Format_types.format_result
          (Cli_result.ok ~command:Command_id.Server_list Output.Mode.Human
             (Cli_result.Raw
                (Edn_util.map
                   [ (Edn_util.keyword "servers", Edn_util.vector [ server ]) ])))
          (config ())
      in
      expect_named_contains "server repo header" list_output "repo";
      expect_named_contains "server owner header" list_output "owner-source";
      expect_named_contains "server revision" list_output "worker-revision";
      let cleanup_output =
        Format_types.format_result
          (Cli_result.ok ~command:Command_id.Server_cleanup Output.Mode.Human
             (Cli_result.Raw
                (Edn_util.map
                   [
                     (Edn_util.keyword "cli-revision", Edn_util.string "cli-rev");
                     (Edn_util.keyword "checked", Edn_util.int64 4321L);
                     (Edn_util.keyword "mismatched", Edn_util.int64 3210L);
                     (Edn_util.keyword "killed", Edn_util.vector [ server ]);
                   ])))
          (config ())
      in
      expect_named_contains "cleanup checked row" cleanup_output "checked";
      expect_named_contains "cleanup checked value" cleanup_output "4321");

  test "CLI parity format doctor and validation outputs use current contracts"
    (fun () ->
      let validation_success =
        Format_types.format_result
          (Cli_result.ok ~command:Command_id.Graph_validate
             ~context:
               (Edn_util.map
                  [ (Edn_util.keyword "graph", Edn_util.string "foo") ])
             Output.Mode.Human
             (Cli_result.Raw
                (Edn_util.map
                   [
                     ( Edn_util.keyword "result",
                       Edn_util.map
                         [ (Edn_util.keyword "errors", Edn_util.nil) ] );
                   ])))
          (config ())
      in
      expect_equal "graph validation result table" "result  {:errors nil}"
        validation_success;
      let validation_error =
        Format_types.format_result
          (Cli_result.error ~command:Command_id.Graph_validate Output.Mode.Human
             (Error.make
                (Edn_util.keyword_t "graph-validation-failed")
                "Found 1 entity with errors:\n({:entity {:db/id 1}})\n"))
          (config ())
      in
      expect_named_contains "graph validation error code" validation_error
        "Error (graph-validation-failed):";
      expect_named_contains "graph validation error body" validation_error
        "Found 1 entity with errors";
      let doctor_value =
        Edn_util.map
          [
            (Edn_util.keyword "status", Edn_util.keyword "warning");
            ( Edn_util.keyword "checks",
              Edn_util.vector
                [
                  Edn_util.map
                    [
                      (Edn_util.keyword "id", Edn_util.keyword "root-dir");
                      (Edn_util.keyword "status", Edn_util.keyword "ok");
                      ( Edn_util.keyword "message",
                        Edn_util.string "Read/write access confirmed" );
                    ];
                  Edn_util.map
                    [
                      ( Edn_util.keyword "id",
                        Edn_util.keyword "server-revision-mismatch" );
                      (Edn_util.keyword "status", Edn_util.keyword "warning");
                      ( Edn_util.keyword "message",
                        Edn_util.string
                          "1 server uses a different revision than this CLI" );
                      ( Edn_util.keyword "servers",
                        Edn_util.vector
                          [
                            Edn_util.map
                              [
                                ( Edn_util.keyword "graph",
                                  Edn_util.string "team graph" );
                              ];
                          ] );
                    ];
                ] );
          ]
      in
      let doctor_output =
        Format_types.format_result
          (Cli_result.ok ~command:Command_id.Doctor Output.Mode.Human
             (Cli_result.Raw doctor_value))
          (config ())
      in
      expect_named_contains "doctor status" doctor_output "warning";
      expect_named_contains "doctor root check" doctor_output "root-dir";
      expect_named_contains "doctor restart target" doctor_output "team graph";
      let revision_error =
        Format_types.format_result
          (Cli_result.error ~command:Command_id.Server_start Output.Mode.Human
             (Error.make
                ~hint:
                  "Logseq restarted db-worker-node, but the replacement still \
                   reports a different revision. Check the installed Logseq \
                   build and retry"
                (Edn_util.keyword_t "server-revision-mismatch-after-restart")
                "db-worker-node revision still does not match after restart"))
          (config ())
      in
      expect_named_contains "revision mismatch error" revision_error
        "Error (server-revision-mismatch-after-restart):");

  test "CLI parity format query and show outputs keep current raw contracts"
    (fun () ->
      let query_output =
        Format_types.format_result
          (Cli_result.ok ~command:Command_id.Query Output.Mode.Human
             (Cli_result.Query_result
                (Edn_util.map
                   [
                     ( Edn_util.keyword "result",
                       Edn_util.vector
                         [
                           Edn_util.int64 1L;
                           Edn_util.int64 2L;
                           Edn_util.int64 3L;
                         ] );
                   ])))
          (config ())
      in
      expect_equal "query scalar vector lines" "1\n2\n3" query_output;
      let show_output =
        Format_types.format_result
          (Cli_result.ok ~command:Command_id.Show Output.Mode.Human
             (Cli_result.Message "Line 1\nLine 2"))
          (config ())
      in
      expect_equal "show text payload" "Line 1\nLine 2" show_output)

let touch = ()
