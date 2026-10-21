let failures = ref 0

let check name condition =
  if condition then Printf.printf "ok - %s\n%!" name
  else (incr failures; Printf.printf "FAIL - %s\n%!" name)

let await task =
  let result = ref None in
  Db_worker_effect.on_any task
    (fun value -> result := Some (Ok value))
    (fun error -> result := Some (Error error));
  let deadline = Unix.gettimeofday () +. 10. in
  while !result = None && Unix.gettimeofday () < deadline do Thread.delay 0.001 done;
  match !result with
  | Some (Ok value) -> value
  | Some (Error error) -> raise error
  | None -> failwith "platform operation timed out"

let test name run =
  try run () with error -> check (name ^ ": " ^ Printexc.to_string error) false

let with_server ?(inspect_request = fun _ -> ()) ?(inspect_connection = fun _ -> ()) ~headers fragments run =
  let socket = Unix.socket Unix.PF_INET Unix.SOCK_STREAM 0 in
  Unix.bind socket (Unix.ADDR_INET (Unix.inet_addr_loopback, 0));
  Unix.listen socket 1;
  let port = match Unix.getsockname socket with Unix.ADDR_INET (_, port) -> port | _ -> assert false in
  let server = Thread.create (fun () ->
    try
      let ready, _, _ = Unix.select [socket] [] [] 2. in
      if ready <> [] then begin
        let client, _ = Unix.accept socket in
        Fun.protect ~finally:(fun () -> Unix.close client) (fun () ->
          let request = Bytes.create 4096 in
          let length = Unix.read client request 0 4096 in
          inspect_request (Bytes.sub_string request 0 length);
          inspect_connection client;
          let output = Unix.out_channel_of_descr (Unix.dup client) in
          Fun.protect ~finally:(fun () -> close_out_noerr output) (fun () ->
            output_string output ("HTTP/1.1 200 OK\r\nConnection: close\r\n" ^ headers ^ "\r\n");
            List.iter (fun (delay, fragment) -> Thread.delay delay; output_string output fragment; flush output) fragments))
      end
    with Unix.Unix_error _ | Sys_error _ -> ()) () in
  Fun.protect ~finally:(fun () -> Thread.join server; Unix.close socket)
    (fun () -> run ("http://127.0.0.1:" ^ string_of_int port ^ "/snapshot"))

let stream url = { Http_bytes.url; method_ = "GET"; headers = []; body = None }

let collect read =
  let output = Buffer.create 16 in
  let rec next () = Db_worker_effect.bind (read ()) (function
    | None -> Db_worker_effect.pure (Buffer.contents output)
    | Some chunk -> Buffer.add_string output chunk; next ()) in
  next ()

