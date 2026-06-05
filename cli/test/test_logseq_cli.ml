let tests = ref []
let check name f = tests := Alcotest.test_case name `Quick f :: !tests
let failf = Alcotest.failf
let run_blocking value = Lwt_main.run (Cli_effect.to_lwt value)

let test_sleep_span span =
  Lwt_unix.sleep (Ptime_util.span_to_seconds_float span)

let sleep_ms ms = Lwt_main.run (test_sleep_span (Ptime_util.span_of_ms ms))
let sleep_lwt_ms ms = test_sleep_span (Ptime_util.span_of_ms ms)

let assert_equal ~name expected actual =
  if expected <> actual then
    Alcotest.failf "%s\nexpected and actual differ" name

let assert_int ~name expected actual = Alcotest.(check int) name expected actual

let assert_int64 ~name expected actual =
  Alcotest.(check int64) name expected actual

let assert_bool ~name expected actual =
  Alcotest.(check bool) name expected actual

let assert_opt_int ~name expected actual =
  Alcotest.(check (option int)) name expected actual

let assert_opt_int64 ~name expected actual =
  Alcotest.(check (option int64)) name expected actual

let assert_opt_string ~name expected actual =
  Alcotest.(check (option string)) name expected actual

let assert_contains ~name needle haystack =
  if not (String.contains haystack '\000') then
    let needle_len = String.length needle in
    let haystack_len = String.length haystack in
    let rec loop i =
      i + needle_len <= haystack_len
      && (String.sub haystack i needle_len = needle || loop (i + 1))
    in
    if not (loop 0) then
      failf "%s\nmissing: %S\nin:      %S" name needle haystack

let assert_not_contains ~name needle haystack =
  let needle_len = String.length needle in
  let haystack_len = String.length haystack in
  let rec loop i =
    i + needle_len <= haystack_len
    && (String.sub haystack i needle_len = needle || loop (i + 1))
  in
  if loop 0 then failf "%s\nunexpected: %S\nin:         %S" name needle haystack

let find_substring ~needle haystack =
  let needle_len = String.length needle in
  let haystack_len = String.length haystack in
  let rec loop i =
    if i + needle_len > haystack_len then None
    else if String.sub haystack i needle_len = needle then Some i
    else loop (i + 1)
  in
  loop 0

let assert_before ~name left right text =
  match
    (find_substring ~needle:left text, find_substring ~needle:right text)
  with
  | Some left_index, Some right_index when left_index < right_index -> ()
  | _ -> failf "%s\nexpected %S before %S\nin: %S" name left right text

let run ?(env = []) args =
  run_blocking
    (Cli.run
       (Cli.make_app ~version:"test-version" ())
       { Cli.argv = args; env; cwd = Sys.getcwd (); stdin = None })

let stdout output = Option.value output.Cli.stdout ~default:""

let cli_input ?(env = []) ?(cwd = Sys.getcwd ()) ?stdin args =
  { Cli.argv = args; env; cwd; stdin }

let cli_stdout output = Option.value output.Cli.stdout ~default:""
let graph value = Cli_primitive.create_graph value
let repo value = Cli_primitive.create_repo value
let graph_string value = Cli_primitive.string_of_graph value
let repo_string value = Cli_primitive.string_of_repo value
let vmap fields = Edn_util.map fields
let vkw value = Edn_util.keyword value
let vstr value = Edn_util.string value
let vint value = Edn_util.int value
let vbool value = Edn_util.bool value
let vvec values = Edn_util.vector values

let ordinal value =
  let suffix =
    match value mod 100 with
    | 11 | 12 | 13 -> "th"
    | _ -> (
        match value mod 10 with 1 -> "st" | 2 -> "nd" | 3 -> "rd" | _ -> "th")
  in
  string_of_int value ^ suffix

let today_default_journal_title () =
  let year, month, day = Ptime_util.local_date (Ptime_util.now ()) in
  let months =
    [|
      "Jan";
      "Feb";
      "Mar";
      "Apr";
      "May";
      "Jun";
      "Jul";
      "Aug";
      "Sep";
      "Oct";
      "Nov";
      "Dec";
    |]
  in
  months.(month - 1) ^ " " ^ ordinal day ^ ", " ^ string_of_int year

let value_with fields =
  vmap (List.map (fun (key, value) -> (vkw key, value)) fields)

let capture_stdout f =
  flush Stdlib.stdout;
  let stdout_fd = Unix.descr_of_out_channel Stdlib.stdout in
  let saved = Unix.dup stdout_fd in
  let read_fd, write_fd = Unix.pipe () in
  Fun.protect
    ~finally:(fun () ->
      Unix.dup2 saved stdout_fd;
      Unix.close saved)
    (fun () ->
      Unix.dup2 write_fd stdout_fd;
      Unix.close write_fd;
      let result =
        try f ()
        with exn ->
          flush Stdlib.stdout;
          Unix.dup2 saved stdout_fd;
          raise exn
      in
      flush Stdlib.stdout;
      Unix.dup2 saved stdout_fd;
      let ic = Unix.in_channel_of_descr read_fd in
      let output =
        Fun.protect
          ~finally:(fun () -> close_in_noerr ic)
          (fun () ->
            let buffer = Buffer.create 128 in
            (try
               while true do
                 Buffer.add_char buffer (input_char ic)
               done
             with End_of_file -> ());
            Buffer.contents buffer)
      in
      (result, output))

let capture_stderr f =
  flush Stdlib.stderr;
  let stderr_fd = Unix.descr_of_out_channel Stdlib.stderr in
  let saved = Unix.dup stderr_fd in
  let read_fd, write_fd = Unix.pipe () in
  Fun.protect
    ~finally:(fun () ->
      Unix.dup2 saved stderr_fd;
      Unix.close saved)
    (fun () ->
      Unix.dup2 write_fd stderr_fd;
      Unix.close write_fd;
      let result =
        try f ()
        with exn ->
          flush Stdlib.stderr;
          Unix.dup2 saved stderr_fd;
          raise exn
      in
      flush Stdlib.stderr;
      Unix.dup2 saved stderr_fd;
      let ic = Unix.in_channel_of_descr read_fd in
      let output =
        Fun.protect
          ~finally:(fun () -> close_in_noerr ic)
          (fun () ->
            let buffer = Buffer.create 128 in
            (try
               while true do
                 Buffer.add_char buffer (input_char ic)
               done
             with End_of_file -> ());
            Buffer.contents buffer)
      in
      (result, output))

let fresh_root prefix =
  let path = Filename.temp_file prefix "" in
  Sys.remove path;
  path ^ ".dir"

let rec wait_until attempts predicate =
  attempts > 0
  && (predicate ()
     ||
     (sleep_ms 10L;
      wait_until (attempts - 1) predicate))

let rec waitpid_noeintr flags pid =
  try Unix.waitpid flags pid
  with Unix.Unix_error (Unix.EINTR, _, _) -> waitpid_noeintr flags pid

type test_http_request = {
  request_line : string;
  headers : (string * string) list;
  body : string;
}

let starts_with ~prefix value =
  let prefix_len = String.length prefix in
  String.length value >= prefix_len && String.sub value 0 prefix_len = prefix

let contains_substring ~needle haystack =
  let needle_len = String.length needle in
  let haystack_len = String.length haystack in
  let rec loop idx =
    if idx + needle_len > haystack_len then false
    else if String.sub haystack idx needle_len = needle then true
    else loop (idx + 1)
  in
  needle_len = 0 || loop 0

let trim_cr value =
  let len = String.length value in
  if len > 0 && value.[len - 1] = '\r' then String.sub value 0 (len - 1)
  else value

let read_exact ic len =
  let bytes = Bytes.create len in
  really_input ic bytes 0 len;
  Bytes.to_string bytes

let http_server_handler_with_port handler =
  let port_ref = ref None in
  let handler request =
    let port = Option.value !port_ref ~default:0 in
    handler port request
  in
  (port_ref, handler)

let with_http_server handler f =
  let socket = Unix.socket Unix.PF_INET Unix.SOCK_STREAM 0 in
  Unix.setsockopt socket Unix.SO_REUSEADDR true;
  Unix.bind socket (Unix.ADDR_INET (Unix.inet_addr_loopback, 0));
  Unix.listen socket 1;
  let port =
    match Unix.getsockname socket with
    | Unix.ADDR_INET (_, port) -> port
    | _ -> failf "expected inet socket"
  in
  match Unix.fork () with
  | 0 ->
      let client, _ = Unix.accept socket in
      let ic = Unix.in_channel_of_descr client in
      let oc = Unix.out_channel_of_descr client in
      let request_line = input_line ic |> trim_cr in
      let rec read_headers acc =
        let line = input_line ic |> trim_cr in
        if line = "" then List.rev acc
        else
          match String.split_on_char ':' line with
          | key :: rest ->
              read_headers
                (( String.lowercase_ascii (String.trim key),
                   String.trim (String.concat ":" rest) )
                :: acc)
          | [] -> read_headers acc
      in
      let headers = read_headers [] in
      let body =
        match List.assoc_opt "content-length" headers with
        | Some value -> read_exact ic (int_of_string value)
        | None -> ""
      in
      let status, response_headers, response_body =
        handler { request_line; headers; body }
      in
      let chunked =
        List.exists
          (fun (key, value) ->
            String.lowercase_ascii key = "transfer-encoding"
            && String.lowercase_ascii value = "chunked")
          response_headers
      in
      Printf.fprintf oc "HTTP/1.1 %d OK\r\n" status;
      if not chunked then
        Printf.fprintf oc "Content-Length: %d\r\n" (String.length response_body);
      Printf.fprintf oc "Connection: close\r\n";
      List.iter
        (fun (key, value) -> Printf.fprintf oc "%s: %s\r\n" key value)
        response_headers;
      Printf.fprintf oc "\r\n%s%!" response_body;
      close_in_noerr ic;
      close_out_noerr oc;
      Unix.close socket;
      exit 0
  | pid ->
      let child_reaped = ref false in
      let child_finished () =
        if !child_reaped then true
        else
          match waitpid_noeintr [ Unix.WNOHANG ] pid with
          | 0, _ -> false
          | _ ->
              child_reaped := true;
              true
      in
      let rec wait_for_child attempts =
        if attempts <= 0 then false
        else if child_finished () then true
        else (
          sleep_ms 10L;
          wait_for_child (attempts - 1))
      in
      let cleanup () =
        Unix.close socket;
        if (not !child_reaped) && not (child_finished ()) then (
          (try Unix.kill pid Sys.sigterm with Unix.Unix_error _ -> ());
          let _, _ = waitpid_noeintr [] pid in
          child_reaped := true;
          ())
      in
      Fun.protect ~finally:cleanup (fun () ->
          let result = f ("http://127.0.0.1:" ^ string_of_int port) in
          if not (wait_for_child 50) then
            failf "expected HTTP server sequence to consume all handlers";
          result)

let handle_http_request socket handler =
  let client, _ = Unix.accept socket in
  let ic = Unix.in_channel_of_descr client in
  let oc = Unix.out_channel_of_descr client in
  let request_line = input_line ic |> trim_cr in
  let rec read_headers acc =
    let line = input_line ic |> trim_cr in
    if line = "" then List.rev acc
    else
      match String.split_on_char ':' line with
      | key :: rest ->
          read_headers
            (( String.lowercase_ascii (String.trim key),
               String.trim (String.concat ":" rest) )
            :: acc)
      | [] -> read_headers acc
  in
  let headers = read_headers [] in
  let body =
    match List.assoc_opt "content-length" headers with
    | Some value -> read_exact ic (int_of_string value)
    | None -> ""
  in
  let status, response_headers, response_body =
    handler { request_line; headers; body }
  in
  let chunked =
    List.exists
      (fun (key, value) ->
        String.lowercase_ascii key = "transfer-encoding"
        && String.lowercase_ascii value = "chunked")
      response_headers
  in
  Printf.fprintf oc "HTTP/1.1 %d OK\r\n" status;
  if not chunked then
    Printf.fprintf oc "Content-Length: %d\r\n" (String.length response_body);
  Printf.fprintf oc "Connection: close\r\n";
  List.iter
    (fun (key, value) -> Printf.fprintf oc "%s: %s\r\n" key value)
    response_headers;
  Printf.fprintf oc "\r\n%s%!" response_body;
  close_in_noerr ic;
  close_out_noerr oc

let with_http_server_sequence handlers f =
  let socket = Unix.socket Unix.PF_INET Unix.SOCK_STREAM 0 in
  Unix.setsockopt socket Unix.SO_REUSEADDR true;
  Unix.bind socket (Unix.ADDR_INET (Unix.inet_addr_loopback, 0));
  Unix.listen socket (List.length handlers);
  let port =
    match Unix.getsockname socket with
    | Unix.ADDR_INET (_, port) -> port
    | _ -> failf "expected inet socket"
  in
  match Unix.fork () with
  | 0 ->
      List.iter (handle_http_request socket) handlers;
      Unix.close socket;
      exit 0
  | pid ->
      let child_reaped = ref false in
      let child_finished () =
        if !child_reaped then true
        else
          match waitpid_noeintr [ Unix.WNOHANG ] pid with
          | 0, _ -> false
          | _ ->
              child_reaped := true;
              true
      in
      let rec wait_for_child attempts =
        if attempts <= 0 then false
        else if child_finished () then true
        else (
          sleep_ms 10L;
          wait_for_child (attempts - 1))
      in
      let cleanup () =
        Unix.close socket;
        if (not !child_reaped) && not (child_finished ()) then (
          (try Unix.kill pid Sys.sigterm with Unix.Unix_error _ -> ());
          let _, _ = waitpid_noeintr [] pid in
          child_reaped := true;
          ())
      in
      Fun.protect ~finally:cleanup (fun () ->
          let result = f ("http://127.0.0.1:" ^ string_of_int port) in
          if not (wait_for_child 50) then
            failf "expected HTTP server sequence to consume all handlers";
          result)

let with_http_server_port handler f =
  let port_ref, handler = http_server_handler_with_port handler in
  with_http_server
    (fun request ->
      let port =
        match List.assoc_opt "host" request.headers with
        | Some host -> (
            match String.rindex_opt host ':' with
            | Some idx ->
                int_of_string
                  (String.sub host (idx + 1) (String.length host - idx - 1))
            | None -> 0)
        | None -> 0
      in
      port_ref := Some port;
      handler request)
    f

let with_invoke_server f =
  with_http_server
    (fun request ->
      assert_equal ~name:"invoke request line" "POST /v1/invoke HTTP/1.1"
        request.request_line;
      assert_contains ~name:"invoke body method" {|"method"|} request.body;
      (200, [ ("Content-Type", "application/json") ], {|{"resultTransit":"[]"}|}))
    f

let try_http_get url =
  try
    let rest =
      if starts_with ~prefix:"http://" url then
        String.sub url 7 (String.length url - 7)
      else invalid_arg "expected http URL"
    in
    let authority, target =
      match String.index_opt rest '/' with
      | Some idx ->
          (String.sub rest 0 idx, String.sub rest idx (String.length rest - idx))
      | None -> (rest, "/")
    in
    let host, port =
      match String.rindex_opt authority ':' with
      | Some idx ->
          ( String.sub authority 0 idx,
            String.sub authority (idx + 1) (String.length authority - idx - 1)
            |> int_of_string )
      | None -> (authority, 80)
    in
    let socket = Unix.socket Unix.PF_INET Unix.SOCK_STREAM 0 in
    Fun.protect
      ~finally:(fun () -> try Unix.close socket with Unix.Unix_error _ -> ())
      (fun () ->
        let addr = (Unix.gethostbyname host).Unix.h_addr_list.(0) in
        Unix.connect socket (Unix.ADDR_INET (addr, port));
        let ic = Unix.in_channel_of_descr socket in
        let oc = Unix.out_channel_of_descr socket in
        Fun.protect
          ~finally:(fun () ->
            close_in_noerr ic;
            close_out_noerr oc)
          (fun () ->
            Printf.fprintf oc
              "GET %s HTTP/1.1\r\n\
               Host: %s:%d\r\n\
               Accept: text/plain\r\n\
               Connection: close\r\n\
               \r\n\
               %!"
              target host port;
            input_line ic |> trim_cr |> starts_with ~prefix:"HTTP/1.1 2"))
  with _ -> false

let write_text_file path content =
  let oc = open_out path in
  Fun.protect
    ~finally:(fun () -> close_out_noerr oc)
    (fun () -> output_string oc content)

let read_text_file path =
  let ic = open_in path in
  Fun.protect
    ~finally:(fun () -> close_in_noerr ic)
    (fun () ->
      let len = in_channel_length ic in
      really_input_string ic len)

let ensure_test_dir path =
  if not (Sys.file_exists path) then Unix.mkdir path 0o755

let write_fake_db_worker_node cwd =
  let static_dir = Filename.concat cwd "static" in
  ensure_test_dir static_dir;
  let script_path = Filename.concat static_dir "db-worker-node.js" in
  write_text_file script_path
    {|
const fs = require("fs");
const http = require("http");
const path = require("path");

const opts = {};
for (let i = 2; i < process.argv.length; i += 1) {
  const flag = process.argv[i];
  if (flag === "--repo") opts.repo = process.argv[++i];
  else if (flag === "--root-dir") opts.rootDir = process.argv[++i];
  else if (flag === "--owner-source") opts.ownerSource = process.argv[++i];
}

if (!opts.repo || !opts.rootDir) process.exit(2);

const ownerSource = opts.ownerSource || "cli";
function repoToGraph(repo) {
  return String(repo || "").replace(/^(logseq_db_)+/, "");
}
const graphDir = path.join(opts.rootDir, "graphs", repoToGraph(opts.repo));
const lockPath = path.join(graphDir, "db-worker.lock");
const serverListPath = path.join(opts.rootDir, "server-list");
fs.mkdirSync(graphDir, { recursive: true });

function removeServerListEntry(port) {
  if (!fs.existsSync(serverListPath)) return;
  const line = `${process.pid} ${port}`;
  const kept = fs.readFileSync(serverListPath, "utf8")
    .split(/\n/)
    .filter((entry) => entry.trim() && entry.trim() !== line);
  fs.writeFileSync(serverListPath, kept.length ? `${kept.join("\n")}\n` : "");
}

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/healthz") {
    const port = server.address().port;
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      repo: opts.repo,
      status: "ready",
      host: "127.0.0.1",
      port,
      pid: process.pid,
      "owner-source": ownerSource,
      "root-dir": opts.rootDir,
      revision: "test-revision"
    }));
    return;
  }

  if (req.method === "POST" && req.url === "/v1/shutdown") {
    const port = server.address().port;
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end("{}");
    try { fs.rmSync(lockPath, { force: true }); } catch (_) {}
    removeServerListEntry(port);
    server.close(() => process.exit(0));
    return;
  }

  if (req.method === "POST" && req.url === "/v1/invoke") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ resultTransit: "[]" }));
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(0, "127.0.0.1", () => {
  const port = server.address().port;
  fs.writeFileSync(lockPath, JSON.stringify({
    pid: process.pid,
    host: "127.0.0.1",
    port,
    repo: opts.repo,
    "owner-source": ownerSource
  }));
  fs.appendFileSync(serverListPath, `${process.pid} ${port}\n`);
});

setInterval(() => {}, 1000);
|};
  script_path

let read_binary_file path =
  let ic = open_in_bin path in
  Fun.protect
    ~finally:(fun () -> close_in_noerr ic)
    (fun () ->
      let len = in_channel_length ic in
      read_exact ic len)

let extract_sqlite_snapshot_path body repo =
  let marker = repo ^ {|\",\"|} in
  match find_substring ~needle:marker body with
  | None -> failf "missing sqlite snapshot path marker for %s in %S" repo body
  | Some idx ->
      let start = idx + String.length marker in
      let rec loop i =
        if i + 1 >= String.length body then
          failf "unterminated sqlite snapshot path in %S" body
        else if body.[i] = '\\' && body.[i + 1] = '"' then
          String.sub body start (i - start)
        else loop (i + 1)
      in
      loop start

let test_config ~root_dir ?base_url ?graph:graph_name () =
  let env key =
    match (key, base_url) with
    | "LOGSEQ_CLI_BASE_URL", Some value -> Some value
    | _ -> None
  in
  let graph = Option.map graph graph_name in
  let globals = Global_opts.create ~root_dir ?graph () in
  match
    run_blocking
      (Cli_config.resolve ~defaults:(Cli_config.defaults ()) ~env globals)
  with
  | Ok resolved -> resolved.Cli_config.config
  | Error err -> failf "unexpected config error: %s" err.Error.message

let () =
  check "prints top-level help when no args are provided" (fun () ->
      let output = run [] in
      assert_int ~name:"exit code" 0 output.exit_code;
      assert_contains ~name:"usage" "Usage: logseq <command> [options]"
        (stdout output);
      assert_contains ~name:"graph command" "  graph       Manage graphs"
        (stdout output);
      assert_contains ~name:"list command" "  list        List graph entities"
        (stdout output);
      assert_contains ~name:"upsert command"
        "  upsert      Create or update graph entities" (stdout output);
      assert_contains ~name:"remove command"
        "  remove      Remove graph entities" (stdout output);
      assert_contains ~name:"search command"
        "  search      Search graph entities" (stdout output);
      assert_contains ~name:"query command"
        "  query       Run a Datascript query" (stdout output);
      assert_contains ~name:"server command"
        "  server      Manage db-worker-node servers" (stdout output);
      assert_contains ~name:"sync command" "  sync        Manage Logseq sync"
        (stdout output);
      assert_contains ~name:"skill command"
        "  skill       Manage built-in logseq-cli skill" (stdout output);
      assert_contains ~name:"debug command" "  debug       Debug commands"
        (stdout output);
      assert_contains ~name:"agent command"
        "  agent       Agent bridge commands" (stdout output));

  check "prints group help for command groups" (fun () ->
      let output = run [ "graph" ] in
      assert_int ~name:"exit code" 0 output.exit_code;
      assert_contains ~name:"usage" "Usage: logseq graph <subcommand> [options]"
        (stdout output);
      assert_contains ~name:"backup subcommand" "graph backup create"
        (stdout output));

  check "prints group help for nested command groups" (fun () ->
      let output = run [ "graph"; "backup" ] in
      assert_int ~name:"nested group help exit code" 0 output.exit_code;
      assert_contains ~name:"nested group usage"
        "Usage: logseq graph backup <subcommand> [options]" (stdout output);
      assert_contains ~name:"nested group list" "graph backup list"
        (stdout output);
      assert_contains ~name:"nested group restore" "graph backup restore"
        (stdout output));

  check "prints configured version" (fun () ->
      let output = run [ "--version" ] in
      assert_int ~name:"exit code" 0 output.exit_code;
      assert_equal ~name:"version output" "logseq-cli ocaml"
        (String.trim (stdout output)));

  check "reports unknown commands" (fun () ->
      let output = run [ "unknown" ] in
      assert_int ~name:"exit code" 1 output.exit_code;
      assert_contains ~name:"unknown command"
        "Error (:unknown-command): unknown command: unknown" (stdout output));

  check "honors json output for validation errors" (fun () ->
      let output = run [ "--output"; "json"; "search"; "block" ] in
      assert_int ~name:"exit code" 1 output.exit_code;
      assert_equal ~name:"json"
        {|{"status":"error","error":{"code":"missing-query-text","message":"query text is required"}}|}
        (String.trim (stdout output)));

  check "rejects unsupported positional search queries" (fun () ->
      let output = run [ "search"; "page"; "home" ] in
      assert_int ~name:"exit code" 1 output.exit_code;
      assert_contains ~name:"unknown command"
        "Error (:unknown-command): unknown command: search page home"
        (stdout output));

  check "creates and lists local graphs" (fun () ->
      let root =
        Filename.concat
          (Filename.get_temp_dir_name ())
          ("logseq-cli-test-" ^ string_of_int (Unix.getpid ()))
      in
      let graph = "my graph" in
      let create_output =
        run [ "--root-dir"; root; "graph"; "create"; "--graph"; graph ]
      in
      assert_int ~name:"create exit" 0 create_output.exit_code;
      assert_contains ~name:"create output" "Created graph \"my graph\""
        (stdout create_output);
      let list_output = run [ "--root-dir"; root; "graph"; "list" ] in
      assert_int ~name:"list exit" 0 list_output.exit_code;
      assert_not_contains ~name:"graph list header omitted" "Graph\n"
        (stdout list_output);
      assert_contains ~name:"graph row" "my graph" (stdout list_output);
      assert_contains ~name:"count" "Count: 1" (stdout list_output));

  check "graph list human marks current graph like upstream CLI" (fun () ->
      let root = fresh_root "logseq-cli-graph-list-current-" in
      ensure_test_dir root;
      ensure_test_dir (Filename.concat root "graphs");
      ensure_test_dir (Filename.concat root "graphs/alpha");
      ensure_test_dir (Filename.concat root "graphs/beta");
      write_text_file (Filename.concat root "current-graph") "beta\n";
      let output = run [ "--root-dir"; root; "graph"; "list" ] in
      assert_int ~name:"list current graph exit" 0 output.exit_code;
      assert_equal ~name:"list current graph human"
        "  alpha\n* beta\nCount: 2\n" (stdout output));

  check "graph list json exposes structured graph data" (fun () ->
      let root =
        Filename.concat
          (Filename.get_temp_dir_name ())
          ("logseq-cli-json-test-" ^ string_of_int (Unix.getpid ()))
      in
      let _ =
        run [ "--root-dir"; root; "graph"; "create"; "--graph"; "alpha" ]
      in
      let _ =
        run [ "--root-dir"; root; "graph"; "create"; "--graph"; "beta" ]
      in
      let output =
        run [ "--root-dir"; root; "--output"; "json"; "graph"; "list" ]
      in
      assert_int ~name:"json exit" 0 output.exit_code;
      let body = String.trim (stdout output) in
      assert_contains ~name:"json graph list graphs"
        {|"graphs":["alpha","beta"]|} body;
      assert_contains ~name:"json graph list alpha"
        {|"kind":"canonical","graph-name":"alpha","graph-dir":"alpha"|} body;
      assert_contains ~name:"json graph list beta"
        {|"kind":"canonical","graph-name":"beta","graph-dir":"beta"|} body);

  check "graph list json exposes legacy graph dir items" (fun () ->
      let root = fresh_root "logseq-cli-graph-list-legacy-" in
      ensure_test_dir root;
      ensure_test_dir (Filename.concat root "graphs");
      ensure_test_dir (Filename.concat root "graphs/alpha");
      ensure_test_dir (Filename.concat root "graphs/foo++bar");
      ensure_test_dir (Filename.concat root "graphs/space%20name");
      ensure_test_dir (Filename.concat root "graphs/bad%ZZname");
      ensure_test_dir (Filename.concat root "graphs/Unlinked graphs");
      ensure_test_dir (Filename.concat root "graphs/logseq_db_alpha");
      let output =
        run_blocking
          (Cli.run
             (Cli.make_app ~version:"test-version" ())
             (cli_input
                [ "--root-dir"; root; "--output"; "json"; "graph"; "list" ]))
      in
      assert_int ~name:"legacy graph list exit" 0 output.exit_code;
      let body = String.trim (cli_stdout output) in
      assert_contains ~name:"legacy graph list canonical" {|"graphs":["alpha"]|}
        body;
      assert_contains ~name:"legacy graph list legacy slash"
        {|"kind":"legacy","legacy-dir":"foo++bar","graph-name":"foo/bar","target-graph-dir":"foo~2Fbar","conflict":false|}
        body;
      assert_contains ~name:"legacy graph list legacy space"
        {|"kind":"legacy","legacy-dir":"space%20name","graph-name":"space name","target-graph-dir":"space name","conflict":false|}
        body;
      assert_contains ~name:"legacy graph list undecodable"
        {|"kind":"legacy-undecodable","legacy-dir":"bad%ZZname","reason":"graph-name-not-derivable"|}
        body;
      assert_not_contains ~name:"legacy graph list ignores prefixed dir"
        "logseq_db_alpha" body);

  check "graph create uses canonical encoded graph dir names" (fun () ->
      let root = fresh_root "logseq-cli-graph-create-encoded-" in
      let output =
        run_blocking
          (Cli.run
             (Cli.make_app ~version:"test-version" ())
             (cli_input
                [ "--root-dir"; root; "graph"; "create"; "--graph"; "foo/bar" ]))
      in
      assert_int ~name:"encoded graph create exit" 0 output.exit_code;
      assert_bool ~name:"encoded graph dir exists" true
        (Sys.file_exists (Filename.concat root "graphs/foo~2Fbar"));
      assert_bool ~name:"raw nested graph dir absent" false
        (Sys.file_exists (Filename.concat root "graphs/foo/bar"));
      let list_output =
        run_blocking
          (Cli.run
             (Cli.make_app ~version:"test-version" ())
             (cli_input
                [ "--root-dir"; root; "--output"; "json"; "graph"; "list" ]))
      in
      assert_int ~name:"encoded graph list exit" 0 list_output.exit_code;
      assert_equal ~name:"encoded graph list json"
        {|{"status":"ok","data":{"graphs":["foo/bar"],"graph-items":[{"kind":"canonical","graph-name":"foo/bar","graph-dir":"foo~2Fbar"}]}}|}
        (String.trim (cli_stdout list_output)));

  check "graph list edn exposes structured graph data" (fun () ->
      let root =
        Filename.concat
          (Filename.get_temp_dir_name ())
          ("logseq-cli-edn-test-" ^ string_of_int (Unix.getpid ()))
      in
      let _ =
        run [ "--root-dir"; root; "graph"; "create"; "--graph"; "alpha" ]
      in
      let output =
        run [ "--root-dir"; root; "--output"; "edn"; "graph"; "list" ]
      in
      assert_int ~name:"edn exit" 0 output.exit_code;
      assert_contains ~name:"edn graph list graph" {|:graphs ["alpha"]|}
        (String.trim (stdout output));
      assert_contains ~name:"edn graph list dir" {|:graph-dir "alpha"|}
        (String.trim (stdout output)));

  check "fails graph write commands without a graph" (fun () ->
      let root = fresh_root "logseq-cli-missing-graph-" in
      let output = run [ "--root-dir"; root; "graph"; "create" ] in
      assert_int ~name:"exit code" 1 output.exit_code;
      assert_contains ~name:"message"
        "Error (:missing-graph): graph name is required" (stdout output));

  check "returns a clear boundary error for db-worker backed commands"
    (fun () ->
      let output = run [ "--graph"; "work"; "list"; "page" ] in
      assert_int ~name:"exit code" 1 output.exit_code;
      assert_contains ~name:"boundary" "db-worker script is missing"
        (stdout output));

  check "generates zsh shell completions from command registry" (fun () ->
      let output = run [ "completion"; "zsh" ] in
      assert_int ~name:"exit code" 0 output.exit_code;
      assert_contains ~name:"zsh compdef" "#compdef logseq" (stdout output);
      assert_contains ~name:"top dispatcher" "_logseq() {" (stdout output);
      assert_contains ~name:"graph backup nested command"
        "'backup:backup commands'" (stdout output);
      assert_contains ~name:"global graph option" "--graph" (stdout output);
      assert_contains ~name:"final compdef" "compdef _logseq logseq"
        (stdout output));

  check "generates bash shell completions from command registry" (fun () ->
      let output = run [ "completion"; "bash" ] in
      assert_int ~name:"exit code" 0 output.exit_code;
      assert_contains ~name:"bash preamble"
        "Auto-generated by `logseq completion bash`" (stdout output);
      assert_contains ~name:"value opt helper" "_logseq_is_value_opt() {"
        (stdout output);
      assert_contains ~name:"top commands"
        "agent completion debug doctor example graph list login logout query \
         remove search server show skill sync upsert"
        (stdout output);
      assert_contains ~name:"nested backup completion"
        "graph:backup) COMPREPLY=( $(compgen -W 'list create restore remove'"
        (stdout output);
      assert_contains ~name:"complete registration" "complete -F _logseq logseq"
        (stdout output));

  check "Cli_config maps user graph names to db-worker repos" (fun () ->
      assert_equal ~name:"graph to repo" "logseq_db_demo"
        (repo_string (Cli_config.graph_to_repo (graph "demo")));
      assert_equal ~name:"graph to repo idempotent" "logseq_db_demo"
        (repo_string (Cli_config.graph_to_repo (graph "logseq_db_demo")));
      assert_equal ~name:"repo to graph" "demo"
        (graph_string (Cli_config.repo_to_graph (repo "logseq_db_demo")));
      assert_equal ~name:"repo to graph plain" "demo"
        (graph_string (Cli_config.repo_to_graph (repo "demo"))));

  check "Cli.run executes agent bridge routing through typed action" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-agent-bridge-run-" in
      ensure_test_dir root;
      let config_path = Filename.concat root "cli.edn" in
      let codex_log = Filename.concat root "codex.log" in
      let codex_bin = Filename.concat root "fake-codex.js" in
      write_text_file codex_bin
        ({|#!/usr/bin/env node
const fs = require("fs");
const logPath = |}
        ^ Printf.sprintf "%S" codex_log
        ^ {|;
fs.appendFileSync(logPath, JSON.stringify(process.argv.slice(2)) + "\n");
if (process.argv.includes("--version")) process.exit(0);
const isResume = process.argv.includes("resume");
console.log(JSON.stringify({session_id: isResume ? "dispatch-session-1" : "master-session-1"}));
process.exit(0);
|}
        );
      Unix.chmod codex_bin 0o755;
      write_text_file config_path
        ("{:agent-name \"agent-a\" :agent-bridge-process-once? true :codex-bin \
          \"" ^ codex_bin ^ "\"}");
      let routable =
        {|{\"~:db/id\":7,\"~:block/uuid\":\"~u11111111-1111-1111-1111-111111111111\",\"~:block/title\":\"Ship CLI\",\"~:block/tags\":[{\"~:db/ident\":\"~:logseq.class/Task\"}],\"~:logseq.property/status\":{\"~:db/ident\":\"~:logseq.property/status.todo\"},\"~:logseq.property/assignee\":[{\"~:block/title\":\"agent-a\"}]}|}
      in
      let already_routed =
        {|{\"~:db/id\":8,\"~:block/uuid\":\"~u22222222-2222-2222-2222-222222222222\",\"~:block/title\":\"Already routed\",\"~:block/tags\":[{\"~:db/ident\":\"~:logseq.class/Task\"}],\"~:logseq.property/status\":{\"~:db/ident\":\"~:logseq.property/status.todo\"},\"~:logseq.property/assignee\":[{\"~:block/title\":\"agent-a\"}],\"~:logseq.property.agent/session-id\":\"session-1\"}|}
      in
      let registry_page =
        {|{\"~:db/id\":100,\"~:block/uuid\":\"~uaaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa\",\"~:block/name\":\"agentbridge\",\"~:block/title\":\"AgentBridge\"}|}
      in
      let agent_page =
        {|{\"~:db/id\":101,\"~:block/uuid\":\"~ubbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb\",\"~:block/name\":\"agent-a\",\"~:block/title\":\"agent-a\"}|}
      in
      let master_block =
        {|{\"~:db/id\":110,\"~:block/uuid\":\"~ucccccccc-cccc-4ccc-8ccc-cccccccccccc\",\"~:block/title\":\"AgentBridge master prompt\",\"~:block/order\":1,\"~:block/_parent\":[{\"~:db/id\":111,\"~:block/title\":\"Graph master prompt\",\"~:block/order\":1,\"~:block/tags\":[{\"~:db/ident\":\"~:logseq.class/Code-block\"}]}]}|}
      in
      let task_template_block =
        {|{\"~:db/id\":120,\"~:block/uuid\":\"~udddddddd-dddd-4ddd-8ddd-dddddddddddd\",\"~:block/title\":\"Task prompt template\",\"~:block/order\":1,\"~:block/_parent\":[{\"~:db/id\":121,\"~:block/title\":\"```text\\nGraph: {{graph}}\\nBlock UUID: {{block-uuid}}\\nTask block tree:\\n{{task-block-tree}}\\n```\",\"~:block/order\":1}]}|}
      in
      let comment_template_block =
        {|{\"~:db/id\":130,\"~:block/uuid\":\"~ueeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee\",\"~:block/title\":\"Comment prompt template\",\"~:block/order\":2,\"~:block/_parent\":[{\"~:db/id\":131,\"~:block/title\":\"```text\\nGraph: {{graph}}\\nComment UUID: {{comment-uuid}}\\nComment target context:\\n{{comment-target-context}}\\nComment thread context:\\n{{comment-thread-context}}\\nRequesting comment:\\n{{requesting-comment}}\\n```\",\"~:block/order\":1}]}|}
      in
      let show_root =
        {|{\"~:db/id\":7,\"~:block/uuid\":\"~u11111111-1111-1111-1111-111111111111\",\"~:block/title\":\"Ship CLI\",\"~:block/order\":1,\"~:block/page\":{\"~:db/id\":200},\"~:block/tags\":[{\"~:db/ident\":\"~:logseq.class/Task\"}],\"~:logseq.property/status\":{\"~:db/ident\":\"~:logseq.property/status.todo\"}}|}
      in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"agent bridge registry query line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"agent bridge registry query"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"agent bridge registry page" {|agentbridge|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[|} ^ registry_page ^ {|]"}|} ));
          (fun request ->
            assert_contains ~name:"agent bridge registered agent query"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"agent bridge registered agent name"
              {|agent-a|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[|} ^ agent_page ^ {|]"}|} ));
          (fun request ->
            assert_contains ~name:"agent bridge agent page query"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"agent bridge agent page name" {|agent-a|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[|} ^ agent_page ^ {|]"}|} ));
          (fun request ->
            assert_contains ~name:"agent bridge master prompt query"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"agent bridge master prompt parent"
              {|block/_parent|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[|} ^ master_block ^ {|]"}|} ));
          (fun request ->
            assert_contains ~name:"agent bridge registry template page query"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"agent bridge registry template page"
              {|agentbridge|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[|} ^ registry_page ^ {|]"}|} ));
          (fun request ->
            assert_contains ~name:"agent bridge prompt template query"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"agent bridge prompt template parent"
              {|block/_parent|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[|} ^ task_template_block ^ {|,|}
              ^ comment_template_block ^ {|]"}|} ));
          (fun request ->
            assert_contains ~name:"agent bridge task query method"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"agent bridge repo" {|logseq_db_alpha|}
              request.body;
            assert_contains ~name:"agent bridge assignee" {|agent-a|}
              request.body;
            assert_contains ~name:"agent bridge q args are not double nested"
              {|\"logseq_db_alpha\",[[\"^ \",\"~:find\"|} request.body;
            assert_not_contains
              ~name:"agent bridge q args do not wrap query input vector"
              {|\"logseq_db_alpha\",[[[\"^ \",\"~:find\"|} request.body;
            assert_contains ~name:"agent bridge q includes rules var"
              {|\"~$%\"|} request.body;
            assert_contains ~name:"agent bridge q sends empty rules"
              {|\"agent-a\",[]]]|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[|} ^ routable ^ {|,|} ^ already_routed
              ^ {|]"}|} ));
          (fun request ->
            assert_contains ~name:"agent bridge show pulls task"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"agent bridge show task uuid"
              {|11111111-1111-1111-1111-111111111111|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"|} ^ show_root ^ {|" }|} ));
          (fun request ->
            assert_contains ~name:"agent bridge show page blocks"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"agent bridge show page id" {|200|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[|} ^ show_root ^ {|]"}|} ));
          (fun request ->
            assert_contains ~name:"agent bridge show breadcrumb"
              {|"method":"thread-api/get-block-parents"|} request.body;
            assert_contains ~name:"agent bridge show breadcrumb block id" {|7|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[]"}|} ));
          (fun request ->
            assert_contains ~name:"agent bridge reaction query"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"agent bridge reaction target uuid"
              {|11111111-1111-1111-1111-111111111111|} request.body;
            assert_contains ~name:"agent bridge reaction emoji" {|eyes|}
              request.body;
            assert_contains ~name:"agent bridge reaction includes rules var"
              {|\"~$%\"|} request.body;
            assert_contains ~name:"agent bridge reaction sends empty rules"
              {|\"eyes\",[]]]|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"null"}|} ));
          (fun request ->
            assert_contains ~name:"agent bridge toggle reaction"
              {|"method":"thread-api/apply-outliner-ops"|} request.body;
            assert_contains ~name:"agent bridge toggle reaction op"
              {|toggle-reaction|} request.body;
            assert_contains ~name:"agent bridge toggle reaction uuid"
              {|11111111-1111-1111-1111-111111111111|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"{\"~:ok\":true}"}|} ));
          (fun request ->
            assert_contains ~name:"agent bridge status query"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"agent bridge status query uuid"
              {|11111111-1111-1111-1111-111111111111|} request.body;
            assert_contains ~name:"agent bridge status query attr"
              {|logseq.property/status|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"~#'\",\"~:logseq.property/status.todo\"]"}|}
            ));
          (fun request ->
            assert_contains ~name:"agent bridge set doing"
              {|"method":"thread-api/apply-outliner-ops"|} request.body;
            assert_contains ~name:"agent bridge set property op"
              {|batch-set-property|} request.body;
            assert_contains ~name:"agent bridge set doing status"
              {|logseq.property/status.doing|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"{\"~:ok\":true}"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    [
                      "--config";
                      config_path;
                      "--root-dir";
                      root;
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "agent";
                      "bridge";
                    ]
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]))
          in
          assert_int ~name:"agent bridge exit" 0 output.exit_code;
          let body = String.trim (cli_stdout output) in
          assert_contains ~name:"agent bridge status" {|"status":"ok"|} body;
          assert_contains ~name:"agent bridge mode" {|"mode":"processed-once"|}
            body;
          assert_contains ~name:"agent bridge graph" {|"graph":"alpha"|} body;
          assert_contains ~name:"agent bridge agent" {|"agent-name":"agent-a"|}
            body;
          assert_contains ~name:"agent bridge routed task" "Ship CLI" body;
          assert_not_contains ~name:"agent bridge filters already routed"
            "Already routed" body;
          let codex_calls = read_text_file codex_log in
          assert_contains ~name:"agent bridge checks codex availability"
            {|"--version"|} codex_calls;
          assert_contains ~name:"agent bridge starts master"
            {|"--json","--skip-git-repo-check"|} codex_calls;
          assert_contains ~name:"agent bridge dispatches to master"
            {|"resume","--json","--skip-git-repo-check","master-session-1"|}
            codex_calls;
          assert_contains ~name:"agent bridge dispatch prompt kind"
            {|Request kind: task|} codex_calls;
          assert_contains ~name:"agent bridge dispatch prompt block"
            {|Block UUID: 11111111-1111-1111-1111-111111111111|} codex_calls;
          match output.lifecycle.action with
          | Some (Cli_action.Agent (Agent.Agent_bridge { repo; graph })) ->
              assert_equal ~name:"agent run repo" "logseq_db_alpha"
                (repo_string repo);
              assert_equal ~name:"agent run graph" "alpha" (graph_string graph)
          | _ -> failf "expected typed agent action"));

  check "Cli.run listens for agent bridge graph changes" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-agent-bridge-listen-" in
      ensure_test_dir root;
      let config_path = Filename.concat root "cli.edn" in
      let codex_log = Filename.concat root "codex.log" in
      let codex_bin = Filename.concat root "fake-codex.js" in
      write_text_file codex_bin
        ({|#!/usr/bin/env node
const fs = require("fs");
const logPath = |}
        ^ Printf.sprintf "%S" codex_log
        ^ {|;
fs.appendFileSync(logPath, JSON.stringify(process.argv.slice(2)) + "\n");
if (process.argv.includes("--version")) process.exit(0);
const isResume = process.argv.includes("resume");
console.log(JSON.stringify({session_id: isResume ? "dispatch-session-event" : "master-session-event"}));
process.exit(0);
|}
        );
      Unix.chmod codex_bin 0o755;
      write_text_file config_path
        ("{:agent-name \"agent-a\" :codex-bin \"" ^ codex_bin ^ "\"}");
      let registry_page =
        {|{\"~:db/id\":100,\"~:block/uuid\":\"~uaaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa\",\"~:block/name\":\"agentbridge\",\"~:block/title\":\"AgentBridge\"}|}
      in
      let agent_page =
        {|{\"~:db/id\":101,\"~:block/uuid\":\"~ubbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb\",\"~:block/name\":\"agent-a\",\"~:block/title\":\"agent-a\"}|}
      in
      let master_block =
        {|{\"~:db/id\":110,\"~:block/uuid\":\"~ucccccccc-cccc-4ccc-8ccc-cccccccccccc\",\"~:block/title\":\"AgentBridge master prompt\",\"~:block/order\":1,\"~:block/_parent\":[{\"~:db/id\":111,\"~:block/title\":\"Graph master prompt\",\"~:block/order\":1,\"~:block/tags\":[{\"~:db/ident\":\"~:logseq.class/Code-block\"}]}]}|}
      in
      let routable =
        {|{\"~:db/id\":7,\"~:block/uuid\":\"~u11111111-1111-1111-1111-111111111111\",\"~:block/title\":\"Event task\",\"~:block/tags\":[{\"~:db/ident\":\"~:logseq.class/Task\"}],\"~:logseq.property/status\":{\"~:db/ident\":\"~:logseq.property/status.todo\"},\"~:logseq.property/assignee\":[{\"~:block/title\":\"agent-a\"}]}|}
      in
      let show_root =
        {|{\"~:db/id\":7,\"~:block/uuid\":\"~u11111111-1111-1111-1111-111111111111\",\"~:block/title\":\"Event task\",\"~:block/order\":1,\"~:block/page\":{\"~:db/id\":200},\"~:block/tags\":[{\"~:db/ident\":\"~:logseq.class/Task\"}],\"~:logseq.property/status\":{\"~:db/ident\":\"~:logseq.property/status.todo\"}}|}
      in
      let event_body =
        {|data: {"type":"sync-db-changes","payload":"[\"^ \",\"~:tx-data\",[[\"^ \",\"~:db/id\",7,\"~:added\",true]]]"}|}
        ^ "\n\n"
      in
      with_http_server_sequence
        [
          (fun request ->
            assert_contains ~name:"agent listen registry query"
              {|"method":"thread-api/q"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[|} ^ registry_page ^ {|]"}|} ));
          (fun request ->
            assert_contains ~name:"agent listen registered agent" {|agent-a|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[|} ^ agent_page ^ {|]"}|} ));
          (fun request ->
            assert_contains ~name:"agent listen agent page" {|agent-a|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[|} ^ agent_page ^ {|]"}|} ));
          (fun request ->
            assert_contains ~name:"agent listen master prompt" {|block/_parent|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[|} ^ master_block ^ {|]"}|} ));
          (fun request ->
            assert_contains ~name:"agent listen template page" {|agentbridge|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[|} ^ registry_page ^ {|]"}|} ));
          (fun request ->
            assert_contains ~name:"agent listen template blocks"
              {|block/_parent|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[]"}|} ));
          (fun request ->
            assert_equal ~name:"agent listen events request"
              "GET /v1/events HTTP/1.1" request.request_line;
            (200, [ ("Content-Type", "text/event-stream") ], event_body));
          (fun request ->
            assert_contains ~name:"agent listen initial task query"
              {|"method":"thread-api/q"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[]"}|} ));
          (fun request ->
            assert_contains ~name:"agent listen event task query"
              {|"method":"thread-api/q"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[|} ^ routable ^ {|]"}|} ));
          (fun request ->
            assert_contains ~name:"agent listen show pulls task"
              {|"method":"thread-api/pull"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"|} ^ show_root ^ {|" }|} ));
          (fun request ->
            assert_contains ~name:"agent listen show page blocks"
              {|"method":"thread-api/q"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[|} ^ show_root ^ {|]"}|} ));
          (fun request ->
            assert_contains ~name:"agent listen show breadcrumb"
              {|"method":"thread-api/get-block-parents"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[]"}|} ));
          (fun request ->
            assert_contains ~name:"agent listen reaction query" {|eyes|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"null"}|} ));
          (fun request ->
            assert_contains ~name:"agent listen toggle reaction"
              {|toggle-reaction|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"{\"~:ok\":true}"}|} ));
          (fun request ->
            assert_contains ~name:"agent listen status query"
              {|logseq.property/status|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"~#'\",\"~:logseq.property/status.todo\"]"}|}
            ));
          (fun request ->
            assert_contains ~name:"agent listen set doing"
              {|logseq.property/status.doing|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"{\"~:ok\":true}"}|} ));
        ]
        (fun base_url ->
          let _, bridge_stdout =
            capture_stdout (fun () ->
                Lwt_main.run
                  (Lwt.pick
                     [
                       Cli_effect.to_lwt
                         (Cli.run app
                            (cli_input
                               [
                                 "--config";
                                 config_path;
                                 "--root-dir";
                                 root;
                                 "--graph";
                                 "alpha";
                                 "agent";
                                 "bridge";
                               ]
                               ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]))
                       |> Lwt.map (fun _ -> ());
                       sleep_lwt_ms 2000L;
                     ]))
          in
          let codex_calls = read_text_file codex_log in
          assert_contains ~name:"agent listen stdout environment"
            "checking the environment" bridge_stdout;
          assert_contains ~name:"agent listen stdout master"
            "Codex master command prepared" bridge_stdout;
          assert_contains ~name:"agent listen stdout ready"
            "listening graph changes" bridge_stdout;
          assert_contains ~name:"agent listen starts master"
            "master-session-event" codex_calls;
          assert_contains ~name:"agent listen dispatches event task" "resume"
            codex_calls;
          assert_contains ~name:"agent listen dispatch prompt" "Event task"
            codex_calls));

  check "Cli.run routes agent bridge comment mentions from graph changes"
    (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-agent-bridge-comment-listen-" in
      ensure_test_dir root;
      let config_path = Filename.concat root "cli.edn" in
      let codex_log = Filename.concat root "codex.log" in
      let codex_bin = Filename.concat root "fake-codex.js" in
      write_text_file codex_bin
        ({|#!/usr/bin/env node
const fs = require("fs");
const logPath = |}
        ^ Printf.sprintf "%S" codex_log
        ^ {|;
fs.appendFileSync(logPath, JSON.stringify(process.argv.slice(2)) + "\n");
if (process.argv.includes("--version")) process.exit(0);
const isResume = process.argv.includes("resume");
console.log(JSON.stringify({session_id: isResume ? "dispatch-comment-session" : "master-comment-session"}));
process.exit(0);
|}
        );
      Unix.chmod codex_bin 0o755;
      write_text_file config_path
        ("{:agent-name \"agent-a\" :codex-bin \"" ^ codex_bin ^ "\"}");
      let registry_page =
        {|{\"~:db/id\":100,\"~:block/uuid\":\"~uaaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa\",\"~:block/name\":\"agentbridge\",\"~:block/title\":\"AgentBridge\"}|}
      in
      let agent_page =
        {|{\"~:db/id\":101,\"~:block/uuid\":\"~ubbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb\",\"~:block/name\":\"agent-a\",\"~:block/title\":\"agent-a\"}|}
      in
      let master_block =
        {|{\"~:db/id\":110,\"~:block/uuid\":\"~ucccccccc-cccc-4ccc-8ccc-cccccccccccc\",\"~:block/title\":\"AgentBridge master prompt\",\"~:block/order\":1,\"~:block/_parent\":[{\"~:db/id\":111,\"~:block/title\":\"Graph master prompt\",\"~:block/order\":1,\"~:block/tags\":[{\"~:db/ident\":\"~:logseq.class/Code-block\"}]}]}|}
      in
      let comment_uuid = "33333333-3333-4333-8333-333333333333" in
      let comments_area_uuid = "44444444-4444-4444-8444-444444444444" in
      let target_uuid = "55555555-5555-4555-8555-555555555555" in
      let comment_block =
        {|{\"~:db/id\":30,\"~:block/uuid\":\"~u|} ^ comment_uuid
        ^ {|\",\"~:block/title\":\"Please check this [[agent-a]]\",\"~:block/tags\":[{\"~:db/ident\":\"~:logseq.class/Comment\"}],\"~:block/refs\":[{\"~:db/id\":101,\"~:block/title\":\"agent-a\",\"~:block/name\":\"agent-a\"}],\"~:block/parent\":{\"~:db/id\":40,\"~:block/uuid\":\"~u|}
        ^ comments_area_uuid
        ^ {|\",\"~:block/title\":\"Comments\",\"~:block/tags\":[{\"~:db/ident\":\"~:logseq.class/Comments\"}]}}|}
      in
      let comments_area =
        {|{\"~:db/id\":40,\"~:block/uuid\":\"~u|} ^ comments_area_uuid
        ^ {|\",\"~:block/title\":\"Comments\",\"~:block/tags\":[{\"~:db/ident\":\"~:logseq.class/Comments\"}],\"~:logseq.property.comments/blocks\":[{\"~:db/id\":50,\"~:block/uuid\":\"~u|}
        ^ target_uuid
        ^ {|\",\"~:block/title\":\"Target task context\",\"~:logseq.property/assignee\":[{\"~:block/title\":\"agent-a\"}]}]}|}
      in
      let event_body =
        {|data: {"type":"sync-db-changes","payload":"[\"^ \",\"~:tx-data\",[[\"^ \",\"~:e\",30,\"~:a\",\"~:block/title\",\"~:v\",\"Please check this [[agent-a]]\",\"~:added\",true]]]"}|}
        ^ "\n\n"
      in
      with_http_server_sequence
        [
          (fun request ->
            assert_contains ~name:"agent comment registry query"
              {|"method":"thread-api/q"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[|} ^ registry_page ^ {|]"}|} ));
          (fun request ->
            assert_contains ~name:"agent comment registered agent" {|agent-a|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[|} ^ agent_page ^ {|]"}|} ));
          (fun request ->
            assert_contains ~name:"agent comment agent page" {|agent-a|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[|} ^ agent_page ^ {|]"}|} ));
          (fun request ->
            assert_contains ~name:"agent comment master prompt"
              {|block/_parent|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[|} ^ master_block ^ {|]"}|} ));
          (fun request ->
            assert_contains ~name:"agent comment template page" {|agentbridge|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[|} ^ registry_page ^ {|]"}|} ));
          (fun request ->
            assert_contains ~name:"agent comment template blocks"
              {|block/_parent|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[]"}|} ));
          (fun request ->
            assert_equal ~name:"agent comment events request"
              "GET /v1/events HTTP/1.1" request.request_line;
            (200, [ ("Content-Type", "text/event-stream") ], event_body));
          (fun request ->
            assert_contains ~name:"agent comment pulls comment"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"agent comment pull id" {|30|} request.body;
            assert_contains ~name:"agent comment pull selector" {|block/refs|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"|} ^ comment_block ^ {|" }|} ));
          (fun request ->
            assert_contains ~name:"agent comment event task scan"
              {|"method":"thread-api/q"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[]"}|} ));
          (fun request ->
            assert_contains ~name:"agent comment pulls area"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"agent comment area id" {|40|} request.body;
            assert_contains ~name:"agent comment target blocks selector"
              {|logseq.property.comments/blocks|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"|} ^ comments_area ^ {|" }|} ));
          (fun request ->
            assert_contains ~name:"agent comment shows target" target_uuid
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"{\"~:db/id\":50,\"~:block/uuid\":\"~u|}
              ^ target_uuid
              ^ {|\",\"~:block/title\":\"Target task context\",\"~:block/order\":1,\"~:block/page\":{\"~:db/id\":500}}"}|}
            ));
          (fun request ->
            assert_contains ~name:"agent comment target page blocks"
              {|"method":"thread-api/q"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[{\"~:db/id\":50,\"~:block/uuid\":\"~u|}
              ^ target_uuid
              ^ {|\",\"~:block/title\":\"Target task context\",\"~:block/order\":1,\"~:block/page\":{\"~:db/id\":500}}]"}|}
            ));
          (fun request ->
            assert_contains ~name:"agent comment target breadcrumb"
              {|"method":"thread-api/get-block-parents"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[]"}|} ));
          (fun request ->
            assert_contains ~name:"agent comment shows area" comments_area_uuid
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"{\"~:db/id\":40,\"~:block/uuid\":\"~u|}
              ^ comments_area_uuid
              ^ {|\",\"~:block/title\":\"Comments\",\"~:block/order\":2,\"~:block/page\":{\"~:db/id\":500}}"}|}
            ));
          (fun request ->
            assert_contains ~name:"agent comment area page blocks"
              {|"method":"thread-api/q"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[{\"~:db/id\":40,\"~:block/uuid\":\"~u|}
              ^ comments_area_uuid
              ^ {|\",\"~:block/title\":\"Comments\",\"~:block/order\":2,\"~:block/page\":{\"~:db/id\":500}}]"}|}
            ));
          (fun request ->
            assert_contains ~name:"agent comment area breadcrumb"
              {|"method":"thread-api/get-block-parents"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[]"}|} ));
          (fun request ->
            assert_contains ~name:"agent comment shows comment" comment_uuid
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"{\"~:db/id\":30,\"~:block/uuid\":\"~u|}
              ^ comment_uuid
              ^ {|\",\"~:block/title\":\"Please check this [[agent-a]]\",\"~:block/order\":3,\"~:block/page\":{\"~:db/id\":500}}"}|}
            ));
          (fun request ->
            assert_contains ~name:"agent comment page blocks"
              {|"method":"thread-api/q"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[{\"~:db/id\":30,\"~:block/uuid\":\"~u|}
              ^ comment_uuid
              ^ {|\",\"~:block/title\":\"Please check this [[agent-a]]\",\"~:block/order\":3,\"~:block/page\":{\"~:db/id\":500}}]"}|}
            ));
          (fun request ->
            assert_contains ~name:"agent comment breadcrumb"
              {|"method":"thread-api/get-block-parents"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[]"}|} ));
          (fun request ->
            assert_contains ~name:"agent comment reaction query" {|eyes|}
              request.body;
            assert_contains ~name:"agent comment reaction uuid" comment_uuid
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"null"}|} ));
          (fun request ->
            assert_contains ~name:"agent comment toggle reaction"
              {|toggle-reaction|} request.body;
            assert_contains ~name:"agent comment toggle uuid" comment_uuid
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"{\"~:ok\":true}"}|} ));
          (fun request ->
            assert_contains ~name:"agent comment initial task scan"
              {|"method":"thread-api/q"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[]"}|} ));
        ]
        (fun base_url ->
          Lwt_main.run
            (Lwt.pick
               [
                 Cli_effect.to_lwt
                   (Cli.run app
                      (cli_input
                         [
                           "--config";
                           config_path;
                           "--root-dir";
                           root;
                           "--graph";
                           "alpha";
                           "--output";
                           "json";
                           "agent";
                           "bridge";
                         ]
                         ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]))
                 |> Lwt.map (fun _ -> ());
                 sleep_lwt_ms 2000L;
               ]);
          let codex_calls = read_text_file codex_log in
          assert_contains ~name:"agent comment starts master"
            "master-comment-session" codex_calls;
          assert_contains ~name:"agent comment resumes master" "resume"
            codex_calls;
          assert_contains ~name:"agent comment prompt kind"
            "Request kind: comment" codex_calls;
          assert_contains ~name:"agent comment prompt title"
            "Please check this [[agent-a]]" codex_calls;
          assert_contains ~name:"agent comment prompt target context"
            "Target task context" codex_calls));

  check
    "Cli.run aligns agent bridge initialization and task prompts with upstream"
    (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-agent-bridge-upstream-" in
      ensure_test_dir root;
      let config_path = Filename.concat root "cli.edn" in
      let codex_log = Filename.concat root "codex.log" in
      let codex_bin = Filename.concat root "fake-codex.js" in
      write_text_file codex_bin
        ({|#!/usr/bin/env node
const fs = require("fs");
const logPath = |}
        ^ Printf.sprintf "%S" codex_log
        ^ {|;
fs.appendFileSync(logPath, JSON.stringify(process.argv.slice(2)) + "\n");
if (process.argv.includes("--version")) process.exit(0);
const isResume = process.argv.includes("resume");
console.log(JSON.stringify({session: {id: isResume ? "dispatch-session-2" : "master-session-2"}}));
process.exit(0);
|}
        );
      Unix.chmod codex_bin 0o755;
      write_text_file config_path
        ("{:agent-name \"agent-a\" :agent-bridge-process-once? true :codex-bin \
          \"" ^ codex_bin ^ "\"}");
      let registry_page =
        {|{\"~:db/id\":100,\"~:block/uuid\":\"~uaaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa\",\"~:block/name\":\"agentbridge\",\"~:block/title\":\"AgentBridge\"}|}
      in
      let agent_page =
        {|{\"~:db/id\":101,\"~:block/uuid\":\"~ubbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb\",\"~:block/name\":\"agent-a\",\"~:block/title\":\"agent-a\"}|}
      in
      let master_prompt =
        "Graph master prompt from graph\\nChild task blocks and comment \
         requests under a task with `:logseq.property.agent/session-id` must \
         continue in that same subagent session."
      in
      let master_block =
        {|{\"~:db/id\":110,\"~:block/uuid\":\"~ucccccccc-cccc-4ccc-8ccc-cccccccccccc\",\"~:block/title\":\"AgentBridge master prompt\",\"~:block/order\":1,\"~:block/_parent\":[{\"~:db/id\":111,\"~:block/uuid\":\"~uc1111111-1111-4111-8111-111111111111\",\"~:block/title\":\"|}
        ^ master_prompt
        ^ {|\",\"~:block/order\":1,\"~:block/tags\":[{\"~:db/ident\":\"~:logseq.class/Code-block\"}]}]}|}
      in
      let task_template_block =
        {|{\"~:db/id\":120,\"~:block/uuid\":\"~udddddddd-dddd-4ddd-8ddd-dddddddddddd\",\"~:block/title\":\"Task prompt template\",\"~:block/order\":1,\"~:block/_parent\":[{\"~:db/id\":121,\"~:block/title\":\"```text\\nYou are handling a Logseq AgentBridge task.\\n\\nGraph: {{graph}}\\nBlock UUID: {{block-uuid}}\\nAgentBridge name: {{agent-name}}\\n\\nTask block tree:\\n{{task-block-tree}}\\n```\",\"~:block/order\":1}]}|}
      in
      let comment_template_block =
        {|{\"~:db/id\":130,\"~:block/uuid\":\"~ueeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee\",\"~:block/title\":\"Comment prompt template\",\"~:block/order\":2,\"~:block/_parent\":[{\"~:db/id\":131,\"~:block/title\":\"```text\\nYou are handling a Logseq AgentBridge comment request.\\n\\nGraph: {{graph}}\\nComment UUID: {{comment-uuid}}\\nAgentBridge name: {{agent-name}}\\n\\nComment target context:\\n{{comment-target-context}}\\n\\nComment thread context:\\n{{comment-thread-context}}\\n\\nRequesting comment:\\n{{requesting-comment}}\\n```\",\"~:block/order\":1}]}|}
      in
      let task_uuid = "11111111-1111-1111-1111-111111111111" in
      let parent_uuid = "99999999-9999-4999-8999-999999999999" in
      let routable =
        {|{\"~:db/id\":7,\"~:block/uuid\":\"~u|} ^ task_uuid
        ^ {|\",\"~:block/title\":\"Child task root\",\"~:block/tags\":[{\"~:db/ident\":\"~:logseq.class/Task\"}],\"~:logseq.property/status\":{\"~:db/ident\":\"~:logseq.property/status.todo\"},\"~:logseq.property/assignee\":[{\"~:block/title\":\"agent-a\"}],\"~:block/parent\":{\"~:db/id\":70}}|}
      in
      let show_root =
        {|{\"~:db/id\":7,\"~:block/uuid\":\"~u|} ^ task_uuid
        ^ {|\",\"~:block/title\":\"Child task root\",\"~:block/order\":1,\"~:block/page\":{\"~:db/id\":200},\"~:block/tags\":[{\"~:db/ident\":\"~:logseq.class/Task\"}],\"~:logseq.property/status\":{\"~:db/ident\":\"~:logseq.property/status.todo\"}}|}
      in
      let show_child =
        {|{\"~:db/id\":8,\"~:block/uuid\":\"~u88888888-8888-4888-8888-888888888888\",\"~:block/title\":\"Child task detail line\",\"~:block/order\":2,\"~:block/parent\":{\"~:db/id\":7},\"~:block/page\":{\"~:db/id\":200}}|}
      in
      let parent_task =
        {|{\"~:db/id\":70,\"~:block/uuid\":\"~u|} ^ parent_uuid
        ^ {|\",\"~:block/title\":\"Parent task\",\"~:block/tags\":[{\"~:db/ident\":\"~:logseq.class/Task\"}],\"~:logseq.property.agent/session-id\":\"inherited-session-1\"}|}
      in
      with_http_server_sequence
        [
          (fun request ->
            assert_contains ~name:"agent upstream pulls registry page"
              {|agentbridge|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[|} ^ registry_page ^ {|]"}|} ));
          (fun request ->
            assert_contains ~name:"agent upstream checks registered agent"
              {|agent-a|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[|} ^ agent_page ^ {|]"}|} ));
          (fun request ->
            assert_contains ~name:"agent upstream pulls agent page for prompt"
              {|agent-a|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[|} ^ agent_page ^ {|]"}|} ));
          (fun request ->
            assert_contains ~name:"agent upstream loads master prompt blocks"
              {|block/_parent|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[|} ^ master_block ^ {|]"}|} ));
          (fun request ->
            assert_contains ~name:"agent upstream rechecks registry page"
              {|agentbridge|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[|} ^ registry_page ^ {|]"}|} ));
          (fun request ->
            assert_contains ~name:"agent upstream loads prompt templates"
              {|block/_parent|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[|} ^ task_template_block ^ {|,|}
              ^ comment_template_block ^ {|]"}|} ));
          (fun request ->
            assert_contains ~name:"agent upstream lists tasks after init"
              {|agent-a|} request.body;
            assert_contains ~name:"agent upstream task query status"
              {|logseq.property/status.todo|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[|} ^ routable ^ {|]"}|} ));
          (fun request ->
            assert_contains ~name:"agent upstream show pulls task by uuid"
              task_uuid request.body;
            assert_contains ~name:"agent upstream show method"
              {|"method":"thread-api/pull"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"|} ^ show_root ^ {|" }|} ));
          (fun request ->
            assert_contains ~name:"agent upstream show loads page blocks"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"agent upstream show page id" {|200|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[|} ^ show_root ^ {|,|} ^ show_child ^ {|]"}|}
            ));
          (fun request ->
            assert_contains ~name:"agent upstream show breadcrumb"
              {|"method":"thread-api/get-block-parents"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[]"}|} ));
          (fun request ->
            assert_contains ~name:"agent upstream pulls parent task session"
              {|70|} request.body;
            assert_contains ~name:"agent upstream parent pull method"
              {|"method":"thread-api/pull"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"|} ^ parent_task ^ {|" }|} ));
          (fun request ->
            assert_contains ~name:"agent upstream reaction query"
              {|"method":"thread-api/q"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"null"}|} ));
          (fun request ->
            assert_contains ~name:"agent upstream toggle reaction"
              {|toggle-reaction|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"{\"~:ok\":true}"}|} ));
          (fun request ->
            assert_contains ~name:"agent upstream status query"
              {|logseq.property/status|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"~#'\",\"~:logseq.property/status.todo\"]"}|}
            ));
          (fun request ->
            assert_contains ~name:"agent upstream set doing"
              {|logseq.property/status.doing|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"{\"~:ok\":true}"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    [
                      "--config";
                      config_path;
                      "--root-dir";
                      root;
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "agent";
                      "bridge";
                    ]
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]))
          in
          assert_int ~name:"agent upstream exit" 0 output.exit_code;
          let codex_calls = read_text_file codex_log in
          assert_contains ~name:"agent upstream master prompt from graph"
            "Graph master prompt from graph" codex_calls;
          assert_contains ~name:"agent upstream dispatch tree text"
            "Child task detail line" codex_calls;
          assert_contains ~name:"agent upstream inherited session prompt"
            "Inherited subagent session id: inherited-session-1" codex_calls;
          assert_contains ~name:"agent upstream inherited parent prompt"
            ("Inherited parent task UUID: " ^ parent_uuid)
            codex_calls));

  check
    "Cli.run creates default agent bridge master prompt with flattened children"
    (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-agent-bridge-default-prompt-" in
      ensure_test_dir root;
      let config_path = Filename.concat root "cli.edn" in
      let codex_log = Filename.concat root "codex.log" in
      let codex_bin = Filename.concat root "fake-codex.js" in
      write_text_file codex_bin
        ({|#!/usr/bin/env node
const fs = require("fs");
const logPath = |}
        ^ Printf.sprintf "%S" codex_log
        ^ {|;
fs.appendFileSync(logPath, JSON.stringify(process.argv.slice(2)) + "\n");
if (process.argv.includes("--version")) process.exit(0);
console.log(JSON.stringify({session_id: "master-session-3"}));
process.exit(0);
|}
        );
      Unix.chmod codex_bin 0o755;
      write_text_file config_path
        ("{:agent-name \"agent-a\" :agent-bridge-process-once? true :codex-bin \
          \"" ^ codex_bin ^ "\"}");
      let registry_page =
        {|{\"~:db/id\":100,\"~:block/uuid\":\"~uaaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa\",\"~:block/name\":\"agentbridge\",\"~:block/title\":\"AgentBridge\"}|}
      in
      let agent_page =
        {|{\"~:db/id\":101,\"~:block/uuid\":\"~ubbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb\",\"~:block/name\":\"agent-a\",\"~:block/title\":\"agent-a\"}|}
      in
      with_http_server_sequence
        [
          (fun request ->
            assert_contains ~name:"agent default prompt pulls registry"
              {|agentbridge|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[|} ^ registry_page ^ {|]"}|} ));
          (fun request ->
            assert_contains ~name:"agent default prompt checks agent"
              {|agent-a|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[|} ^ agent_page ^ {|]"}|} ));
          (fun request ->
            assert_contains ~name:"agent default prompt pulls agent page"
              {|agent-a|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[|} ^ agent_page ^ {|]"}|} ));
          (fun request ->
            assert_contains ~name:"agent default prompt query" {|block/_parent|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[]"}|} ));
          (fun request ->
            assert_contains ~name:"agent default prompt insert method"
              {|"method":"thread-api/apply-outliner-ops"|} request.body;
            assert_contains ~name:"agent default prompt insert op"
              {|insert-blocks|} request.body;
            assert_not_contains ~name:"agent default prompt flattens children"
              {|block/children|} request.body;
            assert_not_contains
              ~name:"agent default prompt avoids lookup parent" {|block/parent|}
              request.body;
            assert_contains ~name:"agent default prompt code tag"
              {|logseq.class/Code-block|} request.body;
            assert_contains ~name:"agent default prompt keeps uuid"
              {|keep-uuid|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"{\"~:ok\":true}"}|} ));
          (fun request ->
            assert_contains ~name:"agent default prompt rechecks registry"
              {|agentbridge|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[|} ^ registry_page ^ {|]"}|} ));
          (fun request ->
            assert_contains ~name:"agent default prompt loads templates"
              {|block/_parent|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[]"}|} ));
          (fun request ->
            assert_contains ~name:"agent default prompt lists tasks" {|agent-a|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[]"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    [
                      "--config";
                      config_path;
                      "--root-dir";
                      root;
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "agent";
                      "bridge";
                    ]
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]))
          in
          assert_int ~name:"agent default prompt exit" 0 output.exit_code;
          let body = String.trim (cli_stdout output) in
          assert_contains ~name:"agent default prompt status" {|"status":"ok"|}
            body;
          assert_contains ~name:"agent default prompt no routed tasks"
            {|"routed":[]|} body));

  check "Cli.run repairs agent bridge master prompt wrapper without code block"
    (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-agent-bridge-repair-prompt-" in
      ensure_test_dir root;
      let config_path = Filename.concat root "cli.edn" in
      let codex_log = Filename.concat root "codex.log" in
      let codex_bin = Filename.concat root "fake-codex.js" in
      write_text_file codex_bin
        ({|#!/usr/bin/env node
const fs = require("fs");
const logPath = |}
        ^ Printf.sprintf "%S" codex_log
        ^ {|;
fs.appendFileSync(logPath, JSON.stringify(process.argv.slice(2)) + "\n");
if (process.argv.includes("--version")) process.exit(0);
console.log(JSON.stringify({session_id: "master-session-repaired"}));
process.exit(0);
|}
        );
      Unix.chmod codex_bin 0o755;
      write_text_file config_path
        ("{:agent-name \"agent-a\" :agent-bridge-process-once? true :codex-bin \
          \"" ^ codex_bin ^ "\"}");
      let registry_page =
        {|{\"~:db/id\":100,\"~:block/uuid\":\"~uaaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa\",\"~:block/name\":\"agentbridge\",\"~:block/title\":\"AgentBridge\"}|}
      in
      let agent_page =
        {|{\"~:db/id\":101,\"~:block/uuid\":\"~ubbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb\",\"~:block/name\":\"agent-a\",\"~:block/title\":\"agent-a\"}|}
      in
      let broken_master_block =
        {|{\"~:db/id\":110,\"~:block/uuid\":\"~ucccccccc-cccc-4ccc-8ccc-cccccccccccc\",\"~:block/title\":\"AgentBridge master prompt\",\"~:block/order\":1}|}
      in
      with_http_server_sequence
        [
          (fun request ->
            assert_contains ~name:"agent repair prompt pulls registry"
              {|agentbridge|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[|} ^ registry_page ^ {|]"}|} ));
          (fun request ->
            assert_contains ~name:"agent repair prompt checks agent" {|agent-a|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[|} ^ agent_page ^ {|]"}|} ));
          (fun request ->
            assert_contains ~name:"agent repair prompt pulls agent page"
              {|agent-a|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[|} ^ agent_page ^ {|]"}|} ));
          (fun request ->
            assert_contains ~name:"agent repair prompt query" {|block/_parent|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[|} ^ broken_master_block ^ {|]"}|} ));
          (fun request ->
            assert_contains ~name:"agent repair prompt insert method"
              {|"method":"thread-api/apply-outliner-ops"|} request.body;
            assert_contains ~name:"agent repair prompt inserts code child"
              {|logseq.class/Code-block|} request.body;
            assert_contains ~name:"agent repair prompt targets wrapper"
              {|cccccccc-cccc-4ccc-8ccc-cccccccccccc|} request.body;
            assert_not_contains
              ~name:"agent repair prompt does not insert wrapper"
              {|AgentBridge master prompt|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"{\"~:ok\":true}"}|} ));
          (fun request ->
            assert_contains ~name:"agent repair prompt rechecks registry"
              {|agentbridge|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[|} ^ registry_page ^ {|]"}|} ));
          (fun request ->
            assert_contains ~name:"agent repair prompt loads templates"
              {|block/_parent|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[]"}|} ));
          (fun request ->
            assert_contains ~name:"agent repair prompt lists tasks" {|agent-a|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[]"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    [
                      "--config";
                      config_path;
                      "--root-dir";
                      root;
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "agent";
                      "bridge";
                    ]
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]))
          in
          assert_int ~name:"agent repair prompt exit" 0 output.exit_code;
          let body = String.trim (cli_stdout output) in
          assert_contains ~name:"agent repair prompt status" {|"status":"ok"|}
            body;
          let codex_calls = read_text_file codex_log in
          assert_contains ~name:"agent repair prompt uses default master prompt"
            {|AgentBridge Master Agent|} codex_calls));

  check "Cli.run refuses agent bridge when a live bridge lock exists" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-agent-bridge-live-lock-" in
      ensure_test_dir root;
      let config_path = Filename.concat root "cli.edn" in
      let codex_bin = Filename.concat root "fake-codex.js" in
      write_text_file codex_bin
        {|#!/usr/bin/env node
if (process.argv.includes("--version")) process.exit(0);
console.log(JSON.stringify({session_id: "master-session-lock"}));
process.exit(0);
|};
      Unix.chmod codex_bin 0o755;
      write_text_file config_path
        ("{:agent-name \"agent-a\" :agent-bridge-process-once? true :codex-bin \
          \"" ^ codex_bin ^ "\"}");
      let lock_dir =
        Filename.concat
          (Filename.concat root "agent-bridge-locks")
          "alpha--agent-a.lock"
      in
      ensure_test_dir (Filename.dirname lock_dir);
      ensure_test_dir lock_dir;
      write_text_file
        (Filename.concat lock_dir "owner.edn")
        (Printf.sprintf
           "{:pid %d :graph \"alpha\" :agent \"agent-a\" :started-at \"test\"}"
           (Unix.getpid ()));
      let output =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--config";
                  config_path;
                  "--root-dir";
                  root;
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "agent";
                  "bridge";
                ]))
      in
      assert_int ~name:"agent live lock exit" 1 output.exit_code;
      let body = String.trim (cli_stdout output) in
      assert_contains ~name:"agent live lock status" {|"status":"error"|} body;
      assert_contains ~name:"agent live lock code"
        {|"code":"agent-bridge-already-running"|} body;
      assert_contains ~name:"agent live lock graph" {|graph 'alpha'|} body;
      assert_contains ~name:"agent live lock agent"
        {|AgentBridge name 'agent-a'|} body);

  check "Cli.run replaces stale agent bridge locks" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-agent-bridge-stale-lock-" in
      ensure_test_dir root;
      let config_path = Filename.concat root "cli.edn" in
      let codex_log = Filename.concat root "codex.log" in
      let codex_bin = Filename.concat root "fake-codex.js" in
      write_text_file codex_bin
        ({|#!/usr/bin/env node
const fs = require("fs");
const logPath = |}
        ^ Printf.sprintf "%S" codex_log
        ^ {|;
fs.appendFileSync(logPath, JSON.stringify(process.argv.slice(2)) + "\n");
if (process.argv.includes("--version")) process.exit(0);
console.log(JSON.stringify({session_id: "master-session-stale"}));
process.exit(0);
|}
        );
      Unix.chmod codex_bin 0o755;
      write_text_file config_path
        ("{:agent-name \"agent-a\" :agent-bridge-process-once? true :codex-bin \
          \"" ^ codex_bin ^ "\"}");
      let lock_dir =
        Filename.concat
          (Filename.concat root "agent-bridge-locks")
          "alpha--agent-a.lock"
      in
      ensure_test_dir (Filename.dirname lock_dir);
      ensure_test_dir lock_dir;
      write_text_file
        (Filename.concat lock_dir "owner.edn")
        "{:pid -1 :graph \"alpha\" :agent \"agent-a\" :started-at \"old\"}";
      let registry_page =
        {|{\"~:db/id\":100,\"~:block/uuid\":\"~uaaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa\",\"~:block/name\":\"agentbridge\",\"~:block/title\":\"AgentBridge\"}|}
      in
      let agent_page =
        {|{\"~:db/id\":101,\"~:block/uuid\":\"~ubbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb\",\"~:block/name\":\"agent-a\",\"~:block/title\":\"agent-a\"}|}
      in
      let master_block =
        {|{\"~:db/id\":110,\"~:block/title\":\"AgentBridge master prompt\",\"~:block/order\":1,\"~:block/_parent\":[{\"~:db/id\":111,\"~:block/title\":\"Graph master prompt\",\"~:block/order\":1,\"~:block/tags\":[{\"~:db/ident\":\"~:logseq.class/Code-block\"}]}]}|}
      in
      with_http_server_sequence
        [
          (fun _request ->
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[|} ^ registry_page ^ {|]"}|} ));
          (fun _request ->
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[|} ^ agent_page ^ {|]"}|} ));
          (fun _request ->
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[|} ^ agent_page ^ {|]"}|} ));
          (fun _request ->
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[|} ^ master_block ^ {|]"}|} ));
          (fun _request ->
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[|} ^ registry_page ^ {|]"}|} ));
          (fun _request ->
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[]"}|} ));
          (fun _request ->
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[]"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    [
                      "--config";
                      config_path;
                      "--root-dir";
                      root;
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "agent";
                      "bridge";
                    ]
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]))
          in
          assert_int ~name:"agent stale lock exit" 0 output.exit_code;
          let body = String.trim (cli_stdout output) in
          assert_contains ~name:"agent stale lock status" {|"status":"ok"|} body;
          assert_bool ~name:"agent stale lock released" false
            (Sys.file_exists lock_dir)));

  check "Cli.run reports invalid agent bridge agent name" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-agent-bridge-invalid-" in
      ensure_test_dir root;
      let config_path = Filename.concat root "cli.edn" in
      write_text_file config_path {|{:agent-name "   "}|};
      let output =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--config";
                  config_path;
                  "--root-dir";
                  root;
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "agent";
                  "bridge";
                ]))
      in
      assert_int ~name:"agent invalid exit" 1 output.exit_code;
      let body = String.trim (cli_stdout output) in
      assert_contains ~name:"agent invalid status" {|"status":"error"|} body;
      assert_contains ~name:"agent invalid code" {|"code":"agent-name-invalid"|}
        body);

  check "Cli.run executes server list through typed action" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-server-list-run-" in
      Unix.mkdir root 0o755;
      with_http_server_port
        (fun port request ->
          assert_equal ~name:"server list health line" "GET /healthz HTTP/1.1"
            request.request_line;
          ( 200,
            [ ("Content-Type", "application/json") ],
            {|{"repo":"logseq_db_alpha","status":"ready","host":"127.0.0.1","port":|}
            ^ string_of_int port
            ^ {|,"pid":1234,"owner-source":"cli","root-dir":"/tmp/root","revision":"rev-a"}|}
          ))
        (fun base_url ->
          let port =
            match String.rindex_opt base_url ':' with
            | Some idx ->
                int_of_string
                  (String.sub base_url (idx + 1)
                     (String.length base_url - idx - 1))
            | None -> failf "expected server port"
          in
          write_text_file
            (Filename.concat root "server-list")
            (string_of_int (Unix.getpid ()) ^ " " ^ string_of_int port ^ "\n");
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    [ "--root-dir"; root; "--output"; "json"; "server"; "list" ]))
          in
          assert_int ~name:"server list exit" 0 output.exit_code;
          let body = String.trim (cli_stdout output) in
          assert_contains ~name:"server list status" {|"status":"ok"|} body;
          assert_contains ~name:"server list repo" {|"repo":"logseq_db_alpha"|}
            body;
          assert_contains ~name:"server list graph" {|"graph":"alpha"|} body;
          assert_contains ~name:"server list base url"
            ({|"base-url":"|} ^ base_url ^ {|"|})
            body;
          match output.lifecycle.action with
          | Some (Cli_action.Server Server_command.Server_list) -> ()
          | _ -> failf "expected typed server list action"));

  check "Cli.run cleans up revision-mismatched CLI-owned server" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-server-cleanup-" in
      Unix.mkdir root 0o755;
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"server cleanup initial health line"
              "GET /healthz HTTP/1.1" request.request_line;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"repo":"logseq_db_alpha","status":"ready","host":"127.0.0.1","pid":1234,"owner-source":"cli","root-dir":"/tmp/root","revision":"old-rev"}|}
            ));
          (fun request ->
            assert_equal ~name:"server cleanup shutdown line"
              "POST /v1/shutdown HTTP/1.1" request.request_line;
            (200, [ ("Content-Type", "application/json") ], "{}"));
        ]
        (fun base_url ->
          let port =
            match String.rindex_opt base_url ':' with
            | Some idx ->
                int_of_string
                  (String.sub base_url (idx + 1)
                     (String.length base_url - idx - 1))
            | None -> failf "expected server port"
          in
          write_text_file
            (Filename.concat root "server-list")
            (string_of_int (Unix.getpid ()) ^ " " ^ string_of_int port ^ "\n");
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    [
                      "--root-dir";
                      root;
                      "--output";
                      "json";
                      "server";
                      "cleanup";
                    ]))
          in
          assert_int ~name:"server cleanup exit" 0 output.exit_code;
          let body = String.trim (cli_stdout output) in
          assert_contains ~name:"server cleanup cli revision"
            {|"cli-revision":"unknown"|} body;
          assert_contains ~name:"server cleanup checked" {|"checked":1|} body;
          assert_contains ~name:"server cleanup mismatched" {|"mismatched":1|}
            body;
          assert_contains ~name:"server cleanup eligible" {|"eligible":1|} body;
          assert_contains ~name:"server cleanup killed"
            {|"killed":[{"repo":"logseq_db_alpha"|} body;
          match output.lifecycle.action with
          | Some (Cli_action.Server Server_command.Server_cleanup) -> ()
          | _ -> failf "expected typed server cleanup action"));

  check "Cli.run reports failed server cleanup targets" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-server-cleanup-failed-" in
      Unix.mkdir root 0o755;
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"server cleanup failed health line"
              "GET /healthz HTTP/1.1" request.request_line;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"repo":"logseq_db_alpha","status":"ready","host":"127.0.0.1","pid":1234,"owner-source":"cli","root-dir":"/tmp/root","revision":"old-rev"}|}
            ));
          (fun request ->
            assert_equal ~name:"server cleanup failed shutdown line"
              "POST /v1/shutdown HTTP/1.1" request.request_line;
            (500, [ ("Content-Type", "application/json") ], "{}"));
        ]
        (fun base_url ->
          let port =
            match String.rindex_opt base_url ':' with
            | Some idx ->
                int_of_string
                  (String.sub base_url (idx + 1)
                     (String.length base_url - idx - 1))
            | None -> failf "expected server port"
          in
          write_text_file
            (Filename.concat root "server-list")
            (string_of_int (Unix.getpid ()) ^ " " ^ string_of_int port ^ "\n");
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    [
                      "--root-dir";
                      root;
                      "--output";
                      "json";
                      "server";
                      "cleanup";
                    ]))
          in
          assert_int ~name:"server cleanup failed exit" 0 output.exit_code;
          let body = String.trim (cli_stdout output) in
          assert_contains ~name:"server cleanup failed checked" {|"checked":1|}
            body;
          assert_contains ~name:"server cleanup failed killed empty"
            {|"killed":[]|} body;
          assert_contains ~name:"server cleanup failed entry"
            {|"failed":[{"repo":"logseq_db_alpha"|} body;
          assert_contains ~name:"server cleanup failed error code"
            {|"error":{"code":"server-cleanup-failed","message":"failed to stop revision-mismatched server"}|}
            body));

  check "Cli.run executes server start through typed action" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let cwd = fresh_root "logseq-cli-server-start-cwd-" in
      let root = fresh_root "logseq-cli-server-start-root-" in
      ensure_test_dir cwd;
      ensure_test_dir root;
      ignore (write_fake_db_worker_node cwd);
      let output =
        run_blocking
          (Cli.run app
             (cli_input ~cwd
                [
                  "--root-dir";
                  root;
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "server";
                  "start";
                ]))
      in
      assert_int ~name:"server start exit" 0 output.exit_code;
      let body = String.trim (cli_stdout output) in
      assert_contains ~name:"server start status" {|"status":"ok"|} body;
      assert_contains ~name:"server start repo" {|"repo":"logseq_db_alpha"|}
        body;
      assert_contains ~name:"server start owner" {|"owner-source":"cli"|} body;
      (match output.lifecycle.action with
      | Some (Cli_action.Server (Server_command.Server_start { repo; graph }))
        ->
          assert_equal ~name:"server start repo action" "logseq_db_alpha"
            (repo_string repo);
          assert_equal ~name:"server start graph action" "alpha"
            (graph_string graph);
          assert_equal ~name:"server start command id" "server-start"
            (Command_id.to_string
               (Cli_action.command_id
                  (Cli_action.Server
                     (Server_command.Server_start { repo; graph }))))
      | _ -> failf "expected typed server start action");
      ignore
        (run_blocking
           (Cli.run app
              (cli_input ~cwd
                 [
                   "--root-dir";
                   root;
                   "--graph";
                   "alpha";
                   "--output";
                   "json";
                   "server";
                   "stop";
                 ]))));

  check "Cli.run rejects server start without a graph" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-server-start-missing-graph-" in
      let output =
        run_blocking
          (Cli.run app
             (cli_input
                [ "--root-dir"; root; "--output"; "json"; "server"; "start" ]))
      in
      assert_int ~name:"server start missing graph exit" 1 output.exit_code;
      assert_equal ~name:"server start missing graph json"
        {|{"status":"error","error":{"code":"missing-repo","message":"repo is required for server start"}}|}
        (String.trim (cli_stdout output));
      match
        ( output.lifecycle.request,
          output.lifecycle.config,
          output.lifecycle.action )
      with
      | Some _, Some _, None -> ()
      | _ -> failf "expected typed server start request/config without action");

  check "Cli.run server start profile includes server ensure span" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let cwd = fresh_root "logseq-cli-server-profile-cwd-" in
      let root = fresh_root "logseq-cli-server-profile-root-" in
      ensure_test_dir cwd;
      ensure_test_dir root;
      ignore (write_fake_db_worker_node cwd);
      let output =
        run_blocking
          (Cli.run app
             (cli_input ~cwd
                [
                  "--root-dir";
                  root;
                  "--graph";
                  "alpha";
                  "--profile";
                  "--output";
                  "json";
                  "server";
                  "start";
                ]))
      in
      assert_int ~name:"server start profile exit" 0 output.exit_code;
      let stderr = String.concat "\n" output.stderr in
      assert_contains ~name:"server start profile command"
        "command=server-start status=ok" stderr;
      assert_contains ~name:"server start profile ensure"
        "server.ensure-started" stderr;
      assert_contains ~name:"server start profile spawn" "server.spawn-daemon"
        stderr;
      assert_contains ~name:"server start profile lock" "server.wait-lock"
        stderr;
      assert_contains ~name:"server start profile publish" "server.wait-publish"
        stderr;
      assert_contains ~name:"server start profile ready" "server.wait-ready"
        stderr;
      ignore
        (run_blocking
           (Cli.run app
              (cli_input ~cwd
                 [
                   "--root-dir";
                   root;
                   "--graph";
                   "alpha";
                   "--output";
                   "json";
                   "server";
                   "stop";
                 ]))));

  check "Cli.run starts and stops a db-worker-node process" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let cwd = fresh_root "logseq-cli-server-runtime-cwd-" in
      let root = fresh_root "logseq-cli-server-runtime-root-" in
      ensure_test_dir cwd;
      ensure_test_dir root;
      ignore (write_fake_db_worker_node cwd);
      let start_output =
        run_blocking
          (Cli.run app
             (cli_input ~cwd
                [
                  "--root-dir";
                  root;
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "server";
                  "start";
                ]))
      in
      assert_int ~name:"runtime server start exit" 0 start_output.exit_code;
      let list_output =
        run_blocking
          (Cli.run app
             (cli_input ~cwd
                [ "--root-dir"; root; "--output"; "json"; "server"; "list" ]))
      in
      assert_int ~name:"runtime server list exit" 0 list_output.exit_code;
      assert_contains ~name:"runtime server list repo"
        {|"repo":"logseq_db_alpha"|} (cli_stdout list_output);
      assert_contains ~name:"runtime server list revision"
        {|"revision":"test-revision"|} (cli_stdout list_output);
      let stop_output =
        run_blocking
          (Cli.run app
             (cli_input ~cwd
                [
                  "--root-dir";
                  root;
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "server";
                  "stop";
                ]))
      in
      assert_int ~name:"runtime server stop exit" 0 stop_output.exit_code;
      assert_equal ~name:"runtime server stop json"
        {|{"status":"ok","data":{"repo":"logseq_db_alpha"}}|}
        (String.trim (cli_stdout stop_output));
      let config = test_config ~root_dir:root () in
      let stopped =
        wait_until 50 (fun () ->
            run_blocking (Server_runtime.list_servers config) = [])
      in
      if not stopped then failf "expected fake db-worker-node to stop");

  check "Cli.run executes debug pull by id through typed action" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server
        (fun request ->
          assert_equal ~name:"debug pull line" "POST /v1/invoke HTTP/1.1"
            request.request_line;
          assert_contains ~name:"debug pull method"
            {|"method":"thread-api/pull"|} request.body;
          assert_contains ~name:"debug pull repo" {|logseq_db_alpha|}
            request.body;
          assert_contains ~name:"debug pull selector" {|\"~$*\"|} request.body;
          assert_contains ~name:"debug pull id" {|,4]|} request.body;
          ( 200,
            [ ("Content-Type", "application/json") ],
            {|{"resultTransit":"[\"^ \",\"~:db/id\",4,\"~:block/title\",\"Home\"]"}|}
          ))
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "debug";
                      "pull";
                      "--id";
                      "4";
                    ]))
          in
          assert_int ~name:"debug pull exit" 0 output.exit_code;
          let body = String.trim (cli_stdout output) in
          assert_contains ~name:"debug pull entity"
            {|"entity":{"db/id":4,"block/title":"Home"}|} body;
          assert_contains ~name:"debug pull lookup" {|"lookup":4|} body;
          assert_contains ~name:"debug pull selector result"
            {|"selector":["~$*"]|} body;
          match output.lifecycle.action with
          | Some
              (Cli_action.Debug
                 (Debug.Debug_pull { repo; graph; lookup = Debug.By_id 4L; _ }))
            ->
              assert_equal ~name:"debug pull repo" "logseq_db_alpha"
                (repo_string repo);
              assert_equal ~name:"debug pull graph" "alpha" (graph_string graph)
          | _ -> failf "expected typed debug pull action"));

  check "Cli.run executes debug pull by uuid through typed action" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server
        (fun request ->
          assert_contains ~name:"debug pull uuid method"
            {|"method":"thread-api/pull"|} request.body;
          assert_contains ~name:"debug pull uuid lookup attr"
            {|\"~:block/uuid\"|} request.body;
          assert_contains ~name:"debug pull uuid lookup value"
            {|~u11111111-1111-1111-1111-111111111111|} request.body;
          ( 200,
            [ ("Content-Type", "application/json") ],
            {|{"resultTransit":"null"}|} ))
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "debug";
                      "pull";
                      "--uuid";
                      "11111111-1111-1111-1111-111111111111";
                    ]))
          in
          assert_int ~name:"debug pull missing exit" 1 output.exit_code;
          assert_equal ~name:"debug pull missing json"
            {|{"status":"error","error":{"code":"entity-not-found","message":"entity not found"}}|}
            (String.trim (cli_stdout output))));

  check "Cli.run rejects debug pull conflicting selectors" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let output =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "debug";
                  "pull";
                  "--id";
                  "4";
                  "--ident";
                  ":logseq.class/Tag";
                ]))
      in
      assert_int ~name:"debug pull conflict exit" 1 output.exit_code;
      assert_equal ~name:"debug pull conflict json"
        {|{"status":"error","error":{"code":"invalid-options","message":"only one of --id, --uuid, or --ident is allowed"}}|}
        (String.trim (cli_stdout output)));

  check "Cli.run rejects debug pull invalid uuid" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let output =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "debug";
                  "pull";
                  "--uuid";
                  "not-a-uuid";
                ]))
      in
      assert_int ~name:"debug pull invalid uuid exit" 1 output.exit_code;
      assert_equal ~name:"debug pull invalid uuid json"
        {|{"status":"error","error":{"code":"invalid-options","message":"Option uuid must be a valid UUID string"}}|}
        (String.trim (cli_stdout output)));

  check "Cli.run executes doctor missing script through typed action" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-doctor-missing-" in
      let output =
        run_blocking
          (Cli.run app
             (cli_input [ "--root-dir"; root; "--output"; "json"; "doctor" ]))
      in
      assert_int ~name:"doctor missing exit" 1 output.exit_code;
      let body = String.trim (cli_stdout output) in
      assert_contains ~name:"doctor missing status" {|"status":"error"|} body;
      assert_contains ~name:"doctor missing code"
        {|"code":"doctor-script-missing"|} body;
      assert_contains ~name:"doctor missing message"
        "db-worker script is missing" body;
      match output.lifecycle.action with
      | Some (Cli_action.Doctor (Doctor.Doctor { script_path = None })) -> ()
      | _ -> failf "expected typed doctor action");

  check "Cli.run creates and lists graphs through the public command path"
    (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-spec-run-" in
      let create_output =
        run_blocking
          (Cli.run app
             (cli_input
                [ "--root-dir"; root; "graph"; "create"; "--graph"; "alpha" ]))
      in
      assert_int ~name:"create exit" 0 create_output.exit_code;
      assert_contains ~name:"create output" "Created graph \"alpha\""
        (cli_stdout create_output);
      let list_output =
        run_blocking
          (Cli.run app
             (cli_input
                [ "--root-dir"; root; "--output"; "json"; "graph"; "list" ]))
      in
      assert_int ~name:"list exit" 0 list_output.exit_code;
      assert_equal ~name:"graph list json"
        {|{"status":"ok","data":{"graphs":["alpha"],"graph-items":[{"kind":"canonical","graph-name":"alpha","graph-dir":"alpha"}]}}|}
        (String.trim (cli_stdout list_output)));

  check "Cli.run ensures root dir before executing typed actions" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-ensure-root-" in
      assert_bool ~name:"root absent before run" false (Sys.file_exists root);
      let output =
        run_blocking
          (Cli.run app
             (cli_input
                [ "--root-dir"; root; "--output"; "json"; "graph"; "list" ]))
      in
      assert_int ~name:"ensure root exit" 0 output.exit_code;
      assert_bool ~name:"root exists after run" true (Sys.file_exists root);
      assert_bool ~name:"root is directory after run" true
        (Sys.is_directory root));

  check "Cli.run emits profile lines to stderr when --profile is enabled"
    (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-profile-run-" in
      let output =
        run_blocking
          (Cli.run app
             (cli_input [ "--root-dir"; root; "--profile"; "graph"; "list" ]))
      in
      assert_int ~name:"profile exit" 0 output.exit_code;
      let stderr = String.concat "\n" output.stderr in
      assert_contains ~name:"profile command" "command=graph-list status=ok"
        stderr;
      assert_contains ~name:"profile tree root" "stages" stderr;
      assert_contains ~name:"profile parse stage" "cli.parse-args" stderr;
      assert_contains ~name:"profile config stage" "cli.resolve-config" stderr;
      assert_contains ~name:"profile ensure root stage" "cli.ensure-root-dir"
        stderr;
      assert_contains ~name:"profile build stage" "cli.build-action" stderr;
      assert_contains ~name:"profile execute stage" "cli.execute-action" stderr;
      assert_contains ~name:"profile format stage" "cli.format-result" stderr;
      assert_contains ~name:"profile total stage" "cli.total" stderr;
      match output.lifecycle.config with
      | Some config when Option.is_some config.Cli_config.profile_session -> ()
      | _ -> failf "expected lifecycle config to carry profile_session");

  check "Cli.run does not emit profile lines unless --profile is enabled"
    (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-profile-disabled-" in
      let output =
        run_blocking
          (Cli.run app (cli_input [ "--root-dir"; root; "graph"; "list" ]))
      in
      assert_int ~name:"profile disabled exit" 0 output.exit_code;
      assert_equal ~name:"profile disabled stderr" ""
        (String.concat "\n" output.stderr);
      match output.lifecycle.config with
      | Some config when Option.is_none config.Cli_config.profile_session -> ()
      | _ -> failf "expected lifecycle config without profile_session");

  check "Cli.run emits parsed options debug line when --verbose is enabled"
    (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-verbose-run-" in
      let output =
        run_blocking
          (Cli.run app
             (cli_input [ "--root-dir"; root; "--verbose"; "graph"; "list" ]))
      in
      assert_int ~name:"verbose exit" 0 output.exit_code;
      let stderr = String.concat "\n" output.stderr in
      assert_contains ~name:"verbose debug event" ":cli/parsed-options" stderr;
      assert_contains ~name:"verbose debug command" ":command graph-list" stderr;
      assert_contains ~name:"verbose debug root" root stderr);

  check "Cli.run creates graph through db-worker when base URL is configured"
    (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-graph-create-remote-" in
      with_http_server
        (fun request ->
          assert_equal ~name:"graph create line" "POST /v1/invoke HTTP/1.1"
            request.request_line;
          assert_contains ~name:"graph create method"
            {|"method":"thread-api/create-or-open-db"|} request.body;
          assert_contains ~name:"graph create repo" {|logseq_db_alpha|}
            request.body;
          ( 200,
            [ ("Content-Type", "application/json") ],
            {|{"resultTransit":"true"}|} ))
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--root-dir";
                      root;
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "graph";
                      "create";
                    ]))
          in
          assert_int ~name:"graph create remote exit" 0 output.exit_code;
          assert_equal ~name:"graph create remote json"
            {|{"status":"ok","data":{"result":true}}|}
            (String.trim (cli_stdout output)));
      assert_equal ~name:"graph create current graph" "alpha"
        (String.trim (read_binary_file (Filename.concat root "current-graph"))));

  check "Cli.run creates graph and enables sync through db-worker" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-graph-create-sync-" in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"graph create sync create line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"graph create sync create method"
              {|"method":"thread-api/create-or-open-db"|} request.body;
            assert_contains ~name:"graph create sync create repo"
              {|logseq_db_alpha|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_equal ~name:"graph create sync upload config line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"graph create sync upload config method"
              {|"method":"thread-api/set-db-sync-config"|} request.body;
            assert_contains ~name:"graph create sync upload config ws"
              {|\"~:ws-url\"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_equal ~name:"graph create sync upload e2ee line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"graph create sync upload e2ee method"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"graph create sync upload e2ee ident"
              {|logseq.kv/graph-rtc-e2ee?|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"false"}|} ));
          (fun request ->
            assert_equal ~name:"graph create sync upload line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"graph create sync upload method"
              {|"method":"thread-api/db-sync-upload-graph"|} request.body;
            assert_contains ~name:"graph create sync upload repo"
              {|logseq_db_alpha|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_equal ~name:"graph create sync start config line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"graph create sync start config method"
              {|"method":"thread-api/set-db-sync-config"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_equal ~name:"graph create sync e2ee line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"graph create sync e2ee method"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"graph create sync e2ee ident"
              {|logseq.kv/graph-rtc-e2ee?|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"false"}|} ));
          (fun request ->
            assert_equal ~name:"graph create sync start line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"graph create sync start method"
              {|"method":"thread-api/db-sync-start"|} request.body;
            assert_contains ~name:"graph create sync start repo"
              {|logseq_db_alpha|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_equal ~name:"graph create sync status line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"graph create sync status method"
              {|"method":"thread-api/db-sync-status"|} request.body;
            assert_contains ~name:"graph create sync status repo"
              {|logseq_db_alpha|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:ws-state\",\"~:open\",\"~:graph-id\",\"~u11111111-1111-1111-1111-111111111111\",\"~:last-error\",null]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--root-dir";
                      root;
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "graph";
                      "create";
                      "--enable-sync";
                    ]))
          in
          assert_int ~name:"graph create sync exit" 0 output.exit_code;
          let body = String.trim (cli_stdout output) in
          assert_contains ~name:"graph create sync graph" {|"graph":"alpha"|}
            body;
          assert_contains ~name:"graph create sync repo"
            {|"repo":"logseq_db_alpha"|} body;
          assert_contains ~name:"graph create sync upload stage"
            {|"upload":{"result":true}|} body;
          assert_contains ~name:"graph create sync start stage"
            {|"start":{"ws-state":"open"|} body;
          assert_equal ~name:"graph create sync current graph" "alpha"
            (String.trim
               (read_binary_file (Filename.concat root "current-graph")))));

  check "Cli.run connects existing graph directories by graph name" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-existing-graph-" in
      ensure_test_dir root;
      ensure_test_dir (Filename.concat root "graphs");
      ensure_test_dir (Filename.concat root "graphs/alpha");
      ensure_test_dir (Filename.concat root "graphs/logseq_db_alpha");
      with_http_server_port
        (fun port request ->
          assert_equal ~name:"existing graph switch health line"
            "GET /healthz HTTP/1.1" request.request_line;
          ( 200,
            [ ("Content-Type", "application/json") ],
            {|{"repo":"logseq_db_alpha","status":"ready","host":"127.0.0.1","port":|}
            ^ string_of_int port
            ^ {|,"pid":1234,"owner-source":"cli","root-dir":"/tmp/root","revision":"rev-a"}|}
          ))
        (fun base_url ->
          let port =
            match String.rindex_opt base_url ':' with
            | Some idx ->
                int_of_string
                  (String.sub base_url (idx + 1)
                     (String.length base_url - idx - 1))
            | None -> failf "expected server port"
          in
          write_text_file
            (Filename.concat root "server-list")
            (string_of_int (Unix.getpid ()) ^ " " ^ string_of_int port ^ "\n");
          let switch_output =
            run_blocking
              (Cli.run app
                 (cli_input
                    [
                      "--root-dir"; root; "--graph"; "alpha"; "graph"; "switch";
                    ]))
          in
          assert_int ~name:"existing graph switch exit" 0
            switch_output.exit_code;
          assert_contains ~name:"existing graph switch output"
            "Switched to graph \"alpha\"" (cli_stdout switch_output);
          assert_equal ~name:"current graph" "alpha"
            (String.trim
               (read_binary_file (Filename.concat root "current-graph"))));
      let list_output =
        run_blocking
          (Cli.run app
             (cli_input
                [ "--root-dir"; root; "--output"; "json"; "graph"; "list" ]))
      in
      assert_int ~name:"existing graph list exit" 0 list_output.exit_code;
      assert_equal ~name:"existing graph list json"
        {|{"status":"ok","data":{"graphs":["alpha"],"graph-items":[{"kind":"canonical","graph-name":"alpha","graph-dir":"alpha"}]}}|}
        (String.trim (cli_stdout list_output)));

  check "Cli.run graph switch updates default graph for graph info" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-graph-switch-current-" in
      let config_path = Filename.concat root "cli.edn" in
      ensure_test_dir root;
      ensure_test_dir (Filename.concat root "graphs");
      ensure_test_dir (Filename.concat root "graphs/beta");
      write_text_file config_path {|{:graph "Lambda RTC"}|};
      let switch_output =
        run_blocking
          (Cli.run app
             (cli_input
                ~env:[ ("LOGSEQ_CLI_BASE_URL", "http://127.0.0.1:1") ]
                [
                  "--root-dir";
                  root;
                  "--config";
                  config_path;
                  "graph";
                  "switch";
                  "-g";
                  "beta";
                ]))
      in
      assert_int ~name:"switch current default exit" 0 switch_output.exit_code;
      assert_equal ~name:"switch current graph file" "beta"
        (String.trim (read_binary_file (Filename.concat root "current-graph")));
      with_http_server
        (fun request ->
          assert_equal ~name:"switched graph info line"
            "POST /v1/invoke HTTP/1.1" request.request_line;
          assert_contains ~name:"switched graph info method"
            {|"method":"thread-api/q"|} request.body;
          assert_contains ~name:"switched graph info repo" {|logseq_db_beta|}
            request.body;
          assert_not_contains ~name:"switched graph info old repo"
            {|logseq_db_Lambda RTC|} request.body;
          ( 200,
            [ ("Content-Type", "application/json") ],
            {|{"resultTransit":"[]"}|} ))
        (fun base_url ->
          let info_output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--root-dir";
                      root;
                      "--config";
                      config_path;
                      "--output";
                      "json";
                      "graph";
                      "info";
                    ]))
          in
          assert_int ~name:"switched graph info exit" 0 info_output.exit_code;
          assert_contains ~name:"switched graph info graph" {|"graph":"beta"|}
            (cli_stdout info_output)));

  check "Cli.run stops server and unlinks repo dir when removing graph"
    (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-graph-remove-unlink-" in
      let graphs = Filename.concat root "graphs" in
      let repo_dir = Filename.concat graphs "logseq_db_alpha" in
      let graph_dir = Filename.concat graphs "alpha" in
      let unlinked_dir =
        Filename.concat graphs "Unlinked graphs/logseq_db_alpha"
      in
      ensure_test_dir root;
      ensure_test_dir graphs;
      ensure_test_dir graph_dir;
      ensure_test_dir repo_dir;
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"graph remove health line"
              "GET /healthz HTTP/1.1" request.request_line;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"repo":"logseq_db_alpha","status":"ready","host":"127.0.0.1","pid":1234,"owner-source":"cli","root-dir":"/tmp/root","revision":"rev-a"}|}
            ));
          (fun request ->
            assert_equal ~name:"graph remove shutdown line"
              "POST /v1/shutdown HTTP/1.1" request.request_line;
            (200, [ ("Content-Type", "application/json") ], "{}"));
        ]
        (fun base_url ->
          let port =
            match String.rindex_opt base_url ':' with
            | Some idx ->
                int_of_string
                  (String.sub base_url (idx + 1)
                     (String.length base_url - idx - 1))
            | None -> failf "expected server port"
          in
          write_text_file
            (Filename.concat root "server-list")
            (string_of_int (Unix.getpid ()) ^ " " ^ string_of_int port ^ "\n");
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    [
                      "--root-dir";
                      root;
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "graph";
                      "remove";
                    ]))
          in
          assert_int ~name:"graph remove unlink exit" 0 output.exit_code;
          assert_equal ~name:"graph remove unlink json"
            {|{"status":"ok","data":{"message":"Removed graph \"alpha\""}}|}
            (String.trim (cli_stdout output));
          assert_bool ~name:"graph remove repo moved" false
            (Sys.file_exists repo_dir);
          assert_bool ~name:"graph remove unlinked exists" true
            (Sys.file_exists unlinked_dir)));

  check "Cli.run exports graph as EDN through typed action" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let output_path = Filename.temp_file "logseq-cli-graph-export-" ".edn" in
      Sys.remove output_path;
      with_http_server
        (fun request ->
          assert_equal ~name:"graph export edn line" "POST /v1/invoke HTTP/1.1"
            request.request_line;
          assert_contains ~name:"graph export edn method"
            {|"method":"thread-api/export-edn"|} request.body;
          assert_contains ~name:"graph export edn repo" {|logseq_db_alpha|}
            request.body;
          assert_contains ~name:"graph export edn export type"
            {|\"~:export-type\",\"~:graph\"|} request.body;
          assert_contains ~name:"graph export edn timestamps"
            {|\"~:include-timestamps?\",true|} request.body;
          ( 200,
            [ ("Content-Type", "application/json") ],
            {|{"resultTransit":"[\"^ \",\"~:blocks\",[[\"^ \",\"~:db/id\",1,\"~:block/title\",\"Home\"]]]"}|}
          ))
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "graph";
                      "export";
                      "--type";
                      "edn";
                      "--file";
                      output_path;
                      "--include-timestamps";
                    ]))
          in
          assert_int ~name:"graph export edn exit" 0 output.exit_code;
          assert_equal ~name:"graph export edn json"
            ({|{"status":"ok","data":{"message":"wrote |} ^ output_path
           ^ {|"}}|})
            (String.trim (cli_stdout output));
          assert_contains ~name:"graph export edn file title"
            {|:block/title "Home"|}
            (read_binary_file output_path);
          match output.lifecycle.action with
          | Some (Cli_action.Graph (Graph.Graph_export { repo; opts; _ })) -> (
              assert_equal ~name:"graph export repo" "logseq_db_alpha"
                (repo_string repo);
              match opts.export_type with
              | Graph.Edn -> ()
              | _ -> failf "expected edn export type")
          | _ -> failf "expected typed graph export action"));

  check "Cli.run exports graph as sqlite through typed action" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let output_path =
        Filename.temp_file "logseq-cli-graph-export-" ".sqlite"
      in
      Sys.remove output_path;
      with_http_server
        (fun request ->
          assert_equal ~name:"graph export sqlite line"
            "POST /v1/invoke HTTP/1.1" request.request_line;
          assert_contains ~name:"graph export sqlite method"
            {|"method":"thread-api/backup-db-sqlite"|} request.body;
          assert_contains ~name:"graph export sqlite repo" {|logseq_db_alpha|}
            request.body;
          assert_contains ~name:"graph export sqlite path" output_path
            request.body;
          ( 200,
            [ ("Content-Type", "application/json") ],
            {|{"resultTransit":"true"}|} ))
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "graph";
                      "export";
                      "--type";
                      "sqlite";
                      "--file";
                      output_path;
                    ]))
          in
          assert_int ~name:"graph export sqlite exit" 0 output.exit_code;
          assert_equal ~name:"graph export sqlite json"
            ({|{"status":"ok","data":{"message":"wrote |} ^ output_path
           ^ {|"}}|})
            (String.trim (cli_stdout output));
          match output.lifecycle.action with
          | Some (Cli_action.Graph (Graph.Graph_export { opts; _ })) -> (
              match opts.export_type with
              | Graph.Sqlite -> ()
              | _ -> failf "expected sqlite export type")
          | _ -> failf "expected typed graph export sqlite action"));

  check "Cli.run defaults graph sqlite export path with timestamp" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-graph-export-default-" in
      ensure_test_dir root;
      with_http_server
        (fun request ->
          assert_equal ~name:"graph export sqlite default line"
            "POST /v1/invoke HTTP/1.1" request.request_line;
          assert_contains ~name:"graph export sqlite default method"
            {|"method":"thread-api/backup-db-sqlite"|} request.body;
          let output_path =
            extract_sqlite_snapshot_path request.body "logseq_db_alpha"
          in
          assert_contains ~name:"graph export sqlite default dir"
            (Filename.concat root "graphs/alpha/export")
            output_path;
          assert_contains ~name:"graph export sqlite default stem" "alpha_"
            (Filename.basename output_path);
          assert_contains ~name:"graph export sqlite default suffix" ".sqlite"
            output_path;
          ( 200,
            [ ("Content-Type", "application/json") ],
            {|{"resultTransit":"true"}|} ))
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--root-dir";
                      root;
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "graph";
                      "export";
                      "--type";
                      "sqlite";
                    ]))
          in
          assert_int ~name:"graph export sqlite default exit" 0 output.exit_code;
          let body = String.trim (cli_stdout output) in
          assert_contains ~name:"graph export sqlite default json status"
            {|"status":"ok"|} body;
          assert_contains ~name:"graph export sqlite default json dir"
            (Filename.concat root "graphs/alpha/export")
            body;
          assert_contains ~name:"graph export sqlite default json stem" "alpha_"
            body;
          assert_contains ~name:"graph export sqlite default json suffix"
            ".sqlite" body));

  check "Cli.run accepts graph export type short alias" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let output_path =
        Filename.temp_file "logseq-cli-graph-export-alias-" ".sqlite"
      in
      Sys.remove output_path;
      with_http_server
        (fun request ->
          assert_equal ~name:"graph export alias line"
            "POST /v1/invoke HTTP/1.1" request.request_line;
          assert_contains ~name:"graph export alias method"
            {|"method":"thread-api/backup-db-sqlite"|} request.body;
          assert_contains ~name:"graph export alias repo" {|logseq_db_alpha|}
            request.body;
          ( 200,
            [ ("Content-Type", "application/json") ],
            {|{"resultTransit":"true"}|} ))
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "graph";
                      "export";
                      "-t";
                      "sqlite";
                      "--file";
                      output_path;
                    ]))
          in
          assert_int ~name:"graph export alias exit" 0 output.exit_code;
          assert_equal ~name:"graph export alias json"
            ({|{"status":"ok","data":{"message":"wrote |} ^ output_path
           ^ {|"}}|})
            (String.trim (cli_stdout output));
          match output.lifecycle.action with
          | Some (Cli_action.Graph (Graph.Graph_export { opts; _ })) -> (
              match opts.export_type with
              | Graph.Sqlite -> ()
              | _ -> failf "expected sqlite export type")
          | _ -> failf "expected typed graph export action"));

  check "Cli.run rejects invalid graph command options" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-graph-invalid-root-" in
      let create_output =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--root-dir";
                  root;
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "graph";
                  "create";
                  "--e2ee-password";
                  "secret";
                ]))
      in
      assert_int ~name:"graph create invalid sync exit" 1
        create_output.exit_code;
      assert_equal ~name:"graph create invalid sync json"
        {|{"status":"error","error":{"code":"invalid-options","message":"--e2ee-password requires --enable-sync"}}|}
        (String.trim (cli_stdout create_output));
      let sqlite_output =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "graph";
                  "export";
                  "--type";
                  "sqlite";
                  "--include-timestamps";
                ]))
      in
      assert_int ~name:"graph export sqlite invalid options exit" 1
        sqlite_output.exit_code;
      assert_equal ~name:"graph export sqlite invalid options json"
        {|{"status":"error","error":{"code":"invalid-options","message":"graph export --type sqlite does not accept --include-timestamps, --exclude-built-in-pages, or --exclude-namespaces"}}|}
        (String.trim (cli_stdout sqlite_output));
      let output_path =
        Filename.temp_file "logseq-cli-graph-export-invalid-" ".edn"
      in
      Sys.remove output_path;
      let empty_namespaces_output =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "graph";
                  "export";
                  "--type";
                  "edn";
                  "--file";
                  output_path;
                  "--exclude-namespaces";
                  ",";
                ]))
      in
      assert_int ~name:"graph export empty namespaces exit" 1
        empty_namespaces_output.exit_code;
      assert_equal ~name:"graph export empty namespaces json"
        {|{"status":"error","error":{"code":"invalid-options","message":"graph export --exclude-namespaces must include at least one non-empty value"}}|}
        (String.trim (cli_stdout empty_namespaces_output)));

  check "Cli.run imports graph from EDN through typed action" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-graph-import-root-" in
      let input_path = Filename.temp_file "logseq-cli-graph-import-" ".edn" in
      write_text_file input_path {|{:blocks [{:db/id 1 :block/title "Home"}]}|};
      with_http_server
        (fun request ->
          assert_equal ~name:"graph import edn line" "POST /v1/invoke HTTP/1.1"
            request.request_line;
          assert_contains ~name:"graph import edn method"
            {|"method":"thread-api/import-edn"|} request.body;
          assert_contains ~name:"graph import edn repo" {|logseq_db_alpha|}
            request.body;
          assert_contains ~name:"graph import edn blocks" {|\"~:blocks\"|}
            request.body;
          assert_contains ~name:"graph import edn title" {|Home|} request.body;
          ( 200,
            [ ("Content-Type", "application/json") ],
            {|{"resultTransit":"true"}|} ))
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--root-dir";
                      root;
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "graph";
                      "import";
                      "--type";
                      "edn";
                      "--input";
                      input_path;
                    ]))
          in
          assert_int ~name:"graph import edn exit" 0 output.exit_code;
          assert_equal ~name:"graph import edn json"
            ({|{"status":"ok","data":{"new-graph?":true,"message":"Created graph alpha\nImported edn from |}
           ^ input_path ^ {|"}}|})
            (String.trim (cli_stdout output));
          match output.lifecycle.action with
          | Some (Cli_action.Graph (Graph.Graph_import { opts; _ })) -> (
              match opts.import_type with
              | Graph.Import_edn -> ()
              | _ -> failf "expected edn import type")
          | _ -> failf "expected typed graph import action"));

  check "Cli.run auto-starts db-worker when importing into a new graph"
    (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let cwd = fresh_root "logseq-cli-graph-import-autostart-cwd-" in
      let root = fresh_root "logseq-cli-graph-import-autostart-root-" in
      let input_path = Filename.temp_file "logseq-cli-graph-import-" ".edn" in
      ensure_test_dir cwd;
      ensure_test_dir root;
      ignore (write_fake_db_worker_node cwd);
      write_text_file input_path {|{:blocks [{:db/id 1 :block/title "Home"}]}|};
      let output =
        run_blocking
          (Cli.run app
             (cli_input ~cwd
                [
                  "--root-dir";
                  root;
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "graph";
                  "import";
                  "--type";
                  "edn";
                  "--input";
                  input_path;
                ]))
      in
      assert_int ~name:"graph import autostart exit" 0 output.exit_code;
      assert_equal ~name:"graph import autostart json"
        ({|{"status":"ok","data":{"new-graph?":true,"message":"Created graph alpha\nImported edn from |}
       ^ input_path ^ {|"}}|})
        (String.trim (cli_stdout output));
      let stop_output =
        run_blocking
          (Cli.run app
             (cli_input ~cwd
                [
                  "--root-dir";
                  root;
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "server";
                  "stop";
                ]))
      in
      assert_int ~name:"graph import autostart stop exit" 0
        stop_output.exit_code);

  check "Cli.run imports graph from sqlite through typed action" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-graph-import-root-" in
      let input_path =
        Filename.temp_file "logseq-cli-graph-import-" ".sqlite"
      in
      write_text_file input_path "SQLITE-DATA";
      with_http_server
        (fun request ->
          assert_equal ~name:"graph import sqlite line"
            "POST /v1/invoke HTTP/1.1" request.request_line;
          assert_contains ~name:"graph import sqlite method"
            {|"method":"thread-api/import-db-binary"|} request.body;
          assert_contains ~name:"graph import sqlite repo" {|logseq_db_alpha|}
            request.body;
          assert_contains ~name:"graph import sqlite data"
            {|~bU1FMSVRFLURBVEE=|} request.body;
          ( 200,
            [ ("Content-Type", "application/json") ],
            {|{"resultTransit":"true"}|} ))
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--root-dir";
                      root;
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "graph";
                      "import";
                      "--type";
                      "sqlite";
                      "--input";
                      input_path;
                    ]))
          in
          assert_int ~name:"graph import sqlite exit" 0 output.exit_code;
          assert_equal ~name:"graph import sqlite json"
            ({|{"status":"ok","data":{"new-graph?":true,"message":"Created graph alpha\nImported sqlite from |}
           ^ input_path ^ {|"}}|})
            (String.trim (cli_stdout output));
          match output.lifecycle.action with
          | Some
              (Cli_action.Graph
                 (Graph.Graph_import { require_missing_graph; opts; _ })) -> (
              if not require_missing_graph then
                failf "expected sqlite import to require missing graph";
              match opts.import_type with
              | Graph.Import_sqlite -> ()
              | _ -> failf "expected sqlite import type")
          | _ -> failf "expected typed graph import sqlite action"));

  check "Cli.run validates graph through typed action" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server
        (fun request ->
          assert_equal ~name:"graph validate line" "POST /v1/invoke HTTP/1.1"
            request.request_line;
          assert_contains ~name:"graph validate method"
            {|"method":"thread-api/validate-db"|} request.body;
          assert_contains ~name:"graph validate repo" {|logseq_db_alpha|}
            request.body;
          assert_contains ~name:"graph validate fix" {|\"~:fix\",true|}
            request.body;
          ( 200,
            [ ("Content-Type", "application/json") ],
            {|{"resultTransit":"[\"^ \",\"~:errors\",[],\"~:fixed\",true]"}|} ))
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "graph";
                      "validate";
                      "--fix";
                    ]))
          in
          assert_int ~name:"graph validate exit" 0 output.exit_code;
          assert_contains ~name:"graph validate json result"
            {|"result":{"errors":[],"fixed":true}|}
            (String.trim (cli_stdout output));
          match output.lifecycle.action with
          | Some (Cli_action.Graph (Graph.Graph_validate { repo; fix; _ })) ->
              assert_equal ~name:"graph validate repo" "logseq_db_alpha"
                (repo_string repo);
              if not fix then failf "expected graph validate fix flag"
          | _ -> failf "expected typed graph validate action"));

  check "Cli.run reports graph validation failures" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server
        (fun _request ->
          ( 200,
            [ ("Content-Type", "application/json") ],
            {|{"resultTransit":"[\"^ \",\"~:errors\",[[\"^ \",\"~:db/id\",1,\"~:message\",\"bad entity\"]]]"}|}
          ))
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "graph";
                      "validate";
                    ]))
          in
          assert_int ~name:"graph validate failure exit" 1 output.exit_code;
          let body = String.trim (cli_stdout output) in
          assert_contains ~name:"graph validate failure code"
            {|"code":"graph-validation-failed"|} body;
          assert_contains ~name:"graph validate failure message"
            "Graph invalid. Found 1 entity with errors" body));

  check "Cli.run accepts graph validate fix short alias" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server
        (fun request ->
          assert_equal ~name:"graph validate alias line"
            "POST /v1/invoke HTTP/1.1" request.request_line;
          assert_contains ~name:"graph validate alias fix" {|\"~:fix\",true|}
            request.body;
          ( 200,
            [ ("Content-Type", "application/json") ],
            {|{"resultTransit":"[\"^ \",\"~:errors\",[],\"~:fixed\",true]"}|} ))
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "graph";
                      "validate";
                      "-f";
                    ]))
          in
          assert_int ~name:"graph validate alias exit" 0 output.exit_code;
          match output.lifecycle.action with
          | Some (Cli_action.Graph (Graph.Graph_validate { fix; _ })) ->
              if not fix then failf "expected graph validate fix alias"
          | _ -> failf "expected typed graph validate action"));

  check "Cli.run returns graph info through typed action" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server
        (fun request ->
          assert_equal ~name:"graph info line" "POST /v1/invoke HTTP/1.1"
            request.request_line;
          assert_contains ~name:"graph info method" {|"method":"thread-api/q"|}
            request.body;
          assert_contains ~name:"graph info repo" {|logseq_db_alpha|}
            request.body;
          assert_contains ~name:"graph info query ns" {|logseq.kv|} request.body;
          ( 200,
            [ ("Content-Type", "application/json") ],
            {|{"resultTransit":"[[\"~:logseq.kv/graph-created-at\",1700000000],[\"~:logseq.kv/schema-version\",77],[\"~:logseq.kv/custom\",\"demo\"]]"}|}
          ))
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [ "--graph"; "alpha"; "--output"; "json"; "graph"; "info" ]))
          in
          assert_int ~name:"graph info exit" 0 output.exit_code;
          let body = String.trim (cli_stdout output) in
          assert_contains ~name:"graph info graph" {|"graph":"alpha"|} body;
          assert_contains ~name:"graph info created"
            {|"logseq.kv/graph-created-at":1700000000|} body;
          assert_contains ~name:"graph info schema"
            {|"logseq.kv/schema-version":77|} body;
          assert_contains ~name:"graph info kv custom"
            {|"logseq.kv/custom":"demo"|} body;
          match output.lifecycle.action with
          | Some (Cli_action.Graph (Graph.Graph_info { repo; graph })) ->
              assert_equal ~name:"graph info repo" "logseq_db_alpha"
                (repo_string repo);
              assert_equal ~name:"graph info graph action" "alpha"
                (graph_string graph)
          | _ -> failf "expected typed graph info action"));

  check "Cli.run lists graph backups through typed action" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-graph-backup-list-" in
      let backup_dir = Filename.concat root "graphs/alpha/backup/nightly" in
      ensure_test_dir root;
      ensure_test_dir (Filename.concat root "graphs");
      ensure_test_dir (Filename.concat root "graphs/alpha");
      ensure_test_dir (Filename.concat root "graphs/alpha/backup");
      ensure_test_dir backup_dir;
      write_text_file (Filename.concat backup_dir "db.sqlite") "sqlite-bytes";
      write_text_file
        (Filename.concat backup_dir "metadata.edn")
        "{:source :cli}";
      let output =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--root-dir";
                  root;
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "graph";
                  "backup";
                  "list";
                ]))
      in
      assert_int ~name:"graph backup list exit" 0 output.exit_code;
      let body = String.trim (cli_stdout output) in
      assert_contains ~name:"graph backup list name" {|"name":"nightly"|} body;
      assert_contains ~name:"graph backup list size" {|"size-bytes":12|} body;
      assert_contains ~name:"graph backup list source" {|"source":"cli"|} body;
      match output.lifecycle.action with
      | Some (Cli_action.Graph (Graph.Graph_backup_list { repo; graph })) ->
          assert_equal ~name:"graph backup list repo" "logseq_db_alpha"
            (repo_string repo);
          assert_equal ~name:"graph backup list graph" "alpha"
            (graph_string graph)
      | _ -> failf "expected typed graph backup list action");

  check "Cli.run creates graph backup through typed action" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-graph-backup-create-" in
      ensure_test_dir root;
      with_http_server
        (fun request ->
          assert_equal ~name:"graph backup create line"
            "POST /v1/invoke HTTP/1.1" request.request_line;
          assert_contains ~name:"graph backup create method"
            {|"method":"thread-api/backup-db-sqlite"|} request.body;
          assert_contains ~name:"graph backup create repo" {|logseq_db_alpha|}
            request.body;
          let snapshot_path =
            extract_sqlite_snapshot_path request.body "logseq_db_alpha"
          in
          assert_contains ~name:"graph backup create path root"
            (Filename.concat root "graphs/alpha/backup")
            snapshot_path;
          write_text_file snapshot_path "sqlite-bytes";
          ( 200,
            [ ("Content-Type", "application/json") ],
            {|{"resultTransit":"true"}|} ))
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--root-dir";
                      root;
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "graph";
                      "backup";
                      "create";
                      "--name";
                      "nightly";
                    ]))
          in
          assert_int ~name:"graph backup create exit" 0 output.exit_code;
          let body = String.trim (cli_stdout output) in
          assert_contains ~name:"graph backup create json name"
            {|"backup-name":"alpha-nightly-|} body;
          assert_contains ~name:"graph backup create json path" {|"path":"|}
            body;
          assert_contains ~name:"graph backup create message"
            {|Created backup alpha-nightly-|} body;
          let backup_root = Filename.concat root "graphs/alpha/backup" in
          let backups = Sys.readdir backup_root |> Array.to_list in
          assert_int ~name:"graph backup create count" 1 (List.length backups);
          let backup_name = List.hd backups in
          assert_contains ~name:"graph backup create fs name" "alpha-nightly-"
            backup_name;
          let backup_dir = Filename.concat backup_root backup_name in
          assert_equal ~name:"graph backup create sqlite bytes" "sqlite-bytes"
            (read_binary_file (Filename.concat backup_dir "db.sqlite"));
          assert_contains ~name:"graph backup create metadata source"
            ":source :cli"
            (read_binary_file (Filename.concat backup_dir "metadata.edn"));
          match output.lifecycle.action with
          | Some
              (Cli_action.Graph
                 (Graph.Graph_backup_create
                    { repo; graph; name; backup_name = Some generated })) ->
              assert_equal ~name:"graph backup create repo" "logseq_db_alpha"
                (repo_string repo);
              assert_equal ~name:"graph backup create graph" "alpha"
                (graph_string graph);
              assert_equal ~name:"graph backup create label" "nightly"
                (Option.value name ~default:"");
              assert_contains ~name:"graph backup create generated"
                "alpha-nightly-" generated
          | _ -> failf "expected typed graph backup create action"));

  check "Cli.run restores graph backup through typed action" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-graph-backup-restore-" in
      let backup_dir = Filename.concat root "graphs/alpha/backup/nightly" in
      ensure_test_dir root;
      ensure_test_dir (Filename.concat root "graphs");
      ensure_test_dir (Filename.concat root "graphs/alpha");
      ensure_test_dir (Filename.concat root "graphs/alpha/backup");
      ensure_test_dir backup_dir;
      let backup_path = Filename.concat backup_dir "db.sqlite" in
      write_text_file backup_path "SQLITE-BACKUP";
      with_http_server
        (fun request ->
          assert_equal ~name:"graph backup restore line"
            "POST /v1/invoke HTTP/1.1" request.request_line;
          assert_contains ~name:"graph backup restore method"
            {|"method":"thread-api/import-db-binary"|} request.body;
          assert_contains ~name:"graph backup restore dst repo"
            {|logseq_db_beta|} request.body;
          assert_contains ~name:"graph backup restore bytes"
            {|~bU1FMSVRFLUJBQ0tVUA==|} request.body;
          ( 200,
            [ ("Content-Type", "application/json") ],
            {|{"resultTransit":"true"}|} ))
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--root-dir";
                      root;
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "graph";
                      "backup";
                      "restore";
                      "--src";
                      "nightly";
                      "--dst";
                      "beta";
                    ]))
          in
          assert_int ~name:"graph backup restore exit" 0 output.exit_code;
          assert_equal ~name:"graph backup restore json"
            ({|{"status":"ok","data":{"new-graph?":true,"message":"Created graph beta\nImported sqlite from |}
           ^ backup_path ^ {|"}}|})
            (String.trim (cli_stdout output));
          match output.lifecycle.action with
          | Some
              (Cli_action.Graph
                 (Graph.Graph_backup_restore
                    { source_repo; source_graph; dst_repo; dst_graph; src; dst }))
            ->
              assert_equal ~name:"graph backup restore source repo"
                "logseq_db_alpha" (repo_string source_repo);
              assert_equal ~name:"graph backup restore source graph" "alpha"
                (graph_string source_graph);
              assert_equal ~name:"graph backup restore dst repo"
                "logseq_db_beta" (repo_string dst_repo);
              assert_equal ~name:"graph backup restore dst graph" "beta"
                (graph_string dst_graph);
              assert_equal ~name:"graph backup restore src" "nightly" src;
              assert_equal ~name:"graph backup restore dst" "beta" dst
          | _ -> failf "expected typed graph backup restore action"));

  check "Cli.run reports missing graph backup restore source" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-graph-backup-restore-missing-" in
      ensure_test_dir root;
      let output =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--root-dir";
                  root;
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "graph";
                  "backup";
                  "restore";
                  "--src";
                  "missing";
                  "--dst";
                  "beta";
                ]))
      in
      assert_int ~name:"graph backup restore missing exit" 1 output.exit_code;
      assert_equal ~name:"graph backup restore missing json"
        {|{"status":"error","error":{"code":"backup-not-found","message":"backup not found: missing"}}|}
        (String.trim (cli_stdout output)));

  check "Cli.run rejects graph backup restore blank destination" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-graph-backup-restore-blank-dst-" in
      ensure_test_dir root;
      let output =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--root-dir";
                  root;
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "graph";
                  "backup";
                  "restore";
                  "--src";
                  "nightly";
                  "--dst";
                  "  ";
                ]))
      in
      assert_int ~name:"graph backup restore blank dst exit" 1 output.exit_code;
      assert_equal ~name:"graph backup restore blank dst json"
        {|{"status":"error","error":{"code":"missing-dst","message":"destination graph name is required"}}|}
        (String.trim (cli_stdout output)));

  check "Cli.run removes graph backup through typed action" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-graph-backup-remove-" in
      let backup_dir = Filename.concat root "graphs/alpha/backup/nightly" in
      ensure_test_dir root;
      ensure_test_dir (Filename.concat root "graphs");
      ensure_test_dir (Filename.concat root "graphs/alpha");
      ensure_test_dir (Filename.concat root "graphs/alpha/backup");
      ensure_test_dir backup_dir;
      write_text_file (Filename.concat backup_dir "db.sqlite") "sqlite-bytes";
      let output =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--root-dir";
                  root;
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "graph";
                  "backup";
                  "remove";
                  "--src";
                  "nightly";
                ]))
      in
      assert_int ~name:"graph backup remove exit" 0 output.exit_code;
      assert_equal ~name:"graph backup remove json"
        {|{"status":"ok","data":{"message":"Removed backup nightly"}}|}
        (String.trim (cli_stdout output));
      assert_bool ~name:"graph backup removed" false
        (Sys.file_exists backup_dir);
      match output.lifecycle.action with
      | Some (Cli_action.Graph (Graph.Graph_backup_remove { repo; graph; src }))
        ->
          assert_equal ~name:"graph backup remove repo" "logseq_db_alpha"
            (repo_string repo);
          assert_equal ~name:"graph backup remove graph" "alpha"
            (graph_string graph);
          assert_equal ~name:"graph backup remove src" "nightly" src
      | _ -> failf "expected typed graph backup remove action");

  check "Cli.run reports missing graph backup removal target" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-graph-backup-remove-missing-" in
      ensure_test_dir root;
      let output =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--root-dir";
                  root;
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "graph";
                  "backup";
                  "remove";
                  "--src";
                  "missing";
                ]))
      in
      assert_int ~name:"graph backup missing exit" 1 output.exit_code;
      assert_equal ~name:"graph backup missing json"
        {|{"status":"error","error":{"code":"backup-not-found","message":"backup not found: missing"}}|}
        (String.trim (cli_stdout output)));

  check "Cli.run executes completion through typed action" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let output =
        run_blocking (Cli.run app (cli_input [ "completion"; "bash" ]))
      in
      assert_int ~name:"completion exit" 0 output.exit_code;
      assert_contains ~name:"completion output" "complete -F _logseq logseq"
        (cli_stdout output);
      match output.lifecycle.action with
      | Some (Cli_action.Completion _) -> ()
      | _ -> failf "expected typed completion action");

  check "Cli.run resolves exact prefix and group example selectors" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      [
        ( [ "list"; "page" ],
          {|"selector":"list page"|},
          {|"matched-commands":["list page"]|},
          {|logseq list page --graph my-graph|} );
        ( [ "list" ],
          {|"selector":"list"|},
          {|"matched-commands":["list page","list tag","list property","list task","list node","list asset"]|},
          {|logseq list asset --graph my-graph|} );
        ( [ "server" ],
          {|"selector":"server"|},
          {|"matched-commands":["server list","server cleanup","server start","server stop","server restart"]|},
          {|logseq server start --graph my-graph|} );
      ]
      |> List.iter (fun (selector, selector_json, matched_json, example_text) ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input ([ "--output"; "json"; "example" ] @ selector)))
          in
          let name = "example " ^ String.concat " " selector in
          assert_int ~name:(name ^ " exit") 0 output.exit_code;
          let body = String.trim (cli_stdout output) in
          assert_contains ~name:(name ^ " selector") selector_json body;
          assert_contains ~name:(name ^ " matched commands") matched_json body;
          assert_contains ~name:(name ^ " example") example_text body));

  check "Cli.run rejects example without selector" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let output =
        run_blocking (Cli.run app (cli_input [ "--output"; "json"; "example" ]))
      in
      assert_int ~name:"example missing exit" 1 output.exit_code;
      assert_equal ~name:"example missing json"
        {|{"status":"error","error":{"code":"missing-example-selector","message":"example selector is required"}}|}
        (String.trim (cli_stdout output)));

  check "Cli.run rejects unknown example selector" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let output =
        run_blocking
          (Cli.run app (cli_input [ "--output"; "json"; "example"; "foobar" ]))
      in
      assert_int ~name:"example unknown exit" 1 output.exit_code;
      assert_equal ~name:"example unknown json"
        {|{"status":"error","error":{"code":"unknown-command","message":"unknown example selector: foobar"}}|}
        (String.trim (cli_stdout output)));

  check "Cli.run executes skill show through typed action" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let cwd = fresh_root "logseq-cli-skill-show-" in
      let agents_dir = Filename.concat cwd ".agents" in
      let skills_dir = Filename.concat agents_dir "skills" in
      let skill_dir = Filename.concat skills_dir "logseq-cli" in
      ensure_test_dir cwd;
      ensure_test_dir agents_dir;
      ensure_test_dir skills_dir;
      ensure_test_dir skill_dir;
      write_text_file
        (Filename.concat skill_dir "SKILL.md")
        "Skill body from project";
      let output =
        run_blocking (Cli.run app (cli_input ~cwd [ "skill"; "show" ]))
      in
      assert_int ~name:"skill show exit" 0 output.exit_code;
      assert_equal ~name:"skill show output" "Skill body from project\n"
        (cli_stdout output);
      match output.lifecycle.action with
      | Some (Cli_action.Skill (Skill.Skill_show _)) -> ()
      | _ -> failf "expected typed skill show action");

  check "Cli.run executes skill install through typed action" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let cwd = fresh_root "logseq-cli-skill-install-" in
      let agents_dir = Filename.concat cwd ".agents" in
      let skills_dir = Filename.concat agents_dir "skills" in
      let skill_dir = Filename.concat skills_dir "logseq-cli" in
      let skill_file = Filename.concat skill_dir "SKILL.md" in
      ensure_test_dir cwd;
      ensure_test_dir agents_dir;
      ensure_test_dir skills_dir;
      ensure_test_dir skill_dir;
      write_text_file skill_file "Installable skill body";
      let output =
        run_blocking
          (Cli.run app
             (cli_input ~cwd [ "--output"; "json"; "skill"; "install" ]))
      in
      assert_int ~name:"skill install exit" 0 output.exit_code;
      assert_equal ~name:"skill install file" "Installable skill body"
        (read_binary_file skill_file);
      let body = String.trim (cli_stdout output) in
      assert_contains ~name:"skill install status" {|"status":"ok"|} body;
      assert_contains ~name:"skill install path" {|"installed-path":"|} body;
      match output.lifecycle.action with
      | Some (Cli_action.Skill (Skill.Skill_install _)) -> ()
      | _ -> failf "expected typed skill install action");

  check "Cli_config resolves auth settings from config file" (fun () ->
      let root = fresh_root "logseq-cli-auth-config-" in
      let auth_path = Filename.concat root "auth.json" in
      let config_path = Filename.concat root "cli.edn" in
      ensure_test_dir root;
      write_text_file config_path
        ("{:auth-path \"" ^ auth_path
       ^ "\" :id-token \"id-token\" :access-token \"access-token\" \
          :refresh-token \"refresh-token\"}");
      let globals = Global_opts.create ~config_path ~root_dir:root () in
      match
        run_blocking
          (Cli_config.resolve ~defaults:(Cli_config.defaults ())
             ~env:(fun _ -> None)
             globals)
      with
      | Error err ->
          failf "expected auth config resolve ok: %s" err.Error.message
      | Ok resolved ->
          assert_equal ~name:"auth path config" auth_path
            (Option.value resolved.Cli_config.config.auth_path ~default:"");
          assert_equal ~name:"id token config" "id-token"
            (Option.value resolved.config.id_token ~default:"");
          assert_equal ~name:"access token config" "access-token"
            (Option.value resolved.config.access_token ~default:"");
          assert_equal ~name:"refresh token config" "refresh-token"
            (Option.value resolved.config.refresh_token ~default:""));

  check "Cli_config resolves env values over file config" (fun () ->
      let root = fresh_root "logseq-cli-env-config-root-" in
      let config_path = Filename.concat root "cli.edn" in
      ensure_test_dir root;
      write_text_file config_path
        "{:graph \"file-graph\" :timeout-ms 111 :login-timeout-ms 222 \
         :logout-timeout-ms 333 :list-title-max-display-width 44 \
         :output-format :edn :ws-url \"wss://file\" :http-base \
         \"https://file\"}";
      let env key =
        match key with
        | "LOGSEQ_CLI_ROOT_DIR" -> Some root
        | "LOGSEQ_CLI_CONFIG" -> Some config_path
        | "LOGSEQ_CLI_GRAPH" -> Some "env-graph"
        | "LOGSEQ_CLI_TIMEOUT_MS" -> Some "500"
        | "LOGSEQ_CLI_LOGIN_TIMEOUT_MS" -> Some "600"
        | "LOGSEQ_CLI_LOGOUT_TIMEOUT_MS" -> Some "700"
        | "LOGSEQ_CLI_OUTPUT" -> Some "json"
        | _ -> None
      in
      match
        run_blocking
          (Cli_config.resolve ~defaults:(Cli_config.defaults ()) ~env
             (Global_opts.create ()))
      with
      | Error err ->
          failf "expected env config resolve ok: %s" err.Error.message
      | Ok resolved ->
          let config = resolved.Cli_config.config in
          assert_equal ~name:"env graph" "env-graph"
            (config.graph |> Option.map graph_string |> Option.value ~default:"");
          assert_equal ~name:"env repo" "logseq_db_env-graph"
            (config.repo |> Option.map repo_string |> Option.value ~default:"");
          assert_equal ~name:"env root" root config.root_dir;
          assert_equal ~name:"env config path" config_path config.config_path;
          assert_int64 ~name:"env timeout" 500L
            (Ptime_util.span_to_ms config.timeout_span);
          assert_int64 ~name:"env login timeout" 600L
            (Ptime_util.span_to_ms config.login_timeout_span);
          assert_int64 ~name:"env logout timeout" 700L
            (Ptime_util.span_to_ms config.logout_timeout_span);
          assert_int ~name:"file list width remains" 44
            config.list_title_max_display_width;
          assert_equal ~name:"env output" "json"
            (Option.map Output_mode.to_string config.output_format
            |> Option.value ~default:"");
          assert_equal ~name:"file ws url remains" "wss://file"
            (Option.value config.ws_url ~default:"");
          assert_equal ~name:"file http base remains" "https://file"
            (Option.value config.http_base ~default:""));

  check "Cli_config rejects invalid env values" (fun () ->
      let env key =
        match key with "LOGSEQ_CLI_TIMEOUT_MS" -> Some "slow" | _ -> None
      in
      match
        run_blocking
          (Cli_config.resolve ~defaults:(Cli_config.defaults ()) ~env
             (Global_opts.create ()))
      with
      | Ok _ -> failf "expected invalid env config"
      | Error err ->
          assert_equal ~name:"invalid env config code"
            (Edn_util.keyword_t "invalid-config")
            err.Error.code;
          assert_equal ~name:"invalid env config message"
            "invalid env LOGSEQ_CLI_TIMEOUT_MS: slow. Expected integer"
            err.message);

  check "Cli_config rejects invalid file config values" (fun () ->
      let root = fresh_root "logseq-cli-invalid-file-config-" in
      let config_path = Filename.concat root "cli.edn" in
      ensure_test_dir root;
      write_text_file config_path "{:timeout-ms \"slow\"}";
      match
        run_blocking
          (Cli_config.resolve ~defaults:(Cli_config.defaults ())
             ~env:(fun _ -> None)
             (Global_opts.create ~config_path ~root_dir:root ()))
      with
      | Ok _ -> failf "expected invalid file config"
      | Error err ->
          assert_equal ~name:"invalid file config code"
            (Edn_util.keyword_t "invalid-config")
            err.Error.code;
          assert_equal ~name:"invalid file config message"
            "invalid file config :timeout-ms: \"slow\". Expected integer"
            err.message);

  check "Cli_config lets argv override env config" (fun () ->
      let env_root = fresh_root "logseq-cli-env-root-" in
      let argv_root = fresh_root "logseq-cli-argv-root-" in
      let env_config_path = Filename.concat env_root "cli.edn" in
      ensure_test_dir env_root;
      write_text_file env_config_path
        "{:graph \"file-graph\" :output-format :human}";
      let env key =
        match key with
        | "LOGSEQ_CLI_ROOT_DIR" -> Some env_root
        | "LOGSEQ_CLI_CONFIG" -> Some env_config_path
        | "LOGSEQ_CLI_GRAPH" -> Some "env-graph"
        | "LOGSEQ_CLI_TIMEOUT_MS" -> Some "500"
        | "LOGSEQ_CLI_OUTPUT" -> Some "json"
        | _ -> None
      in
      let globals =
        Global_opts.create ~graph:(graph "argv-graph") ~root_dir:argv_root
          ~timeout_span:(Ptime_util.span_of_ms 900L)
          ~output_format:(Output.Mode.Packed Output.Mode.Edn) ()
      in
      match
        run_blocking
          (Cli_config.resolve ~defaults:(Cli_config.defaults ()) ~env globals)
      with
      | Error err ->
          failf "expected argv override config resolve ok: %s" err.Error.message
      | Ok resolved ->
          let config = resolved.Cli_config.config in
          assert_equal ~name:"argv graph" "argv-graph"
            (config.graph |> Option.map graph_string |> Option.value ~default:"");
          assert_equal ~name:"argv repo" "logseq_db_argv-graph"
            (config.repo |> Option.map repo_string |> Option.value ~default:"");
          assert_equal ~name:"argv root" argv_root config.root_dir;
          assert_int64 ~name:"argv timeout" 900L
            (Ptime_util.span_to_ms config.timeout_span);
          assert_equal ~name:"argv output" "edn"
            (Option.map Output_mode.to_string config.output_format
            |> Option.value ~default:""));

  check "Cli_config uses upstream sync endpoint defaults" (fun () ->
      let root = fresh_root "logseq-cli-sync-defaults-" in
      ensure_test_dir root;
      let globals = Global_opts.create ~root_dir:root () in
      match
        run_blocking
          (Cli_config.resolve ~defaults:(Cli_config.defaults ())
             ~env:(fun _ -> None)
             globals)
      with
      | Error err ->
          failf "expected sync default config resolve ok: %s" err.Error.message
      | Ok resolved ->
          let config = resolved.Cli_config.config in
          assert_equal ~name:"default sync ws" "wss://api.logseq.io/sync/%s"
            (Option.value config.ws_url ~default:"");
          assert_equal ~name:"default sync http" "https://api.logseq.io"
            (Option.value config.http_base ~default:""));

  check
    "Cli_config uses file graph root and output when env and argv are absent"
    (fun () ->
      let config_root = fresh_root "logseq-cli-file-config-root-" in
      let file_root = fresh_root "logseq-cli-file-root-" in
      let config_path = Filename.concat config_root "cli.edn" in
      ensure_test_dir config_root;
      write_text_file config_path
        ("{:graph \"file-graph\" :root-dir \"" ^ file_root
       ^ "\" :timeout-ms 321 :login-timeout-ms 654 :logout-timeout-ms 987 \
          :list-title-max-display-width 55 :output :edn}");
      let globals = Global_opts.create ~config_path () in
      match
        run_blocking
          (Cli_config.resolve ~defaults:(Cli_config.defaults ())
             ~env:(fun _ -> None)
             globals)
      with
      | Error err ->
          failf "expected file config resolve ok: %s" err.Error.message
      | Ok resolved ->
          let config = resolved.Cli_config.config in
          assert_equal ~name:"file graph" "file-graph"
            (config.graph |> Option.map graph_string |> Option.value ~default:"");
          assert_equal ~name:"file repo" "logseq_db_file-graph"
            (config.repo |> Option.map repo_string |> Option.value ~default:"");
          assert_equal ~name:"file root" file_root config.root_dir;
          assert_int64 ~name:"file timeout" 321L
            (Ptime_util.span_to_ms config.timeout_span);
          assert_int64 ~name:"file login timeout" 654L
            (Ptime_util.span_to_ms config.login_timeout_span);
          assert_int64 ~name:"file logout timeout" 987L
            (Ptime_util.span_to_ms config.logout_timeout_span);
          assert_int ~name:"file list width" 55
            config.list_title_max_display_width;
          assert_equal ~name:"file output" "edn"
            (Option.map Output_mode.to_string config.output_format
            |> Option.value ~default:""));

  check "Cli_config uses current graph over file graph" (fun () ->
      let root = fresh_root "logseq-cli-current-graph-root-" in
      let config_path = Filename.concat root "cli.edn" in
      ensure_test_dir root;
      write_text_file config_path {|{:graph "Lambda RTC"}|};
      write_text_file (Filename.concat root "current-graph") "beta\n";
      let globals = Global_opts.create ~config_path ~root_dir:root () in
      match
        run_blocking
          (Cli_config.resolve ~defaults:(Cli_config.defaults ())
             ~env:(fun _ -> None)
             globals)
      with
      | Error err ->
          failf "expected current graph config resolve ok: %s" err.Error.message
      | Ok resolved ->
          let config = resolved.Cli_config.config in
          assert_equal ~name:"current graph wins" "beta"
            (config.graph |> Option.map graph_string |> Option.value ~default:"");
          assert_equal ~name:"current graph repo" "logseq_db_beta"
            (config.repo |> Option.map repo_string |> Option.value ~default:""));

  check "Auth_state writes and reads persisted auth json" (fun () ->
      let root = fresh_root "logseq-cli-auth-state-" in
      let auth_path = Filename.concat root "auth.json" in
      let config_path = Filename.concat root "cli.edn" in
      ensure_test_dir root;
      write_text_file config_path ("{:auth-path \"" ^ auth_path ^ "\"}");
      let globals = Global_opts.create ~config_path ~root_dir:root () in
      let config =
        match
          run_blocking
            (Cli_config.resolve ~defaults:(Cli_config.defaults ())
               ~env:(fun _ -> None)
               globals)
        with
        | Ok resolved -> resolved.Cli_config.config
        | Error err ->
            failf "expected auth config resolve ok: %s" err.Error.message
      in
      let data =
        {
          Auth_state.provider = "cognito";
          id_token = Some "id-token";
          access_token = Some "access-token";
          refresh_token = Some "refresh-token";
          expires_at = Some (Ptime_util.time_of_epoch_ms 4102444800000L);
          sub = Some "sub-1";
          email = Some "user@example.com";
          updated_at = Ptime_util.time_of_epoch_ms 1700000000000L;
        }
      in
      (match run_blocking (Auth_state.write_auth_file config data) with
      | Error err -> failf "expected write auth ok: %s" err.Error.message
      | Ok _ -> ());
      assert_bool ~name:"auth file exists" true (Sys.file_exists auth_path);
      match run_blocking (Auth_state.read_auth_file config) with
      | Error err -> failf "expected read auth ok: %s" err.Error.message
      | Ok None -> failf "expected persisted auth data"
      | Ok (Some auth) ->
          assert_equal ~name:"auth provider" "cognito" auth.provider;
          assert_equal ~name:"auth id token" "id-token"
            (Option.value auth.id_token ~default:"");
          assert_equal ~name:"auth email" "user@example.com"
            (Option.value auth.email ~default:""));

  check "Auth_state reads providerless persisted auth json" (fun () ->
      let root = fresh_root "logseq-cli-auth-providerless-" in
      let auth_path = Filename.concat root "auth.json" in
      let config_path = Filename.concat root "cli.edn" in
      ensure_test_dir root;
      write_text_file config_path ("{:auth-path \"" ^ auth_path ^ "\"}");
      write_text_file auth_path
        {|{"id-token":"id-token","access-token":"access-token","refresh-token":"refresh-token","updated-at":1700000000000}|};
      let globals = Global_opts.create ~config_path ~root_dir:root () in
      let config =
        match
          run_blocking
            (Cli_config.resolve ~defaults:(Cli_config.defaults ())
               ~env:(fun _ -> None)
               globals)
        with
        | Ok resolved -> resolved.Cli_config.config
        | Error err ->
            failf "expected auth config resolve ok: %s" err.Error.message
      in
      match run_blocking (Auth_state.read_auth_file config) with
      | Error err ->
          failf "expected providerless auth read ok: %s" err.Error.message
      | Ok None -> failf "expected providerless auth data"
      | Ok (Some auth) ->
          assert_equal ~name:"providerless auth provider" "cognito"
            auth.provider;
          assert_equal ~name:"providerless auth id token" "id-token"
            (Option.value auth.id_token ~default:"");
          assert_equal ~name:"providerless auth access token" "access-token"
            (Option.value auth.access_token ~default:"");
          assert_equal ~name:"providerless auth refresh token" "refresh-token"
            (Option.value auth.refresh_token ~default:""));

  check "Auth_state.refresh_auth exchanges refresh token and decodes claims"
    (fun () ->
      let id_token =
        "e30.eyJzdWIiOiJzdWItcmVmcmVzaGVkIiwiZW1haWwiOiJmcmVzaEBleGFtcGxlLmNvbSIsImV4cCI6NDEwMjQ0NDgwMH0.sig"
      in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"auth refresh line" "POST /oauth2/token HTTP/1.1"
              request.request_line;
            assert_contains ~name:"auth refresh content type"
              "application/x-www-form-urlencoded"
              (List.assoc "content-type" request.headers);
            assert_contains ~name:"auth refresh grant type"
              "grant_type=refresh_token" request.body;
            assert_contains ~name:"auth refresh token param"
              "refresh_token=old-refresh" request.body;
            assert_contains ~name:"auth refresh client id" "client_id=client-1"
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"id_token":"|} ^ id_token ^ {|","access_token":"access-new"}|}
            ));
        ]
        (fun http_base ->
          let config =
            {
              (test_config ~root_dir:(fresh_root "logseq-cli-auth-refresh-") ()) with
              Cli_config.http_base = Some http_base;
              raw_file_config =
                Some
                  (Edn_util.map
                     [
                       ( Edn_util.keyword ":oauth-client-id",
                         Edn_util.string "client-1" );
                     ]);
            }
          in
          let current =
            {
              Auth_state.provider = "cognito";
              id_token = Some "old-id";
              access_token = Some "old-access";
              refresh_token = Some "old-refresh";
              expires_at = Some (Ptime_util.time_of_epoch_ms 1L);
              sub = Some "old-sub";
              email = Some "old@example.com";
              updated_at = Ptime_util.time_of_epoch_ms 1L;
            }
          in
          match run_blocking (Auth_state.refresh_auth config current) with
          | Error err -> failf "expected auth refresh ok: %s" err.Error.message
          | Ok refreshed ->
              assert_equal ~name:"refreshed id token" id_token
                (Option.value refreshed.id_token ~default:"");
              assert_equal ~name:"refreshed access token" "access-new"
                (Option.value refreshed.access_token ~default:"");
              assert_equal ~name:"preserved refresh token" "old-refresh"
                (Option.value refreshed.refresh_token ~default:"");
              assert_equal ~name:"refreshed sub" "sub-refreshed"
                (Option.value refreshed.sub ~default:"");
              assert_equal ~name:"refreshed email" "fresh@example.com"
                (Option.value refreshed.email ~default:"");
              assert_int64 ~name:"refreshed expires" 4102444800000L
                (Option.value
                   (Option.map Ptime_util.time_to_epoch_ms refreshed.expires_at)
                   ~default:0L)));

  check
    "Auth_state.resolve_auth refreshes expired persisted auth and writes it \
     back" (fun () ->
      let id_token =
        "e30.eyJzdWIiOiJzdWItcmVmcmVzaGVkIiwiZW1haWwiOiJmcmVzaEBleGFtcGxlLmNvbSIsImV4cCI6NDEwMjQ0NDgwMH0.sig"
      in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"resolve auth refresh line"
              "POST /oauth2/token HTTP/1.1" request.request_line;
            assert_contains ~name:"resolve auth refresh token"
              "refresh_token=old-refresh" request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"id_token":"|} ^ id_token
              ^ {|","access_token":"access-new","refresh_token":"refresh-new"}|}
            ));
        ]
        (fun http_base ->
          let root = fresh_root "logseq-cli-auth-resolve-refresh-" in
          let auth_path = Filename.concat root "auth.json" in
          let config_path = Filename.concat root "cli.edn" in
          ensure_test_dir root;
          write_text_file config_path
            ("{:auth-path \"" ^ auth_path ^ "\" :http-base \"" ^ http_base
           ^ "\"}");
          write_text_file auth_path
            {|{"provider":"cognito","id-token":"old-id","refresh-token":"old-refresh","expires-at":1,"updated-at":1}|};
          let globals = Global_opts.create ~config_path ~root_dir:root () in
          let config =
            match
              run_blocking
                (Cli_config.resolve ~defaults:(Cli_config.defaults ())
                   ~env:(fun _ -> None)
                   globals)
            with
            | Ok resolved -> resolved.Cli_config.config
            | Error err ->
                failf "expected auth config resolve ok: %s" err.Error.message
          in
          match run_blocking (Auth_state.resolve_auth config) with
          | Error err ->
              failf "expected resolve auth refresh ok: %s" err.Error.message
          | Ok refreshed ->
              assert_equal ~name:"resolved refreshed id token" id_token
                (Option.value refreshed.id_token ~default:"");
              assert_equal ~name:"resolved refreshed refresh token"
                "refresh-new"
                (Option.value refreshed.refresh_token ~default:"");
              let persisted = read_binary_file auth_path in
              assert_contains ~name:"persisted refreshed id token" id_token
                persisted;
              assert_contains ~name:"persisted refreshed email"
                "fresh@example.com" persisted));

  check "Auth_state.login completes OAuth callback exchange and persists auth"
    (fun () ->
      let id_token =
        "e30.eyJzdWIiOiJzdWItbG9naW4iLCJlbWFpbCI6ImxvZ2luQGV4YW1wbGUuY29tIiwiZXhwIjo0MTAyNDQ0ODAwfQ.sig"
      in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"login token line" "POST /oauth2/token HTTP/1.1"
              request.request_line;
            assert_contains ~name:"login grant type"
              "grant_type=authorization_code" request.body;
            assert_contains ~name:"login callback code" "code=callback-code"
              request.body;
            assert_contains ~name:"login redirect uri"
              "redirect_uri=http%3A%2F%2Flocalhost%3A8765%2Fauth%2Fcallback"
              request.body;
            assert_contains ~name:"login verifier" "code_verifier=verifier-1"
              request.body;
            assert_contains ~name:"login client id"
              "client_id=69cs1lgme7p8kbgld8n5kseii6" request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"id_token":"|} ^ id_token
              ^ {|","access_token":"access-login","refresh_token":"refresh-login"}|}
            ));
        ]
        (fun http_base ->
          let root = fresh_root "logseq-cli-auth-login-" in
          let auth_path = Filename.concat root "auth.json" in
          let config_path = Filename.concat root "cli.edn" in
          ensure_test_dir root;
          write_text_file config_path
            ("{:auth-path \"" ^ auth_path ^ "\" :oauth-token-endpoint \""
           ^ http_base
           ^ "/oauth2/token\" :oauth-state \"state-1\" :oauth-code-verifier \
              \"verifier-1\" :oauth-code-challenge \"challenge-1\" \
              :open-browser false}");
          let callback_url =
            "http://localhost:8765/auth/callback?code=callback-code&state=state-1"
          in
          let callback_pid =
            match Unix.fork () with
            | 0 ->
                let rec loop attempts =
                  if attempts <= 0 then exit 2
                  else if try_http_get callback_url then exit 0
                  else (
                    ignore (Unix.select [] [] [] 0.01);
                    loop (attempts - 1))
                in
                loop 200
            | pid -> pid
          in
          let globals = Global_opts.create ~config_path ~root_dir:root () in
          let config =
            match
              run_blocking
                (Cli_config.resolve ~defaults:(Cli_config.defaults ())
                   ~env:(fun _ -> None)
                   globals)
            with
            | Ok resolved -> resolved.Cli_config.config
            | Error err -> failf "config-error: %s" err.Error.message
          in
          let login_result = run_blocking (Auth_state.login config) in
          let _, callback_status = waitpid_noeintr [] callback_pid in
          (match callback_status with
          | Unix.WEXITED 0 -> ()
          | _ -> failf "login callback server did not accept callback");
          match login_result with
          | Error err ->
              failf "login failed: %s:%s"
                (Edn_util.keyword_to_string err.Error.code)
                err.message
          | Ok result ->
              let result =
                "ok:" ^ result.Auth_state.authorize_url ^ ":"
                ^ string_of_bool result.opened
                ^ ":"
                ^ Option.value result.email ~default:""
              in
              assert_contains ~name:"login authorize endpoint"
                "https://logseq-prod.auth.us-east-1.amazoncognito.com/oauth2/authorize"
                result;
              assert_contains ~name:"login authorize state" "state=state-1"
                result;
              assert_contains ~name:"login authorize challenge"
                "code_challenge=challenge-1" result;
              assert_contains ~name:"login opened false" ":false:" result;
              assert_contains ~name:"login result email" "login@example.com"
                result;
              let auth_file = read_binary_file auth_path in
              assert_contains ~name:"login persisted id token" id_token
                auth_file;
              assert_contains ~name:"login persisted access token"
                "access-login" auth_file;
              assert_contains ~name:"login persisted refresh token"
                "refresh-login" auth_file));

  check "Cli.run executes logout through typed action and deletes auth file"
    (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-auth-logout-" in
      let auth_path = Filename.concat root "auth.json" in
      let config_path = Filename.concat root "cli.edn" in
      ensure_test_dir root;
      write_text_file config_path ("{:auth-path \"" ^ auth_path ^ "\"}");
      write_text_file auth_path
        {|{"provider":"cognito","id-token":"id-token","updated-at":1700000000000}|};
      let output =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--config";
                  config_path;
                  "--root-dir";
                  root;
                  "--output";
                  "json";
                  "logout";
                ]))
      in
      assert_int ~name:"logout exit" 0 output.exit_code;
      let body = String.trim (cli_stdout output) in
      assert_contains ~name:"logout status" {|"status":"ok"|} body;
      assert_contains ~name:"logout deleted" {|"deleted":true|} body;
      assert_contains ~name:"logout completed" {|"logout-completed":false|} body;
      assert_bool ~name:"auth file deleted" false (Sys.file_exists auth_path);
      match output.lifecycle.action with
      | Some (Cli_action.Auth Auth_command.Logout) -> ()
      | _ -> failf "expected typed logout action");

  check "Cli.run executes sync config set get unset through typed actions"
    (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-sync-config-" in
      ensure_test_dir root;
      let set_output =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--root-dir";
                  root;
                  "--output";
                  "json";
                  "sync";
                  "config";
                  "set";
                  "ws-url";
                  "ws://127.0.0.1:1234";
                ]))
      in
      assert_int ~name:"sync config set exit" 0 set_output.exit_code;
      assert_equal ~name:"sync config set json"
        {|{"status":"ok","data":{"key":"ws-url","value":"ws://127.0.0.1:1234"}}|}
        (String.trim (cli_stdout set_output));
      (match set_output.lifecycle.action with
      | Some
          (Cli_action.Sync (Sync.Sync_config_set { key = Sync.Ws_url; value }))
        ->
          assert_equal ~name:"sync config set action value"
            "ws://127.0.0.1:1234" value
      | _ -> failf "expected typed sync config set action");
      assert_contains ~name:"sync config file" {|:ws-url "ws://127.0.0.1:1234"|}
        (read_binary_file (Filename.concat root "cli.edn"));
      let get_output =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--root-dir";
                  root;
                  "--output";
                  "json";
                  "sync";
                  "config";
                  "get";
                  "ws-url";
                ]))
      in
      assert_int ~name:"sync config get exit" 0 get_output.exit_code;
      assert_equal ~name:"sync config get json"
        {|{"status":"ok","data":{"key":"ws-url","value":"ws://127.0.0.1:1234"}}|}
        (String.trim (cli_stdout get_output));
      let unset_output =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--root-dir";
                  root;
                  "--output";
                  "json";
                  "sync";
                  "config";
                  "unset";
                  "ws-url";
                ]))
      in
      assert_int ~name:"sync config unset exit" 0 unset_output.exit_code;
      assert_equal ~name:"sync config unset json"
        {|{"status":"ok","data":{"key":"ws-url"}}|}
        (String.trim (cli_stdout unset_output));
      assert_not_contains ~name:"sync config unset file" ":ws-url"
        (read_binary_file (Filename.concat root "cli.edn")));

  check "Cli.run rejects invalid sync config options" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let missing =
        run_blocking
          (Cli.run app
             (cli_input
                [ "--output"; "json"; "sync"; "config"; "set"; "ws-url" ]))
      in
      assert_int ~name:"sync config missing exit" 1 missing.exit_code;
      assert_equal ~name:"sync config missing json"
        {|{"status":"error","error":{"code":"invalid-options","message":"config value is required"}}|}
        (String.trim (cli_stdout missing));
      let unknown =
        run_blocking
          (Cli.run app
             (cli_input
                [ "--output"; "json"; "sync"; "config"; "get"; "bad-key" ]))
      in
      assert_int ~name:"sync config unknown exit" 1 unknown.exit_code;
      assert_equal ~name:"sync config unknown json"
        {|{"status":"error","error":{"code":"invalid-options","message":"unknown config key: bad-key"}}|}
        (String.trim (cli_stdout unknown)));

  check "Cli.run executes sync status through typed action" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"sync status config line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"sync status config method"
              {|"method":"thread-api/set-db-sync-config"|} request.body;
            assert_contains ~name:"sync status config ws" {|\"~:ws-url\"|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_equal ~name:"sync status line" "POST /v1/invoke HTTP/1.1"
              request.request_line;
            assert_contains ~name:"sync status method"
              {|"method":"thread-api/db-sync-status"|} request.body;
            assert_contains ~name:"sync status repo" {|logseq_db_alpha|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:ws-state\",\"~:open\",\"~:graph-id\",\"~u11111111-1111-1111-1111-111111111111\",\"~:last-error\",null]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [ "--graph"; "alpha"; "--output"; "json"; "sync"; "status" ]))
          in
          assert_int ~name:"sync status exit" 0 output.exit_code;
          let body = String.trim (cli_stdout output) in
          assert_contains ~name:"sync status ok" {|"status":"ok"|} body;
          assert_contains ~name:"sync status state" {|"ws-state":"open"|} body;
          assert_contains ~name:"sync status graph id"
            {|"graph-id":"11111111-1111-1111-1111-111111111111"|} body;
          match output.lifecycle.action with
          | Some (Cli_action.Sync (Sync.Sync_status { repo; graph })) ->
              assert_equal ~name:"sync status repo action" "logseq_db_alpha"
                (repo_string repo);
              assert_equal ~name:"sync status graph action" "alpha"
                (graph_string graph)
          | _ -> failf "expected typed sync status action"));

  check "Cli.run sends configured auth state before sync runtime config"
    (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-sync-auth-" in
      let config_path = Filename.concat root "cli.edn" in
      ensure_test_dir root;
      write_text_file config_path
        {|{:id-token "id-token" :access-token "access-token" :refresh-token "refresh-token"}|};
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"sync auth state line" "POST /v1/invoke HTTP/1.1"
              request.request_line;
            assert_contains ~name:"sync auth state method"
              {|"method":"thread-api/sync-app-state"|} request.body;
            assert_contains ~name:"sync auth id token" {|auth/id-token|}
              request.body;
            assert_contains ~name:"sync auth access token" {|auth/access-token|}
              request.body;
            assert_contains ~name:"sync auth refresh token"
              {|auth/refresh-token|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_equal ~name:"sync auth config line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"sync auth config method"
              {|"method":"thread-api/set-db-sync-config"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_equal ~name:"sync auth status line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"sync auth status method"
              {|"method":"thread-api/db-sync-status"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:ws-state\",\"~:open\"]"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--config";
                      config_path;
                      "--root-dir";
                      root;
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "sync";
                      "status";
                    ]))
          in
          assert_int ~name:"sync auth status exit" 0 output.exit_code;
          assert_equal ~name:"sync auth status json"
            {|{"status":"ok","data":{"ws-state":"open"}}|}
            (String.trim (cli_stdout output))));

  check "Cli.run resolves auth file before sync start" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-sync-start-auth-file-" in
      let config_path = Filename.concat root "cli.edn" in
      let auth_path = Filename.concat root "auth.json" in
      ensure_test_dir root;
      write_text_file config_path ("{:auth-path \"" ^ auth_path ^ "\"}");
      write_text_file auth_path
        {|{"provider":"cognito","id-token":"id-token","access-token":"access-token","refresh-token":"refresh-token","expires-at":4102444800000,"updated-at":1700000000000}|};
      with_http_server_sequence
        [
          (fun request ->
            assert_contains ~name:"sync start auth file method"
              {|"method":"thread-api/sync-app-state"|} request.body;
            assert_contains ~name:"sync start auth file id token"
              {|auth/id-token|} request.body;
            assert_contains ~name:"sync start auth file access token"
              {|auth/access-token|} request.body;
            assert_contains ~name:"sync start auth file refresh token"
              {|auth/refresh-token|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_contains ~name:"sync start auth file config method"
              {|"method":"thread-api/set-db-sync-config"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_contains ~name:"sync start auth file e2ee method"
              {|"method":"thread-api/q"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"false"}|} ));
          (fun request ->
            assert_contains ~name:"sync start auth file start method"
              {|"method":"thread-api/db-sync-start"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_contains ~name:"sync start auth file status method"
              {|"method":"thread-api/db-sync-status"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:ws-state\",\"~:open\",\"~:last-error\",null]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--config";
                      config_path;
                      "--root-dir";
                      root;
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "sync";
                      "start";
                    ]))
          in
          assert_int ~name:"sync start auth file exit" 0 output.exit_code;
          assert_contains ~name:"sync start auth file open"
            {|"ws-state":"open"|} (cli_stdout output)));

  check "Cli.run executes sync start through typed action" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"sync start config line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"sync start config method"
              {|"method":"thread-api/set-db-sync-config"|} request.body;
            assert_contains ~name:"sync start config ws" {|\"~:ws-url\"|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_equal ~name:"sync start e2ee line" "POST /v1/invoke HTTP/1.1"
              request.request_line;
            assert_contains ~name:"sync start e2ee method"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"sync start e2ee repo" {|logseq_db_alpha|}
              request.body;
            assert_contains ~name:"sync start e2ee ident"
              {|logseq.kv/graph-rtc-e2ee?|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"false"}|} ));
          (fun request ->
            assert_equal ~name:"sync start line" "POST /v1/invoke HTTP/1.1"
              request.request_line;
            assert_contains ~name:"sync start method"
              {|"method":"thread-api/db-sync-start"|} request.body;
            assert_contains ~name:"sync start repo" {|logseq_db_alpha|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_equal ~name:"sync start status line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"sync start status method"
              {|"method":"thread-api/db-sync-status"|} request.body;
            assert_contains ~name:"sync start status repo" {|logseq_db_alpha|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:ws-state\",\"~:open\",\"~:graph-id\",\"~u11111111-1111-1111-1111-111111111111\",\"~:last-error\",null]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [ "--graph"; "alpha"; "--output"; "json"; "sync"; "start" ]))
          in
          assert_int ~name:"sync start exit" 0 output.exit_code;
          let body = String.trim (cli_stdout output) in
          assert_contains ~name:"sync start ok" {|"status":"ok"|} body;
          assert_contains ~name:"sync start state" {|"ws-state":"open"|} body;
          match output.lifecycle.action with
          | Some
              (Cli_action.Sync (Sync.Sync_start { repo; graph; e2ee_password }))
            -> (
              assert_equal ~name:"sync start repo action" "logseq_db_alpha"
                (repo_string repo);
              assert_equal ~name:"sync start graph action" "alpha"
                (graph_string graph);
              match e2ee_password with
              | None -> ()
              | Some _ -> failf "expected no start e2ee password")
          | _ -> failf "expected typed sync start action"));

  check "Cli.run verifies and saves e2ee password before sync start" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-sync-start-e2ee-password-" in
      let config_path = Filename.concat root "cli.edn" in
      let auth_path = Filename.concat root "auth.json" in
      ensure_test_dir root;
      write_text_file config_path ("{:auth-path \"" ^ auth_path ^ "\"}");
      write_text_file auth_path
        {|{"provider":"cognito","id-token":"id-token","access-token":"access-token","refresh-token":"refresh-token","expires-at":4102444800000,"updated-at":1700000000000}|};
      with_http_server_sequence
        [
          (fun request ->
            assert_contains ~name:"sync start e2ee password auth method"
              {|"method":"thread-api/sync-app-state"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_contains ~name:"sync start e2ee password config method"
              {|"method":"thread-api/set-db-sync-config"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_contains ~name:"sync start e2ee password query method"
              {|"method":"thread-api/q"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_contains ~name:"sync start e2ee password verify method"
              {|"method":"thread-api/verify-and-save-e2ee-password"|}
              request.body;
            assert_contains ~name:"sync start e2ee password refresh token"
              {|refresh-token|} request.body;
            assert_contains ~name:"sync start e2ee password value" {|secret-pw|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_contains ~name:"sync start e2ee password start method"
              {|"method":"thread-api/db-sync-start"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_contains ~name:"sync start e2ee password status method"
              {|"method":"thread-api/db-sync-status"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:ws-state\",\"~:open\",\"~:last-error\",null]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--config";
                      config_path;
                      "--root-dir";
                      root;
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "sync";
                      "start";
                      "--e2ee-password";
                      "secret-pw";
                    ]))
          in
          assert_int ~name:"sync start e2ee password exit" 0 output.exit_code;
          assert_contains ~name:"sync start e2ee password open"
            {|"ws-state":"open"|} (cli_stdout output)));

  check "Cli.run loads persisted e2ee password before sync start" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-sync-start-e2ee-persisted-" in
      let config_path = Filename.concat root "cli.edn" in
      let auth_path = Filename.concat root "auth.json" in
      ensure_test_dir root;
      write_text_file config_path ("{:auth-path \"" ^ auth_path ^ "\"}");
      write_text_file auth_path
        {|{"provider":"cognito","id-token":"id-token","access-token":"access-token","refresh-token":"refresh-token","expires-at":4102444800000,"updated-at":1700000000000}|};
      with_http_server_sequence
        [
          (fun request ->
            assert_contains ~name:"sync start persisted e2ee auth method"
              {|"method":"thread-api/sync-app-state"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_contains ~name:"sync start persisted e2ee config method"
              {|"method":"thread-api/set-db-sync-config"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_contains ~name:"sync start persisted e2ee query method"
              {|"method":"thread-api/q"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_contains ~name:"sync start persisted e2ee load method"
              {|"method":"thread-api/get-e2ee-password"|} request.body;
            assert_contains ~name:"sync start persisted e2ee refresh token"
              {|refresh-token|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_contains ~name:"sync start persisted e2ee start method"
              {|"method":"thread-api/db-sync-start"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_contains ~name:"sync start persisted e2ee status method"
              {|"method":"thread-api/db-sync-status"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:ws-state\",\"~:open\",\"~:last-error\",null]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--config";
                      config_path;
                      "--root-dir";
                      root;
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "sync";
                      "start";
                    ]))
          in
          assert_int ~name:"sync start persisted e2ee exit" 0 output.exit_code;
          assert_contains ~name:"sync start persisted e2ee open"
            {|"ws-state":"open"|} (cli_stdout output)));

  check "Cli.run waits for sync start to reach open state" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_contains ~name:"sync start wait config method"
              {|"method":"thread-api/set-db-sync-config"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_contains ~name:"sync start wait e2ee method"
              {|"method":"thread-api/q"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"false"}|} ));
          (fun request ->
            assert_contains ~name:"sync start wait start method"
              {|"method":"thread-api/db-sync-start"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_contains ~name:"sync start wait first status method"
              {|"method":"thread-api/db-sync-status"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:ws-state\",\"~:closed\",\"~:graph-id\",\"~u11111111-1111-1111-1111-111111111111\",\"~:last-error\",null]"}|}
            ));
          (fun request ->
            assert_contains ~name:"sync start wait second status method"
              {|"method":"thread-api/db-sync-status"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:ws-state\",\"~:open\",\"~:graph-id\",\"~u11111111-1111-1111-1111-111111111111\",\"~:last-error\",null]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [ "--graph"; "alpha"; "--output"; "json"; "sync"; "start" ]))
          in
          assert_int ~name:"sync start wait exit" 0 output.exit_code;
          assert_contains ~name:"sync start wait open" {|"ws-state":"open"|}
            (cli_stdout output);
          assert_not_contains ~name:"sync start wait closed"
            {|"ws-state":"closed"|} (cli_stdout output)));

  check "Cli.run rejects sync start without a graph" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-sync-start-missing-graph-" in
      let output =
        run_blocking
          (Cli.run app
             (cli_input
                [ "--root-dir"; root; "--output"; "json"; "sync"; "start" ]))
      in
      assert_int ~name:"sync start missing graph exit" 1 output.exit_code;
      assert_equal ~name:"sync start missing graph json"
        {|{"status":"error","error":{"code":"missing-repo","message":"repo is required for sync-start"}}|}
        (String.trim (cli_stdout output)));

  check "Cli.run executes sync stop through typed action" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"sync stop config line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"sync stop config method"
              {|"method":"thread-api/set-db-sync-config"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_equal ~name:"sync stop line" "POST /v1/invoke HTTP/1.1"
              request.request_line;
            assert_contains ~name:"sync stop method"
              {|"method":"thread-api/db-sync-stop"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [ "--graph"; "alpha"; "--output"; "json"; "sync"; "stop" ]))
          in
          assert_int ~name:"sync stop exit" 0 output.exit_code;
          assert_equal ~name:"sync stop json"
            {|{"status":"ok","data":{"result":true}}|}
            (String.trim (cli_stdout output));
          match output.lifecycle.action with
          | Some (Cli_action.Sync (Sync.Sync_stop { repo; graph })) ->
              assert_equal ~name:"sync stop repo action" "logseq_db_alpha"
                (repo_string repo);
              assert_equal ~name:"sync stop graph action" "alpha"
                (graph_string graph)
          | _ -> failf "expected typed sync stop action"));

  check "Cli.run normalizes sync stop quoted nil result" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_contains ~name:"sync stop quote config method"
              {|"method":"thread-api/set-db-sync-config"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_contains ~name:"sync stop quote method"
              {|"method":"thread-api/db-sync-stop"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"~#'\",\"~_\"]"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [ "--graph"; "alpha"; "--output"; "json"; "sync"; "stop" ]))
          in
          assert_int ~name:"sync stop quote exit" 0 output.exit_code;
          assert_equal ~name:"sync stop quote json"
            {|{"status":"ok","data":{"result":null}}|}
            (String.trim (cli_stdout output))));

  check "Cli.run rejects sync status without a graph" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-sync-status-missing-graph-" in
      let output =
        run_blocking
          (Cli.run app
             (cli_input
                [ "--root-dir"; root; "--output"; "json"; "sync"; "status" ]))
      in
      assert_int ~name:"sync status missing graph exit" 1 output.exit_code;
      assert_equal ~name:"sync status missing graph json"
        {|{"status":"error","error":{"code":"missing-repo","message":"repo is required for sync-status"}}|}
        (String.trim (cli_stdout output)));

  check "Cli.run executes sync upload through typed action" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"sync upload config line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"sync upload config method"
              {|"method":"thread-api/set-db-sync-config"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_equal ~name:"sync upload line" "POST /v1/invoke HTTP/1.1"
              request.request_line;
            assert_contains ~name:"sync upload e2ee query method"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"sync upload e2ee query ident"
              {|logseq.kv/graph-rtc-e2ee?|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"false"}|} ));
          (fun request ->
            assert_equal ~name:"sync upload line" "POST /v1/invoke HTTP/1.1"
              request.request_line;
            assert_contains ~name:"sync upload method"
              {|"method":"thread-api/db-sync-upload-graph"|} request.body;
            assert_contains ~name:"sync upload repo" {|logseq_db_alpha|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [ "--graph"; "alpha"; "--output"; "json"; "sync"; "upload" ]))
          in
          assert_int ~name:"sync upload exit" 0 output.exit_code;
          assert_equal ~name:"sync upload json"
            {|{"status":"ok","data":{"result":true}}|}
            (String.trim (cli_stdout output));
          match output.lifecycle.action with
          | Some
              (Cli_action.Sync (Sync.Sync_upload { repo; graph; e2ee_password }))
            -> (
              assert_equal ~name:"sync upload repo action" "logseq_db_alpha"
                (repo_string repo);
              assert_equal ~name:"sync upload graph action" "alpha"
                (graph_string graph);
              match e2ee_password with
              | None -> ()
              | Some _ -> failf "expected no upload e2ee password")
          | _ -> failf "expected typed sync upload action"));

  check "Cli.run resolves auth file before sync upload" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-sync-upload-auth-file-" in
      let config_path = Filename.concat root "cli.edn" in
      let auth_path = Filename.concat root "auth.json" in
      ensure_test_dir root;
      write_text_file config_path ("{:auth-path \"" ^ auth_path ^ "\"}");
      write_text_file auth_path
        {|{"provider":"cognito","id-token":"id-token","access-token":"access-token","refresh-token":"refresh-token","expires-at":4102444800000,"updated-at":1700000000000}|};
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"sync upload auth line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"sync upload auth method"
              {|"method":"thread-api/sync-app-state"|} request.body;
            assert_contains ~name:"sync upload auth id token" {|auth/id-token|}
              request.body;
            assert_contains ~name:"sync upload auth access token"
              {|auth/access-token|} request.body;
            assert_contains ~name:"sync upload auth refresh token"
              {|auth/refresh-token|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_contains ~name:"sync upload auth config method"
              {|"method":"thread-api/set-db-sync-config"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_contains ~name:"sync upload auth e2ee query method"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"sync upload auth e2ee query ident"
              {|logseq.kv/graph-rtc-e2ee?|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"false"}|} ));
          (fun request ->
            assert_contains ~name:"sync upload auth upload method"
              {|"method":"thread-api/db-sync-upload-graph"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--config";
                      config_path;
                      "--root-dir";
                      root;
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "sync";
                      "upload";
                    ]))
          in
          assert_int ~name:"sync upload auth exit" 0 output.exit_code;
          assert_equal ~name:"sync upload auth json"
            {|{"status":"ok","data":{"result":true}}|}
            (String.trim (cli_stdout output))));

  check "Cli.run uses long timeout for sync upload invoke" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_contains ~name:"sync upload timeout config method"
              {|"method":"thread-api/set-db-sync-config"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_contains ~name:"sync upload timeout e2ee query method"
              {|"method":"thread-api/q"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"false"}|} ));
          (fun request ->
            assert_contains ~name:"sync upload timeout upload method"
              {|"method":"thread-api/db-sync-upload-graph"|} request.body;
            sleep_ms 100L;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--timeout-ms";
                      "50";
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "sync";
                      "upload";
                    ]))
          in
          if output.exit_code <> 0 then
            failf "sync upload timeout exit\nstdout: %S" (cli_stdout output);
          assert_equal ~name:"sync upload timeout json"
            {|{"status":"ok","data":{"result":true}}|}
            (String.trim (cli_stdout output))));

  check "Cli.run loads persisted e2ee password before sync upload" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-sync-upload-e2ee-auth-file-" in
      let config_path = Filename.concat root "cli.edn" in
      let auth_path = Filename.concat root "auth.json" in
      ensure_test_dir root;
      write_text_file config_path ("{:auth-path \"" ^ auth_path ^ "\"}");
      write_text_file auth_path
        {|{"id-token":"id-token","access-token":"access-token","refresh-token":"refresh-token","expires-at":4102444800000,"updated-at":1700000000000}|};
      with_http_server_sequence
        [
          (fun request ->
            assert_contains ~name:"sync upload e2ee auth method"
              {|"method":"thread-api/sync-app-state"|} request.body;
            assert_contains ~name:"sync upload e2ee auth refresh token"
              {|auth/refresh-token|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_contains ~name:"sync upload e2ee config method"
              {|"method":"thread-api/set-db-sync-config"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_contains ~name:"sync upload e2ee query method"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"sync upload e2ee query ident"
              {|logseq.kv/graph-rtc-e2ee?|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"null"}|} ));
          (fun request ->
            assert_contains ~name:"sync upload e2ee get method"
              {|"method":"thread-api/get-e2ee-password"|} request.body;
            assert_contains ~name:"sync upload e2ee refresh token"
              {|refresh-token|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"\"stored-secret\""}|} ));
          (fun request ->
            assert_contains ~name:"sync upload e2ee upload method"
              {|"method":"thread-api/db-sync-upload-graph"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--config";
                      config_path;
                      "--root-dir";
                      root;
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "sync";
                      "upload";
                    ]))
          in
          assert_int ~name:"sync upload e2ee exit" 0 output.exit_code;
          assert_equal ~name:"sync upload e2ee json"
            {|{"status":"ok","data":{"result":true}}|}
            (String.trim (cli_stdout output))));

  check "Cli.run reports sync upload e2ee password worker errors" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-sync-upload-e2ee-worker-error-" in
      let config_path = Filename.concat root "cli.edn" in
      let auth_path = Filename.concat root "auth.json" in
      ensure_test_dir root;
      write_text_file config_path ("{:auth-path \"" ^ auth_path ^ "\"}");
      write_text_file auth_path
        {|{"id-token":"id-token","access-token":"access-token","refresh-token":"refresh-token","expires-at":4102444800000,"updated-at":1700000000000}|};
      with_http_server_sequence
        [
          (fun request ->
            assert_contains ~name:"sync upload e2ee worker error auth method"
              {|"method":"thread-api/sync-app-state"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_contains ~name:"sync upload e2ee worker error config method"
              {|"method":"thread-api/set-db-sync-config"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_contains ~name:"sync upload e2ee worker error query method"
              {|"method":"thread-api/q"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"null"}|} ));
          (fun request ->
            assert_contains ~name:"sync upload e2ee worker error get method"
              {|"method":"thread-api/get-e2ee-password"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"~#error\",[\"^ \",\"~:message\",\"decrypt-text-by-text-password\",\"~:data\",[\"^ \"]]]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--config";
                      config_path;
                      "--root-dir";
                      root;
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "sync";
                      "upload";
                    ]))
          in
          assert_int ~name:"sync upload e2ee worker error exit" 1
            output.exit_code;
          assert_equal ~name:"sync upload e2ee worker error json"
            {|{"status":"error","error":{"code":"e2ee-password-not-found","message":"e2ee-password not found"}}|}
            (String.trim (cli_stdout output))));

  check "Cli.run reports sync upload worker errors" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_contains ~name:"sync upload worker error config method"
              {|"method":"thread-api/set-db-sync-config"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_contains ~name:"sync upload worker error e2ee query method"
              {|"method":"thread-api/q"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"false"}|} ));
          (fun request ->
            assert_contains ~name:"sync upload worker error upload method"
              {|"method":"thread-api/db-sync-upload-graph"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"~#error\",[\"^ \",\"~:message\",\"decrypt-text-by-text-password\",\"~:data\",[\"^ \"]]]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [ "--graph"; "alpha"; "--output"; "json"; "sync"; "upload" ]))
          in
          assert_int ~name:"sync upload worker error exit" 1 output.exit_code;
          assert_equal ~name:"sync upload worker error json"
            {|{"status":"error","error":{"code":"sync-upload-failed","message":"decrypt-text-by-text-password"}}|}
            (String.trim (cli_stdout output))));

  check "Cli.run rejects sync upload without a graph" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-sync-upload-missing-graph-" in
      let output =
        run_blocking
          (Cli.run app
             (cli_input
                [ "--root-dir"; root; "--output"; "json"; "sync"; "upload" ]))
      in
      assert_int ~name:"sync upload missing graph exit" 1 output.exit_code;
      assert_equal ~name:"sync upload missing graph json"
        {|{"status":"error","error":{"code":"missing-repo","message":"repo is required for sync-upload"}}|}
        (String.trim (cli_stdout output)));

  check "Cli.run executes sync remote-graphs through typed action" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-sync-remote-graphs-auth-" in
      let config_path = Filename.concat root "cli.edn" in
      let auth_path = Filename.concat root "auth.json" in
      ensure_test_dir root;
      write_text_file config_path ("{:auth-path \"" ^ auth_path ^ "\"}");
      write_text_file auth_path
        {|{"provider":"cognito","id-token":"id-token","access-token":"access-token","refresh-token":"refresh-token","expires-at":4102444800000,"updated-at":1700000000000}|};
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"sync remote graphs auth line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"sync remote graphs auth method"
              {|"method":"thread-api/sync-app-state"|} request.body;
            assert_contains ~name:"sync remote graphs auth id token"
              {|auth/id-token|} request.body;
            assert_contains ~name:"sync remote graphs auth access token"
              {|auth/access-token|} request.body;
            assert_contains ~name:"sync remote graphs auth refresh token"
              {|auth/refresh-token|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_equal ~name:"sync remote graphs config line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"sync remote graphs config method"
              {|"method":"thread-api/set-db-sync-config"|} request.body;
            assert_contains ~name:"sync remote graphs config http base"
              "https://api.logseq.io" request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_equal ~name:"sync remote graphs line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"sync remote graphs method"
              {|"method":"thread-api/db-sync-list-remote-graphs"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"null"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--config";
                      config_path;
                      "--root-dir";
                      root;
                      "--output";
                      "json";
                      "sync";
                      "remote-graphs";
                    ]))
          in
          assert_int ~name:"sync remote graphs exit" 0 output.exit_code;
          assert_equal ~name:"sync remote graphs json"
            {|{"status":"ok","data":{"graphs":[]}}|}
            (String.trim (cli_stdout output));
          match output.lifecycle.action with
          | Some (Cli_action.Sync Sync.Sync_remote_graphs) -> ()
          | _ -> failf "expected typed sync remote-graphs action"));

  check "Cli.run renders sync remote-graphs human columns" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-sync-remote-graphs-human-" in
      let config_path = Filename.concat root "cli.edn" in
      let auth_path = Filename.concat root "auth.json" in
      ensure_test_dir root;
      write_text_file config_path ("{:auth-path \"" ^ auth_path ^ "\"}");
      write_text_file auth_path
        {|{"provider":"cognito","id-token":"id-token","access-token":"access-token","refresh-token":"refresh-token","expires-at":4102444800000,"updated-at":1700000000000}|};
      with_http_server_sequence
        [
          (fun _request ->
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun _request ->
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_contains ~name:"sync remote graphs human method"
              {|"method":"thread-api/db-sync-list-remote-graphs"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[\"^ \",\"~:role\",\"manager\",\"~:updated-at\",1779200243789,\"~:graph-name\",\"alpha\",\"~:schema-version\",\"65\",\"~:invited-by\",\"user-1\",\"~:graph-id\",\"~u11111111-1111-1111-1111-111111111111\",\"~:graph-ready-for-use?\",true,\"~:created-at\",1779200243789,\"~:graph-e2ee?\",false]]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--config";
                      config_path;
                      "--root-dir";
                      root;
                      "sync";
                      "remote-graphs";
                    ]))
          in
          assert_int ~name:"sync remote graphs human exit" 0 output.exit_code;
          let header =
            match
              String.split_on_char '\n' (String.trim (cli_stdout output))
            with
            | header :: _ -> header
            | [] -> failf "expected sync remote graphs human output"
          in
          List.iter
            (fun label ->
              assert_contains
                ~name:("sync remote graphs header has " ^ label)
                label header)
            [ "graph-name"; "graph-id"; "graph-e2ee?"; "role"; "created-at" ];
          List.iter
            (fun label ->
              assert_not_contains
                ~name:("sync remote graphs header omits " ^ label)
                label header)
            [
              "updated-at";
              "schema-version";
              "invited-by";
              "graph-ready-for-use?";
            ];
          assert_before ~name:"sync remote graphs header order graph-name"
            "graph-name" "graph-id" header;
          assert_before ~name:"sync remote graphs header order graph-id"
            "graph-id" "graph-e2ee?" header;
          assert_before ~name:"sync remote graphs header order e2ee"
            "graph-e2ee?" "role" header;
          assert_before ~name:"sync remote graphs header order role" "role"
            "created-at" header));

  check "Cli.run reports sync remote-graphs worker errors" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-sync-remote-graphs-error-" in
      let config_path = Filename.concat root "cli.edn" in
      let auth_path = Filename.concat root "auth.json" in
      ensure_test_dir root;
      write_text_file config_path ("{:auth-path \"" ^ auth_path ^ "\"}");
      write_text_file auth_path
        {|{"provider":"cognito","id-token":"id-token","access-token":"access-token","refresh-token":"refresh-token","expires-at":4102444800000,"updated-at":1700000000000}|};
      with_http_server_sequence
        [
          (fun _request ->
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun _request ->
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_contains ~name:"sync remote graphs worker error method"
              {|"method":"thread-api/db-sync-list-remote-graphs"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"~#error\",[\"^ \",\"~:message\",\"db-sync request failed\",\"~:data\",[\"^ \",\"~:status\",404,\"~:url\",\"https://api.logseq.com/graphs\"]]]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--config";
                      config_path;
                      "--root-dir";
                      root;
                      "--output";
                      "json";
                      "sync";
                      "remote-graphs";
                    ]))
          in
          assert_int ~name:"sync remote graphs worker error exit" 1
            output.exit_code;
          assert_equal ~name:"sync remote graphs worker error json"
            {|{"status":"error","error":{"code":"sync-remote-graphs-failed","message":"db-sync request failed"}}|}
            (String.trim (cli_stdout output))));

  check "Cli.run executes sync grant-access through typed action" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let graph_id = "11111111-1111-1111-1111-111111111111" in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"sync grant config line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"sync grant config method"
              {|"method":"thread-api/set-db-sync-config"|} request.body;
            assert_contains ~name:"sync grant config http" {|\"~:http-base\"|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_equal ~name:"sync grant line" "POST /v1/invoke HTTP/1.1"
              request.request_line;
            assert_contains ~name:"sync grant method"
              {|"method":"thread-api/db-sync-grant-graph-access"|} request.body;
            assert_contains ~name:"sync grant repo" {|logseq_db_alpha|}
              request.body;
            assert_contains ~name:"sync grant graph id" graph_id request.body;
            assert_contains ~name:"sync grant email" {|teammate@example.com|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "sync";
                      "grant-access";
                      "--graph-id";
                      graph_id;
                      "--email";
                      "teammate@example.com";
                    ]))
          in
          assert_int ~name:"sync grant exit" 0 output.exit_code;
          assert_equal ~name:"sync grant json"
            {|{"status":"ok","data":{"result":true}}|}
            (String.trim (cli_stdout output));
          match output.lifecycle.action with
          | Some
              (Cli_action.Sync
                 (Sync.Sync_grant_access
                    { repo; graph; graph_id = action_graph_id; email })) ->
              assert_equal ~name:"sync grant repo action" "logseq_db_alpha"
                (repo_string repo);
              assert_equal ~name:"sync grant graph action" "alpha"
                (graph_string graph);
              assert_equal ~name:"sync grant graph id action" graph_id
                action_graph_id;
              assert_equal ~name:"sync grant email action"
                "teammate@example.com" email
          | _ -> failf "expected typed sync grant-access action"));

  check "Cli.run rejects sync grant-access without graph-id" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let output =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "sync";
                  "grant-access";
                  "--email";
                  "teammate@example.com";
                ]))
      in
      assert_int ~name:"sync grant missing graph id exit" 1 output.exit_code;
      assert_equal ~name:"sync grant missing graph id json"
        {|{"status":"error","error":{"code":"invalid-options","message":"--graph-id is required"}}|}
        (String.trim (cli_stdout output)));

  check "Cli.run executes sync ensure-keys through typed action" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"sync ensure config line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"sync ensure config method"
              {|"method":"thread-api/set-db-sync-config"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_equal ~name:"sync ensure line" "POST /v1/invoke HTTP/1.1"
              request.request_line;
            assert_contains ~name:"sync ensure method"
              {|"method":"thread-api/db-sync-ensure-user-rsa-keys"|}
              request.body;
            assert_contains ~name:"sync ensure empty args"
              {|"argsTransit":"[]"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [ "--output"; "json"; "sync"; "ensure-keys" ]))
          in
          assert_int ~name:"sync ensure exit" 0 output.exit_code;
          assert_equal ~name:"sync ensure json"
            {|{"status":"ok","data":{"result":true}}|}
            (String.trim (cli_stdout output));
          match output.lifecycle.action with
          | Some
              (Cli_action.Sync
                 (Sync.Sync_ensure_keys { e2ee_password; upload_keys })) ->
              (match e2ee_password with
              | None -> ()
              | Some _ -> failf "expected no ensure e2ee password");
              if upload_keys then failf "expected upload keys disabled"
          | _ -> failf "expected typed sync ensure-keys action"));

  check "Cli.run executes sync ensure-keys upload options through typed action"
    (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"sync ensure upload config line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"sync ensure upload config method"
              {|"method":"thread-api/set-db-sync-config"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_equal ~name:"sync ensure upload line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"sync ensure upload method"
              {|"method":"thread-api/db-sync-ensure-user-rsa-keys"|}
              request.body;
            assert_contains ~name:"sync ensure upload option"
              {|\"~:ensure-server?\",true|} request.body;
            assert_contains ~name:"sync ensure upload password" {|secret|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--output";
                      "json";
                      "sync";
                      "ensure-keys";
                      "--upload-keys";
                      "--e2ee-password";
                      "secret";
                    ]))
          in
          assert_int ~name:"sync ensure upload exit" 0 output.exit_code;
          assert_equal ~name:"sync ensure upload json"
            {|{"status":"ok","data":{"result":true}}|}
            (String.trim (cli_stdout output));
          match output.lifecycle.action with
          | Some
              (Cli_action.Sync
                 (Sync.Sync_ensure_keys { e2ee_password; upload_keys })) ->
              assert_equal ~name:"sync ensure upload password action" "secret"
                (Option.value e2ee_password ~default:"");
              if not upload_keys then failf "expected upload keys enabled"
          | _ -> failf "expected typed sync ensure-keys action"));

  check "Cli.run executes sync download through typed action" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-sync-download-" in
      let graph_id = "11111111-1111-1111-1111-111111111111" in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"sync download global config line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"sync download global config method"
              {|"method":"thread-api/set-db-sync-config"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_equal ~name:"sync download remote graphs line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"sync download remote graphs method"
              {|"method":"thread-api/db-sync-list-remote-graphs"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[\"^ \",\"~:graph-name\",\"alpha\",\"~:graph-id\",\"~u11111111-1111-1111-1111-111111111111\",\"~:graph-e2ee?\",false]]"}|}
            ));
          (fun request ->
            assert_equal ~name:"sync download config line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"sync download config method"
              {|"method":"thread-api/set-db-sync-config"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_equal ~name:"sync download empty db line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"sync download empty db method"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"sync download empty db queries block names"
              {|block/name|} request.body;
            assert_contains ~name:"sync download empty db repo"
              {|logseq_db_alpha|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"0"}|} ));
          (fun request ->
            assert_equal ~name:"sync download line" "POST /v1/invoke HTTP/1.1"
              request.request_line;
            assert_contains ~name:"sync download method"
              {|"method":"thread-api/db-sync-download-graph-by-id"|}
              request.body;
            assert_contains ~name:"sync download repo" {|logseq_db_alpha|}
              request.body;
            assert_contains ~name:"sync download graph id" graph_id request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--root-dir";
                      root;
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "sync";
                      "download";
                    ]))
          in
          assert_int ~name:"sync download exit" 0 output.exit_code;
          assert_equal ~name:"sync download json"
            {|{"status":"ok","data":{"result":true}}|}
            (String.trim (cli_stdout output));
          match output.lifecycle.action with
          | Some
              (Cli_action.Sync
                 (Sync.Sync_download
                    {
                      repo;
                      graph;
                      progress;
                      progress_explicit;
                      e2ee_password;
                      _;
                    })) -> (
              assert_equal ~name:"sync download repo action" "logseq_db_alpha"
                (repo_string repo);
              assert_equal ~name:"sync download graph action" "alpha"
                (graph_string graph);
              if progress then failf "expected progress disabled";
              if progress_explicit then failf "expected progress to be implicit";
              match e2ee_password with
              | None -> ()
              | Some _ -> failf "expected no download e2ee password")
          | _ -> failf "expected typed sync download action"));

  check "Cli.run starts sync download worker with empty db mode" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let cwd = fresh_root "logseq-cli-sync-download-worker-cwd-" in
      let root = fresh_root "logseq-cli-sync-download-worker-root-" in
      let config_path = Filename.concat root "cli.edn" in
      let auth_path = Filename.concat root "auth.json" in
      let static_dir = Filename.concat cwd "static" in
      let script_path = Filename.concat static_dir "db-worker-node.js" in
      let argv_log = Filename.concat root "worker-argv.log" in
      ensure_test_dir cwd;
      ensure_test_dir root;
      ensure_test_dir static_dir;
      write_text_file config_path ("{:auth-path \"" ^ auth_path ^ "\"}");
      write_text_file script_path
        {|
const fs = require("fs");
const http = require("http");
const path = require("path");

const opts = {};
for (let i = 2; i < process.argv.length; i += 1) {
  const flag = process.argv[i];
  if (flag === "--repo") opts.repo = process.argv[++i];
  else if (flag === "--root-dir") opts.rootDir = process.argv[++i];
  else if (flag === "--owner-source") opts.ownerSource = process.argv[++i];
}

if (!opts.repo || !opts.rootDir) process.exit(2);

const graphDir = path.join(opts.rootDir, "graphs", String(opts.repo).replace(/^(logseq_db_)+/, ""));
const lockPath = path.join(graphDir, "db-worker.lock");
const serverListPath = path.join(opts.rootDir, "server-list");
const argvLog = path.join(opts.rootDir, "worker-argv.log");
fs.mkdirSync(graphDir, { recursive: true });
fs.appendFileSync(argvLog, JSON.stringify(process.argv.slice(2)) + "\n");

function resultFor(body) {
  if (body.includes("thread-api/set-db-sync-config")) return "true";
  if (body.includes("thread-api/db-sync-list-remote-graphs")) {
    return `[[\"^ \",\"~:graph-name\",\"alpha\",\"~:graph-id\",\"~u11111111-1111-1111-1111-111111111111\",\"~:graph-e2ee?\",false]]`;
  }
  if (body.includes("thread-api/q")) return "0";
  if (body.includes("thread-api/db-sync-download-graph-by-id")) return "true";
  return "true";
}

function removeServerListEntry(port) {
  if (!fs.existsSync(serverListPath)) return;
  const line = `${process.pid} ${port}`;
  const kept = fs.readFileSync(serverListPath, "utf8")
    .split(/\n/)
    .filter((entry) => entry.trim() && entry.trim() !== line);
  fs.writeFileSync(serverListPath, kept.length ? `${kept.join("\n")}\n` : "");
}

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/healthz") {
    const port = server.address().port;
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      repo: opts.repo,
      status: "ready",
      host: "127.0.0.1",
      port,
      pid: process.pid,
      "owner-source": opts.ownerSource || "cli",
      "root-dir": opts.rootDir,
      revision: "test-revision"
    }));
    return;
  }

  if (req.method === "POST" && req.url === "/v1/shutdown") {
    const port = server.address().port;
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end("{}");
    try { fs.rmSync(lockPath, { force: true }); } catch (_) {}
    removeServerListEntry(port);
    server.close(() => process.exit(0));
    return;
  }

  if (req.method === "POST" && req.url === "/v1/invoke") {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ resultTransit: resultFor(body) }));
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(0, "127.0.0.1", () => {
  const port = server.address().port;
  fs.writeFileSync(lockPath, JSON.stringify({
    pid: process.pid,
    host: "127.0.0.1",
    port,
    repo: opts.repo,
    "owner-source": opts.ownerSource || "cli"
  }));
  fs.appendFileSync(serverListPath, `${process.pid} ${port}\n`);
});

setInterval(() => {}, 1000);
|};
      let output =
        run_blocking
          (Cli.run app
             (cli_input ~cwd
                [
                  "--config";
                  config_path;
                  "--root-dir";
                  root;
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "sync";
                  "download";
                ]))
      in
      assert_int ~name:"sync download worker mode exit" 0 output.exit_code;
      let stop_output =
        run_blocking
          (Cli.run app
             (cli_input ~cwd
                [
                  "--root-dir";
                  root;
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "server";
                  "stop";
                ]))
      in
      assert_int ~name:"sync download worker stop exit" 0 stop_output.exit_code;
      let argv_log = read_text_file argv_log in
      assert_contains ~name:"sync download worker repo" "logseq_db_alpha"
        argv_log;
      assert_contains ~name:"sync download worker create empty db"
        "--create-empty-db" argv_log);

  check "Cli.run rejects sync download when local graph already exists"
    (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-sync-download-existing-" in
      ensure_test_dir root;
      ensure_test_dir (Filename.concat root "graphs");
      ensure_test_dir (Filename.concat root "graphs/alpha");
      let output =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--root-dir";
                  root;
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "sync";
                  "download";
                ]))
      in
      assert_int ~name:"sync download existing graph exit" 1 output.exit_code;
      assert_equal ~name:"sync download existing graph json"
        {|{"status":"error","error":{"code":"graph-exists","message":"graph already exists: alpha"}}|}
        (String.trim (cli_stdout output)));

  check "Cli.run sends auth and verifies e2ee password before sync download"
    (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-sync-download-e2ee-auth-" in
      let config_path = Filename.concat root "cli.edn" in
      let auth_path = Filename.concat root "auth.json" in
      let graph_id = "11111111-1111-1111-1111-111111111111" in
      ensure_test_dir root;
      write_text_file config_path ("{:auth-path \"" ^ auth_path ^ "\"}");
      write_text_file auth_path
        {|{"provider":"cognito","id-token":"id-token","access-token":"access-token","refresh-token":"refresh-token","expires-at":4102444800000,"updated-at":1700000000000}|};
      with_http_server_sequence
        [
          (fun request ->
            assert_contains ~name:"sync download e2ee auth global method"
              {|"method":"thread-api/sync-app-state"|} request.body;
            assert_contains ~name:"sync download e2ee auth global id token"
              {|auth/id-token|} request.body;
            assert_contains ~name:"sync download e2ee auth global refresh token"
              {|auth/refresh-token|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_contains ~name:"sync download e2ee global config method"
              {|"method":"thread-api/set-db-sync-config"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_contains ~name:"sync download e2ee remote graphs method"
              {|"method":"thread-api/db-sync-list-remote-graphs"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[\"^ \",\"~:graph-name\",\"alpha\",\"~:graph-id\",\"~u11111111-1111-1111-1111-111111111111\",\"~:graph-e2ee?\",true]]"}|}
            ));
          (fun request ->
            assert_contains ~name:"sync download e2ee auth local method"
              {|"method":"thread-api/sync-app-state"|} request.body;
            assert_contains ~name:"sync download e2ee auth local id token"
              {|auth/id-token|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_contains ~name:"sync download e2ee local config method"
              {|"method":"thread-api/set-db-sync-config"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_contains ~name:"sync download e2ee verify method"
              {|"method":"thread-api/verify-and-save-e2ee-password"|}
              request.body;
            assert_contains ~name:"sync download e2ee refresh token"
              {|refresh-token|} request.body;
            assert_contains ~name:"sync download e2ee password" {|secret-pw|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_contains ~name:"sync download e2ee empty db method"
              {|"method":"thread-api/q"|} request.body;
            assert_contains
              ~name:"sync download e2ee empty db queries block names"
              {|block/name|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"0"}|} ));
          (fun request ->
            assert_contains ~name:"sync download e2ee download method"
              {|"method":"thread-api/db-sync-download-graph-by-id"|}
              request.body;
            assert_contains ~name:"sync download e2ee graph id" graph_id
              request.body;
            assert_contains ~name:"sync download e2ee true flag" {|true|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"{\"~:graph-id\":\"remote-graph-id\",\"~:remote-tx\":22}"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--config";
                      config_path;
                      "--root-dir";
                      root;
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "sync";
                      "download";
                      "--e2ee-password";
                      "secret-pw";
                    ]))
          in
          assert_int ~name:"sync download e2ee exit" 0 output.exit_code;
          assert_contains ~name:"sync download e2ee json graph id"
            {|"graph-id":"remote-graph-id"|} (cli_stdout output)));

  check "Cli.run uses long timeout for sync download invoke" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-sync-download-timeout-" in
      let graph_id = "11111111-1111-1111-1111-111111111111" in
      with_http_server_sequence
        [
          (fun request ->
            assert_contains ~name:"sync download timeout config method"
              {|"method":"thread-api/set-db-sync-config"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_contains ~name:"sync download timeout remote graphs method"
              {|"method":"thread-api/db-sync-list-remote-graphs"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[\"^ \",\"~:graph-name\",\"alpha\",\"~:graph-id\",\"~u11111111-1111-1111-1111-111111111111\",\"~:graph-e2ee?\",false]]"}|}
            ));
          (fun request ->
            assert_contains ~name:"sync download timeout local config method"
              {|"method":"thread-api/set-db-sync-config"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_contains ~name:"sync download timeout empty db method"
              {|"method":"thread-api/q"|} request.body;
            assert_contains
              ~name:"sync download timeout empty db queries block names"
              {|block/name|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"0"}|} ));
          (fun request ->
            assert_contains ~name:"sync download timeout invoke method"
              {|"method":"thread-api/db-sync-download-graph-by-id"|}
              request.body;
            assert_contains ~name:"sync download timeout graph id" graph_id
              request.body;
            sleep_ms 100L;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--timeout-ms";
                      "50";
                      "--root-dir";
                      root;
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "sync";
                      "download";
                    ]))
          in
          if output.exit_code <> 0 then
            failf "sync download timeout exit\nstdout: %S" (cli_stdout output);
          assert_equal ~name:"sync download timeout json"
            {|{"status":"ok","data":{"result":true}}|}
            (String.trim (cli_stdout output))));

  check "Cli.run rejects sync download when remote graph is missing" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-sync-download-missing-" in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"sync download missing config line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"sync download missing config method"
              {|"method":"thread-api/set-db-sync-config"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_equal ~name:"sync download missing remote graphs line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"sync download missing remote graphs method"
              {|"method":"thread-api/db-sync-list-remote-graphs"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[]"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--root-dir";
                      root;
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "sync";
                      "download";
                    ]))
          in
          assert_int ~name:"sync download missing exit" 1 output.exit_code;
          assert_equal ~name:"sync download missing json"
            {|{"status":"error","error":{"code":"remote-graph-not-found","message":"remote graph not found: alpha"}}|}
            (String.trim (cli_stdout output))));

  check "Cli.run streams sync download progress events" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-sync-download-progress-" in
      let graph_id = "11111111-1111-1111-1111-111111111111" in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"sync download progress global config line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"sync download progress global config method"
              {|"method":"thread-api/set-db-sync-config"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_equal ~name:"sync download progress remote graphs line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"sync download progress remote graphs method"
              {|"method":"thread-api/db-sync-list-remote-graphs"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[\"^ \",\"~:graph-name\",\"alpha\",\"~:graph-id\",\"~u11111111-1111-1111-1111-111111111111\",\"~:graph-e2ee?\",false]]"}|}
            ));
          (fun request ->
            assert_equal ~name:"sync download progress config line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"sync download progress config method"
              {|"method":"thread-api/set-db-sync-config"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_equal ~name:"sync download progress empty db line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"sync download progress empty db method"
              {|"method":"thread-api/q"|} request.body;
            assert_contains
              ~name:"sync download progress empty db queries block names"
              {|block/name|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"0"}|} ));
          (fun request ->
            assert_equal ~name:"sync download progress events line"
              "GET /v1/events HTTP/1.1" request.request_line;
            ( 200,
              [ ("Content-Type", "text/event-stream") ],
              "data: {\"payload\":\"[\\\"~:rtc-log\\\",[\\\"^ \
               \\\",\\\"~:type\\\",\\\"~:rtc.log/download\\\",\\\"~:graph-uuid\\\",\\\"~u11111111-1111-1111-1111-111111111111\\\",\\\"~:message\\\",\\\"downloaded \
               1 block\\\"]]\"}\n\n" ));
          (fun request ->
            assert_equal ~name:"sync download progress line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"sync download progress method"
              {|"method":"thread-api/db-sync-download-graph-by-id"|}
              request.body;
            assert_contains ~name:"sync download progress graph id" graph_id
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
        ]
        (fun base_url ->
          let output, progress_output =
            capture_stdout (fun () ->
                run_blocking
                  (Cli.run app
                     (cli_input
                        ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                        [
                          "--root-dir";
                          root;
                          "--graph";
                          "alpha";
                          "--output";
                          "json";
                          "sync";
                          "download";
                          "--progress";
                        ])))
          in
          assert_int ~name:"sync download progress exit" 0 output.exit_code;
          assert_contains ~name:"sync download progress stdout"
            "downloaded 1 block\n" progress_output;
          assert_equal ~name:"sync download progress json"
            {|{"status":"ok","data":{"result":true}}|}
            (String.trim (cli_stdout output))));

  check "Cli.run executes sync asset download by id through typed action"
    (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let asset_uuid = "22222222-2222-2222-2222-222222222222" in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"sync asset config line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"sync asset config method"
              {|"method":"thread-api/set-db-sync-config"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_equal ~name:"sync asset pull line" "POST /v1/invoke HTTP/1.1"
              request.request_line;
            assert_contains ~name:"sync asset pull method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"sync asset pull repo" {|logseq_db_alpha|}
              request.body;
            assert_contains ~name:"sync asset pull id" {|,7]|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",7,\"~:block/uuid\",\"~u22222222-2222-2222-2222-222222222222\",\"~:block/tags\",[[\"^ \",\"~:db/ident\",\"~:logseq.class/Asset\"]],\"~:logseq.property.asset/type\",\"png\",\"~:logseq.property.asset/checksum\",\"abc\",\"~:logseq.property.asset/remote-metadata\",[\"^ \",\"~:size\",1]]"}|}
            ));
          (fun request ->
            assert_equal ~name:"sync asset status line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"sync asset status method"
              {|"method":"thread-api/db-sync-status"|} request.body;
            assert_contains ~name:"sync asset status repo" {|logseq_db_alpha|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:ws-state\",\"~:open\",\"~:graph-id\",\"~u11111111-1111-1111-1111-111111111111\"]"}|}
            ));
          (fun request ->
            assert_equal ~name:"sync asset request line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"sync asset request method"
              {|"method":"thread-api/db-sync-request-asset-download"|}
              request.body;
            assert_contains ~name:"sync asset request repo" {|logseq_db_alpha|}
              request.body;
            assert_contains ~name:"sync asset request uuid" asset_uuid
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "sync";
                      "asset";
                      "download";
                      "--id";
                      "7";
                    ]))
          in
          assert_int ~name:"sync asset exit" 0 output.exit_code;
          let body = String.trim (cli_stdout output) in
          assert_contains ~name:"sync asset ok" {|"status":"ok"|} body;
          assert_contains ~name:"sync asset uuid json"
            {|"asset-uuid":"22222222-2222-2222-2222-222222222222"|} body;
          assert_contains ~name:"sync asset requested json"
            {|"download-requested?":true|} body;
          assert_contains ~name:"sync asset checksum json"
            {|"checksum-status":"missing"|} body;
          match output.lifecycle.action with
          | Some
              (Cli_action.Sync
                 (Sync.Sync_asset_download
                    { repo; graph; id = Some id; uuid = None })) ->
              assert_equal ~name:"sync asset repo action" "logseq_db_alpha"
                (repo_string repo);
              assert_equal ~name:"sync asset graph action" "alpha"
                (graph_string graph);
              assert_int64 ~name:"sync asset id action" 7L id
          | _ -> failf "expected typed sync asset download action"));

  check "Cli.run skips sync asset download when local checksum matches"
    (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-sync-asset-match-" in
      let asset_uuid = "22222222-2222-2222-2222-222222222222" in
      let graph_dir = Filename.concat root "graphs" in
      let repo_dir = Filename.concat graph_dir "alpha" in
      let assets_dir = Filename.concat repo_dir "assets" in
      let asset_path = Filename.concat assets_dir (asset_uuid ^ ".png") in
      ensure_test_dir root;
      ensure_test_dir graph_dir;
      ensure_test_dir repo_dir;
      ensure_test_dir assets_dir;
      write_text_file asset_path "asset";
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"sync asset match config line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"sync asset match config method"
              {|"method":"thread-api/set-db-sync-config"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_equal ~name:"sync asset match pull line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"sync asset match pull method"
              {|"method":"thread-api/pull"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",7,\"~:block/uuid\",\"~u22222222-2222-2222-2222-222222222222\",\"~:block/tags\",[[\"^ \",\"~:db/ident\",\"~:logseq.class/Asset\"]],\"~:logseq.property.asset/type\",\"png\",\"~:logseq.property.asset/checksum\",\"d59386e0ae435e292fbe0ebcdb954b75ed5fb3922091277cb19f798fc5d50718\",\"~:logseq.property.asset/remote-metadata\",[\"^ \",\"~:size\",1]]"}|}
            ));
          (fun request ->
            assert_equal ~name:"sync asset match status line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"sync asset match status method"
              {|"method":"thread-api/db-sync-status"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:ws-state\",\"~:open\",\"~:graph-id\",\"~u11111111-1111-1111-1111-111111111111\"]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--root-dir";
                      root;
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "sync";
                      "asset";
                      "download";
                      "--id";
                      "7";
                    ]))
          in
          assert_int ~name:"sync asset match exit" 0 output.exit_code;
          let body = String.trim (cli_stdout output) in
          assert_contains ~name:"sync asset match requested"
            {|"download-requested?":false|} body;
          assert_contains ~name:"sync asset match checksum"
            {|"checksum-status":"match"|} body;
          assert_contains ~name:"sync asset match skipped"
            {|"skipped-reason":"already-downloaded"|} body));

  check "Cli.run checks sync asset files under encoded graph dirs" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-sync-asset-encoded-dir-" in
      let asset_uuid = "22222222-2222-2222-2222-222222222222" in
      let graph_dir = Filename.concat root "graphs" in
      let repo_dir = Filename.concat graph_dir "foo~2Fbar" in
      let assets_dir = Filename.concat repo_dir "assets" in
      let asset_path = Filename.concat assets_dir (asset_uuid ^ ".png") in
      ensure_test_dir root;
      ensure_test_dir graph_dir;
      ensure_test_dir repo_dir;
      ensure_test_dir assets_dir;
      write_text_file asset_path "asset";
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"sync asset encoded dir config line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"sync asset encoded dir config method"
              {|"method":"thread-api/set-db-sync-config"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_equal ~name:"sync asset encoded dir pull line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"sync asset encoded dir pull method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"sync asset encoded dir repo"
              {|logseq_db_foo/bar|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",7,\"~:block/uuid\",\"~u22222222-2222-2222-2222-222222222222\",\"~:block/tags\",[[\"^ \",\"~:db/ident\",\"~:logseq.class/Asset\"]],\"~:logseq.property.asset/type\",\"png\",\"~:logseq.property.asset/checksum\",\"d59386e0ae435e292fbe0ebcdb954b75ed5fb3922091277cb19f798fc5d50718\",\"~:logseq.property.asset/remote-metadata\",[\"^ \",\"~:size\",1]]"}|}
            ));
          (fun request ->
            assert_equal ~name:"sync asset encoded dir status line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"sync asset encoded dir status method"
              {|"method":"thread-api/db-sync-status"|} request.body;
            assert_contains ~name:"sync asset encoded dir status repo"
              {|logseq_db_foo/bar|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:ws-state\",\"~:open\",\"~:graph-id\",\"~u11111111-1111-1111-1111-111111111111\"]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--root-dir";
                      root;
                      "--graph";
                      "foo/bar";
                      "--output";
                      "json";
                      "sync";
                      "asset";
                      "download";
                      "--id";
                      "7";
                    ]))
          in
          assert_int ~name:"sync asset encoded dir exit" 0 output.exit_code;
          let body = String.trim (cli_stdout output) in
          assert_contains ~name:"sync asset encoded dir requested"
            {|"download-requested?":false|} body;
          assert_contains ~name:"sync asset encoded dir checksum"
            {|"checksum-status":"match"|} body;
          assert_contains ~name:"sync asset encoded dir skipped"
            {|"skipped-reason":"already-downloaded"|} body));

  check "Cli.run re-requests sync asset download when local checksum mismatches"
    (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-sync-asset-mismatch-" in
      let asset_uuid = "22222222-2222-2222-2222-222222222222" in
      let graph_dir = Filename.concat root "graphs" in
      let repo_dir = Filename.concat graph_dir "alpha" in
      let assets_dir = Filename.concat repo_dir "assets" in
      let asset_path = Filename.concat assets_dir (asset_uuid ^ ".png") in
      ensure_test_dir root;
      ensure_test_dir graph_dir;
      ensure_test_dir repo_dir;
      ensure_test_dir assets_dir;
      write_text_file asset_path "old";
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"sync asset mismatch config line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"sync asset mismatch config method"
              {|"method":"thread-api/set-db-sync-config"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_equal ~name:"sync asset mismatch pull line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"sync asset mismatch pull method"
              {|"method":"thread-api/pull"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",7,\"~:block/uuid\",\"~u22222222-2222-2222-2222-222222222222\",\"~:block/tags\",[[\"^ \",\"~:db/ident\",\"~:logseq.class/Asset\"]],\"~:logseq.property.asset/type\",\"png\",\"~:logseq.property.asset/checksum\",\"d59386e0ae435e292fbe0ebcdb954b75ed5fb3922091277cb19f798fc5d50718\",\"~:logseq.property.asset/remote-metadata\",[\"^ \",\"~:size\",1]]"}|}
            ));
          (fun request ->
            assert_equal ~name:"sync asset mismatch status line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"sync asset mismatch status method"
              {|"method":"thread-api/db-sync-status"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:ws-state\",\"~:open\",\"~:graph-id\",\"~u11111111-1111-1111-1111-111111111111\"]"}|}
            ));
          (fun request ->
            assert_equal ~name:"sync asset mismatch request line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"sync asset mismatch request method"
              {|"method":"thread-api/db-sync-request-asset-download"|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--root-dir";
                      root;
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "sync";
                      "asset";
                      "download";
                      "--id";
                      "7";
                    ]))
          in
          assert_int ~name:"sync asset mismatch exit" 0 output.exit_code;
          let body = String.trim (cli_stdout output) in
          assert_contains ~name:"sync asset mismatch requested"
            {|"download-requested?":true|} body;
          assert_contains ~name:"sync asset mismatch checksum"
            {|"checksum-status":"mismatch"|} body;
          assert_contains ~name:"sync asset mismatch hint"
            {|Local asset checksum mismatched; requested re-download.|} body;
          if Sys.file_exists asset_path then
            failf "expected mismatched local asset file to be removed"));

  check "Cli.run rejects sync asset download without selector" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let output =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "sync";
                  "asset";
                  "download";
                ]))
      in
      assert_int ~name:"sync asset missing selector exit" 1 output.exit_code;
      assert_equal ~name:"sync asset missing selector json"
        {|{"status":"error","error":{"code":"invalid-options","message":"exactly one of --id or --uuid is required"}}|}
        (String.trim (cli_stdout output)));

  check "Cli.run rejects sync asset download invalid uuid" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let output =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "sync";
                  "asset";
                  "download";
                  "--uuid";
                  "not-a-uuid";
                ]))
      in
      assert_int ~name:"sync asset invalid uuid exit" 1 output.exit_code;
      assert_equal ~name:"sync asset invalid uuid json"
        {|{"status":"error","error":{"code":"invalid-options","message":"Option uuid must be a valid UUID string"}}|}
        (String.trim (cli_stdout output)));

  check "Cli.run executes search through typed action" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server
        (fun request ->
          assert_equal ~name:"search invoke line" "POST /v1/invoke HTTP/1.1"
            request.request_line;
          assert_contains ~name:"search invoke method"
            {|"method":"thread-api/q"|} request.body;
          assert_contains ~name:"search query find" {|\"~:find\"|} request.body;
          assert_contains ~name:"search query pull list" {|\"~#list\"|}
            request.body;
          assert_contains ~name:"search query symbol" {|\"~$?e\"|} request.body;
          assert_contains ~name:"search query content" {|home|} request.body;
          ( 200,
            [ ("Content-Type", "application/json") ],
            {|{"resultTransit":"[]"}|} ))
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "search";
                      "page";
                      "--content";
                      "home";
                    ]))
          in
          assert_int ~name:"search exit" 0 output.exit_code;
          assert_equal ~name:"search json"
            {|{"status":"ok","data":{"items":[]}}|}
            (String.trim (cli_stdout output));
          match output.lifecycle.action with
          | Some (Cli_action.Search action) ->
              assert_equal ~name:"search query" "home" action.Search.query;
              assert_equal ~name:"search graph" "alpha"
                (graph_string action.Search.graph)
          | _ -> failf "expected typed search action"));

  check "Cli.run normalizes search page results" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server
        (fun request ->
          assert_equal ~name:"search page normalize line"
            "POST /v1/invoke HTTP/1.1" request.request_line;
          assert_contains ~name:"search page normalize method"
            {|"method":"thread-api/q"|} request.body;
          assert_contains ~name:"search page normalize query" {|home|}
            request.body;
          ( 200,
            [ ("Content-Type", "application/json") ],
            {|{"resultTransit":"[{\"~:db/id\":3,\"~:block/title\":\"Zoo\",\"~:db/ident\":\"~:page/zoo\",\"~:logseq.property/deleted-at\":10,\"~:extra\":\"hidden\"},{\"~:db/id\":2,\"~:block/title\":\"alpha\",\"~:db/ident\":\"~:page/alpha\",\"~:extra\":\"hidden\"},{\"~:db/id\":1,\"~:block/title\":\"Alpha\",\"~:db/ident\":\"~:page/alpha-1\",\"~:extra\":\"hidden\"}]"}|}
          ))
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "search";
                      "page";
                      "--content";
                      "home";
                    ]))
          in
          assert_int ~name:"search page normalize exit" 0 output.exit_code;
          let body = String.trim (cli_stdout output) in
          assert_contains ~name:"search page normalize first id" {|"db/id":1|}
            body;
          assert_contains ~name:"search page normalize second id" {|"db/id":2|}
            body;
          assert_not_contains ~name:"search page normalize filters deleted"
            "Zoo" body;
          assert_not_contains ~name:"search page normalize drops deleted marker"
            "deleted-at" body;
          assert_not_contains ~name:"search page normalize selects known keys"
            "extra" body;
          let first =
            match find_substring ~needle:{|"db/id":1|} body with
            | Some index -> index
            | None -> failf "missing first sorted item"
          in
          let second =
            match find_substring ~needle:{|"db/id":2|} body with
            | Some index -> index
            | None -> failf "missing second sorted item"
          in
          if first > second then
            failf "expected search results to sort by title then id"));

  check "Cli.run normalizes uuid refs in search results" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let uuid = "11111111-1111-1111-1111-111111111111" in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"search uuid refs query line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"search uuid refs query method"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"search uuid refs query content" {|ref|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[{\"~:db/id\":3,\"~:block/title\":\"See [[11111111-1111-1111-1111-111111111111]]\"}]"}|}
            ));
          (fun request ->
            assert_equal ~name:"search uuid refs pull line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"search uuid refs pull method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"search uuid refs pull uuid" ("~u" ^ uuid)
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",1,\"~:block/uuid\",\"~u11111111-1111-1111-1111-111111111111\",\"~:block/title\",\"Home\"]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "search";
                      "block";
                      "--content";
                      "ref";
                    ]))
          in
          assert_int ~name:"search uuid refs exit" 0 output.exit_code;
          let body = String.trim (cli_stdout output) in
          assert_contains ~name:"search uuid refs replaces title" "See [[Home]]"
            body;
          assert_not_contains ~name:"search uuid refs hides raw uuid" uuid body));

  check "Cli.run filters search block results under recycled parents" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server
        (fun request ->
          assert_equal ~name:"search block recycled line"
            "POST /v1/invoke HTTP/1.1" request.request_line;
          assert_contains ~name:"search block recycled method"
            {|"method":"thread-api/q"|} request.body;
          assert_contains ~name:"search block recycled query" {|task|}
            request.body;
          ( 200,
            [ ("Content-Type", "application/json") ],
            {|{"resultTransit":"[{\"~:db/id\":9,\"~:block/title\":\"Task in trash\",\"~:block/parent\":{\"~:db/id\":4,\"~:logseq.property/deleted-at\":11}},{\"~:db/id\":5,\"~:block/title\":\"Active task\",\"~:block/parent\":{\"~:db/id\":1,\"~:block/title\":\"Home\"}}]"}|}
          ))
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "search";
                      "block";
                      "--content";
                      "task";
                    ]))
          in
          assert_int ~name:"search block recycled exit" 0 output.exit_code;
          let body = String.trim (cli_stdout output) in
          assert_contains ~name:"search block recycled keeps active"
            "Active task" body;
          assert_not_contains ~name:"search block recycled filters child"
            "Task in trash" body;
          assert_not_contains ~name:"search block recycled drops parent"
            "block/parent" body));

  check "Cli.run accepts search content alias" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_invoke_server (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "search";
                      "property";
                      "-c";
                      "owner";
                    ]))
          in
          assert_int ~name:"search alias exit" 0 output.exit_code;
          assert_equal ~name:"search alias json"
            {|{"status":"ok","data":{"items":[]}}|}
            (String.trim (cli_stdout output));
          match output.lifecycle.action with
          | Some (Cli_action.Search action) ->
              assert_equal ~name:"search alias query" "owner"
                action.Search.query;
              assert_equal ~name:"search alias graph" "alpha"
                (graph_string action.Search.graph)
          | _ -> failf "expected typed search action"));

  check "Cli.run rejects typed search without a graph" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-search-missing-graph-" in
      let output =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--root-dir";
                  root;
                  "--output";
                  "json";
                  "search";
                  "tag";
                  "--content";
                  "quote";
                ]))
      in
      assert_int ~name:"missing graph exit" 1 output.exit_code;
      assert_equal ~name:"missing graph json"
        {|{"status":"error","error":{"code":"missing-repo","message":"repo is required for search"}}|}
        (String.trim (cli_stdout output));
      match
        ( output.lifecycle.request,
          output.lifecycle.config,
          output.lifecycle.action )
      with
      | Some _, Some _, None -> ()
      | _ -> failf "expected typed search request/config without action");

  check "Cli.run rejects typed search with blank content" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let output =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "search";
                  "block";
                  "--content";
                  "   ";
                ]))
      in
      assert_int ~name:"blank content exit" 1 output.exit_code;
      assert_equal ~name:"blank content json"
        {|{"status":"error","error":{"code":"missing-query-text","message":"query text is required"}}|}
        (String.trim (cli_stdout output));
      match
        ( output.lifecycle.request,
          output.lifecycle.config,
          output.lifecycle.action )
      with
      | Some _, Some _, None -> ()
      | _ -> failf "expected typed search request/config without action");

  check "Cli.run executes list page through typed action" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_invoke_server (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "list";
                      "page";
                      "--limit";
                      "2";
                      "--sort";
                      "updated-at";
                      "--order";
                      "desc";
                    ]))
          in
          assert_int ~name:"list page exit" 0 output.exit_code;
          assert_equal ~name:"list page json"
            {|{"status":"ok","data":{"items":[]}}|}
            (String.trim (cli_stdout output));
          match output.lifecycle.action with
          | Some (Cli_action.List action) ->
              assert_equal ~name:"list page graph" "alpha"
                (graph_string action.List_command.graph);
              if action.List_command.kind <> List_command.Page then
                failf "expected page list action"
          | _ -> failf "expected typed list action"));

  check "Cli.run profile includes transport invoke spans" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_invoke_server (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--profile";
                      "--output";
                      "json";
                      "list";
                      "page";
                      "--limit";
                      "2";
                    ]))
          in
          assert_int ~name:"list page profile transport exit" 0 output.exit_code;
          let stderr = String.concat "\n" output.stderr in
          assert_contains ~name:"list page profile command"
            "command=list-page status=ok" stderr;
          assert_contains ~name:"list page profile transport"
            "transport.invoke:thread-api/cli-list-pages" stderr));

  check "Cli.run accepts equals-form options" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server
        (fun request ->
          assert_equal ~name:"equals options request line"
            "POST /v1/invoke HTTP/1.1" request.request_line;
          assert_contains ~name:"equals options repo" {|logseq_db_alpha|}
            request.body;
          assert_contains ~name:"equals options limit" {|\"~:limit\",2|}
            request.body;
          assert_contains ~name:"equals options sort"
            {|\"~:sort\",\"updated-at\"|} request.body;
          ( 200,
            [ ("Content-Type", "application/json") ],
            {|{"resultTransit":"[]"}|} ))
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph=alpha";
                      "--output=json";
                      "list";
                      "page";
                      "--limit=2";
                      "--sort=updated-at";
                    ]))
          in
          assert_int ~name:"equals options exit" 0 output.exit_code;
          assert_equal ~name:"equals options json"
            {|{"status":"ok","data":{"items":[]}}|}
            (String.trim (cli_stdout output));
          match output.lifecycle.action with
          | Some (Cli_action.List action) ->
              assert_equal ~name:"equals options graph" "alpha"
                (graph_string action.List_command.graph);
              assert_equal ~name:"equals options repo" "logseq_db_alpha"
                (repo_string action.repo)
          | _ -> failf "expected typed list action"));

  check "Cli.run rejects unknown typed command options" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let query_output =
        run_blocking
          (Cli.run app
             (cli_input [ "--output"; "json"; "query"; "list"; "--bogus" ]))
      in
      assert_int ~name:"unknown query option exit" 1 query_output.exit_code;
      assert_equal ~name:"unknown query option json"
        {|{"status":"error","error":{"code":"invalid-options","message":"Unknown option: :bogus"}}|}
        (String.trim (cli_stdout query_output));
      let list_output =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "list";
                  "page";
                  "--bogus=1";
                ]))
      in
      assert_int ~name:"unknown equals option exit" 1 list_output.exit_code;
      assert_equal ~name:"unknown equals option json"
        {|{"status":"error","error":{"code":"invalid-options","message":"Unknown option: :bogus"}}|}
        (String.trim (cli_stdout list_output)));

  check "Cli.run rejects invalid typed option values" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let invalid_limit =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "list";
                  "page";
                  "--limit";
                  "two";
                ]))
      in
      assert_int ~name:"invalid limit exit" 1 invalid_limit.exit_code;
      assert_equal ~name:"invalid limit json"
        {|{"status":"error","error":{"code":"invalid-options","message":"Invalid value for option :limit: two. Expected integer"}}|}
        (String.trim (cli_stdout invalid_limit));
      let invalid_order =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "list";
                  "page";
                  "--order";
                  "sideways";
                ]))
      in
      assert_int ~name:"invalid order exit" 1 invalid_order.exit_code;
      assert_equal ~name:"invalid order json"
        {|{"status":"error","error":{"code":"invalid-options","message":"Invalid value for option :order: sideways. Available values: asc, desc"}}|}
        (String.trim (cli_stdout invalid_order));
      let invalid_sort =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "list";
                  "page";
                  "--sort";
                  "bogus";
                ]))
      in
      assert_int ~name:"invalid sort exit" 1 invalid_sort.exit_code;
      assert_equal ~name:"invalid sort json"
        {|{"status":"error","error":{"code":"invalid-options","message":"Invalid value for option :sort: bogus. Available values: id, ident, title, uuid, created-at, updated-at"}}|}
        (String.trim (cli_stdout invalid_sort));
      let invalid_asset_sort =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "list";
                  "asset";
                  "--sort";
                  "uuid";
                ]))
      in
      assert_int ~name:"invalid asset sort exit" 1 invalid_asset_sort.exit_code;
      assert_equal ~name:"invalid asset sort json"
        {|{"status":"error","error":{"code":"invalid-options","message":"Invalid value for option :sort: uuid. Available values: id, title, asset-type, size, updated-at, created-at"}}|}
        (String.trim (cli_stdout invalid_asset_sort));
      let invalid_fields =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "list";
                  "page";
                  "--fields";
                  "title,bogus";
                ]))
      in
      assert_int ~name:"invalid fields exit" 1 invalid_fields.exit_code;
      assert_equal ~name:"invalid fields json"
        {|{"status":"error","error":{"code":"invalid-options","message":"Invalid value for option :fields: bogus. Available values: id, ident, title, uuid, created-at, updated-at"}}|}
        (String.trim (cli_stdout invalid_fields));
      let invalid_level =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "show";
                  "--page";
                  "home";
                  "--level";
                  "two";
                ]))
      in
      assert_int ~name:"invalid level exit" 1 invalid_level.exit_code;
      assert_equal ~name:"invalid level json"
        {|{"status":"error","error":{"code":"invalid-options","message":"Invalid value for option :level: two. Expected integer"}}|}
        (String.trim (cli_stdout invalid_level));
      let invalid_pos =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "upsert";
                  "block";
                  "--target-page";
                  "Home";
                  "--pos";
                  "sideways";
                  "--content";
                  "New block";
                ]))
      in
      assert_int ~name:"invalid pos exit" 1 invalid_pos.exit_code;
      assert_equal ~name:"invalid pos json"
        {|{"status":"error","error":{"code":"invalid-options","message":"Invalid value for option :pos: sideways. Available values: first-child, last-child, sibling"}}|}
        (String.trim (cli_stdout invalid_pos)));

  check "Cli.run rejects invalid global option values" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let invalid_output =
        run_blocking
          (Cli.run app (cli_input [ "--output"; "xml"; "query"; "list" ]))
      in
      assert_int ~name:"invalid output exit" 1 invalid_output.exit_code;
      assert_contains ~name:"invalid output message"
        "Invalid value for option :output: xml. Available values: human, json, \
         edn"
        (cli_stdout invalid_output);
      let invalid_timeout =
        try
          run_blocking
            (Cli.run app
               (cli_input
                  [
                    "--output"; "json"; "--timeout-ms"; "slow"; "query"; "list";
                  ]))
        with exn ->
          failf "invalid timeout raised unexpectedly: %s"
            (Printexc.to_string exn)
      in
      assert_int ~name:"invalid timeout exit" 1 invalid_timeout.exit_code;
      assert_equal ~name:"invalid timeout json"
        {|{"status":"error","error":{"code":"invalid-options","message":"Invalid value for option :timeout-ms: slow. Expected integer"}}|}
        (String.trim (cli_stdout invalid_timeout)));

  check "Cli.run auto-starts db-worker for list page on an existing graph"
    (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let cwd = fresh_root "logseq-cli-list-autostart-cwd-" in
      let root = fresh_root "logseq-cli-list-autostart-root-" in
      ensure_test_dir cwd;
      ensure_test_dir root;
      ensure_test_dir (Filename.concat root "graphs");
      ensure_test_dir (Filename.concat root "graphs/alpha");
      ignore (write_fake_db_worker_node cwd);
      let output =
        run_blocking
          (Cli.run app
             (cli_input ~cwd
                [
                  "--root-dir";
                  root;
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "list";
                  "page";
                ]))
      in
      assert_int ~name:"list page autostart exit" 0 output.exit_code;
      assert_equal ~name:"list page autostart json"
        {|{"status":"ok","data":{"items":[]}}|}
        (String.trim (cli_stdout output));
      let stop_output =
        run_blocking
          (Cli.run app
             (cli_input ~cwd
                [
                  "--root-dir";
                  root;
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "server";
                  "stop";
                ]))
      in
      assert_int ~name:"list page autostart stop exit" 0 stop_output.exit_code);

  check "Cli.run post-processes list page sort offset limit and fields"
    (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server
        (fun request ->
          assert_equal ~name:"list page postprocess line"
            "POST /v1/invoke HTTP/1.1" request.request_line;
          assert_contains ~name:"list page postprocess method"
            {|"method":"thread-api/cli-list-pages"|} request.body;
          ( 200,
            [ ("Content-Type", "application/json") ],
            {|{"resultTransit":"[{\"~:db/id\":1,\"~:block/title\":\"Oldest\",\"~:block/updated-at\":100},{\"~:db/id\":2,\"~:block/title\":\"Newest\",\"~:block/updated-at\":300},{\"~:db/id\":3,\"~:block/title\":\"Middle\",\"~:block/updated-at\":200}]"}|}
          ))
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "list";
                      "page";
                      "--sort";
                      "updated-at";
                      "--order";
                      "desc";
                      "--offset";
                      "1";
                      "--limit";
                      "1";
                      "--fields";
                      "title,id";
                    ]))
          in
          assert_int ~name:"list page postprocess exit" 0 output.exit_code;
          let body = String.trim (cli_stdout output) in
          assert_contains ~name:"list page postprocess selected title" "Middle"
            body;
          assert_contains ~name:"list page postprocess selected id"
            {|"db/id":3|} body;
          assert_not_contains ~name:"list page postprocess drops newest"
            "Newest" body;
          assert_not_contains ~name:"list page postprocess drops oldest"
            "Oldest" body;
          assert_not_contains ~name:"list page postprocess fields"
            "block/updated-at" body));

  check "Cli.run normalizes uuid refs in list page titles" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let uuid = "11111111-1111-1111-1111-111111111111" in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"list page uuid refs line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"list page uuid refs method"
              {|"method":"thread-api/cli-list-pages"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[{\"~:db/id\":1,\"~:block/title\":\"See [[11111111-1111-1111-1111-111111111111]]\",\"~:block/updated-at\":100}]"}|}
            ));
          (fun request ->
            assert_equal ~name:"list page uuid refs pull line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"list page uuid refs pull method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"list page uuid refs pull uuid" ("~u" ^ uuid)
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",9,\"~:block/uuid\",\"~u11111111-1111-1111-1111-111111111111\",\"~:block/title\",\"Home\"]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [ "--graph"; "alpha"; "--output"; "json"; "list"; "page" ]))
          in
          assert_int ~name:"list page uuid refs exit" 0 output.exit_code;
          let body = String.trim (cli_stdout output) in
          assert_contains ~name:"list page uuid refs replaces title"
            "See [[Home]]" body;
          assert_not_contains ~name:"list page uuid refs hides raw uuid" uuid
            body));

  check "Cli.run hides list tag extended fields by default" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server
        (fun request ->
          assert_equal ~name:"list tag default line" "POST /v1/invoke HTTP/1.1"
            request.request_line;
          assert_contains ~name:"list tag default method"
            {|"method":"thread-api/cli-list-tags"|} request.body;
          assert_not_contains ~name:"list tag default expand option"
            {|\"~:expand\",true|} request.body;
          ( 200,
            [ ("Content-Type", "application/json") ],
            {|{"resultTransit":"[{\"~:db/id\":1,\"~:block/title\":\"Project\",\"~:logseq.property.class/properties\":[\"~:logseq.property/owner\"],\"~:logseq.property.class/extends\":[\"~:logseq.class/Base\"],\"~:logseq.property/description\":\"Tag description\",\"~:block/updated-at\":100}]"}|}
          ))
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [ "--graph"; "alpha"; "--output"; "json"; "list"; "tag" ]))
          in
          assert_int ~name:"list tag default exit" 0 output.exit_code;
          let body = String.trim (cli_stdout output) in
          assert_contains ~name:"list tag default title" "Project" body;
          assert_not_contains ~name:"list tag default hides properties" "owner"
            body;
          assert_not_contains ~name:"list tag default hides extends" "Base" body;
          assert_not_contains ~name:"list tag default hides description"
            "Tag description" body));

  check "Cli.run expands list tag properties when requested" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server
        (fun request ->
          assert_equal ~name:"list tag properties line"
            "POST /v1/invoke HTTP/1.1" request.request_line;
          assert_contains ~name:"list tag properties method"
            {|"method":"thread-api/cli-list-tags"|} request.body;
          assert_contains ~name:"list tag properties flag"
            {|\"~:with-properties\",true|} request.body;
          assert_contains ~name:"list tag properties expand"
            {|\"~:expand\",true|} request.body;
          ( 200,
            [ ("Content-Type", "application/json") ],
            {|{"resultTransit":"[{\"~:db/id\":1,\"~:block/title\":\"Project\",\"~:logseq.property.class/properties\":[\"~:logseq.property/owner\"],\"~:logseq.property.class/extends\":[\"~:logseq.class/Base\"],\"~:logseq.property/description\":\"Tag description\",\"~:block/updated-at\":100}]"}|}
          ))
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "list";
                      "tag";
                      "--with-properties";
                      "--fields";
                      "title,properties,description";
                    ]))
          in
          assert_int ~name:"list tag properties exit" 0 output.exit_code;
          let body = String.trim (cli_stdout output) in
          assert_contains ~name:"list tag properties selected title" "Project"
            body;
          assert_contains ~name:"list tag properties selected property" "owner"
            body;
          assert_contains ~name:"list tag properties selected description"
            "Tag description" body;
          assert_not_contains ~name:"list tag properties hides extends" "Base"
            body));

  check "Cli.run hides list property extended fields by default" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server
        (fun request ->
          assert_equal ~name:"list property default line"
            "POST /v1/invoke HTTP/1.1" request.request_line;
          assert_contains ~name:"list property default method"
            {|"method":"thread-api/cli-list-properties"|} request.body;
          assert_not_contains ~name:"list property default expand option"
            {|\"~:expand\",true|} request.body;
          ( 200,
            [ ("Content-Type", "application/json") ],
            {|{"resultTransit":"[{\"~:db/id\":1,\"~:block/title\":\"Owner\",\"~:logseq.property/classes\":[\"~:logseq.class/Inbox\"],\"~:logseq.property/type\":\"~:default\",\"~:logseq.property/description\":\"Property description\",\"~:block/updated-at\":100}]"}|}
          ))
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph"; "alpha"; "--output"; "json"; "list"; "property";
                    ]))
          in
          assert_int ~name:"list property default exit" 0 output.exit_code;
          let body = String.trim (cli_stdout output) in
          assert_contains ~name:"list property default title" "Owner" body;
          assert_contains ~name:"list property default keeps type" "default"
            body;
          assert_not_contains ~name:"list property default hides classes"
            "Inbox" body;
          assert_not_contains ~name:"list property default hides description"
            "Property description" body));

  check "Cli.run expands list property classes when requested" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server
        (fun request ->
          assert_equal ~name:"list property classes line"
            "POST /v1/invoke HTTP/1.1" request.request_line;
          assert_contains ~name:"list property classes method"
            {|"method":"thread-api/cli-list-properties"|} request.body;
          assert_contains ~name:"list property classes flag"
            {|\"~:with-classes\",true|} request.body;
          assert_contains ~name:"list property classes expand"
            {|\"~:expand\",true|} request.body;
          ( 200,
            [ ("Content-Type", "application/json") ],
            {|{"resultTransit":"[{\"~:db/id\":1,\"~:block/title\":\"Owner\",\"~:logseq.property/classes\":[\"~:logseq.class/Inbox\"],\"~:logseq.property/type\":\"~:default\",\"~:logseq.property/description\":\"Property description\",\"~:block/updated-at\":100}]"}|}
          ))
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "list";
                      "property";
                      "--with-classes";
                      "--fields";
                      "title,classes,description";
                    ]))
          in
          assert_int ~name:"list property classes exit" 0 output.exit_code;
          let body = String.trim (cli_stdout output) in
          assert_contains ~name:"list property classes selected title" "Owner"
            body;
          assert_contains ~name:"list property classes selected class" "Inbox"
            body;
          assert_contains ~name:"list property classes selected description"
            "Property description" body;
          assert_not_contains
            ~name:"list property classes omitted type by fields"
            "logseq.property/type" body));

  check "Cli.run normalizes list task status and priority before worker request"
    (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"list task status q line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"list task status q method"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"list task status q repo" {|logseq_db_alpha|}
              request.body;
            assert_contains ~name:"list task status q closed values"
              {|block/closed-value-property|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"~:logseq.property/status.todo\",\"~:logseq.property/status.doing\"]"}|}
            ));
          (fun request ->
            assert_equal ~name:"list task invoke line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"list task invoke method"
              {|"method":"thread-api/cli-list-tasks"|} request.body;
            assert_contains ~name:"list task normalized status"
              {|\"~:status\",\"~:logseq.property/status.todo\"|} request.body;
            assert_contains ~name:"list task normalized priority"
              {|\"~:priority\",\"~:logseq.property/priority.high\"|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[]"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "list";
                      "task";
                      "--status";
                      "todo";
                      "--priority";
                      "high";
                    ]))
          in
          assert_int ~name:"list task normalized exit" 0 output.exit_code;
          assert_equal ~name:"list task normalized json"
            {|{"status":"ok","data":{"items":[]}}|}
            (String.trim (cli_stdout output))));

  check "Cli.run rejects list task unknown status" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"list task bad status q line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"list task bad status q method"
              {|"method":"thread-api/q"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"~:logseq.property/status.todo\"]"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "list";
                      "task";
                      "--status";
                      "blocked";
                    ]))
          in
          assert_int ~name:"list task bad status exit" 1 output.exit_code;
          assert_equal ~name:"list task bad status json"
            {|{"status":"error","error":{"code":"invalid-options","message":"Invalid value for option :status: blocked. Available values: todo"}}|}
            (String.trim (cli_stdout output))));

  check "Cli.run rejects invalid list task priority" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let output =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "list";
                  "task";
                  "--priority";
                  "soon";
                ]))
      in
      assert_int ~name:"list task invalid priority exit" 1 output.exit_code;
      assert_equal ~name:"list task invalid priority json"
        {|{"status":"error","error":{"code":"invalid-options","message":"Invalid value for option :priority: soon. Available values: low, medium, high, urgent"}}|}
        (String.trim (cli_stdout output)));

  check "Cli.run rejects typed list without a graph" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-list-missing-graph-" in
      let output =
        run_blocking
          (Cli.run app
             (cli_input
                [ "--root-dir"; root; "--output"; "json"; "list"; "tag" ]))
      in
      assert_int ~name:"list missing graph exit" 1 output.exit_code;
      assert_equal ~name:"list missing graph json"
        {|{"status":"error","error":{"code":"missing-repo","message":"repo is required for list"}}|}
        (String.trim (cli_stdout output));
      match
        ( output.lifecycle.request,
          output.lifecycle.config,
          output.lifecycle.action )
      with
      | Some _, Some _, None -> ()
      | _ -> failf "expected typed list request/config without action");

  check "Cli.run rejects conflicting list page journal options" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let output =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "list";
                  "page";
                  "--include-journal";
                  "--journal-only";
                ]))
      in
      assert_int ~name:"list page conflict exit" 1 output.exit_code;
      assert_equal ~name:"list page conflict json"
        {|{"status":"error","error":{"code":"invalid-options","message":"include-journal and journal-only are mutually exclusive"}}|}
        (String.trim (cli_stdout output)));

  check "Cli.run rejects list node without selectors" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let output =
        run_blocking
          (Cli.run app
             (cli_input
                [ "--graph"; "alpha"; "--output"; "json"; "list"; "node" ]))
      in
      assert_int ~name:"list node selector exit" 1 output.exit_code;
      assert_equal ~name:"list node selector json"
        {|{"status":"error","error":{"code":"invalid-options","message":"list node requires at least one of --tags or --properties"}}|}
        (String.trim (cli_stdout output)));

  check "Cli.run rejects list node empty selectors" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let empty_tags =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "list";
                  "node";
                  "--tags";
                  ",";
                ]))
      in
      assert_int ~name:"list node empty tags exit" 1 empty_tags.exit_code;
      assert_equal ~name:"list node empty tags json"
        {|{"status":"error","error":{"code":"invalid-options","message":"list node --tags must include at least one non-empty value"}}|}
        (String.trim (cli_stdout empty_tags));
      let empty_properties =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "list";
                  "node";
                  "--properties";
                  ",";
                ]))
      in
      assert_int ~name:"list node empty properties exit" 1
        empty_properties.exit_code;
      assert_equal ~name:"list node empty properties json"
        {|{"status":"error","error":{"code":"invalid-options","message":"list node --properties must include at least one non-empty value"}}|}
        (String.trim (cli_stdout empty_properties)));

  check "Cli.run executes list node with selector csv through typed action"
    (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_invoke_server (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "list";
                      "node";
                      "--tags";
                      "42, 43";
                    ]))
          in
          assert_int ~name:"list node exit" 0 output.exit_code;
          assert_equal ~name:"list node json"
            {|{"status":"ok","data":{"items":[]}}|}
            (String.trim (cli_stdout output));
          match output.lifecycle.action with
          | Some (Cli_action.List action) -> (
              if action.List_command.kind <> List_command.Node then
                failf "expected node list action";
              match Edn_util.get action.List_command.options ":tags" with
              | Some tags -> (
                  match Edn_util.as_vector tags with
                  | Some [ first; second ]
                    when Edn_util.as_string first = Some "42"
                         && Edn_util.as_string second = Some "43" ->
                      ()
                  | _ -> failf "expected normalized list node tags")
              | _ -> failf "expected normalized list node tags")
          | _ -> failf "expected typed list action"));

  check
    "Cli.run resolves list node tag and property selectors before worker \
     request" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"list node tag resolve line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"list node tag resolve method"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"list node tag resolve class"
              {|logseq.class/Tag|} request.body;
            assert_contains ~name:"list node tag resolve name" {|project|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[\"^ \",\"~:db/id\",42,\"~:block/title\",\"Project\",\"~:block/name\",\"project\",\"~:block/tags\",[[\"^ \",\"~:db/ident\",\"~:logseq.class/Tag\"]]]]"}|}
            ));
          (fun request ->
            assert_equal ~name:"list node property resolve line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"list node property resolve method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"list node property resolve ident"
              {|\"~:logseq.property/status\"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",77,\"~:db/ident\",\"~:logseq.property/status\",\"~:logseq.property/type\",\"~:default\",\"~:logseq.property/public?\",true]"}|}
            ));
          (fun request ->
            assert_equal ~name:"list node resolved invoke line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"list node resolved invoke method"
              {|"method":"thread-api/cli-list-nodes"|} request.body;
            assert_contains ~name:"list node resolved tag ids"
              {|\"~:tag-ids\",[42]|} request.body;
            assert_contains ~name:"list node resolved property idents"
              {|\"~:property-idents\",[\"~:logseq.property/status\"]|}
              request.body;
            assert_not_contains ~name:"list node resolved drops raw tags"
              {|\"~:tags\"|} request.body;
            assert_not_contains ~name:"list node resolved drops raw properties"
              {|\"~:properties\"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[]"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "list";
                      "node";
                      "--tags";
                      "project";
                      "--properties";
                      ":logseq.property/status";
                    ]))
          in
          assert_int ~name:"list node resolved exit" 0 output.exit_code;
          assert_equal ~name:"list node resolved json"
            {|{"status":"ok","data":{"items":[]}}|}
            (String.trim (cli_stdout output))));

  check "Cli.run resolves list node tag uuid selector before worker request"
    (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"list node tag uuid resolve line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"list node tag uuid resolve method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"list node tag uuid resolve lookup attr"
              {|\"~:block/uuid\"|} request.body;
            assert_contains ~name:"list node tag uuid resolve lookup value"
              {|~u33333333-3333-3333-3333-333333333333|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",42,\"~:block/title\",\"Project\",\"~:block/uuid\",\"~u33333333-3333-3333-3333-333333333333\",\"~:block/tags\",[[\"^ \",\"~:db/ident\",\"~:logseq.class/Tag\"]]]"}|}
            ));
          (fun request ->
            assert_equal ~name:"list node tag uuid invoke line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"list node tag uuid invoke method"
              {|"method":"thread-api/cli-list-nodes"|} request.body;
            assert_contains ~name:"list node tag uuid tag ids"
              {|\"~:tag-ids\",[42]|} request.body;
            assert_not_contains ~name:"list node tag uuid drops raw tags"
              {|\"~:tags\"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[]"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "list";
                      "node";
                      "--tags";
                      "33333333-3333-3333-3333-333333333333";
                    ]))
          in
          assert_int ~name:"list node tag uuid exit" 0 output.exit_code;
          assert_equal ~name:"list node tag uuid json"
            {|{"status":"ok","data":{"items":[]}}|}
            (String.trim (cli_stdout output))));

  check
    "Cli.run resolves list node property id and name selectors before worker \
     request" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"list node property id resolve line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"list node property id resolve method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"list node property id resolve lookup"
              {|,77]|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",77,\"~:db/ident\",\"~:logseq.property/status\",\"~:logseq.property/type\",\"~:default\",\"~:logseq.property/public?\",true]"}|}
            ));
          (fun request ->
            assert_equal ~name:"list node property name resolve line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"list node property name resolve method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"list node property name resolve ident"
              {|\"~:owner\"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",78,\"~:db/ident\",\"~:owner\",\"~:logseq.property/type\",\"~:default\",\"~:logseq.property/public?\",true]"}|}
            ));
          (fun request ->
            assert_equal ~name:"list node property selectors invoke line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"list node property selectors invoke method"
              {|"method":"thread-api/cli-list-nodes"|} request.body;
            assert_contains ~name:"list node property selectors idents"
              {|\"~:property-idents\",[\"~:logseq.property/status\",\"~:owner\"]|}
              request.body;
            assert_not_contains
              ~name:"list node property selectors drops raw properties"
              {|\"~:properties\"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[]"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "list";
                      "node";
                      "--properties";
                      "77, owner";
                    ]))
          in
          assert_int ~name:"list node property selectors exit" 0
            output.exit_code;
          assert_equal ~name:"list node property selectors json"
            {|{"status":"ok","data":{"items":[]}}|}
            (String.trim (cli_stdout output))));

  check "Cli.run normalizes uuid refs in list node page titles" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let uuid = "11111111-1111-1111-1111-111111111111" in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"list node page title invoke line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"list node page title invoke method"
              {|"method":"thread-api/cli-list-nodes"|} request.body;
            assert_contains ~name:"list node page title tag ids"
              {|\"~:tag-ids\",[42]|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[{\"~:db/id\":1,\"~:block/title\":\"Child\",\"~:block/page-title\":\"Page [[11111111-1111-1111-1111-111111111111]]\",\"~:block/updated-at\":100}]"}|}
            ));
          (fun request ->
            assert_equal ~name:"list node page title pull line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"list node page title pull method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"list node page title pull uuid" ("~u" ^ uuid)
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",9,\"~:block/uuid\",\"~u11111111-1111-1111-1111-111111111111\",\"~:block/title\",\"Home\"]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "list";
                      "node";
                      "--tags";
                      "42";
                      "--fields";
                      "title,page-title";
                    ]))
          in
          assert_int ~name:"list node page title exit" 0 output.exit_code;
          let body = String.trim (cli_stdout output) in
          assert_contains ~name:"list node page title replaces page title"
            "Page [[Home]]" body;
          assert_not_contains ~name:"list node page title hides raw uuid" uuid
            body));

  check "Cli.run resolves list asset tag before worker request" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"list asset tag pull line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"list asset tag pull method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"list asset tag pull ident"
              {|\"~:logseq.class/Asset\"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",77]"}|} ));
          (fun request ->
            assert_equal ~name:"list asset invoke line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"list asset invoke method"
              {|"method":"thread-api/cli-list-nodes"|} request.body;
            assert_contains ~name:"list asset tag ids" {|\"~:tag-ids\",[77]|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[{\"~:db/id\":1,\"~:block/title\":\"Old Asset\",\"~:logseq.property.asset/type\":\"pdf\",\"~:block/updated-at\":100},{\"~:db/id\":2,\"~:block/title\":\"Latest Asset\",\"~:logseq.property.asset/type\":\"png\",\"~:block/updated-at\":200}]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "list";
                      "asset";
                      "--sort";
                      "asset-type";
                      "--order";
                      "desc";
                      "--limit";
                      "1";
                      "--fields";
                      "title,asset-type";
                    ]))
          in
          assert_int ~name:"list asset exit" 0 output.exit_code;
          let body = String.trim (cli_stdout output) in
          assert_contains ~name:"list asset selected title" "Latest Asset" body;
          assert_contains ~name:"list asset selected type" "png" body;
          assert_not_contains ~name:"list asset drops older item" "Old Asset"
            body;
          assert_not_contains ~name:"list asset fields" "block/updated-at" body));

  check "Cli.run reports missing list asset tag" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"list asset missing tag pull line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"list asset missing tag pull method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"list asset missing tag pull ident"
              {|\"~:logseq.class/Asset\"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"null"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [ "--graph"; "alpha"; "--output"; "json"; "list"; "asset" ]))
          in
          assert_int ~name:"list asset missing tag exit" 1 output.exit_code;
          assert_equal ~name:"list asset missing tag json"
            {|{"status":"error","error":{"code":"asset-tag-not-found","message":"asset tag not found"}}|}
            (String.trim (cli_stdout output))));

  check "Cli.run executes query through typed action" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server
        (fun request ->
          assert_equal ~name:"query invoke line" "POST /v1/invoke HTTP/1.1"
            request.request_line;
          assert_contains ~name:"query invoke method"
            {|"method":"thread-api/q"|} request.body;
          assert_contains ~name:"query repo" {|logseq_db_alpha|} request.body;
          assert_contains ~name:"query find" {|\"~:find\"|} request.body;
          assert_contains ~name:"query symbol" {|\"~$?e\"|} request.body;
          assert_contains ~name:"query attr" {|\"~:block/name\"|} request.body;
          assert_contains ~name:"query input" {|home|} request.body;
          ( 200,
            [ ("Content-Type", "application/json") ],
            {|{"resultTransit":"[[\"^ \",\"~:db/id\",1,\"~:block/title\",\"Home\"]]"}|}
          ))
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "query";
                      "--query";
                      "[:find [(pull ?e [:db/id :block/title]) ...] :in $ \
                       ?name :where [?e :block/name ?name]]";
                      "--inputs";
                      "[\"home\"]";
                    ]))
          in
          assert_int ~name:"query exit" 0 output.exit_code;
          assert_equal ~name:"query json"
            {|{"status":"ok","data":{"result":[{"db/id":1,"block/title":"Home"}]}}|}
            (String.trim (cli_stdout output));
          match output.lifecycle.action with
          | Some (Cli_action.Query (Query.Run action)) -> (
              assert_equal ~name:"query graph" "alpha"
                (graph_string action.graph);
              match action.inputs with
              | [ input ] when Edn_util.as_string input = Some "home" -> ()
              | _ -> failf "expected parsed query inputs")
          | _ -> failf "expected typed query action"));

  check "Cli.run lists built-in queries through typed action" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let output =
        run_blocking
          (Cli.run app (cli_input [ "--output"; "json"; "query"; "list" ]))
      in
      assert_int ~name:"query list exit" 0 output.exit_code;
      assert_contains ~name:"query list status" {|"status":"ok"|}
        (cli_stdout output);
      assert_contains ~name:"query list data" {|"queries"|} (cli_stdout output);
      assert_contains ~name:"query list built-in" {|"source":"built-in"|}
        (cli_stdout output);
      assert_contains ~name:"query list recent" {|"name":"recent-updated"|}
        (cli_stdout output);
      assert_not_contains ~name:"query list hides internal now input"
        {|"name":"?now-ms"|} (cli_stdout output);
      match output.lifecycle.action with
      | Some (Cli_action.Query Query.List) -> ()
      | _ -> failf "expected typed query list action");

  check "Cli.run lists custom queries from cli config" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-custom-query-list-" in
      ensure_test_dir root;
      write_text_file
        (Filename.concat root "cli.edn")
        {|{:custom-queries
           {"my-query" {:doc "Custom doc"
                        :inputs [{:name "needle"}]
                        :query [:find [(pull ?e [:db/id :block/title]) ...]
                                :in $ ?needle
                                :where [?e :block/title ?needle]]}
            :quick [:find [?e ...] :where [?e :block/name]]}}|};
      let output =
        run_blocking
          (Cli.run app
             (cli_input
                [ "--root-dir"; root; "--output"; "json"; "query"; "list" ]))
      in
      assert_int ~name:"custom query list exit" 0 output.exit_code;
      let body = cli_stdout output in
      assert_contains ~name:"custom query list source" {|"source":"custom"|}
        body;
      assert_contains ~name:"custom query list named" {|"name":"my-query"|} body;
      assert_contains ~name:"custom query list doc" {|"doc":"Custom doc"|} body;
      assert_contains ~name:"custom query list input" {|"name":"needle"|} body;
      assert_contains ~name:"custom query list keyword key" {|"name":"quick"|}
        body;
      assert_contains ~name:"custom query list built-in kept"
        {|"name":"recent-updated"|} body);

  check "Cli.run executes custom query from cli config" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-custom-query-run-" in
      ensure_test_dir root;
      write_text_file
        (Filename.concat root "cli.edn")
        {|{:custom-queries
           {"my-query" {:doc "Custom doc"
                        :inputs [{:name "needle"}]
                        :query [:find [(pull ?e [:db/id :block/title]) ...]
                                :in $ ?needle
                                :where [?e :block/title ?needle]]}}}|};
      with_http_server
        (fun request ->
          assert_equal ~name:"custom query invoke line"
            "POST /v1/invoke HTTP/1.1" request.request_line;
          assert_contains ~name:"custom query invoke method"
            {|"method":"thread-api/q"|} request.body;
          assert_contains ~name:"custom query repo" {|logseq_db_alpha|}
            request.body;
          assert_contains ~name:"custom query attr" {|\"~:block/title\"|}
            request.body;
          assert_contains ~name:"custom query input" {|Home|} request.body;
          ( 200,
            [ ("Content-Type", "application/json") ],
            {|{"resultTransit":"[[\"^ \",\"~:db/id\",1,\"~:block/title\",\"Home\"]]"}|}
          ))
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--root-dir";
                      root;
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "query";
                      "--name";
                      "my-query";
                      "--inputs";
                      {|["Home"]|};
                    ]))
          in
          assert_int ~name:"custom query run exit" 0 output.exit_code;
          assert_equal ~name:"custom query run json"
            {|{"status":"ok","data":{"result":[{"db/id":1,"block/title":"Home"}]}}|}
            (String.trim (cli_stdout output));
          match output.lifecycle.action with
          | Some (Cli_action.Query (Query.Run action)) -> (
              assert_equal ~name:"custom query run graph" "alpha"
                (graph_string action.graph);
              assert_equal ~name:"custom query run name" "my-query"
                (Option.value action.name ~default:"");
              match action.inputs with
              | [ input ] when Edn_util.as_string input = Some "Home" -> ()
              | _ -> failf "expected custom query input")
          | _ -> failf "expected typed custom query action"));

  check "Cli.run appends db query DSL rules when query in ends with percent"
    (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-query-rules-" in
      ensure_test_dir root;
      write_text_file
        (Filename.concat root "cli.edn")
        {|{:custom-queries
           {"task" {:doc "Tasks by status"
                    :inputs [{:name "task statuses set"}]
                    :query [:find (pull ?b [*])
                            :in $ ?statuses %
                            :where
                            (task ?b ?statuses)]}}}|};
      with_http_server
        (fun request ->
          assert_equal ~name:"query rules invoke line"
            "POST /v1/invoke HTTP/1.1" request.request_line;
          assert_contains ~name:"query rules invoke method"
            {|"method":"thread-api/q"|} request.body;
          assert_contains ~name:"query rules custom rule call" {|\"~$task\"|}
            request.body;
          assert_contains ~name:"query rules dependency"
            {|\"~$ref-property-with-default\"|} request.body;
          assert_contains ~name:"query rules ref value"
            {|\"~$ref-property-value\"|} request.body;
          ( 200,
            [ ("Content-Type", "application/json") ],
            {|{"resultTransit":"[]"}|} ))
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--root-dir";
                      root;
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "query";
                      "--name";
                      "task";
                      "--inputs";
                      {|[#{"Todo"}]|};
                    ]))
          in
          assert_int ~name:"query rules exit" 0 output.exit_code;
          assert_equal ~name:"query rules json"
            {|{"status":"ok","data":{"result":[]}}|}
            (String.trim (cli_stdout output))));

  check "Cli.run sends task-search recent-days clauses" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server
        (fun request ->
          assert_equal ~name:"task-search invoke line"
            "POST /v1/invoke HTTP/1.1" request.request_line;
          assert_contains ~name:"task-search invoke method"
            {|"method":"thread-api/q"|} request.body;
          assert_contains ~name:"task-search status"
            {|\"~:logseq.property/status.todo\"|} request.body;
          assert_contains ~name:"task-search title input" {|daily|} request.body;
          assert_contains ~name:"task-search or join" {|\"~$or-join\"|}
            request.body;
          assert_contains ~name:"task-search recent days ms"
            {|\"~$?recent-days-ms\"|} request.body;
          ( 200,
            [ ("Content-Type", "application/json") ],
            {|{"resultTransit":"[]"}|} ))
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "query";
                      "--name";
                      "task-search";
                      "--inputs";
                      {|["todo" "daily" 7]|};
                    ]))
          in
          assert_int ~name:"task-search exit" 0 output.exit_code;
          assert_equal ~name:"task-search json"
            {|{"status":"ok","data":{"result":[]}}|}
            (String.trim (cli_stdout output))));

  check "Cli.run rejects recent-updated query with non-positive days" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let output =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "query";
                  "--name";
                  "recent-updated";
                  "--inputs";
                  "[0]";
                ]))
      in
      assert_int ~name:"query recent invalid exit" 1 output.exit_code;
      assert_equal ~name:"query recent invalid json"
        {|{"status":"error","error":{"code":"invalid-options","message":"recent-days must be a positive integer"}}|}
        (String.trim (cli_stdout output)));

  check "Cli.run rejects query without a graph" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-query-missing-graph-" in
      let output =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--root-dir";
                  root;
                  "--output";
                  "json";
                  "query";
                  "--query";
                  "[:find [?e ...] :where [?e :block/name]]";
                ]))
      in
      assert_int ~name:"query missing graph exit" 1 output.exit_code;
      assert_equal ~name:"query missing graph json"
        {|{"status":"error","error":{"code":"missing-repo","message":"repo is required for query"}}|}
        (String.trim (cli_stdout output)));

  check "Cli.run rejects show invalid uuid" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let output =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "show";
                  "--uuid";
                  "not-a-uuid";
                ]))
      in
      assert_int ~name:"show invalid uuid exit" 1 output.exit_code;
      assert_equal ~name:"show invalid uuid json"
        {|{"status":"error","error":{"code":"invalid-options","message":"Option uuid must be a valid UUID string"}}|}
        (String.trim (cli_stdout output)));

  check "Cli.run executes show page through typed action" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"show invoke line" "POST /v1/invoke HTTP/1.1"
              request.request_line;
            assert_contains ~name:"show invoke method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"show repo" {|logseq_db_alpha|} request.body;
            assert_contains ~name:"show selector id" {|\"~:db/id\"|}
              request.body;
            assert_contains ~name:"show page lookup" {|\"~:block/name\"|}
              request.body;
            assert_contains ~name:"show page name" {|home|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",1,\"~:block/title\",\"Home\",\"~:block/name\",\"home\"]"}|}
            ));
          (fun request ->
            assert_contains ~name:"show empty tree query method"
              {|"method":"thread-api/q"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[]"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "show";
                      "--page";
                      "home";
                      "--linked-references=false";
                    ]))
          in
          assert_int ~name:"show page exit" 0 output.exit_code;
          assert_equal ~name:"show page json"
            {|{"status":"ok","data":{"root":{"db/id":1,"block/title":"Home","block/name":"home"}}}|}
            (String.trim (cli_stdout output));
          match output.lifecycle.action with
          | Some (Cli_action.Show action) -> (
              assert_equal ~name:"show graph" "alpha"
                (graph_string action.Show.graph);
              assert_bool ~name:"show linked references disabled" false
                action.Show.linked_references;
              match action.target with
              | Show.By_page "home" -> ()
              | _ -> failf "expected show page target")
          | _ -> failf "expected typed show action"));

  check "Cli.run includes show linked references by default" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_contains ~name:"show linked pull method"
              {|"method":"thread-api/pull"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",1,\"~:block/title\",\"Home\",\"~:block/name\",\"home\"]"}|}
            ));
          (fun request ->
            assert_contains ~name:"show linked tree method"
              {|"method":"thread-api/q"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[]"}|} ));
          (fun request ->
            assert_contains ~name:"show linked refs method"
              {|"method":"thread-api/get-block-refs"|} request.body;
            assert_contains ~name:"show linked refs root id" {|,1]|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[\"^ \",\"~:db/id\",88]]"}|} ));
          (fun request ->
            assert_contains ~name:"show linked ref pull method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"show linked ref id" {|,88]|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",88,\"~:block/title\",\"Mention Home\",\"~:block/page\",[\"^ \",\"~:db/id\",9,\"~:block/name\",\"journal\",\"~:block/title\",\"Journal\"]]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "show";
                      "--page";
                      "home";
                    ]))
          in
          assert_int ~name:"show linked refs exit" 0 output.exit_code;
          let body = String.trim (cli_stdout output) in
          assert_contains ~name:"show linked refs key"
            {|"linked-references":{"count":1,"blocks":[|} body;
          assert_contains ~name:"show linked refs title"
            {|"block/title":"Mention Home"|} body;
          assert_contains ~name:"show linked refs page"
            {|"block/name":"journal"|} body;
          match output.lifecycle.action with
          | Some (Cli_action.Show action) ->
              assert_bool ~name:"show linked refs action default" true
                action.Show.linked_references
          | _ -> failf "expected typed show action"));

  check "Cli.run filters property value blocks from show linked references"
    (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun _request ->
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",1,\"~:block/title\",\"Home\",\"~:block/name\",\"home\"]"}|}
            ));
          (fun _request ->
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[]"}|} ));
          (fun request ->
            assert_contains ~name:"show linked filter refs method"
              {|"method":"thread-api/get-block-refs"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[\"^ \",\"~:db/id\",88],[\"^ \",\"~:db/id\",89]]"}|}
            ));
          (fun request ->
            assert_contains ~name:"show linked filter normal id" {|,88]|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",88,\"~:block/title\",\"Mention Home\"]"}|}
            ));
          (fun request ->
            assert_contains ~name:"show linked filter property value id"
              {|,89]|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",89,\"~:block/title\",\"Property Value\",\"~:logseq.property/created-from-property\",77]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "show";
                      "--page";
                      "home";
                    ]))
          in
          assert_int ~name:"show linked filter exit" 0 output.exit_code;
          let body = String.trim (cli_stdout output) in
          assert_contains ~name:"show linked filter keeps count"
            {|"linked-references":{"count":1,"blocks":[|} body;
          assert_contains ~name:"show linked filter keeps normal"
            {|"block/title":"Mention Home"|} body;
          assert_not_contains ~name:"show linked filter removes property value"
            "Property Value" body));

  check "Cli.run resolves linked blocks in show linked references" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun _request ->
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",1,\"~:block/title\",\"Home\",\"~:block/name\",\"home\"]"}|}
            ));
          (fun _request ->
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[]"}|} ));
          (fun request ->
            assert_contains ~name:"show linked ref link refs method"
              {|"method":"thread-api/get-block-refs"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[\"^ \",\"~:db/id\",88]]"}|} ));
          (fun request ->
            assert_contains ~name:"show linked ref link pull ref" {|,88]|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",88,\"~:block/title\",\"Alias Ref\",\"~:block/link\",[\"^ \",\"~:db/id\",9]]"}|}
            ));
          (fun request ->
            assert_contains ~name:"show linked ref link target pull" {|,9]|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",9,\"~:block/title\",\"Linked Ref Target\"]"}|}
            ));
          (fun request ->
            assert_contains ~name:"show linked ref link target tree"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"show linked ref link target tree id" {|,9]|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[]"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "show";
                      "--page";
                      "home";
                    ]))
          in
          assert_int ~name:"show linked ref link exit" 0 output.exit_code;
          let body = String.trim (cli_stdout output) in
          assert_contains ~name:"show linked ref link target title"
            {|"block/title":"Linked Ref Target"|} body;
          assert_not_contains ~name:"show linked ref link removes alias"
            {|"block/title":"Alias Ref"|} body;
          assert_not_contains ~name:"show linked ref link removes link key"
            {|"block/link"|} body));

  check "Cli.run renders show page hierarchy through typed action" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_contains ~name:"show hierarchy pull method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"show hierarchy page lookup"
              {|\"~:block/name\"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",1,\"~:block/title\",\"Parent\",\"~:block/name\",\"parent\",\"~:block/tags\",[[\"^ \",\"~:db/ident\",\"~:logseq.class/Page\"]]]"}|}
            ));
          (fun request ->
            assert_contains ~name:"show hierarchy query method"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"show hierarchy parent input" {|~$?parent-id|}
              request.body;
            assert_contains ~name:"show hierarchy parent attr"
              {|\"~:block/parent\"|} request.body;
            assert_not_contains ~name:"show hierarchy avoids page block query"
              {|~$?page-id|} request.body;
            assert_contains ~name:"show hierarchy root id" {|,1]|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[[\"^ \",\"~:db/id\",2,\"~:block/title\",\"Child Page\",\"~:block/name\",\"child\",\"~:block/order\",\"a\",\"~:block/parent\",[\"^ \",\"~:db/id\",1],\"~:block/tags\",[[\"^ \",\"~:db/ident\",\"~:logseq.class/Page\"]]]]]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "show";
                      "--page";
                      "parent";
                      "--page-hierarchy";
                      "true";
                      "--level";
                      "2";
                      "--linked-references=false";
                    ]))
          in
          assert_int ~name:"show hierarchy exit" 0 output.exit_code;
          let body = String.trim (cli_stdout output) in
          assert_contains ~name:"show hierarchy root" {|"block/title":"Parent"|}
            body;
          assert_contains ~name:"show hierarchy child"
            {|"block/title":"Child Page"|} body;
          match output.lifecycle.action with
          | Some (Cli_action.Show action) ->
              assert_bool ~name:"show hierarchy action" true
                action.Show.page_hierarchy
          | _ -> failf "expected typed show action"));

  check "Cli.run filters non-display pages from show page hierarchy" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_contains ~name:"show hierarchy display filter pull method"
              {|"method":"thread-api/pull"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",1,\"~:block/title\",\"Parent\",\"~:block/name\",\"parent\",\"~:block/tags\",[[\"^ \",\"~:db/ident\",\"~:logseq.class/Page\"]]]"}|}
            ));
          (fun request ->
            assert_contains ~name:"show hierarchy display filter query"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"show hierarchy display filter tags selector"
              {|\"~:block/tags\"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[[\"^ \",\"~:db/id\",2,\"~:block/title\",\"Child Page\",\"~:block/name\",\"child\",\"~:block/order\",\"a\",\"~:block/parent\",[\"^ \",\"~:db/id\",1],\"~:block/tags\",[[\"^ \",\"~:db/ident\",\"~:logseq.class/Page\"]]]],[[\"^ \",\"~:db/id\",3,\"~:block/title\",\"Class Child\",\"~:block/name\",\"class-child\",\"~:block/order\",\"b\",\"~:block/parent\",[\"^ \",\"~:db/id\",1],\"~:block/tags\",[[\"^ \",\"~:db/ident\",\"~:logseq.class/Tag\"]]]],[[\"^ \",\"~:db/id\",4,\"~:block/title\",\"Property Child\",\"~:block/name\",\"property-child\",\"~:block/order\",\"c\",\"~:block/parent\",[\"^ \",\"~:db/id\",1],\"~:block/tags\",[[\"^ \",\"~:db/ident\",\"~:logseq.class/Property\"]]]],[[\"^ \",\"~:db/id\",5,\"~:block/title\",\"Ordinary Block\",\"~:block/order\",\"d\",\"~:block/parent\",[\"^ \",\"~:db/id\",1]]]]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "show";
                      "--page";
                      "parent";
                      "--page-hierarchy";
                      "true";
                      "--level";
                      "2";
                      "--linked-references=false";
                    ]))
          in
          assert_int ~name:"show hierarchy display filter exit" 0
            output.exit_code;
          let body = String.trim (cli_stdout output) in
          assert_contains ~name:"show hierarchy display filter keeps page"
            {|"block/title":"Child Page"|} body;
          assert_not_contains
            ~name:"show hierarchy display filter removes class" "Class Child"
            body;
          assert_not_contains
            ~name:"show hierarchy display filter removes property"
            "Property Child" body;
          assert_not_contains
            ~name:"show hierarchy display filter removes block" "Ordinary Block"
            body));

  check
    "Cli.run falls back to normal show tree for class page hierarchy targets"
    (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_contains ~name:"show class hierarchy target pull method"
              {|"method":"thread-api/pull"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",1,\"~:block/title\",\"Project\",\"~:block/name\",\"project\",\"~:block/tags\",[[\"^ \",\"~:db/ident\",\"~:logseq.class/Tag\"]]]"}|}
            ));
          (fun request ->
            assert_contains ~name:"show class hierarchy target uses page blocks"
              {|~$?page-id|} request.body;
            assert_not_contains
              ~name:"show class hierarchy target avoids parent hierarchy"
              {|~$?parent-id|} request.body;
            assert_contains ~name:"show class hierarchy target page id" {|,1]|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[[\"^ \",\"~:db/id\",2,\"~:block/title\",\"Class Block\",\"~:block/order\",\"a\",\"~:block/parent\",[\"^ \",\"~:db/id\",1]]]]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "show";
                      "--page";
                      "project";
                      "--page-hierarchy";
                      "true";
                      "--level";
                      "2";
                      "--linked-references=false";
                    ]))
          in
          assert_int ~name:"show class hierarchy target exit" 0 output.exit_code;
          let body = String.trim (cli_stdout output) in
          assert_contains ~name:"show class hierarchy target root"
            {|"block/title":"Project"|} body;
          assert_contains ~name:"show class hierarchy target child"
            {|"block/title":"Class Block"|} body));

  check "Cli.run reports show page hierarchy parent cycles" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_contains ~name:"show hierarchy cycle pull method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"show hierarchy cycle page lookup"
              {|\"~:block/name\"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",1,\"~:block/title\",\"Parent\",\"~:block/name\",\"parent\",\"~:block/tags\",[[\"^ \",\"~:db/ident\",\"~:logseq.class/Page\"]]]"}|}
            ));
          (fun request ->
            assert_contains ~name:"show hierarchy cycle root query"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"show hierarchy cycle root id" {|,1]|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[[\"^ \",\"~:db/id\",2,\"~:block/title\",\"Child Page\",\"~:block/name\",\"child\",\"~:block/order\",\"a\",\"~:block/parent\",[\"^ \",\"~:db/id\",1],\"~:block/tags\",[[\"^ \",\"~:db/ident\",\"~:logseq.class/Page\"]]]]]"}|}
            ));
          (fun request ->
            assert_contains ~name:"show hierarchy cycle child query"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"show hierarchy cycle child id" {|,2]|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[[\"^ \",\"~:db/id\",1,\"~:block/title\",\"Parent\",\"~:block/name\",\"parent\",\"~:block/order\",\"b\",\"~:block/parent\",[\"^ \",\"~:db/id\",2],\"~:block/tags\",[[\"^ \",\"~:db/ident\",\"~:logseq.class/Page\"]]]]]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "show";
                      "--page";
                      "parent";
                      "--page-hierarchy";
                      "true";
                      "--level";
                      "3";
                      "--linked-references=false";
                    ]))
          in
          assert_int ~name:"show hierarchy cycle exit" 1 output.exit_code;
          assert_equal ~name:"show hierarchy cycle json"
            {|{"status":"error","error":{"code":"page-hierarchy-parent-cycle","message":"page hierarchy parent cycle detected"}}|}
            (String.trim (cli_stdout output))));

  check "Cli.run executes show page with children tree" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"show tree pull line" "POST /v1/invoke HTTP/1.1"
              request.request_line;
            assert_contains ~name:"show tree pull method"
              {|"method":"thread-api/pull"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",1,\"~:block/title\",\"Home\",\"~:block/name\",\"home\"]"}|}
            ));
          (fun request ->
            assert_equal ~name:"show tree query line" "POST /v1/invoke HTTP/1.1"
              request.request_line;
            assert_contains ~name:"show tree query method"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"show tree query page attr"
              {|\"~:block/page\"|} request.body;
            assert_contains
              ~name:"show tree query created-from-property selector"
              {|\"~:block/title\",\"~:logseq.property/created-from-property\"|}
              request.body;
            assert_contains ~name:"show tree query root id" {|,1]|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[[\"^ \",\"~:db/id\",2,\"~:block/title\",\"Child\",\"~:block/order\",\"a\",\"~:block/parent\",[\"^ \",\"~:db/id\",1]]],[[\"^ \",\"~:db/id\",3,\"~:block/title\",\"Nested\",\"~:block/order\",\"b\",\"~:block/parent\",[\"^ \",\"~:db/id\",2]]]]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "show";
                      "--page";
                      "home";
                      "--linked-references=false";
                    ]))
          in
          assert_int ~name:"show tree exit" 0 output.exit_code;
          let body = String.trim (cli_stdout output) in
          assert_contains ~name:"show tree children key" {|"block/children"|}
            body;
          assert_contains ~name:"show tree child title"
            {|"block/title":"Child"|} body;
          assert_contains ~name:"show tree nested title"
            {|"block/title":"Nested"|} body));

  check "Cli.run filters property value blocks from show page tree" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun _request ->
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",1,\"~:block/title\",\"Home\",\"~:block/name\",\"home\"]"}|}
            ));
          (fun _request ->
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[[\"^ \",\"~:db/id\",2,\"~:block/title\",\"Child\",\"~:block/order\",\"a\",\"~:block/parent\",[\"^ \",\"~:db/id\",1]]],[[\"^ \",\"~:db/id\",3,\"~:block/title\",\"Property Value\",\"~:block/order\",\"b\",\"~:block/parent\",[\"^ \",\"~:db/id\",1],\"~:logseq.property/created-from-property\",77]]]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "show";
                      "--page";
                      "home";
                      "--linked-references=false";
                    ]))
          in
          assert_int ~name:"show page tree filter exit" 0 output.exit_code;
          let body = String.trim (cli_stdout output) in
          assert_contains ~name:"show page tree filter keeps child"
            {|"block/title":"Child"|} body;
          assert_not_contains
            ~name:"show page tree filter removes property value"
            "Property Value" body));

  check "Cli.run resolves linked blocks in structured show tree" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun _request ->
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",1,\"~:block/title\",\"Home\",\"~:block/name\",\"home\"]"}|}
            ));
          (fun _request ->
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[[\"^ \",\"~:db/id\",2,\"~:block/title\",\"Alias\",\"~:block/order\",\"a\",\"~:block/parent\",[\"^ \",\"~:db/id\",1],\"~:block/link\",[\"^ \",\"~:db/id\",9]]]]"}|}
            ));
          (fun request ->
            assert_contains ~name:"show linked block target pull"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"show linked block target id" {|,9]|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",9,\"~:block/title\",\"Linked Target\"]"}|}
            ));
          (fun request ->
            assert_contains ~name:"show linked block target tree query"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"show linked block target tree id" {|,9]|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[]"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "show";
                      "--page";
                      "home";
                      "--linked-references=false";
                    ]))
          in
          assert_int ~name:"show linked block exit" 0 output.exit_code;
          let body = String.trim (cli_stdout output) in
          assert_contains ~name:"show linked block target title"
            {|"block/title":"Linked Target"|} body;
          assert_not_contains ~name:"show linked block removes alias title"
            {|"block/title":"Alias"|} body;
          assert_not_contains ~name:"show linked block removes link key"
            {|"block/link"|} body));

  check "Cli.run marks linked blocks in human show tree" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun _request ->
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",1,\"~:block/title\",\"Home\",\"~:block/name\",\"home\"]"}|}
            ));
          (fun _request ->
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[[\"^ \",\"~:db/id\",2,\"~:block/title\",\"Alias\",\"~:block/order\",\"a\",\"~:block/parent\",[\"^ \",\"~:db/id\",1],\"~:block/link\",[\"^ \",\"~:db/id\",9]]]]"}|}
            ));
          (fun request ->
            assert_contains ~name:"show human linked block target pull"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"show human linked block target id" {|,9]|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",9,\"~:block/title\",\"Linked Target\"]"}|}
            ));
          (fun request ->
            assert_contains ~name:"show human linked block target tree query"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"show human linked block target tree id"
              {|,9]|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[]"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "show";
                      "--page";
                      "home";
                      "--linked-references=false";
                    ]))
          in
          assert_int ~name:"show human linked block exit" 0 output.exit_code;
          assert_equal ~name:"show human linked block text"
            "1 Home\n9 └── → Linked Target"
            (String.trim (cli_stdout output))));

  check "Cli.run reports missing show linked block targets" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun _request ->
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",1,\"~:block/title\",\"Home\",\"~:block/name\",\"home\"]"}|}
            ));
          (fun _request ->
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[[\"^ \",\"~:db/id\",2,\"~:block/title\",\"Alias\",\"~:block/order\",\"a\",\"~:block/parent\",[\"^ \",\"~:db/id\",1],\"~:block/link\",[\"^ \",\"~:db/id\",9]]]]"}|}
            ));
          (fun request ->
            assert_contains ~name:"show missing linked block target pull"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"show missing linked block target id" {|,9]|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",9]"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "show";
                      "--page";
                      "home";
                      "--linked-references=false";
                    ]))
          in
          assert_int ~name:"show missing linked block target exit" 1
            output.exit_code;
          assert_equal ~name:"show missing linked block target json"
            {|{"status":"error","error":{"code":"block-link-target-not-found","message":"block link target not found"}}|}
            (String.trim (cli_stdout output))));

  check "Cli.run reports show linked block cycles" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun _request ->
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",1,\"~:block/title\",\"Home\",\"~:block/name\",\"home\"]"}|}
            ));
          (fun _request ->
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[[\"^ \",\"~:db/id\",2,\"~:block/title\",\"Alias\",\"~:block/order\",\"a\",\"~:block/parent\",[\"^ \",\"~:db/id\",1],\"~:block/link\",[\"^ \",\"~:db/id\",9]]]]"}|}
            ));
          (fun request ->
            assert_contains ~name:"show linked cycle first target pull"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"show linked cycle first target id" {|,9]|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",9,\"~:block/title\",\"Linked Target\",\"~:block/link\",[\"^ \",\"~:db/id\",2]]"}|}
            ));
          (fun request ->
            assert_contains ~name:"show linked cycle first target tree query"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"show linked cycle first target tree id"
              {|,9]|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[]"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "show";
                      "--page";
                      "home";
                      "--linked-references=false";
                    ]))
          in
          assert_int ~name:"show linked cycle exit" 1 output.exit_code;
          assert_equal ~name:"show linked cycle json"
            {|{"status":"error","error":{"code":"block-link-cycle","message":"block link cycle detected"}}|}
            (String.trim (cli_stdout output))));

  check "Cli.run limits show linked block target depth" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun _request ->
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",1,\"~:block/title\",\"Home\",\"~:block/name\",\"home\"]"}|}
            ));
          (fun _request ->
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[[\"^ \",\"~:db/id\",2,\"~:block/title\",\"Alias\",\"~:block/order\",\"a\",\"~:block/parent\",[\"^ \",\"~:db/id\",1],\"~:block/link\",[\"^ \",\"~:db/id\",9]]]]"}|}
            ));
          (fun request ->
            assert_contains ~name:"show linked depth target pull"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"show linked depth target id" {|,9]|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",9,\"~:block/title\",\"Linked Target\"]"}|}
            ));
          (fun request ->
            assert_contains ~name:"show linked depth target tree query"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"show linked depth target tree id" {|,9]|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[[\"^ \",\"~:db/id\",10,\"~:block/title\",\"Target Child\",\"~:block/order\",\"a\",\"~:block/parent\",[\"^ \",\"~:db/id\",9]]],[[\"^ \",\"~:db/id\",11,\"~:block/title\",\"Target Grandchild\",\"~:block/order\",\"b\",\"~:block/parent\",[\"^ \",\"~:db/id\",10]]]]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "show";
                      "--page";
                      "home";
                      "--level";
                      "3";
                      "--linked-references=false";
                    ]))
          in
          assert_int ~name:"show linked depth exit" 0 output.exit_code;
          let body = String.trim (cli_stdout output) in
          assert_contains ~name:"show linked depth keeps target"
            {|"block/title":"Linked Target"|} body;
          assert_contains ~name:"show linked depth keeps direct child"
            {|"block/title":"Target Child"|} body;
          assert_not_contains ~name:"show linked depth omits grandchild"
            "Target Grandchild" body));

  check "Cli.run renders show page as human tree text" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun _request ->
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",1,\"~:block/title\",\"Home\",\"~:block/name\",\"home\"]"}|}
            ));
          (fun _request ->
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[[\"^ \",\"~:db/id\",2,\"~:block/title\",\"Child\",\"~:block/order\",\"a\",\"~:block/parent\",[\"^ \",\"~:db/id\",1]]],[[\"^ \",\"~:db/id\",3,\"~:block/title\",\"Nested\",\"~:block/order\",\"b\",\"~:block/parent\",[\"^ \",\"~:db/id\",2]]]]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "show";
                      "--page";
                      "home";
                      "--linked-references=false";
                    ]))
          in
          assert_int ~name:"show human exit" 0 output.exit_code;
          assert_equal ~name:"show human text"
            "1 Home\n2 └── Child\n3     └── Nested"
            (String.trim (cli_stdout output))));

  check "Cli.run renders show human labels with status and tags" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun _request ->
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",1,\"~:block/title\",\"Home\",\"~:block/name\",\"home\",\"~:logseq.property/status\",[\"^ \",\"~:db/ident\",\"~:logseq.property/status.todo\",\"~:block/title\",\"TODO\"],\"~:block/tags\",[[\"^ \",\"~:db/id\",10,\"~:block/title\",\"Project\"]]]"}|}
            ));
          (fun _request ->
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[[\"^ \",\"~:db/id\",2,\"~:block/title\",\"Child\",\"~:block/order\",\"a\",\"~:block/parent\",[\"^ \",\"~:db/id\",1],\"~:block/tags\",[[\"^ \",\"~:db/id\",11,\"~:block/name\",\"area\"]]]]]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "show";
                      "--page";
                      "home";
                      "--linked-references=false";
                    ]))
          in
          assert_int ~name:"show human labels exit" 0 output.exit_code;
          assert_equal ~name:"show human labels text"
            "1 TODO Home #Project\n2 └── Child #area"
            (String.trim (cli_stdout output))));

  check "Cli.run renders show block breadcrumb in human output" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_contains ~name:"show breadcrumb pull method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"show breadcrumb id" {|,5]|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",5,\"~:block/title\",\"Target\",\"~:block/page\",[\"^ \",\"~:db/id\",1,\"~:block/title\",\"Home\",\"~:block/name\",\"home\"]]"}|}
            ));
          (fun request ->
            assert_contains ~name:"show breadcrumb tree query"
              {|"method":"thread-api/q"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[]"}|} ));
          (fun request ->
            assert_contains ~name:"show breadcrumb parents method"
              {|"method":"thread-api/get-block-parents"|} request.body;
            assert_contains ~name:"show breadcrumb parent root id" {|,5]|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[\"^ \",\"~:db/id\",1,\"~:block/title\",\"Home\",\"~:block/name\",\"home\"]]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "show";
                      "--id";
                      "5";
                      "--linked-references=false";
                      "--ref-id-footer=false";
                    ]))
          in
          assert_int ~name:"show breadcrumb exit" 0 output.exit_code;
          assert_equal ~name:"show breadcrumb text" "1 > Home\n5 Target"
            (String.trim (cli_stdout output))));

  check "Cli.run renders show uuid labels and referenced entity footer"
    (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let uuid = "11111111-1111-1111-1111-111111111111" in
      with_http_server_sequence
        [
          (fun _request ->
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",1,\"~:block/title\",\"See [[11111111-1111-1111-1111-111111111111]]\",\"~:block/name\",\"home\"]"}|}
            ));
          (fun _request ->
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[]"}|} ));
          (fun request ->
            assert_contains ~name:"show uuid footer pull method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"show uuid footer lookup attr"
              {|\"~:block/uuid\"|} request.body;
            assert_contains ~name:"show uuid footer lookup value"
              {|~u11111111-1111-1111-1111-111111111111|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",7,\"~:block/uuid\",\"~u11111111-1111-1111-1111-111111111111\",\"~:block/title\",\"Referenced Page\"]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "show";
                      "--page";
                      "home";
                      "--linked-references=false";
                    ]))
          in
          assert_int ~name:"show uuid footer exit" 0 output.exit_code;
          assert_equal ~name:"show uuid footer text"
            "1 See [[Referenced Page]]\n\n\
             Referenced Entities (1)\n\
             7 -> Referenced Page"
            (String.trim (cli_stdout output));
          assert_contains ~name:"show uuid footer source uuid" uuid
            (String.concat ","
               (Uuid_refs_types.extract_uuid_refs ("[[" ^ uuid ^ "]]")))));

  check "Cli.run limits show tree depth in structured output" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun _request ->
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",1,\"~:block/title\",\"Home\",\"~:block/name\",\"home\"]"}|}
            ));
          (fun _request ->
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[[\"^ \",\"~:db/id\",2,\"~:block/title\",\"Child\",\"~:block/order\",\"a\",\"~:block/parent\",[\"^ \",\"~:db/id\",1]]],[[\"^ \",\"~:db/id\",3,\"~:block/title\",\"Nested\",\"~:block/order\",\"b\",\"~:block/parent\",[\"^ \",\"~:db/id\",2]]]]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "show";
                      "--page";
                      "home";
                      "--level";
                      "2";
                      "--linked-references=false";
                    ]))
          in
          assert_int ~name:"show level json exit" 0 output.exit_code;
          let body = String.trim (cli_stdout output) in
          assert_contains ~name:"show level child" {|"block/title":"Child"|}
            body;
          assert_not_contains ~name:"show level omits nested"
            {|"block/title":"Nested"|} body));

  check "Cli.run strips block uuids from structured show output" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun _request ->
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",1,\"~:block/uuid\",\"~u11111111-1111-1111-1111-111111111111\",\"~:block/title\",\"Home\",\"~:block/name\",\"home\"]"}|}
            ));
          (fun _request ->
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[[\"^ \",\"~:db/id\",2,\"~:block/uuid\",\"~u22222222-2222-2222-2222-222222222222\",\"~:block/title\",\"Child\",\"~:block/order\",\"a\",\"~:block/parent\",[\"^ \",\"~:db/id\",1]]]]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "show";
                      "--page";
                      "home";
                      "--linked-references=false";
                    ]))
          in
          assert_int ~name:"show strip uuid exit" 0 output.exit_code;
          let body = String.trim (cli_stdout output) in
          assert_contains ~name:"show strip uuid keeps root"
            {|"block/title":"Home"|} body;
          assert_contains ~name:"show strip uuid keeps child"
            {|"block/title":"Child"|} body;
          assert_not_contains ~name:"show strip uuid omits uuid key"
            {|"block/uuid"|} body;
          assert_not_contains ~name:"show strip uuid omits root uuid"
            "11111111-1111-1111-1111-111111111111" body;
          assert_not_contains ~name:"show strip uuid omits child uuid"
            "22222222-2222-2222-2222-222222222222" body));

  check "Cli.run strips show internal keys from structured show output"
    (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun _request ->
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",1,\"~:block/title\",\"Home\",\"~:show/linked-display?\",true]"}|}
            ));
          (fun _request ->
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[[\"^ \",\"~:db/id\",2,\"~:block/title\",\"Child\",\"~:block/order\",\"a\",\"~:block/parent\",[\"^ \",\"~:db/id\",1],\"~:show/internal\",\"hide-me\"]]]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "show";
                      "--page";
                      "home";
                      "--linked-references=false";
                    ]))
          in
          assert_int ~name:"show strip internal exit" 0 output.exit_code;
          let body = String.trim (cli_stdout output) in
          assert_contains ~name:"show strip internal keeps root"
            {|"block/title":"Home"|} body;
          assert_contains ~name:"show strip internal keeps child"
            {|"block/title":"Child"|} body;
          assert_not_contains ~name:"show strip internal omits linked display"
            "show/linked-display?" body;
          assert_not_contains ~name:"show strip internal omits internal key"
            "show/internal" body;
          assert_not_contains ~name:"show strip internal omits internal value"
            "hide-me" body));

  check "Cli.run applies CLJS default show level" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun _request ->
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",1,\"~:block/title\",\"Root\",\"~:block/name\",\"root\"]"}|}
            ));
          (fun _request ->
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[[\"^ \",\"~:db/id\",2,\"~:block/title\",\"Level 1\",\"~:block/order\",\"a\",\"~:block/parent\",[\"^ \",\"~:db/id\",1]]],[[\"^ \",\"~:db/id\",3,\"~:block/title\",\"Level 2\",\"~:block/order\",\"b\",\"~:block/parent\",[\"^ \",\"~:db/id\",2]]],[[\"^ \",\"~:db/id\",4,\"~:block/title\",\"Level 3\",\"~:block/order\",\"c\",\"~:block/parent\",[\"^ \",\"~:db/id\",3]]],[[\"^ \",\"~:db/id\",5,\"~:block/title\",\"Level 4\",\"~:block/order\",\"d\",\"~:block/parent\",[\"^ \",\"~:db/id\",4]]],[[\"^ \",\"~:db/id\",6,\"~:block/title\",\"Level 5\",\"~:block/order\",\"e\",\"~:block/parent\",[\"^ \",\"~:db/id\",5]]],[[\"^ \",\"~:db/id\",7,\"~:block/title\",\"Level 6\",\"~:block/order\",\"f\",\"~:block/parent\",[\"^ \",\"~:db/id\",6]]],[[\"^ \",\"~:db/id\",8,\"~:block/title\",\"Level 7\",\"~:block/order\",\"g\",\"~:block/parent\",[\"^ \",\"~:db/id\",7]]],[[\"^ \",\"~:db/id\",9,\"~:block/title\",\"Level 8\",\"~:block/order\",\"h\",\"~:block/parent\",[\"^ \",\"~:db/id\",8]]],[[\"^ \",\"~:db/id\",10,\"~:block/title\",\"Level 9\",\"~:block/order\",\"i\",\"~:block/parent\",[\"^ \",\"~:db/id\",9]]],[[\"^ \",\"~:db/id\",11,\"~:block/title\",\"Level 10\",\"~:block/order\",\"j\",\"~:block/parent\",[\"^ \",\"~:db/id\",10]]]]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "show";
                      "--page";
                      "root";
                      "--linked-references=false";
                    ]))
          in
          assert_int ~name:"show default level exit" 0 output.exit_code;
          let body = String.trim (cli_stdout output) in
          assert_contains ~name:"show default level keeps level 9"
            {|"block/title":"Level 9"|} body;
          assert_not_contains ~name:"show default level omits level 10"
            {|"block/title":"Level 10"|} body;
          match output.lifecycle.action with
          | Some (Cli_action.Show action) ->
              assert_opt_int ~name:"show default action level" (Some 10)
                action.Show.level
          | _ -> failf "expected typed show action"));

  check "Cli.run limits show human tree depth" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun _request ->
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",1,\"~:block/title\",\"Home\",\"~:block/name\",\"home\"]"}|}
            ));
          (fun _request ->
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[[\"^ \",\"~:db/id\",2,\"~:block/title\",\"Child\",\"~:block/order\",\"a\",\"~:block/parent\",[\"^ \",\"~:db/id\",1]]],[[\"^ \",\"~:db/id\",3,\"~:block/title\",\"Nested\",\"~:block/order\",\"b\",\"~:block/parent\",[\"^ \",\"~:db/id\",2]]]]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "show";
                      "--page";
                      "home";
                      "--level";
                      "1";
                      "--linked-references=false";
                    ]))
          in
          assert_int ~name:"show level human exit" 0 output.exit_code;
          assert_equal ~name:"show level human text" "1 Home"
            (String.trim (cli_stdout output))));

  check "Cli.run filters contained show multi-id tree entries" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_contains ~name:"show contained first pull method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"show contained first id" {|,1]|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",1,\"~:block/title\",\"Home\",\"~:block/name\",\"home\"]"}|}
            ));
          (fun request ->
            assert_contains ~name:"show contained first tree query"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"show contained first page id" {|,1]|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[[\"^ \",\"~:db/id\",2,\"~:block/title\",\"Child\",\"~:block/order\",\"a\",\"~:block/parent\",[\"^ \",\"~:db/id\",1]]]]"}|}
            ));
          (fun request ->
            assert_contains ~name:"show contained second pull method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"show contained second id" {|,2]|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",2,\"~:block/title\",\"Child\",\"~:block/page\",[\"^ \",\"~:db/id\",1,\"~:block/title\",\"Home\",\"~:block/name\",\"home\"]]"}|}
            ));
          (fun request ->
            assert_contains ~name:"show contained second tree query"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"show contained second page id" {|,1]|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[[\"^ \",\"~:db/id\",2,\"~:block/title\",\"Child\",\"~:block/order\",\"a\",\"~:block/parent\",[\"^ \",\"~:db/id\",1]]]]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "show";
                      "--id";
                      "[1 2]";
                      "--linked-references=false";
                      "--ref-id-footer=false";
                    ]))
          in
          assert_int ~name:"show contained exit" 0 output.exit_code;
          let body = String.trim (cli_stdout output) in
          assert_contains ~name:"show contained keeps root"
            {|"block/name":"home"|} body;
          assert_contains ~name:"show contained keeps child"
            {|"block/title":"Child"|} body;
          assert_not_contains ~name:"show contained omits duplicate child root"
            {|"root":{"db/id":2|} body));

  check "Cli.run returns structured show multi-id entries and errors" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"show multi first pull line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"show multi first pull method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"show multi first id" {|,1]|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",1,\"~:block/title\",\"Home\"]"}|}
            ));
          (fun request ->
            assert_contains ~name:"show multi first tree query"
              {|"method":"thread-api/q"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[]"}|} ));
          (fun request ->
            assert_equal ~name:"show multi second pull line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"show multi second pull method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"show multi second id" {|,9]|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",9]"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "show";
                      "--id";
                      "[1 9]";
                      "--linked-references=false";
                      "--ref-id-footer=false";
                    ]))
          in
          assert_int ~name:"show multi exit" 0 output.exit_code;
          assert_equal ~name:"show multi json"
            {|{"status":"ok","data":[{"root":{"db/id":1,"block/title":"Home"}},{"id":9,"error":{"code":"entity-not-found","message":"Entity 9 not found"}}]}|}
            (String.trim (cli_stdout output));
          match output.lifecycle.action with
          | Some (Cli_action.Show action) -> (
              match action.Show.target with
              | Show.By_ids [ 1L; 9L ] ->
                  assert_bool ~name:"show multi action flag" true
                    action.multi_id
              | _ -> failf "expected show multi-id target")
          | _ -> failf "expected typed show action"));

  check "Cli.run reads show id from stdin when --id has no value" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"show stdin first pull line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"show stdin first id" {|,1]|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",1,\"~:block/title\",\"Home\"]"}|}
            ));
          (fun request ->
            assert_contains ~name:"show stdin first tree query"
              {|"method":"thread-api/q"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[]"}|} ));
          (fun request ->
            assert_equal ~name:"show stdin second pull line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"show stdin second id" {|,9]|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",9]"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    ~stdin:"Count: 2\n[1 9]\n"
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "show";
                      "--id";
                      "--linked-references=false";
                      "--ref-id-footer=false";
                    ]))
          in
          assert_int ~name:"show stdin exit" 0 output.exit_code;
          assert_equal ~name:"show stdin json"
            {|{"status":"ok","data":[{"root":{"db/id":1,"block/title":"Home"}},{"id":9,"error":{"code":"entity-not-found","message":"Entity 9 not found"}}]}|}
            (String.trim (cli_stdout output));
          match output.lifecycle.action with
          | Some (Cli_action.Show action) -> (
              match action.Show.target with
              | Show.By_ids [ 1L; 9L ] -> ()
              | _ -> failf "expected show stdin multi-id target")
          | _ -> failf "expected typed show action"));

  check "Cli.run validates show stdin id target conflicts" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let page_conflict =
        run_blocking
          (Cli.run app
             (cli_input ~stdin:""
                [
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "show";
                  "--id";
                  "--page";
                  "home";
                ]))
      in
      assert_int ~name:"show stdin page conflict exit" 1 page_conflict.exit_code;
      assert_equal ~name:"show stdin page conflict json"
        {|{"status":"error","error":{"code":"invalid-options","message":"only one of --id, --uuid, or --page is allowed"}}|}
        (String.trim (cli_stdout page_conflict));
      let uuid_conflict =
        run_blocking
          (Cli.run app
             (cli_input ~stdin:""
                [
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "show";
                  "--id";
                  "--uuid";
                  "11111111-1111-1111-1111-111111111111";
                ]))
      in
      assert_int ~name:"show stdin uuid conflict exit" 1 uuid_conflict.exit_code;
      assert_equal ~name:"show stdin uuid conflict json"
        {|{"status":"error","error":{"code":"invalid-options","message":"only one of --id, --uuid, or --page is allowed"}}|}
        (String.trim (cli_stdout uuid_conflict));
      let missing =
        run_blocking
          (Cli.run app
             (cli_input ~stdin:""
                [ "--graph"; "alpha"; "--output"; "json"; "show"; "--id" ]))
      in
      assert_int ~name:"show empty stdin id exit" 1 missing.exit_code;
      assert_equal ~name:"show empty stdin id json"
        {|{"status":"error","error":{"code":"missing-target","message":"block or page is required"}}|}
        (String.trim (cli_stdout missing)));

  check "Cli.run renders show multi-id as human messages with delimiter"
    (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"show multi human first pull line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"show multi human first id" {|,1]|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",1,\"~:block/title\",\"Home\"]"}|}
            ));
          (fun request ->
            assert_contains ~name:"show multi human first tree query"
              {|"method":"thread-api/q"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[]"}|} ));
          (fun request ->
            assert_equal ~name:"show multi human second pull line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"show multi human second id" {|,9]|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",9]"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "show";
                      "--id";
                      "[1 9]";
                      "--linked-references=false";
                      "--ref-id-footer=false";
                    ]))
          in
          assert_int ~name:"show multi human exit" 0 output.exit_code;
          assert_equal ~name:"show multi human text"
            "1 Home\n\
             ================================================================\n\
             Entity 9 not found"
            (String.trim (cli_stdout output))));

  check "Cli.run rejects show without a graph" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-show-missing-graph-" in
      let output =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--root-dir";
                  root;
                  "--output";
                  "json";
                  "show";
                  "--page";
                  "home";
                ]))
      in
      assert_int ~name:"show missing graph exit" 1 output.exit_code;
      assert_equal ~name:"show missing graph json"
        {|{"status":"error","error":{"code":"missing-repo","message":"repo is required for show"}}|}
        (String.trim (cli_stdout output)));

  check "Cli.run executes remove block id through typed action" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"remove block pull line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"remove block pull method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"remove block pull id" {|,2]|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",2,\"~:block/uuid\",\"~u11111111-1111-1111-1111-111111111111\"]"}|}
            ));
          (fun request ->
            assert_equal ~name:"remove block apply line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"remove block apply method"
              {|"method":"thread-api/apply-outliner-ops"|} request.body;
            assert_contains ~name:"remove block op" {|\"~:delete-blocks\"|}
              request.body;
            assert_contains ~name:"remove block uuid transit"
              {|~u11111111-1111-1111-1111-111111111111|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "remove";
                      "block";
                      "--id";
                      "2";
                    ]))
          in
          assert_int ~name:"remove block exit" 0 output.exit_code;
          assert_equal ~name:"remove block json"
            {|{"status":"ok","data":{"result":true}}|}
            (String.trim (cli_stdout output));
          match output.lifecycle.action with
          | Some (Cli_action.Remove (Remove.Remove_block action)) -> (
              assert_equal ~name:"remove block graph" "alpha"
                (graph_string action.graph);
              match action.id with
              | Some 2L -> ()
              | _ -> failf "expected remove block id")
          | _ -> failf "expected typed remove block action"));

  check "Cli.run executes remove block id vector best effort" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let pull_handler request =
        assert_equal ~name:"remove block vector pull line"
          "POST /v1/invoke HTTP/1.1" request.request_line;
        assert_contains ~name:"remove block vector pull method"
          {|"method":"thread-api/pull"|} request.body;
        if contains_substring ~needle:{|,2]|} request.body then
          ( 200,
            [ ("Content-Type", "application/json") ],
            {|{"resultTransit":"[\"^ \",\"~:db/id\",2,\"~:block/uuid\",\"~u11111111-1111-1111-1111-111111111111\"]"}|}
          )
        else if contains_substring ~needle:{|,3]|} request.body then
          ( 200,
            [ ("Content-Type", "application/json") ],
            {|{"resultTransit":"null"}|} )
        else if contains_substring ~needle:{|,4]|} request.body then
          ( 200,
            [ ("Content-Type", "application/json") ],
            {|{"resultTransit":"[\"^ \",\"~:db/id\",4,\"~:block/uuid\",\"~u22222222-2222-2222-2222-222222222222\",\"~:block/name\",\"home\"]"}|}
          )
        else failf "expected remove block vector pull id in %s" request.body
      in
      with_http_server_sequence
        [
          pull_handler;
          pull_handler;
          pull_handler;
          (fun request ->
            assert_equal ~name:"remove block vector apply line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"remove block vector op"
              {|\"~:delete-blocks\"|} request.body;
            assert_contains ~name:"remove block vector uuid"
              {|~u11111111-1111-1111-1111-111111111111|} request.body;
            assert_not_contains ~name:"remove block vector omits page uuid"
              {|~u22222222-2222-2222-2222-222222222222|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "remove";
                      "block";
                      "--id";
                      "[2,3,4]";
                    ]))
          in
          assert_int ~name:"remove block vector exit" 0 output.exit_code;
          assert_equal ~name:"remove block vector json"
            {|{"status":"ok","data":{"deleted-ids":[2],"missing-ids":[3],"result":true,"page-ids":[4]}}|}
            (String.trim (cli_stdout output));
          match output.lifecycle.action with
          | Some (Cli_action.Remove (Remove.Remove_block action)) ->
              assert_bool ~name:"remove block vector multi" true action.multi_id;
              assert_equal ~name:"remove block vector ids" "2,3,4"
                (String.concat "," (List.map Int64.to_string action.ids))
          | _ -> failf "expected typed remove block vector action"));

  check "Cli.run rejects remove block id vector with only pages" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let pull_handler request =
        assert_equal ~name:"remove block vector pages pull line"
          "POST /v1/invoke HTTP/1.1" request.request_line;
        assert_contains ~name:"remove block vector pages pull method"
          {|"method":"thread-api/pull"|} request.body;
        if contains_substring ~needle:{|,4]|} request.body then
          ( 200,
            [ ("Content-Type", "application/json") ],
            {|{"resultTransit":"[\"^ \",\"~:db/id\",4,\"~:block/uuid\",\"~u22222222-2222-2222-2222-222222222222\",\"~:block/name\",\"home\"]"}|}
          )
        else if contains_substring ~needle:{|,5]|} request.body then
          ( 200,
            [ ("Content-Type", "application/json") ],
            {|{"resultTransit":"[\"^ \",\"~:db/id\",5,\"~:block/uuid\",\"~u55555555-5555-5555-5555-555555555555\",\"~:block/name\",\"journal\"]"}|}
          )
        else failf "expected remove block vector pages id in %s" request.body
      in
      with_http_server_sequence [ pull_handler; pull_handler ] (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "remove";
                      "block";
                      "--id";
                      "[4,5]";
                    ]))
          in
          assert_int ~name:"remove block vector pages exit" 1 output.exit_code;
          assert_equal ~name:"remove block vector pages json"
            {|{"status":"error","error":{"code":"invalid-target","message":"target is not a block, use 'remove page' instead"}}|}
            (String.trim (cli_stdout output))));

  check "Cli.run executes remove page id through typed action" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"remove page pull line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"remove page pull method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"remove page pull id" {|,4]|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",4,\"~:block/uuid\",\"~u22222222-2222-2222-2222-222222222222\",\"~:block/name\",\"home\"]"}|}
            ));
          (fun request ->
            assert_equal ~name:"remove page apply line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"remove page apply method"
              {|"method":"thread-api/apply-outliner-ops"|} request.body;
            assert_contains ~name:"remove page op" {|\"~:delete-page\"|}
              request.body;
            assert_contains ~name:"remove page uuid transit"
              {|~u22222222-2222-2222-2222-222222222222|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "remove";
                      "page";
                      "--id";
                      "4";
                    ]))
          in
          assert_int ~name:"remove page exit" 0 output.exit_code;
          assert_equal ~name:"remove page json"
            {|{"status":"ok","data":{"result":true}}|}
            (String.trim (cli_stdout output));
          match output.lifecycle.action with
          | Some (Cli_action.Remove (Remove.Remove_page action)) -> (
              assert_equal ~name:"remove page graph" "alpha"
                (graph_string action.graph);
              match action.id with
              | Some 4L -> ()
              | _ -> failf "expected remove page id")
          | _ -> failf "expected typed remove page action"));

  check "Cli.run rejects remove block invalid uuid" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let output =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "remove";
                  "block";
                  "--uuid";
                  "not-a-uuid";
                ]))
      in
      assert_int ~name:"remove block invalid uuid exit" 1 output.exit_code;
      assert_equal ~name:"remove block invalid uuid json"
        {|{"status":"error","error":{"code":"invalid-options","message":"Option uuid must be a valid UUID string"}}|}
        (String.trim (cli_stdout output)));

  check "Cli.run executes remove block uuid through typed action" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"remove block uuid pull line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"remove block uuid pull method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"remove block uuid lookup"
              {|~u11111111-1111-1111-1111-111111111111|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",2,\"~:block/uuid\",\"~u11111111-1111-1111-1111-111111111111\"]"}|}
            ));
          (fun request ->
            assert_equal ~name:"remove block uuid apply line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"remove block uuid op" {|\"~:delete-blocks\"|}
              request.body;
            assert_contains ~name:"remove block uuid delete"
              {|~u11111111-1111-1111-1111-111111111111|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "remove";
                      "block";
                      "--uuid";
                      "11111111-1111-1111-1111-111111111111";
                    ]))
          in
          assert_int ~name:"remove block uuid exit" 0 output.exit_code;
          assert_equal ~name:"remove block uuid json"
            {|{"status":"ok","data":{"result":true}}|}
            (String.trim (cli_stdout output));
          match output.lifecycle.action with
          | Some (Cli_action.Remove (Remove.Remove_block action)) -> (
              match action.uuid with
              | Some "11111111-1111-1111-1111-111111111111" -> ()
              | _ -> failf "expected remove block uuid")
          | _ -> failf "expected typed remove block uuid action"));

  check "Cli.run falls back to string lookup for remove block uuid" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"remove block uuid fallback typed line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"remove block uuid fallback typed method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"remove block uuid fallback typed lookup"
              {|~u11111111-1111-1111-1111-111111111111|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"null"}|} ));
          (fun request ->
            assert_equal ~name:"remove block uuid fallback string line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"remove block uuid fallback string method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"remove block uuid fallback string lookup"
              {|11111111-1111-1111-1111-111111111111|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",2,\"~:block/uuid\",\"~u11111111-1111-1111-1111-111111111111\"]"}|}
            ));
          (fun request ->
            assert_equal ~name:"remove block uuid fallback apply line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"remove block uuid fallback op"
              {|\"~:delete-blocks\"|} request.body;
            assert_contains ~name:"remove block uuid fallback delete"
              {|~u11111111-1111-1111-1111-111111111111|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "remove";
                      "block";
                      "--uuid";
                      "11111111-1111-1111-1111-111111111111";
                    ]))
          in
          assert_int ~name:"remove block uuid fallback exit" 0 output.exit_code;
          assert_equal ~name:"remove block uuid fallback json"
            {|{"status":"ok","data":{"result":true}}|}
            (String.trim (cli_stdout output))));

  check "Cli.run executes remove page name through typed action" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"remove page name list line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"remove page name list method"
              {|"method":"thread-api/cli-list-pages"|} request.body;
            assert_contains ~name:"remove page name include built in"
              {|\"~:include-built-in\"|} request.body;
            assert_contains ~name:"remove page name expand" {|\"~:expand\"|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[\"^ \",\"~:db/id\",4,\"~:block/uuid\",\"~u22222222-2222-2222-2222-222222222222\",\"~:block/title\",\"Home\",\"~:block/name\",\"home\"]]"}|}
            ));
          (fun request ->
            assert_equal ~name:"remove page name apply line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"remove page name op" {|\"~:delete-page\"|}
              request.body;
            assert_contains ~name:"remove page name uuid"
              {|~u22222222-2222-2222-2222-222222222222|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "remove";
                      "page";
                      "--page";
                      "Home";
                    ]))
          in
          assert_int ~name:"remove page name exit" 0 output.exit_code;
          assert_equal ~name:"remove page name json"
            {|{"status":"ok","data":{"result":true}}|}
            (String.trim (cli_stdout output));
          match output.lifecycle.action with
          | Some (Cli_action.Remove (Remove.Remove_page action)) -> (
              match action.page with
              | Some "Home" -> ()
              | _ -> failf "expected remove page name")
          | _ -> failf "expected typed remove page action"));

  check "Cli.run rejects ambiguous remove page name with candidates" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"remove page ambiguous list line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"remove page ambiguous list method"
              {|"method":"thread-api/cli-list-pages"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[\"^ \",\"~:db/id\",4,\"~:block/title\",\"Home\",\"~:block/name\",\"home\"],[\"^ \",\"~:db/id\",5,\"~:block/title\",\"home\",\"~:block/name\",\"home\"]]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "remove";
                      "page";
                      "--page";
                      "Home";
                    ]))
          in
          assert_int ~name:"remove page ambiguous exit" 1 output.exit_code;
          assert_equal ~name:"remove page ambiguous json"
            {|{"status":"error","error":{"code":"ambiguous-page-name","message":"multiple pages match name: Home; rerun with --id","candidates":[{"id":4,"name":"Home"},{"id":5,"name":"home"}]}}|}
            (String.trim (cli_stdout output))));

  check "Cli.run executes remove tag name through typed action" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"remove tag name list line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"remove tag name list method"
              {|"method":"thread-api/cli-list-tags"|} request.body;
            assert_contains ~name:"remove tag name include built in"
              {|\"~:include-built-in\"|} request.body;
            assert_contains ~name:"remove tag name expand" {|\"~:expand\"|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[\"^ \",\"~:db/id\",6,\"~:block/title\",\"Project\",\"~:block/name\",\"project\"]]"}|}
            ));
          (fun request ->
            assert_equal ~name:"remove tag name pull line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"remove tag name pull method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"remove tag name lookup attr"
              {|\"~:block/name\"|} request.body;
            assert_contains ~name:"remove tag name lookup value" {|project|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",6,\"~:block/uuid\",\"~u33333333-3333-3333-3333-333333333333\",\"~:block/title\",\"Project\",\"~:block/name\",\"project\",\"~:block/tags\",[[\"^ \",\"~:db/ident\",\"~:logseq.class/Tag\"]]]"}|}
            ));
          (fun request ->
            assert_equal ~name:"remove tag name apply line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"remove tag name op" {|\"~:delete-page\"|}
              request.body;
            assert_contains ~name:"remove tag name uuid"
              {|~u33333333-3333-3333-3333-333333333333|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "remove";
                      "tag";
                      "--name";
                      "Project";
                    ]))
          in
          assert_int ~name:"remove tag name exit" 0 output.exit_code;
          assert_equal ~name:"remove tag name json"
            {|{"status":"ok","data":{"result":true,"id":6,"name":"Project"}}|}
            (String.trim (cli_stdout output));
          match output.lifecycle.action with
          | Some (Cli_action.Remove (Remove.Remove_tag action)) -> (
              match action.name with
              | Some "Project" -> ()
              | _ -> failf "expected remove tag name")
          | _ -> failf "expected typed remove tag action"));

  check "Cli.run rejects ambiguous remove tag name" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"remove tag ambiguous list line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"remove tag ambiguous list method"
              {|"method":"thread-api/cli-list-tags"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[\"^ \",\"~:db/id\",6,\"~:block/title\",\"Project\",\"~:block/name\",\"project\"],[\"^ \",\"~:db/id\",8,\"~:block/title\",\"project\",\"~:block/name\",\"project\"]]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "remove";
                      "tag";
                      "--name";
                      "Project";
                    ]))
          in
          assert_int ~name:"remove tag ambiguous exit" 1 output.exit_code;
          assert_equal ~name:"remove tag ambiguous json"
            {|{"status":"error","error":{"code":"ambiguous-tag-name","message":"multiple tags match name: Project; rerun with --id","candidates":[{"id":6,"name":"Project"},{"id":8,"name":"project"}]}}|}
            (String.trim (cli_stdout output))));

  check "Cli.run executes remove property id through typed action" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"remove property id pull line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"remove property id pull method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"remove property id pull id" {|,7]|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",7,\"~:block/uuid\",\"~u44444444-4444-4444-4444-444444444444\",\"~:block/title\",\"Owner\",\"~:block/name\",\"owner\",\"~:logseq.property/type\",\"~:default\"]"}|}
            ));
          (fun request ->
            assert_equal ~name:"remove property id apply line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"remove property id op" {|\"~:delete-page\"|}
              request.body;
            assert_contains ~name:"remove property id uuid"
              {|~u44444444-4444-4444-4444-444444444444|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "remove";
                      "property";
                      "--id";
                      "7";
                    ]))
          in
          assert_int ~name:"remove property id exit" 0 output.exit_code;
          assert_equal ~name:"remove property id json"
            {|{"status":"ok","data":{"result":true,"id":7,"name":"Owner"}}|}
            (String.trim (cli_stdout output));
          match output.lifecycle.action with
          | Some (Cli_action.Remove (Remove.Remove_property action)) -> (
              match action.id with
              | Some 7L -> ()
              | _ -> failf "expected remove property id")
          | _ -> failf "expected typed remove property action"));

  check "Cli.run rejects ambiguous remove property name with candidates"
    (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"remove property ambiguous list line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"remove property ambiguous list method"
              {|"method":"thread-api/cli-list-properties"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[\"^ \",\"~:db/id\",7,\"~:block/title\",\"Owner\",\"~:block/name\",\"owner\"],[\"^ \",\"~:db/id\",9,\"~:block/title\",\"owner\",\"~:block/name\",\"owner\"]]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "remove";
                      "property";
                      "--name";
                      "Owner";
                    ]))
          in
          assert_int ~name:"remove property ambiguous exit" 1 output.exit_code;
          assert_equal ~name:"remove property ambiguous json"
            {|{"status":"error","error":{"code":"ambiguous-property-name","message":"multiple properties match name: Owner; rerun with --id","candidates":[{"id":7,"name":"Owner"},{"id":9,"name":"owner"}]}}|}
            (String.trim (cli_stdout output))));

  check "Cli.run rejects built-in remove property id" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"remove property built in pull line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"remove property built in pull method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"remove property built in pull id" {|,7]|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",7,\"~:block/uuid\",\"~u44444444-4444-4444-4444-444444444444\",\"~:block/title\",\"Owner\",\"~:block/name\",\"owner\",\"~:logseq.property/type\",\"~:default\",\"~:logseq.property/built-in?\",true]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "remove";
                      "property";
                      "--id";
                      "7";
                    ]))
          in
          assert_int ~name:"remove property built in exit" 1 output.exit_code;
          assert_equal ~name:"remove property built in json"
            {|{"status":"error","error":{"code":"property-built-in","message":"built-in property cannot be removed"}}|}
            (String.trim (cli_stdout output))));

  check "Cli.run rejects remove without a graph" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-remove-missing-graph-" in
      let output =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--root-dir";
                  root;
                  "--output";
                  "json";
                  "remove";
                  "block";
                  "--id";
                  "2";
                ]))
      in
      assert_int ~name:"remove missing graph exit" 1 output.exit_code;
      assert_equal ~name:"remove missing graph json"
        {|{"status":"error","error":{"code":"missing-repo","message":"repo is required for remove"}}|}
        (String.trim (cli_stdout output)));

  check "Cli.run executes upsert tag create through typed action" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"upsert tag create initial q line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert tag create initial q method"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"upsert tag create initial q name" {|project|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[]"}|} ));
          (fun request ->
            assert_equal ~name:"upsert tag create apply line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert tag create apply method"
              {|"method":"thread-api/apply-outliner-ops"|} request.body;
            assert_contains ~name:"upsert tag create op" {|\"~:create-page\"|}
              request.body;
            assert_contains ~name:"upsert tag create class" {|\"~:class?\"|}
              request.body;
            assert_contains ~name:"upsert tag create name" {|Project|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_equal ~name:"upsert tag create confirm q line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert tag create confirm q method"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"upsert tag create confirm q name" {|project|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[\"^ \",\"~:db/id\",6,\"~:block/title\",\"Project\",\"~:block/name\",\"project\",\"~:block/tags\",[[\"^ \",\"~:db/ident\",\"~:logseq.class/Tag\"]]]]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "upsert";
                      "tag";
                      "--name";
                      "Project";
                    ]))
          in
          assert_int ~name:"upsert tag create exit" 0 output.exit_code;
          assert_equal ~name:"upsert tag create json"
            {|{"status":"ok","data":{"result":[6]}}|}
            (String.trim (cli_stdout output));
          match output.lifecycle.action with
          | Some (Cli_action.Upsert (Upsert.Upsert_tag action)) -> (
              (match action.mode with
              | Upsert.Create -> ()
              | _ -> failf "expected upsert tag create mode");
              match action.name with
              | Some "Project" -> ()
              | _ -> failf "expected upsert tag name")
          | _ -> failf "expected typed upsert tag action"));

  check "Cli.run returns existing upsert tag without mutation" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"upsert tag existing q line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert tag existing q method"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"upsert tag existing q name" {|project|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[\"^ \",\"~:db/id\",6,\"~:block/title\",\"Project\",\"~:block/name\",\"project\",\"~:block/tags\",[[\"^ \",\"~:db/ident\",\"~:logseq.class/Tag\"]]]]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "upsert";
                      "tag";
                      "--name";
                      "#Project";
                    ]))
          in
          assert_int ~name:"upsert tag existing exit" 0 output.exit_code;
          assert_equal ~name:"upsert tag existing json"
            {|{"status":"ok","data":{"result":[6]}}|}
            (String.trim (cli_stdout output));
          match output.lifecycle.action with
          | Some (Cli_action.Upsert (Upsert.Upsert_tag action)) -> (
              match action.name with
              | Some "Project" -> ()
              | _ -> failf "expected normalized upsert tag name")
          | _ -> failf "expected typed upsert tag action"));

  check "Cli.run executes upsert tag rename through typed action" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"upsert tag rename pull line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert tag rename pull method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"upsert tag rename pull id" {|,6]|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",6,\"~:block/uuid\",\"~u33333333-3333-3333-3333-333333333333\",\"~:block/title\",\"Project\",\"~:block/name\",\"project\",\"~:block/tags\",[[\"^ \",\"~:db/ident\",\"~:logseq.class/Tag\"]]]"}|}
            ));
          (fun request ->
            assert_equal ~name:"upsert tag rename target q line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert tag rename target q method"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"upsert tag rename target q name" {|renamed|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[]"}|} ));
          (fun request ->
            assert_equal ~name:"upsert tag rename apply line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert tag rename apply method"
              {|"method":"thread-api/apply-outliner-ops"|} request.body;
            assert_contains ~name:"upsert tag rename op" {|\"~:rename-page\"|}
              request.body;
            assert_contains ~name:"upsert tag rename uuid"
              {|~u33333333-3333-3333-3333-333333333333|} request.body;
            assert_contains ~name:"upsert tag rename name" {|Renamed|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "upsert";
                      "tag";
                      "--id";
                      "6";
                      "--name";
                      "Renamed";
                    ]))
          in
          assert_int ~name:"upsert tag rename exit" 0 output.exit_code;
          assert_equal ~name:"upsert tag rename json"
            {|{"status":"ok","data":{"result":[6]}}|}
            (String.trim (cli_stdout output));
          match output.lifecycle.action with
          | Some (Cli_action.Upsert (Upsert.Upsert_tag action)) -> (
              (match action.mode with
              | Upsert.Update -> ()
              | _ -> failf "expected upsert tag update mode");
              match action.id with
              | Some 6L -> ()
              | _ -> failf "expected upsert tag id")
          | _ -> failf "expected typed upsert tag rename action"));

  check "Cli.run rejects upsert tag rename conflict" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"upsert tag conflict pull line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert tag conflict pull id" {|,6]|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",6,\"~:block/uuid\",\"~u33333333-3333-3333-3333-333333333333\",\"~:block/title\",\"Project\",\"~:block/name\",\"project\",\"~:block/tags\",[[\"^ \",\"~:db/ident\",\"~:logseq.class/Tag\"]]]"}|}
            ));
          (fun request ->
            assert_equal ~name:"upsert tag conflict target q line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert tag conflict target q method"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"upsert tag conflict target q name"
              {|renamed|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[\"^ \",\"~:db/id\",9,\"~:block/title\",\"Renamed\",\"~:block/name\",\"renamed\",\"~:block/tags\",[[\"^ \",\"~:db/ident\",\"~:logseq.class/Tag\"]]]]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "upsert";
                      "tag";
                      "--id";
                      "6";
                      "--name";
                      "Renamed";
                    ]))
          in
          assert_int ~name:"upsert tag conflict exit" 1 output.exit_code;
          assert_equal ~name:"upsert tag conflict json"
            {|{"status":"error","error":{"code":"tag-rename-conflict","message":"rename target already exists as a tag"}}|}
            (String.trim (cli_stdout output))));

  check "Cli.run rejects upsert tag id type mismatch" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"upsert tag type mismatch pull line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert tag type mismatch pull id" {|,6]|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",6,\"~:block/title\",\"Project\",\"~:block/name\",\"project\"]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "upsert";
                      "tag";
                      "--id";
                      "6";
                      "--name";
                      "Renamed";
                    ]))
          in
          assert_int ~name:"upsert tag type mismatch exit" 1 output.exit_code;
          assert_equal ~name:"upsert tag type mismatch json"
            {|{"status":"error","error":{"code":"upsert-id-type-mismatch","message":"id must be a node tagged with #Tag"}}|}
            (String.trim (cli_stdout output))));

  check "Cli.run rejects upsert tag without name" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let output =
        run_blocking
          (Cli.run app
             (cli_input
                [ "--graph"; "alpha"; "--output"; "json"; "upsert"; "tag" ]))
      in
      assert_int ~name:"upsert tag missing name exit" 1 output.exit_code;
      assert_equal ~name:"upsert tag missing name json"
        {|{"status":"error","error":{"code":"missing-tag-name","message":"tag name is required"}}|}
        (String.trim (cli_stdout output)));

  check "Cli.run rejects upsert tag blank name" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let output =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "upsert";
                  "tag";
                  "--name";
                  "  ";
                ]))
      in
      assert_int ~name:"upsert tag blank name exit" 1 output.exit_code;
      assert_equal ~name:"upsert tag blank name json"
        {|{"status":"error","error":{"code":"invalid-options","message":"tag name must not be blank"}}|}
        (String.trim (cli_stdout output)));

  check "Cli.run rejects upsert tag without a graph" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-upsert-tag-missing-graph-" in
      let output =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--root-dir";
                  root;
                  "--output";
                  "json";
                  "upsert";
                  "tag";
                  "--name";
                  "Project";
                ]))
      in
      assert_int ~name:"upsert tag missing graph exit" 1 output.exit_code;
      assert_equal ~name:"upsert tag missing graph json"
        {|{"status":"error","error":{"code":"missing-repo","message":"repo is required for upsert"}}|}
        (String.trim (cli_stdout output)));

  check "Cli.run executes upsert property create through typed action"
    (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"upsert property create initial q line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert property create initial q method"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"upsert property create initial q name"
              {|owner|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[]"}|} ));
          (fun request ->
            assert_equal ~name:"upsert property create apply line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert property create apply method"
              {|"method":"thread-api/apply-outliner-ops"|} request.body;
            assert_contains ~name:"upsert property create op"
              {|\"~:upsert-property\"|} request.body;
            assert_contains ~name:"upsert property create name" {|Owner|}
              request.body;
            assert_contains ~name:"upsert property create kind"
              {|\"~:logseq.property/type\"|} request.body;
            assert_contains ~name:"upsert property create default"
              {|\"~:default\"|} request.body;
            assert_contains ~name:"upsert property create cardinality key"
              {|\"~:db/cardinality\"|} request.body;
            assert_contains ~name:"upsert property create cardinality value"
              {|\"~:db.cardinality/one\"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
          (fun request ->
            assert_equal ~name:"upsert property create confirm q line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert property create confirm q method"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"upsert property create confirm q name"
              {|owner|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[\"^ \",\"~:db/id\",7,\"~:db/ident\",\"~:logseq.property/owner\",\"~:block/title\",\"Owner\",\"~:block/name\",\"owner\",\"~:logseq.property/type\",\"~:default\"]]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "upsert";
                      "property";
                      "--name";
                      "Owner";
                      "--type";
                      "default";
                      "--cardinality";
                      "one";
                    ]))
          in
          assert_int ~name:"upsert property create exit" 0 output.exit_code;
          assert_equal ~name:"upsert property create json"
            {|{"status":"ok","data":{"result":[7]}}|}
            (String.trim (cli_stdout output));
          match output.lifecycle.action with
          | Some (Cli_action.Upsert (Upsert.Upsert_property action)) -> (
              (match action.mode with
              | Upsert.Create -> ()
              | _ -> failf "expected upsert property create mode");
              (match action.name with
              | Some "Owner" -> ()
              | _ -> failf "expected upsert property name");
              (match action.schema.kind with
              | Some Property.Default -> ()
              | _ -> failf "expected property kind default");
              match action.schema.cardinality with
              | Some Property.One -> ()
              | _ -> failf "expected property cardinality one")
          | _ -> failf "expected typed upsert property action"));

  check "Cli.run executes upsert property update by id" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"upsert property update pull line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert property update pull method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"upsert property update pull id" {|,7]|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",7,\"~:db/ident\",\"~:logseq.property/owner\",\"~:block/title\",\"Owner\",\"~:block/name\",\"owner\",\"~:logseq.property/type\",\"~:default\"]"}|}
            ));
          (fun request ->
            assert_equal ~name:"upsert property update apply line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert property update apply method"
              {|"method":"thread-api/apply-outliner-ops"|} request.body;
            assert_contains ~name:"upsert property update op"
              {|\"~:upsert-property\"|} request.body;
            assert_contains ~name:"upsert property update ident"
              {|\"~:logseq.property/owner\"|} request.body;
            assert_contains ~name:"upsert property update hide"
              {|\"~:logseq.property/hide?\"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "upsert";
                      "property";
                      "--id";
                      "7";
                      "--hide";
                      "true";
                    ]))
          in
          assert_int ~name:"upsert property update exit" 0 output.exit_code;
          assert_equal ~name:"upsert property update json"
            {|{"status":"ok","data":{"result":[7]}}|}
            (String.trim (cli_stdout output));
          match output.lifecycle.action with
          | Some (Cli_action.Upsert (Upsert.Upsert_property action)) -> (
              (match action.mode with
              | Upsert.Update -> ()
              | _ -> failf "expected upsert property update mode");
              (match action.id with
              | Some 7L -> ()
              | _ -> failf "expected upsert property id");
              match action.schema.hidden with
              | Some true -> ()
              | _ -> failf "expected property hidden")
          | _ -> failf "expected typed upsert property action"));

  check "Cli.run rejects upsert property id type mismatch" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"upsert property type mismatch pull line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert property type mismatch pull id"
              {|,7]|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",7,\"~:block/title\",\"Owner\",\"~:block/name\",\"owner\"]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "upsert";
                      "property";
                      "--id";
                      "7";
                      "--hide";
                      "true";
                    ]))
          in
          assert_int ~name:"upsert property type mismatch exit" 1
            output.exit_code;
          assert_equal ~name:"upsert property type mismatch json"
            {|{"status":"error","error":{"code":"upsert-id-type-mismatch","message":"id must be a node tagged with #Property"}}|}
            (String.trim (cli_stdout output))));

  check "Cli.run rejects upsert property without name" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let output =
        run_blocking
          (Cli.run app
             (cli_input
                [ "--graph"; "alpha"; "--output"; "json"; "upsert"; "property" ]))
      in
      assert_int ~name:"upsert property missing name exit" 1 output.exit_code;
      assert_equal ~name:"upsert property missing name json"
        {|{"status":"error","error":{"code":"missing-property-name","message":"property name is required"}}|}
        (String.trim (cli_stdout output)));

  check "Cli.run rejects upsert property conflicting selectors" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let output =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "upsert";
                  "property";
                  "--id";
                  "7";
                  "--name";
                  "Owner";
                ]))
      in
      assert_int ~name:"upsert property selector conflict exit" 1
        output.exit_code;
      assert_equal ~name:"upsert property selector conflict json"
        {|{"status":"error","error":{"code":"invalid-options","message":"only one of --id or --name is allowed"}}|}
        (String.trim (cli_stdout output)));

  check "Cli.run executes upsert asset create by path" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-upsert-asset-create-" in
      let source_path = Filename.concat root "logo.png" in
      ensure_test_dir root;
      write_text_file source_path "asset";
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"upsert asset create tag line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert asset create tag method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"upsert asset create tag ident"
              {|\"~:logseq.class/Asset\"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",77]"}|} ));
          (fun request ->
            assert_equal ~name:"upsert asset create target line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert asset create target method"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"upsert asset create target page" {|home|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"~#list\",[[\"^ \",\"~:db/id\",1,\"~:block/uuid\",\"~u11111111-1111-1111-1111-111111111111\",\"~:block/name\",\"home\"]]]"}|}
            ));
          (fun request ->
            assert_equal ~name:"upsert asset create apply line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert asset create apply method"
              {|"method":"thread-api/apply-outliner-ops"|} request.body;
            assert_contains ~name:"upsert asset create insert op"
              {|\"~:insert-blocks\"|} request.body;
            assert_contains ~name:"upsert asset create title" {|Logo|}
              request.body;
            assert_contains ~name:"upsert asset create type property"
              {|logseq.property.asset/type|} request.body;
            assert_contains ~name:"upsert asset create type value" {|png|}
              request.body;
            assert_contains ~name:"upsert asset create size property"
              {|logseq.property.asset/size|} request.body;
            assert_contains ~name:"upsert asset create checksum property"
              {|logseq.property.asset/checksum|} request.body;
            assert_contains ~name:"upsert asset create checksum value"
              {|d59386e0ae435e292fbe0ebcdb954b75ed5fb3922091277cb19f798fc5d50718|}
              request.body;
            assert_contains ~name:"upsert asset create tag id" {|77|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[]"}|} ));
          (fun request ->
            assert_equal ~name:"upsert asset create id pull line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert asset create id pull method"
              {|"method":"thread-api/pull"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",10]"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--root-dir";
                      root;
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "upsert";
                      "asset";
                      "--path";
                      source_path;
                      "--target-page";
                      "Home";
                      "--content";
                      "Logo";
                    ]))
          in
          assert_int ~name:"upsert asset create exit" 0 output.exit_code;
          assert_equal ~name:"upsert asset create json"
            {|{"status":"ok","data":{"result":[10]}}|}
            (String.trim (cli_stdout output));
          let assets_dir =
            Filename.concat
              (Filename.concat (Filename.concat root "graphs") "alpha")
              "assets"
          in
          let copied_files = Sys.readdir assets_dir |> Array.to_list in
          assert_int ~name:"upsert asset copied file count" 1
            (List.length copied_files);
          let copied_path = Filename.concat assets_dir (List.hd copied_files) in
          assert_bool ~name:"upsert asset copied file exists" true
            (Sys.file_exists copied_path);
          assert_equal ~name:"upsert asset copied file content" "asset"
            (read_binary_file copied_path);
          match output.lifecycle.action with
          | Some (Cli_action.Upsert (Upsert.Upsert_asset action)) -> (
              (match action.mode with
              | Upsert.Create -> ()
              | _ -> failf "expected upsert asset create mode");
              (match action.path with
              | Some path ->
                  assert_equal ~name:"upsert asset create path action"
                    source_path path
              | None -> failf "expected upsert asset path");
              match action.create_action with
              | Some _ -> ()
              | None -> failf "expected upsert asset create action")
          | _ -> failf "expected typed upsert asset action"));

  check "Cli.run copies upsert asset files under encoded graph dirs" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let root = fresh_root "logseq-cli-upsert-asset-encoded-dir-" in
      let source_path = Filename.concat root "logo.png" in
      ensure_test_dir root;
      write_text_file source_path "asset";
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"upsert asset encoded dir tag line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert asset encoded dir tag method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"upsert asset encoded dir tag repo"
              {|logseq_db_foo/bar|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",77]"}|} ));
          (fun request ->
            assert_equal ~name:"upsert asset encoded dir target line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert asset encoded dir target method"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"upsert asset encoded dir target repo"
              {|logseq_db_foo/bar|} request.body;
            assert_contains ~name:"upsert asset encoded dir target page"
              {|home|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"~#list\",[[\"^ \",\"~:db/id\",1,\"~:block/uuid\",\"~u11111111-1111-1111-1111-111111111111\",\"~:block/name\",\"home\"]]]"}|}
            ));
          (fun request ->
            assert_equal ~name:"upsert asset encoded dir apply line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert asset encoded dir apply method"
              {|"method":"thread-api/apply-outliner-ops"|} request.body;
            assert_contains ~name:"upsert asset encoded dir apply repo"
              {|logseq_db_foo/bar|} request.body;
            assert_contains ~name:"upsert asset encoded dir title" {|Logo|}
              request.body;
            assert_contains ~name:"upsert asset encoded dir checksum"
              {|d59386e0ae435e292fbe0ebcdb954b75ed5fb3922091277cb19f798fc5d50718|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[]"}|} ));
          (fun request ->
            assert_equal ~name:"upsert asset encoded dir id pull line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert asset encoded dir id pull method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"upsert asset encoded dir id pull repo"
              {|logseq_db_foo/bar|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",10]"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--root-dir";
                      root;
                      "--graph";
                      "foo/bar";
                      "--output";
                      "json";
                      "upsert";
                      "asset";
                      "--path";
                      source_path;
                      "--target-page";
                      "Home";
                      "--content";
                      "Logo";
                    ]))
          in
          assert_int ~name:"upsert asset encoded dir exit" 0 output.exit_code;
          assert_equal ~name:"upsert asset encoded dir json"
            {|{"status":"ok","data":{"result":[10]}}|}
            (String.trim (cli_stdout output));
          let assets_dir =
            Filename.concat
              (Filename.concat (Filename.concat root "graphs") "foo~2Fbar")
              "assets"
          in
          let copied_files = Sys.readdir assets_dir |> Array.to_list in
          assert_int ~name:"upsert asset encoded dir copied file count" 1
            (List.length copied_files);
          let copied_path = Filename.concat assets_dir (List.hd copied_files) in
          assert_bool ~name:"upsert asset encoded dir copied file exists" true
            (Sys.file_exists copied_path);
          assert_equal ~name:"upsert asset encoded dir copied file content"
            "asset"
            (read_binary_file copied_path)));

  check "Cli.run executes upsert asset update by id" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"upsert asset update pull line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert asset update pull method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"upsert asset update pull id" {|,9]|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",9,\"~:block/uuid\",\"~u99999999-9999-9999-9999-999999999999\",\"~:block/title\",\"Old asset\",\"~:block/tags\",[[\"^ \",\"~:db/ident\",\"~:logseq.class/Asset\"]]]"}|}
            ));
          (fun request ->
            assert_equal ~name:"upsert asset update apply line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert asset update apply method"
              {|"method":"thread-api/apply-outliner-ops"|} request.body;
            assert_contains ~name:"upsert asset update save op"
              {|\"~:save-block\"|} request.body;
            assert_contains ~name:"upsert asset update uuid"
              {|~u99999999-9999-9999-9999-999999999999|} request.body;
            assert_contains ~name:"upsert asset update title" {|Updated asset|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "upsert";
                      "asset";
                      "--id";
                      "9";
                      "--content";
                      "Updated asset";
                    ]))
          in
          assert_int ~name:"upsert asset update exit" 0 output.exit_code;
          assert_equal ~name:"upsert asset update json"
            {|{"status":"ok","data":{"result":[9]}}|}
            (String.trim (cli_stdout output));
          match output.lifecycle.action with
          | Some (Cli_action.Upsert (Upsert.Upsert_asset action)) -> (
              (match action.mode with
              | Upsert.Update -> ()
              | _ -> failf "expected upsert asset update mode");
              (match action.id with
              | Some 9L -> ()
              | _ -> failf "expected upsert asset id");
              match action.content with
              | Some "Updated asset" -> ()
              | _ -> failf "expected upsert asset content")
          | _ -> failf "expected typed upsert asset action"));

  check "Cli.run rejects upsert asset id type mismatch" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"upsert asset type mismatch pull line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert asset type mismatch pull id" {|,9]|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",9,\"~:block/uuid\",\"~u99999999-9999-9999-9999-999999999999\",\"~:block/title\",\"Not asset\"]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "upsert";
                      "asset";
                      "--id";
                      "9";
                      "--content";
                      "Updated asset";
                    ]))
          in
          assert_int ~name:"upsert asset type mismatch exit" 1 output.exit_code;
          assert_equal ~name:"upsert asset type mismatch json"
            {|{"status":"error","error":{"code":"upsert-id-type-mismatch","message":"id must be a node tagged with #Asset"}}|}
            (String.trim (cli_stdout output))));

  check "Cli.run rejects upsert asset create without path" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let output =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "upsert";
                  "asset";
                  "--content";
                  "Asset title";
                ]))
      in
      assert_int ~name:"upsert asset missing path exit" 1 output.exit_code;
      assert_equal ~name:"upsert asset missing path json"
        {|{"status":"error","error":{"code":"invalid-options","message":"--path is required in create mode"}}|}
        (String.trim (cli_stdout output)));

  check "Cli.run rejects upsert asset update target options" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let output =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "upsert";
                  "asset";
                  "--id";
                  "9";
                  "--target-page";
                  "Home";
                  "--content";
                  "Asset title";
                ]))
      in
      assert_int ~name:"upsert asset update target exit" 1 output.exit_code;
      assert_equal ~name:"upsert asset update target json"
        {|{"status":"error","error":{"code":"invalid-options","message":"--target-* and --pos are only valid in create mode"}}|}
        (String.trim (cli_stdout output)));

  check "Cli.run rejects upsert invalid uuid options" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let task_uuid =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "upsert";
                  "task";
                  "--uuid";
                  "not-a-uuid";
                  "--status";
                  "todo";
                ]))
      in
      assert_int ~name:"upsert task invalid uuid exit" 1 task_uuid.exit_code;
      assert_equal ~name:"upsert task invalid uuid json"
        {|{"status":"error","error":{"code":"invalid-options","message":"Option uuid must be a valid UUID string"}}|}
        (String.trim (cli_stdout task_uuid));
      let asset_uuid =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "upsert";
                  "asset";
                  "--uuid";
                  "zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz";
                  "--content";
                  "Updated asset";
                ]))
      in
      assert_int ~name:"upsert asset invalid uuid exit" 1 asset_uuid.exit_code;
      assert_equal ~name:"upsert asset invalid uuid json"
        {|{"status":"error","error":{"code":"invalid-options","message":"Option uuid must be a valid UUID string"}}|}
        (String.trim (cli_stdout asset_uuid));
      let block_target_uuid =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "upsert";
                  "block";
                  "--target-uuid";
                  "not-a-uuid";
                  "--content";
                  "New block";
                ]))
      in
      assert_int ~name:"upsert block invalid target uuid exit" 1
        block_target_uuid.exit_code;
      assert_equal ~name:"upsert block invalid target uuid json"
        {|{"status":"error","error":{"code":"invalid-options","message":"Option target-uuid must be a valid UUID string"}}|}
        (String.trim (cli_stdout block_target_uuid)));

  check "Cli.run creates upsert task block on target page" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"upsert task create status q line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert task create status q method"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"upsert task create status property"
              {|\"~:logseq.property/status\"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"~:logseq.property/status.todo\",\"~:logseq.property/status.doing\"]"}|}
            ));
          (fun request ->
            assert_equal ~name:"upsert task create tag pull line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert task create tag pull method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"upsert task create tag ident"
              {|\"~:logseq.class/Task\"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",12]"}|} ));
          (fun request ->
            assert_equal ~name:"upsert task create target page q line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert task create target page q method"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"upsert task create target page q name"
              {|home|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[\"^ \",\"~:db/id\",4,\"~:block/uuid\",\"~u22222222-2222-2222-2222-222222222222\",\"~:block/title\",\"Home\",\"~:block/name\",\"home\"]]"}|}
            ));
          (fun request ->
            assert_equal ~name:"upsert task create insert line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert task create insert method"
              {|"method":"thread-api/apply-outliner-ops"|} request.body;
            assert_contains ~name:"upsert task create insert op"
              {|\"~:insert-blocks\"|} request.body;
            assert_contains ~name:"upsert task create insert title"
              {|Ship release|} request.body;
            assert_contains ~name:"upsert task create insert target uuid"
              {|~u22222222-2222-2222-2222-222222222222|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:tx-data\",[[\"^ \",\"~:db/id\",8,\"~:block/uuid\",\"~u33333333-3333-3333-3333-333333333333\"]]]"}|}
            ));
          (fun request ->
            assert_equal ~name:"upsert task create pull created line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert task create pull created method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"upsert task create pull created uuid"
              {|~u33333333-3333-3333-3333-333333333333|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",8,\"~:block/uuid\",\"~u33333333-3333-3333-3333-333333333333\"]"}|}
            ));
          (fun request ->
            assert_equal ~name:"upsert task create apply line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert task create apply method"
              {|"method":"thread-api/apply-outliner-ops"|} request.body;
            assert_contains ~name:"upsert task create apply set op"
              {|\"~:batch-set-property\"|} request.body;
            assert_contains ~name:"upsert task create apply uuid" {|~u|}
              request.body;
            assert_contains ~name:"upsert task create apply tag id" {|,12,|}
              request.body;
            assert_contains ~name:"upsert task create apply status property"
              {|\"~:logseq.property/status\"|} request.body;
            assert_contains ~name:"upsert task create apply status value"
              {|\"~:logseq.property/status.todo\"|} request.body;
            assert_contains ~name:"upsert task create apply priority property"
              {|\"~:logseq.property/priority\"|} request.body;
            assert_contains ~name:"upsert task create apply priority value"
              {|\"~:logseq.property/priority.high\"|} request.body;
            assert_contains ~name:"upsert task create apply scheduled property"
              {|\"~:logseq.property/scheduled\"|} request.body;
            assert_contains ~name:"upsert task create apply scheduled value"
              {|2026-06-02|} request.body;
            assert_contains ~name:"upsert task create apply deadline property"
              {|\"~:logseq.property/deadline\"|} request.body;
            assert_contains ~name:"upsert task create apply deadline value"
              {|2026-06-05|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "upsert";
                      "task";
                      "--content";
                      "Ship release";
                      "--target-page";
                      "Home";
                      "--status";
                      "todo";
                      "--priority";
                      "high";
                      "--scheduled";
                      "2026-06-02";
                      "--deadline";
                      "2026-06-05";
                    ]))
          in
          assert_int ~name:"upsert task create exit" 0 output.exit_code;
          assert_equal ~name:"upsert task create json"
            {|{"status":"ok","data":{"result":[8]}}|}
            (String.trim (cli_stdout output));
          match output.lifecycle.action with
          | Some (Cli_action.Upsert (Upsert.Upsert_task action)) -> (
              (match action.mode with
              | Upsert.Create -> ()
              | _ -> failf "expected upsert task create mode");
              (match action.page with
              | Some "Home" -> ()
              | _ -> failf "expected upsert task create target page");
              (match action.content with
              | Some "Ship release" -> ()
              | _ -> failf "expected upsert task create content");
              match action.status_input with
              | Some "todo" -> ()
              | _ -> failf "expected upsert task create status")
          | _ -> failf "expected typed upsert task create action"));

  check "Cli.run creates upsert task in today journal when target is absent"
    (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let today = today_default_journal_title () in
      let today_name = String.lowercase_ascii today in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"upsert task default journal status q line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert task default journal status q method"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"upsert task default journal status property"
              {|\"~:logseq.property/status\"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"~:logseq.property/status.todo\",\"~:logseq.property/status.doing\"]"}|}
            ));
          (fun request ->
            assert_equal ~name:"upsert task default journal tag pull line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert task default journal tag pull method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"upsert task default journal tag ident"
              {|\"~:logseq.class/Task\"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",12]"}|} ));
          (fun request ->
            assert_equal ~name:"upsert task default journal page q line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert task default journal page q method"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"upsert task default journal page name"
              today_name request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              Printf.sprintf
                {|{"resultTransit":"[[\"^ \",\"~:db/id\",4,\"~:block/uuid\",\"~u22222222-2222-2222-2222-222222222222\",\"~:block/title\",\"%s\",\"~:block/name\",\"%s\"]]"}|}
                today today_name ));
          (fun request ->
            assert_equal ~name:"upsert task default journal insert line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert task default journal insert method"
              {|"method":"thread-api/apply-outliner-ops"|} request.body;
            assert_contains ~name:"upsert task default journal insert op"
              {|\"~:insert-blocks\"|} request.body;
            assert_contains ~name:"upsert task default journal insert title"
              {|Task for today|} request.body;
            assert_contains ~name:"upsert task default journal target uuid"
              {|~u22222222-2222-2222-2222-222222222222|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:tx-data\",[[\"^ \",\"~:db/id\",8,\"~:block/uuid\",\"~u33333333-3333-3333-3333-333333333333\"]]]"}|}
            ));
          (fun request ->
            assert_equal ~name:"upsert task default journal pull created line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains
              ~name:"upsert task default journal pull created uuid"
              {|~u33333333-3333-3333-3333-333333333333|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",8,\"~:block/uuid\",\"~u33333333-3333-3333-3333-333333333333\"]"}|}
            ));
          (fun request ->
            assert_equal ~name:"upsert task default journal apply line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert task default journal apply method"
              {|"method":"thread-api/apply-outliner-ops"|} request.body;
            assert_contains ~name:"upsert task default journal apply set op"
              {|\"~:batch-set-property\"|} request.body;
            assert_contains ~name:"upsert task default journal apply tag id"
              {|,12,|} request.body;
            assert_contains ~name:"upsert task default journal status value"
              {|\"~:logseq.property/status.todo\"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "upsert";
                      "task";
                      "--content";
                      "Task for today";
                      "--status";
                      "todo";
                    ]))
          in
          assert_int ~name:"upsert task default journal exit" 0 output.exit_code;
          assert_equal ~name:"upsert task default journal json"
            {|{"status":"ok","data":{"result":[8]}}|}
            (String.trim (cli_stdout output));
          match output.lifecycle.action with
          | Some (Cli_action.Upsert (Upsert.Upsert_task action)) -> (
              (match action.mode with
              | Upsert.Create -> ()
              | _ -> failf "expected upsert task default journal create mode");
              (match action.page with
              | Some page when page = today -> ()
              | _ -> failf "expected upsert task default journal page");
              (match action.content with
              | Some "Task for today" -> ()
              | _ -> failf "expected upsert task default journal content");
              match action.status_input with
              | Some "todo" -> ()
              | _ -> failf "expected upsert task default journal status")
          | _ -> failf "expected typed upsert task create action"));

  check
    "Cli.run rejects upsert task create target id until spec carries create \
     target selectors" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let output =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "upsert";
                  "task";
                  "--content";
                  "Ship release";
                  "--target-id";
                  "4";
                  "--status";
                  "todo";
                ]))
      in
      assert_int ~name:"upsert task create target id exit" 1 output.exit_code;
      assert_equal ~name:"upsert task create target id json"
        {|{"status":"error","error":{"code":"spec-blocker","message":"upsert task create currently supports only --target-page because spec/l3/upsert.mli does not carry target id, target uuid, or pos in Upsert_task actions"}}|}
        (String.trim (cli_stdout output)));

  check "Cli.run applies upsert task page status" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"upsert task status q line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert task status q method"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"upsert task status property"
              {|\"~:logseq.property/status\"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"~:logseq.property/status.todo\",\"~:logseq.property/status.doing\"]"}|}
            ));
          (fun request ->
            assert_equal ~name:"upsert task tag pull line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert task tag pull method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"upsert task tag ident"
              {|\"~:logseq.class/Task\"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",12]"}|} ));
          (fun request ->
            assert_equal ~name:"upsert task page q line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert task page q method"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"upsert task page q name" {|weekly plan|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[\"^ \",\"~:db/id\",4,\"~:block/uuid\",\"~u22222222-2222-2222-2222-222222222222\",\"~:block/title\",\"Weekly Plan\",\"~:block/name\",\"weekly plan\"]]"}|}
            ));
          (fun request ->
            assert_equal ~name:"upsert task apply line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert task apply method"
              {|"method":"thread-api/apply-outliner-ops"|} request.body;
            assert_contains ~name:"upsert task apply set op"
              {|\"~:batch-set-property\"|} request.body;
            assert_contains ~name:"upsert task apply page uuid"
              {|~u22222222-2222-2222-2222-222222222222|} request.body;
            assert_contains ~name:"upsert task apply tag id" {|,12,|}
              request.body;
            assert_contains ~name:"upsert task apply status property"
              {|\"~:logseq.property/status\"|} request.body;
            assert_contains ~name:"upsert task apply status value"
              {|\"~:logseq.property/status.todo\"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "upsert";
                      "task";
                      "--page";
                      "Weekly Plan";
                      "--status";
                      "todo";
                    ]))
          in
          assert_int ~name:"upsert task page status exit" 0 output.exit_code;
          assert_equal ~name:"upsert task page status json"
            {|{"status":"ok","data":{"result":[4]}}|}
            (String.trim (cli_stdout output));
          match output.lifecycle.action with
          | Some (Cli_action.Upsert (Upsert.Upsert_task action)) -> (
              (match action.mode with
              | Upsert.Page -> ()
              | _ -> failf "expected upsert task page mode");
              (match action.page with
              | Some "Weekly Plan" -> ()
              | _ -> failf "expected upsert task page");
              match action.status_input with
              | Some "todo" -> ()
              | _ -> failf "expected upsert task status")
          | _ -> failf "expected typed upsert task action"));

  check "Cli.run applies upsert task update status" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"upsert task update status q line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert task update status q method"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"upsert task update status property"
              {|\"~:logseq.property/status\"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"~:logseq.property/status.todo\",\"~:logseq.property/status.doing\"]"}|}
            ));
          (fun request ->
            assert_equal ~name:"upsert task update tag pull line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert task update tag method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"upsert task update tag ident"
              {|\"~:logseq.class/Task\"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",12]"}|} ));
          (fun request ->
            assert_equal ~name:"upsert task update node pull line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert task update node method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"upsert task update node id" {|,8]|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",8,\"~:block/uuid\",\"~u33333333-3333-3333-3333-333333333333\",\"~:block/title\",\"Ship release\"]"}|}
            ));
          (fun request ->
            assert_equal ~name:"upsert task update apply line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert task update apply method"
              {|"method":"thread-api/apply-outliner-ops"|} request.body;
            assert_contains ~name:"upsert task update apply set op"
              {|\"~:batch-set-property\"|} request.body;
            assert_contains ~name:"upsert task update uuid"
              {|~u33333333-3333-3333-3333-333333333333|} request.body;
            assert_contains ~name:"upsert task update tag id" {|,12,|}
              request.body;
            assert_contains ~name:"upsert task update status property"
              {|\"~:logseq.property/status\"|} request.body;
            assert_contains ~name:"upsert task update status value"
              {|\"~:logseq.property/status.todo\"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "upsert";
                      "task";
                      "--id";
                      "8";
                      "--status";
                      "todo";
                    ]))
          in
          assert_int ~name:"upsert task update status exit" 0 output.exit_code;
          assert_equal ~name:"upsert task update status json"
            {|{"status":"ok","data":{"result":[8]}}|}
            (String.trim (cli_stdout output));
          match output.lifecycle.action with
          | Some (Cli_action.Upsert (Upsert.Upsert_task action)) -> (
              (match action.mode with
              | Upsert.Update -> ()
              | _ -> failf "expected upsert task update mode");
              (match action.id with
              | Some 8L -> ()
              | _ -> failf "expected upsert task id");
              match action.status_input with
              | Some "todo" -> ()
              | _ -> failf "expected upsert task update status")
          | _ -> failf "expected typed upsert task update action"));

  check "Cli.run applies upsert task update priority" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"upsert task priority tag pull line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert task priority tag method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"upsert task priority tag ident"
              {|\"~:logseq.class/Task\"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",12]"}|} ));
          (fun request ->
            assert_equal ~name:"upsert task priority node pull line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert task priority node method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"upsert task priority node id" {|,8]|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",8,\"~:block/uuid\",\"~u33333333-3333-3333-3333-333333333333\",\"~:block/title\",\"Ship release\"]"}|}
            ));
          (fun request ->
            assert_equal ~name:"upsert task priority apply line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert task priority apply method"
              {|"method":"thread-api/apply-outliner-ops"|} request.body;
            assert_contains ~name:"upsert task priority apply set op"
              {|\"~:batch-set-property\"|} request.body;
            assert_contains ~name:"upsert task priority uuid"
              {|~u33333333-3333-3333-3333-333333333333|} request.body;
            assert_contains ~name:"upsert task priority property"
              {|\"~:logseq.property/priority\"|} request.body;
            assert_contains ~name:"upsert task priority value"
              {|\"~:logseq.property/priority.high\"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "upsert";
                      "task";
                      "--id";
                      "8";
                      "--priority";
                      "high";
                    ]))
          in
          assert_int ~name:"upsert task priority exit" 0 output.exit_code;
          assert_equal ~name:"upsert task priority json"
            {|{"status":"ok","data":{"result":[8]}}|}
            (String.trim (cli_stdout output));
          match output.lifecycle.action with
          | Some (Cli_action.Upsert (Upsert.Upsert_task action)) -> (
              (match action.mode with
              | Upsert.Update -> ()
              | _ -> failf "expected upsert task priority update mode");
              match action.update_properties with
              | [ { Property.key = Property.Key_ident key; value } ]
                when key = Edn_util.keyword_t ":logseq.property/priority"
                     && Edn_util.as_keyword value
                        = Some ":logseq.property/priority.high" ->
                  ()
              | _ -> failf "expected upsert task priority property")
          | _ -> failf "expected typed upsert task priority action"));

  check "Cli.run rejects invalid upsert task priority" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let output =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "upsert";
                  "task";
                  "--id";
                  "8";
                  "--priority";
                  "soon";
                ]))
      in
      assert_int ~name:"upsert task invalid priority exit" 1 output.exit_code;
      assert_equal ~name:"upsert task invalid priority json"
        {|{"status":"error","error":{"code":"invalid-options","message":"Invalid value for option :priority: soon. Available values: low, medium, high, urgent"}}|}
        (String.trim (cli_stdout output)));

  check "Cli.run rejects upsert task conflicting selectors" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let output =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "upsert";
                  "task";
                  "--id";
                  "8";
                  "--uuid";
                  "33333333-3333-3333-3333-333333333333";
                  "--status";
                  "todo";
                ]))
      in
      assert_int ~name:"upsert task selector conflict exit" 1 output.exit_code;
      assert_equal ~name:"upsert task selector conflict json"
        {|{"status":"error","error":{"code":"invalid-options","message":"only one of --id, --uuid, or --page is allowed"}}|}
        (String.trim (cli_stdout output)));

  check "Cli.run rejects upsert task page with content" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let output =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "upsert";
                  "task";
                  "--page";
                  "Weekly Plan";
                  "--content";
                  "Ship release";
                  "--status";
                  "todo";
                ]))
      in
      assert_int ~name:"upsert task page content exit" 1 output.exit_code;
      assert_equal ~name:"upsert task page content json"
        {|{"status":"error","error":{"code":"invalid-options","message":"--content and --page are mutually exclusive"}}|}
        (String.trim (cli_stdout output)));

  check "Cli.run rejects upsert task set and clear status" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let output =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "upsert";
                  "task";
                  "--id";
                  "8";
                  "--status";
                  "todo";
                  "--no-status";
                ]))
      in
      assert_int ~name:"upsert task status clear conflict exit" 1
        output.exit_code;
      assert_equal ~name:"upsert task status clear conflict json"
        {|{"status":"error","error":{"code":"invalid-options","message":"--status and --no-status are mutually exclusive"}}|}
        (String.trim (cli_stdout output)));

  check "Cli.run executes upsert block create through typed action" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"upsert block target page q line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert block target page q method"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"upsert block target page q name" {|home|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[\"^ \",\"~:db/id\",4,\"~:block/uuid\",\"~u22222222-2222-2222-2222-222222222222\",\"~:block/title\",\"Home\",\"~:block/name\",\"home\"]]"}|}
            ));
          (fun request ->
            assert_equal ~name:"upsert block apply line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert block apply method"
              {|"method":"thread-api/apply-outliner-ops"|} request.body;
            assert_contains ~name:"upsert block insert op"
              {|\"~:insert-blocks\"|} request.body;
            assert_contains ~name:"upsert block title" {|New block|}
              request.body;
            assert_contains ~name:"upsert block target uuid"
              {|~u22222222-2222-2222-2222-222222222222|} request.body;
            assert_contains ~name:"upsert block keep uuid" {|\"~:keep-uuid?\"|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:tx-data\",[[\"^ \",\"~:db/id\",8,\"~:block/uuid\",\"~u33333333-3333-3333-3333-333333333333\"]]]"}|}
            ));
          (fun request ->
            assert_equal ~name:"upsert block pull created line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert block pull created method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"upsert block pull created uuid"
              {|~u33333333-3333-3333-3333-333333333333|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",8,\"~:block/uuid\",\"~u33333333-3333-3333-3333-333333333333\"]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "upsert";
                      "block";
                      "--target-page";
                      "Home";
                      "--content";
                      "New block";
                    ]))
          in
          assert_int ~name:"upsert block create exit" 0 output.exit_code;
          assert_equal ~name:"upsert block create json"
            {|{"status":"ok","data":{"result":[8]}}|}
            (String.trim (cli_stdout output));
          match output.lifecycle.action with
          | Some
              (Cli_action.Upsert
                 (Upsert.Upsert_block (Upsert.Block_create action))) ->
              (match action.target with
              | Upsert.Target_page "Home" -> ()
              | _ -> failf "expected upsert block create target page");
              (match action.blocks with
              | block :: _ when block.Block.title = Some "New block" -> ()
              | _ -> failf "expected upsert block create content");
              assert_bool ~name:"upsert block create empty update plan" true
                (action.update_plan.Property.update_tags = []
                && action.update_plan.update_properties = []
                && action.update_plan.remove_tags = []
                && action.update_plan.remove_properties = [])
          | _ -> failf "expected typed upsert block create action"));

  check "Cli.run creates upsert block from positional content" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"upsert block args target page q line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert block args target page q method"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"upsert block args target page q name"
              {|home|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[\"^ \",\"~:db/id\",4,\"~:block/uuid\",\"~u22222222-2222-2222-2222-222222222222\",\"~:block/title\",\"Home\",\"~:block/name\",\"home\"]]"}|}
            ));
          (fun request ->
            assert_equal ~name:"upsert block args apply line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert block args apply method"
              {|"method":"thread-api/apply-outliner-ops"|} request.body;
            assert_contains ~name:"upsert block args insert op"
              {|\"~:insert-blocks\"|} request.body;
            assert_contains ~name:"upsert block args title"
              {|Positional block title|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:tx-data\",[[\"^ \",\"~:db/id\",8,\"~:block/uuid\",\"~u33333333-3333-3333-3333-333333333333\"]]]"}|}
            ));
          (fun request ->
            assert_equal ~name:"upsert block args pull created line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert block args pull created uuid"
              {|~u33333333-3333-3333-3333-333333333333|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",8,\"~:block/uuid\",\"~u33333333-3333-3333-3333-333333333333\"]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "upsert";
                      "block";
                      "--target-page";
                      "Home";
                      "Positional";
                      "block";
                      "title";
                    ]))
          in
          assert_int ~name:"upsert block args exit" 0 output.exit_code;
          assert_equal ~name:"upsert block args json"
            {|{"status":"ok","data":{"result":[8]}}|}
            (String.trim (cli_stdout output));
          match output.lifecycle.action with
          | Some
              (Cli_action.Upsert
                 (Upsert.Upsert_block (Upsert.Block_create action))) -> (
              match action.blocks with
              | [ block ] ->
                  assert_opt_string ~name:"upsert block args action title"
                    (Some "Positional block title") block.Block.title
              | _ -> failf "expected one positional content block")
          | _ -> failf "expected typed upsert block create action"));

  check "Cli.run creates upsert block in today journal when target is absent"
    (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let today = today_default_journal_title () in
      let today_name = String.lowercase_ascii today in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"upsert block default journal page q line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert block default journal page q method"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"upsert block default journal page name"
              today_name request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              Printf.sprintf
                {|{"resultTransit":"[[\"^ \",\"~:db/id\",4,\"~:block/uuid\",\"~u22222222-2222-2222-2222-222222222222\",\"~:block/title\",\"%s\",\"~:block/name\",\"%s\"]]"}|}
                today today_name ));
          (fun request ->
            assert_equal ~name:"upsert block default journal apply line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert block default journal apply method"
              {|"method":"thread-api/apply-outliner-ops"|} request.body;
            assert_contains ~name:"upsert block default journal insert op"
              {|\"~:insert-blocks\"|} request.body;
            assert_contains ~name:"upsert block default journal title"
              {|Block for today|} request.body;
            assert_contains ~name:"upsert block default journal target uuid"
              {|~u22222222-2222-2222-2222-222222222222|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:tx-data\",[[\"^ \",\"~:db/id\",8,\"~:block/uuid\",\"~u33333333-3333-3333-3333-333333333333\"]]]"}|}
            ));
          (fun request ->
            assert_equal ~name:"upsert block default journal pull created line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains
              ~name:"upsert block default journal pull created uuid"
              {|~u33333333-3333-3333-3333-333333333333|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",8,\"~:block/uuid\",\"~u33333333-3333-3333-3333-333333333333\"]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "upsert";
                      "block";
                      "--content";
                      "Block for today";
                    ]))
          in
          assert_int ~name:"upsert block default journal exit" 0
            output.exit_code;
          assert_equal ~name:"upsert block default journal json"
            {|{"status":"ok","data":{"result":[8]}}|}
            (String.trim (cli_stdout output));
          match output.lifecycle.action with
          | Some
              (Cli_action.Upsert
                 (Upsert.Upsert_block (Upsert.Block_create action))) -> (
              match action.target with
              | Upsert.Target_page page when page = today -> ()
              | _ -> failf "expected today journal target page")
          | _ -> failf "expected typed upsert block create action"));

  check "Cli.run inserts nested upsert block trees with parent metadata"
    (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"nested block target page q line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"nested block target page q method"
              {|"method":"thread-api/q"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[\"^ \",\"~:db/id\",4,\"~:block/uuid\",\"~u22222222-2222-2222-2222-222222222222\",\"~:block/title\",\"Home\",\"~:block/name\",\"home\"]]"}|}
            ));
          (fun request ->
            assert_equal ~name:"nested block apply line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"nested block apply method"
              {|"method":"thread-api/apply-outliner-ops"|} request.body;
            assert_contains ~name:"nested block insert op"
              {|\"~:insert-blocks\"|} request.body;
            assert_contains ~name:"nested block parent title" {|Parent|}
              request.body;
            assert_contains ~name:"nested block child title" {|Child|}
              request.body;
            assert_contains ~name:"nested block parent attr"
              {|\"~:block/parent\"|} request.body;
            assert_contains ~name:"nested block parent lookup attr"
              {|\"~:block/uuid\"|} request.body;
            assert_not_contains ~name:"nested block children stripped"
              {|\"~:block/children\"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:tx-data\",[[\"^ \",\"~:db/id\",8,\"~:block/uuid\",\"~u33333333-3333-3333-3333-333333333333\"],[\"^ \",\"~:db/id\",9,\"~:block/uuid\",\"~u44444444-4444-4444-4444-444444444444\"]]]"}|}
            ));
          (fun request ->
            assert_equal ~name:"nested block pull parent line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"nested block pull parent uuid"
              {|~u33333333-3333-3333-3333-333333333333|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",8,\"~:block/uuid\",\"~u33333333-3333-3333-3333-333333333333\"]"}|}
            ));
          (fun request ->
            assert_equal ~name:"nested block pull child line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"nested block pull child uuid"
              {|~u44444444-4444-4444-4444-444444444444|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",9,\"~:block/uuid\",\"~u44444444-4444-4444-4444-444444444444\"]"}|}
            ));
        ]
        (fun base_url ->
          let blocks =
            {|[{:block/title "Parent" :block/children [{:block/title "Child"}]}]|}
          in
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "upsert";
                      "block";
                      "--target-page";
                      "Home";
                      "--blocks";
                      blocks;
                    ]))
          in
          assert_int ~name:"nested block create exit" 0 output.exit_code;
          assert_equal ~name:"nested block create json"
            {|{"status":"ok","data":{"result":[8,9]}}|}
            (String.trim (cli_stdout output))));

  check "Cli.run rejects upsert block create without content" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let output =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "upsert";
                  "block";
                  "--target-page";
                  "Home";
                ]))
      in
      assert_int ~name:"upsert block missing content exit" 1 output.exit_code;
      assert_equal ~name:"upsert block missing content json"
        {|{"status":"error","error":{"code":"missing-content","message":"content is required"}}|}
        (String.trim (cli_stdout output)));

  check "Cli.run rejects upsert block create remove metadata options" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let remove_tags =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "upsert";
                  "block";
                  "--target-page";
                  "Home";
                  "--content";
                  "New block";
                  "--remove-tags";
                  "[\"Project\"]";
                ]))
      in
      assert_int ~name:"upsert block create remove tags exit" 1
        remove_tags.exit_code;
      assert_equal ~name:"upsert block create remove tags json"
        {|{"status":"error","error":{"code":"invalid-options","message":"--remove-tags and --remove-properties are only for update mode"}}|}
        (String.trim (cli_stdout remove_tags));
      let remove_properties =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "upsert";
                  "block";
                  "--target-page";
                  "Home";
                  "--content";
                  "New block";
                  "--remove-properties";
                  "[:logseq.property/owner]";
                ]))
      in
      assert_int ~name:"upsert block create remove properties exit" 1
        remove_properties.exit_code;
      assert_equal ~name:"upsert block create remove properties json"
        {|{"status":"error","error":{"code":"invalid-options","message":"--remove-tags and --remove-properties are only for update mode"}}|}
        (String.trim (cli_stdout remove_properties)));

  check "Cli.run validates upsert block update options before update blocker"
    (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let run args =
        run_blocking
          (Cli.run app
             (cli_input
                ("--graph" :: "alpha" :: "--output" :: "json" :: "upsert"
               :: "block" :: args)))
      in
      let source_conflict =
        run
          [
            "--id";
            "8";
            "--uuid";
            "11111111-1111-1111-1111-111111111111";
            "--content";
            "Updated";
          ]
      in
      assert_int ~name:"upsert block update source conflict exit" 1
        source_conflict.exit_code;
      assert_equal ~name:"upsert block update source conflict json"
        {|{"status":"error","error":{"code":"invalid-options","message":"only one of --id or --uuid is allowed"}}|}
        (String.trim (cli_stdout source_conflict));
      let target_conflict =
        run
          [
            "--id";
            "8";
            "--target-id";
            "9";
            "--target-page";
            "Home";
            "--content";
            "Updated";
          ]
      in
      assert_int ~name:"upsert block update target conflict exit" 1
        target_conflict.exit_code;
      assert_equal ~name:"upsert block update target conflict json"
        {|{"status":"error","error":{"code":"invalid-options","message":"only one of --target-id, --target-uuid, or --target-page is allowed"}}|}
        (String.trim (cli_stdout target_conflict));
      let pos_without_target =
        run [ "--id"; "8"; "--pos"; "last-child"; "--content"; "Updated" ]
      in
      assert_int ~name:"upsert block update pos without target exit" 1
        pos_without_target.exit_code;
      assert_equal ~name:"upsert block update pos without target json"
        {|{"status":"error","error":{"code":"invalid-options","message":"--pos is only valid when a target option is provided"}}|}
        (String.trim (cli_stdout pos_without_target));
      let blocks_in_update =
        run
          [
            "--id";
            "8";
            "--content";
            "Updated";
            "--blocks";
            "[{:block/title \"Nested\"}]";
          ]
      in
      assert_int ~name:"upsert block update blocks exit" 1
        blocks_in_update.exit_code;
      assert_equal ~name:"upsert block update blocks json"
        {|{"status":"error","error":{"code":"invalid-options","message":"--blocks and --blocks-file are only for create mode"}}|}
        (String.trim (cli_stdout blocks_in_update)));

  check "Cli.run applies upsert block create tag and property updates"
    (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"upsert block ops target page q line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert block ops target page q method"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"upsert block ops target page q name" {|home|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[\"^ \",\"~:db/id\",4,\"~:block/uuid\",\"~u22222222-2222-2222-2222-222222222222\",\"~:block/title\",\"Home\",\"~:block/name\",\"home\"]]"}|}
            ));
          (fun request ->
            assert_equal ~name:"upsert block ops insert line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert block ops insert method"
              {|"method":"thread-api/apply-outliner-ops"|} request.body;
            assert_contains ~name:"upsert block ops insert op"
              {|\"~:insert-blocks\"|} request.body;
            assert_contains ~name:"upsert block ops insert title" {|New block|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:tx-data\",[[\"^ \",\"~:db/id\",8,\"~:block/uuid\",\"~u33333333-3333-3333-3333-333333333333\"]]]"}|}
            ));
          (fun request ->
            assert_equal ~name:"upsert block ops pull created id line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert block ops pull created id method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"upsert block ops pull created id uuid"
              {|~u33333333-3333-3333-3333-333333333333|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",8,\"~:block/uuid\",\"~u33333333-3333-3333-3333-333333333333\"]"}|}
            ));
          (fun request ->
            assert_equal ~name:"upsert block ops resolve tag line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert block ops resolve tag method"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"upsert block ops resolve tag name"
              {|project|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[\"^ \",\"~:db/id\",6,\"~:block/title\",\"Project\",\"~:block/name\",\"project\",\"~:block/tags\",[[\"^ \",\"~:db/ident\",\"~:logseq.class/Tag\"]]]]"}|}
            ));
          (fun request ->
            assert_equal ~name:"upsert block ops ensure property line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert block ops ensure property method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"upsert block ops ensure property ident"
              {|\"~:logseq.property/owner\"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",7]"}|} ));
          (fun request ->
            assert_equal ~name:"upsert block ops resolve created uuid line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert block ops resolve created uuid method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"upsert block ops resolve created uuid id"
              {|,8]|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",8,\"~:block/uuid\",\"~u33333333-3333-3333-3333-333333333333\"]"}|}
            ));
          (fun request ->
            assert_equal ~name:"upsert block ops apply line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert block ops apply method"
              {|"method":"thread-api/apply-outliner-ops"|} request.body;
            assert_contains ~name:"upsert block ops set op"
              {|\"~:batch-set-property\"|} request.body;
            assert_contains ~name:"upsert block ops created uuid"
              {|~u33333333-3333-3333-3333-333333333333|} request.body;
            assert_contains ~name:"upsert block ops block tags"
              {|\"~:block/tags\"|} request.body;
            assert_contains ~name:"upsert block ops tag id" {|,6,|} request.body;
            assert_contains ~name:"upsert block ops owner ident"
              {|\"~:logseq.property/owner\"|} request.body;
            assert_contains ~name:"upsert block ops owner value" {|Alice|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "upsert";
                      "block";
                      "--target-page";
                      "Home";
                      "--content";
                      "New block";
                      "--update-tags";
                      "[\"Project\"]";
                      "--update-properties";
                      "{:logseq.property/owner \"Alice\"}";
                    ]))
          in
          assert_int ~name:"upsert block ops exit" 0 output.exit_code;
          assert_equal ~name:"upsert block ops json"
            {|{"status":"ok","data":{"result":[8]}}|}
            (String.trim (cli_stdout output))));

  check "Cli.run executes upsert page create through typed action" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"upsert page create q line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert page create q method"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"upsert page create q name" {|home|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[]"}|} ));
          (fun request ->
            assert_equal ~name:"upsert page create apply line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert page create apply method"
              {|"method":"thread-api/apply-outliner-ops"|} request.body;
            assert_contains ~name:"upsert page create op" {|\"~:create-page\"|}
              request.body;
            assert_contains ~name:"upsert page create name" {|Home|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"Home\",\"~u22222222-2222-2222-2222-222222222222\"]"}|}
            ));
          (fun request ->
            assert_equal ~name:"upsert page create pull line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert page create pull method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"upsert page create pull uuid"
              {|~u22222222-2222-2222-2222-222222222222|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",4,\"~:block/uuid\",\"~u22222222-2222-2222-2222-222222222222\"]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "upsert";
                      "page";
                      "--page";
                      "Home";
                    ]))
          in
          assert_int ~name:"upsert page create exit" 0 output.exit_code;
          assert_equal ~name:"upsert page create json"
            {|{"status":"ok","data":{"result":[4]}}|}
            (String.trim (cli_stdout output));
          match output.lifecycle.action with
          | Some (Cli_action.Upsert (Upsert.Upsert_page action)) -> (
              (match action.mode with
              | Upsert.Create -> ()
              | _ -> failf "expected upsert page create mode");
              match action.page with
              | Some "Home" -> ()
              | _ -> failf "expected upsert page name")
          | _ -> failf "expected typed upsert page action"));

  check "Cli.run executes upsert page update by id" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"upsert page update pull line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert page update pull method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"upsert page update pull id" {|,4]|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",4,\"~:block/uuid\",\"~u22222222-2222-2222-2222-222222222222\",\"~:block/name\",\"home\",\"~:block/title\",\"Home\"]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "upsert";
                      "page";
                      "--id";
                      "4";
                    ]))
          in
          assert_int ~name:"upsert page update exit" 0 output.exit_code;
          assert_equal ~name:"upsert page update json"
            {|{"status":"ok","data":{"result":[4]}}|}
            (String.trim (cli_stdout output));
          match output.lifecycle.action with
          | Some (Cli_action.Upsert (Upsert.Upsert_page action)) -> (
              (match action.mode with
              | Upsert.Update -> ()
              | _ -> failf "expected upsert page update mode");
              match action.id with
              | Some 4L -> ()
              | _ -> failf "expected upsert page id")
          | _ -> failf "expected typed upsert page action"));

  check "Cli.run applies upsert page tag and property updates" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"upsert page ops pull page line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert page ops pull page method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"upsert page ops pull page id" {|,4]|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",4,\"~:block/uuid\",\"~u22222222-2222-2222-2222-222222222222\",\"~:block/name\",\"home\",\"~:block/title\",\"Home\"]"}|}
            ));
          (fun request ->
            assert_equal ~name:"upsert page ops resolve tag line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert page ops resolve tag method"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"upsert page ops resolve tag name" {|project|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[\"^ \",\"~:db/id\",6,\"~:block/title\",\"Project\",\"~:block/name\",\"project\",\"~:block/tags\",[[\"^ \",\"~:db/ident\",\"~:logseq.class/Tag\"]]]]"}|}
            ));
          (fun request ->
            assert_equal ~name:"upsert page ops ensure property line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert page ops ensure property method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"upsert page ops ensure property ident"
              {|\"~:logseq.property/owner\"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",7]"}|} ));
          (fun request ->
            assert_equal ~name:"upsert page ops apply line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert page ops apply method"
              {|"method":"thread-api/apply-outliner-ops"|} request.body;
            assert_contains ~name:"upsert page ops set tag op"
              {|\"~:batch-set-property\"|} request.body;
            assert_contains ~name:"upsert page ops block uuid"
              {|~u22222222-2222-2222-2222-222222222222|} request.body;
            assert_contains ~name:"upsert page ops block tags"
              {|\"~:block/tags\"|} request.body;
            assert_contains ~name:"upsert page ops tag id" {|,6,|} request.body;
            assert_contains ~name:"upsert page ops owner ident"
              {|\"~:logseq.property/owner\"|} request.body;
            assert_contains ~name:"upsert page ops owner value" {|Alice|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "upsert";
                      "page";
                      "--id";
                      "4";
                      "--update-tags";
                      "[\"Project\"]";
                      "--update-properties";
                      "{:logseq.property/owner \"Alice\"}";
                    ]))
          in
          assert_int ~name:"upsert page ops exit" 0 output.exit_code;
          assert_equal ~name:"upsert page ops json"
            {|{"status":"ok","data":{"result":[4]}}|}
            (String.trim (cli_stdout output))));

  check "Cli.run applies upsert page tag and property removals" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"upsert page remove ops pull page line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert page remove ops pull page id" {|,4]|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",4,\"~:block/uuid\",\"~u22222222-2222-2222-2222-222222222222\",\"~:block/name\",\"home\",\"~:block/title\",\"Home\"]"}|}
            ));
          (fun request ->
            assert_equal ~name:"upsert page remove ops resolve tag line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert page remove ops resolve tag method"
              {|"method":"thread-api/q"|} request.body;
            assert_contains ~name:"upsert page remove ops resolve tag name"
              {|project|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[[\"^ \",\"~:db/id\",6,\"~:block/title\",\"Project\",\"~:block/name\",\"project\",\"~:block/tags\",[[\"^ \",\"~:db/ident\",\"~:logseq.class/Tag\"]]]]"}|}
            ));
          (fun request ->
            assert_equal ~name:"upsert page remove ops ensure property line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains
              ~name:"upsert page remove ops ensure property method"
              {|"method":"thread-api/pull"|} request.body;
            assert_contains ~name:"upsert page remove ops ensure property ident"
              {|\"~:logseq.property/owner\"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",7]"}|} ));
          (fun request ->
            assert_equal ~name:"upsert page remove ops apply line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert page remove ops delete tag op"
              {|\"~:batch-delete-property-value\"|} request.body;
            assert_contains ~name:"upsert page remove ops remove property op"
              {|\"~:batch-remove-property\"|} request.body;
            assert_contains ~name:"upsert page remove ops block uuid"
              {|~u22222222-2222-2222-2222-222222222222|} request.body;
            assert_contains ~name:"upsert page remove ops tag id" {|,6]|}
              request.body;
            assert_contains ~name:"upsert page remove ops property ident"
              {|\"~:logseq.property/owner\"|} request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"true"}|} ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "upsert";
                      "page";
                      "--id";
                      "4";
                      "--remove-tags";
                      "[\"Project\"]";
                      "--remove-properties";
                      "[:logseq.property/owner]";
                    ]))
          in
          assert_int ~name:"upsert page remove ops exit" 0 output.exit_code;
          assert_equal ~name:"upsert page remove ops json"
            {|{"status":"ok","data":{"result":[4]}}|}
            (String.trim (cli_stdout output))));

  check "Cli.run rejects upsert page id type mismatch" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      with_http_server_sequence
        [
          (fun request ->
            assert_equal ~name:"upsert page type mismatch pull line"
              "POST /v1/invoke HTTP/1.1" request.request_line;
            assert_contains ~name:"upsert page type mismatch pull id" {|,4]|}
              request.body;
            ( 200,
              [ ("Content-Type", "application/json") ],
              {|{"resultTransit":"[\"^ \",\"~:db/id\",4,\"~:block/title\",\"Block\"]"}|}
            ));
        ]
        (fun base_url ->
          let output =
            run_blocking
              (Cli.run app
                 (cli_input
                    ~env:[ ("LOGSEQ_CLI_BASE_URL", base_url) ]
                    [
                      "--graph";
                      "alpha";
                      "--output";
                      "json";
                      "upsert";
                      "page";
                      "--id";
                      "4";
                    ]))
          in
          assert_int ~name:"upsert page type mismatch exit" 1 output.exit_code;
          assert_equal ~name:"upsert page type mismatch json"
            {|{"status":"error","error":{"code":"upsert-id-type-mismatch","message":"id must be a node tagged with #Page"}}|}
            (String.trim (cli_stdout output))));

  check "Cli.run rejects upsert page without page name" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let output =
        run_blocking
          (Cli.run app
             (cli_input
                [ "--graph"; "alpha"; "--output"; "json"; "upsert"; "page" ]))
      in
      assert_int ~name:"upsert page missing name exit" 1 output.exit_code;
      assert_equal ~name:"upsert page missing name json"
        {|{"status":"error","error":{"code":"missing-page-name","message":"page name is required"}}|}
        (String.trim (cli_stdout output)));

  check "Cli.run rejects upsert page conflicting selectors" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let output =
        run_blocking
          (Cli.run app
             (cli_input
                [
                  "--graph";
                  "alpha";
                  "--output";
                  "json";
                  "upsert";
                  "page";
                  "--id";
                  "4";
                  "--page";
                  "Home";
                ]))
      in
      assert_int ~name:"upsert page selector conflict exit" 1 output.exit_code;
      assert_equal ~name:"upsert page selector conflict json"
        {|{"status":"error","error":{"code":"invalid-options","message":"only one of --id or --page is allowed"}}|}
        (String.trim (cli_stdout output)));

  check "Cli.run emits profile lines for group help" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let output =
        run_blocking (Cli.run app (cli_input [ "--profile"; "graph" ]))
      in
      assert_int ~name:"profile group help exit" 0 output.exit_code;
      assert_contains ~name:"profile group usage"
        "Usage: logseq graph <subcommand> [options]" (cli_stdout output);
      assert_contains ~name:"profile stderr status" "status=ok"
        (String.concat "\n" output.stderr));

  check "prints command help without executing the command" (fun () ->
      let app = Cli.make_app ~version:"test-version" () in
      let output =
        run_blocking (Cli.run app (cli_input [ "graph"; "list"; "--help" ]))
      in
      assert_int ~name:"command help exit" 0 output.exit_code;
      assert_contains ~name:"command usage" "Usage: logseq graph list [options]"
        (cli_stdout output);
      assert_not_contains ~name:"command help does not execute list" "Count:"
        (cli_stdout output));

  Alcotest.run "logseq cli" [ ("cli", List.rev !tests) ]
