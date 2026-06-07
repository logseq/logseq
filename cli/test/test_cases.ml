open Test_support

let () =
  Jest.describe "Melange CLI" (fun () ->
      Jest.test "--help prints usage and commands" (fun () ->
          let output = run_cli [ "--help" ] in
          assert_includes "help" output "Usage");

      Jest.test "--version prints binary name" (fun () ->
          let output = run_cli [ "--version" ] in
          assert_includes "version" output "logseq-cli"))

let () =
  Jest.describe "CLI integration without server" (fun () ->
      Jest.test "sync download requires an explicit graph" (fun () ->
          let root = temp_dir "logseq-cli-sync-download-graph-" in
          try
            write_file (Node.Path.join [| root; "current-graph" |]) "fallback-current";
            write_file (Node.Path.join [| root; "cli.edn" |]) "{:graph \"fallback-file\"}\n";
            let result =
              spawn_cli
                ~env:[| ("LOGSEQ_CLI_GRAPH", "fallback-env") |]
                [ "--root-dir"; root; "sync"; "download" ]
            in
            remove_tree root;
            match assert_exit_non_zero "sync download without --graph" result with
            | (_ : Jest.assertion) ->
              assert_includes
                "sync download missing graph"
                result##stdout
                "graph name is required"
          with exn ->
            remove_tree root;
            raise exn);

      Jest.test "graph commands require explicit unicode graph names" (fun () ->
          let root = temp_dir "logseq-cli-graph-unicode-" in
          let graph = decode_uri_component "%E5%95%8A%E5%95%8A%E5%95%8A%E5%95%8A" in
          let fallback_graph = "fallback-env" in
          let encoded_graph_dir = "~E5~95~8A~E5~95~8A~E5~95~8A~E5~95~8A" in
          let run ?(env = [||]) args = spawn_cli ~env ("--root-dir" :: root :: args) in
          try
            mkdir_p root;
            write_file (Node.Path.join [| root; "current-graph" |]) "fallback-current";
            write_file (Node.Path.join [| root; "cli.edn" |]) "{:graph \"fallback-file\"}\n";
            let create_without_graph =
              run ~env:[| ("LOGSEQ_CLI_GRAPH", fallback_graph) |] [ "graph"; "create" ]
            in
            ignore (assert_exit_non_zero "graph create without -g" create_without_graph);
            ignore
              (assert_includes
                 "graph create without -g"
                 create_without_graph##stdout
                 "graph name is required");
            if Node.Fs.existsSync (Node.Path.join [| root; "graphs"; fallback_graph |]) then
              raise (Failure "graph create without -g created fallback graph");
            let create_fallback = run [ "graph"; "create"; "-g"; fallback_graph ] in
            ignore (assert_exit_zero "fallback graph create" create_fallback);
            let switch_without_graph =
              run ~env:[| ("LOGSEQ_CLI_GRAPH", fallback_graph) |] [ "graph"; "switch" ]
            in
            ignore (assert_exit_non_zero "graph switch without -g" switch_without_graph);
            ignore
              (assert_includes
                 "graph switch without -g"
                 switch_without_graph##stdout
                 "graph name is required");
            let remove_without_graph =
              run ~env:[| ("LOGSEQ_CLI_GRAPH", fallback_graph) |] [ "graph"; "remove" ]
            in
            ignore (assert_exit_non_zero "graph remove without -g" remove_without_graph);
            ignore
              (assert_includes
                 "graph remove without -g"
                 remove_without_graph##stdout
                 "graph name is required");
            if not (Node.Fs.existsSync (Node.Path.join [| root; "graphs"; fallback_graph |])) then
              raise (Failure "graph remove without -g removed fallback graph");
            let create = run [ "graph"; "create"; "-g"; graph ] in
            ignore (assert_exit_zero "graph create" create);
            ignore (assert_includes "graph create" create##stdout graph);
            let graph_dirs = Node.Fs.readdirSync (Node.Path.join [| root; "graphs" |]) in
            if not (Array.exists (( = ) encoded_graph_dir) graph_dirs) then
              raise
                (Failure
                   (Printf.sprintf
                      "graph dir: expected %s, got [%s]"
                      encoded_graph_dir
                      (String.concat ", " (Array.to_list graph_dirs))));
            let human_list = run [ "graph"; "list" ] in
            ignore (assert_exit_zero "human graph list" human_list);
            ignore (assert_includes "human graph list" human_list##stdout graph);
            let json_list = run [ "--output"; "json"; "graph"; "list" ] in
            ignore (assert_exit_zero "json graph list" json_list);
            remove_tree root;
            expect_graph_in_json_list json_list##stdout graph
          with exn ->
            remove_tree root;
            raise exn);

      Jest.test "login times out without socket fallback" (fun () ->
          let root = temp_dir "logseq-cli-login-" in
          let config_path = Node.Path.join [| root; "cli.edn" |] in
          try
            write_file config_path "{:open-browser false :login-timeout-ms 1}\n";
            let result =
              spawn_cli [ "--root-dir"; root; "--config"; config_path; "login" ]
            in
            remove_tree root;
            ignore (assert_exit_non_zero "login without callback" result);
            ignore (assert_not_includes "login stdout socket fallback" result##stdout "sockets are unavailable");
            ignore (assert_not_includes "login stderr socket fallback" result##stderr "sockets are unavailable");
            if
              (String.contains result##stdout 'l'
               && Js.String.includes ~search:"login callback timed out" result##stdout)
              || (String.contains result##stderr 'l'
                  && Js.String.includes ~search:"login callback timed out" result##stderr)
            then
              Jest.pass
            else
              fail_test
                (Printf.sprintf
                   "expected login callback timeout\n%s\n%s"
                   result##stdout
                   result##stderr)
          with exn ->
            remove_tree root;
            raise exn))

let () =
  Jest.describe "CLI integration with fake server" (fun () ->
      Jest.testPromise "graph info formats kv metadata" (fun () ->
          let root = temp_dir "logseq-cli-graph-info-" in
          let request_count = ref 0 in
          let result_transit =
            "[\"~#set\",[[\"~:logseq.kv/graph-created-at\",1700000000],[\"~:logseq.kv/schema-version\",77],[\"~:logseq.kv/custom\",\"demo\"]]]"
          in
          let server =
            invoke_server
              (fun body ->
                incr request_count;
                if not (Js.String.includes ~search:"thread-api/q" body) then
                  raise (Failure ("unexpected invoke method: " ^ body));
                if not (Js.String.includes ~search:"logseq_db_alpha" body) then
                  raise (Failure ("missing repo in request: " ^ body));
                if not (Js.String.includes ~search:"logseq.kv" body) then
                  raise (Failure ("missing graph info query namespace: " ^ body));
                result_transit)
          in
          with_server server (fun base_url ->
              let env = [| ("LOGSEQ_CLI_BASE_URL", base_url) |] in
              let* human =
                run_cli_p
                  ~env
                  [ "--root-dir"; root; "--graph"; "alpha"; "graph"; "info" ]
              in
              ignore (assert_cli_exit_zero "human graph info" human);
              ignore (assert_includes "human graph" human.stdout "graph");
              ignore (assert_includes "human schema" human.stdout "logseq.kv/schema-version    77");
              ignore (assert_includes "human created" human.stdout "ago");
              ignore (assert_line_starts_with "human custom kv row" human.stdout "logseq.kv/custom");
              ignore (assert_not_includes "human created fallback" human.stdout "ms ago");
              ignore (assert_not_includes "human unreasonable created seconds" human.stdout "56 years");
              ignore (assert_not_includes "human no field header" human.stdout "Field");
              ignore (assert_not_includes "human no value header" human.stdout "Value");
              ignore (assert_not_includes "human no kv aggregate" human.stdout "kv     {");
              ignore (assert_not_includes "human missing created" human.stdout "logseq.kv/graph-created-at  -");
              ignore (assert_not_includes "human empty kv" human.stdout "kv     {}");
              let* json =
                run_cli_p
                  ~env
                  [ "--root-dir"; root; "--graph"; "alpha"; "--output"; "json"; "graph"; "info" ]
              in
              ignore (assert_cli_exit_zero "json graph info" json);
              ignore (assert_includes "json created" json.stdout "\"logseq.kv/graph-created-at\":1700000000");
              ignore (assert_includes "json schema" json.stdout "\"logseq.kv/schema-version\":77");
              ignore (assert_includes "json kv" json.stdout "\"logseq.kv/custom\":\"demo\"");
              remove_tree root;
              if !request_count = 2 then Js.Promise.resolve Jest.pass
              else Js.Promise.reject (Failure (Printf.sprintf "expected two graph info requests, got %d" !request_count))));

      Jest.testPromise "list page human output formats timestamps for large result sets" (fun () ->
          let request_count = ref 0 in
          let row index =
            Printf.sprintf
              "{\"~:db/id\":%d,\"~:block/title\":%s,\"~:db/ident\":%s,\"~:logseq.property/type\":\"node\",\"~:block/created-at\":%d,\"~:block/updated-at\":%d}"
              (index + 1)
              (Js.Json.stringify
                 (Js.Json.string
                    (Printf.sprintf "Page %d with enough text for table formatting" (index + 1))))
              (Js.Json.stringify
                 (Js.Json.string
                    (Printf.sprintf "~:user.property/Page-%d-performance-check" (index + 1))))
              (1700000000000 + index)
              (1780411164893 + index)
          in
          let result_transit =
            "[" ^ String.concat "," (List.init 700 row) ^ "]"
          in
          let server =
            invoke_server
              (fun body ->
                incr request_count;
                if not (Js.String.includes ~search:"thread-api/cli-list-pages" body) then
                  raise (Failure ("unexpected invoke method: " ^ body));
                result_transit)
          in
          with_server server (fun base_url ->
              let* output =
                run_cli_p
                  ~env:[| ("LOGSEQ_CLI_BASE_URL", base_url) |]
                  [ "--graph"; "alpha"; "list"; "page" ]
              in
              ignore (assert_cli_exit_zero "list page human" output);
              if !request_count <> 1 then
                Js.Promise.reject
                  (Failure (Printf.sprintf "expected one request, got %d" !request_count))
              else (
                ignore (assert_not_includes "created timestamp raw" output.stdout "1700000000000");
                ignore (assert_not_includes "updated timestamp raw" output.stdout "1780411164893");
                ignore (assert_not_includes "zero years output" output.stdout "zero years");
                ignore (assert_includes "count footer" output.stdout "Count: 700");
                Js.Promise.resolve Jest.pass)));

      Jest.testPromise "list asset human output keeps asset columns stable" (fun () ->
          let request_count = ref 0 in
          let result_transit =
            "[{\"~:block/updated-at\":1779715760691,\"~:logseq.property.asset/checksum\":\"abc123\",\"~:logseq.property.asset/size\":4096,\"~:block/title\":\"logo.png\",\"~:block/created-at\":1777063533827,\"~:db/id\":10,\"~:logseq.property.asset/type\":\"png\"}]"
          in
          let server =
            invoke_server
              (fun body ->
                incr request_count;
                match !request_count with
                | 1
                  when Js.String.includes ~search:"thread-api/pull" body
                       && Js.String.includes ~search:"logseq.class/Asset" body ->
                  "[\"^ \",\"~:db/id\",77]"
                | 2 -> result_transit
                | _ ->
                  raise
                    (Failure
                       (Printf.sprintf "unexpected request %d: %s" !request_count body)))
          in
          let root = temp_dir "logseq-cli-list-asset-" in
          with_server server (fun base_url ->
              let* output =
                run_cli_p
                  ~env:[| ("LOGSEQ_CLI_BASE_URL", base_url) |]
                  [ "--root-dir"; root; "--graph"; "alpha"; "list"; "asset" ]
              in
              remove_tree root;
              ignore (assert_cli_exit_zero "list asset" output);
              if !request_count <> 2 then
                Js.Promise.reject
                  (Failure (Printf.sprintf "expected two requests, got %d" !request_count))
              else
                let headers = headers_from output.stdout in
                let expected_prefix =
                  [| "db/id"
                   ; "block/title"
                   ; "logseq.property.asset/size"
                   ; "logseq.property.asset/type"
                  |]
                in
                let expected_suffix = [| "block/created-at"; "block/updated-at" |] in
                if not (string_array_equal (array_prefix headers (Array.length expected_prefix)) expected_prefix) then
                  Js.Promise.reject
                    (Failure ("unexpected asset header prefix: " ^ String.concat "," (Array.to_list headers)))
                else if
                  not (string_array_equal (array_suffix headers (Array.length expected_suffix)) expected_suffix)
                then
                  Js.Promise.reject
                    (Failure ("unexpected asset header suffix: " ^ String.concat "," (Array.to_list headers)))
                else if not (Array.exists (( = ) "logseq.property.asset/checksum") headers) then
                  Js.Promise.reject (Failure ("missing middle asset column:\n" ^ output.stdout))
                else if Array.exists (( = ) "node/type") headers then
                  Js.Promise.reject (Failure ("asset output must not render node/type:\n" ^ output.stdout))
                else
                  Js.Promise.resolve Jest.pass));

      Jest.testPromise "list page human output aligns ragged property rows" (fun () ->
          let request_count = ref 0 in
          let title = decode_uri_component "%E4%B8%AD%E6%96%87%E5%9B%BE%E8%B0%B1Alpha" in
          let truncated_title = decode_uri_component "%E4%B8%AD%E6%96%87%E2%80%A6" in
          let result_transit =
            "["
            ^ String.concat
                ","
                [ Printf.sprintf
                    "{\"~:db/id\":1,\"~:block/title\":\"Plain\",\"~:block/created-at\":1777063533827,\"~:block/updated-at\":1779715760691}"
                ; "{\"~:db/id\":2,\"~:block/title\":\"Property\",\"~:block/created-at\":1733130109047,\"~:block/updated-at\":1779543495725,\"~:db/ident\":\"~:user.property/Assignee-Xf-emnkZ\",\"~:logseq.property/type\":\"node\"}"
                ; Printf.sprintf
                    "{\"~:db/id\":3,\"~:block/title\":%s,\"~:block/created-at\":1700000000000,\"~:block/updated-at\":1700000000000}"
                    (Js.Json.stringify (Js.Json.string title))
                ]
            ^ "]"
          in
          let server =
            invoke_server
              (fun _body ->
                incr request_count;
                result_transit)
          in
          let root = temp_dir "logseq-cli-ragged-" in
          write_file (Node.Path.join [| root; "cli.edn" |]) "{:list-title-max-display-width 6}";
          with_server server (fun base_url ->
              let* output =
                run_cli_p
                  ~env:[| ("LOGSEQ_CLI_BASE_URL", base_url) |]
                  [ "--root-dir"; root; "--graph"; "alpha"; "list"; "page" ]
              in
              remove_tree root;
              ignore (assert_cli_exit_zero "list page ragged" output);
              if !request_count <> 1 then
                Js.Promise.reject
                  (Failure (Printf.sprintf "expected one request, got %d" !request_count))
              else (
                ignore (assert_includes "db ident" output.stdout "user.property/Assignee-Xf-emnkZ");
                ignore (assert_not_includes "property type column" output.stdout "logseq.property/type");
                ignore (assert_not_includes "node type value" output.stdout "node");
                ignore (assert_includes "display-width truncation" output.stdout truncated_title);
                ignore (assert_not_includes "full title" output.stdout title);
                ignore (assert_created_at_column_aligned output.stdout);
                ignore (assert_includes "ragged placeholder" output.stdout "-");
                Js.Promise.resolve Jest.pass)));

      Jest.testPromise "graph backup writes sqlite bytes and metadata" (fun () ->
          let root = temp_dir "logseq-cli-graph-backup-" in
          let backup_requests = ref 0 in
          let server =
            invoke_server
              (fun body ->
                if not (Js.String.includes ~search:"thread-api/backup-db-sqlite" body) then
                  raise (Failure ("unexpected invoke body: " ^ body));
                let snapshot_path = extract_snapshot_path body in
                let expected_root = Node.Path.join [| root; "graphs"; "alpha"; "backup" |] in
                if not (Js.String.includes ~search:expected_root snapshot_path) then
                  raise (Failure ("unexpected snapshot path: " ^ snapshot_path));
                mkdir_p (Node.Path.dirname snapshot_path);
                write_file snapshot_path "sqlite-bytes";
                incr backup_requests;
                "true")
          in
          with_server server (fun base_url ->
              let* output =
                run_cli_p
                  ~env:[| ("LOGSEQ_CLI_BASE_URL", base_url) |]
                  [ "--root-dir"
                  ; root
                  ; "--graph"
                  ; "alpha"
                  ; "--output"
                  ; "json"
                  ; "graph"
                  ; "backup"
                  ; "create"
                  ; "--name"
                  ; "nightly"
                  ]
              in
              let finish_with_error message =
                remove_tree root;
                Js.Promise.reject (Failure message)
              in
              if output.code <> 0 then
                finish_with_error
                  (Printf.sprintf
                     "expected CLI graph backup to exit 0, got %d\n%s\n%s"
                     output.code
                     output.stdout
                     output.stderr)
              else if !backup_requests <> 1 then
                finish_with_error
                  (Printf.sprintf "expected one backup request, got %d" !backup_requests)
              else if
                not
                  (Js.String.includes ~search:"\"backup-name\":\"alpha-nightly-" output.stdout
                   && Js.String.includes ~search:"\"path\":\"" output.stdout)
              then
                finish_with_error ("expected backup result json\n" ^ output.stdout)
              else
                let backup_root = Node.Path.join [| root; "graphs"; "alpha"; "backup" |] in
                let backups = Node.Fs.readdirSync backup_root in
                if Array.length backups <> 1 then
                  finish_with_error
                    (Printf.sprintf "expected one backup directory, got %d" (Array.length backups))
                else
                  let backup_dir = Node.Path.join [| backup_root; backups.(0) |] in
                  if read_file (Node.Path.join [| backup_dir; "db.sqlite" |]) <> "sqlite-bytes" then
                    finish_with_error "expected sqlite backup bytes"
                  else if
                    not
                      (Js.String.includes
                         ~search:":source :cli"
                         (read_file (Node.Path.join [| backup_dir; "metadata.edn" |])))
                  then
                    finish_with_error "expected backup metadata"
                  else (
                    remove_tree root;
                    Js.Promise.resolve Jest.pass)));

      Jest.testPromise "upsert asset copies file and sends asset metadata" (fun () ->
          let root = temp_dir "logseq-cli-upsert-asset-" in
          let source_path = Node.Path.join [| root; "logo.png" |] in
          let expected_checksum =
            "d59386e0ae435e292fbe0ebcdb954b75ed5fb3922091277cb19f798fc5d50718"
          in
          write_file source_path "asset";
          let step = ref 0 in
          let server =
            invoke_server
              (fun body ->
                incr step;
                match !step with
                | 1
                  when Js.String.includes ~search:"thread-api/pull" body
                       && Js.String.includes ~search:"logseq.class/Asset" body ->
                  "[\"^ \",\"~:db/id\",77]"
                | 2
                  when Js.String.includes ~search:"thread-api/q" body
                       && Js.String.includes ~search:"home" body ->
                  "[\"~#list\",[[\"^ \",\"~:db/id\",1,\"~:block/uuid\",\"~u11111111-1111-1111-1111-111111111111\",\"~:block/name\",\"home\"]]]"
                | 3 when Js.String.includes ~search:"thread-api/apply-outliner-ops" body ->
                  if not (Js.String.includes ~search:expected_checksum body) then
                    raise (Failure "missing asset checksum");
                  if
                    not
                      (Js.String.includes ~search:"logseq.property.asset/type" body
                       && Js.String.includes ~search:"png" body)
                  then
                    raise (Failure "missing asset type metadata");
                  "[]"
                | 4 when Js.String.includes ~search:"thread-api/pull" body ->
                  "[\"^ \",\"~:db/id\",10]"
                | _ ->
                  raise
                    (Failure
                       (Printf.sprintf "unexpected request at step %d: %s" !step body)))
          in
          with_server server (fun base_url ->
              let* output =
                run_cli_p
                  ~env:[| ("LOGSEQ_CLI_BASE_URL", base_url) |]
                  [ "--root-dir"
                  ; root
                  ; "--graph"
                  ; "alpha"
                  ; "--output"
                  ; "json"
                  ; "upsert"
                  ; "asset"
                  ; "--path"
                  ; source_path
                  ; "--target-page"
                  ; "Home"
                  ; "--content"
                  ; "Logo"
                  ]
              in
              let finish_with_error message =
                remove_tree root;
                Js.Promise.reject (Failure message)
              in
              if output.code <> 0 then
                finish_with_error
                  (Printf.sprintf
                     "expected CLI upsert asset to exit 0, got %d\n%s\n%s"
                     output.code
                     output.stdout
                     output.stderr)
              else if !step <> 4 then
                finish_with_error
                  (Printf.sprintf "expected four invoke requests, got %d" !step)
              else if
                not
                  (Js.String.includes
                     ~search:"{\"status\":\"ok\",\"data\":{\"result\":[10]}}"
                     output.stdout)
              then
                finish_with_error ("expected success json output\n" ^ output.stdout)
              else
                let assets_dir = Node.Path.join [| root; "graphs"; "alpha"; "assets" |] in
                let copied =
                  if Node.Fs.existsSync assets_dir then Node.Fs.readdirSync assets_dir else [||]
                in
                if Array.length copied <> 1 then
                  finish_with_error
                    (Printf.sprintf "expected one copied asset, got %d" (Array.length copied))
                else if read_file (Node.Path.join [| assets_dir; copied.(0) |]) <> "asset" then
                  finish_with_error "expected copied asset content"
                else (
                  remove_tree root;
                  Js.Promise.resolve Jest.pass)));

      Jest.testPromise "show human tree preserves multiline guides and linked references" (fun () ->
          let responses =
            [| ( "thread-api/pull"
               , "[\"^ \",\"~:db/id\",16764,\"~:block/title\",\"type system to strengthen codebase examples\",\"~:block/name\",\"type system to strengthen codebase examples\"]"
               )
             ; ( "thread-api/q"
               , "[[[\"^ \",\"~:db/id\",16766,\"~:block/title\",\"use type system to ensure block validated, graph-name validated, etc..\",\"~:block/order\",\"a\",\"~:block/parent\",[\"^ \",\"~:db/id\",16764]]],[[\"^ \",\"~:db/id\",16767,\"~:block/title\",\"module type Block : sig\\ntype raw\\ntype validated\\n\\ntype _ t\\n\\nval of_edn : Edn.t -> raw t\\nval validate : raw t -> (validated t, string list) result\\n\\nval uuid : validated t -> Uuidm.t\\nval db_id : validated t -> Db_id.t\\nval title : validated t -> string option\\nval journal_day : validated t -> Journal_day.t option\\nend #Code\",\"~:block/order\",\"b\",\"~:block/parent\",[\"^ \",\"~:db/id\",16766]]],[[\"^ \",\"~:db/id\",16768,\"~:block/title\",\"split block into raw & validated 2 types, all fns need to operate on blocks only accept `validated block`\",\"~:block/order\",\"c\",\"~:block/parent\",[\"^ \",\"~:db/id\",16764]]],[[\"^ \",\"~:db/id\",16769,\"~:block/title\",\"-\",\"~:block/order\",\"d\",\"~:block/parent\",[\"^ \",\"~:db/id\",16764]]]]"
               )
             ; ("thread-api/get-block-refs", "[[\"^ \",\"~:db/id\",16763]]")
             ; ( "thread-api/pull"
               , "[\"^ \",\"~:db/id\",16763,\"~:block/title\",\"[[type system to strengthen codebase examples]]\",\"~:block/page\",[\"^ \",\"~:db/id\",16760,\"~:block/title\",\"May 31st, 2026\",\"~:block/name\",\"may 31st, 2026\"]]"
               )
            |]
          in
          let index = ref 0 in
          let server =
            invoke_server
              (fun body ->
                if !index >= Array.length responses then
                  raise (Failure ("unexpected extra request: " ^ body));
                let method_, transit = responses.(!index) in
                incr index;
                if not (Js.String.includes ~search:method_ body) then
                  raise (Failure (Printf.sprintf "expected %s, got %s" method_ body));
                transit)
          in
          with_server server (fun base_url ->
              let* output =
                run_cli_p
                  ~env:[| ("LOGSEQ_CLI_BASE_URL", base_url) |]
                  [ "--graph"; "alpha"; "show"; "--id"; "16764" ]
              in
              ignore (assert_cli_exit_zero "show human tree" output);
              if !index <> Array.length responses then
                Js.Promise.reject
                  (Failure
                     (Printf.sprintf
                        "handled %d requests, expected %d"
                        !index
                        (Array.length responses)))
              else (
                ignore (assert_not_includes "multiline raw prefix" output.stdout "\ntype raw\n");
                ignore
                  (assert_includes
                     "multiline tree context"
                     output.stdout
                     "\n      │       type raw\n");
                ignore
                  (assert_includes
                     "blank multiline tree guide"
                     output.stdout
                     "\n      │\n      │       type _ t\n");
                ignore
                  (assert_includes
                     "linked reference page context"
                     output.stdout
                     "Linked References (1)\n16760 May 31st, 2026\n16763 └── [[type system to strengthen codebase examples]]");
                Js.Promise.resolve Jest.pass)));

      Jest.testPromise "show human properties renders task status and property values" (fun () ->
          let saw_status_selector = ref false in
          let saw_wildcard_selector = ref false in
          let index = ref 0 in
          let static_transits =
            [| "[\"^ \",\"~:db/id\",1,\"~:block/title\",\"Home\",\"~:block/name\",\"home\"]"
             ; ""
             ; "[\"^ \",\"~:db/id\",7,\"~:db/ident\",\"~:user.property/owner\",\"~:block/title\",\"Owner\",\"~:logseq.property/type\",\"~:default\"]"
             ; "[\"^ \",\"~:db/id\",8,\"~:db/ident\",\"~:user.property/agent-skills\",\"~:block/title\",\"agent-skills\",\"~:logseq.property/type\",\"~:default\"]"
             ; "[\"^ \",\"~:db/id\",16,\"~:db/ident\",\"~:user.property/reproducible-steps\",\"~:block/title\",\"Reproducible steps\",\"~:logseq.property/type\",\"~:default\"]"
             ; "[\"^ \",\"~:db/id\",17,\"~:db/ident\",\"~:user.property/empty-list\",\"~:block/title\",\"empty-list\",\"~:logseq.property/type\",\"~:default\"]"
             ; "[\"^ \",\"~:db/id\",15,\"~:db/ident\",\"~:logseq.property/assignee\",\"~:block/title\",\"Assignee\",\"~:logseq.property/type\",\"~:default\"]"
             ; "[\"^ \",\"~:db/id\",19,\"~:db/ident\",\"~:logseq.property/reviewer\",\"~:block/title\",\"Reviewer\",\"~:logseq.property/type\",\"~:default\"]"
             ; "[\"^ \",\"~:db/id\",9,\"~:block/title\",\"Alice\"]"
             ; "[\"^ \",\"~:db/id\",10,\"~:block/title\",\"logseq-answer-machine\"]"
             ; "[\"^ \",\"~:db/id\",11,\"~:logseq.property/value\",\"Type `[[assig` and only see [[Assignee(legacy)]]\"]"
             ; "[\"^ \",\"~:db/id\",12,\"~:logseq.property/value\",\"Expect to see two entries\"]"
             ; "[\"^ \",\"~:db/id\",13,\"~:logseq.property/value\",\"Expected to see the built-in property\"]"
             ; "[\"^ \",\"~:db/id\",14,\"~:block/title\",\"czys-Mac-Studio.local\"]"
             ; "[\"^ \",\"~:db/id\",18,\"~:block/title\",\"general-reviewer.local\"]"
            |]
          in
          let expected_methods =
            [| "thread-api/pull"
             ; "thread-api/q"
             ; "thread-api/pull"
             ; "thread-api/pull"
             ; "thread-api/pull"
             ; "thread-api/pull"
             ; "thread-api/pull"
             ; "thread-api/pull"
             ; "thread-api/pull"
             ; "thread-api/pull"
             ; "thread-api/pull"
             ; "thread-api/pull"
             ; "thread-api/pull"
             ; "thread-api/pull"
             ; "thread-api/pull"
            |]
          in
          let q_transit body =
            saw_status_selector := Js.String.includes ~search:"~:logseq.property/status" body;
            saw_wildcard_selector := Js.String.includes ~search:"~$*" body;
            let child_fields =
              ref
                [ "\"~:db/id\",2"
                ; "\"~:block/title\",\"Ship CLI\""
                ; "\"~:block/order\",\"a\""
                ; "\"~:block/parent\",[\"^ \",\"~:db/id\",1]"
                ; "\"~:block/tags\",[[\"^ \",\"~:db/ident\",\"~:logseq.class/Task\",\"~:block/title\",\"Task\"]]"
                ]
            in
            if !saw_status_selector then
              child_fields :=
                !child_fields
                @ [ "\"~:logseq.property/status\",[\"^ \",\"~:db/ident\",\"~:logseq.property/status.todo\",\"~:block/title\",\"Todo\"]" ];
            if !saw_wildcard_selector then
              child_fields :=
                !child_fields
                @ [ "\"~:user.property/owner\",[\"~:db/id\",9]"
                  ; "\"~:user.property/agent-skills\",[[ \"~:db/id\",10 ]]"
                  ; "\"~:user.property/reproducible-steps\",[\"~:db/id\",11,[\"~:db/id\",12],[\"~:db/id\",13]]"
                  ; "\"~:user.property/empty-list\",[]"
                  ; "\"~:logseq.property/assignee\",[[\"~:db/id\",14]]"
                  ; "\"~:logseq.property/reviewer\",[[\"~:db/id\",18]]"
                  ];
            "[[[\"^ \"," ^ String.concat "," !child_fields ^ "]]]"
          in
          let server =
            invoke_server
              (fun body ->
                if !index >= Array.length expected_methods then
                  raise (Failure ("unexpected extra request: " ^ body));
                let expected_method = expected_methods.(!index) in
                if not (Js.String.includes ~search:expected_method body) then
                  raise (Failure (Printf.sprintf "expected %s, got %s" expected_method body));
                let current = !index in
                incr index;
                if current = 1 then q_transit body else static_transits.(current))
          in
          with_server server (fun base_url ->
              let* output =
                run_cli_p
                  ~env:[| ("LOGSEQ_CLI_BASE_URL", base_url) |]
                  [ "--graph"; "alpha"; "show"; "--page"; "home"; "--linked-references=false" ]
              in
              ignore (assert_cli_exit_zero "show human properties" output);
              if not !saw_status_selector then
                Js.Promise.reject (Failure "show tree selector did not request task status")
              else if not !saw_wildcard_selector then
                Js.Promise.reject (Failure "show tree selector did not request custom properties")
              else if !index <> Array.length expected_methods then
                Js.Promise.reject
                  (Failure
                     (Printf.sprintf
                        "handled %d requests, expected %d"
                        !index
                        (Array.length expected_methods)))
              else (
                ignore (assert_includes "task status" output.stdout "2 └── Todo Ship CLI #Task");
                ignore (assert_includes "owner property" output.stdout "  Owner: Alice");
                ignore
                  (assert_includes
                     "single cardinality-many property"
                     output.stdout
                     "agent-skills: logseq-answer-machine");
                ignore
                  (assert_includes
                     "multi-value property bullets"
                     output.stdout
                     "Reproducible steps:\n        - Type `[[assig` and only see [[Assignee(legacy)]]\n        - Expect to see two entries\n        - Expected to see the built-in property");
                ignore (assert_not_includes "empty list property" output.stdout "empty-list");
                ignore
                  (assert_includes
                     "assignee property"
                     output.stdout
                     "Assignee: czys-Mac-Studio.local");
                ignore
                  (assert_includes
                     "reviewer property"
                     output.stdout
                     "Reviewer: general-reviewer.local");
                ignore (assert_not_includes "db id leak" output.stdout ":db/id");
                Js.Promise.resolve Jest.pass)));

      let sync_graph_id = "11111111-1111-1111-1111-111111111111" in
      let sync_remote_graph_transit =
        "[[\"^ \",\"~:graph-name\",\"alpha\",\"~:graph-id\",\"~u"
        ^ sync_graph_id
        ^ "\",\"~:graph-e2ee?\",false]]"
      in
      let sync_invoke_response download_requests body =
        if Js.String.includes ~search:"thread-api/set-db-sync-config" body then
          Some "true"
        else if Js.String.includes ~search:"thread-api/db-sync-list-remote-graphs" body then
          Some sync_remote_graph_transit
        else if Js.String.includes ~search:"thread-api/q" body then
          Some "0"
        else if Js.String.includes ~search:"thread-api/db-sync-download-graph-by-id" body then (
          incr download_requests;
          Some "true")
        else
          raise (Failure ("unexpected invoke body: " ^ body))
      in
      let run_sync_progress_case
          name
          root_prefix
          handle_events
          ?(delay_download_response = false)
          assert_progress
          =
        Jest.testPromise name (fun () ->
            let root = temp_dir root_prefix in
            let events_requests = ref 0 in
            let download_requests = ref 0 in
            let server =
              create_server
                (fun [@u] req res ->
                  let body = ref "" in
                  req_set_encoding req "utf8";
                  req_on_data req "data" (fun [@u] chunk -> body := !body ^ chunk);
                  req_on_end req "end" (fun [@u] () ->
                      if req_method req = "GET" && req_url req = "/v1/events" then (
                        incr events_requests;
                        handle_events res)
                      else if req_method req = "POST" && req_url req = "/v1/invoke" then
                        try
                          match sync_invoke_response download_requests !body with
                          | Some result_transit when delay_download_response
                                                && Js.String.includes
                                                     ~search:"thread-api/db-sync-download-graph-by-id"
                                                     !body ->
                            set_timeout
                              (fun [@u] () -> write_json res 200 (json_response result_transit))
                              100
                          | Some result_transit ->
                            write_json res 200 (json_response result_transit)
                          | None -> ()
                        with exn -> write_json res 400 (error_response (Printexc.to_string exn))
                      else
                        write_json res 404 (error_response "not found")))
            in
            with_server server (fun base_url ->
                let* output =
                  run_cli_p
                    ~env:[| ("LOGSEQ_CLI_BASE_URL", base_url) |]
                    [ "--root-dir"
                    ; root
                    ; "--graph"
                    ; "alpha"
                    ; "--output"
                    ; "json"
                    ; "sync"
                    ; "download"
                    ; "--progress"
                    ]
                in
                remove_tree root;
                ignore (assert_cli_exit_zero name output);
                if !events_requests <> 1 then
                  Js.Promise.reject
                    (Failure (Printf.sprintf "expected one events request, got %d" !events_requests))
                else if !download_requests <> 1 then
                  Js.Promise.reject
                    (Failure
                       (Printf.sprintf
                          "expected one download request, got %d"
                          !download_requests))
                else if not (Js.String.includes ~search:"{\"status\":\"ok\",\"data\":{\"result\":true}}" output.stdout) then
                  Js.Promise.reject (Failure ("expected success json output\n" ^ output.stdout))
                else (
                  assert_progress output.stdout;
                  Js.Promise.resolve Jest.pass)))
      in
      run_sync_progress_case
        "sync download prints progress from closed event stream"
        "logseq-cli-sync-progress-"
        (fun res ->
          res_write_head res 200 (Js.Dict.fromArray [| ("Content-Type", "text/event-stream") |]);
          res_end
            res
            ("data: {\"payload\":\"[\\\"~:rtc-log\\\",[\\\"^ \\\",\\\"~:type\\\",\\\"~:rtc.log/download\\\",\\\"~:graph-uuid\\\",\\\"~u"
             ^ sync_graph_id
             ^ "\\\",\\\"~:message\\\",\\\"downloaded 1 block\\\"]]\"}\n\n"))
        (fun stdout -> ignore (assert_includes "progress output" stdout "downloaded 1 block"));

      run_sync_progress_case
        "sync download finishes while event stream stays open"
        "logseq-cli-sync-progress-stream-"
        (fun res ->
          res_write_head res 200 (Js.Dict.fromArray [| ("Content-Type", "text/event-stream") |]);
          let large_sync_payload =
            "[\"~:sync-db-changes\",[\"^ \",\"~:pages\","
            ^ "["
            ^ String.concat
                ","
                (List.init 12000 (fun i ->
                     Printf.sprintf
                       "[\"^ \",\"~:db/id\",%d,\"~:block/title\",\"block %d\"]"
                       i
                       i))
            ^ "]]]"
          in
          res_write
            res
            ("data: "
             ^ "{\"type\":\"sync-db-changes\",\"payload\":"
             ^ Js.Json.stringify (Js.Json.string large_sync_payload)
             ^ "}\n\n");
          res_write
            res
            ("data: {\"payload\":\"[\\\"~:rtc-log\\\",[\\\"^ \\\",\\\"~:type\\\",\\\"~:rtc.log/download\\\",\\\"~:graph-uuid\\\",\\\"~u"
             ^ sync_graph_id
             ^ "\\\",\\\"~:message\\\",\\\"downloaded streaming block\\\"]]\"}\n\n"))
        (fun stdout ->
          ignore (assert_includes "streaming progress output" stdout "downloaded streaming block"));

      run_sync_progress_case
        "sync download survives event stream disconnect"
        "logseq-cli-sync-progress-disconnect-"
        ~delay_download_response:true
        (fun res ->
          res_write_head res 200 (Js.Dict.fromArray [| ("Content-Type", "text/event-stream") |]);
          res_write
            res
            ("data: {\"payload\":\"[\\\"~:rtc-log\\\",[\\\"^ \\\",\\\"~:type\\\",\\\"~:rtc.log/download\\\",\\\"~:graph-uuid\\\",\\\"~u"
             ^ sync_graph_id
             ^ "\\\",\\\"~:message\\\",\\\"download started\\\"]]\"}\n\n");
          set_timeout (fun [@u] () -> res_destroy res) 20)
        (fun _stdout -> ());

      Jest.testPromise "agent bridge keeps codex alive and forwards worker env" (fun () ->
          let tmp = temp_dir "logseq-cli-agent-" in
          let config_path = Node.Path.join [| tmp; "cli.edn" |] in
          let codex_bin = Node.Path.join [| tmp; "fake-codex" |] in
          let marker_path = Node.Path.join [| tmp; "codex-marker.txt" |] in
          let worker_script = "/tmp/logseq-cli-test-db-worker-node.js" in
          let fake_codex_js = Node.Path.join [| current_dirname; "fake_codex.js" |] in
          write_file
            codex_bin
            ("#!/bin/sh\nexec "
             ^ Node.Process.argv.(0)
             ^ " "
             ^ fake_codex_js
             ^ " \"$@\"\n");
          chmod_sync codex_bin 0o755;
          write_file
            config_path
            ("{:agent-name \"agent-a\" :codex-bin \"" ^ codex_bin ^ "\"}");
          let registry_page =
            "{\"~:db/id\":100,\"~:block/uuid\":\"~uaaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa\",\"~:block/name\":\"agentbridge\",\"~:block/title\":\"AgentBridge\"}"
          in
          let agent_page =
            "{\"~:db/id\":101,\"~:block/uuid\":\"~ubbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb\",\"~:block/name\":\"agent-a\",\"~:block/title\":\"agent-a\"}"
          in
          let master_block =
            "{\"~:db/id\":110,\"~:block/uuid\":\"~ucccccccc-cccc-4ccc-8ccc-cccccccccccc\",\"~:block/title\":\"AgentBridge master prompt\",\"~:block/order\":1,\"~:block/_parent\":[{\"~:db/id\":111,\"~:block/title\":\"Graph master prompt\",\"~:block/order\":1,\"~:block/tags\":[{\"~:db/ident\":\"~:logseq.class/Code-block\"}]}]}"
          in
          let responses =
            [| registry_page; agent_page; agent_page; master_block; registry_page; ""; "" |]
          in
          let post_index = ref 0 in
          let event_response = ref None in
          let server =
            create_server
              (fun [@u] req res ->
                let body = ref "" in
                req_set_encoding req "utf8";
                req_on_data req "data" (fun [@u] chunk -> body := !body ^ chunk);
                req_on_end req "end" (fun [@u] () ->
                    if req_method req = "GET" && req_url req = "/v1/events" then (
                      res_write_head
                        res
                        200
                        (Js.Dict.fromArray [| ("Content-Type", "text/event-stream") |]);
                      res_write res "\n";
                      event_response := Some res)
                    else if req_method req <> "POST" || req_url req <> "/v1/invoke" then
                      write_json
                        res
                        400
                        (error_response ("unexpected " ^ req_method req ^ " " ^ req_url req))
                    else if !post_index >= Array.length responses then
                      write_json res 400 (error_response ("unexpected extra request: " ^ !body))
                    else
                      let transit = responses.(!post_index) in
                      incr post_index;
                      let result_transit = if transit = "" then "[]" else "[" ^ transit ^ "]" in
                      write_json res 200 (json_response result_transit)))
          in
          with_server server (fun base_url ->
              Js.Promise.make
                (fun ~resolve ~reject ->
                  let child =
                    spawn_cli_async
                      ~env:
                        [| ("LOGSEQ_CLI_BASE_URL", base_url)
                         ; ("LOGSEQ_DB_WORKER_NODE_SCRIPT", worker_script)
                         ; ("AGENT_BRIDGE_TEST_MARKER", marker_path)
                        |]
                      [ "--root-dir"
                      ; tmp
                      ; "--config"
                      ; config_path
                      ; "--graph"
                      ; "alpha"
                      ; "agent"
                      ; "bridge"
                      ]
                  in
                  let stdout = ref "" in
                  let stderr = ref "" in
                  let finished = ref false in
                  stream_set_encoding child##stdout "utf8";
                  stream_set_encoding child##stderr "utf8";
                  stream_on_data child##stdout "data" (fun [@u] chunk -> stdout := !stdout ^ chunk);
                  stream_on_data child##stderr "data" (fun [@u] chunk -> stderr := !stderr ^ chunk);
                  child_on_error child "error" (fun [@u] exn -> reject exn [@u]);
                  let cleanup_and_resolve value =
                    if not !finished then (
                      finished := true;
                      child_kill child "SIGTERM";
                      Option.iter (fun res -> res_end res "") !event_response;
                      remove_tree tmp;
                      resolve value [@u])
                  in
                  let cleanup_and_reject exn =
                    if not !finished then (
                      finished := true;
                      child_kill child "SIGTERM";
                      Option.iter (fun res -> res_end res "") !event_response;
                      remove_tree tmp;
                      reject exn [@u])
                  in
                  let remaining_attempts = ref 50 in
                  let interval = ref None in
                  let tick () =
                    if Node.Fs.existsSync marker_path then (
                      Option.iter clear_interval !interval;
                      let marker = read_file marker_path in
                      if marker <> worker_script then
                        cleanup_and_reject
                          (Failure
                             ("worker script env was not forwarded: "
                              ^ Js.Json.stringify (Js.Json.string marker)))
                      else if
                        not
                          (Js.String.includes
                             ~search:"Codex master session started: cli-live-session"
                             !stdout)
                      then
                        cleanup_and_reject
                          (Failure
                             (Printf.sprintf
                                "master session log missing:\nstdout:\n%s\nstderr:\n%s"
                                !stdout
                                !stderr))
                      else
                        cleanup_and_resolve Jest.pass)
                    else (
                      decr remaining_attempts;
                      if !remaining_attempts <= 0 then (
                        Option.iter clear_interval !interval;
                        cleanup_and_reject
                          (Failure
                             (Printf.sprintf
                                "fake codex did not stay alive long enough to write marker\nstdout:\n%s\nstderr:\n%s"
                                !stdout
                                !stderr))))
                  in
                  interval := Some (set_interval (fun [@u] () -> tick ()) 100);
                  child_on_exit child "exit" (fun [@u] code ->
                      if (not !finished) && not (Node.Fs.existsSync marker_path) then (
                        Option.iter clear_interval !interval;
                        cleanup_and_reject
                          (Failure
                             (Printf.sprintf
                                "agent bridge exited before fake codex marker; code=%d\nstdout:\n%s\nstderr:\n%s"
                                code
                                !stdout
                                !stderr)))))));

      Jest.testPromise "fetch timeout exits non-zero with timeout message" (fun () ->
          Js.Promise.make
            (fun ~resolve ~reject ->
              let request_count = ref 0 in
              let server =
                create_server
                  (fun [@u] req res ->
                    let body = ref "" in
                    req_set_encoding req "utf8";
                    req_on_data req "data" (fun [@u] chunk -> body := !body ^ chunk);
                    req_on_end req "end" (fun [@u] () ->
                        incr request_count;
                        if not (Js.String.includes ~search:"thread-api/cli-list-pages" !body) then
                          write_json res 400 (error_response "unexpected request")
                        else
                          set_timeout
                            (fun [@u] () -> write_json res 200 (json_response "[]"))
                            500))
              in
              server_listen server 0 "127.0.0.1" (fun [@u] () ->
                  let port = (server_address server)##port in
                  let child =
                    spawn_cli_async
                      ~env:[| ("LOGSEQ_CLI_BASE_URL", Printf.sprintf "http://127.0.0.1:%d" port) |]
                      [ "--timeout-ms"
                      ; "100"
                      ; "--graph"
                      ; "alpha"
                      ; "--output"
                      ; "json"
                      ; "list"
                      ; "page"
                      ]
                  in
                  let stdout = ref "" in
                  let stderr = ref "" in
                  stream_set_encoding child##stdout "utf8";
                  stream_set_encoding child##stderr "utf8";
                  stream_on_data child##stdout "data" (fun [@u] chunk -> stdout := !stdout ^ chunk);
                  stream_on_data child##stderr "data" (fun [@u] chunk -> stderr := !stderr ^ chunk);
                  child_on_error child "error" (fun [@u] exn -> reject exn [@u]);
                  child_on_exit child "exit" (fun [@u] code ->
                      server_close server (fun [@u] () ->
                          try
                            if !request_count <> 1 then
                              raise
                                (Failure
                                   (Printf.sprintf
                                      "expected one request, got %d\n%s\n%s"
                                      !request_count
                                      !stdout
                                      !stderr));
                            if code = 0 then
                              raise (Failure ("expected CLI list page to time out\n" ^ !stdout));
                            if
                              (String.contains !stdout 'r'
                               && Js.String.includes ~search:"request timeout" !stdout)
                              || (String.contains !stderr 'r'
                                  && Js.String.includes ~search:"request timeout" !stderr)
                            then
                              resolve Jest.pass [@u]
                            else
                              raise
                                (Failure
                                   (Printf.sprintf
                                      "expected timeout message\n%s\n%s"
                                      !stdout
                                      !stderr))
                          with exn -> reject exn [@u]))))
            ))


let registered = ()