let () =
  test "file metadata" (fun () ->
    let path = Filename.temp_file "worker-stat-" ".png" in
    Fun.protect ~finally:(fun () -> Sys.remove path) (fun () ->
      Unix.utimes path 123. 456.;
      match await (File_sys.stat path) with
      | None -> check "native files expose metadata" false
      | Some metadata ->
          check "native file modification time preserves milliseconds"
            (Option.map Time.epoch_ms_to_int64 metadata.mtime_ms = Some 456000L);
          if Sys.os_type = "Win32" || Sys.file_exists "/System/Library/CoreServices/SystemVersion.plist" then
            check "native file creation time is available" (Option.is_some metadata.birthtime_ms));
    check "missing files have no metadata" (await (File_sys.stat path) = None));
  test "gzip" (fun () ->
    check "native gzip is supported" (Compression.supported ());
    List.iter (fun payload ->
      let encoded = await (Compression.gzip_encode payload) in
      check "gzip output has the standard header"
        (String.length encoded >= 18 && String.sub encoded 0 2 = "\x1f\x8b");
      check "gzip preserves binary content"
        (await (Compression.gzip_decode encoded) = payload);
      check "gzip rejects trailing garbage"
        (try ignore (await (Compression.gzip_decode (encoded ^ "garbage"))); false with _ -> true);
      let truncated = String.sub encoded 0 (String.length encoded - 1) in
      check "truncated gzip fails" (try ignore (await (Compression.gzip_decode truncated)); false with _ -> true))
      [ ""; String.init 262144 (fun i -> Char.chr (i mod 256)) ]);
  test "result transform regex split" (fun () ->
    List.iter (fun (expression, expected) ->
      let result = Edn_eval.apply_edn ~entity_attr:(fun _ _ -> Datascript.Nil)
          ("(fn [_] " ^ expression ^ ")") [] in
      check ("result transform " ^ expression)
        (result = Wire.Array (List.map (fun value -> Wire.String value) expected)))
      [ {expr|(clojure.string/split "a::b::" #"::")|expr}, [ "a"; "b" ]
      ; {expr|(clojure.string/split "a  b\tc" #"\s+")|expr}, [ "a"; "b"; "c" ]
      ; {expr|(clojure.string/split "a.b" #"\.")|expr}, [ "a"; "b" ]
      ; {expr|(clojure.string/split "a:b:c" #":" 2)|expr}, [ "a"; "b:c" ]
      ; {expr|(clojure.string/split "a::" #":" -1)|expr}, [ "a"; ""; "" ]
      ; {expr|(clojure.string/split "abc" #"")|expr}, [ ""; "a"; "b"; "c" ]
      ; {expr|(clojure.string/split "abc" #"" 2)|expr}, [""; "abc"]
      ; {expr|(clojure.string/split "abc" #"^." 3)|expr}, [""; ""; "c"]
      ; {expr|(clojure.string/split "中文" #"")|expr}, [""; "中"; "文"]
      ; {expr|(clojure.string/split "" #":")|expr}, [""]
      ; {expr|(clojure.string/split "a.b" ".")|expr}, ["a"; "b"]
      ; {expr|(clojure.string/split "😀x" #"x?" -1)|expr}, ["😀"; ""] ]);
  test "HTTP streaming" (fun () ->
    with_server ~headers:"Content-Length: 6\r\n" [0., "abc"; 0.4, "def"] (fun url ->
      let started = Unix.gettimeofday () in
      let output = await (Http_bytes.send_stream (stream url) (fun status _ read ->
        check "stream response status" (status = 200);
        Db_worker_effect.bind (read ()) (fun first ->
          check "first chunk arrives before the rest of the response"
            (first = Some "abc" && Unix.gettimeofday () -. started < 0.3);
          Db_worker_effect.map (fun rest -> Option.get first ^ rest) (collect read)))) in
      check "stream preserves all bytes" (output = "abcdef")));
  test "gzip HTTP streaming" (fun () ->
    let payload = String.init 262144 (fun i -> Char.chr (i mod 256)) in
    let encoded = await (Compression.gzip_encode payload) in
    with_server ~headers:(Printf.sprintf "Content-Encoding: gzip\r\nContent-Length: %d\r\n" (String.length encoded))
      [0., String.sub encoded 0 1; 0.02, String.sub encoded 1 (String.length encoded - 1)]
      (fun url ->
        check "stream decodes gzip with a fragmented header"
          (await (Http_bytes.send_stream (stream url) (fun _ _ read -> collect read)) = payload)));
  test "HTTP connection survives asynchronous response preparation" (fun () ->
    let premature_eof = ref false in
    with_server ~inspect_connection:(fun client ->
      let readable, _, _ = Unix.select [client] [] [] 0.05 in
      if readable <> [] then
        premature_eof := Unix.recv client (Bytes.create 1) 0 1 [Unix.MSG_PEEK] = 0)
      ~headers:"Content-Length: 3\r\n" [0., "abc"] (fun url ->
        ignore (await (Http.send {Http.url; method_ = "GET"; headers = []; body = None}));
        check "HTTP request does not send FIN before the response" (not !premature_eof)));
  test "chunked HTTP response" (fun () ->
    with_server ~headers:"Transfer-Encoding: chunked\r\n" [0., "3\r\nabc\r\n0\r\n\r\n"] (fun url ->
      let response = await (Http.send {Http.url; method_ = "GET"; headers = []; body = None}) in
      check "buffered HTTP reads chunked transfer encoding" (response.Http.body = "abc")));
  test "large buffered HTTP response" (fun () ->
    let payload = String.init 100000 (fun index -> Char.chr (index mod 256)) in
    with_server ~headers:(Printf.sprintf "Content-Length: %d\r\n" (String.length payload)) [0., payload]
      (fun url ->
        let response = await (Http.send {Http.url; method_ = "GET"; headers = []; body = None}) in
        check "buffered HTTP preserves bodies larger than its read buffer" (response.Http.body = payload)));
  test "HTTP Host authority" (fun () ->
    let request = ref "" in
    with_server ~inspect_request:(fun text -> request := text)
      ~headers:"Content-Length: 0\r\n" [] (fun url ->
        ignore (await (Http.send {Http.url; method_ = "GET"; headers = []; body = None}));
        let authority = List.nth (String.split_on_char '/' url) 2 in
        check "HTTP Host preserves non-default ports"
          (List.exists (fun line -> String.lowercase_ascii (String.trim line) = "host: " ^ authority)
            (String.split_on_char '\n' !request))));
  test "HTTP framing failure" (fun () ->
    with_server ~headers:"Content-Length: 6\r\n" [0., "abc"] (fun url ->
      check "incomplete HTTP response fails"
        (try ignore (await (Http.send {Http.url; method_ = "GET"; headers = []; body = None})); false with _ -> true)));
  test "stream early completion" (fun () ->
    with_server ~headers:"Content-Length: 6\r\n" [0., "abc"; 0.05, "def"] (fun url ->
      check "consumer can complete without draining the response"
        (await (Http_bytes.send_stream (stream url) (fun _ _ _ -> Db_worker_effect.pure "done")) = "done")));
  test "stream consumer error" (fun () ->
    with_server ~headers:"Content-Length: 3\r\n" [0., "abc"] (fun url ->
      check "stream preserves consumer errors"
        (try ignore (await (Http_bytes.send_stream (stream url) (fun _ _ _ -> Db_worker_effect.error (Failure "consumer")))); false
         with Failure message -> message = "consumer" | _ -> false)));
  test "stream reads from another thread" (fun () ->
    with_server ~headers:"Content-Length: 6\r\n" [0., "abc"; 0.03, "def"] (fun url ->
      let output = await (Http_bytes.send_stream (stream url) (fun _ _ read ->
        let task, resolver = Db_worker_effect.wait () in
        ignore (Thread.create (fun () ->
          try Db_worker_effect.wakeup resolver (await (collect read))
          with error -> Db_worker_effect.reject resolver error) ()); task)) in
      check "cross-thread pull preserves response bytes" (output = "abcdef")));
  test "already decoded HTTP stream" (fun () ->
    with_server ~headers:"Content-Encoding: gzip\r\nContent-Length: 3\r\n" [0., "abc"] (fun url ->
      check "raw body with stale gzip header passes through"
        (await (Http_bytes.send_stream (stream url) (fun _ _ read -> collect read)) = "abc")));
  if Sys.getenv_opt "LOGSEQ_TEST_NATIVE_VECTORS" = Some "1" then begin
    test "native embedding" (fun () ->
      let body = "{\"data\":[{\"index\":1,\"embedding\":[0,1]},{\"index\":0,\"embedding\":[1,0]}]}" in
      with_server ~headers:(Printf.sprintf "Content-Length: %d\r\n" (String.length body)) [0., body]
        (fun url ->
          Unix.putenv "LOGSEQ_EMBEDDINGS_URL" url;
          check "native embedding capability enabled" (Embedding.enabled ());
          check "embedding responses follow input order"
            (await (Embedding.embed_texts ["first"; "second"]) = [[|1.; 0.|]; [|0.; 1.|]])));
    test "native vector index" (fun () ->
      let path = Filename.temp_file "worker-vector-" "" in
      Sys.remove path;
      Fun.protect ~finally:(fun () -> ignore (await (File_sys.remove path))) (fun () ->
        match await (Vector_index.open_index ~path ~dimension:3) with
        | None -> check "native vector backend opens an index" false
        | Some index ->
          Fun.protect ~finally:(fun () -> Vector_index.close index) (fun () ->
            let docs = [
              { Vector_index.id = "one"; page = "页面"; embedding = [|1.; 0.; 0.|]; vector_title = Some "First" };
              { Vector_index.id = "two"; page = "other"; embedding = [|0.; 1.; 0.|]; vector_title = None }] in
            Vector_index.upsert index docs;
            let results = Vector_index.query index ~embedding:[|1.; 0.; 0.|] ~limit:2 ~page:None in
            check "vector search ranks and preserves fields"
              (match results with first :: _ -> first.Vector_index.id = "one" && first.page = Some "页面"
                && first.vector_title = Some "First" && abs_float (first.vector_score -. 1.) < 0.0001 | _ -> false);
            check "page-scoped vector search"
              (List.map (fun (item : Vector_index.query_result) -> item.id)
                (Vector_index.query index ~embedding:[|1.; 0.; 0.|] ~limit:2 ~page:(Some "other")) = ["two"]);
            Vector_index.delete index ["one"];
            check "vector delete persists"
              (List.length (Vector_index.query index ~embedding:[|1.; 0.; 0.|] ~limit:10 ~page:None) = 1);
            Worker_state.set_vector_index "platform-vector-test" index;
            Endpoint_lifecycle.close_db_aux "platform-vector-test";
            check "graph close drops its vector handle"
              (Worker_state.vector_index "platform-vector-test" = None);
            let reopened = Option.get (await (Vector_index.open_index ~path ~dimension:3)) in
            Fun.protect ~finally:(fun () -> Vector_index.close reopened) (fun () ->
              check "vector close releases locks and flushes data"
                (List.length (Vector_index.query reopened ~embedding:[|1.; 0.; 0.|] ~limit:10 ~page:None) = 1);
              Vector_index.truncate reopened;
              check "vector truncate recreates an empty index"
                (Vector_index.query reopened ~embedding:[|1.; 0.; 0.|] ~limit:10 ~page:None = [])))))
  end;
  if !failures <> 0 then exit 1
